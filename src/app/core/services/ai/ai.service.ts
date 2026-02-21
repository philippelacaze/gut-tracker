import { Injectable, inject, signal } from '@angular/core';

import {
  FodmapAnalysisResult,
  ImageRecognitionResult,
} from '../../models/ai-recognition.model';
import { AiProvider } from './ai-provider.interface';
import { AiSettingsService } from './ai-settings.service';
import { AiError } from './ai.error';
import { OpenAiProvider } from './providers/openai.provider';

const FOOD_RECOGNITION_PROMPT = `Tu es un assistant spécialisé en reconnaissance alimentaire.
Analyse uniquement ce que tu vois clairement sur cette photo.
NE PAS extrapoler, NE PAS supposer des ingrédients non visibles.
Si un aliment est partiellement visible ou ambigu, indique-le.

Réponds UNIQUEMENT en JSON valide, sans texte avant/après :
{
  "foods": [
    { "name": "Nom de l'aliment", "confidence": 0.95, "quantity": "estimation ou null" }
  ],
  "uncertain": ["aliment ambigu 1"]
}`;

const FODMAP_SYSTEM_PROMPT = `Tu es un expert en nutrition spécialisé FODMAP (protocole Monash University).
Pour chaque aliment fourni, donne son score FODMAP.

Réponds UNIQUEMENT en JSON valide :
{
  "foods": [
    {
      "name": "Nom",
      "fodmapLevel": "low|medium|high",
      "score": 3,
      "mainFodmaps": ["fructose", "lactose"],
      "notes": "Explication courte"
    }
  ],
  "globalScore": 5,
  "globalLevel": "medium",
  "advice": "Conseil court sur cette prise alimentaire"
}`;

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly _settingsService = inject(AiSettingsService);
  private readonly _openAi = inject(OpenAiProvider);

  private readonly _analyzing = signal(false);
  readonly analyzing = this._analyzing.asReadonly();

  private get _activeProvider(): AiProvider {
    const id = this._settingsService.getSelectedProvider();
    const map: Record<string, AiProvider> = { openai: this._openAi };
    const provider = map[id];
    if (!provider) {
      throw new AiError(`Provider "${id}" non disponible`, id);
    }
    return provider;
  }

  async recognizeFood(base64Image: string): Promise<ImageRecognitionResult> {
    this._analyzing.set(true);
    try {
      const raw = await this._activeProvider.analyzeImage(base64Image, FOOD_RECOGNITION_PROMPT);
      return JSON.parse(raw) as ImageRecognitionResult;
    } finally {
      this._analyzing.set(false);
    }
  }

  async analyzeFodmap(foodNames: string[]): Promise<FodmapAnalysisResult> {
    this._analyzing.set(true);
    try {
      const prompt = `Aliments à analyser : ${foodNames.join(', ')}`;
      const raw = await this._activeProvider.complete(prompt, FODMAP_SYSTEM_PROMPT);
      return JSON.parse(raw) as FodmapAnalysisResult;
    } finally {
      this._analyzing.set(false);
    }
  }
}
