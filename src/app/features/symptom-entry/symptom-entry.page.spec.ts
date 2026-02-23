import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { SymptomEntry } from '../../core/models/symptom-entry.model';
import {
  makeSymptomEntry,
  resetSymptomEntryId,
} from '../../../testing/symptom-entry.factory';
import { VoiceEntryParserService } from '../../core/services/voice/voice-entry-parser.service';
import { SymptomEntryStore } from './services/symptom-entry.store';
import { SymptomEntryPageComponent } from './symptom-entry.page';

const MOCK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500"><rect data-region="head"/></svg>';

describe('SymptomEntryPageComponent', () => {
  let fixture: ComponentFixture<SymptomEntryPageComponent>;
  let component: SymptomEntryPageComponent;
  let mockAdd: ReturnType<typeof vi.fn>;
  let httpMock: HttpTestingController;

  const buildMockStore = (entries: SymptomEntry[] = []) => ({
    loading: signal(false).asReadonly(),
    todayEntries: signal(entries).asReadonly(),
    entries: signal<SymptomEntry[]>([]).asReadonly(),
    add: (mockAdd = vi.fn().mockResolvedValue(undefined)),
    remove: vi.fn().mockResolvedValue(undefined),
  });

  async function setup(todayEntries: SymptomEntry[] = []): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SymptomEntryPageComponent],
      providers: [
        { provide: SymptomEntryStore, useValue: buildMockStore(todayEntries) },
        { provide: VoiceEntryParserService, useValue: { parse: vi.fn() } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SymptomEntryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    // Répond à la requête SVG émise par BodyMapComponent
    httpMock.expectOne('body-map/body-map.svg').flush(MOCK_SVG);
    fixture.detectChanges();
  }

  afterEach(() => httpMock?.verify());
  beforeEach(() => resetSymptomEntryId());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher le titre', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('h1')).toBeTruthy();
    });

    it("devrait afficher le message vide si aucune entrée aujourd'hui", async () => {
      await setup([]);
      const empty = fixture.nativeElement.querySelector('.symptom-entry-page__empty');
      expect(empty).toBeTruthy();
    });

    it("devrait masquer la section pending si la liste est vide", async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('.symptom-entry-page__pending')).toBeNull();
    });

    it("devrait afficher les cartes pour les entrées du jour", async () => {
      const entries = [makeSymptomEntry({ symptoms: [{ type: 'pain', severity: 5 }] })];
      await setup(entries);

      const cards = fixture.nativeElement.querySelectorAll('gt-symptom-entry-card');
      expect(cards.length).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('formulaire — symptôme courant', () => {
    it('devrait initialiser le type sur "pain"', async () => {
      await setup();
      expect(component.currentType()).toBe('pain');
    });

    it('devrait initialiser la sévérité sur 5', async () => {
      await setup();
      expect(component.currentSeverity()).toBe(5);
    });

    it('devrait mettre à jour le type via onTypeChange', async () => {
      await setup();
      component.onTypeChange('bloating');
      expect(component.currentType()).toBe('bloating');
    });

    it('devrait effacer la localisation quand le type change vers un non-pain', async () => {
      await setup();
      component.onLocationSelected({ x: 50, y: 50, region: 'thorax' });
      component.onTypeChange('gas');
      expect(component.currentLocation()).toBeNull();
    });

    it('devrait conserver la localisation si le type reste pain', async () => {
      await setup();
      component.onLocationSelected({ x: 50, y: 50, region: 'thorax' });
      component.onTypeChange('pain');
      expect(component.currentLocation()).not.toBeNull();
    });

    it('devrait afficher le bristol-scale-picker uniquement quand le type est "stool"', async () => {
      await setup();
      expect(fixture.nativeElement.querySelector('gt-bristol-scale-picker')).toBeNull();

      component.onTypeChange('stool');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('gt-bristol-scale-picker')).toBeTruthy();

      component.onTypeChange('pain');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('gt-bristol-scale-picker')).toBeNull();
    });

    it('devrait réinitialiser bristolScale quand le type change vers non-stool', async () => {
      await setup();
      component.onTypeChange('stool');
      component.onBristolScaleChange(3);
      component.onTypeChange('pain');
      expect(component.currentBristolScale()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('addSymptom()', () => {
    it('devrait ajouter un symptôme à la liste pending', async () => {
      await setup();
      component.onTypeChange('bloating');
      component.onSeverityChange(6);

      component.addSymptom();
      fixture.detectChanges();

      expect(component.pendingSymptoms()).toHaveLength(1);
      expect(component.pendingSymptoms()[0].type).toBe('bloating');
      expect(component.pendingSymptoms()[0].severity).toBe(6);
    });

    it('devrait réinitialiser le formulaire après ajout', async () => {
      await setup();
      component.onTypeChange('gas');
      component.onSeverityChange(3);

      component.addSymptom();

      expect(component.currentType()).toBe('pain');
      expect(component.currentSeverity()).toBe(5);
      expect(component.currentLocation()).toBeNull();
      expect(component.currentBristolScale()).toBeNull();
    });

    it('devrait inclure bristolScale dans le symptôme si type est stool', async () => {
      await setup();
      component.onTypeChange('stool');
      component.onBristolScaleChange(4);
      component.addSymptom();

      expect(component.pendingSymptoms()[0].type).toBe('stool');
      expect(component.pendingSymptoms()[0].bristolScale).toBe(4);
    });

    it('devrait afficher la section pending après ajout', async () => {
      await setup();
      component.addSymptom();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.symptom-entry-page__pending')).toBeTruthy();
    });

    it('devrait supprimer un symptôme pending via removePendingSymptom', async () => {
      await setup();
      component.onTypeChange('pain');
      component.addSymptom();
      component.onTypeChange('bloating');
      component.addSymptom();

      component.removePendingSymptom(0);

      expect(component.pendingSymptoms()).toHaveLength(1);
      expect(component.pendingSymptoms()[0].type).toBe('bloating');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('saveEntry()', () => {
    it('devrait appeler store.add et vider la liste pending', async () => {
      await setup();
      component.onTypeChange('pain');
      component.onSeverityChange(7);
      component.addSymptom();

      await component.saveEntry();

      expect(mockAdd).toHaveBeenCalledOnce();
      const saved = mockAdd.mock.calls[0][0] as SymptomEntry;
      expect(saved.symptoms).toHaveLength(1);
      expect(saved.symptoms[0].type).toBe('pain');
      expect(component.pendingSymptoms()).toHaveLength(0);
    });

    it("ne devrait pas appeler store.add si la liste pending est vide", async () => {
      await setup();
      await component.saveEntry();
      expect(mockAdd).not.toHaveBeenCalled();
    });
  });
});
