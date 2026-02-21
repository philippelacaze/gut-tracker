import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';

import { Food } from '../../../../core/models/food-entry.model';
import { FoodEntryStore } from '../../services/food-entry.store';

@Component({
  selector: 'gt-food-search',
  standalone: true,
  templateUrl: './food-search.component.html',
  styleUrl: './food-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodSearchComponent {
  readonly foodAdded = output<Food>();

  private readonly _store = inject(FoodEntryStore);

  private readonly _query = signal('');
  private readonly _quantity = signal('');
  private readonly _showSuggestions = signal(false);

  readonly query = this._query.asReadonly();
  readonly quantity = this._quantity.asReadonly();

  /** Suggestions filtrées depuis l'historique des saisies */
  readonly suggestions = computed(() => {
    const q = this._query().toLowerCase().trim();
    if (q.length < 2) return [];

    const names = new Set<string>();
    for (const entry of this._store.entries()) {
      for (const food of entry.foods) {
        if (food.name.toLowerCase().includes(q)) {
          names.add(food.name);
        }
      }
    }
    return [...names].slice(0, 8);
  });

  readonly showSuggestions = computed(
    () => this._showSuggestions() && this.suggestions().length > 0
  );

  onQueryInput(event: Event): void {
    this._query.set((event.target as HTMLInputElement).value);
    this._showSuggestions.set(true);
  }

  onQuantityInput(event: Event): void {
    this._quantity.set((event.target as HTMLInputElement).value);
  }

  onFocus(): void {
    this._showSuggestions.set(true);
  }

  onBlur(): void {
    this._showSuggestions.set(false);
  }

  /** mousedown + preventDefault pour éviter le blur avant le click */
  onSuggestionMousedown(event: MouseEvent, name: string): void {
    event.preventDefault();
    this._query.set(name);
    this._showSuggestions.set(false);
  }

  addFood(): void {
    const name = this._query().trim();
    if (!name) return;

    const food: Food = {
      id: crypto.randomUUID(),
      name,
      fodmapScore: null,
      quantity: this._quantity().trim() || undefined,
    };

    this.foodAdded.emit(food);
    this._query.set('');
    this._quantity.set('');
    this._showSuggestions.set(false);
  }
}
