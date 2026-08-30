export const PROFILE = {
  name: 'Bastien Andrey',
  role: 'Ingénieur en informatique logiciel',
  status: 'EN EMPLOI',
  location: 'Suisse',
  email: 'contact@docphillbox.dev',
  socials: [
    { label: 'GitHub', url: 'https://github.com/DocPhillbox' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/bastien-andrey-710a38210/' },
  ],
}

// Orbits are spaced so nothing overlaps: the desert world's moon reaches 7.98
// and the gas giant's ring system starts at 9.02, leaving a clear gap.
export const SECTIONS = [
  {
    id: 'bio',
    index: '01',
    label: 'À propos',
    color: '#5e1a6a',
    type: 'telluric',
    biome: 'ocean',
    clouds: true,
    atmosphere: { color: '#5fd8ff', intensity: 0.12, power: 3 },
    orbitRadius: 4.2,
    speed: 0.2,
    size: 0.46,
    phase: 0.75,
    title: 'À propos',
    kicker: 'SYS.01 — IDENTITÉ',
    paragraphs: [
      "Ingénieur en développement logiciel, passionné par les langages de programmation, les compilateurs et les machines virtuelles, j'aime comprendre en profondeur le fonctionnement des outils que j'utilise au quotidien. J'ai eu l'opportunité de concevoir et de développer ma propre machine virtuelle dédiée aux systèmes embarqués."
    ],
    meta: [
      { label: 'Basé en', value: 'Suisse' },
      { label: 'Expérience', value: '1+ année' },
      { label: 'Langues', value: 'FR · EN' },
    ],
  },
  {
    id: 'skills',
    index: '02',
    label: 'Compétences',
    color: '#e2ab52',
    type: 'telluric',
    biome: 'desert',
    atmosphere: { color: '#ffab5e', intensity: 0.06, power: 3.5 },
    moon: {
      id: 'skills-moon',
      color: '#b9a9a2',
      size: 0.13,
      orbitRadius: 0.95,
      speed: 0.9,
      phase: 1.2,
    },
    orbitRadius: 6.9,
    speed: 0.096,
    size: 0.52,
    phase: 3.35,
    title: 'Compétences',
    kicker: 'SYS.02 — STACK',
    categories: [
      {
        label: 'Frontend',
        items: ['React', 'Blazor', 'Three.js'],
      },
      {
        label: 'Backend',
        items: ['NextJS', 'FastAPI', 'Gin', 'ASP.NET', 'PostgreSQL'],
      },
      {
        label: 'Outils',
        items: ['Docker', 'CI/CD', 'Git'],
      },
    ],
  },
  {
    id: 'projects',
    index: '03',
    label: 'Projets',
    color: '#2fae8f',
    bandColor: '#c6f0dc',
    type: 'gas',
    atmosphere: { color: '#5fe0bb', intensity: 0.08, power: 3 },
    orbitRadius: 10.9,
    speed: 0.05,
    size: 0.62,
    phase: 5.6,
    title: 'Projets sélectionnés',
    kicker: 'SYS.03 — RÉALISATIONS',
    projects: [
      {
        name: 'ESVM',
        desc: 'Machine virtuelle pour les systèmes embarqués.',
        stack: ['Rust', 'M5Stack'],
        link: 'https://github.com/DocPhillbox/ESVM',
      },
      {
        name: 'Oberon0ToWebAssembly',
        desc: "Compilateur fait pour générer du WebAssembly à partir de code Oberon0.",
        stack: ['Python', 'WebAssembly', 'Oberon0'],
        link: 'https://github.com/DocPhillbox/Oberon0ToWebAssembly',
      },
      {
        name: 'Grid simulator',
        desc: 'Un simulateur écrit en Java exposant une API pour simuler des interractions sur une grille 2D.',
        stack: ['Java', 'Maven', 'Spring', 'k8s'],
        link: 'https://github.com/DocPhillbox/grid-simulator',
      },
    ],
  },
]

// A landmark fixed in the background: it never moves, it just marks the system.
export const COMET = {
  position: [-16, 6.5, -19],
  tailDirection: [-0.72, 0.28, -0.63],
  tailLength: 15,
  tailWidth: 2.5,
  nucleusSize: 0.16,
  colorInner: '#ffffff',
  colorOuter: '#5aa8ff',
}
