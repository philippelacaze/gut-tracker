import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gt-medication-entry-page',
  standalone: true,
  templateUrl: './medication-entry.page.html',
  styleUrl: './medication-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationEntryPageComponent {}
