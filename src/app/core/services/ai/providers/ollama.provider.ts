import { Injectable, inject } from '@angular/core';

import { AiProvider } from '../ai-provider.interface';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
}

interface OllamaChatResponse {
  message: { content: string };
}

@Injectable()
export class OllamaProvider implements AiProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (local)';
  readonly supportsVision = true;
  readonly isFree = true;

  private readonly _settings = inject(AiSettingsService);

  async analyzeImage(base64Image: string, prompt: string, fileType: string): Promise<string> {
    const config = this._settings.getProviderConfig('ollama');
    const message: OllamaMessage = { role: 'user', content: prompt, images: [base64Image] };
    return this._chat(config.baseUrl, config.model, [message]);
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const config = this._settings.getProviderConfig('ollama');
    const messages: OllamaMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    return this._chat(config.baseUrl, config.model, messages);
  }

  private async _chat(baseUrl: string, model: string, messages: OllamaMessage[]): Promise<string> {
    const url = `${baseUrl}/api/chat`;
    const body = JSON.stringify({ model, messages, stream: false });
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
    } catch {
      throw new AiError(
        'Serveur Ollama inaccessible — vérifiez que Ollama est démarré localement',
        this.id,
      );
    }
    if (!response.ok) throw new AiError(`Erreur Ollama ${response.status}`, this.id);
    const data = (await response.json()) as OllamaChatResponse;
    return data.message.content;
  }
}
