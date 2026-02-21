import { TestBed } from '@angular/core/testing';

import { MedicationEntry } from '../../../core/models/medication-entry.model';
import { MEDICATION_ENTRY_REPOSITORY } from '../../../core/repositories/medication-entry.repository.token';
import { Repository } from '../../../core/repositories/repository.interface';
import {
  makeMedicationEntry,
  resetMedicationEntryId,
} from '../../../../testing/medication-entry.factory';
import { MedicationEntryStore } from './medication-entry.store';

describe('MedicationEntryStore', () => {
  let store: MedicationEntryStore;
  let mockRepo: {
    findAll: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    resetMedicationEntryId();
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation((e: MedicationEntry) => Promise.resolve(e)),
      findById: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        MedicationEntryStore,
        {
          provide: MEDICATION_ENTRY_REPOSITORY,
          useValue: mockRepo as Repository<MedicationEntry>,
        },
      ],
    });

    store = TestBed.inject(MedicationEntryStore);
  });

  // ──────────────────────────────────────────────────────────────
  describe('état initial', () => {
    it('devrait avoir une liste vide et loading à false après chargement initial', async () => {
      await store.loadAll();

      expect(store.entries()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('loadAll()', () => {
    it('devrait charger toutes les entrées depuis le repository', async () => {
      const entry = makeMedicationEntry({ id: 'e1' });
      mockRepo.findAll.mockResolvedValue([entry]);

      await store.loadAll();

      expect(store.entries()).toEqual([entry]);
    });

    it('devrait passer loading à true puis false autour du chargement', async () => {
      let loadingDuringFetch = false;
      mockRepo.findAll.mockImplementation(() => {
        loadingDuringFetch = store.loading();
        return Promise.resolve([]);
      });

      await store.loadAll();

      expect(loadingDuringFetch).toBe(true);
      expect(store.loading()).toBe(false);
    });

    it("devrait stocker un message d'erreur et propager l'exception si le repository échoue", async () => {
      mockRepo.findAll.mockRejectedValue(new Error('DB indisponible'));

      await expect(store.loadAll()).rejects.toThrow('DB indisponible');
      expect(store.error()).toBeTruthy();
      expect(store.loading()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('add()', () => {
    it('devrait ajouter une entrée et mettre à jour le signal', async () => {
      const entry = makeMedicationEntry({ id: '1' });
      mockRepo.save.mockResolvedValue(entry);

      await store.add(entry);

      expect(store.entries()).toContainEqual(entry);
      expect(mockRepo.save).toHaveBeenCalledWith(entry);
    });

    it('devrait propager l\'erreur si le repository échoue', async () => {
      mockRepo.save.mockRejectedValue(new Error('Stockage plein'));

      await expect(store.add(makeMedicationEntry())).rejects.toThrow('Stockage plein');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('update()', () => {
    it("devrait remplacer l'entrée existante sans changer les autres", async () => {
      const original = makeMedicationEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([original]);
      await store.loadAll();

      const updated: MedicationEntry = {
        ...original,
        medications: [{ name: 'Imodium', type: 'antispasmodic', dose: '1 cp' }],
      };
      mockRepo.save.mockResolvedValue(updated);

      await store.update(updated);

      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].medications[0].name).toBe('Imodium');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it("devrait supprimer l'entrée correspondante de la liste", async () => {
      const entry = makeMedicationEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([entry]);
      await store.loadAll();

      await store.remove('1');

      expect(store.entries().find(e => e.id === '1')).toBeUndefined();
      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('devrait conserver les autres entrées après suppression', async () => {
      const e1 = makeMedicationEntry({ id: '1' });
      const e2 = makeMedicationEntry({ id: '2' });
      mockRepo.findAll.mockResolvedValue([e1, e2]);
      await store.loadAll();

      await store.remove('1');

      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].id).toBe('2');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('todayEntries (computed)', () => {
    it("devrait ne retourner que les entrées du jour courant", async () => {
      const today = makeMedicationEntry({ timestamp: new Date().toISOString() });
      const old = makeMedicationEntry({ timestamp: '2020-01-01T10:00:00.000Z' });
      mockRepo.findAll.mockResolvedValue([today, old]);

      await store.loadAll();

      expect(store.todayEntries()).toEqual([today]);
      expect(store.todayEntries()).not.toContainEqual(old);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('recentMedicationNames (computed)', () => {
    it("devrait retourner les noms distincts de médicaments de l'historique", async () => {
      mockRepo.findAll.mockResolvedValue([
        makeMedicationEntry({
          medications: [
            { name: 'Lactase', type: 'enzyme' },
            { name: 'Imodium', type: 'antispasmodic' },
          ],
        }),
        makeMedicationEntry({
          medications: [{ name: 'Lactase', type: 'enzyme' }],
        }),
      ]);
      await store.loadAll();

      const names = store.recentMedicationNames();
      expect(names).toContain('Lactase');
      expect(names).toContain('Imodium');
      // Lactase ne doit apparaître qu'une fois (Set)
      expect(names.filter(n => n === 'Lactase')).toHaveLength(1);
    });

    it('devrait retourner un tableau vide si aucune saisie', async () => {
      await store.loadAll();

      expect(store.recentMedicationNames()).toEqual([]);
    });
  });
});
