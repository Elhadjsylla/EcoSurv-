import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  School,
  User,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDemoApp: () => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  isOpen,
  onClose,
  onLaunchDemoApp,
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    ecole: '',
    responsable: '',
    role: 'Directeur / Fondateur',
    telephone: '',
    ville: 'Nouakchott — Tevragh-Zeina',
    effectif: '250 à 500 élèves',
  });

  // Verrouillage du scroll propre et restauration exacte de la position
  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarde de la position de scroll exacte avant ouverture
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;

    // Verrouillage du scroll sans saut de page
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSubmitted(false);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      // Restauration des styles inline d'origine
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;

      // Restauration de la position exacte sans animation de saut
      window.scrollTo(0, scrollY);
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Lance les confettis
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignorer si indisponible
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-scale-in overflow-y-auto"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-lg my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                <School className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Accompagnement Établissement
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Démarrer un essai gratuit 14 jours
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Activez votre espace en 24h avec vos barèmes scolaires. Un expert EcoSurv à Nouakchott vous accompagne sans engagement.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom de l'école ou groupe scolaire *
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Complexe Scolaire Al-Baraka"
                    value={formData.ecole}
                    onChange={(e) => setFormData({ ...formData, ecole: e.target.value })}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom & Prénom du responsable *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="M. Cheikh Diallo"
                      value={formData.responsable}
                      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone WhatsApp / Mobile *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+222 45 25 00 00"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ville & Quartier
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Nouakchott — Tevragh-Zeina">Nouakchott — Tevragh-Zeina</option>
                      <option value="Nouakchott — Ksar">Nouakchott — Ksar</option>
                      <option value="Nouakchott — Sebkha / El Mina">Nouakchott — Sebkha / El Mina</option>
                      <option value="Nouakchott — Dar Naïm / Toujounine">Nouakchott — Toujounine</option>
                      <option value="Nouadhibou">Nouadhibou</option>
                      <option value="Rosso">Rosso</option>
                      <option value="Autre Wilaya">Autre Wilaya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effectif d'élèves
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      value={formData.effectif}
                      onChange={(e) => setFormData({ ...formData, effectif: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Moins de 200 élèves">Moins de 200 élèves</option>
                      <option value="200 à 500 élèves">200 à 500 élèves</option>
                      <option value="500 à 1 000 élèves">500 à 1 000 élèves</option>
                      <option value="Plus de 1 000 élèves">Plus de 1 000 élèves (Multi-sites)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <span>Confirmer la demande d'essai gratuit</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>100% Confidentiel • Conforme réglementation APDP Mauritanie</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-3 w-3" />
                Demande transmise avec succès !
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                Merci {formData.responsable || 'cher Directeur'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Notre conseiller spécialiste des établissements scolaires vous contactera sur WhatsApp au{' '}
                <strong className="text-slate-900 dark:text-white">{formData.telephone || '+222 ...'}</strong>{' '}
                sous 30 minutes pour initialiser votre démonstration.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleResetAndClose();
                  onLaunchDemoApp();
                }}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <span>Accéder immédiatement à la démo interactive en ligne</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
