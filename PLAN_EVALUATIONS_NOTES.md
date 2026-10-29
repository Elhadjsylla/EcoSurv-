# Architecture et Sécurité du Module Évaluations & Notes (Planification Future)

> **Document de cadrage d'architecture - Ne pas exécuter de migration SQL dans cette passe.**

---

## 1. Problématique de Sécurité RLS identifiée lors de l'audit

Une politique RLS naïve basée uniquement sur `ecole_id` (ex. `ecole_id = (SELECT ecole_id FROM profils WHERE id = auth.uid())`) permettrait à n'importe quel parent d'une école de requêter directement et de lire l'ensemble des notes individuelles de tous les élèves de l'école. Cela constitue une brèche de confidentialité inacceptable.

---

## 2. Principes Fondamentaux de Confidentialité

1. **Isolation stricte des notes individuelles** :
   - Un compte parent ne doit **JAMAIS** pouvoir lire la note individuelle d'un élève qui n'est pas le sien.
   - La vérification doit passer par la table de liaison `parents_eleves` liant `parent_id = auth.uid()` à `eleve_id`.

2. **Calcul de la Moyenne de Classe** :
   - La moyenne de classe ne doit **JAMAIS** être calculée côté client en téléchargeant les notes de toute la classe.
   - Les parents ne doivent pas avoir de droit `SELECT` sur la table brute des notes de la classe.
   - Le calcul de la moyenne de classe doit être encapsulé côté serveur dans une **vue sécurisée (View)** ou une **fonction Postgres en `SECURITY DEFINER`** (ou fonction RPC d'agrégation) qui renvoie uniquement la valeur scalaire de la moyenne agrégée pour la classe et la période, sans jamais exposer les lignes de notes individuelles d'autrui.

---

## 3. Schéma Cible Recommandé

### 3.1. Politique RLS pour la table des notes (`notes`)

```sql
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Les membres du personnel (directeur, enseignant, etc.) ont accès aux notes de leur école/classe
CREATE POLICY "Personnel acces notes ecole"
  ON public.notes
  FOR ALL
  TO authenticated
  USING (
    ecole_id = (SELECT ecole_id FROM public.profils WHERE id = auth.uid())
    AND (SELECT role FROM public.profils WHERE id = auth.uid()) IN ('directeur', 'enseignant', 'surveillant')
  );

-- Les parents n'ont accès qu'aux notes de LEURS propres enfants
CREATE POLICY "Parent acces notes enfants uniquement"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (
    eleve_id IN (
      SELECT pe.eleve_id
      FROM public.parents_eleves pe
      WHERE pe.parent_id = auth.uid()
    )
  );
```

### 3.2. Fonction RPC / Vue d'agrégation pour la moyenne de classe

```sql
CREATE OR REPLACE FUNCTION public.get_moyenne_classe(
  p_classe_id UUID,
  p_periode TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ecole_id UUID;
  v_caller_ecole_id UUID;
  v_is_parent_of_class BOOLEAN;
  v_moyenne NUMERIC;
BEGIN
  -- Vérifier l'école de l'utilisateur connecté
  SELECT ecole_id INTO v_caller_ecole_id FROM public.profils WHERE id = auth.uid();
  
  -- Vérifier que l'utilisateur est soit membre du personnel de cette école,
  -- soit parent d'un élève inscrit dans cette classe
  SELECT EXISTS (
    SELECT 1 FROM public.eleves e
    JOIN public.parents_eleves pe ON pe.eleve_id = e.id
    WHERE e.classe_id = p_classe_id
      AND pe.parent_id = auth.uid()
      AND e.ecole_id = v_caller_ecole_id
  ) OR EXISTS (
    SELECT 1 FROM public.profils p
    WHERE p.id = auth.uid()
      AND p.ecole_id = v_caller_ecole_id
      AND p.role IN ('directeur', 'enseignant', 'surveillant')
  ) INTO v_is_parent_of_class;

  IF NOT v_is_parent_of_class THEN
    RETURN NULL;
  END IF;

  -- Calculer la moyenne agrégée sans exposer les notes
  SELECT ROUND(AVG(note), 2)
  INTO v_moyenne
  FROM public.notes n
  JOIN public.eleves e ON e.id = n.eleve_id
  WHERE e.classe_id = p_classe_id
    AND n.periode = p_periode
    AND e.ecole_id = v_caller_ecole_id;

  RETURN v_moyenne;
END;
$$;
```

---

## 4. Statut Actuel

- Aucune table `notes` n'est créée dans cette passe MVP.
- Les états vides (`—`) et messages explicites (« Aucune note saisie ce trimestre ») sont appliqués côté interface, garantissant le respect de `ECOSURV_RULES.md` (zéro donnée inventée, zéro note fictive, zéro note d'une autre école).
