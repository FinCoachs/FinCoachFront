// Source unique de vérité pour les catégories.
// Remplacé par GET /api/categories lors de l'intégration backend.
// plafond: null  →  pas de limite budget (catégorie sans suivi)
// plafond: N     →  apparaît dans BudgetScreen avec alerte à N FCFA

export const DEFAULT_CATEGORIES = [
  { id: 1,  libelle: 'Alimentation', plafond: 50000, color: '#44f3a9' },
  { id: 2,  libelle: 'Transport',    plafond: 20000, color: '#ffba4b' },
  { id: 3,  libelle: 'Loisirs',      plafond: 20000, color: '#ff6b6b' },
  { id: 4,  libelle: 'Shopping',     plafond: 15000, color: '#64b5f6' },
  { id: 5,  libelle: 'Santé',        plafond: 20000, color: '#ce93d8' },
  { id: 6,  libelle: 'Logement',     plafond: 50000, color: '#80cbc4' },
  { id: 7,  libelle: 'Salaire',      plafond: null,  color: '#44f3a9' },
  { id: 8,  libelle: 'Transfert',    plafond: null,  color: '#ffba4b' },
  { id: 9,  libelle: 'Vente',        plafond: null,  color: '#64b5f6' },
  { id: 10, libelle: 'Dividendes',   plafond: null,  color: '#ce93d8' },
  { id: 11, libelle: 'Cadeau',       plafond: null,  color: '#f48fb1' },
  { id: 12, libelle: 'Bonus',        plafond: null,  color: '#ffcc02' },
];

export const COLOR_OPTIONS = [
  '#44f3a9', '#00d68f', '#ffba4b', '#ff6b6b',
  '#64b5f6', '#4fc3f7', '#ce93d8', '#f48fb1',
  '#80cbc4', '#ffcc02', '#a5d6a7', '#ffab91',
];
