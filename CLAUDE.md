# GutTracker – Contexte projet pour Claude Code

## Vue d'ensemble

Application SPA Angular de suivi alimentaire et des symptômes digestifs, orientée IBS/SIBO.
Déployée sur GitHub Pages. Mobile-first, RWD.

→ Détails techniques : [ARCHITECTURE.md](./ARCHITECTURE.md)  
→ Fonctionnalités : [FEATURES.md](./FEATURES.md)  
→ Convention de code : [CONVENTIONS.md](./CONVENTIONS.md)  
→ Intégration IA : [AI_INTEGRATION.md](./AI_INTEGRATION.md)  

---

## Stack technique

| Élément | Choix |
|---|---|
| Framework | Angular 21 (standalone components, Signals) |
| Langage | TypeScript strict |
| Style | SCSS (fichiers séparés par composant) |
| State | Signals + Services injectables |
| Persistance | Abstraction via Repository pattern (LocalStorage d'abord) |
| i18n | Angular i18n (`@angular/localize`) |
| Déploiement | GitHub Pages (`angular-cli-ghpages`) |
| Tests | Vitest 4 (`@angular/build:unit-test`) |

---

## Règles absolues (à respecter dans chaque réponse/génération)

1. **Fichiers séparés** : chaque composant = `.ts` + `.html` + `.scss` distincts. Jamais de `template` ou `styles` inline.
2. **Standalone components** uniquement — pas de NgModules sauf si strictement nécessaire (routing).
3. **Signals** pour tout état local et partagé (pas de BehaviorSubject sauf cas justifié).
4. **Repository pattern** : toute persistance passe par une interface `Repository<T>`. Ne jamais appeler `localStorage` directement dans un composant ou service métier.
5. **SOLID** : un service = une responsabilité. Pas de "god service".
6. **Style guide Angular officiel** : nommage, structure de dossiers, ordre des décorateurs.
7. **i18n** : aucun texte en dur dans les templates — utiliser les attributs `i18n` ou les pipes de traduction.
8. **Pas de `any`** en TypeScript. Types stricts partout.
9. **Commentaires** : en français, concis, sur les logiques non évidentes uniquement.
10. **Tests automatiques obligatoires** : chaque fichier `.ts` généré (composant, service, store, pipe, repository) doit être accompagné de son `.spec.ts` dans la même réponse. Ne jamais terminer une tâche sans les tests. Voir [CONVENTIONS.md](./CONVENTIONS.md) section "Tests".

---

## Structure de dossiers cible

```
src/
  app/
    core/                        # Services singleton, guards, interceptors
      repositories/              # Interfaces + implémentations (local, future API)
      services/                  # Auth, AI, Export...
      models/                    # Interfaces/types métier
    features/
      food-entry/                # Feature 1 : saisie alimentaire
      medication-entry/          # Feature 2 : médicaments
      symptom-entry/             # Feature 3 : symptômes
      export/                    # Feature 4 : export
      analysis/                  # Feature 5 : analyse IA
    shared/
      components/                # Composants réutilisables
      pipes/
      directives/
    i18n/                        # Fichiers de traduction
  assets/
    body-map/                    # SVG corps humain (Feature 3)
```

---

## Environnements

```typescript
// environment.ts (dev)
export const environment = {
  production: false,
  aiProviders: {
    openai: { baseUrl: 'https://api.openai.com/v1' },
    anthropic: { baseUrl: 'https://api.anthropic.com' },
    gemini: { baseUrl: 'https://generativelanguage.googleapis.com' },
    ollama: { baseUrl: 'http://localhost:11434' }  // gratuit/local
  }
};
```

Les clés API sont saisies par l'utilisateur dans les paramètres et stockées dans localStorage (chiffrées).

---

## Commandes utiles

```bash
# Démarrer en dev
ng serve

# Build prod + déploiement GitHub Pages
ng build --configuration production && npx angular-cli-ghpages --dir=dist/gut-tracker/browser

# Générer un composant (exemple)
ng generate component features/food-entry/components/food-camera --standalone

# Extraire les chaînes i18n
ng extract-i18n
```
