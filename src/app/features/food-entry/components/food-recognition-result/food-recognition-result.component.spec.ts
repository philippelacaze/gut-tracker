import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Food } from '../../../../core/models/food-entry.model';
import { ImageRecognitionResult } from '../../../../core/models/ai-recognition.model';
import { FoodRecognitionResultComponent } from './food-recognition-result.component';

const makeResult = (overrides?: Partial<ImageRecognitionResult>): ImageRecognitionResult => ({
  foods: [
    { name: 'Pomme', confidence: 0.95, quantity: '1 unité' },
    { name: 'Riz', confidence: 0.8, quantity: null },
  ],
  uncertain: [],
  ...overrides,
});

describe('FoodRecognitionResultComponent', () => {
  let fixture: ComponentFixture<FoodRecognitionResultComponent>;
  let component: FoodRecognitionResultComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodRecognitionResultComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodRecognitionResultComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('result', makeResult());
    fixture.detectChanges();
  });

  it('crée le composant', () => {
    expect(component).toBeTruthy();
  });

  it('initialise editableFoods depuis result()', () => {
    expect(component.editableFoods().length).toBe(2);
    expect(component.editableFoods()[0].name).toBe('Pomme');
    expect(component.editableFoods()[1].quantity).toBe('');
  });

  it('hasValidItems est true si au moins un aliment a un nom', () => {
    expect(component.hasValidItems()).toBe(true);
  });

  it('hasValidItems est false si tous les noms sont vides', () => {
    component['_editableFoods'].set([{ id: '1', name: '  ', quantity: '' }]);
    expect(component.hasValidItems()).toBe(false);
  });

  it('updateFoodName modifie le nom de l\'aliment correspondant', () => {
    const id = component.editableFoods()[0].id;
    component.updateFoodName(id, 'Banane');
    expect(component.editableFoods()[0].name).toBe('Banane');
  });

  it('updateFoodQuantity modifie la quantité de l\'aliment correspondant', () => {
    const id = component.editableFoods()[1].id;
    component.updateFoodQuantity(id, '200g');
    expect(component.editableFoods()[1].quantity).toBe('200g');
  });

  it('removeFood supprime l\'aliment correspondant', () => {
    const id = component.editableFoods()[0].id;
    component.removeFood(id);
    expect(component.editableFoods().length).toBe(1);
    expect(component.editableFoods()[0].name).toBe('Riz');
  });

  it('addFood ajoute une entrée vide', () => {
    component.addFood();
    expect(component.editableFoods().length).toBe(3);
    expect(component.editableFoods()[2].name).toBe('');
  });

  it('confirm() émet les aliments valides en Food[] (trim, fodmapScore null)', () => {
    const emitted: Food[][] = [];
    component.confirmed.subscribe((foods: Food[]) => emitted.push(foods));

    const id = component.editableFoods()[1].id;
    component.updateFoodName(id, '  '); // sera filtré
    component.confirm();

    expect(emitted.length).toBe(1);
    expect(emitted[0].length).toBe(1);
    expect(emitted[0][0].name).toBe('Pomme');
    expect(emitted[0][0].fodmapScore).toBeNull();
    expect(emitted[0][0].quantity).toBe('1 unité');
  });

  it('confirm() omet quantity si chaîne vide', () => {
    const emitted: Food[][] = [];
    component.confirmed.subscribe((foods: Food[]) => emitted.push(foods));
    component.confirm();
    // 'Riz' a quantity='' → undefined
    const riz = emitted[0].find(f => f.name === 'Riz');
    expect(riz?.quantity).toBeUndefined();
  });

  it('cancel() émet l\'événement cancelled', () => {
    const cancelSpy = vi.fn();
    component.cancelled.subscribe(cancelSpy);
    component.cancel();
    expect(cancelSpy).toHaveBeenCalledOnce();
  });

  it('réinitialise editableFoods quand result() change', () => {
    fixture.componentRef.setInput('result', makeResult({ foods: [{ name: 'Orange', confidence: 1, quantity: null }] }));
    fixture.detectChanges();
    expect(component.editableFoods().length).toBe(1);
    expect(component.editableFoods()[0].name).toBe('Orange');
  });

  it('affiche les aliments incertains si uncertain est non vide', () => {
    fixture.componentRef.setInput('result', makeResult({ uncertain: ['sauce inconnue'] }));
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.food-recognition-result__uncertain');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('sauce inconnue');
  });

  it('affiche le message vide si tous les aliments sont supprimés', () => {
    component.editableFoods().forEach(f => component.removeFood(f.id));
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.food-recognition-result__empty');
    expect(empty).toBeTruthy();
  });
});
