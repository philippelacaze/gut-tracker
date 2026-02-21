import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { SymptomType } from '../../../../core/models/symptom-entry.model';

interface SymptomTypeOption {
  value: SymptomType;
  label: string;
  icon: string;
}

@Component({
  selector: 'gt-symptom-type-picker',
  standalone: true,
  templateUrl: './symptom-type-picker.component.html',
  styleUrl: './symptom-type-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomTypePickerComponent {
  /** Type de symptôme sélectionné — liaison bidirectionnelle via model() */
  readonly selected = model.required<SymptomType>();

  readonly symptomTypes: SymptomTypeOption[] = [
    { value: 'pain', label: $localize`:@@symptomType.pain:Douleur`, icon: '🤕' },
    { value: 'bloating', label: $localize`:@@symptomType.bloating:Ballonnements`, icon: '🫃' },
    { value: 'gas', label: $localize`:@@symptomType.gas:Gaz`, icon: '💨' },
    { value: 'belching', label: $localize`:@@symptomType.belching:Éructations`, icon: '😮‍💨' },
    { value: 'constipation', label: $localize`:@@symptomType.constipation:Constipation`, icon: '😤' },
    { value: 'diarrhea', label: $localize`:@@symptomType.diarrhea:Diarrhée`, icon: '🚽' },
    { value: 'headache', label: $localize`:@@symptomType.headache:Maux de tête`, icon: '🤯' },
    { value: 'other', label: $localize`:@@symptomType.other:Autre`, icon: '❓' },
  ];

  select(type: SymptomType): void {
    this.selected.set(type);
  }
}
