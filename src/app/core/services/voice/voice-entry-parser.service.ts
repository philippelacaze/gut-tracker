import { Injectable, inject } from '@angular/core';

import {
  VoiceContext,
  VoiceFoodResult,
  VoiceMedicationResult,
  VoiceParseResult,
  VoiceSymptomResult,
} from '../../models/voice-entry.model';
import { AiService } from '../ai/ai.service';

/** Valeurs par défaut renvoyées en cas d'échec de parsing JSON */
const FALLBACK_FOOD: VoiceFoodResult = { mealType: null, foods: [], notes: null };
const FALLBACK_SYMPTOM: VoiceSymptomResult = { symptoms: [] };
const FALLBACK_MEDICATION: VoiceMedicationResult = { medications: [] };

@Injectable({ providedIn: 'root' })
export class VoiceEntryParserService {
  private readonly _aiService = inject(AiService);

  /**
   * Envoie le transcript à l'IA et retourne les données structurées.
   * En cas d'échec JSON, retourne un résultat vide (ne throw pas).
   */
  async parse(transcript: string, context: VoiceContext): Promise<VoiceParseResult> {
    const raw = await this._aiService.parseVoiceTranscript(transcript, context);
    const data = this._parseJson(raw, context);
    return { context, transcript, data };
  }

  private _parseJson(
    raw: string,
    context: VoiceContext,
  ): VoiceFoodResult | VoiceSymptomResult | VoiceMedicationResult {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this._fallback(context);
      return JSON.parse(jsonMatch[0]) as VoiceFoodResult | VoiceSymptomResult | VoiceMedicationResult;
    } catch {
      return this._fallback(context);
    }
  }

  private _fallback(
    context: VoiceContext,
  ): VoiceFoodResult | VoiceSymptomResult | VoiceMedicationResult {
    if (context === 'food') return { ...FALLBACK_FOOD };
    if (context === 'symptom') return { ...FALLBACK_SYMPTOM };
    return { ...FALLBACK_MEDICATION };
  }
}
