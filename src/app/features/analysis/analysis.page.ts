import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { AnalysisResult } from './models/analysis.model';
import { AnalysisService } from './services/analysis.service';
import { AnalysisReportComponent } from './components/analysis-report/analysis-report.component';
import { CorrelationChartComponent } from './components/correlation-chart/correlation-chart.component';

/** Page principale de l'analyse IA des corrélations aliments–symptômes. */
@Component({
  selector: 'gt-analysis-page',
  standalone: true,
  imports: [AnalysisReportComponent, CorrelationChartComponent],
  templateUrl: './analysis.page.html',
  styleUrl: './analysis.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisPageComponent {
  // 3. Injections
  readonly analysisService = inject(AnalysisService);

  // 4. Signals locaux
  private readonly _result = signal<AnalysisResult | null>(null);
  readonly result = this._result.asReadonly();

  // 7. Méthodes publiques

  async launchAnalysis(): Promise<void> {
    const result = await this.analysisService.analyze();
    this._result.set(result);
  }
}
