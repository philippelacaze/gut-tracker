/**
 * Interface générique pour découpler la persistance des services métier.
 * Toute implémentation (LocalStorage, API REST, IndexedDB…) doit respecter ce contrat.
 */
export interface Repository<T extends { id: string }> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
