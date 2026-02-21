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
| `constipation` | Constipation (échelle Bristol optionnelle) |
| `diarrhea` | Diarrhée (échelle Bristol optionnelle) |
| `headache` | Maux de tête |
| `other` | Autre (texte libre) |

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
