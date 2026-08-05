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
