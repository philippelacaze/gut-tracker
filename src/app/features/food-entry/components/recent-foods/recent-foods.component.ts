import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';

import { Food } from '../../../../core/models/food-entry.model';
import { FodmapBadgeComponent } from '../../../../shared/components/fodmap-badge/fodmap-badge.component';
import { FoodEntryStore } from '../../services/food-entry.store';

@Component({
  selector: 'gt-recent-foods',
  standalone: true,
  imports: [FodmapBadgeComponent],
  templateUrl: './recent-foods.component.html',
  styleUrl: './recent-foods.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentFoodsComponent {
  private readonly _store = inject(FoodEntryStore);

  readonly foodSelected = output<Food>();

  /**
   * Aliments récurrents enrichis avec le dernier score FODMAP connu.
   * L'id est la clé stable pour le tracking @for.
   */
  readonly recentFoods = computed<Food[]>(() => {
    const names = this._store.frequentFoods();
    const allFoods = this._store.entries().flatMap(e => e.foods);
    return names.map(name => {
      const lastKnown = allFoods.filter(f => f.name === name).at(-1);
      return {
        id: name,
        name,
        fodmapScore: lastKnown?.fodmapScore ?? null,
      };
    });
  });

  readonly hasRecentFoods = computed(() => this.recentFoods().length > 0);

  selectFood(food: Food): void {
    // Génère un nouvel id pour éviter les doublons dans la liste en attente
    this.foodSelected.emit({ ...food, id: crypto.randomUUID() });
  }
}
