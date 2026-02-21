import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gt-export-page',
  standalone: true,
  templateUrl: './export.page.html',
  styleUrl: './export.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPageComponent {}
