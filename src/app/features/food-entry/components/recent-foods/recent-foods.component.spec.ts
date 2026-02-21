import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { Food, FoodEntry, MealType } from '../../../../core/models/food-entry.model';
import { FoodEntryStore } from '../../services/food-entry.store';
import { RecentFoodsComponent } from './recent-foods.component';

function makeEntry(foods: Food[], id: string = crypto.randomUUID()): FoodEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    mealType: 'lunch' as MealType,
    foods,
  };
}

describe('RecentFoodsComponent', () => {
  let fixture: ComponentFixture<RecentFoodsComponent>;
  let component: RecentFoodsComponent;

  const _entries = signal<FoodEntry[]>([]);
  const _frequentFoods = signal<string[]>([]);

  async function setup(): Promise<void> {
    const mockStore = {
      entries: _entries.asReadonly(),
      frequentFoods: _frequentFoods.asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [RecentFoodsComponent],
      providers: [{ provide: FoodEntryStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentFoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    _entries.set([]);
    _frequentFoods.set([]);
  });

  it('crée le composant', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('n\'affiche rien si aucun aliment fréquent', async () => {
    await setup();
    expect(fixture.nativeElement.querySelector('.recent-foods')).toBeNull();
  });

  it('affiche les chips pour chaque aliment fréquent', async () => {
    await setup();
    _frequentFoods.set(['Poulet', 'Riz']);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('.recent-foods__chip');
    expect(chips.length).toBe(2);
  });

  it('enrichit avec le dernier score FODMAP connu depuis les entrées', async () => {
    await setup();
    const foodWithScore: Food = {
      id: 'f1',
      name: 'Tomate',
      fodmapScore: { level: 'low', score: 2, details: 'Faible', analyzedAt: new Date().toISOString() },
    };
    _entries.set([makeEntry([foodWithScore])]);
    _frequentFoods.set(['Tomate']);
    fixture.detectChanges();

    const result = component.recentFoods();
    expect(result[0].fodmapScore?.level).toBe('low');
  });

  it('fodmapScore est null si aucun score connu pour cet aliment', async () => {
    await setup();
    _entries.set([makeEntry([{ id: 'f1', name: 'Brocoli', fodmapScore: null }])]);
    _frequentFoods.set(['Brocoli']);
    fixture.detectChanges();

    expect(component.recentFoods()[0].fodmapScore).toBeNull();
  });

  it('émet foodSelected avec un nouvel id lors du clic sur un chip', async () => {
    await setup();
    _frequentFoods.set(['Pomme']);
    fixture.detectChanges();

    const emitted: Food[] = [];
    component.foodSelected.subscribe((f: Food) => emitted.push(f));

    const chip = fixture.nativeElement.querySelector('.recent-foods__chip') as HTMLButtonElement;
    chip.click();

    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe('Pomme');
    // L'id doit être un nouveau UUID, pas le nom
    expect(emitted[0].id).not.toBe('Pomme');
  });

  it('recentFoods() retourne un tableau vide si frequentFoods est vide', async () => {
    await setup();
    expect(component.recentFoods()).toEqual([]);
  });

  it('utilise le dernier score FODMAP (pas le premier) si plusieurs entrées', async () => {
    await setup();
    const old: Food = {
      id: 'f1',
      name: 'Riz',
      fodmapScore: { level: 'high', score: 9, details: 'Ancien', analyzedAt: '2023-01-01T00:00:00Z' },
    };
    const recent: Food = {
      id: 'f2',
      name: 'Riz',
      fodmapScore: { level: 'low', score: 2, details: 'Récent', analyzedAt: new Date().toISOString() },
    };
    _entries.set([makeEntry([old], 'e1'), makeEntry([recent], 'e2')]);
    _frequentFoods.set(['Riz']);
    fixture.detectChanges();

    expect(component.recentFoods()[0].fodmapScore?.level).toBe('low');
  });
});
