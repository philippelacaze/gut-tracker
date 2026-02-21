import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomType } from '../../../../core/models/symptom-entry.model';
import { SymptomTypePickerComponent } from './symptom-type-picker.component';

describe('SymptomTypePickerComponent', () => {
  async function setup(selected: SymptomType): Promise<ComponentFixture<SymptomTypePickerComponent>> {
    await TestBed.configureTestingModule({
      imports: [SymptomTypePickerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SymptomTypePickerComponent);
    fixture.componentRef.setInput('selected', selected);
    fixture.detectChanges();
    return fixture;
  }

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      const fixture = await setup('pain');
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher exactement 8 chips (un par type de symptôme)', async () => {
      const fixture = await setup('pain');
      const chips = fixture.nativeElement.querySelectorAll('.symptom-type-picker__chip');
      expect(chips.length).toBe(8);
    });

    it('devrait afficher une icône et un label dans chaque chip', async () => {
      const fixture = await setup('bloating');
      const chips = fixture.nativeElement.querySelectorAll('.symptom-type-picker__chip') as NodeListOf<HTMLElement>;

      chips.forEach(chip => {
        expect(chip.querySelector('.symptom-type-picker__icon')).toBeTruthy();
        expect(chip.querySelector('.symptom-type-picker__label')).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('sélection', () => {
    it('devrait marquer le chip sélectionné avec aria-pressed="true"', async () => {
      const fixture = await setup('pain');
      const pressedChips = fixture.nativeElement.querySelectorAll('[aria-pressed="true"]');
      expect(pressedChips.length).toBe(1);
    });

    it('devrait appliquer la classe --selected au chip actif', async () => {
      const fixture = await setup('bloating');
      const selected = fixture.nativeElement.querySelector('.symptom-type-picker__chip--selected') as HTMLElement;
      expect(selected).toBeTruthy();
    });

    it('devrait mettre à jour le signal model au clic', async () => {
      const fixture = await setup('pain');
      const chips = fixture.nativeElement.querySelectorAll(
        '.symptom-type-picker__chip',
      ) as NodeListOf<HTMLButtonElement>;

      // Index 1 = bloating
      chips[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.selected()).toBe('bloating');
    });

    it('devrait ne marquer qu\'un seul chip comme actif après clic', async () => {
      const fixture = await setup('pain');
      const chips = fixture.nativeElement.querySelectorAll(
        '.symptom-type-picker__chip',
      ) as NodeListOf<HTMLButtonElement>;

      chips[2].click(); // gas
      fixture.detectChanges();

      const pressedChips = fixture.nativeElement.querySelectorAll('[aria-pressed="true"]');
      expect(pressedChips.length).toBe(1);
    });
  });
});
