import { Injectable, inject } from '@angular/core';

import { AiProvider } from '../ai-provider.interface';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1000;

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicImageBlock {
  type: 'image';
  source: { type: 'base64'; media_type: 'image/jpeg'; data: string };
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicImageBlock;

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic (Claude)';
  readonly supportsVision = true;
  readonly isFree = false;

  private readonly _settings = inject(AiSettingsService);

  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    const config = this._settings.getProviderConfig('anthropic');
    const content: AnthropicContentBlock[] = [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
      { type: 'text', text: prompt },
    ];
    const body = JSON.stringify({
      model: config.model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content }],
    });
    const response = await this._fetchWithRetry(config.apiKey, body);
    return this._extractContent(response);
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const config = this._settings.getProviderConfig('anthropic');
    const bodyObj: Record<string, unknown> = {
      model: config.model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    };
    if (systemPrompt) {
      bodyObj['system'] = systemPrompt;
    }
    const response = await this._fetchWithRetry(config.apiKey, JSON.stringify(bodyObj));
    return this._extractContent(response);
  }

  private async _fetchWithRetry(apiKey: string, body: string): Promise<Response> {
    if (!apiKey) {
      throw new AiError('Clé API Anthropic manquante', this.id);
    }
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body,
    };
    let response: Response;
    try {
      response = await fetch(ANTHROPIC_URL, options);
    } catch {
      // Retry x1 sur erreur réseau uniquement
      try {
        response = await fetch(ANTHROPIC_URL, options);
      } catch {
        throw new AiError('Erreur réseau Anthropic', this.id);
      }
    }
    if (response.status === 429) throw new AiError('Quota Anthropic dépassé', this.id, true);
    if (response.status === 401) throw new AiError('Clé API Anthropic invalide', this.id);
    if (!response.ok) throw new AiError(`Erreur Anthropic ${response.status}`, this.id);
    return response;
  }

  private async _extractContent(response: Response): Promise<string> {
    const data = (await response.json()) as AnthropicResponse;
    return data.content[0].text;
  }
}
