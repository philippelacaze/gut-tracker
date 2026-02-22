import { Injectable, inject } from '@angular/core';

import { AiProvider } from '../ai-provider.interface';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiTextPart {
  text: string;
}

interface GeminiImagePart {
  inline_data: { mime_type: string | 'image/jpeg'; data: string };
}

type GeminiPart = GeminiTextPart | GeminiImagePart;

interface GeminiRequestBody {
  contents: Array<{ role: string; parts: GeminiPart[] }>;
  system_instruction?: { parts: GeminiTextPart[] };
}

interface GeminiResponse {
  candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
}

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly supportsVision = true;
  readonly isFree = false;

  private readonly _settings = inject(AiSettingsService);

  async analyzeImage(base64Image: string, prompt: string, fileType: string= 'image/jpeg'): Promise<string> {
    const config = this._settings.getProviderConfig('gemini');
    const parts: GeminiPart[] = [
      { inline_data: { mime_type: fileType ??'image/jpeg', data: base64Image } },
      { text: prompt },
    ];
    const requestBody: GeminiRequestBody = {
      contents: [{ role: 'user', parts }],
    };
    return this._request(config.apiKey, config.model, requestBody);
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const config = this._settings.getProviderConfig('gemini');
    const requestBody: GeminiRequestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };
    if (systemPrompt) {
      requestBody.system_instruction = { parts: [{ text: systemPrompt }] };
    }
    return this._request(config.apiKey, config.model, requestBody);
  }

  private async _request(
    apiKey: string,
    model: string,
    requestBody: GeminiRequestBody,
  ): Promise<string> {
    if (!apiKey) {
      throw new AiError('Clé API Gemini manquante', this.id);
    }
    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody),
    };
    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } catch {
      // Retry x1 sur erreur réseau uniquement
      try {
        response = await fetch(url, fetchOptions);
      } catch {
        throw new AiError('Erreur réseau Gemini', this.id);
      }
    }
    if (response.status === 429) throw new AiError('Quota Gemini dépassé', this.id, true);
    if (response.status === 401 || response.status === 403)
      throw new AiError('Clé API Gemini invalide', this.id);
    if (!response.ok) throw new AiError(`Erreur Gemini ${response.status}`, this.id);
    const data = (await response.json()) as GeminiResponse;
    return data.candidates[0].content.parts[0].text;
  }
}
