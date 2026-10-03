import { useState } from 'react';
import { AdaptiveTable, AdaptiveColumn } from './AdaptiveTable';
import { Phone, MoreHorizontal, ShieldCheck, UserCheck, Edit3 } from 'lucide-react';

interface DemoStaffMember {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  roleBadge: string;
  email: string;
  telephone: string;
  dateAjout: string;
  statut: 'Actif' | 'En attente';
}

const SAMPLE_STAFF: DemoStaffMember[] = [
  {
    id: '1',
    nom: 'Diallo',
    prenom: 'Mamadou',
    role: 'Directeur Général',
    roleBadge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    email: 'm.diallo@ecole-excellence.mr',
    telephone: '+222 45 25 11 00',
    dateAjout: '12/09/2025',
    statut: 'Actif',
  },
  {
    id: '2',
    nom: 'Kane',
    prenom: 'Aïssata',
    role: 'Comptable Principale',
    roleBadge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    email: 'a.kane@ecole-excellence.mr',
    telephone: '+222 36 12 88 44',
    dateAjout: '01/10/2025',
    statut: 'Actif',
  },
  {
    id: '3',
    nom: 'Ba',
    prenom: 'Ousmane',
    role: 'Enseignant Mathématiques',
    roleBadge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    email: 'o.ba@ecole-excellence.mr',
    telephone: '+222 22 90 77 11',
    dateAjout: '15/10/2025',
    statut: 'En attente',
  },
];

export function AdaptiveTableDemo() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (item: DemoStaffMember) => {
    setSelectedIds((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === SAMPLE_STAFF.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(SAMPLE_STAFF.map((s) => s.id));
    }
  };

  const columns: AdaptiveColumn<DemoStaffMember>[] = [
    {
      id: 'avatar',
      header: '',
      cardRole: 'avatar',
      className: 'w-10 pr-0',
      render: (item) => {
        const initials = `${item.prenom[0]}${item.nom[0]}`.toUpperCase();
        return (
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            {initials}
          </div>
        );
      },
    },
    {
      id: 'nom',
      header: 'Collaborateur',
      cardRole: 'title',
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white text-sm">
          {item.prenom} {item.nom}
        </span>
      ),
    },
    {
      id: 'role',
      header: 'Rôle & Habilitation',
      cardRole: 'key-fact',
      cardLabel: 'Habilitation',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${item.roleBadge}`}
        >
          <ShieldCheck className="w-3 h-3 shrink-0" />
          {item.role}
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Courriel Pro',
      cardRole: 'subtitle',
      className: 'hidden lg:table-cell',
      render: (item) => item.email,
    },
    {
      id: 'telephone',
      header: 'Téléphone',
      cardRole: 'key-fact',
      cardLabel: 'Contact direct',
      render: (item) => (
        <span className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
          {item.telephone}
        </span>
      ),
    },
    {
      id: 'dateAjout',
      header: 'Date d\'ajout',
      cardRole: 'key-fact',
      cardLabel: 'Inscription',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {item.dateAjout}
        </span>
      ),
    },
    {
      id: 'statut',
      header: 'Statut RLS',
      cardRole: 'badge',
      align: 'center',
      render: (item) => {
        const isActif = item.statut === 'Actif';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs border ${
              isActif
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActif ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {item.statut}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cardRole: 'action',
      align: 'right',
      render: (item) => (
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </button>
          <button
            type="button"
            aria-label={`Options pour ${item.prenom} ${item.nom}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Démonstration Isolée : AdaptiveTable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tableau desktop & tablette (≥768px) ↔ Cartes optimisées au pouce sur mobile (&lt;768px).
          </p>
        </div>
      </div>

      <AdaptiveTable
        data={SAMPLE_STAFF}
        columns={columns}
        keyExtractor={(item) => item.id}
        selectable={true}
        isSelected={(item) => selectedIds.includes(item.id)}
        onToggleSelect={toggleSelect}
        isAllSelected={selectedIds.length === SAMPLE_STAFF.length && SAMPLE_STAFF.length > 0}
        onToggleSelectAll={toggleSelectAll}
        showViewToggle={true}
      />
    </div>
  );
}
