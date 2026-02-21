import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealType } from '../../../../core/models/food-entry.model';
import { MealTypePickerComponent } from './meal-type-picker.component';

describe('MealTypePickerComponent', () => {
  async function setup(selected: MealType): Promise<ComponentFixture<MealTypePickerComponent>> {
    await TestBed.configureTestingModule({
      imports: [MealTypePickerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(MealTypePickerComponent);
    fixture.componentRef.setInput('selected', selected);
    fixture.detectChanges();
    return fixture;
  }

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      const fixture = await setup('lunch');
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher exactement 5 chips', async () => {
      const fixture = await setup('lunch');
      const chips = fixture.nativeElement.querySelectorAll('.meal-type-picker__chip');
      expect(chips.length).toBe(5);
    });

    it('devrait afficher une icône et un label dans chaque chip', async () => {
      const fixture = await setup('breakfast');
      const chips = fixture.nativeElement.querySelectorAll('.meal-type-picker__chip') as NodeListOf<HTMLElement>;

      chips.forEach(chip => {
        expect(chip.querySelector('.meal-type-picker__icon')).toBeTruthy();
        expect(chip.querySelector('.meal-type-picker__label')).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('sélection', () => {
    it('devrait marquer le chip sélectionné avec aria-pressed="true"', async () => {
      const fixture = await setup('lunch');
      const pressedChips = fixture.nativeElement.querySelectorAll('[aria-pressed="true"]');
      expect(pressedChips.length).toBe(1);
    });

    it('devrait appliquer la classe --selected au chip actif', async () => {
      const fixture = await setup('dinner');
      const selectedChip = fixture.nativeElement.querySelector('.meal-type-picker__chip--selected') as HTMLElement;
      expect(selectedChip).toBeTruthy();
      expect(selectedChip.getAttribute('aria-label')).toBeTruthy();
    });

    it('devrait mettre à jour aria-pressed après clic sur un autre chip', async () => {
      const fixture = await setup('lunch');
      const chips = fixture.nativeElement.querySelectorAll(
        '.meal-type-picker__chip'
      ) as NodeListOf<HTMLButtonElement>;

      // Clic sur le premier chip (breakfast)
      chips[0].click();
      fixture.detectChanges();

      expect(chips[0].getAttribute('aria-pressed')).toBe('true');
      expect(chips[1].getAttribute('aria-pressed')).toBe('false');
    });

    it('devrait exposer la valeur mise à jour via le signal model', async () => {
      const fixture = await setup('lunch');
      const chips = fixture.nativeElement.querySelectorAll(
        '.meal-type-picker__chip'
      ) as NodeListOf<HTMLButtonElement>;

      chips[3].click(); // snack

      expect(fixture.componentInstance.selected()).toBe('snack');
    });
  });
});
