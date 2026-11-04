import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Check, RotateCw, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/admin/adminUi';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ToastNotification } from '../components/ui/ToastNotification';
import { MobileCard, MobileCardList, CardAction } from '../components/ui/MobileCards';
import { StatutPastille } from '../components/declarations/StatutPastille';
import { TraiterDeclarationModal, type ActionTraitement } from '../components/declarations/TraiterDeclarationModal';
import { DURATION, EASE, staggerDelay, useMotionPrefs } from '../lib/motion';
import { MOTIFS, formatPeriode } from '../lib/declarationsAbsence';
import { LIMITE_TRAITEES, dateLocaleFr, type DeclarationEcole, type FiltreDeclarations } from '../lib/declarationsEcole';
import { notifierDeclarationsChangees, useDeclarationsAbsence } from '../hooks/useDeclarationsAbsence';

const motifLabel = (m: string) => MOTIFS.find((x) => x.value === m)?.label ?? m;
const capitaliser = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const periode = (d: DeclarationEcole) => capitaliser(formatPeriode(d.date_debut, d.date_fin));
const nomEleve = (d: DeclarationEcole) => (d.eleve ? `${d.eleve.prenom} ${d.eleve.nom}` : 'Élève');
/** Si la base ne laisse pas lire le nom du parent, aucun nom n'est inventé. */
const declarePar = (d: DeclarationEcole) => d.declarePar ?? 'Un tuteur';

const TH = 'px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted';
const TD = 'px-3 py-3 align-top text-sm text-main';

/**
 * Déclarations d'absence envoyées par les parents. Même page pour le directeur et l'enseignant :
 * la base décide de ce que chacun voit et peut traiter.
 */
export const DeclarationsAbsencePage: React.FC = () => {
  const { reduce } = useMotionPrefs();
  const [filtre, setFiltre] = useState<FiltreDeclarations>('a_traiter');
  const { etat, liste, erreur, recharger } = useDeclarationsAbsence(filtre);
  const [cible, setCible] = useState<{ declaration: DeclarationEcole; action: ActionTraitement } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const aTraiter = filtre === 'a_traiter';

  const apresTraitement = async (message: string, type: 'success' | 'warning') => {
    setCible(null);
    await recharger(true);
    notifierDeclarationsChangees();
    setToast({ message, type });
  };

  const actions = (d: DeclarationEcole) => (
    <>
      <CardAction variant="primary" icon={<Check className="h-4 w-4" aria-hidden="true" />} onClick={() => setCible({ declaration: d, action: 'acceptee' })} aria-label={`Accepter la déclaration de ${nomEleve(d)}`}>
        Accepter
      </CardAction>
      <CardAction icon={<X className="h-4 w-4" aria-hidden="true" />} onClick={() => setCible({ declaration: d, action: 'refusee' })} aria-label={`Refuser la déclaration de ${nomEleve(d)}`}>
        Refuser
      </CardAction>
    </>
  );

  const traitement = (d: DeclarationEcole) => (
    <div className="space-y-1">
      {d.reponse ? <p className="break-words text-sm text-main">« {d.reponse} »</p> : <p className="text-xs text-muted">Pas de mot pour le parent.</p>}
      {d.traite_le && <p className="text-xs text-muted">Traitée le {dateLocaleFr(d.traite_le)}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-main sm:p-8 lg:p-10">
      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-[60] sm:inset-x-auto sm:bottom-6 sm:right-6">
          <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-main sm:text-3xl">Déclarations d’absence</h1>
          <p className="mt-1.5 text-sm text-muted">
            Les absences signalées par les parents. Acceptez ou refusez, avec un mot pour la famille si vous le souhaitez.
          </p>
        </div>
        <SegmentedControl
          label="Filtre des déclarations"
          value={filtre}
          onChange={setFiltre}
          options={[
            { value: 'a_traiter', label: 'À traiter' },
            { value: 'traitees', label: 'Traitées' },
          ]}
          className="sm:w-auto"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {etat === 'chargement' && (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Chargement des déclarations">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-md border border-subtle p-4">
                <Skeleton className="mb-3 h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {etat === 'erreur' && (
          <div className="p-4">
            <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-danger-border bg-danger-surface p-4">
              <div className="flex items-start gap-2 text-sm text-danger-text">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{erreur}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => void recharger()}>
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Réessayer
              </Button>
            </div>
          </div>
        )}

        {etat === 'pret' && liste.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <CheckCircle2 className="h-6 w-6 text-muted" aria-hidden="true" />
            <p className="text-sm font-semibold text-main">{aTraiter ? 'Aucune déclaration à traiter' : 'Aucune déclaration traitée'}</p>
            <p className="max-w-xs text-xs text-muted">
              {aTraiter
                ? 'Quand un parent signalera une absence, elle apparaîtra ici.'
                : 'Les déclarations acceptées ou refusées apparaîtront ici.'}
            </p>
          </div>
        )}

        {etat === 'pret' && liste.length > 0 && (
          <>
            <MobileCardList label="Déclarations d’absence">
              {liste.map((d, i) => (
                <MobileCard
                  key={d.id}
                  index={i}
                  title={nomEleve(d)}
                  subtitle={d.eleve?.classe || undefined}
                  badge={<StatutPastille statut={d.statut} />}
                  facts={[
                    { label: 'Période', value: periode(d), wide: true },
                    { label: 'Motif', value: motifLabel(d.motif) },
                    { label: 'Envoyée le', value: dateLocaleFr(d.created_at) },
                    { label: 'Déclarée par', value: declarePar(d), wide: true },
                    ...(d.commentaire ? [{ label: 'Commentaire', value: d.commentaire, wide: true }] : []),
                    ...(!aTraiter ? [{ label: 'Réponse de l’école', value: traitement(d), wide: true }] : []),
                  ]}
                  actions={aTraiter ? actions(d) : undefined}
                />
              ))}
            </MobileCardList>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse">
                <thead className="border-b border-subtle bg-surface-subtle">
                  <tr>
                    <th className={TH}>Élève</th>
                    <th className={TH}>Période</th>
                    <th className={TH}>Motif</th>
                    <th className={TH}>Commentaire</th>
                    <th className={TH}>Déclarée par</th>
                    <th className={TH}>{aTraiter ? 'Statut et traitement' : 'Statut et réponse de l’école'}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {liste.map((d, i) => (
                      <motion.tr
                        key={d.id}
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: reduce ? 0 : DURATION.fast } }}
                        transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out, delay: reduce ? 0 : staggerDelay(i) }}
                        className="border-b border-subtle last:border-b-0"
                      >
                        <td className={TD}>
                          <div className="font-semibold">{nomEleve(d)}</div>
                          {d.eleve?.classe && <div className="text-xs text-muted">{d.eleve.classe}</div>}
                        </td>
                        <td className={TD}>{periode(d)}</td>
                        <td className={TD}>{motifLabel(d.motif)}</td>
                        <td className={`${TD} max-w-[14rem] break-words`}>{d.commentaire || <span className="text-muted">—</span>}</td>
                        <td className={TD}>
                          <div>{declarePar(d)}</div>
                          <div className="text-xs text-muted">Envoyée le {dateLocaleFr(d.created_at)}</div>
                        </td>
                        <td className={`${TD} min-w-[10rem]`}>
                          <StatutPastille statut={d.statut} />
                          <div className="mt-2">
                            {aTraiter ? <div className="flex flex-wrap gap-2">{actions(d)}</div> : traitement(d)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {!aTraiter && liste.length >= LIMITE_TRAITEES && (
              <p className="border-t border-subtle px-4 py-3 text-xs text-muted">
                Les {LIMITE_TRAITEES} déclarations traitées les plus récentes sont affichées.
              </p>
            )}
          </>
        )}
      </Card>

      <TraiterDeclarationModal
        declaration={cible?.declaration ?? null}
        action={cible?.action ?? 'acceptee'}
        onClose={() => setCible(null)}
        onTraitee={() => void apresTraitement(cible?.action === 'refusee' ? 'Déclaration refusée.' : 'Déclaration acceptée.', 'success')}
        onDejaTraitee={(message) => void apresTraitement(message, 'warning')}
      />
    </div>
  );
};
