/**
 * Configuration centralisée des coordonnées et canaux de contact EcoSurv Mauritanie.
 * Permet de modifier en un seul endroit le numéro WhatsApp et les informations de support.
 */
export const CONTACT_CONFIG = {
  phone: {
    display: '+222 37 76 39 28',
    raw: '+22237763928',
    digits: '22237763928',
  },
  whatsapp: {
    number: '22237763928',
    display: '+222 37 76 39 28',
  },
  email: {
    support: 'contact@ecosurv.mr',
  },
  address: {
    display: 'Ilot K, Avenue Charles de Gaulle, Tevragh-Zeina, Nouakchott',
    city: 'Nouakchott',
    country: 'Mauritanie',
  },
} as const;

/**
 * Génère l'URL de contact WhatsApp officielle avec ou sans message pré-rempli.
 */
export function getWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT_CONFIG.whatsapp.number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
