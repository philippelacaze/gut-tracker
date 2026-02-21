import { Repository } from './repository.interface';

/**
 * Implémentation du Repository pattern via localStorage.
 * Chaque instance est liée à une clé de stockage distincte (isolation totale).
 */
export class LocalStorageRepository<T extends { id: string }> implements Repository<T> {
  constructor(private readonly storageKey: string) {}

  async findAll(): Promise<T[]> {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? (JSON.parse(raw) as T[]) : [];
  }

  async save(entity: T): Promise<T> {
    const all = await this.findAll();
    const idx = all.findIndex(e => e.id === entity.id);
    // Mise à jour si existant, ajout sinon
    idx >= 0 ? (all[idx] = entity) : all.push(entity);
    localStorage.setItem(this.storageKey, JSON.stringify(all));
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const all = await this.findAll();
    return all.find(e => e.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    const all = await this.findAll();
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(all.filter(e => e.id !== id))
    );
  }
}
