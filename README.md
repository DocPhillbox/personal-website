# Portfolio — Système solaire interactif

Portfolio d'ingénieur développement présenté comme un petit système solaire en 3D :
chaque planète est une section du site (À propos, Compétences, Projets). Cliquer sur une
planète l'amène en gros plan à l'arrière-plan pendant qu'un panneau d'information glisse
au premier plan.

## Stack

- **React 19** + **Vite**
- **@react-three/fiber** + **@react-three/drei** (moteur 3D, au-dessus de three.js)
- **framer-motion** (animation du panneau d'information)

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (par défaut http://localhost:5173).

## Build de production

```bash
npm run build   # génère le dossier dist/
npm run preview # pour tester le build localement
```

Le dossier `dist/` généré est un site statique : il peut être déployé tel quel sur
Vercel, Netlify, GitHub Pages, ou tout hébergeur statique.

## Personnaliser le contenu

Tout le texte du site (nom, rôle, bio, compétences, projets) se trouve dans un seul
fichier :

```
src/data/content.js
```

- `PROFILE` : ton nom, rôle, statut, localisation, email, réseaux.
- `SECTIONS` : un objet par planète. Tu peux modifier les textes librement ; les champs
  `orbitRadius`, `speed`, `size`, `color` et `phase` pilotent l'apparence 3D de chaque
  planète (rayon d'orbite, vitesse, taille, couleur, position de départ).

Pour ajouter une 4e planète/section, il suffit d'ajouter un objet à `SECTIONS` avec un
`id` unique — la scène 3D et la navigation s'adaptent automatiquement.

## Structure

```
src/
  components/
    Scene.jsx        # Canvas 3D, lumières, étoiles, orchestration
    Sun.jsx           # le "soleil" central
    Planet.jsx        # planète cliquable (orbite, survol, sélection)
    OrbitRing.jsx      # anneau d'orbite en pointillés
    CameraRig.jsx      # transitions caméra vue d'ensemble ↔ gros plan
    Header.jsx         # identité + statut, en haut de l'écran
    NavList.jsx        # navigation accessible (miroir clavier des planètes)
    InfoPanel.jsx       # panneau de contenu qui glisse au premier plan
  data/content.js       # tout le texte du site
  App.jsx                # assemblage + état de sélection
  index.css / App.css     # tokens de design + layout
```

## Détails d'implémentation utiles

- **URL partageables** : sélectionner une planète met à jour le hash de l'URL
  (`#projets`) ; ouvrir un lien avec ce hash sélectionne directement la bonne section.
- **Accessibilité** : navigation clavier via `NavList`, fermeture au clavier avec
  `Échap`, focus visible, et `prefers-reduced-motion` respecté (ralentit les
  animations de la scène).
- **Responsive** : sous 720px, le panneau latéral devient une feuille inférieure
  (bottom sheet).

## Prochaines étapes suggérées

- Remplacer les projets/compétences placeholder dans `content.js`.
- Ajouter une favicon et un titre/meta description personnalisés dans `index.html`.
- Éventuellement ajouter une 4e planète "Contact" avec un mini-formulaire.
