import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gt-symptom-entry-page',
  standalone: true,
  templateUrl: './symptom-entry.page.html',
  styleUrl: './symptom-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomEntryPageComponent {}
