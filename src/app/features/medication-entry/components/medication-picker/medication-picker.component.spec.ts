import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Medication } from '../../../../core/models/medication-entry.model';
import { MedicationEntryStore } from '../../services/medication-entry.store';
import { MedicationPickerComponent } from './medication-picker.component';

describe('MedicationPickerComponent', () => {
  let fixture: ComponentFixture<MedicationPickerComponent>;
  let component: MedicationPickerComponent;

  const mockStore = {
    recentMedicationNames: signal<string[]>(['Lactase', 'Imodium', 'Bifidus']).asReadonly(),
  };

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MedicationPickerComponent],
      providers: [{ provide: MedicationEntryStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher 5 chips de type de médicament', async () => {
      await setup();
      const chips = fixture.nativeElement.querySelectorAll('.medication-picker__type-chip');
      expect(chips.length).toBe(5);
    });

    it('devrait désactiver le bouton Ajouter si le nom est vide', async () => {
      await setup();
      const btn = fixture.nativeElement.querySelector('.medication-picker__add-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('devrait activer le bouton Ajouter quand un nom est saisi', async () => {
      await setup();
      const input = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      input.value = 'Lactase';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.medication-picker__add-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('type de médicament', () => {
    it('devrait sélectionner "other" par défaut', async () => {
      await setup();
      expect(component.selectedType()).toBe('other');
    });

    it('devrait marquer le type sélectionné avec aria-pressed="true"', async () => {
      await setup();
      const pressedChips = fixture.nativeElement.querySelectorAll('[aria-pressed="true"]');
      expect(pressedChips.length).toBe(1);
    });

    it('devrait changer le type sélectionné au clic', async () => {
      await setup();
      const chips = fixture.nativeElement.querySelectorAll(
        '.medication-picker__type-chip',
      ) as NodeListOf<HTMLButtonElement>;

      // Premier chip = enzyme
      chips[0].click();
      fixture.detectChanges();

      expect(component.selectedType()).toBe('enzyme');
      expect(chips[0].classList).toContain('medication-picker__type-chip--selected');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('autocomplétion', () => {
    it('ne devrait pas afficher les suggestions si la saisie fait moins de 2 caractères', async () => {
      await setup();
      const input = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      input.value = 'L';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.medication-picker__suggestions')).toBeNull();
    });

    it('devrait afficher les suggestions filtrées quand la saisie correspond', async () => {
      await setup();
      const input = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      input.value = 'La';
      input.dispatchEvent(new Event('focus'));
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const suggestions = fixture.nativeElement.querySelectorAll('.medication-picker__suggestion');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].textContent?.trim()).toBe('Lactase');
    });

    it('devrait remplir le champ nom au clic sur une suggestion', async () => {
      await setup();
      const input = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      input.value = 'La';
      input.dispatchEvent(new Event('focus'));
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const suggestion = fixture.nativeElement.querySelector(
        '.medication-picker__suggestion',
      ) as HTMLLIElement;
      suggestion.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      fixture.detectChanges();

      expect(component.name()).toBe('Lactase');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('ajout de médicament', () => {
    it("devrait émettre medicationAdded avec les données saisies", async () => {
      await setup();

      const emitted: Medication[] = [];
      const sub = component.medicationAdded.subscribe((m: Medication) => emitted.push(m));

      // Saisie du nom
      const nameInput = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      nameInput.value = 'Lactase';
      nameInput.dispatchEvent(new Event('input'));

      // Saisie de la dose
      const doseInput = fixture.nativeElement.querySelector('#med-dose') as HTMLInputElement;
      doseInput.value = '2 cp';
      doseInput.dispatchEvent(new Event('input'));

      // Sélection du type enzyme
      const chips = fixture.nativeElement.querySelectorAll(
        '.medication-picker__type-chip',
      ) as NodeListOf<HTMLButtonElement>;
      chips[0].click(); // enzyme

      fixture.detectChanges();

      fixture.nativeElement.querySelector('.medication-picker__add-btn').click();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual<Medication>({
        name: 'Lactase',
        type: 'enzyme',
        dose: '2 cp',
      });

      sub.unsubscribe();
    });

    it("devrait omettre la dose dans l'émission si elle est vide", async () => {
      await setup();

      const emitted: Medication[] = [];
      const sub = component.medicationAdded.subscribe((m: Medication) => emitted.push(m));

      const nameInput = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      nameInput.value = 'Bifidus';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.medication-picker__add-btn').click();

      expect(emitted[0].dose).toBeUndefined();

      sub.unsubscribe();
    });

    it('devrait réinitialiser les champs après ajout', async () => {
      await setup();

      const nameInput = fixture.nativeElement.querySelector('#med-name') as HTMLInputElement;
      nameInput.value = 'Imodium';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.medication-picker__add-btn').click();
      fixture.detectChanges();

      expect(component.name()).toBe('');
      expect(component.dose()).toBe('');
      expect(component.selectedType()).toBe('other');
    });
  });
});
