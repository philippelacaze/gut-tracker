import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';

import { SeverityLevel } from '../../../../core/models/symptom-entry.model';

interface SeverityTheme {
  emoji: string;
  color: string;
  label: string;
}

/** Retourne le thème visuel (emoji + couleur) selon le niveau de sévérité */
function getSeverityTheme(level: SeverityLevel): SeverityTheme {
  if (level <= 3) return { emoji: '😌', color: '#4caf50', label: $localize`:@@severity.veryLow:Très léger` };
  if (level <= 5) return { emoji: '😐', color: '#8bc34a', label: $localize`:@@severity.low:Léger` };
  if (level <= 6) return { emoji: '😣', color: '#ff9800', label: $localize`:@@severity.moderate:Modéré` };
  if (level <= 8) return { emoji: '😰', color: '#f44336', label: $localize`:@@severity.high:Intense` };
  return { emoji: '😱', color: '#b71c1c', label: $localize`:@@severity.veryHigh:Très intense` };
}

@Component({
  selector: 'gt-severity-slider',
  standalone: true,
  templateUrl: './severity-slider.component.html',
  styleUrl: './severity-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeveritySliderComponent {
  // 1. Inputs (two-way via model)
  readonly severity = model.required<SeverityLevel>();

  // 5. Computed
  readonly theme = computed(() => getSeverityTheme(this.severity()));

  // 7. Méthodes publiques
  onSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value) as SeverityLevel;
    this.severity.set(value);
  }
}
