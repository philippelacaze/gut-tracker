import { Injectable, computed, inject, signal } from '@angular/core';

import { AiError } from '../../../core/services/ai/ai.error';
import { AiService } from '../../../core/services/ai/ai.service';
import { FoodEntryStore } from '../../food-entry/services/food-entry.store';
import { MedicationEntryStore } from '../../medication-entry/services/medication-entry.store';
import { SymptomEntryStore } from '../../symptom-entry/services/symptom-entry.store';
import { AnalysisResult, CorrelationPoint } from '../models/analysis.model';

/** Fenêtre temporelle (ms) pour détecter un lien aliment → symptôme */
const CORRELATION_WINDOW_MS = 6 * 60 * 60 * 1000;

/** Nombre minimal de jours de données requis pour lancer une analyse */
const MIN_DAYS_REQUIRED = 7;

/** Service responsable du calcul des corrélations et du déclenchement de l'analyse IA. */
@Injectable({ providedIn: 'root' })
export class AnalysisService {
  // 3. Injections
  private readonly _foodStore = inject(FoodEntryStore);
  private readonly _medicationStore = inject(MedicationEntryStore);
  private readonly _symptomStore = inject(SymptomEntryStore);
  private readonly _aiService = inject(AiService);

  // 4. Signals locaux
  private readonly _analyzing = signal(false);
  readonly analyzing = this._analyzing.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  // 5. Computed

  /** Vrai si l'utilisateur dispose d'au moins 7 jours distincts de données. */
  readonly canAnalyze = computed(() => {
    const all = [
      ...this._foodStore.entries(),
      ...this._medicationStore.entries(),
      ...this._symptomStore.entries(),
    ];
    const days = new Set(all.map(e => new Date(e.timestamp).toDateString()));
    return days.size >= MIN_DAYS_REQUIRED;
  });

  /** Nombre de jours distincts actuellement disponibles. */
  readonly daysAvailable = computed(() => {
    const all = [
      ...this._foodStore.entries(),
      ...this._medicationStore.entries(),
      ...this._symptomStore.entries(),
    ];
    return new Set(all.map(e => new Date(e.timestamp).toDateString())).size;
  });

  // 7. Méthodes publiques

  /**
   * Calcule les paires aliment → symptôme où le symptôme est apparu
   * dans les 0 à 6 heures suivant la prise alimentaire.
   */
  computeCorrelations(): CorrelationPoint[] {
    const correlations: CorrelationPoint[] = [];

    for (const symptomEntry of this._symptomStore.entries()) {
      const symptomTime = new Date(symptomEntry.timestamp).getTime();

      for (const symptom of symptomEntry.symptoms) {
        for (const foodEntry of this._foodStore.entries()) {
          const foodTime = new Date(foodEntry.timestamp).getTime();
          const delayMs = symptomTime - foodTime;

          if (delayMs >= 0 && delayMs <= CORRELATION_WINDOW_MS) {
            const delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 10) / 10;

            for (const food of foodEntry.foods) {
              correlations.push({
                foodName: food.name,
                foodTime: foodEntry.timestamp,
                symptomType: symptom.type,
                symptomTime: symptomEntry.timestamp,
                severity: symptom.severity,
                delayHours,
              });
            }
          }
        }
      }
    }

    return correlations;
  }

  /**
   * Lance l'analyse IA en envoyant les données des 30 derniers jours.
   * Requiert canAnalyze() === true.
   */
  async analyze(): Promise<AnalysisResult> {
    this._analyzing.set(true);
    this._error.set(null);
    try {
      const payload = this.buildPayload();
      const report = await this._aiService.analyzeCorrelations(payload);
      return { report, generatedAt: new Date().toISOString() };
    } catch (err: unknown) {
      const message =
        err instanceof AiError
          ? $localize`:@@analysis.aiError:[${err.provider}] ${err.message}`
          : $localize`:@@analysis.error:Erreur lors de l'analyse. Vérifiez vos paramètres IA.`;
      this._error.set(message);
      throw err;
    } finally {
      this._analyzing.set(false);
    }
  }

  // 8. Méthodes privées

  /** Construit le JSON des 30 derniers jours pour envoi à l'IA. */
  private buildPayload(): string {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = <T extends { timestamp: string }>(list: T[]): T[] =>
      list.filter(e => new Date(e.timestamp) >= cutoff);

    return JSON.stringify(
      {
        food: recent(this._foodStore.entries()),
        medication: recent(this._medicationStore.entries()),
        symptom: recent(this._symptomStore.entries()),
      },
      null,
      2,
    );
  }
}
