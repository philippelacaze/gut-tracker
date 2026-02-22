import { Injectable, inject } from '@angular/core';

import { AiProvider } from '../ai-provider.interface';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAiTextPart {
  type: 'text';
  text: string;
}

interface OpenAiImagePart {
  type: 'image_url';
  image_url: { url: string };
}

interface OpenAiResponse {
  choices: Array<{ message: { content: string } }>;
}

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly supportsVision = true;
  readonly isFree = false;

  private readonly _settings = inject(AiSettingsService);

  async analyzeImage(base64Image: string, prompt: string, fileType: string): Promise<string> {
    const config = this._settings.getProviderConfig('openai');
    const body = JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${fileType ?? 'image/jpeg'};base64,${base64Image}` },
            } satisfies OpenAiImagePart,
            { type: 'text', text: prompt } satisfies OpenAiTextPart,
          ],
        },
      ],
      max_tokens: 1000,
    });
    const response = await this._fetchWithRetry(config.apiKey, body);
    return this._extractContent(response);
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const config = this._settings.getProviderConfig('openai');
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    const body = JSON.stringify({ model: config.model, messages, max_tokens: 1000 });
    const response = await this._fetchWithRetry(config.apiKey, body);
    return this._extractContent(response);
  }

  private async _fetchWithRetry(apiKey: string, body: string): Promise<Response> {
    if (!apiKey) {
      throw new AiError('Clé API OpenAI manquante', this.id);
    }
    const options: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    };
    let response: Response;
    try {
      response = await fetch(OPENAI_CHAT_URL, options);
    } catch {
      // Retry x1 sur erreur réseau uniquement
      try {
        response = await fetch(OPENAI_CHAT_URL, options);
      } catch {
        throw new AiError('Erreur réseau OpenAI', this.id);
      }
    }
    if (response.status === 429) throw new AiError('Quota OpenAI dépassé', this.id, true);
    if (response.status === 401) throw new AiError('Clé API OpenAI invalide', this.id);
    if (!response.ok) throw new AiError(`Erreur OpenAI ${response.status}`, this.id);
    return response;
  }

  private async _extractContent(response: Response): Promise<string> {
    const data = (await response.json()) as OpenAiResponse;
    return data.choices[0].message.content;
  }
}
