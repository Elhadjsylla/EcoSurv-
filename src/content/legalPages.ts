export type LegalSlug = 'mentions-legales' | 'cgu' | 'confidentialite' | 'cookies';

export interface LegalSection {
  /**
   * Titre de la section (absent pour un paragraphe d'introduction ou de conclusion).
   * Dans un paragraphe, [[texte|/chemin]] crée un lien interne.
   */
  title?: string;
  paragraphs?: string[];
  /** Liste à puces affichée après les paragraphes. */
  list?: string[];
}

export interface LegalPageContent {
  slug: LegalSlug;
  /** Chemin public de la page. */
  path: string;
  title: string;
  /** Libellé court utilisé dans les liens. */
  linkLabel: string;
  updatedAt: string;
  sections: LegalSection[];
}

/** Version des conditions enregistrée à l'inscription (cgu_version). */
export const CGU_VERSION = '2026-11-03';

const UPDATED_AT = '3 novembre 2026';

export const LEGAL_PAGES: LegalPageContent[] = [
  {
    slug: 'mentions-legales',
    path: '/mentions-legales',
    title: 'Mentions légales',
    linkLabel: 'Mentions légales',
    updatedAt: UPDATED_AT,
    sections: [
      {
        paragraphs: [
          "EcoSurv est un service en ligne de gestion de scolarité pour les établissements scolaires de Mauritanie, édité par une personne physique.",
        ],
      },
      {
        title: 'Éditeur et directeur de la publication',
        paragraphs: [
          "El Hadj Sylla Mbengue, personne physique, Nouakchott, Mauritanie. Aucune société n'est à ce jour immatriculée pour exploiter le service.",
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          "elhadjsylla667@gmail.com. Toute demande, réclamation ou question sur les données personnelles peut y être envoyée.",
        ],
      },
      {
        title: 'Nom de domaine',
        paragraphs: ['ecosurv.app, enregistré auprès de Vercel Inc.'],
      },
      {
        title: 'Hébergement du site',
        paragraphs: ['Vercel Inc., États-Unis, qui sert les pages du site.'],
      },
      {
        title: 'Hébergement des données',
        paragraphs: [
          'Supabase Inc., base de données et authentification, région Union européenne (Irlande, eu-west-1).',
        ],
      },
      {
        title: 'Envoi des e-mails',
        paragraphs: [
          "Resend, qui transmet les e-mails de connexion et d'invitation envoyés depuis ecosurv.app.",
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          "Le nom EcoSurv, le logo, les textes et le code du site appartiennent à l'éditeur. Les logos et marques de services de paiement mobile cités sur le site appartiennent à leurs propriétaires respectifs ; EcoSurv n'est pas affilié à ces services.",
        ],
      },
      {
        title: 'Signaler un contenu',
        paragraphs: ['Tout contenu illicite peut être signalé à elhadjsylla667@gmail.com.'],
      },
    ],
  },
  {
    slug: 'cgu',
    path: '/cgu',
    title: "Conditions générales d'utilisation",
    linkLabel: "Conditions d'utilisation",
    updatedAt: UPDATED_AT,
    sections: [
      {
        paragraphs: [
          "EcoSurv fournit aux établissements scolaires un outil pour suivre les élèves, les échéances de scolarité, les encaissements et les absences. En créant un compte ou en utilisant le service, l'établissement et ses utilisateurs acceptent les présentes conditions.",
        ],
      },
      {
        title: '1. Le service',
        paragraphs: [
          "EcoSurv est un outil de gestion et de suivi. Les paiements de scolarité sont encaissés par l'établissement, au guichet ou par ses propres moyens de paiement mobile. EcoSurv enregistre et organise ces paiements, édite des reçus numérotés, mais ne détient pas les fonds, n'est pas un établissement de paiement et n'exécute aucune transaction.",
        ],
      },
      {
        title: '2. Comptes et rôles',
        paragraphs: [
          "Le directeur crée l'établissement, l'active avec un code envoyé à son adresse e-mail, puis invite le personnel (caissier, enseignant) et les parents. Chaque rôle a des droits différents. Le directeur est responsable des personnes qu'il invite et des droits qu'il leur donne. Chaque utilisateur garde son mot de passe secret et ne le partage pas.",
        ],
      },
      {
        title: "3. Obligations de l'établissement",
        paragraphs: [
          "L'établissement s'engage à saisir des informations exactes, à n'enregistrer que des données dont il a le droit de disposer, à informer les parents et le personnel de l'usage de leurs données, et à ne pas utiliser le service de manière illicite ou pour tenter d'accéder aux données d'un autre établissement.",
        ],
      },
      {
        title: '4. Données des élèves',
        paragraphs: [
          "Pour les données des élèves, des parents et du personnel saisies dans l'outil, l'établissement décide des finalités et reste responsable de leur usage ; EcoSurv les traite pour son compte, selon la politique de confidentialité.",
        ],
      },
      {
        title: '5. Tarifs',
        paragraphs: [
          "Les tarifs en vigueur sont ceux affichés dans la [[section Tarifs|/#tarifs]] de la page d'accueil au moment de la souscription.",
        ],
      },
      {
        title: '6. Disponibilité',
        paragraphs: [
          "EcoSurv fait son possible pour que le service soit accessible en continu, mais ne garantit pas une disponibilité sans interruption. Des maintenances et incidents peuvent survenir.",
        ],
      },
      {
        title: '7. Responsabilité',
        paragraphs: [
          "EcoSurv n'est pas responsable des erreurs de saisie de l'établissement, de l'usage que ses utilisateurs font de leurs identifiants, ni des pertes de revenus liées à une indisponibilité. Rien dans ces conditions ne limite une responsabilité qui ne peut l'être selon la loi.",
        ],
      },
      {
        title: '8. Suspension et fin',
        paragraphs: [
          "L'éditeur peut suspendre un compte en cas d'usage contraire aux présentes conditions ou de risque pour la sécurité du service. L'établissement peut cesser d'utiliser le service à tout moment ; la gestion de ses données à la fin est décrite dans la politique de confidentialité.",
        ],
      },
      {
        title: '9. Modifications',
        paragraphs: [
          "Ces conditions peuvent évoluer. La version en vigueur est celle publiée sur le site, avec sa date de mise à jour.",
        ],
      },
      {
        title: '10. Droit applicable',
        paragraphs: ['Ces conditions sont régies par le droit mauritanien.'],
      },
    ],
  },
  {
    slug: 'confidentialite',
    path: '/confidentialite',
    title: 'Politique de confidentialité',
    linkLabel: 'Confidentialité',
    updatedAt: UPDATED_AT,
    sections: [
      {
        paragraphs: [
          "EcoSurv ne traite que les données nécessaires pour faire fonctionner la gestion de scolarité d'un établissement, ne les vend pas et ne les utilise pas pour de la publicité.",
        ],
      },
      {
        title: 'Qui est responsable',
        paragraphs: [
          "Pour les comptes d'utilisateurs et la sécurité du service, le responsable est l'éditeur, El Hadj Sylla Mbengue (elhadjsylla667@gmail.com). Pour les données des élèves, des parents et du personnel saisies par un établissement, c'est l'établissement qui décide de leur usage ; EcoSurv les traite pour son compte.",
        ],
      },
      {
        title: 'Données traitées',
        list: [
          'Compte : nom, prénom, adresse e-mail, téléphone, rôle, établissement.',
          'Élèves : nom, classe, matricule, coordonnées du tuteur légal.',
          "Scolarité : échéances, paiements (montant, mode, référence de l'opérateur), reçus, absences.",
          "Journal de sécurité : actions sensibles (activation d'établissement, changements de droits), type de navigateur lors des connexions.",
        ],
      },
      {
        title: 'Pourquoi',
        paragraphs: [
          "Créer et sécuriser les comptes, gérer les élèves, les échéances, les encaissements et les absences, envoyer les e-mails de connexion et d'invitation, protéger le service contre les abus.",
        ],
      },
      {
        title: 'Qui voit quoi',
        paragraphs: [
          "Un établissement ne voit que ses propres données. Au sein d'un établissement, le directeur voit tout, le caissier voit l'encaissement, l'enseignant voit ses classes et les parents voient leurs enfants.",
        ],
      },
      {
        title: 'Sous-traitants',
        paragraphs: [
          "Supabase (base de données et connexion, région Union européenne, Irlande), Vercel (hébergement des pages du site), Resend (envoi des e-mails). Ces services peuvent se situer hors de Mauritanie, ce qui constitue un transfert de données à l'étranger. Les liens WhatsApp ouvrent l'application WhatsApp à votre demande, avec un message prérempli : WhatsApp est alors soumis à ses propres conditions.",
        ],
      },
      {
        title: 'Durée de conservation',
        paragraphs: [
          "Les données sont conservées pendant l'utilisation du service. À la fin, l'établissement peut demander l'export puis la suppression de ses données, traitées dans un délai de 90 jours.",
        ],
      },
      {
        title: 'Vos droits',
        paragraphs: [
          "Toute personne peut demander l'accès à ses données, leur correction, leur suppression ou s'opposer à leur usage, en écrivant à elhadjsylla667@gmail.com. Pour les données des élèves et des parents, la demande peut aussi être adressée à l'établissement concerné.",
        ],
      },
      {
        title: 'Enfants',
        paragraphs: [
          "Les données des élèves, souvent mineurs, ne sont saisies que par leur établissement, qui est responsable d'en informer leurs tuteurs. Les élèves n'ont pas de compte EcoSurv.",
        ],
      },
      {
        title: 'Sécurité',
        paragraphs: [
          "Connexion chiffrée (HTTPS), mots de passe jamais lisibles, accès limités par établissement et par rôle, code d'activation vérifié côté serveur. Aucun système n'est infaillible : en cas d'incident touchant des données, les établissements concernés en seront informés.",
        ],
      },
      {
        title: 'Mises à jour',
        paragraphs: ["La version en vigueur est celle publiée sur le site, avec sa date."],
      },
    ],
  },
  {
    slug: 'cookies',
    path: '/cookies',
    title: 'Cookies et stockage local',
    linkLabel: 'Cookies',
    updatedAt: UPDATED_AT,
    sections: [
      {
        paragraphs: [
          "EcoSurv n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Il enregistre seulement dans votre navigateur des préférences et des données techniques nécessaires au fonctionnement, ce qui ne demande pas de bandeau de consentement.",
        ],
        list: [
          "Session de connexion : un jeton stocké dans votre navigateur pour vous garder connecté après la saisie du mot de passe. Il est indispensable et supprimé à la déconnexion.",
          'Préférence d\'affichage : le thème clair ou sombre que vous choisissez, enregistré dans votre navigateur.',
          "Langue choisie pour l'interface.",
          "Clôtures de caisse du jour, pour que le caissier retrouve son état de caisse en cours.",
          "Étapes de démarrage ignorées et fenêtre de bienvenue déjà fermée, pour ne pas vous les montrer plusieurs fois.",
          "Mesure d'audience et publicité : aucune. Si un outil de mesure est ajouté un jour, cette page sera mise à jour et le consentement demandé.",
        ],
      },
      {
        paragraphs: [
          "Ces données restent dans votre navigateur et ne sont envoyées à aucun tiers. Vous pouvez les effacer à tout moment dans les réglages de votre navigateur ; vous devrez alors vous reconnecter.",
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPageContent | undefined {
  return LEGAL_PAGES.find((p) => p.slug === slug);
}
