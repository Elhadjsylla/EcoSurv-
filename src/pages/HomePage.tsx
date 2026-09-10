import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/useAuthStore';
import {
  GraduationCap,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Users,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, profile } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                EcoSurv
              </span>
              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="success" className="gap-1 py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Scaffolding Opérationnel
            </Badge>

            {user ? (
              <Button size="sm" variant="outline">
                {profile?.nom || user.email}
              </Button>
            ) : (
              <Button size="sm" variant="primary">
                Se Connecter
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-8 sm:p-12 text-white shadow-xl">
            <div className="relative z-10 max-w-3xl space-y-4">
              <Badge variant="info" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Plateforme SaaS Multi-Tenant — Écoles Privées (Mauritanie)
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Gestion de Scolarité Écoles Privées
              </h1>
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                Bienvenue sur EcoSurv. Le socle frontend est prêt avec React 19, TypeScript,
                Vite, Tailwind CSS v4, Zustand, TanStack Query et Zod.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button variant="primary" size="lg" className="bg-white text-blue-900 hover:bg-slate-100">
                  Découvrir les Modules
                </Button>
                <Button variant="outline" size="lg" className="border-blue-400/40 text-white hover:bg-white/10">
                  Documentation Backend (RLS 77 policies)
                </Button>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          {/* Rôles & Périmètres Métier */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Architecture des Rôles & Sécurité Multi-Tenant
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <CardTitle>Directeur</CardTitle>
                  <CardDescription>
                    Pilotage de l'établissement, suivi du recouvrement et gestion des élèves.
                  </CardDescription>
                </CardHeader>
                <Badge variant="info">Périmètre École complet</Badge>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <CardTitle>Caissier</CardTitle>
                  <CardDescription>
                    Gestion des encaissements (espèces, Bankily, Masrvi, chèques).
                  </CardDescription>
                </CardHeader>
                <Badge variant="success">Paiements & Lecture Élèves</Badge>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <CardTitle>Enseignant</CardTitle>
                  <CardDescription>
                    Saisie des absences, retards et suivi des classes assignées.
                  </CardDescription>
                </CardHeader>
                <Badge variant="warning">Classes Assignées</Badge>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <CardTitle>Parent</CardTitle>
                  <CardDescription>
                    Consultation des échéances, suivi des absences et paiements en ligne.
                  </CardDescription>
                </CardHeader>
                <Badge variant="default">Données Enfant uniquement</Badge>
              </Card>
            </div>
          </div>

          {/* Technical Stack Status */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Stack Technique Frontend Validée
              </CardTitle>
              <CardDescription>
                Vérification de l'intégration des librairies principales.
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Framework</p>
                <p className="text-sm font-bold text-slate-800">React 19</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Langage</p>
                <p className="text-sm font-bold text-slate-800">TypeScript</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Bundler</p>
                <p className="text-sm font-bold text-slate-800">Vite 6</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Styling</p>
                <p className="text-sm font-bold text-slate-800">Tailwind v4</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">État Global</p>
                <p className="text-sm font-bold text-slate-800">Zustand 5</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Serveur & Validation</p>
                <p className="text-sm font-bold text-slate-800">TanStack / Zod</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-400" />
            <span>Connecté au schéma Supabase EcoSurv (Multi-Tenant & RLS)</span>
          </div>
          <div>&copy; 2026 EcoSurv. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
};
