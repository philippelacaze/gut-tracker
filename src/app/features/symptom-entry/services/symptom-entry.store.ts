import { computed, inject, Injectable, signal } from '@angular/core';

import { SymptomEntry } from '../../../core/models/symptom-entry.model';
import { SYMPTOM_ENTRY_REPOSITORY } from '../../../core/repositories/symptom-entry.repository.token';
import { Repository } from '../../../core/repositories/repository.interface';

/** Store singleton gérant l'état des saisies de symptômes via Signals. */
@Injectable({ providedIn: 'root' })
export class SymptomEntryStore {
  private readonly _repo = inject<Repository<SymptomEntry>>(SYMPTOM_ENTRY_REPOSITORY);

  private readonly _entries = signal<SymptomEntry[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Entrées du jour courant */
  readonly todayEntries = computed(() => {
    const today = new Date();
    return this._entries().filter(e => {
      const d = new Date(e.timestamp);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  });

  constructor() {
    this.loadAll();
  }

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const entries = await this._repo.findAll();
      this._entries.set(entries);
    } catch (err: unknown) {
      this._error.set($localize`:@@symptomStore.loadError:Erreur lors du chargement.`);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async add(entry: SymptomEntry): Promise<void> {
    const saved = await this._repo.save(entry);
    this._entries.update(list => [...list, saved]);
  }

  async update(entry: SymptomEntry): Promise<void> {
    const saved = await this._repo.save(entry);
    this._entries.update(list => list.map(e => (e.id === saved.id ? saved : e)));
  }

  async remove(id: string): Promise<void> {
    await this._repo.delete(id);
    this._entries.update(list => list.filter(e => e.id !== id));
  }
}
