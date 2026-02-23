import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { BristolScale } from '../../../../core/models/symptom-entry.model';

interface BristolOption {
  value: BristolScale;
  label: string;
  color: string;
}

@Component({
  selector: 'gt-bristol-scale-picker',
  standalone: true,
  templateUrl: './bristol-scale-picker.component.html',
  styleUrl: './bristol-scale-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BristolScalePickerComponent {
  /** Valeur sélectionnée sur l'échelle de Bristol — liaison bidirectionnelle */
  readonly scale = model.required<BristolScale | null>();

  readonly options: BristolOption[] = [
    { value: 1, label: $localize`:@@bristolScale.1:Très dur`, color: '#5c3317' },
    { value: 2, label: $localize`:@@bristolScale.2:Grumeleuse`, color: '#8b5e3c' },
    { value: 3, label: $localize`:@@bristolScale.3:Craquelée`, color: '#4a7c59' },
    { value: 4, label: $localize`:@@bristolScale.4:Lisse`, color: '#2e7d32' },
    { value: 5, label: $localize`:@@bristolScale.5:Morceaux mous`, color: '#c8a800' },
    { value: 6, label: $localize`:@@bristolScale.6:Pâteuse`, color: '#e67e22' },
    { value: 7, label: $localize`:@@bristolScale.7:Liquide`, color: '#c0392b' },
  ];

  select(value: BristolScale): void {
    this.scale.set(this.scale() === value ? null : value);
  }
}
