import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { FoodEntry, MealType } from '../../core/models/food-entry.model';
import { makeFoodEntry, resetFoodEntryId } from '../../../testing/food-entry.factory';
import { FoodEntryStore } from './services/food-entry.store';
import { FoodEntryPageComponent } from './food-entry.page';

describe('FoodEntryPageComponent', () => {
  let fixture: ComponentFixture<FoodEntryPageComponent>;
  let component: FoodEntryPageComponent;
  let mockAdd: ReturnType<typeof vi.fn>;

  const _todayEntries = signal<FoodEntry[]>([]);
  const _loading = signal(false);

  async function setup(): Promise<void> {
    mockAdd = vi.fn().mockResolvedValue(undefined);
    _todayEntries.set([]);
    _loading.set(false);

    const mockStore = {
      loading: _loading.asReadonly(),
      todayEntries: _todayEntries.asReadonly(),
      entries: signal<FoodEntry[]>([]).asReadonly(),
      add: mockAdd,
    };

    await TestBed.configureTestingModule({
      imports: [FoodEntryPageComponent],
      providers: [{ provide: FoodEntryStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodEntryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => resetFoodEntryId());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher le titre h1', async () => {
      await setup();
      const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
      expect(h1).toBeTruthy();
    });

    it('devrait afficher le composant gt-meal-type-picker', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('gt-meal-type-picker')).toBeTruthy();
    });

    it('devrait afficher le composant gt-food-search', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('gt-food-search')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('état de chargement', () => {
    it('devrait afficher le message de chargement quand loading est true', async () => {
      await setup();
      _loading.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.food-entry-page__loading')).toBeTruthy();
    });

    it('devrait afficher le message vide quand aucune entrée du jour', async () => {
      await setup();

      expect(fixture.nativeElement.querySelector('.food-entry-page__empty')).toBeTruthy();
    });

    it('devrait afficher les cartes quand des entrées existent', async () => {
      await setup();
      _todayEntries.set([makeFoodEntry(), makeFoodEntry()]);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('gt-food-entry-card');
      expect(cards.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('bouton Enregistrer', () => {
    it('devrait être désactivé quand aucun aliment en attente', async () => {
      await setup();
      const btn = fixture.nativeElement.querySelector('.food-entry-page__save-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('devrait s\'activer après ajout d\'un aliment en attente', async () => {
      await setup();
      component.onFoodAdded({ id: 'f1', name: 'Tomate', fodmapScore: null });
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.food-entry-page__save-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('gestion des aliments en attente', () => {
    it('devrait afficher les aliments en attente', async () => {
      await setup();
      component.onFoodAdded({ id: 'f1', name: 'Poulet', fodmapScore: null });
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.food-entry-page__pending-item');
      expect(items.length).toBe(1);
    });

    it('devrait retirer un aliment via removePendingFood()', async () => {
      await setup();
      component.onFoodAdded({ id: 'f1', name: 'Poulet', fodmapScore: null });
      component.onFoodAdded({ id: 'f2', name: 'Riz', fodmapScore: null });
      fixture.detectChanges();

      component.removePendingFood('f1');
      fixture.detectChanges();

      expect(component.pendingFoods()).toHaveLength(1);
      expect(component.pendingFoods()[0].id).toBe('f2');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('saveEntry()', () => {
    it('devrait appeler store.add et vider les aliments en attente', async () => {
      await setup();
      component.onFoodAdded({ id: 'f1', name: 'Tomate', fodmapScore: null });

      await component.saveEntry();

      expect(mockAdd).toHaveBeenCalledOnce();
      expect(component.pendingFoods()).toHaveLength(0);
    });

    it('devrait passer le bon mealType lors de la sauvegarde', async () => {
      await setup();
      component.onMealTypeChange('dinner');
      component.onFoodAdded({ id: 'f1', name: 'Tomate', fodmapScore: null });

      await component.saveEntry();

      const savedEntry: FoodEntry = mockAdd.mock.calls[0][0] as FoodEntry;
      expect(savedEntry.mealType).toBe('dinner');
    });

    it('ne devrait pas appeler store.add si aucun aliment en attente', async () => {
      await setup();

      await component.saveEntry();

      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('onMealTypeChange()', () => {
    it('devrait mettre à jour selectedMealType', async () => {
      await setup();
      component.onMealTypeChange('snack');
      expect(component.selectedMealType()).toBe<MealType>('snack');
    });
  });
});
