import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import { Food } from '../../../../core/models/food-entry.model';
import { ImageRecognitionResult } from '../../../../core/models/ai-recognition.model';

interface EditableFood {
  id: string;
  name: string;
  quantity: string;
}

@Component({
  selector: 'gt-food-recognition-result',
  standalone: true,
  imports: [],
  templateUrl: './food-recognition-result.component.html',
  styleUrl: './food-recognition-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodRecognitionResultComponent {
  // Inputs
  readonly result = input.required<ImageRecognitionResult>();
  readonly photoUrl = input<string | null>(null);

  // Outputs
  readonly confirmed = output<Food[]>();
  readonly cancelled = output<void>();

  // État local : se réinitialise automatiquement si result() change (linkedSignal Angular 19+)
  private readonly _editableFoods = linkedSignal<EditableFood[]>(() =>
    this.result().foods.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      quantity: f.quantity ?? '',
    })),
  );
  readonly editableFoods = this._editableFoods.asReadonly();

  readonly hasValidItems = computed(() =>
    this._editableFoods().some(f => f.name.trim().length > 0),
  );

  updateFoodName(id: string, name: string): void {
    this._editableFoods.update(list => list.map(f => (f.id === id ? { ...f, name } : f)));
  }

  updateFoodQuantity(id: string, quantity: string): void {
    this._editableFoods.update(list =>
      list.map(f => (f.id === id ? { ...f, quantity } : f)),
    );
  }

  removeFood(id: string): void {
    this._editableFoods.update(list => list.filter(f => f.id !== id));
  }

  addFood(): void {
    this._editableFoods.update(list => [
      ...list,
      { id: crypto.randomUUID(), name: '', quantity: '' },
    ]);
  }

  confirm(): void {
    const foods: Food[] = this._editableFoods()
      .filter(f => f.name.trim().length > 0)
      .map(f => ({
        id: f.id,
        name: f.name.trim(),
        quantity: f.quantity.trim() || undefined,
        fodmapScore: null,
      }));
    this.confirmed.emit(foods);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
