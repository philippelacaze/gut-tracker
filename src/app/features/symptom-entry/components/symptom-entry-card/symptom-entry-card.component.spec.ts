import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { SymptomEntry } from '../../../../core/models/symptom-entry.model';
import {
  makeSymptomEntry,
  resetSymptomEntryId,
} from '../../../../../testing/symptom-entry.factory';
import { SymptomEntryStore } from '../../services/symptom-entry.store';
import { SymptomEntryCardComponent } from './symptom-entry-card.component';

describe('SymptomEntryCardComponent', () => {
  let fixture: ComponentFixture<SymptomEntryCardComponent>;
  let component: SymptomEntryCardComponent;
  let mockRemove: ReturnType<typeof vi.fn>;

  async function setup(entry: SymptomEntry): Promise<void> {
    mockRemove = vi.fn().mockResolvedValue(undefined);

    const mockStore = {
      remove: mockRemove,
      entries: signal<SymptomEntry[]>([]).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [SymptomEntryCardComponent],
      providers: [{ provide: SymptomEntryStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(SymptomEntryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', entry);
    fixture.detectChanges();
  }

  beforeEach(() => resetSymptomEntryId());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup(makeSymptomEntry());
      expect(component).toBeTruthy();
    });

    it("devrait afficher l'heure formatée", async () => {
      const timestamp = '2024-06-15T12:30:00.000Z';
      await setup(makeSymptomEntry({ timestamp }));
      const time = fixture.nativeElement.querySelector('.symptom-card__time') as HTMLTimeElement;
      expect(time.getAttribute('datetime')).toBe(timestamp);
    });

    it('devrait afficher chaque symptôme', async () => {
      const entry = makeSymptomEntry({
        symptoms: [
          { type: 'pain', severity: 7 },
          { type: 'bloating', severity: 4 },
        ],
      });
      await setup(entry);

      const items = fixture.nativeElement.querySelectorAll('.symptom-card__item');
      expect(items.length).toBe(2);
    });

    it('devrait afficher la sévérité avec la classe correcte pour un niveau élevé', async () => {
      const entry = makeSymptomEntry({ symptoms: [{ type: 'pain', severity: 8 }] });
      await setup(entry);

      const severity = fixture.nativeElement.querySelector('.symptom-card__severity') as HTMLElement;
      expect(severity.classList).toContain('symptom-card__severity--high');
      expect(severity.textContent?.trim()).toBe('8/10');
    });

    it('devrait afficher la localisation si présente (label traduit)', async () => {
      const entry = makeSymptomEntry({
        symptoms: [{ type: 'pain', severity: 6, location: { x: 50, y: 50, region: 'abdomen-left' } }],
      });
      await setup(entry);

      const location = fixture.nativeElement.querySelector('.symptom-card__location') as HTMLElement;
      expect(location.textContent).toContain('Abdomen gauche');
    });

    it('devrait afficher la note si présente', async () => {
      const entry = makeSymptomEntry({
        symptoms: [{ type: 'other', severity: 3, note: 'après le repas' }],
      });
      await setup(entry);

      const note = fixture.nativeElement.querySelector('.symptom-card__note') as HTMLElement;
      expect(note.textContent?.trim()).toBe('après le repas');
    });

    it('devrait afficher le message vide si la liste de symptômes est vide', async () => {
      await setup(makeSymptomEntry({ symptoms: [] }));
      expect(fixture.nativeElement.querySelector('.symptom-card__empty')).toBeTruthy();
    });

    it('devrait afficher le score Bristol si bristolScale est renseigné', async () => {
      const entry = makeSymptomEntry({
        symptoms: [{ type: 'stool', severity: 5, bristolScale: 4 }],
      });
      await setup(entry);
      const bristol = fixture.nativeElement.querySelector('.symptom-card__bristol') as HTMLElement;
      expect(bristol).toBeTruthy();
      expect(bristol.textContent).toContain('4');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('suppression', () => {
    it("devrait appeler store.remove avec l'id de l'entrée", async () => {
      const entry = makeSymptomEntry({ id: 'sym-42' });
      await setup(entry);

      fixture.nativeElement.querySelector('.symptom-card__delete-btn').click();

      await vi.waitFor(() => expect(mockRemove).toHaveBeenCalledWith('sym-42'));
    });

    it("devrait émettre deleted avec l'id après suppression", async () => {
      const entry = makeSymptomEntry({ id: 'sym-10' });
      await setup(entry);

      const deletedIds: string[] = [];
      const sub = component.deleted.subscribe((id: string) => deletedIds.push(id));

      fixture.nativeElement.querySelector('.symptom-card__delete-btn').click();
      await vi.waitFor(() => expect(deletedIds).toContain('sym-10'));

      sub.unsubscribe();
    });
  });
});
