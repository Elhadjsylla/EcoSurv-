export type Language = 'fr' | 'ar' | 'en';

export interface Translations {
  // Navigation & Common
  common: {
    dashboard: string;
    students: string;
    schedule: string;
    reminders: string;
    reports: string;
    settings: string;
    logout: string;
    login: string;
    register: string;
    createSchool: string;
    search: string;
    searchPlaceholder: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    actions: string;
    status: string;
    all: string;
    active: string;
    pending: string;
    suspended: string;
    viewSite: string;
    schoolYear: string;
    viewAs: string;
    director: string;
    teacher: string;
    parent: string;
    cashier: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    students: string;
    schedule: string;
    reminders: string;
    reports: string;
    settings: string;
    classes: string;
    attendance: string;
    grades: string;
    pedagogicSpace: string;
    counter: string;
    cashRegister: string;
    unpaid: string;
    financialManagement: string;
    familyHome: string;
    feesPayments: string;
    gradesReport: string;
    familySpace: string;
  };

  // Landing Page
  landing: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaStart: string;
    ctaDemo: string;
    featureTitle: string;
    featureSubtitle: string;
    statSchools: string;
    statStudents: string;
    statRecovery: string;
    pricingTitle: string;
    pricingSubtitle: string;
    contactUs: string;
  };

  // Auth pages
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    schoolName: string;
    city: string;
    directorName: string;
    directorFirstName: string;
    phone: string;
    studentCount: string;
    selectBracket: string;
    connectButton: string;
    registerButton: string;
    alreadyHaveAccount: string;
    noAccount: string;
    forgotPassword: string;
    pendingTitle: string;
    pendingSubtitle: string;
    accelerateWhatsapp: string;
  };

  // Zero States & Empty States
  empty: {
    noStudents: string;
    noStudentsDesc: string;
    addFirstStudent: string;
    noSchedule: string;
    noScheduleDesc: string;
    noReminders: string;
    noRemindersDesc: string;
    noReports: string;
    noReportsDesc: string;
    noChildren: string;
    noChildrenDesc: string;
    noClasses: string;
    noClassesDesc: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    common: {
      dashboard: 'Tableau de bord',
      students: 'Gestion Élèves',
      schedule: 'Échéances & Tarifs',
      reminders: 'Relances Impayés',
      reports: 'Rapports Financiers',
      settings: 'Configuration',
      logout: 'Déconnexion',
      login: 'Se connecter',
      register: 'Créer mon école',
      createSchool: 'Créer mon école',
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher un élève, classe, matricule...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      actions: 'Actions',
      status: 'Statut',
      all: 'Tous',
      active: 'Active',
      pending: 'En attente',
      suspended: 'Suspendue',
      viewSite: 'Site vitrine',
      schoolYear: '2025–2026',
      viewAs: 'Vue',
      director: 'Directeur',
      teacher: 'Enseignant',
      parent: 'Parent',
      cashier: 'Caissier',
    },
    nav: {
      dashboard: 'Tableau de bord',
      students: 'Élèves',
      schedule: 'Échéances',
      reminders: 'Relances',
      reports: 'Rapports',
      settings: 'Configuration',
      classes: 'Mes Classes',
      attendance: 'Saisie des Absences',
      grades: 'Saisie des Notes',
      pedagogicSpace: 'Espace Pédagogique',
      counter: "Guichet d'Encaissement",
      cashRegister: 'Journal de Caisse',
      unpaid: 'Relevé des Impayés',
      financialManagement: 'Gestion Financière',
      familyHome: 'Accueil Famille',
      feesPayments: 'Frais & Paiements',
      gradesReport: 'Notes & Bulletins',
      familySpace: 'Espace Famille',
    },
    landing: {
      heroBadge: 'SaaS Scolarité & Finance — Mauritanie',
      heroTitle: 'La gestion scolaire moderne pensée pour la Mauritanie',
      heroSubtitle: 'Pilotez vos inscriptions, recouvrements Ouguiya (MRU), relances WhatsApp et scolarité en temps réel avec un outil conçu sur-mesure.',
      ctaStart: 'Créer mon école gratuitement',
      ctaDemo: 'Explorer la démo interactive',
      featureTitle: 'Une suite complète pour votre établissement',
      featureSubtitle: 'Chaque acteur dispose de son propre portail dédié et sécurisé.',
      statSchools: 'Écoles partenaires',
      statStudents: 'Élèves gérés',
      statRecovery: 'Taux moyen de recouvrement',
      pricingTitle: 'Des forfaits adaptés à la taille de votre école',
      pricingSubtitle: '14 jours d’essai gratuit, sans engagement ni carte bancaire.',
      contactUs: 'Besoin d’aide ? Contactez notre équipe sur WhatsApp',
    },
    auth: {
      loginTitle: 'Connexion à votre espace',
      loginSubtitle: 'Accédez à votre portail sécurisé EcoSurv',
      registerTitle: 'Créer votre établissement sur EcoSurv',
      registerSubtitle: 'Remplissez le formulaire ci-dessous pour initialiser votre école.',
      email: 'Adresse email professionnelle',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      schoolName: "Nom de l'établissement",
      city: 'Ville ou Quartier',
      directorName: 'Nom du responsable',
      directorFirstName: 'Prénom du responsable',
      phone: 'Téléphone / WhatsApp',
      studentCount: "Effectif approximatif d'élèves",
      selectBracket: "Sélectionnez une tranche d'élèves",
      connectButton: 'Se connecter',
      registerButton: "Créer mon école maintenant",
      alreadyHaveAccount: 'Déjà un compte ? Connectez-vous',
      noAccount: "Pas encore d'école ? Créer mon école",
      forgotPassword: 'Mot de passe oublié ?',
      pendingTitle: 'Établissement en attente d’activation',
      pendingSubtitle: 'Votre établissement a été créé avec succès. Notre équipe Super Admin valide votre compte sous peu.',
      accelerateWhatsapp: "Accélérer l'activation sur WhatsApp",
    },
    empty: {
      noStudents: 'Aucun élève enregistré',
      noStudentsDesc: 'Commencez par inscrire votre tout premier élève ou importez votre registre depuis Excel.',
      addFirstStudent: 'Inscrire un premier élève',
      noSchedule: 'Aucun barème d’échéances',
      noScheduleDesc: 'Définissez vos tarifs annuels et les mensualités par classe pour activer la facturation automatique.',
      noReminders: 'Tous les comptes sont à jour',
      noRemindersDesc: 'Aucun impayé ni retard constaté pour le moment dans votre établissement.',
      noReports: 'Aucune donnée financière',
      noReportsDesc: 'Les rapports mensuels s’afficheront dès que vos premiers règlements de scolarité seront enregistrés.',
      noChildren: 'Aucun élève rattaché',
      noChildrenDesc: 'Aucun dossier élève n’est associé à votre compte tuteur. Veuillez contacter la direction de votre école.',
      noClasses: 'Aucune classe assignée',
      noClassesDesc: 'Vos classes et matières assignées apparaîtront ici dès que la direction aura finalisé les affectations.',
    },
  },

  ar: {
    common: {
      dashboard: 'لوحة التحكم',
      students: 'إدارة الطلاب',
      schedule: 'الأقساط والرسوم',
      reminders: 'متابعة المتأخرات',
      reports: 'التقارير المالية',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      register: 'إنشاء مدرسة',
      createSchool: 'إنشاء مدرسة',
      search: 'بحث',
      searchPlaceholder: 'ابحث عن طالب، قسم، رقم قيد...',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      actions: 'إجراءات',
      status: 'الحالة',
      all: 'الكل',
      active: 'نشط',
      pending: 'قيد الانتظار',
      suspended: 'معلق',
      viewSite: 'الموقع التعريفي',
      schoolYear: '2025–2026',
      viewAs: 'عرض كـ',
      director: 'المدير',
      teacher: 'المعلم',
      parent: 'ولي الأمر',
      cashier: 'أمين الصندوق',
    },
    nav: {
      dashboard: 'لوحة التحكم',
      students: 'الطلاب',
      schedule: 'الأقساط',
      reminders: 'المتأخرات',
      reports: 'التقارير',
      settings: 'الإعدادات',
      classes: 'فصولي',
      attendance: 'تسجيل الغياب',
      grades: 'رصد الدرجات',
      pedagogicSpace: 'المجال التعليمي',
      counter: 'شباك التحصيل',
      cashRegister: 'سجل الصندوق',
      unpaid: 'كشف المتأخرات',
      financialManagement: 'الإدارة المالية',
      familyHome: 'الرئيسية',
      feesPayments: 'الرسوم والدفع',
      gradesReport: 'الدرجات والشهادات',
      familySpace: 'فضاء الأسرة',
    },
    landing: {
      heroBadge: 'برنامج إدارة المدارس والمالية — موريتانيا',
      heroTitle: 'الإدارة المدرسية الحديثة المصممة خصيصاً لموريتانيا',
      heroSubtitle: 'تابع التسجيلات، وتحصيل الرسوم بالأوقية، والتنبيهات عبر الواتساب بدقة وسهولة فائقة.',
      ctaStart: 'أنشئ مدرستك مجاناً',
      ctaDemo: 'استكشف النسخة التجريبية',
      featureTitle: 'منظومة متكاملة لجميع أركان مؤسستك',
      featureSubtitle: 'بوابات مخصصة ومحمية للمدير، والمعلمين، وأولياء الأمور، وأمناء الصندوق.',
      statSchools: 'مدرسة شريكة',
      statStudents: 'طالب مسجل',
      statRecovery: 'متوسط نسبة التحصيل',
      pricingTitle: 'خطط اشتراك تتناسب مع حجم مدرستك',
      pricingSubtitle: '14 يوماً تجربة مجانية بالكامل دون الحاجة لبطاقة بنكية.',
      contactUs: 'هل تحتاج مساعدة؟ تواصل معنا عبر الواتساب',
    },
    auth: {
      loginTitle: 'تسجيل الدخول إلى حسابك',
      loginSubtitle: 'الوصول إلى بوابتك الآمنة في إيكوسيرف',
      registerTitle: 'تسجيل مدرسة جديدة في إيكوسيرف',
      registerSubtitle: 'يرجى ملء النموذج أدناه لإنشاء وتفعيل مؤسستك التعليمية.',
      email: 'البريد الإلكتروني المهني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      schoolName: 'اسم المؤسسة التعليمية',
      city: 'المدينة أو الحي',
      directorName: 'اسم المسؤول',
      directorFirstName: 'الاسم الأول للمسؤول',
      phone: 'الهاتف / واتساب',
      studentCount: 'العدد التقديري للطلاب',
      selectBracket: 'اختر فئة عدد الطلاب',
      connectButton: 'تسجيل الدخول',
      registerButton: 'إنشاء مدرستي الآن',
      alreadyHaveAccount: 'هل لديك حساب بالفعل؟ سجل دخولك',
      noAccount: 'ليس لديك مدرسة بعد؟ سجل الآن',
      forgotPassword: 'نسيت كلمة المرور؟',
      pendingTitle: 'المؤسسة في انتظار التفعيل',
      pendingSubtitle: 'تم تسجيل بيانات مدرستك بنجاح. سيقوم فريق الإدارة بمراجعة وتفعيل الحساب قريباً.',
      accelerateWhatsapp: 'تسريع التفعيل عبر الواتساب',
    },
    empty: {
      noStudents: 'لا يوجد طلاب مسجلون',
      noStudentsDesc: 'ابدأ بتسجيل أول طالب أو استيراد القائمة من ملف Excel.',
      addFirstStudent: 'تسجيل أول طالب',
      noSchedule: 'لا يوجد جدول أقساط محدد',
      noScheduleDesc: 'قم بضبط الرسوم والأقساط السنوية لكل قسم لتفعيل الفوترة التلقائية.',
      noReminders: 'جميع الحسابات منتظمة',
      noRemindersDesc: 'لا توجد أي متأخرات أو ديون مستحقة في الوقت الحالي.',
      noReports: 'لا توجد بيانات مالية بعد',
      noReportsDesc: 'ستظهر التقارير المالية والتحليلات فور تسجيل أول دفعة من الرسوم.',
      noChildren: 'لا يوجد طلاب مرتبطون بهذا الحساب',
      noChildrenDesc: 'لم يتم ربط أي طالب بحساب ولي الأمر هذا. يرجى مراجعة إدارة المدرسة.',
      noClasses: 'لم يتم تعيين أي أقسام',
      noClassesDesc: 'ستظهر الفصول والمواد المسندة إليك هنا بمجرد اكتمال جدول الإدارة.',
    },
  },

  en: {
    common: {
      dashboard: 'Dashboard',
      students: 'Students',
      schedule: 'Tuition & Fees',
      reminders: 'Overdue Reminders',
      reports: 'Financial Reports',
      settings: 'Settings',
      logout: 'Log Out',
      login: 'Log In',
      register: 'Create School',
      createSchool: 'Create School',
      search: 'Search',
      searchPlaceholder: 'Search student, class, ID...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      actions: 'Actions',
      status: 'Status',
      all: 'All',
      active: 'Active',
      pending: 'Pending',
      suspended: 'Suspended',
      viewSite: 'Public Site',
      schoolYear: '2025–2026',
      viewAs: 'View',
      director: 'Director',
      teacher: 'Teacher',
      parent: 'Parent',
      cashier: 'Cashier',
    },
    nav: {
      dashboard: 'Dashboard',
      students: 'Students',
      schedule: 'Due Dates',
      reminders: 'Reminders',
      reports: 'Reports',
      settings: 'Settings',
      classes: 'My Classes',
      attendance: 'Attendance',
      grades: 'Grades',
      pedagogicSpace: 'Academic Space',
      counter: 'Payment Desk',
      cashRegister: 'Cash Register',
      unpaid: 'Unpaid Dues',
      financialManagement: 'Financial Management',
      familyHome: 'Family Home',
      feesPayments: 'Fees & Payments',
      gradesReport: 'Grades & Reports',
      familySpace: 'Family Space',
    },
    landing: {
      heroBadge: 'School Management & Finance SaaS — Mauritania',
      heroTitle: 'Modern school management tailored for Mauritania',
      heroSubtitle: 'Manage enrollments, Ouguiya (MRU) payments, automated WhatsApp reminders, and academic tracking in real time.',
      ctaStart: 'Create Free School Account',
      ctaDemo: 'Explore Interactive Demo',
      featureTitle: 'A complete suite for your educational institution',
      featureSubtitle: 'Dedicated, secure portals for directors, teachers, parents, and cashiers.',
      statSchools: 'Partner Schools',
      statStudents: 'Enrolled Students',
      statRecovery: 'Average Recovery Rate',
      pricingTitle: 'Plans designed for any school size',
      pricingSubtitle: '14-day free trial. No credit card required.',
      contactUs: 'Need assistance? Chat with our team on WhatsApp',
    },
    auth: {
      loginTitle: 'Sign In to your Portal',
      loginSubtitle: 'Access your secure EcoSurv workspace',
      registerTitle: 'Register your School on EcoSurv',
      registerSubtitle: 'Complete the form below to initialize your school portal.',
      email: 'Professional Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      schoolName: 'School Name',
      city: 'City or Neighborhood',
      directorName: 'Director Last Name',
      directorFirstName: 'Director First Name',
      phone: 'Phone / WhatsApp',
      studentCount: 'Estimated Student Enrollment',
      selectBracket: 'Select enrollment range',
      connectButton: 'Sign In',
      registerButton: 'Create my school now',
      alreadyHaveAccount: 'Already registered? Sign in',
      noAccount: 'New school? Register here',
      forgotPassword: 'Forgot password?',
      pendingTitle: 'School Pending Activation',
      pendingSubtitle: 'Your school was registered successfully. Our Super Admin team will review and activate your account shortly.',
      accelerateWhatsapp: 'Speed up activation on WhatsApp',
    },
    empty: {
      noStudents: 'No students enrolled yet',
      noStudentsDesc: 'Start by enrolling your first student or import your student roster from Excel.',
      addFirstStudent: 'Enroll first student',
      noSchedule: 'No fee schedules configured',
      noScheduleDesc: 'Define your annual tuition and installments per class to enable automatic billing.',
      noReminders: 'All accounts are up to date',
      noRemindersDesc: 'There are currently no overdue payments in your school.',
      noReports: 'No financial data yet',
      noReportsDesc: 'Monthly reports and analytics will appear as soon as initial tuition payments are registered.',
      noChildren: 'No students linked',
      noChildrenDesc: 'No student profiles are linked to this guardian account. Please contact school administration.',
      noClasses: 'No classes assigned',
      noClassesDesc: 'Your assigned classes and subjects will appear here once finalized by school management.',
    },
  },
};
