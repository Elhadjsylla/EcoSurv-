import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguageStore, I18N_PAUSED } from '../../i18n/useLanguageStore';
import { Language } from '../../i18n/translations';

interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const LanguageSelector: React.FC<{ variant?: 'light' | 'dark' | 'header' }> = () => {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    if (I18N_PAUSED) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Masquer le sélecteur si le projet multilingue est en pause
  if (I18N_PAUSED) return null;

  return (
    <div ref={containerRef} className="relative inline-block text-left z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-sm border border-subtle bg-surface hover:bg-surface-subtle text-main text-xs font-bold transition-all shadow-xs cursor-pointer focus-halo"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline font-semibold">{currentLang.label}</span>
        <span className="sm:hidden uppercase font-bold">{currentLang.code}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-md border border-subtle bg-surface-elevated p-1.5 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-150">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-2.5 py-2 rounded-sm text-xs font-semibold transition-colors cursor-pointer focus-halo ${
                  isSelected
                    ? 'bg-surface-subtle text-primary-text font-bold border border-subtle'
                    : 'text-secondary hover:bg-surface-subtle hover:text-main'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary-text" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
