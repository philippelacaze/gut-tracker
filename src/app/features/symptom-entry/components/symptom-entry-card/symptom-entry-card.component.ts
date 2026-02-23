import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { BristolScale, SymptomEntry, SymptomType } from '../../../../core/models/symptom-entry.model';
import { SymptomEntryStore } from '../../services/symptom-entry.store';

const SYMPTOM_TYPE_LABELS: Record<SymptomType, string> = {
  pain: $localize`:@@symptomType.pain:Douleur`,
  bloating: $localize`:@@symptomType.bloating:Ballonnements`,
  gas: $localize`:@@symptomType.gas:Gaz`,
  belching: $localize`:@@symptomType.belching:Éructations`,
  stool: $localize`:@@symptomType.stool:Selles`,
  headache: $localize`:@@symptomType.headache:Maux de tête`,
  other: $localize`:@@symptomType.other:Autre`,
};

const SYMPTOM_TYPE_ICONS: Record<SymptomType, string> = {
  pain: '🤕', bloating: '🫃', gas: '💨', belching: '😮‍💨',
  stool: '🚽', headache: '🤯', other: '❓',
};

const BRISTOL_LABELS: Record<BristolScale, string> = {
  1: $localize`:@@bristolScale.1:Très dur`,
  2: $localize`:@@bristolScale.2:Grumeleuse`,
  3: $localize`:@@bristolScale.3:Craquelée`,
  4: $localize`:@@bristolScale.4:Lisse`,
  5: $localize`:@@bristolScale.5:Morceaux mous`,
  6: $localize`:@@bristolScale.6:Pâteuse`,
  7: $localize`:@@bristolScale.7:Liquide`,
};

@Component({
  selector: 'gt-symptom-entry-card',
  standalone: true,
  templateUrl: './symptom-entry-card.component.html',
  styleUrl: './symptom-entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomEntryCardComponent {
  // 1. Inputs
  readonly entry = input.required<SymptomEntry>();

  // 2. Outputs
  readonly deleted = output<string>();

  // 3. Injections
  private readonly _store = inject(SymptomEntryStore);

  // 5. Computed
  readonly timeLabel = computed(() =>
    new Date(this.entry().timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  // 7. Méthodes publiques
  typeLabel(type: SymptomType): string {
    return SYMPTOM_TYPE_LABELS[type];
  }

  typeIcon(type: SymptomType): string {
    return SYMPTOM_TYPE_ICONS[type];
  }

  bristolLabel(scale: BristolScale): string {
    return `Bristol ${scale} – ${BRISTOL_LABELS[scale]}`;
  }

  async onDelete(): Promise<void> {
    try {
      await this._store.remove(this.entry().id);
      this.deleted.emit(this.entry().id);
    } catch (err: unknown) {
      console.error('[SymptomEntryCard] Erreur lors de la suppression', err);
    }
  }
}
