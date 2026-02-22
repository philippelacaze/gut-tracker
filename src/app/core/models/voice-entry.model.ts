import { MealType } from './food-entry.model';
import { MedicationType } from './medication-entry.model';
import { SeverityLevel, SymptomType } from './symptom-entry.model';

export type VoiceContext = 'food' | 'symptom' | 'medication';
export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'done' | 'error';
export type VoiceSttProvider = 'webSpeechApi' | 'whisper';

export interface VoiceFoodResult {
  mealType: MealType | null;
  foods: Array<{ name: string; quantity: string | null }>;
  notes: string | null;
}

export interface VoiceSymptomResult {
  symptoms: Array<{
    type: SymptomType;
    severity: SeverityLevel;
    locationHint: string | null;
    note: string | null;
  }>;
}

export interface VoiceMedicationResult {
  medications: Array<{ name: string; type: MedicationType; dose: string | null }>;
}

export interface VoiceParseResult {
  context: VoiceContext;
  transcript: string;
  data: VoiceFoodResult | VoiceSymptomResult | VoiceMedicationResult;
}
