import { computed, inject, Injectable, signal } from '@angular/core';

import { MedicationEntry } from '../../../core/models/medication-entry.model';
import { MEDICATION_ENTRY_REPOSITORY } from '../../../core/repositories/medication-entry.repository.token';
import { Repository } from '../../../core/repositories/repository.interface';

/** Store singleton gérant l'état des saisies médicaments via Signals. */
@Injectable({ providedIn: 'root' })
export class MedicationEntryStore {
  private readonly _repo = inject<Repository<MedicationEntry>>(MEDICATION_ENTRY_REPOSITORY);

  private readonly _entries = signal<MedicationEntry[]>([]);
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

  /** Noms de médicaments distincts tirés de l'historique (autocomplétion) */
  readonly recentMedicationNames = computed(() => {
    const names = new Set<string>();
    for (const entry of this._entries()) {
      for (const med of entry.medications) {
        names.add(med.name);
      }
    }
    return [...names];
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
      this._error.set($localize`:@@medicationStore.loadError:Erreur lors du chargement.`);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async add(entry: MedicationEntry): Promise<void> {
    const saved = await this._repo.save(entry);
    this._entries.update(list => [...list, saved]);
  }

  async update(entry: MedicationEntry): Promise<void> {
    const saved = await this._repo.save(entry);
    this._entries.update(list => list.map(e => (e.id === saved.id ? saved : e)));
  }

  async remove(id: string): Promise<void> {
    await this._repo.delete(id);
    this._entries.update(list => list.filter(e => e.id !== id));
  }
}
