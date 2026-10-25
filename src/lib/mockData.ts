// Re-export des types typés vers le nouveau module canonique src/types/
export * from '../types';

// Helper de calcul des KPIs de tableau de bord
export { getDashboardKpis } from './kpiHelper';

// Données démo pour l'enseignant (portail enseignant : lot séparé)
export { CURRENT_ENSEIGNANT } from './mockData.demo';
