import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import { EleveWithStats } from '../../lib/mockData';
import {
  MessageCircle,
  Copy,
  Check,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';

interface ConfirmBulkRelanceModalProps {
  isOpen: boolean;
  count: number;
  totalAmount: number;
  eleves?: EleveWithStats[];
  ecoleNom?: string;
  onClose: () => void;
}

export const ConfirmBulkRelanceModal: React.FC<ConfirmBulkRelanceModalProps> = ({
  isOpen,
  totalAmount,
  eleves = [],
  ecoleNom = 'Établissement Scolaire',
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [search, setSearch] = useState('');

  // Verrouillage du scroll d'arrière-plan et fermeture sur Échap
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetEleves = eleves.filter((e) => e.statut === 'en_retard' || e.statut === 'partiel' || (e.remaining || 0) > 0);
  const filteredEleves = targetEleves.filter((e) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      e.nom.toLowerCase().includes(term) ||
      e.prenom.toLowerCase().includes(term) ||
      e.classe.toLowerCase().includes(term) ||
      (e.nom_tuteur && e.nom_tuteur.toLowerCase().includes(term)) ||
      (e.telephone_tuteur && e.telephone_tuteur.includes(term))
    );
  });

  const getWhatsAppMessage = (eleve: EleveWithStats) => {
    return (
      `Bonjour M./Mme ${eleve.nom_tuteur || 'le Tuteur'},\n\n` +
      `L'administration de l'établissement ${ecoleNom} vous informe que l'échéance de scolarité de ${eleve.prenom} ${eleve.nom} (${eleve.classe}) présente un solde restant de ${formatMRU(eleve.remaining)}.\n\n` +
      `Merci de bien vouloir vous rapprocher du guichet de l'école ou de régulariser ce montant par virement Bankily / Masrvi.\n\n` +
      `Bien cordialement,\nLa Direction.`
    );
  };

  const handleOpenWhatsApp = (eleve: EleveWithStats) => {
    const rawPhone = eleve.telephone_tuteur ? eleve.telephone_tuteur.replace(/[^0-9]/g, '') : '';
    if (!rawPhone) {
      alert(`Aucun numéro de téléphone renseigné pour le tuteur de ${eleve.prenom} ${eleve.nom}.`);
      return;
    }
    const cleanPhone = rawPhone.startsWith('222') ? rawPhone : `222${rawPhone}`;
    const text = encodeURIComponent(getWhatsAppMessage(eleve));
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCopyMessage = (eleve: EleveWithStats) => {
    const text = getWhatsAppMessage(eleve);
    navigator.clipboard.writeText(text);
    setCopiedId(eleve.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllSummary = () => {
    const summary = targetEleves
      .map(
        (e, idx) =>
          `${idx + 1}. ${e.prenom} ${e.nom} (${e.classe}) - Impayé: ${formatMRU(e.remaining)} - Tuteur: ${e.nom_tuteur || 'Non renseigné'} (${e.telephone_tuteur || 'Sans tél'})`
      )
      .join('\n');

    const header = `LISTE DES RELANCES IMPAYÉS — ${ecoleNom.toUpperCase()} (${targetEleves.length} familles - Total: ${formatMRU(totalAmount)})\n\n`;
    navigator.clipboard.writeText(header + summary);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6 shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Centre de Relances des Familles en Retard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ouverture individuelle et sécurisée des messages WhatsApp pré-remplis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Banner */}
        <div className="p-5 sm:p-6 space-y-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Familles à Relancer
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                {targetEleves.length} dossier(s)
              </span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3 border border-rose-200 dark:border-rose-900/60">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Total des Impayés
              </span>
              <Tooltip content={formatMRU(totalAmount)}>
                <span className="text-lg font-extrabold text-rose-700 dark:text-rose-400 font-mono cursor-help">
                  {formatCompactMRU(totalAmount)}
                </span>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer par élève, classe ou tuteur..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAllSummary}
              className="gap-2 text-xs shrink-0 border-slate-300 dark:border-slate-700"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Liste copiée</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copier tout le récapitulatif</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable list of students */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {filteredEleves.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune famille en retard ne correspond à ce filtre.
            </div>
          ) : (
            filteredEleves.map((eleve) => {
              const hasPhone = Boolean(eleve.telephone_tuteur && eleve.telephone_tuteur.trim().length > 3);
              const isCopied = copiedId === eleve.id;

              return (
                <div
                  key={eleve.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {eleve.prenom} {eleve.nom}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {eleve.classe}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        #{eleve.matricule}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
                      <span>Tuteur: <strong className="text-slate-700 dark:text-slate-300">{eleve.nom_tuteur || 'Non renseigné'}</strong></span>
                      <span>•</span>
                      <span>Tél: <strong className="font-mono text-slate-700 dark:text-slate-300">{eleve.telephone_tuteur || 'Non renseigné'}</strong></span>
                      <span>•</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                        Reste dû : {formatMRU(eleve.remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyMessage(eleve)}
                      className="gap-1.5 text-xs px-2.5 py-1.5 border-slate-200 dark:border-slate-700"
                      title="Copier le message préparé"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copier</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenWhatsApp(eleve)}
                      disabled={!hasPhone}
                      className="gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                      title={hasPhone ? 'Ouvrir WhatsApp pré-rempli' : 'Aucun téléphone disponible'}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 dark:text-slate-400">
            Chaque message s'ouvre dans un nouvel onglet avec le texte officiel pré-rempli.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
