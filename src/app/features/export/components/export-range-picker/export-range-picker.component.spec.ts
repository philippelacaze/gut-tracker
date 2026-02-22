import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ExportFilter } from '../../models/export-filter.model';
import { ExportRangePickerComponent } from './export-range-picker.component';

async function setup(filter: ExportFilter) {
  await TestBed.configureTestingModule({
    imports: [ExportRangePickerComponent],
  }).compileComponents();

  const fixture: ComponentFixture<ExportRangePickerComponent> =
    TestBed.createComponent(ExportRangePickerComponent);
  fixture.componentRef.setInput('filter', filter);
  fixture.detectChanges();
  return fixture;
}

function makeFilter(overrides: Partial<ExportFilter> = {}): ExportFilter {
  return {
    from: new Date(2024, 0, 1),
    to: new Date(2024, 0, 31),
    dataTypes: ['food', 'medication', 'symptom'],
    ...overrides,
  };
}

describe('ExportRangePickerComponent', () => {
  describe('rendu initial', () => {
    it('devrait créer le composant', async () => {
      const fixture = await setup(makeFilter());
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher la date "from" dans l\'input', async () => {
      const filter = makeFilter({ from: new Date(2024, 5, 1) });
      const fixture = await setup(filter);

      const input = fixture.nativeElement.querySelector('#export-from') as HTMLInputElement;

      expect(input.value).toBe('2024-06-01');
    });

    it('devrait afficher la date "to" dans l\'input', async () => {
      const filter = makeFilter({ to: new Date(2024, 5, 30) });
      const fixture = await setup(filter);

      const input = fixture.nativeElement.querySelector('#export-to') as HTMLInputElement;

      expect(input.value).toBe('2024-06-30');
    });

    it('devrait cocher les cases des types sélectionnés', async () => {
      const filter = makeFilter({ dataTypes: ['food', 'symptom'] });
      const fixture = await setup(filter);
      const checkboxes = fixture.nativeElement.querySelectorAll(
        'input[type=checkbox]',
      ) as NodeListOf<HTMLInputElement>;

      const [food, medication, symptom] = Array.from(checkboxes);

      expect(food.checked).toBe(true);
      expect(medication.checked).toBe(false);
      expect(symptom.checked).toBe(true);
    });
  });

  describe('onFromChange()', () => {
    it('devrait mettre à jour la date from dans le modèle', async () => {
      const fixture = await setup(makeFilter());
      const emitted: ExportFilter[] = [];
      fixture.componentInstance.filter.subscribe((v: ExportFilter) => emitted.push(v));

      const input = fixture.nativeElement.querySelector('#export-from') as HTMLInputElement;
      input.value = '2024-03-15';
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const last = emitted.at(-1);
      expect(last?.from.getFullYear()).toBe(2024);
      expect(last?.from.getMonth()).toBe(2); // mars = index 2
      expect(last?.from.getDate()).toBe(15);
    });

    it('devrait ignorer une date invalide', async () => {
      const original = makeFilter({ from: new Date(2024, 0, 1) });
      const fixture = await setup(original);
      const emitted: ExportFilter[] = [];
      fixture.componentInstance.filter.subscribe((v: ExportFilter) => emitted.push(v));
      const initialCount = emitted.length;

      const input = fixture.nativeElement.querySelector('#export-from') as HTMLInputElement;
      input.value = 'invalid-date';
      input.dispatchEvent(new Event('change'));

      expect(emitted.length).toBe(initialCount);
    });
  });

  describe('onTypeToggle()', () => {
    it('devrait ajouter un type non sélectionné au filtre', async () => {
      const filter = makeFilter({ dataTypes: ['food'] });
      const fixture = await setup(filter);
      const emitted: ExportFilter[] = [];
      fixture.componentInstance.filter.subscribe((v: ExportFilter) => emitted.push(v));

      const checkboxes = fixture.nativeElement.querySelectorAll(
        'input[type=checkbox]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change')); // medication

      const last = emitted.at(-1);
      expect(last?.dataTypes).toContain('medication');
    });

    it('devrait retirer un type déjà sélectionné', async () => {
      const filter = makeFilter({ dataTypes: ['food', 'medication'] });
      const fixture = await setup(filter);
      const emitted: ExportFilter[] = [];
      fixture.componentInstance.filter.subscribe((v: ExportFilter) => emitted.push(v));

      const checkboxes = fixture.nativeElement.querySelectorAll(
        'input[type=checkbox]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[1].dispatchEvent(new Event('change')); // medication

      const last = emitted.at(-1);
      expect(last?.dataTypes).not.toContain('medication');
    });

    it('devrait ne pas retirer le dernier type sélectionné', async () => {
      const filter = makeFilter({ dataTypes: ['food'] });
      const fixture = await setup(filter);
      const emitted: ExportFilter[] = [];
      fixture.componentInstance.filter.subscribe((v: ExportFilter) => emitted.push(v));
      const initialCount = emitted.length;

      const checkboxes = fixture.nativeElement.querySelectorAll(
        'input[type=checkbox]',
      ) as NodeListOf<HTMLInputElement>;
      checkboxes[0].dispatchEvent(new Event('change')); // food (seul type)

      expect(emitted.length).toBe(initialCount);
    });
  });
});
