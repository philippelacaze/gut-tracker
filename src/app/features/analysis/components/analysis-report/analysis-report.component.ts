import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Affiche le rapport narratif généré par l'IA avec le disclaimer médical obligatoire. */
@Component({
  selector: 'gt-analysis-report',
  standalone: true,
  templateUrl: './analysis-report.component.html',
  styleUrl: './analysis-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisReportComponent {
  // 1. Inputs
  readonly report = input.required<string>();
}
