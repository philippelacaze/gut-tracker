import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Food, FoodEntry, FodmapScore, MealType } from '../../core/models/food-entry.model';
import { AiService } from '../../core/services/ai/ai.service';
import { FoodEntryCardComponent } from './components/food-entry-card/food-entry-card.component';
import { FoodSearchComponent } from './components/food-search/food-search.component';
import { MealTypePickerComponent } from './components/meal-type-picker/meal-type-picker.component';
import { RecentFoodsComponent } from './components/recent-foods/recent-foods.component';
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
  imports: [
    MealTypePickerComponent,
    FoodSearchComponent,
    FoodEntryCardComponent,
    RecentFoodsComponent,
  ],
  templateUrl: './food-entry.page.html',
  styleUrl: './food-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodEntryPageComponent {
  // 3. Injections
  private readonly _store = inject(FoodEntryStore);
  private readonly _aiService = inject(AiService);

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

  // Indique qu'une analyse FODMAP est en cours (sous-état de saving)
  readonly aiAnalyzing = this._aiService.analyzing;

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
      let enrichedFoods = this._pendingFoods();
      let globalFodmapScore: FodmapScore | undefined;

      // Analyse FODMAP — dégradation gracieuse si l'IA est indisponible
      try {
        const analysis = await this._aiService.analyzeFodmap(
          enrichedFoods.map(f => f.name),
        );
        const now = new Date().toISOString();
        enrichedFoods = enrichedFoods.map(f => {
          const match = analysis.foods.find(
            af => af.name.toLowerCase() === f.name.toLowerCase(),
          );
          if (!match) return f;
          return {
            ...f,
            fodmapScore: {
              level: match.fodmapLevel,
              score: match.score,
              details: [match.mainFodmaps.join(', '), match.notes].filter(Boolean).join(' — '),
              analyzedAt: now,
            },
          };
        });
        globalFodmapScore = {
          level: analysis.globalLevel,
          score: analysis.globalScore,
          details: analysis.advice,
          analyzedAt: now,
        };
      } catch {
        // Entrée sauvegardée sans score FODMAP si l'IA est indisponible
      }

      const entry: FoodEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        mealType: this._selectedMealType(),
        foods: enrichedFoods,
        globalFodmapScore,
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
