import { TestBed } from '@angular/core/testing';

import { SymptomEntry } from '../../../core/models/symptom-entry.model';
import { SYMPTOM_ENTRY_REPOSITORY } from '../../../core/repositories/symptom-entry.repository.token';
import { Repository } from '../../../core/repositories/repository.interface';
import {
  makeSymptomEntry,
  resetSymptomEntryId,
} from '../../../../testing/symptom-entry.factory';
import { SymptomEntryStore } from './symptom-entry.store';

describe('SymptomEntryStore', () => {
  let store: SymptomEntryStore;
  let mockRepo: {
    findAll: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    resetSymptomEntryId();
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation((e: SymptomEntry) => Promise.resolve(e)),
      findById: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        SymptomEntryStore,
        {
          provide: SYMPTOM_ENTRY_REPOSITORY,
          useValue: mockRepo as Repository<SymptomEntry>,
        },
      ],
    });

    store = TestBed.inject(SymptomEntryStore);
  });

  // ──────────────────────────────────────────────────────────────
  describe('état initial', () => {
    it('devrait avoir une liste vide et loading à false après chargement', async () => {
      await store.loadAll();
      expect(store.entries()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('loadAll()', () => {
    it('devrait charger toutes les entrées depuis le repository', async () => {
      const entry = makeSymptomEntry({ id: 'e1' });
      mockRepo.findAll.mockResolvedValue([entry]);

      await store.loadAll();

      expect(store.entries()).toEqual([entry]);
    });

    it('devrait passer loading à true pendant le chargement', async () => {
      let loadingDuringFetch = false;
      mockRepo.findAll.mockImplementation(() => {
        loadingDuringFetch = store.loading();
        return Promise.resolve([]);
      });

      await store.loadAll();

      expect(loadingDuringFetch).toBe(true);
      expect(store.loading()).toBe(false);
    });

    it("devrait stocker un message d'erreur si le repository échoue", async () => {
      mockRepo.findAll.mockRejectedValue(new Error('DB indisponible'));

      await expect(store.loadAll()).rejects.toThrow('DB indisponible');
      expect(store.error()).toBeTruthy();
      expect(store.loading()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('add()', () => {
    it('devrait ajouter une entrée et mettre à jour le signal', async () => {
      const entry = makeSymptomEntry({ id: '1' });
      mockRepo.save.mockResolvedValue(entry);

      await store.add(entry);

      expect(store.entries()).toContainEqual(entry);
      expect(mockRepo.save).toHaveBeenCalledWith(entry);
    });

    it("devrait propager l'erreur si le repository échoue", async () => {
      mockRepo.save.mockRejectedValue(new Error('Stockage plein'));

      await expect(store.add(makeSymptomEntry())).rejects.toThrow('Stockage plein');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('update()', () => {
    it("devrait remplacer l'entrée existante", async () => {
      const original = makeSymptomEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([original]);
      await store.loadAll();

      const updated: SymptomEntry = {
        ...original,
        symptoms: [{ type: 'bloating', severity: 6 }],
      };
      mockRepo.save.mockResolvedValue(updated);

      await store.update(updated);

      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].symptoms[0].type).toBe('bloating');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it("devrait supprimer l'entrée correspondante", async () => {
      const e1 = makeSymptomEntry({ id: '1' });
      const e2 = makeSymptomEntry({ id: '2' });
      mockRepo.findAll.mockResolvedValue([e1, e2]);
      await store.loadAll();

      await store.remove('1');

      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].id).toBe('2');
      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('todayEntries (computed)', () => {
    it("devrait ne retourner que les entrées du jour courant", async () => {
      const today = makeSymptomEntry({ timestamp: new Date().toISOString() });
      const old = makeSymptomEntry({ timestamp: '2020-01-01T10:00:00.000Z' });
      mockRepo.findAll.mockResolvedValue([today, old]);

      await store.loadAll();

      expect(store.todayEntries()).toEqual([today]);
      expect(store.todayEntries()).not.toContainEqual(old);
    });
  });
});
