import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gt-food-entry-page',
  standalone: true,
  templateUrl: './food-entry.page.html',
  styleUrl: './food-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodEntryPageComponent {}
