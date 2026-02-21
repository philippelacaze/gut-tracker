import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Food, FoodEntry, MealType } from '../../core/models/food-entry.model';
import { FoodEntryCardComponent } from './components/food-entry-card/food-entry-card.component';
import { FoodSearchComponent } from './components/food-search/food-search.component';
import { MealTypePickerComponent } from './components/meal-type-picker/meal-type-picker.component';
import { FoodEntryStore } from './services/food-entry.store';

/** Détermine le type de repas par défaut selon l'heure courante */
function detectCurrentMealType(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  if (h < 21) return 'dinner';
  return 'snack';
}

@Component({
  selector: 'gt-food-entry-page',
  standalone: true,
  imports: [MealTypePickerComponent, FoodSearchComponent, FoodEntryCardComponent],
  templateUrl: './food-entry.page.html',
  styleUrl: './food-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodEntryPageComponent {
  // 3. Injections
  private readonly _store = inject(FoodEntryStore);

  // 4. Signals locaux
  private readonly _selectedMealType = signal<MealType>(detectCurrentMealType());
  private readonly _pendingFoods = signal<Food[]>([]);
  private readonly _saving = signal(false);

  readonly selectedMealType = this._selectedMealType.asReadonly();
  readonly pendingFoods = this._pendingFoods.asReadonly();
  readonly saving = this._saving.asReadonly();

  // Signals depuis le store (exposés au template)
  readonly loading = this._store.loading;
  readonly todayEntries = this._store.todayEntries;

  // 5. Computed
  readonly canSave = computed(() => this._pendingFoods().length > 0);

  // 7. Méthodes publiques
  onMealTypeChange(type: MealType): void {
    this._selectedMealType.set(type);
  }

  onFoodAdded(food: Food): void {
    this._pendingFoods.update(list => [...list, food]);
  }

  removePendingFood(id: string): void {
    this._pendingFoods.update(list => list.filter(f => f.id !== id));
  }

  async saveEntry(): Promise<void> {
    if (!this.canSave()) return;

    this._saving.set(true);
    try {
      const entry: FoodEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        mealType: this._selectedMealType(),
        foods: this._pendingFoods(),
      };
      await this._store.add(entry);
      this._pendingFoods.set([]);
    } catch (err: unknown) {
      console.error('[FoodEntryPage] Erreur lors de la sauvegarde', err);
    } finally {
      this._saving.set(false);
    }
  }
}
