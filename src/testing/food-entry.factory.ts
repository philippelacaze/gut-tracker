import { FoodEntry, MealType } from '../app/core/models/food-entry.model';

let _id = 0;

/** Réinitialise le compteur d'id (utile dans beforeEach pour isoler les tests) */
export function resetFoodEntryId(): void {
  _id = 0;
}

export function makeFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: String(++_id),
    timestamp: new Date().toISOString(),
    mealType: 'lunch' as MealType,
    foods: [],
    ...overrides,
  };
}
