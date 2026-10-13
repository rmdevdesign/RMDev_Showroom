# FORME — Showroom RM Dev Design

Configurateur de mobilier modulaire en 3D pour le portfolio [rmdev.design](https://rmdev.design). FORME et Module 01 sont une marque et un produit fictifs : aucune commande, aucun devis et aucune collecte de coordonnées.

## Démarrer

Node.js **22.12 minimum**, ou une version plus récente compatible avec Vite 8.

```sh
npm ci
npm run dev
```

## Vérifications

```sh
npm test
npm run lint
npm run build
```

Les parcours navigateur utilisent Chromium par défaut :

```sh
npx playwright install chromium
npm run test:e2e
```

Pour utiliser Chrome installé sous Windows :

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
```

## Publier

```sh
npm run build
```

Publier **le contenu de `dist/`** sur un hébergement statique. Paramètres usuels : commande de build `npm run build`, dossier de sortie `dist`. Le site fonctionne à la racine ou dans un sous-dossier grâce aux chemins relatifs de Vite.

Tout s’exécute dans le navigateur. Aucun backend, compte utilisateur, secret ou variable d’environnement de production n’est nécessaire. Il n’y a ni service worker ni déploiement automatique.

## GitHub Pages

1. Dans le dépôt GitHub, ouvrir **Settings → Pages** et choisir **GitHub Actions** comme source.
2. Dans **Actions**, sélectionner **Publier sur GitHub Pages**, puis **Run workflow** sur la branche `main`.
3. Le workflow installe les dépendances, vérifie le code, compile `dist/` et publie le site.

Adresse de publication attendue : **https://rmdevdesign.github.io/RMDev_Showroom/**. Une configuration de domaine personnalisé peut remplacer cette adresse.

Le déploiement est manuel : un push seul ne publie pas le site. Relancer le workflow après une mise à jour à publier.

## Fonctionnalités

- Bibliothèque à cases, de 2 à 4 colonnes et niveaux ; dimensions en centimètres.
- Structure en chêne clair, noyer naturel, bois blanchi Craie ou deux teintes unies.
- Portes affleurantes de 12 mm, disponibles en cinq couleurs unies.
- Pieds métalliques fins de 8 cm, quatre couleurs indépendantes ; socle de 4 cm en alternative.
- Décoration automatique équilibrée : plantes, livres et accessoires dans les cases ouvertes.
- Rotation, recentrage et zoom limité selon les dimensions du meuble et de l’écran.
- Interface adaptée au mobile ; choix conservés localement dans le navigateur.
- PDF de deux pages : aperçu haute résolution, finitions, dimensions, vue de face cotée et détails. Polices intégrées, images opaques.

Les teintes et dimensions sont indicatives. Le modèle est un concept visuel et le PDF ne constitue pas un plan de fabrication.

## Organisation

`src/App.tsx` gère l’interface, `src/config.ts` le catalogue et les choix, `src/Scene.tsx` la scène Three.js, `src/cabinetGeometry.ts` les panneaux et `src/Props.tsx` les accessoires. `src/exportPdf.ts` génère la fiche. Les tests unitaires sont à côté des modules et les parcours navigateur dans `tests/`.

## Ressources

- Barlow Condensed (logo et titre du produit) et IBM Plex Sans (interface et cotes), stockées localement sous licence SIL Open Font License ; licences dans `src/assets/fonts/`.
- Texture [Wood049 / ambientCG](https://ambientcg.com/view?id=Wood049), sous licence CC0 ; provenance dans `src/assets/wood/README.md`. Les rendus chêne, noyer et bois blanc partagent une base de grain avec des transformations de couleur distinctes.
- Géométrie et pictogrammes définis en code. Aucun modèle GLB, logo, police ou image du projet client d’origine n’est inclus.
