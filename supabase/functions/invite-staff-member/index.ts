import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteStaffRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: "enseignant" | "caissier";
  classe_assignee?: string;
  redirect_to?: string;
}

Deno.serve(async (req: Request) => {
  // 1. Gestion pré-vol CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Méthode non autorisée" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 2. Vérification des clés et secrets serveur
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[invite-staff-member] Configuration Supabase manquante.");
      return new Response(
        JSON.stringify({ error: "Configuration serveur Supabase incomplète." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      console.error("[invite-staff-member] RESEND_API_KEY non configurée dans les secrets Supabase.");
      return new Response(
        JSON.stringify({ error: "Service d'envoi d'emails non configuré côté serveur." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Vérification de l'authentification et du rôle de l'appelant (seul un DIRECTEUR peut inviter)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Session non fournie. Veuillez vous reconnecter." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Session expirée ou non autorisée." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer le profil du directeur appelant
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from("profils")
      .select("id, ecole_id, role, nom, prenom")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (callerProfileError || !callerProfile || callerProfile.role !== "directeur" || !callerProfile.ecole_id) {
      return new Response(
        JSON.stringify({ error: "Action réservée à la direction de l'établissement." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer le nom de l'école
    const { data: ecoleData } = await supabaseAdmin
      .from("ecoles")
      .select("nom, ville")
      .eq("id", callerProfile.ecole_id)
      .maybeSingle();

    const nomEcole = ecoleData?.nom || "Votre établissement scolaire";
    const directeurNomComplet = `${callerProfile.prenom || ""} ${callerProfile.nom || ""}`.trim() || "La Direction";

    // 4. Lecture et validation du corps de la requête
    const payload = (await req.json()) as InviteStaffRequest;
    const { nom, prenom, email, telephone, role, classe_assignee, redirect_to } = payload;

    if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Nom, prénom et email valide sont obligatoires." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (role !== "enseignant" && role !== "caissier") {
      return new Response(
        JSON.stringify({ error: "Le rôle doit être 'enseignant' ou 'caissier'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNom = nom.trim().toUpperCase();
    const cleanPrenom = prenom.trim();
    const cleanTelephone = telephone?.trim() || "";

    // 5. Vérifier si un profil existe déjà pour cet email
    const { data: existingProfile } = await supabaseAdmin
      .from("profils")
      .select("id, email, ecole_id, role, actif")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile && existingProfile.ecole_id === callerProfile.ecole_id) {
      return new Response(
        JSON.stringify({
          error: `Un membre avec l'adresse ${cleanEmail} est déjà enregistré dans votre établissement (Rôle : ${existingProfile.role}).`
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Génération du lien d'invitation sécurisé via Supabase Auth Admin
    const targetRedirectUrl = redirect_to || "https://ecosurv.mr";
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: cleanEmail,
      options: {
        redirectTo: targetRedirectUrl,
        data: {
          nom: cleanNom,
          prenom: cleanPrenom,
          role: role,
          ecole_id: callerProfile.ecole_id,
        },
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[invite-staff-member] Erreur generateLink:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Impossible de générer le lien d'invitation sécurisé." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = linkData.user.id;
    const actionLink = linkData.properties.action_link;

    // 7. Enregistrement / mise à jour du profil dans public.profils (statut actif: false = en attente)
    const { error: profileUpsertError } = await supabaseAdmin
      .from("profils")
      .upsert({
        id: newUserId,
        ecole_id: callerProfile.ecole_id,
        role: role,
        nom: cleanNom,
        prenom: cleanPrenom,
        email: cleanEmail,
        telephone: cleanTelephone,
        actif: false, // En attente jusqu'à première connexion
      });

    if (profileUpsertError) {
      console.error("[invite-staff-member] Erreur upsert profil:", profileUpsertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement du profil du personnel." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Si enseignant et classe spécifiée, créer l'affectation dans affectations_enseignants
    if (role === "enseignant" && classe_assignee?.trim()) {
      const cleanClasse = classe_assignee.trim();
      const { error: affectationError } = await supabaseAdmin
        .from("affectations_enseignants")
        .upsert(
          {
            ecole_id: callerProfile.ecole_id,
            enseignant_id: newUserId,
            classe: cleanClasse,
          },
          { onConflict: "enseignant_id,classe,annee_scolaire" }
        );

      if (affectationError) {
        console.warn("[invite-staff-member] Note affectation classe:", affectationError.message);
      }
    }

    // 9. Envoi de l'email d'invitation avec Resend
    const roleLabel = role === "enseignant" ? "Enseignant(e)" : "Caissier(ère)";
    const subject = `Invitation à rejoindre l'espace ${roleLabel} : ${nomEcole}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { background: #1d4ed8; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 13px; color: #bfdbfe; font-weight: 500; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
          .info-box { background: #0f172a; border-radius: 14px; border: 1px solid #334155; padding: 18px 20px; margin-bottom: 28px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .info-row:last-child { margin-bottom: 0; }
          .info-label { color: #64748b; font-weight: 500; }
          .info-value { color: #f1f5f9; font-weight: 700; text-align: right; }
          .cta-wrap { text-align: center; margin: 32px 0; }
          .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
          .notice { font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 20px; }
          .footer { text-align: center; padding: 20px 24px; font-size: 11px; color: #475569; background: #0f172a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EcoSurv Mauritanie</h1>
            <p>Plateforme de Gestion Scolaire & Financière</p>
          </div>
          <div class="content">
            <div class="greeting">Bonjour ${cleanPrenom} ${cleanNom},</div>
            <p class="message">
              ${directeurNomComplet} vous invite à rejoindre l'espace professionnel de <strong>${nomEcole}</strong> sur EcoSurv en tant que <strong>${roleLabel}</strong>.
            </p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Établissement :</span>
                <span class="info-value">${nomEcole}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Rôle attribué :</span>
                <span class="info-value">${roleLabel}</span>
              </div>
              ${classe_assignee ? `
              <div class="info-row">
                <span class="info-label">Classe assignée :</span>
                <span class="info-value">${classe_assignee}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Identifiant de connexion :</span>
                <span class="info-value">${cleanEmail}</span>
              </div>
            </div>
            <div class="cta-wrap">
              <a href="${actionLink}" class="cta-btn">Activer mon compte & Définir mon mot de passe</a>
            </div>
            <p class="notice">
              Ce lien d'invitation est sécurisé, personnel et à usage unique. Il expirera automatiquement après son utilisation.
            </p>
          </div>
          <div class="footer">
            EcoSurv • République Islamique de Mauritanie • Support technique : contact@ecosurv.mr
          </div>
        </div>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EcoSurv <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[invite-staff-member] Erreur Resend API:", resendData);
      const isDomainTestingLimitation =
        resendData.message &&
        resendData.message.toLowerCase().includes("you can only send testing emails");

      return new Response(
        JSON.stringify({
          success: false,
          memberId: newUserId,
          error: isDomainTestingLimitation
            ? `Mode test Resend : l'email d'invitation n'a pu être délivré qu'au compte administrateur Resend. Lien d'activation généré : ${actionLink}`
            : resendData.message || "Échec de l'envoi de l'email d'invitation.",
          actionLink: actionLink,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        memberId: newUserId,
        email: cleanEmail,
        message: `Invitation envoyée avec succès à ${cleanPrenom} ${cleanNom}.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[invite-staff-member] Erreur inattendue:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erreur interne du serveur lors du traitement de l'invitation." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
