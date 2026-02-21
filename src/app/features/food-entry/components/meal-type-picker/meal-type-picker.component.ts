import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { MealType } from '../../../../core/models/food-entry.model';

interface MealTypeOption {
  value: MealType;
  label: string;
  icon: string;
}

@Component({
  selector: 'gt-meal-type-picker',
  standalone: true,
  templateUrl: './meal-type-picker.component.html',
  styleUrl: './meal-type-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealTypePickerComponent {
  /** Type de repas sélectionné — liaison bidirectionnelle via model() */
  readonly selected = model.required<MealType>();

  readonly mealTypes: MealTypeOption[] = [
    { value: 'breakfast', label: $localize`:@@mealType.breakfast:Petit-déjeuner`, icon: '🌅' },
    { value: 'lunch', label: $localize`:@@mealType.lunch:Déjeuner`, icon: '☀️' },
    { value: 'dinner', label: $localize`:@@mealType.dinner:Dîner`, icon: '🌙' },
    { value: 'snack', label: $localize`:@@mealType.snack:Collation`, icon: '🍎' },
    { value: 'drink', label: $localize`:@@mealType.drink:Boisson`, icon: '💧' },
  ];

  select(type: MealType): void {
    this.selected.set(type);
  }
}
