import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compterDeclarationsEnAttente,
  listerDeclarationsEcole,
  listerReperesPresence,
  MESSAGE_CHARGEMENT,
  type DeclarationEcole,
  type FiltreDeclarations,
  type ReperePresence,
} from '../lib/declarationsEcole';

/** Événement émis après un traitement : les compteurs se rechargent depuis la base. */
export const EVENEMENT_DECLARATIONS = 'ecosurv:declarations-changed';
export const notifierDeclarationsChangees = () => window.dispatchEvent(new Event(EVENEMENT_DECLARATIONS));

export type EtatChargement = 'chargement' | 'pret' | 'erreur';

/** Déclarations visibles par l'utilisateur (la base filtre), les plus récentes d'abord. */
export function useDeclarationsAbsence(filtre: FiltreDeclarations) {
  const [etat, setEtat] = useState<EtatChargement>('chargement');
  const [liste, setListe] = useState<DeclarationEcole[]>([]);
  const [erreur, setErreur] = useState('');
  const numero = useRef(0);

  const recharger = useCallback(
    async (silencieux = false) => {
      const n = ++numero.current;
      if (!silencieux) setEtat('chargement');
      try {
        const lignes = await listerDeclarationsEcole(filtre);
        if (n !== numero.current) return;
        setListe(lignes);
        setEtat('pret');
      } catch (e) {
        if (n !== numero.current) return;
        setErreur(e instanceof Error && e.message ? e.message : MESSAGE_CHARGEMENT);
        setEtat('erreur');
      }
    },
    [filtre]
  );

  useEffect(() => {
    setListe([]);
    void recharger();
  }, [recharger]);

  return { etat, liste, erreur, recharger };
}

/**
 * Nombre de déclarations en attente. `null` tant que la base n'a pas répondu (ou en cas d'erreur) :
 * aucune pastille n'est alors affichée. Rechargé à l'ouverture, au retour de l'onglet et après chaque traitement.
 */
export function useDeclarationsEnAttenteCount(actif = true): number | null {
  const [count, setCount] = useState<number | null>(null);
  const numero = useRef(0);

  const charger = useCallback(async () => {
    const n = ++numero.current;
    try {
      const c = await compterDeclarationsEnAttente();
      if (n === numero.current) setCount(c);
    } catch {
      if (n === numero.current) setCount(null);
    }
  }, []);

  useEffect(() => {
    if (!actif) return;
    void charger();
    const auRetour = () => {
      if (document.visibilityState === 'visible') void charger();
    };
    document.addEventListener('visibilitychange', auRetour);
    window.addEventListener(EVENEMENT_DECLARATIONS, charger);
    return () => {
      numero.current++;
      document.removeEventListener('visibilitychange', auRetour);
      window.removeEventListener(EVENEMENT_DECLARATIONS, charger);
    };
  }, [actif, charger]);

  return count;
}

/**
 * Repères de la feuille d'appel : déclarations acceptées ou en attente qui couvrent la date.
 * Une erreur n'est jamais bloquante : la feuille fonctionne alors sans repère.
 */
export function useDeclarationsReperes(eleveIds: string[], date: string): Record<string, ReperePresence> {
  const cle = eleveIds.join(',');
  const [reperes, setReperes] = useState<Record<string, ReperePresence>>({});

  useEffect(() => {
    let annule = false;
    setReperes({});
    if (!cle || !date) return;
    listerReperesPresence(cle.split(','), date)
      .then((lignes) => {
        if (annule) return;
        const parEleve: Record<string, ReperePresence> = {};
        for (const l of lignes) {
          // Une déclaration acceptée l'emporte sur une déclaration en attente.
          if (!parEleve[l.eleve_id] || (l.statut === 'acceptee' && parEleve[l.eleve_id].statut !== 'acceptee')) {
            parEleve[l.eleve_id] = l;
          }
        }
        setReperes(parEleve);
      })
      .catch(() => {
        if (!annule) setReperes({});
      });
    return () => {
      annule = true;
    };
  }, [cle, date]);

  return reperes;
}
