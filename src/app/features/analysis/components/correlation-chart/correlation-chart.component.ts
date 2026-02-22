import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { Chart, type ChartData, type ChartOptions } from 'chart.js/auto';

import { CorrelationPoint } from '../../models/analysis.model';

/** Couleur selon le niveau de sévérité moyen */
function severityColor(avg: number): string {
  if (avg <= 3) return 'rgba(76, 175, 80, 0.75)';
  if (avg <= 6) return 'rgba(255, 152, 0, 0.75)';
  return 'rgba(244, 67, 54, 0.75)';
}

/**
 * Composant graphique affichant les aliments les plus souvent associés à des symptômes
 * dans la fenêtre 0–6h, avec sévérité moyenne représentée par un bar chart horizontal.
 */
@Component({
  selector: 'gt-correlation-chart',
  standalone: true,
  templateUrl: './correlation-chart.component.html',
  styleUrl: './correlation-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorrelationChartComponent {
  // 1. Inputs
  readonly correlations = input.required<CorrelationPoint[]>();

  // 3. Injections (ViewChild signal)
  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  // 5. Computed
  readonly hasData = computed(() => this.correlations().length > 0);

  // 8. Méthodes privées
  private _chart: Chart<'bar', number[], string> | null = null;

  // 6. Effects
  constructor() {
    effect(() => {
      const canvas = this.canvasRef();
      const data = this.correlations();
      if (canvas) {
        queueMicrotask(() => this.renderChart(canvas.nativeElement, data));
      }
    });
  }

  private renderChart(canvas: HTMLCanvasElement, correlations: CorrelationPoint[]): void {
    this._chart?.destroy();
    this._chart = null;

    if (correlations.length === 0) return;

    const { labels, averages } = this.buildChartData(correlations);
    const chartData: ChartData<'bar', number[], string> = {
      labels,
      datasets: [
        {
          label: $localize`:@@chart.avgSeverity:Sévérité moyenne des symptômes suivants`,
          data: averages,
          backgroundColor: averages.map(severityColor),
          borderColor: averages.map(v => severityColor(v).replace('0.75', '1')),
          borderWidth: 1,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          title: {
            display: true,
            text: $localize`:@@chart.xLabel:Sévérité moyenne (1–10)`,
          },
          ticks: { stepSize: 1 },
        },
        y: {
          ticks: { font: { size: 11 } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.x ?? 0;
              return $localize`:@@chart.tooltipSeverity:Sévérité moy. : ${val.toFixed(1)}`;
            },
          },
        },
      },
    };

    this._chart = new Chart(canvas, { type: 'bar', data: chartData, options });
  }

  /** Regroupe les corrélations par aliment et calcule la sévérité moyenne. */
  private buildChartData(correlations: CorrelationPoint[]): {
    labels: string[];
    averages: number[];
  } {
    const grouped = new Map<string, number[]>();
    for (const c of correlations) {
      const list = grouped.get(c.foodName) ?? [];
      list.push(c.severity);
      grouped.set(c.foodName, list);
    }

    const sorted = [...grouped.entries()].sort(
      ([, a], [, b]) =>
        b.reduce((s, v) => s + v, 0) / b.length - a.reduce((s, v) => s + v, 0) / a.length,
    );

    return {
      labels: sorted.map(([name]) => name),
      averages: sorted.map(([, severities]) => {
        const avg = severities.reduce((s, v) => s + v, 0) / severities.length;
        return Math.round(avg * 10) / 10;
      }),
    };
  }
}
