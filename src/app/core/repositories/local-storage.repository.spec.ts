import { LocalStorageRepository } from './local-storage.repository';

interface TestEntity {
  id: string;
  name: string;
}

describe('LocalStorageRepository', () => {
  const KEY = 'test_entities';
  let repo: LocalStorageRepository<TestEntity>;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository<TestEntity>(KEY);
  });

  // ──────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('devrait retourner un tableau vide si la clé est absente', async () => {
      const result = await repo.findAll();

      expect(result).toEqual([]);
    });

    it('devrait retourner les entités précédemment sauvegardées', async () => {
      const entity: TestEntity = { id: '1', name: 'Premier' };
      await repo.save(entity);

      const result = await repo.findAll();

      expect(result).toEqual([entity]);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('save()', () => {
    it('devrait ajouter une nouvelle entité et la retourner', async () => {
      const entity: TestEntity = { id: '1', name: 'Nouveau' };

      const saved = await repo.save(entity);

      expect(saved).toEqual(entity);
      expect(await repo.findAll()).toHaveLength(1);
    });

    it('devrait mettre à jour une entité existante sans créer de doublon', async () => {
      await repo.save({ id: '1', name: 'Original' });

      await repo.save({ id: '1', name: 'Modifié' });

      const all = await repo.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('Modifié');
    });

    it('devrait conserver les autres entités lors d\'une mise à jour', async () => {
      await repo.save({ id: '1', name: 'A' });
      await repo.save({ id: '2', name: 'B' });

      await repo.save({ id: '1', name: 'A-Modifié' });

      expect(await repo.findAll()).toHaveLength(2);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('findById()', () => {
    it('devrait retourner null si l\'entité est introuvable', async () => {
      const result = await repo.findById('fantome');

      expect(result).toBeNull();
    });

    it('devrait retourner l\'entité correspondant à l\'id', async () => {
      const entity: TestEntity = { id: '42', name: 'Trouvé' };
      await repo.save(entity);

      const result = await repo.findById('42');

      expect(result).toEqual(entity);
    });

    it('devrait retourner null si la clé n\'existe pas encore', async () => {
      const result = await repo.findById('1');

      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('devrait supprimer l\'entité correspondant à l\'id', async () => {
      await repo.save({ id: '1', name: 'A' });
      await repo.save({ id: '2', name: 'B' });

      await repo.delete('1');

      const all = await repo.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('2');
    });

    it('ne devrait pas échouer si l\'id est inexistant', async () => {
      await expect(repo.delete('fantome')).resolves.toBeUndefined();
    });

    it('devrait ne rien supprimer si le stockage est vide', async () => {
      await repo.delete('1');

      expect(await repo.findAll()).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('isolation des clés de stockage', () => {
    it('devrait isoler les données entre deux instances avec des clés différentes', async () => {
      const repoA = new LocalStorageRepository<TestEntity>('cle_A');
      const repoB = new LocalStorageRepository<TestEntity>('cle_B');

      await repoA.save({ id: '1', name: 'Dans A' });

      expect(await repoA.findAll()).toHaveLength(1);
      expect(await repoB.findAll()).toHaveLength(0);
    });

    it('devrait partager les données entre deux instances avec la même clé', async () => {
      const repo1 = new LocalStorageRepository<TestEntity>(KEY);
      const repo2 = new LocalStorageRepository<TestEntity>(KEY);

      await repo1.save({ id: '1', name: 'Partagé' });

      expect(await repo2.findAll()).toHaveLength(1);
    });
  });
});
