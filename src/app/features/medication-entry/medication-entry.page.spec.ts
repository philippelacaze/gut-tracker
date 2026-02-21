import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { MedicationEntry } from '../../core/models/medication-entry.model';
import {
  makeMedicationEntry,
  resetMedicationEntryId,
} from '../../../testing/medication-entry.factory';
import { MedicationEntryStore } from './services/medication-entry.store';
import { MedicationEntryPageComponent } from './medication-entry.page';

describe('MedicationEntryPageComponent', () => {
  let fixture: ComponentFixture<MedicationEntryPageComponent>;
  let component: MedicationEntryPageComponent;
  let mockAdd: ReturnType<typeof vi.fn>;

  const buildMockStore = (entries: MedicationEntry[] = []) => ({
    loading: signal(false).asReadonly(),
    todayEntries: signal(entries).asReadonly(),
    recentMedicationNames: signal<string[]>([]).asReadonly(),
    entries: signal<MedicationEntry[]>([]).asReadonly(),
    add: (mockAdd = vi.fn().mockResolvedValue(undefined)),
    remove: vi.fn().mockResolvedValue(undefined),
  });

  async function setup(todayEntries: MedicationEntry[] = []): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MedicationEntryPageComponent],
      providers: [
        { provide: MedicationEntryStore, useValue: buildMockStore(todayEntries) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationEntryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => resetMedicationEntryId());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher le titre de la page', async () => {
      await setup();
      const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
      expect(h1).toBeTruthy();
    });

    it('devrait masquer le bouton Enregistrer si la liste pending est vide', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('.medication-entry-page__save-btn')).toBeNull();
    });

    it("devrait afficher le message vide si aucune entrée aujourd'hui", async () => {
      await setup([]);
      const empty = fixture.nativeElement.querySelector('.medication-entry-page__empty');
      expect(empty).toBeTruthy();
    });

    it("devrait afficher les cartes pour les entrées du jour", async () => {
      const entries = [
        makeMedicationEntry({
          medications: [{ name: 'Lactase', type: 'enzyme' }],
        }),
      ];
      await setup(entries);

      const cards = fixture.nativeElement.querySelectorAll('gt-medication-entry-card');
      expect(cards.length).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('liste pending', () => {
    it('devrait ajouter un médicament à la liste pending', async () => {
      await setup();

      component.onMedicationAdded({ name: 'Imodium', type: 'antispasmodic' });
      fixture.detectChanges();

      expect(component.pendingMedications()).toHaveLength(1);
      expect(component.pendingMedications()[0].name).toBe('Imodium');
    });

    it('devrait afficher la liste pending après ajout', async () => {
      await setup();
      component.onMedicationAdded({ name: 'Lactase', type: 'enzyme', dose: '2 cp' });
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.medication-entry-page__pending-item');
      expect(items.length).toBe(1);
    });

    it('devrait supprimer un médicament de la liste pending par index', async () => {
      await setup();
      component.onMedicationAdded({ name: 'Lactase', type: 'enzyme' });
      component.onMedicationAdded({ name: 'Bifidus', type: 'probiotic' });

      component.removePendingMedication(0);

      expect(component.pendingMedications()).toHaveLength(1);
      expect(component.pendingMedications()[0].name).toBe('Bifidus');
    });

    it("devrait rendre canSave vrai quand des médicaments sont en attente", async () => {
      await setup();
      expect(component.canSave()).toBe(false);

      component.onMedicationAdded({ name: 'Lactase', type: 'enzyme' });
      expect(component.canSave()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('saveEntry()', () => {
    it('devrait appeler store.add avec une MedicationEntry et vider la liste pending', async () => {
      await setup();
      component.onMedicationAdded({ name: 'Imodium', type: 'antispasmodic', dose: '1 cp' });
      fixture.detectChanges();

      await component.saveEntry();

      expect(mockAdd).toHaveBeenCalledOnce();
      const saved = mockAdd.mock.calls[0][0] as MedicationEntry;
      expect(saved.medications).toHaveLength(1);
      expect(saved.medications[0].name).toBe('Imodium');
      expect(component.pendingMedications()).toHaveLength(0);
    });

    it('ne devrait pas appeler store.add si la liste pending est vide', async () => {
      await setup();
      await component.saveEntry();
      expect(mockAdd).not.toHaveBeenCalled();
    });
  });
});
