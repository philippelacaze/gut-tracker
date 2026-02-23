import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BristolScale } from '../../../../core/models/symptom-entry.model';
import { BristolScalePickerComponent } from './bristol-scale-picker.component';

describe('BristolScalePickerComponent', () => {
  let fixture: ComponentFixture<BristolScalePickerComponent>;
  let component: BristolScalePickerComponent;

  async function setup(scale: BristolScale | null = null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [BristolScalePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BristolScalePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('scale', scale);
    fixture.detectChanges();
  }

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher exactement 7 boutons', async () => {
      await setup();
      const btns = fixture.nativeElement.querySelectorAll('.bristol-picker__btn');
      expect(btns.length).toBe(7);
    });

    it('devrait afficher un numéro et un label dans chaque bouton', async () => {
      await setup();
      const btns = fixture.nativeElement.querySelectorAll('.bristol-picker__btn') as NodeListOf<HTMLElement>;
      btns.forEach(btn => {
        expect(btn.querySelector('.bristol-picker__number')).toBeTruthy();
        expect(btn.querySelector('.bristol-picker__label')).toBeTruthy();
      });
    });

    it('devrait afficher la légende', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('.bristol-picker__legend')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('sélection', () => {
    it('ne devrait marquer aucun bouton si scale est null', async () => {
      await setup(null);
      const selected = fixture.nativeElement.querySelectorAll('[aria-pressed="true"]');
      expect(selected.length).toBe(0);
    });

    it('devrait marquer le bouton correspondant à la valeur initiale', async () => {
      await setup(4);
      const selected = fixture.nativeElement.querySelector('[aria-pressed="true"]') as HTMLElement;
      expect(selected).toBeTruthy();
      expect(selected.querySelector('.bristol-picker__number')?.textContent?.trim()).toBe('4');
    });

    it('devrait mettre à jour le signal model au clic', async () => {
      await setup(null);
      const btns = fixture.nativeElement.querySelectorAll('.bristol-picker__btn') as NodeListOf<HTMLButtonElement>;
      btns[2].click(); // type 3
      fixture.detectChanges();
      expect(component.scale()).toBe(3);
    });

    it('devrait remettre à null si on reclique sur le bouton déjà sélectionné', async () => {
      await setup(3 as BristolScale);
      const btns = fixture.nativeElement.querySelectorAll('.bristol-picker__btn') as NodeListOf<HTMLButtonElement>;
      btns[2].click(); // re-clic sur 3
      fixture.detectChanges();
      expect(component.scale()).toBeNull();
    });

    it('devrait appliquer la classe --selected au bouton actif', async () => {
      await setup(5 as BristolScale);
      const selected = fixture.nativeElement.querySelector('.bristol-picker__btn--selected') as HTMLElement;
      expect(selected).toBeTruthy();
      expect(selected.querySelector('.bristol-picker__number')?.textContent?.trim()).toBe('5');
    });
  });
});
