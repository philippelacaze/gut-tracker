import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { FoodEntryStore } from '../food-entry/services/food-entry.store';
import { MedicationEntryStore } from '../medication-entry/services/medication-entry.store';
import { SymptomEntryStore } from '../symptom-entry/services/symptom-entry.store';
import { ExportFilter } from './models/export-filter.model';
import { ExportService } from './services/export.service';
import { ExportPageComponent } from './export.page';

// ─── Setup ───────────────────────────────────────────────────────────────────

function buildMockExportService() {
  return {
    toJson: vi.fn(),
    toCsv: vi.fn(),
    toPdf: vi.fn().mockResolvedValue(undefined),
  };
}

function buildMockStore() {
  return { entries: signal([]).asReadonly(), todayEntries: signal([]).asReadonly() };
}

async function setup() {
  const mockExportService = buildMockExportService();

  await TestBed.configureTestingModule({
    imports: [ExportPageComponent],
    providers: [
      { provide: ExportService, useValue: mockExportService },
      { provide: FoodEntryStore, useValue: buildMockStore() },
      { provide: MedicationEntryStore, useValue: buildMockStore() },
      { provide: SymptomEntryStore, useValue: buildMockStore() },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<ExportPageComponent> =
    TestBed.createComponent(ExportPageComponent);
  fixture.detectChanges();

  return { fixture, mockExportService };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportPageComponent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendu initial', () => {
    it('devrait créer le composant', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher le titre de la page', async () => {
      const { fixture } = await setup();
      const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;

      expect(h1).toBeTruthy();
      expect(h1.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('devrait afficher les trois boutons d\'export', async () => {
      const { fixture } = await setup();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button',
      ) as NodeListOf<HTMLButtonElement>;

      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('devrait afficher le composant de sélection de période', async () => {
      const { fixture } = await setup();
      const picker = fixture.nativeElement.querySelector('gt-export-range-picker');

      expect(picker).toBeTruthy();
    });

    it('devrait avoir un filtre initial sur les 30 derniers jours', async () => {
      const { fixture } = await setup();
      const { filter } = fixture.componentInstance;
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      expect(filter().dataTypes).toEqual(['food', 'medication', 'symptom']);
      expect(filter().to.getDate()).toBe(now.getDate());
      expect(filter().from.getDate()).toBe(thirtyDaysAgo.getDate());
    });

    it('ne devrait pas afficher d\'erreur initialement', async () => {
      const { fixture } = await setup();
      const errorEl = fixture.nativeElement.querySelector('.export-page__error');

      expect(errorEl).toBeFalsy();
    });
  });

  describe('exportJson()', () => {
    it('devrait appeler ExportService.toJson() avec le filtre courant', async () => {
      const { fixture, mockExportService } = await setup();

      fixture.componentInstance.exportJson();

      expect(mockExportService.toJson).toHaveBeenCalledWith(fixture.componentInstance.filter());
    });
  });

  describe('exportCsv()', () => {
    it('devrait appeler ExportService.toCsv() avec le filtre courant', async () => {
      const { fixture, mockExportService } = await setup();

      fixture.componentInstance.exportCsv();

      expect(mockExportService.toCsv).toHaveBeenCalledWith(fixture.componentInstance.filter());
    });
  });

  describe('exportPdf()', () => {
    it('devrait appeler ExportService.toPdf() avec le filtre courant', async () => {
      const { fixture, mockExportService } = await setup();

      await fixture.componentInstance.exportPdf();

      expect(mockExportService.toPdf).toHaveBeenCalledWith(fixture.componentInstance.filter());
    });

    it('devrait passer exporting à true pendant la génération puis false après', async () => {
      const { fixture, mockExportService } = await setup();
      let exportingDuring = false;

      mockExportService.toPdf.mockImplementation(async (_: ExportFilter) => {
        exportingDuring = fixture.componentInstance.exporting();
      });

      await fixture.componentInstance.exportPdf();

      expect(exportingDuring).toBe(true);
      expect(fixture.componentInstance.exporting()).toBe(false);
    });

    it('devrait afficher une erreur si toPdf() échoue', async () => {
      const { fixture, mockExportService } = await setup();
      mockExportService.toPdf.mockRejectedValue(new Error('PDF error'));

      await fixture.componentInstance.exportPdf();
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.export-page__error') as HTMLElement;
      expect(errorEl).toBeTruthy();
    });
  });

  describe('onFilterChange()', () => {
    it('devrait mettre à jour le filtre interne', async () => {
      const { fixture } = await setup();
      const newFilter: ExportFilter = {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 11, 31),
        dataTypes: ['food'],
      };

      fixture.componentInstance.onFilterChange(newFilter);

      expect(fixture.componentInstance.filter()).toEqual(newFilter);
    });
  });
});
