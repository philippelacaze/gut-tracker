import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gt-analysis-page',
  standalone: true,
  templateUrl: './analysis.page.html',
  styleUrl: './analysis.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisPageComponent {}
