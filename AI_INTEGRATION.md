# AI_INTEGRATION.md – Intégration IA

## Architecture du service IA

```
AiService (facade)
  └── AiProviderFactory
        ├── OpenAiProvider    (GPT-4o)
        ├── AnthropicProvider (Claude 3.5 Sonnet)
        ├── GeminiProvider    (Gemini 1.5 Pro)
        └── OllamaProvider    (local, gratuit – ex: llava pour vision)
```

### Interface provider

```typescript
// core/services/ai/ai-provider.interface.ts
export interface AiProvider {
  readonly id: string;
  readonly name: string;
  readonly supportsVision: boolean;
  readonly isFree: boolean;

  analyzeImage(base64Image: string, prompt: string): Promise<string>;
  complete(prompt: string, systemPrompt?: string): Promise<string>;
}
```

### Configuration utilisateur (Settings)

```typescript
export interface AiSettings {
  selectedProvider: string;          // 'openai' | 'anthropic' | 'gemini' | 'ollama'
  providers: {
    openai:     { apiKey: string; model: string };
    anthropic:  { apiKey: string; model: string };
    gemini:     { apiKey: string; model: string };
    ollama:     { baseUrl: string; model: string };
  };
}
```

Les clés sont stockées dans localStorage sous forme obfusquée (base64, pas de vrai chiffrement car SPA sans backend — l'utilisateur doit en être informé).

---

## Modèles recommandés par tâche

| Tâche | Provider recommandé | Modèle | Gratuit ? |
|---|---|---|---|
| Reconnaissance photo | OpenAI | `gpt-4o` | Non |
| Reconnaissance photo | Anthropic | `claude-opus-4-6` | Non |
| Reconnaissance photo | Google | `gemini-1.5-pro` | Tier gratuit limité |
| Reconnaissance photo | Ollama | `llava` | ✅ Oui (local) |
| Score FODMAP | OpenAI | `gpt-4o-mini` | Non |
| Score FODMAP | Anthropic | `claude-haiku-4-5-20251001` | Non |
| Score FODMAP | Ollama | `mistral` | ✅ Oui (local) |
| Analyse corrélations | OpenAI | `gpt-4o` | Non |
| Analyse corrélations | Anthropic | `claude-sonnet-4-6` | Non |

**Option gratuite principale** : Ollama en local (nécessite installation sur la machine de l'utilisateur).  
**Option gratuite cloud** : Gemini 1.5 Pro (quota gratuit mensuel).

---

## Prompts système

### Reconnaissance photo d'aliments

```
Tu es un assistant spécialisé en reconnaissance alimentaire.
Analyse uniquement ce que tu vois clairement sur cette photo.
NE PAS extrapoler, NE PAS supposer des ingrédients non visibles.
Si un aliment est partiellement visible ou ambigu, indique-le.

Réponds UNIQUEMENT en JSON valide, sans texte avant/après :
{
  "foods": [
    { "name": "Nom de l'aliment", "confidence": 0.95, "quantity": "estimation ou null" }
  ],
  "uncertain": ["aliment ambigu 1"]
}
```

### Score FODMAP

```
Tu es un expert en nutrition spécialisé FODMAP (protocole Monash University).
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
}
```

### Analyse de corrélations

```
Tu es un assistant médical spécialisé en troubles digestifs (SII/SIBO).
Tu analyses des données de suivi alimentaire et symptomatique.

IMPORTANT : Tes conclusions sont indicatives uniquement.
Commence TOUJOURS par rappeler que ceci ne remplace pas un avis médical.

Analyse les corrélations temporelles entre prises alimentaires et symptômes apparus dans les 0 à 6 heures suivantes.
Identifie les patterns FODMAP associés aux symptômes.

Données fournies : [JSON des entrées]

Structure ta réponse en sections :
1. Patterns identifiés
2. Aliments/groupes FODMAP suspects
3. Impact des traitements observé
4. Recommandations prudentes
```

---

## Implémentation OpenAI Provider (exemple)

```typescript
// core/services/ai/providers/openai.provider.ts
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly supportsVision = true;
  readonly isFree = false;

  constructor(private settings: AiSettingsService) {}

  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    const config = this.settings.getProviderConfig('openai');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: 'text', text: prompt }
          ]
        }],
        max_tokens: 1000
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    // ... similaire sans image
  }
}
```

---

## Gestion des erreurs IA

```typescript
export class AiError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly isQuotaError: boolean = false
  ) {
    super(message);
  }
}
```

- Quota dépassé → proposer de changer de provider dans les settings
- Timeout → retry x1, puis message d'erreur clair
- Clé invalide → rediriger vers Settings
