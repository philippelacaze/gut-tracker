import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FodmapBadgeComponent } from '../../shared/components/fodmap-badge/fodmap-badge.component';

import { Food, FoodEntry, FodmapScore, MealType } from '../../core/models/food-entry.model';
import { VoiceFoodResult, VoiceParseResult } from '../../core/models/voice-entry.model';
import { AiService } from '../../core/services/ai/ai.service';
import { VoiceInputComponent } from '../../shared/components/voice-input/voice-input.component';
import {
  FoodCameraComponent,
  FoodCameraOutput,
} from './components/food-camera/food-camera.component';
import { FoodEntryCardComponent } from './components/food-entry-card/food-entry-card.component';
import { FoodRecognitionResultComponent } from './components/food-recognition-result/food-recognition-result.component';
import { FoodSearchComponent } from './components/food-search/food-search.component';
import { MealTypePickerComponent } from './components/meal-type-picker/meal-type-picker.component';
import { RecentFoodsComponent } from './components/recent-foods/recent-foods.component';
import { FoodEntryStore } from './services/food-entry.store';

type EntryMode = 'manual' | 'camera';

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
    FoodCameraComponent,
    FoodRecognitionResultComponent,
    FoodEntryCardComponent,
    RecentFoodsComponent,
    VoiceInputComponent,
    FodmapBadgeComponent,
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
  private readonly _entryMode = signal<EntryMode>('manual');
  private readonly _recognitionResult = signal<FoodCameraOutput | null>(null);
  /** Ids des aliments dont l'analyse FODMAP est en cours */
  private readonly _analyzingFoodIds = signal<ReadonlySet<string>>(new Set());

  readonly selectedMealType = this._selectedMealType.asReadonly();
  readonly pendingFoods = this._pendingFoods.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly entryMode = this._entryMode.asReadonly();
  readonly recognitionResult = this._recognitionResult.asReadonly();
  readonly analyzingFoodIds = this._analyzingFoodIds.asReadonly();

  // Signals depuis le store (exposés au template)
  readonly loading = this._store.loading;
  readonly todayEntries = this._store.todayEntries;

  // Indique qu'une analyse IA est en cours
  readonly aiAnalyzing = this._aiService.analyzing;

  // 5. Computed
  readonly canSave = computed(() => this._pendingFoods().length > 0);

  // 7. Méthodes publiques
  setEntryMode(mode: EntryMode): void {
    this._entryMode.set(mode);
    // Réinitialise le résultat de reconnaissance lors du changement de mode
    this._recognitionResult.set(null);
  }

  onMealTypeChange(type: MealType): void {
    this._selectedMealType.set(type);
  }

  onFoodAdded(food: Food): void {
    this._pendingFoods.update(list => [...list, food]);
  }

  /** Ajoute l'aliment en attente puis lance immédiatement son analyse FODMAP */
  async onFoodAddedAndAnalyze(food: Food): Promise<void> {
    this._pendingFoods.update(list => [...list, food]);
    this._analyzingFoodIds.update(ids => new Set([...ids, food.id]));

    try {
      const analysis = await this._aiService.analyzeFodmap([food.name]);
      const now = new Date().toISOString();
      const match = analysis.foods.find(
        af => af.name.toLowerCase() === food.name.toLowerCase(),
      );
      if (match) {
        const enriched: Food = {
          ...food,
          fodmapScore: {
            level: match.fodmapLevel,
            score: match.score,
            details: [match.mainFodmaps.join(', '), match.notes].filter(Boolean).join(' — '),
            analyzedAt: now,
          },
        };
        this._pendingFoods.update(list => list.map(f => (f.id === food.id ? enriched : f)));
      }
    } catch {
      // Aliment conservé dans la liste sans score FODMAP si l'IA est indisponible
    } finally {
      this._analyzingFoodIds.update(ids => {
        const next = new Set(ids);
        next.delete(food.id);
        return next;
      });
    }
  }

  /** Reçoit le résultat de la caméra — passe en mode édition */
  onRecognitionComplete(output: FoodCameraOutput): void {
    this._recognitionResult.set(output);
  }

  /** L'utilisateur valide la liste d'aliments reconnus */
  onRecognitionConfirmed(foods: Food[]): void {
    this._pendingFoods.update(list => [...list, ...foods]);
    this._recognitionResult.set(null);
    this._entryMode.set('manual');
  }

  /** L'utilisateur annule la reconnaissance — retour à la caméra */
  onRecognitionCancelled(): void {
    this._recognitionResult.set(null);
  }

  removePendingFood(id: string): void {
    this._pendingFoods.update(list => list.filter(f => f.id !== id));
  }

  /** Pré-remplit le formulaire depuis le résultat de la saisie vocale */
  onVoiceResult(result: VoiceParseResult): void {
    const data = result.data as VoiceFoodResult;
    if (data.mealType) {
      this._selectedMealType.set(data.mealType);
    }
    data.foods.forEach(f =>
      this._pendingFoods.update(list => [
        ...list,
        { id: crypto.randomUUID(), name: f.name, fodmapScore: null, quantity: f.quantity ?? undefined },
      ]),
    );
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
