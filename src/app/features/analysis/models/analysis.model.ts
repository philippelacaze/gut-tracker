/** Point de corrélation détecté : un aliment suivi d'un symptôme dans les 6h. */
export interface CorrelationPoint {
  foodName: string;
  foodTime: string; // ISO
  symptomType: string;
  symptomTime: string; // ISO
  severity: number;
  /** Délai en heures (0–6) entre la prise alimentaire et le symptôme */
  delayHours: number;
}

/** Résultat complet d'une analyse IA de corrélations. */
export interface AnalysisResult {
  /** Rapport narratif retourné par l'IA (texte structuré en sections) */
  report: string;
  generatedAt: string; // ISO
}

/** Payload formaté pour l'IA (30 derniers jours de données) */
export interface AnalysisPayload {
  food: unknown[];
  medication: unknown[];
  symptom: unknown[];
}
