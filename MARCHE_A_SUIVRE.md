# MARCHE_A_SUIVRE.md – Démarrage du projet avec Claude Code

## Prérequis

```bash
node --version   # >= 20
npm --version    # >= 10
ng version       # Angular CLI >= 18
```

---

## Phase 0 – Initialisation (1 session Claude Code)

### 1. Créer le projet Angular

```bash
ng new gut-tracker \
  --routing=true \
  --style=scss \
  --strict=true \
  --standalone=true \
  --skip-tests=false \
  --package-manager=npm
cd gut-tracker
```

### 2. Placer les fichiers de contexte

```bash
# Copier tous les .md dans le dossier du projet
cp CLAUDE.md gut-tracker/
cp ARCHITECTURE.md gut-tracker/
cp FEATURES.md gut-tracker/
cp CONVENTIONS.md gut-tracker/
cp AI_INTEGRATION.md gut-tracker/
```

### 3. Installer les dépendances

```bash
npm install @angular/localize
npm install -D angular-cli-ghpages
```

### 4. Configurer GitHub Pages

```json
// angular.json → projects.gut-tracker.architect.build.options
"baseHref": "/gut-tracker/"
```

### 5. Initialiser Git et GitHub

```bash
git init
git remote add origin https://github.com/TON_USER/gut-tracker.git
```

---

## Phase 1 – Core & Architecture (1–2 sessions)

**Demander à Claude Code** (après `claude` dans le terminal) :

> "Lis CLAUDE.md, ARCHITECTURE.md et CONVENTIONS.md.  
> Crée la structure de dossiers core/ avec :  
> - L'interface `Repository<T>` et l'implémentation `LocalStorageRepository<T>`  
> - Les modèles métier : `FoodEntry`, `SymptomEntry`, `MedicationEntry`  
> - Les tokens d'injection pour chaque repository  
> - `AppConfig` avec les providers configurés  
> - Le routing lazy-load pour les 5 features + settings"

---

## Phase 2 – Feature 1 : Saisie alimentaire (2–3 sessions)

### Session 2a – Structure et saisie manuelle

> "Lis CLAUDE.md et FEATURES.md section Feature 1.  
> Crée le `FoodEntryStore` avec Signals, puis la `FoodEntryPageComponent` avec :  
> - `MealTypePickerComponent` (chips horizontales)  
> - `FoodSearchComponent` (input + liste)  
> - `FoodEntryCardComponent` pour le journal du jour"

### Session 2b – Intégration caméra et IA

> "Lis AI_INTEGRATION.md.  
> Crée le `AiService` avec la façade + le provider OpenAI.  
> Puis crée `FoodCameraComponent` (accès caméra/galerie) et  
> `FoodRecognitionResultComponent` (affichage et édition des aliments reconnus)."

### Session 2c – Score FODMAP et aliments récurrents

> "Ajoute l'appel IA pour le score FODMAP après validation des aliments.  
> Crée `FodmapBadgeComponent`.  
> Crée `RecentFoodsComponent` qui calcule les aliments les plus fréquents depuis le store."

---

## Phase 3 – Features 2 & 3 : Médicaments et symptômes (2 sessions)

### Session 3a – Médicaments

> "Lis FEATURES.md section Feature 2.  
> Crée le store, la page et les composants pour la saisie de médicaments."

### Session 3b – Symptômes + BodyMap

> "Lis FEATURES.md section Feature 3.  
> Crée `SymptomEntryStore`, `SymptomEntryPageComponent`, `SeveritySliderComponent`.  
> Pour `BodyMapComponent` : trouve un SVG corps humain open source, intègre-le comme asset Angular, rends chaque zone cliquable avec un événement `locationSelected` émettant un objet `BodyLocation`."

---

## Phase 4 – Navigation & UX mobile (1 session)

> "Crée la navigation principale : bottom navigation bar sur mobile, sidebar sur desktop.  
> Utilise le breakpoint `$bp-md` de CONVENTIONS.md.  
> Ajoute les routes actives, les icônes Material (ou SVG inline) et l'animation de transition entre pages."

---

## Phase 5 – Export (1 session)

> "Lis FEATURES.md section Feature 4.  
> Crée `ExportService` avec 3 méthodes : `toJson()`, `toCsv()`, `toPdf()`.  
> Pour le PDF utilise `jsPDF` (à installer). Crée `ExportPageComponent` avec filtres de dates."

---

## Phase 6 – Analyse IA (1 session)

> "Lis FEATURES.md section Feature 5 et AI_INTEGRATION.md section Analyse.  
> Crée `AnalysisService` qui formate toutes les données en JSON et appelle l'IA.  
> Crée `AnalysisPageComponent` avec le disclaimer médical obligatoire et `CorrelationChartComponent` (utilise ng2-charts ou chart.js)."

---

## Phase 7 – Settings & Providers IA (1 session)

> "Crée `SettingsPageComponent` avec :  
> - Sélection du provider IA actif  
> - Saisie et sauvegarde des clés API (avec avertissement localStorage)  
> - Choix du modèle par provider  
> - Préférence genre (masculin/féminin pour BodyMap)  
> - Langue (i18n)  
> Crée aussi les providers Anthropic, Gemini et Ollama dans `core/services/ai/providers/`."

---

## Phase 8 – i18n (1 session)

> "Configure Angular i18n pour le français (fr) et l'anglais (en).  
> Passe en revue tous les templates et remplace les textes en dur par des attributs `i18n`.  
> Lance `ng extract-i18n` et complète les fichiers de traduction."

---

## Phase 9 – Tests et déploiement (1 session)

> "Ajoute des tests unitaires pour `FoodEntryStore`, `LocalStorageRepository`, `AiService`.  
> Configure le build GitHub Pages dans `angular.json`.  
> Crée un workflow GitHub Actions `.github/workflows/deploy.yml` pour déployer automatiquement sur `gh-pages` à chaque push sur `main`."

---

## Tips pour les sessions Claude Code

- **Toujours commencer** une session par : *"Lis CLAUDE.md"* — Claude Code re-lit le contexte
- **Les tests sont inclus automatiquement** grâce à la règle 10 de CLAUDE.md — inutile de le demander explicitement, mais si Claude Code oublie, rappeler : *"N'oublie pas le fichier `.spec.ts` correspondant"*
- **Sessions courtes et focalisées** : une feature ou un composant par session
- **Valider après chaque génération** : `ng build` + `npm test` doivent passer sans erreur avant de continuer
- **Commiter fréquemment** : un commit par composant ou par feature
- En cas de dérive : rappeler *"Respecte les conventions de CONVENTIONS.md"*

### `/clear` — quand et pourquoi l'utiliser

La commande `/clear` réinitialise le contexte conversationnel de Claude Code (tout ce qu'il a lu et généré depuis le début de la session).

**Pourquoi c'est important :**
- Le contexte s'accumule à chaque échange (fichiers lus, code généré, messages). Plus il est long, plus Claude Code peut "perdre le fil" des conventions et instructions initiales.
- Tout le contexte est rechargé en tokens input à chaque échange : un contexte lourd fait exploser la facture inutilement.

**Quand faire un `/clear` :**
- Entre deux phases (ex : après avoir fini Feature 1, avant de commencer Feature 2)
- Quand une session a duré longtemps et que les réponses semblent moins cohérentes
- Après un commit : c'est un bon réflexe systématique

**Après chaque `/clear` :** toujours relancer par *"Lis CLAUDE.md"* — c'est le seul moyen de redonner le contexte du projet à Claude Code puisqu'il a tout oublié.

---

## Workflow GitHub Actions (déploiement)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build -- --configuration production
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/gut-tracker/browser
```
