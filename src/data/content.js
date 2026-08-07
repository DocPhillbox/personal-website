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

export const SECTIONS = [
  {
    id: 'bio',
    index: '01',
    label: 'À propos',
    color: '#5eb8ff',
    type: 'telluric',
    orbitRadius: 3.4,
    speed: 0.16,
    size: 0.42,
    phase: 0.4,
    title: 'À propos',
    kicker: 'SYS.01 — IDENTITÉ',
    paragraphs: [
      "Ingénieur en développement logiciel, je conçois des systèmes robustes et je porte une attention particulière à l'architecture, à la lisibilité du code et à l'expérience utilisateur.",
      "Curieux par nature, j'aime autant plonger dans un problème de performance backend que peaufiner une interaction sur trois pixels près.",
      "Ce site est lui-même un petit système : chaque planète est un module, chaque orbite une dépendance stable.",
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
    color: '#4fd6b0',
    type: 'telluric',
    orbitRadius: 4.9,
    speed: 0.11,
    size: 0.5,
    phase: 2.1,
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
    color: '#ff8a5c',
    bandColor: '#ffe0a3',
    type: 'gas',
    orbitRadius: 6.4,
    speed: 0.08,
    size: 0.56,
    phase: 4.2,
    title: 'Projets sélectionnés',
    kicker: 'SYS.03 — RÉALISATIONS',
    projects: [
      {
        name: 'Projet Alpha',
        desc: "Plateforme de gestion de flux de données en temps réel, déployée pour un client du secteur logistique.",
        stack: ['React', 'Node.js', 'PostgreSQL'],
        link: '#',
      },
      {
        name: 'Projet Beta',
        desc: "Outil interne d'automatisation réduisant de 60% le temps de traitement manuel des rapports.",
        stack: ['Python', 'Docker', 'AWS'],
        link: '#',
      },
      {
        name: 'Projet Gamma',
        desc: 'Application web open-source de visualisation de données scientifiques.',
        stack: ['TypeScript', 'Three.js', 'D3'],
        link: '#',
      },
    ],
  },
]
