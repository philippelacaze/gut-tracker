export type AiProviderId = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface AiSettings {
  selectedProvider: AiProviderId;
  providers: {
    openai: { apiKey: string; model: string };
    anthropic: { apiKey: string; model: string };
    gemini: { apiKey: string; model: string };
    ollama: { baseUrl: string; model: string };
  };
}

export const AI_SETTINGS_DEFAULT: AiSettings = {
  selectedProvider: 'openai',
  providers: {
    openai: { apiKey: '', model: 'gpt-4o' },
    anthropic: { apiKey: '', model: 'claude-opus-4-6' },
    gemini: { apiKey: '', model: 'gemini-1.5-pro' },
    ollama: { baseUrl: 'http://localhost:11434', model: 'llava' },
  },
};
