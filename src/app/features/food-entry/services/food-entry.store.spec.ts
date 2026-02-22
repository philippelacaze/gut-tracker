import { TestBed } from '@angular/core/testing';

import { FoodEntry } from '../../../core/models/food-entry.model';
import { FOOD_ENTRY_REPOSITORY } from '../../../core/repositories/food-entry.repository.token';
import { Repository } from '../../../core/repositories/repository.interface';
import { makeFoodEntry, resetFoodEntryId } from '../../../../testing/food-entry.factory';
import { FoodEntryStore } from './food-entry.store';

describe('FoodEntryStore', () => {
  let store: FoodEntryStore;
  let mockRepo: {
    findAll: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    resetFoodEntryId();
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation((e: FoodEntry) => Promise.resolve(e)),
      findById: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        FoodEntryStore,
        { provide: FOOD_ENTRY_REPOSITORY, useValue: mockRepo as Repository<FoodEntry> },
      ],
    });

    store = TestBed.inject(FoodEntryStore);
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
      const entry = makeFoodEntry({ id: 'e1' });
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

    it('devrait stocker un message d\'erreur et propager l\'exception si le repository échoue', async () => {
      mockRepo.findAll.mockRejectedValue(new Error('DB indisponible'));

      await expect(store.loadAll()).rejects.toThrow('DB indisponible');
      expect(store.error()).toBeTruthy();
      expect(store.loading()).toBe(false);
    });

    it('devrait effacer l\'erreur précédente lors d\'un chargement réussi suivant', async () => {
      mockRepo.findAll.mockRejectedValueOnce(new Error('Panne'));
      await expect(store.loadAll()).rejects.toThrow();
      expect(store.error()).toBeTruthy();

      mockRepo.findAll.mockResolvedValue([]);
      await store.loadAll();

      expect(store.error()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('add()', () => {
    it('devrait ajouter une entrée et mettre à jour le signal', async () => {
      const entry = makeFoodEntry({ id: '1' });
      mockRepo.save.mockResolvedValue(entry);

      await store.add(entry);

      expect(store.entries()).toContainEqual(entry);
      expect(mockRepo.save).toHaveBeenCalledWith(entry);
    });

    it('devrait propager l\'erreur si le repository échoue', async () => {
      mockRepo.save.mockRejectedValue(new Error('Stockage plein'));

      await expect(store.add(makeFoodEntry())).rejects.toThrow('Stockage plein');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('devrait remplacer l\'entrée existante sans changer les autres', async () => {
      const original = makeFoodEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([original]);
      await store.loadAll();

      const updated = { ...original, notes: 'modifié' };
      mockRepo.save.mockResolvedValue(updated);

      await store.update(updated);

      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].notes).toBe('modifié');
    });

    it('devrait propager l\'erreur et conserver la liste inchangée si le repository échoue', async () => {
      const original = makeFoodEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([original]);
      await store.loadAll();

      mockRepo.save.mockRejectedValue(new Error('Stockage plein'));

      await expect(store.update({ ...original, notes: 'modifié' })).rejects.toThrow('Stockage plein');
      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].notes).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('devrait supprimer l\'entrée correspondante de la liste', async () => {
      const entry = makeFoodEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([entry]);
      await store.loadAll();

      await store.remove('1');

      expect(store.entries().find(e => e.id === '1')).toBeUndefined();
      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('devrait conserver les autres entrées après suppression', async () => {
      const e1 = makeFoodEntry({ id: '1' });
      const e2 = makeFoodEntry({ id: '2' });
      mockRepo.findAll.mockResolvedValue([e1, e2]);
      await store.loadAll();

      await store.remove('1');

      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0].id).toBe('2');
    });

    it('devrait propager l\'erreur et conserver l\'entrée si le repository échoue', async () => {
      const entry = makeFoodEntry({ id: '1' });
      mockRepo.findAll.mockResolvedValue([entry]);
      await store.loadAll();

      mockRepo.delete.mockRejectedValue(new Error('Erreur suppression'));

      await expect(store.remove('1')).rejects.toThrow('Erreur suppression');
      expect(store.entries()).toHaveLength(1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('todayEntries (computed)', () => {
    it('devrait ne retourner que les entrées du jour courant', async () => {
      const today = makeFoodEntry({ timestamp: new Date().toISOString() });
      const old = makeFoodEntry({ timestamp: '2020-01-01T10:00:00.000Z' });
      mockRepo.findAll.mockResolvedValue([today, old]);

      await store.loadAll();

      expect(store.todayEntries()).toEqual([today]);
      expect(store.todayEntries()).not.toContainEqual(old);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('frequentFoods (computed)', () => {
    it('devrait retourner les aliments apparus dans au moins 3 saisies', async () => {
      const makeEntry = (foodName: string) =>
        makeFoodEntry({ foods: [{ id: 'f1', name: foodName, fodmapScore: null }] });

      mockRepo.findAll.mockResolvedValue([
        makeEntry('Poulet'),
        makeEntry('Poulet'),
        makeEntry('Poulet'),
        makeEntry('Pain'),
        makeEntry('Pain'),
      ]);
      await store.loadAll();

      expect(store.frequentFoods()).toContain('Poulet');
      expect(store.frequentFoods()).not.toContain('Pain');
    });

    it('devrait retourner un tableau vide si aucun aliment n\'est récurrent', async () => {
      mockRepo.findAll.mockResolvedValue([
        makeFoodEntry({ foods: [{ id: 'f1', name: 'Brocoli', fodmapScore: null }] }),
      ]);
      await store.loadAll();

      expect(store.frequentFoods()).toEqual([]);
    });

    it('devrait inclure un aliment apparu exactement 3 fois (valeur limite)', async () => {
      const makeEntry = (foodName: string) =>
        makeFoodEntry({ foods: [{ id: 'f1', name: foodName, fodmapScore: null }] });

      mockRepo.findAll.mockResolvedValue([
        makeEntry('Riz'),
        makeEntry('Riz'),
        makeEntry('Riz'),
      ]);
      await store.loadAll();

      expect(store.frequentFoods()).toContain('Riz');
    });
  });
});
