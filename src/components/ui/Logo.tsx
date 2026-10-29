import React from 'react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/useThemeStore';
import logoCouleurUrl from '../../assets/brand/logo-couleur.svg';
import logoNoirUrl from '../../assets/brand/logo-noir.svg';
import logoInverseUrl from '../../assets/brand/logo-inverse.svg';
import iconeUrl from '../../assets/brand/icone.svg';

export type LogoVariant = 'couleur' | 'noir' | 'inverse';

export interface LogoProps {
  /**
   * Variante du logo complet :
   * - 'couleur' : symbole bleu #1D4ED8 + mot bleu nuit #0F172A (fonds clairs)
   * - 'noir' : monochrome noir #000000
   * - 'inverse' : blanc #FFFFFF (fonds sombres)
   * Si omis, bascule automatiquement selon le thème actif ('inverse' en sombre, 'couleur' en clair).
   */
  variant?: LogoVariant;
  /** Hauteur en pixels (minimum garanti : 16 px). Défaut : 28 px. */
  height?: number;
  className?: string;
}

const LOGO_SOURCES: Record<LogoVariant, string> = {
  couleur: logoCouleurUrl,
  noir: logoNoirUrl,
  inverse: logoInverseUrl,
};

export const Logo: React.FC<LogoProps> = ({ variant, height = 28, className }) => {
  const theme = useThemeStore((s) => s.theme);
  const resolvedVariant: LogoVariant = variant ?? (theme === 'dark' ? 'inverse' : 'couleur');
  const safeHeight = Math.max(16, height);

  return (
    <img
      src={LOGO_SOURCES[resolvedVariant]}
      alt="EcoSurv"
      draggable={false}
      style={{ height: `${safeHeight}px`, minHeight: '16px', width: 'auto' }}
      className={cn('block shrink-0 select-none', className)}
    />
  );
};

export interface LogoIconeProps {
  /** Taille (largeur et hauteur) de l'icône carrée en pixels (minimum garanti : 16 px). Défaut : 32 px. */
  size?: number;
  /** Alias optionnel de size en pixels (minimum garanti : 16 px). */
  height?: number;
  className?: string;
}

export const LogoIcone: React.FC<LogoIconeProps> = ({ size, height, className }) => {
  const rawSize = size ?? height ?? 32;
  const safeSize = Math.max(16, rawSize);

  return (
    <img
      src={iconeUrl}
      alt="EcoSurv"
      width={safeSize}
      height={safeSize}
      draggable={false}
      style={{
        width: `${safeSize}px`,
        height: `${safeSize}px`,
        minWidth: '16px',
        minHeight: '16px',
      }}
      className={cn('block shrink-0 select-none', className)}
    />
  );
};

