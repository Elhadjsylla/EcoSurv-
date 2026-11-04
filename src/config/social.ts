/**
 * Liens des réseaux sociaux d'EcoSurv.
 *
 * Tous vides pour l'instant : aucune ligne n'est affichée dans le pied de page de la landing
 * et la propriété sameAs reste absente des données structurées (index.html).
 * Pour activer un réseau, renseigner son adresse complète (https://…) ici : le pied de page
 * l'affiche et le JSON-LD de l'organisation l'inclut au prochain build.
 */
export interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;
}

export const SOCIAL_LINKS: SocialLinks = {
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  tiktok: '',
  whatsapp: '',
};

export const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
};

/** Entrées renseignées uniquement (adresse non vide). */
export function activeSocialLinks(links: SocialLinks = SOCIAL_LINKS): { key: keyof SocialLinks; label: string; url: string }[] {
  return (Object.keys(links) as (keyof SocialLinks)[])
    .filter((k) => links[k].trim() !== '')
    .map((k) => ({ key: k, label: SOCIAL_LABELS[k], url: links[k].trim() }));
}
