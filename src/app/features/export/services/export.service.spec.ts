import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { FoodEntry } from '../../../core/models/food-entry.model';
import { MedicationEntry } from '../../../core/models/medication-entry.model';
import { SymptomEntry } from '../../../core/models/symptom-entry.model';
import { FoodEntryStore } from '../../food-entry/services/food-entry.store';
import { MedicationEntryStore } from '../../medication-entry/services/medication-entry.store';
import { SymptomEntryStore } from '../../symptom-entry/services/symptom-entry.store';
import { ExportFilter } from '../models/export-filter.model';
import { ExportService } from './export.service';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: '1',
    timestamp: new Date().toISOString(),
    mealType: 'lunch',
    foods: [{ id: 'f1', name: 'Pomme', fodmapScore: null }],
    ...overrides,
  };
}

function makeMedicationEntry(overrides: Partial<MedicationEntry> = {}): MedicationEntry {
  return {
    id: '1',
    timestamp: new Date().toISOString(),
    medications: [{ name: 'Lactase', type: 'enzyme' }],
    ...overrides,
  };
}

function makeSymptomEntry(overrides: Partial<SymptomEntry> = {}): SymptomEntry {
  return {
    id: '1',
    timestamp: new Date().toISOString(),
    symptoms: [{ type: 'bloating', severity: 5 }],
    ...overrides,
  };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function setup(
  foodEntries: FoodEntry[] = [],
  medicationEntries: MedicationEntry[] = [],
  symptomEntries: SymptomEntry[] = [],
) {
  const mockFoodStore = { entries: signal<FoodEntry[]>(foodEntries).asReadonly() };
  const mockMedicationStore = { entries: signal<MedicationEntry[]>(medicationEntries).asReadonly() };
  const mockSymptomStore = { entries: signal<SymptomEntry[]>(symptomEntries).asReadonly() };

  const mockAnchor = { href: '', download: '', click: vi.fn() };
  const mockDocument = { createElement: vi.fn().mockReturnValue(mockAnchor) };

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock'),
    revokeObjectURL: vi.fn(),
  });

  TestBed.configureTestingModule({
    providers: [
      ExportService,
      { provide: FoodEntryStore, useValue: mockFoodStore },
      { provide: MedicationEntryStore, useValue: mockMedicationStore },
      { provide: SymptomEntryStore, useValue: mockSymptomStore },
      { provide: DOCUMENT, useValue: mockDocument },
    ],
  });

  return {
    service: TestBed.inject(ExportService),
    mockAnchor,
    mockDocument,
  };
}

function makeAllTypesFilter(from: Date, to: Date): ExportFilter {
  return { from, to, dataTypes: ['food', 'medication', 'symptom'] };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('filterByDate()', () => {
    it('devrait inclure une entrée dont le timestamp est dans la plage', () => {
      const { service } = setup();
      const entry = makeFoodEntry({ timestamp: '2024-06-15T12:00:00.000Z' });
      const filter: ExportFilter = {
        from: new Date('2024-06-01'),
        to: new Date('2024-06-30'),
        dataTypes: ['food'],
      };

      const result = service.filterByDate([entry], filter);

      expect(result).toHaveLength(1);
    });

    it('devrait exclure une entrée dont le timestamp est hors de la plage', () => {
      const { service } = setup();
      const entry = makeFoodEntry({ timestamp: '2024-05-01T12:00:00.000Z' });
      const filter: ExportFilter = {
        from: new Date('2024-06-01'),
        to: new Date('2024-06-30'),
        dataTypes: ['food'],
      };

      const result = service.filterByDate([entry], filter);

      expect(result).toHaveLength(0);
    });

    it('devrait inclure une entrée dont le timestamp est exactement le jour "from"', () => {
      const { service } = setup();
      const entry = makeFoodEntry({ timestamp: '2024-06-01T08:00:00.000Z' });
      const filter: ExportFilter = {
        from: new Date(2024, 5, 1), // 1er juin local
        to: new Date(2024, 5, 30),
        dataTypes: ['food'],
      };

      const result = service.filterByDate([entry], filter);

      expect(result).toHaveLength(1);
    });
  });

  describe('toJson()', () => {
    it('devrait déclencher un téléchargement JSON', () => {
      const food = makeFoodEntry();
      const { service, mockAnchor } = setup([food]);
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      service.toJson(filter);

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toMatch(/\.json$/);
    });

    it('devrait inclure les données alimentaires dans le JSON quand food est sélectionné', () => {
      const food = makeFoodEntry({ id: 'food-1' });
      const { service } = setup([food]);
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      const captured: string[] = [];
      vi.spyOn(
        service as unknown as { triggerDownload: (c: string, m: string, f: string) => void },
        'triggerDownload',
      ).mockImplementation((content) => captured.push(content));

      service.toJson(filter);

      const parsed = JSON.parse(captured[0]) as { food: FoodEntry[] };
      expect(parsed.food).toHaveLength(1);
      expect(parsed.food[0].id).toBe('food-1');
    });

    it('devrait exclure les données alimentaires quand food n\'est pas sélectionné', () => {
      const food = makeFoodEntry();
      const { service } = setup([food]);
      const filter: ExportFilter = {
        from: new Date('2020-01-01'),
        to: new Date('2099-12-31'),
        dataTypes: ['medication', 'symptom'],
      };

      const captured: string[] = [];
      vi.spyOn(
        service as unknown as { triggerDownload: (c: string, m: string, f: string) => void },
        'triggerDownload',
      ).mockImplementation((content) => captured.push(content));

      service.toJson(filter);

      const parsed = JSON.parse(captured[0]) as { food?: FoodEntry[] };
      expect(parsed.food).toBeUndefined();
    });
  });

  describe('toCsv()', () => {
    it('devrait déclencher un téléchargement CSV', () => {
      const { service, mockAnchor } = setup();
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      service.toCsv(filter);

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toMatch(/\.csv$/);
    });

    it('devrait générer une ligne d\'en-tête et une ligne par entrée alimentaire', () => {
      const food = makeFoodEntry();
      const { service } = setup([food]);
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      const captured: string[] = [];
      vi.spyOn(
        service as unknown as { triggerDownload: (c: string, m: string, f: string) => void },
        'triggerDownload',
      ).mockImplementation((content) => captured.push(content));

      service.toCsv(filter);

      const lines = captured[0].split('\r\n');
      expect(lines[0]).toContain('type');
      expect(lines[0]).toContain('categorie');
      expect(lines.length).toBe(2); // header + 1 food row
    });

    it('devrait échapper les valeurs CSV contenant des virgules', () => {
      const food = makeFoodEntry({
        foods: [{ id: 'f1', name: 'Poulet, riz', fodmapScore: null }],
      });
      const { service } = setup([food]);
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      const captured: string[] = [];
      vi.spyOn(
        service as unknown as { triggerDownload: (c: string, m: string, f: string) => void },
        'triggerDownload',
      ).mockImplementation((content) => captured.push(content));

      service.toCsv(filter);

      expect(captured[0]).toContain('"Poulet, riz"');
    });

    it('devrait inclure la sévérité maximale pour les symptômes', () => {
      const symptom = makeSymptomEntry({
        symptoms: [
          { type: 'bloating', severity: 3 },
          { type: 'pain', severity: 7 },
        ],
      });
      const { service } = setup([], [], [symptom]);
      const filter: ExportFilter = {
        from: new Date('2020-01-01'),
        to: new Date('2099-12-31'),
        dataTypes: ['symptom'],
      };

      const captured: string[] = [];
      vi.spyOn(
        service as unknown as { triggerDownload: (c: string, m: string, f: string) => void },
        'triggerDownload',
      ).mockImplementation((content) => captured.push(content));

      service.toCsv(filter);

      const lines = captured[0].split('\r\n');
      expect(lines[1]).toContain('7');
    });
  });

  describe('toPdf()', () => {
    it('devrait résoudre sans erreur', async () => {
      const { service } = setup([makeFoodEntry()], [makeMedicationEntry()], [makeSymptomEntry()]);
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      await expect(service.toPdf(filter)).resolves.toBeUndefined();
    });

    it('devrait résoudre sans erreur avec des données vides', async () => {
      const { service } = setup();
      const filter = makeAllTypesFilter(new Date('2020-01-01'), new Date('2099-12-31'));

      await expect(service.toPdf(filter)).resolves.toBeUndefined();
    });
  });
});
