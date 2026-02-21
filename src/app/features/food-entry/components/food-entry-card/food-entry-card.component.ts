import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { FoodEntry, MealType } from '../../../../core/models/food-entry.model';
import { FoodEntryStore } from '../../services/food-entry.store';

/** Labels traduits pour chaque type de repas */
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: $localize`:@@mealType.breakfast:Petit-déjeuner`,
  lunch: $localize`:@@mealType.lunch:Déjeuner`,
  dinner: $localize`:@@mealType.dinner:Dîner`,
  snack: $localize`:@@mealType.snack:Collation`,
  drink: $localize`:@@mealType.drink:Boisson`,
};

@Component({
  selector: 'gt-food-entry-card',
  standalone: true,
  templateUrl: './food-entry-card.component.html',
  styleUrl: './food-entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodEntryCardComponent {
  // 1. Inputs
  readonly entry = input.required<FoodEntry>();

  // 2. Outputs
  readonly deleted = output<string>();

  // 3. Injections
  private readonly _store = inject(FoodEntryStore);

  // 5. Computed
  readonly mealTypeLabel = computed(() => MEAL_TYPE_LABELS[this.entry().mealType]);

  readonly timeLabel = computed(() =>
    new Date(this.entry().timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  readonly globalFodmapLevel = computed(() => this.entry().globalFodmapScore?.level ?? null);

  // 7. Méthodes publiques
  async onDelete(): Promise<void> {
    try {
      await this._store.remove(this.entry().id);
      this.deleted.emit(this.entry().id);
    } catch (err: unknown) {
      console.error('[FoodEntryCard] Erreur lors de la suppression', err);
    }
  }
}
