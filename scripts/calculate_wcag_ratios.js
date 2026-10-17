/**
 * Script de calcul des ratios de contraste WCAG 2.1 (Algorithme officiel W3C)
 * Calcule la luminance relative et le ratio de contraste pour les tokens EcoSurv.
 */

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  const transform = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function getContrastRatio(fgHex, bgHex) {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluate(label, fg, bg, type = 'text') {
  const r = getContrastRatio(fg, bg);
  const threshold = type === 'text' ? 4.5 : 3.0;
  const pass = r >= threshold;
  return {
    label,
    fg,
    bg,
    ratio: r.toFixed(2) + ':1',
    threshold: threshold + ':1',
    status: pass ? 'CONFORME (PASS)' : 'NON-CONFORME (FAIL)'
  };
}

console.log('========================================================================================');
console.log('                 AUDIT DES RATIOS DE CONTRASTE WCAG 2.1 - PALETTE A                     ');
console.log('========================================================================================\n');

// THEME CLAIR
console.log('--- MODE CLAIR (Light) ---');
const lightPairs = [
  // Textes principaux
  evaluate('Texte principal (--text-main #0F172A) sur carte (--surface #FFFFFF)', '#0F172A', '#FFFFFF', 'text'),
  evaluate('Texte principal (--text-main #0F172A) sur fond page (--page-bg #F8FAFC)', '#0F172A', '#F8FAFC', 'text'),
  evaluate('Texte principal (--text-main #0F172A) sur surface subtile (--surface-subtle #F1F5F9)', '#0F172A', '#F1F5F9', 'text'),
  
  // Textes secondaires
  evaluate('Texte secondaire (--text-secondary #334155) sur carte (--surface #FFFFFF)', '#334155', '#FFFFFF', 'text'),
  evaluate('Texte secondaire (--text-secondary #334155) sur fond page (--page-bg #F8FAFC)', '#334155', '#F8FAFC', 'text'),
  evaluate('Texte secondaire (--text-secondary #334155) sur surface subtile (--surface-subtle #F1F5F9)', '#334155', '#F1F5F9', 'text'),

  // Textes atténués (exigence stricte: >= 4.5:1 partout)
  evaluate('Texte atténué (--text-muted #475569) sur carte (--surface #FFFFFF)', '#475569', '#FFFFFF', 'text'),
  evaluate('Texte atténué (--text-muted #475569) sur fond page (--page-bg #F8FAFC)', '#475569', '#F8FAFC', 'text'),
  evaluate('Texte atténué (--text-muted #475569) sur surface subtile (--surface-subtle #F1F5F9)', '#475569', '#F1F5F9', 'text'),

  // Bouton Primaire & Action
  evaluate('Texte bouton primaire (--on-primary #FFFFFF) sur bouton (--primary #1D4ED8)', '#FFFFFF', '#1D4ED8', 'text'),
  evaluate('Texte bouton primaire (--on-primary #FFFFFF) sur survol (--primary-hover #1E40AF)', '#FFFFFF', '#1E40AF', 'text'),
  evaluate('Lien / texte primaire (--primary-text #1D4ED8) sur fond blanc (#FFFFFF)', '#1D4ED8', '#FFFFFF', 'text'),

  // Anneau de Focus (exigence >= 3.0:1 pour indicateur de focus WCAG 2.4.11)
  evaluate('Anneau de focus (--focus-ring #1D4ED8) sur carte (--surface #FFFFFF)', '#1D4ED8', '#FFFFFF', 'ui'),
  evaluate('Anneau de focus (--focus-ring #1D4ED8) sur fond page (--page-bg #F8FAFC)', '#1D4ED8', '#F8FAFC', 'ui'),

  // Bordures (exigence >= 3.0:1)
  evaluate('Bordure forte (--border-strong #64748B) sur champ input (--surface-input #FFFFFF)', '#64748B', '#FFFFFF', 'ui'),
  evaluate('Bordure forte (--border-strong #64748B) sur carte (--surface #FFFFFF)', '#64748B', '#FFFFFF', 'ui'),

  // États sémantiques (Succès, Danger, Avertissement)
  evaluate('Succès texte (--success-text #047857) sur fond badge (--success-surface #ECFDF5)', '#047857', '#ECFDF5', 'text'),
  evaluate('Succès texte (--success-text #047857) sur carte (--surface #FFFFFF)', '#047857', '#FFFFFF', 'text'),
  evaluate('Succès bordure (--success-border #059669) sur fond badge (#ECFDF5)', '#059669', '#ECFDF5', 'ui'),
  evaluate('Succès bordure (--success-border #059669) sur carte (#FFFFFF)', '#059669', '#FFFFFF', 'ui'),

  evaluate('Danger texte (--danger-text #B91C1C) sur fond badge (--danger-surface #FEF2F2)', '#B91C1C', '#FEF2F2', 'text'),
  evaluate('Danger texte (--danger-text #B91C1C) sur carte (--surface #FFFFFF)', '#B91C1C', '#FFFFFF', 'text'),
  evaluate('Danger bordure (--danger-border #DC2626) sur carte (#FFFFFF)', '#DC2626', '#FFFFFF', 'ui'),

  evaluate('Avertissement texte (--warning-text #B45309) sur fond badge (--warning-surface #FFFBEB)', '#B45309', '#FFFBEB', 'text'),
  evaluate('Avertissement texte (--warning-text #B45309) sur carte (--surface #FFFFFF)', '#B45309', '#FFFFFF', 'text'),
  evaluate('Avertissement bordure (--warning-border #D97706) sur carte (#FFFFFF)', '#D97706', '#FFFFFF', 'ui')
];

console.table(lightPairs);

// THEME SOMBRE
console.log('\n--- MODE SOMBRE (Dark) ---');
const darkPairs = [
  // Textes principaux
  evaluate('Texte principal (--text-main #F8FAFC) sur carte sombre (--surface #0F172A)', '#F8FAFC', '#0F172A', 'text'),
  evaluate('Texte principal (--text-main #F8FAFC) sur fond page sombre (--page-bg #090D16)', '#F8FAFC', '#090D16', 'text'),
  evaluate('Texte principal (--text-main #F8FAFC) sur surface élevée (--surface-elevated #1E293B)', '#F8FAFC', '#1E293B', 'text'),

  // Textes secondaires
  evaluate('Texte secondaire (--text-secondary #CBD5E1) sur carte sombre (--surface #0F172A)', '#CBD5E1', '#0F172A', 'text'),
  evaluate('Texte secondaire (--text-secondary #CBD5E1) sur surface élevée (--surface-elevated #1E293B)', '#CBD5E1', '#1E293B', 'text'),
  evaluate('Texte secondaire (--text-secondary #CBD5E1) sur fond page sombre (--page-bg #090D16)', '#CBD5E1', '#090D16', 'text'),

  // Textes atténués (exigence stricte: >= 4.5:1 partout)
  evaluate('Texte atténué (--text-muted #94A3B8) sur carte sombre (--surface #0F172A)', '#94A3B8', '#0F172A', 'text'),
  evaluate('Texte atténué (--text-muted #94A3B8) sur fond page sombre (--page-bg #090D16)', '#94A3B8', '#090D16', 'text'),
  evaluate('Texte atténué (--text-muted #94A3B8) sur surface élevée (--surface-elevated #1E293B)', '#94A3B8', '#1E293B', 'text'),

  // Bouton Primaire & Action en sombre
  evaluate('Texte bouton primaire (--on-primary #FFFFFF) sur bouton (--primary #2563EB)', '#FFFFFF', '#2563EB', 'text'),
  evaluate('Lien / texte primaire (--primary-text #60A5FA) sur carte sombre (#0F172A)', '#60A5FA', '#0F172A', 'text'),
  evaluate('Lien / texte primaire (--primary-text #60A5FA) sur surface élevée (#1E293B)', '#60A5FA', '#1E293B', 'text'),

  // Anneau de Focus sombre (exigence >= 3.0:1 pour indicateur de focus WCAG 2.4.11)
  evaluate('Anneau de focus sombre (--focus-ring #60A5FA) sur surface sombre (--surface #0F172A)', '#60A5FA', '#0F172A', 'ui'),
  evaluate('Anneau de focus sombre (--focus-ring #60A5FA) sur fond page sombre (--page-bg #090D16)', '#60A5FA', '#090D16', 'ui'),

  // Bordures en sombre (exigence >= 3.0:1)
  evaluate('Bordure forte (--border-strong #64748B) sur champ sombre (--surface-input #0F172A)', '#64748B', '#0F172A', 'ui'),
  evaluate('Bordure forte (--border-strong #64748B) sur surface élevée (#1E293B)', '#64748B', '#1E293B', 'ui'),

  // États sémantiques en sombre
  evaluate('Succès texte (--success-text #34D399) sur carte sombre (#0F172A)', '#34D399', '#0F172A', 'text'),
  evaluate('Succès texte (--success-text #34D399) sur surface élevée (#1E293B)', '#34D399', '#1E293B', 'text'),
  evaluate('Succès bordure (--success-border #059669) sur carte sombre (#0F172A)', '#059669', '#0F172A', 'ui'),

  evaluate('Danger texte (--danger-text #F87171) sur carte sombre (#0F172A)', '#F87171', '#0F172A', 'text'),
  evaluate('Danger texte (--danger-text #F87171) sur surface élevée (#1E293B)', '#F87171', '#1E293B', 'text'),
  evaluate('Danger bordure (--danger-border #EF4444) sur carte sombre (#0F172A)', '#EF4444', '#0F172A', 'ui'),

  evaluate('Avertissement texte (--warning-text #FBBF24) sur carte sombre (#0F172A)', '#FBBF24', '#0F172A', 'text'),
  evaluate('Avertissement texte (--warning-text #FBBF24) sur surface élevée (#1E293B)', '#FBBF24', '#1E293B', 'text'),
  evaluate('Avertissement bordure (--warning-border #F59E0B) sur carte sombre (#0F172A)', '#F59E0B', '#0F172A', 'ui')
];

console.table(darkPairs);
