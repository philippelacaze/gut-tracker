import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { MedicationEntry } from '../../../../core/models/medication-entry.model';
import {
  makeMedicationEntry,
  resetMedicationEntryId,
} from '../../../../../testing/medication-entry.factory';
import { MedicationEntryStore } from '../../services/medication-entry.store';
import { MedicationEntryCardComponent } from './medication-entry-card.component';

describe('MedicationEntryCardComponent', () => {
  let fixture: ComponentFixture<MedicationEntryCardComponent>;
  let component: MedicationEntryCardComponent;
  let mockRemove: ReturnType<typeof vi.fn>;

  async function setup(entry: MedicationEntry): Promise<void> {
    mockRemove = vi.fn().mockResolvedValue(undefined);

    const mockStore = {
      remove: mockRemove,
      entries: signal<MedicationEntry[]>([]).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [MedicationEntryCardComponent],
      providers: [{ provide: MedicationEntryStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationEntryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', entry);
    fixture.detectChanges();
  }

  beforeEach(() => resetMedicationEntryId());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup(makeMedicationEntry());
      expect(component).toBeTruthy();
    });

    it("devrait afficher l'heure formatée", async () => {
      const timestamp = '2024-06-15T12:30:00.000Z';
      await setup(makeMedicationEntry({ timestamp }));
      const time = fixture.nativeElement.querySelector('.medication-card__time') as HTMLTimeElement;
      expect(time.getAttribute('datetime')).toBe(timestamp);
      expect(time.textContent?.trim()).toBeTruthy();
    });

    it('devrait afficher chaque médicament de la liste', async () => {
      const entry = makeMedicationEntry({
        medications: [
          { name: 'Lactase', type: 'enzyme', dose: '2 cp' },
          { name: 'Bifidus', type: 'probiotic' },
        ],
      });
      await setup(entry);

      const items = fixture.nativeElement.querySelectorAll('.medication-card__item');
      expect(items.length).toBe(2);
    });

    it('devrait afficher la dose si renseignée', async () => {
      const entry = makeMedicationEntry({
        medications: [{ name: 'Imodium', type: 'antispasmodic', dose: '1 cp' }],
      });
      await setup(entry);

      const dose = fixture.nativeElement.querySelector('.medication-card__dose') as HTMLElement;
      expect(dose.textContent?.trim()).toBe('1 cp');
    });

    it('ne devrait pas afficher le champ dose si absent', async () => {
      const entry = makeMedicationEntry({
        medications: [{ name: 'Lactase', type: 'enzyme' }],
      });
      await setup(entry);

      expect(fixture.nativeElement.querySelector('.medication-card__dose')).toBeNull();
    });

    it('devrait appliquer la classe de type correcte sur le badge', async () => {
      const entry = makeMedicationEntry({
        medications: [{ name: 'Lactase', type: 'enzyme' }],
      });
      await setup(entry);

      const typeBadge = fixture.nativeElement.querySelector('.medication-card__type') as HTMLElement;
      expect(typeBadge.classList).toContain('medication-card__type--enzyme');
    });

    it("devrait afficher le message vide si medications est vide", async () => {
      await setup(makeMedicationEntry({ medications: [] }));
      const empty = fixture.nativeElement.querySelector('.medication-card__empty');
      expect(empty).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('suppression', () => {
    it("devrait appeler store.remove avec l'id de l'entrée", async () => {
      const entry = makeMedicationEntry({ id: 'med-42' });
      await setup(entry);

      fixture.nativeElement.querySelector('.medication-card__delete-btn').click();

      await vi.waitFor(() => expect(mockRemove).toHaveBeenCalledWith('med-42'));
    });

    it("devrait émettre l'output deleted avec l'id après suppression", async () => {
      const entry = makeMedicationEntry({ id: 'med-10' });
      await setup(entry);

      const deletedIds: string[] = [];
      const sub = component.deleted.subscribe((id: string) => deletedIds.push(id));

      fixture.nativeElement.querySelector('.medication-card__delete-btn').click();
      await vi.waitFor(() => expect(deletedIds).toContain('med-10'));

      sub.unsubscribe();
    });
  });
});
