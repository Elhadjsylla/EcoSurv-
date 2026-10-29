import { EleveWithStats } from '../types';

export function getDashboardKpis(eleves: EleveWithStats[]) {
  const totalAttendu = eleves.reduce((sum, e) => sum + e.total_due, 0);
  const totalEncaisse = eleves.reduce((sum, e) => sum + e.total_paid, 0);
  const totalImpayes = eleves.reduce((sum, e) => sum + e.remaining, 0);
  const tauxRecouvrement = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;

  const nombreEleves = eleves.length;
  const nombreEnRetard = eleves.filter((e) => e.statut === 'en_retard').length;
  const nombrePaye = eleves.filter((e) => e.statut === 'paye').length;
  const nombrePartiel = eleves.filter((e) => e.statut === 'partiel').length;
  const nombreAJour = eleves.filter((e) => e.statut === 'a_jour').length;

  return {
    totalAttendu,
    totalEncaisse,
    totalImpayes,
    tauxRecouvrement,
    nombreEleves,
    nombreEnRetard,
    nombrePaye,
    nombrePartiel,
    nombreAJour,
  };
}
