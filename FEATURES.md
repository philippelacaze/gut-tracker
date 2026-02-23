# FEATURES.md – Spécifications fonctionnelles

## Feature 1 : Saisie alimentaire (priorité maximale)

### Flux principal

```
Utilisateur → Choisit un mode de saisie
  ├── 📷 Photo → Analyse IA → Confirmation/Edition → Score FODMAP IA
  ├── 🔍 Aliments récurrents → Sélection rapide → Score FODMAP IA
  └── ✏️  Saisie manuelle → Score FODMAP IA
```

### Composants à créer

- `FoodEntryPageComponent` — page principale, onglets/FAB
- `MealTypePickerComponent` — sélecteur type de repas (chips horizontales)
- `FoodCameraComponent` — capture/upload photo, preview
- `FoodRecognitionResultComponent` — liste des aliments reconnus par IA, éditable
- `RecentFoodsComponent` — grille des aliments fréquents (basée sur historique)
- `FoodSearchComponent` — recherche/ajout manuel
- `FodmapBadgeComponent` — badge coloré low/medium/high
- `FoodEntryCardComponent` — résumé d'une saisie dans le journal

### Règles métier

- La reconnaissance photo ne doit **pas extrapoler** : si l'IA n'est pas sûre, elle liste uniquement ce qu'elle voit clairement
- Prompt IA photo : voir [AI_INTEGRATION.md](./AI_INTEGRATION.md)
- Le score FODMAP est demandé **après** validation de la liste d'aliments
- Un aliment récurrent = apparu dans au moins 3 saisies
- Date/heure par défaut = maintenant, modifiable

---

## Feature 2 : Saisie médicaments/compléments

### Composants

- `MedicationEntryPageComponent`
- `MedicationPickerComponent` — sélection depuis historique ou saisie libre
- `MedicationEntryCardComponent`

### Règles

- Types prédéfinis : enzyme, probiotique, antibiotique, antispasmodique, autre
- Autocomplétion basée sur l'historique de l'utilisateur
- Dose optionnelle (texte libre)

---

## Feature 3 : Saisie de symptômes

### Composants

- `SymptomEntryPageComponent`
- `BodyMapComponent` — SVG interactif corps humain
- `SymptomTypePickerComponent` — types de symptômes
- `SeveritySliderComponent` — slider 1–10 avec émojis/couleurs
- `BristolScalePickerComponent` — sélecteur échelle de Bristol 1–7, affiché conditionnellement
- `SymptomEntryCardComponent`

### BodyMap – spécifications

- SVG du corps (vue frontale), version masculine et féminine selon préférence utilisateur
- Clic/tap sur une zone → identifie la région anatomique
- Zones cliquables minimum : tête, thorax, abdomen haut/gauche/droit/bas, pelvis, membres
- La région est stockée comme un label string + coordonnées relatives (%)
- Source SVG recommandée : SVG open source type "body outline" (licence libre)

### Types de symptômes

| Type | Description |
|---|---|
| `pain` | Douleur (localisation via BodyMap) |
| `bloating` | Ballonnements |
| `gas` | Gaz |
| `belching` | Éructations |
| `stool` | Selles — ouvre le sélecteur d'échelle de Bristol |
| `headache` | Maux de tête |
| `other` | Autre (texte libre) |

### Échelle de Bristol

Affiché uniquement quand le type `stool` est sélectionné. Grille de 7 boutons numérotés, chacun associé à une couleur et un libellé court. La valeur est optionnelle (aucune sélection possible).

| Type | Libellé | Couleur |
|---|---|---|
| 1 | Très dur | Brun foncé |
| 2 | Grumeleuse | Brun |
| 3 | Craquelée | Vert foncé |
| 4 | Lisse | Vert |
| 5 | Morceaux mous | Jaune |
| 6 | Pâteuse | Orange |
| 7 | Liquide | Rouge |

Le score Bristol est stocké dans `Symptom.bristolScale?: BristolScale` (union `1|2|3|4|5|6|7`).

---

## Feature 4 : Export

### Formats cibles

- **JSON** : export complet, toutes données, format structuré
- **CSV** : une ligne par événement (aliment/médicament/symptôme), colonnes standardisées
- **PDF** : rapport lisible, chronologique, avec graphiques simples (pour médecin)

### Filtres d'export

- Plage de dates
- Types de données (alimentaire, médicaments, symptômes, ou tout)

### Composants

- `ExportPageComponent`
- `ExportRangePickerComponent`
- `ExportPreviewComponent`

---

## Feature 5 : Analyse IA

### Déclenchement

- Disponible si l'utilisateur a ≥ 7 jours de données complètes
- Bouton explicite "Lancer l'analyse" (l'IA n'est pas appelée automatiquement)

### Ce que l'analyse doit produire

1. Corrélations temporelles (aliment → symptôme dans les 0–6h suivantes)
2. Aliments/groupes FODMAP les plus associés aux symptômes
3. Impact des médicaments observé dans les données
4. Conseils personnalisés (prudents, avec disclaimer médical)

### Composants

- `AnalysisPageComponent`
- `CorrelationChartComponent` — timeline aliments/symptômes
- `AnalysisReportComponent` — rapport narratif IA

### Disclaimer obligatoire

Afficher systématiquement : *"Cette analyse est indicative et ne remplace pas un avis médical. Consultez votre médecin ou nutritionniste."*

---

## Feature 6 : Paramètres (Settings)

> Implémentée — voir `features/settings/` et `AI_INTEGRATION.md`.

---

## Feature 7 : Saisie vocale

Entrée vocale transversale disponible sur les trois pages de saisie (aliments, symptômes, médicaments). L'utilisateur parle, l'application transcrit puis utilise l'IA pour parser l'intention et pré-remplir le formulaire correspondant. L'utilisateur confirme ou corrige avant de valider.

---

### Pipeline en deux étapes

```
[Micro] → STT (Speech-to-Text) → texte brut → NLU via IA → données structurées → pré-remplissage formulaire → confirmation utilisateur
```

**Étape 1 – STT (transcription)**
Deux stratégies, dans l'ordre de priorité :

| Stratégie | Disponibilité | Coût | Qualité |
|---|---|---|---|
| **Web Speech API** (navigateur natif) | Chrome, Edge, Safari 15+ | Gratuit | Bonne |
| **OpenAI Whisper API** (fallback) | Si clé OpenAI configurée | Payant | Excellente |

- Web Speech API est la stratégie par défaut — aucune clé requise, aucun audio envoyé à un tiers externe connu de l'utilisateur.
- Si le navigateur ne supporte pas `SpeechRecognition`, proposer Whisper (si clé OpenAI configurée) ou afficher un message d'indisponibilité.
- La langue STT est héritée de `UserPreferences.appLanguage` (`fr-FR` / `en-US`).

**Étape 2 – NLU (parsing structuré)**
Le texte transcrit est envoyé au provider IA actif (celui sélectionné dans les Settings) avec un prompt système adapté au contexte (`food` / `symptom` / `medication`). La réponse est un JSON structuré qui pré-remplit le formulaire.

---

### Flux UX détaillé

```
[Bouton micro] — tap
  ↓
[État : enregistrement]
  Animation pulsante sur le bouton, chronomètre visible
  Durée max : 30 secondes, puis arrêt automatique
  ↓ tap (arrêt manuel) ou silence détecté (5 s)
[État : transcription en cours]
  Spinner + "Transcription…"
  ↓ texte retourné par STT
[Texte transcrit affiché]
  Zone de texte éditable — l'utilisateur peut corriger avant parsing
  Bouton "Analyser" + bouton "Annuler"
  ↓ tap "Analyser"
[État : parsing IA en cours]
  Spinner + "Analyse…"
  ↓ JSON retourné par l'IA
[Formulaire pré-rempli]
  Les champs remplis sont mis en évidence (ex : bordure colorée transitoire)
  L'utilisateur confirme, édite, puis valide normalement
```

Cas d'erreur à gérer :
- STT échoue → message "Transcription impossible, réessayez"
- Parsing IA échoue / JSON invalide → afficher le texte brut et laisser l'utilisateur saisir manuellement
- Navigateur incompatible → masquer le bouton micro + warning dans les Settings

---

### Intégration dans les pages existantes

**Food Entry** (`food-entry.page.ts`)
- FAB micro visible en bas à droite
- Résultat `VoiceFoodResult` pré-remplit : type de repas + liste d'aliments dans `FoodSearchComponent`
- Le score FODMAP est demandé ensuite, comme pour une saisie normale

**Symptom Entry** (`symptom-entry.page.ts`)
- FAB micro visible en bas à droite
- Résultat `VoiceSymptomResult` pré-remplit : type, sévérité, note
- `locationHint` (texte libre ex : "bas ventre gauche") est stocké dans `note` si renseigné oralement — la localisation sur le `BodyMapComponent` reste toujours à sélectionner manuellement par l'utilisateur

**Medication Entry** (`medication-entry.page.ts`)
- FAB micro visible en bas à droite
- Résultat `VoiceMedicationResult` pré-remplit : nom, type, dose

---

### Modèles de données

```typescript
// core/models/voice-entry.model.ts

export type VoiceContext = 'food' | 'symptom' | 'medication';

export type VoiceState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'parsing'
  | 'done'
  | 'error';

export interface VoiceFoodResult {
  mealType: MealType | null;
  foods: Array<{ name: string; quantity: string | null }>;
  notes: string | null;
}

export interface VoiceSymptomResult {
  symptoms: Array<{
    type: SymptomType;
    severity: SeverityLevel;
    locationHint: string | null;  // description libre ("bas ventre gauche") → indice pour BodyMap
    note: string | null;
  }>;
}

export interface VoiceMedicationResult {
  medications: Array<{
    name: string;
    type: MedicationType;
    dose: string | null;
  }>;
}

export interface VoiceParseResult {
  context: VoiceContext;
  transcript: string;
  data: VoiceFoodResult | VoiceSymptomResult | VoiceMedicationResult;
}
```

---

### Composants à créer

```
shared/components/voice-input/
  voice-input-button/
    voice-input-button.component.ts     ← bouton micro, state: VoiceState (signal)
    voice-input-button.component.html   ← icône micro + animation CSS pulse
    voice-input-button.component.scss
    voice-input-button.component.spec.ts
  voice-transcript/
    voice-transcript.component.ts       ← textarea éditable + boutons Analyser/Annuler
    voice-transcript.component.html
    voice-transcript.component.scss
    voice-transcript.component.spec.ts
```

**`VoiceInputButtonComponent`**
- FAB flottant (position fixe en bas à droite de la page, au-dessus de la bottom nav sur mobile)
- `input.required<VoiceContext>()` : contexte de saisie
- `input<VoiceState>()` : état courant (contrôlé par le parent)
- `output<void>()` : `recordingStarted`
- `output<void>()` : `recordingStopped`
- `aria-label` dynamique selon l'état, `aria-live="polite"` pour annonces d'état
- Masqué sur desktop si la sidebar nav est visible (pas de conflit visuel)

**`VoiceTranscriptComponent`**
- `input.required<string>()` : texte transcrit
- `model.required<string>()` : texte éditable (two-way)
- `output<string>()` : `analyzeRequested` (texte final)
- `output<void>()` : `cancelled`

---

### Services à créer

```
core/services/voice/
  voice-recognition.service.ts      ← abstraction STT
  voice-recognition.service.spec.ts
  voice-entry-parser.service.ts     ← NLU : texte → VoiceParseResult
  voice-entry-parser.service.spec.ts
```

**`VoiceRecognitionService`** (`providedIn: 'root'`)
- `readonly isSupported: boolean` — détection `window.SpeechRecognition` au démarrage
- `startRecording(lang: string): Observable<string>` — émet au fil de la transcription
- `stopRecording(): void`
- Si non supporté et Whisper disponible : `transcribeBlob(blob: Blob): Promise<string>` via OpenAI

**`VoiceEntryParserService`** (`providedIn: 'root'`)
- `parse(transcript: string, context: VoiceContext): Promise<VoiceParseResult>`
- Sélectionne le prompt système selon le contexte et délègue à `AiService.complete()`
- Lève une `AiError` si le JSON retourné est invalide ou vide

---

### Prompts IA (NLU)

**Parsing alimentaire**
```
Tu es un assistant de saisie alimentaire pour une application de suivi digestif.
L'utilisateur décrit oralement ce qu'il a mangé ou bu.
Extrais les aliments, les quantités estimées et le type de repas.
Ne suppose rien qui ne soit pas dit explicitement.

Réponds UNIQUEMENT en JSON valide, sans texte avant ni après :
{
  "mealType": "breakfast|lunch|dinner|snack|drink|null",
  "foods": [
    { "name": "Nom de l'aliment", "quantity": "portion estimée ou null" }
  ],
  "notes": "information contextuelle non alimentaire ou null"
}
```

**Parsing symptômes**
```
Tu es un assistant de saisie de symptômes digestifs (application IBS/SIBO).
L'utilisateur décrit ses symptômes oralement.
Extrais le ou les symptômes, la sévérité sur 10 si mentionnée (défaut : 5),
et la zone corporelle si précisée.
Ne suppose rien qui ne soit pas dit explicitement.

Types valides : pain, bloating, gas, belching, stool, headache, other.
Pour le type "stool", tu peux indiquer bristolScale (entier 1-7) si mentionné.

Réponds UNIQUEMENT en JSON valide, sans texte avant ni après :
{
  "symptoms": [
    {
      "type": "pain|bloating|gas|belching|stool|headache|other",
      "severity": 5,
      "bristolScale": null,
      "locationHint": "description libre de la zone ou null",
      "note": "détail supplémentaire ou null"
    }
  ]
}
```

**Parsing médicaments**
```
Tu es un assistant de saisie médicamenteuse pour une application de suivi digestif.
L'utilisateur décrit oralement le médicament ou complément qu'il a pris.
Extrais le nom, le type et la dose si mentionnée.
Ne suppose rien qui ne soit pas dit explicitement.

Types valides : enzyme, probiotic, antibiotic, antispasmodic, other.

Réponds UNIQUEMENT en JSON valide, sans texte avant ni après :
{
  "medications": [
    {
      "name": "Nom du médicament ou complément",
      "type": "enzyme|probiotic|antibiotic|antispasmodic|other",
      "dose": "dose ou null"
    }
  ]
}
```

---

### Extension de `AiProvider`

Ajout de deux membres optionnels dans l'interface `AiProvider` (rétrocompatible) :

```typescript
export interface AiProvider {
  // ... membres existants ...
  readonly supportsAudioTranscription: boolean;  // true uniquement pour OpenAI
  transcribeAudio?(audioBlob: Blob, language: string): Promise<string>;
}
```

Seul `OpenAiProvider` implémentera `transcribeAudio` via `POST /v1/audio/transcriptions` (Whisper).

---

### Extension des Settings

Ajout dans `UserPreferences` :

```typescript
export interface UserPreferences {
  // ... existant ...
  voiceInputEnabled: boolean;          // activé par défaut si navigateur compatible
  voiceSttProvider: 'webSpeechApi' | 'whisper';  // défaut : 'webSpeechApi'
}
```

Section "Saisie vocale" ajoutée dans `SettingsPageComponent` :
- Toggle activer/désactiver
- Sélecteur provider STT (affiché uniquement si la clé OpenAI est configurée)
- Indication de compatibilité navigateur (badge vert/rouge)

---

### Contraintes et règles métier

1. **Compatibilité** : si `SpeechRecognition` absent et pas de clé Whisper, le bouton micro est masqué (aucun message d'erreur intempestif — juste absent).
2. **Vie privée** : un tooltip sur le bouton micro indique le provider STT actif (natif navigateur ou Whisper OpenAI).
3. **Durée max** : 30 secondes d'enregistrement, puis arrêt automatique avec le texte capturé jusqu'ici.
4. **Pas de validation automatique** : le parsing IA pré-remplit uniquement, l'utilisateur valide toujours explicitement.
5. **Offline** : désactiver le bouton si hors ligne et provider STT = Whisper. Web Speech API peut fonctionner offline sur certains appareils (comportement natif, non garanti).
6. **Silence** : arrêt automatique après 5 secondes de silence détecté, avec le texte capturé jusqu'ici.
7. **Localisation symptôme** : `locationHint` est stocké en texte libre — aucune tentative de mapping automatique sur le BodyMap SVG. L'utilisateur clique toujours manuellement sur le corps.
8. **FAB** : position `fixed`, bas à droite, `z-index` au-dessus du contenu mais en dessous de la bottom nav. Sur desktop (sidebar visible), le FAB reste visible en bas à droite de la zone de contenu.
9. **Accessibilité** : `aria-label` dynamique ("Démarrer l'enregistrement" / "Arrêter l'enregistrement"), `aria-live="polite"` pour les changements d'état.
10. **Langue** : le paramètre `lang` de `SpeechRecognition` est synchronisé avec `UserPreferences.appLanguage`.
