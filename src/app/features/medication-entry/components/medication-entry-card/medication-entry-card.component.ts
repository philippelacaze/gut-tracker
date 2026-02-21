import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { MedicationEntry, MedicationType } from '../../../../core/models/medication-entry.model';
import { MedicationEntryStore } from '../../services/medication-entry.store';

/** Labels traduits pour chaque type de médicament */
const MEDICATION_TYPE_LABELS: Record<MedicationType, string> = {
  enzyme: $localize`:@@medicationType.enzyme:Enzyme digestive`,
  probiotic: $localize`:@@medicationType.probiotic:Probiotique`,
  antibiotic: $localize`:@@medicationType.antibiotic:Antibiotique`,
  antispasmodic: $localize`:@@medicationType.antispasmodic:Antispasmodique`,
  other: $localize`:@@medicationType.other:Autre`,
};

@Component({
  selector: 'gt-medication-entry-card',
  standalone: true,
  templateUrl: './medication-entry-card.component.html',
  styleUrl: './medication-entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationEntryCardComponent {
  // 1. Inputs
  readonly entry = input.required<MedicationEntry>();

  // 2. Outputs
  readonly deleted = output<string>();

  // 3. Injections
  private readonly _store = inject(MedicationEntryStore);

  // 5. Computed
  readonly timeLabel = computed(() =>
    new Date(this.entry().timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  // 7. Méthodes publiques
  /** Retourne le label traduit d'un type de médicament */
  typeLabel(type: MedicationType): string {
    return MEDICATION_TYPE_LABELS[type];
  }

  async onDelete(): Promise<void> {
    try {
      await this._store.remove(this.entry().id);
      this.deleted.emit(this.entry().id);
    } catch (err: unknown) {
      console.error('[MedicationEntryCard] Erreur lors de la suppression', err);
    }
  }
}
