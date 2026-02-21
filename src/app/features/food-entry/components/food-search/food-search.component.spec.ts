import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Food, FoodEntry } from '../../../../core/models/food-entry.model';
import { makeFoodEntry } from '../../../../../testing/food-entry.factory';
import { FoodEntryStore } from '../../services/food-entry.store';
import { FoodSearchComponent } from './food-search.component';

/** Crée un mock minimaliste du store avec un signal d'entrées contrôlable */
function createMockStore(initialEntries: FoodEntry[] = []) {
  const _entries = signal<FoodEntry[]>(initialEntries);
  return {
    entries: _entries.asReadonly(),
    _entriesSignal: _entries,
  };
}

describe('FoodSearchComponent', () => {
  let fixture: ComponentFixture<FoodSearchComponent>;
  let component: FoodSearchComponent;
  let mockStoreRef: ReturnType<typeof createMockStore>;

  async function setup(entries: FoodEntry[] = []): Promise<void> {
    mockStoreRef = createMockStore(entries);

    await TestBed.configureTestingModule({
      imports: [FoodSearchComponent],
      providers: [
        { provide: FoodEntryStore, useValue: mockStoreRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ──────────────────────────────────────────────────────────────
  describe('rendu initial', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher un champ Aliment, un champ Quantité et un bouton Ajouter', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('#food-name')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#food-quantity')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.food-search__add-btn')).toBeTruthy();
    });

    it('devrait avoir le bouton Ajouter désactivé quand la saisie est vide', async () => {
      await setup();
      const btn = fixture.nativeElement.querySelector('.food-search__add-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('saisie du champ Aliment', () => {
    it('devrait activer le bouton Ajouter quand un texte est saisi', async () => {
      await setup();
      const input = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;

      input.value = 'Tomate';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.food-search__add-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it('devrait rester désactivé si la saisie ne contient que des espaces', async () => {
      await setup();
      const input = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;

      input.value = '   ';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.food-search__add-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('suggestions', () => {
    it('devrait ne pas afficher de suggestions si la saisie a moins de 2 caractères', async () => {
      const entry = makeFoodEntry({ foods: [{ id: 'f1', name: 'Poulet', fodmapScore: null }] });
      await setup([entry]);

      const input = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;
      input.value = 'P';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.food-search__suggestions')).toBeNull();
    });

    it('devrait afficher les suggestions filtrées depuis l\'historique', async () => {
      const entry = makeFoodEntry({ foods: [{ id: 'f1', name: 'Poulet rôti', fodmapScore: null }] });
      await setup([entry]);

      const input = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;
      input.value = 'pou';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();

      const suggestions = fixture.nativeElement.querySelectorAll('.food-search__suggestion');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].textContent.trim()).toBe('Poulet rôti');
    });

    it('devrait remplir le champ avec la suggestion sélectionnée', async () => {
      const entry = makeFoodEntry({ foods: [{ id: 'f1', name: 'Brocoli', fodmapScore: null }] });
      await setup([entry]);

      const input = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;
      input.value = 'bro';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();

      const suggestion = fixture.nativeElement.querySelector('.food-search__suggestion') as HTMLElement;
      const mousedownEvent = new MouseEvent('mousedown', { cancelable: true });
      suggestion.dispatchEvent(mousedownEvent);
      fixture.detectChanges();

      expect(component.query()).toBe('Brocoli');
      expect(fixture.nativeElement.querySelector('.food-search__suggestions')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('addFood()', () => {
    it('devrait émettre foodAdded avec le nom et la quantité saisis', async () => {
      await setup();
      const emitted: Food[] = [];
      const sub = fixture.componentRef.instance.foodAdded.subscribe((f: Food) => emitted.push(f));

      const nameInput = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;
      const qtyInput = fixture.nativeElement.querySelector('#food-quantity') as HTMLInputElement;
      nameInput.value = 'Tomate';
      nameInput.dispatchEvent(new Event('input'));
      qtyInput.value = '2 pièces';
      qtyInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.food-search__add-btn').click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].name).toBe('Tomate');
      expect(emitted[0].quantity).toBe('2 pièces');
      expect(emitted[0].fodmapScore).toBeNull();

      sub.unsubscribe();
    });

    it('devrait vider les champs après l\'ajout', async () => {
      await setup();
      const nameInput = fixture.nativeElement.querySelector('#food-name') as HTMLInputElement;
      nameInput.value = 'Poulet';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.food-search__add-btn').click();
      fixture.detectChanges();

      expect(component.query()).toBe('');
      expect(component.quantity()).toBe('');
    });

    it('ne devrait pas émettre si le champ Aliment est vide', async () => {
      await setup();
      const emitted: Food[] = [];
      const sub = fixture.componentRef.instance.foodAdded.subscribe((f: Food) => emitted.push(f));

      component.addFood();

      expect(emitted).toHaveLength(0);
      sub.unsubscribe();
    });
  });
});
