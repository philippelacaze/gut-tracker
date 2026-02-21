import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Medication, MedicationEntry } from '../../core/models/medication-entry.model';
import { MedicationEntryCardComponent } from './components/medication-entry-card/medication-entry-card.component';
import { MedicationPickerComponent } from './components/medication-picker/medication-picker.component';
import { MedicationEntryStore } from './services/medication-entry.store';

@Component({
  selector: 'gt-medication-entry-page',
  standalone: true,
  imports: [MedicationPickerComponent, MedicationEntryCardComponent],
  templateUrl: './medication-entry.page.html',
  styleUrl: './medication-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationEntryPageComponent {
  // 3. Injections
  private readonly _store = inject(MedicationEntryStore);

  // 4. Signals locaux
  private readonly _pendingMedications = signal<Medication[]>([]);
  private readonly _saving = signal(false);

  readonly pendingMedications = this._pendingMedications.asReadonly();
  readonly saving = this._saving.asReadonly();

  // Signals depuis le store (exposés au template)
  readonly loading = this._store.loading;
  readonly todayEntries = this._store.todayEntries;

  // 5. Computed
  readonly canSave = computed(() => this._pendingMedications().length > 0);

  // 7. Méthodes publiques
  onMedicationAdded(medication: Medication): void {
    this._pendingMedications.update(list => [...list, medication]);
  }

  removePendingMedication(index: number): void {
    this._pendingMedications.update(list => list.filter((_, i) => i !== index));
  }

  async saveEntry(): Promise<void> {
    if (!this.canSave()) return;

    this._saving.set(true);
    try {
      const entry: MedicationEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        medications: this._pendingMedications(),
      };
      await this._store.add(entry);
      this._pendingMedications.set([]);
    } catch (err: unknown) {
      console.error('[MedicationEntryPage] Erreur lors de la sauvegarde', err);
    } finally {
      this._saving.set(false);
    }
  }
}
