import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteParentRequest {
  eleve_id: string;
  nom_tuteur: string;
  prenom_tuteur?: string;
  email_tuteur: string;
  telephone_tuteur?: string;
  lien_parente?: "pere" | "mere" | "tuteur" | "autre";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[invite-parent] Variables Supabase manquantes.");
      return new Response(
        JSON.stringify({ error: "Configuration serveur Supabase incomplète." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Vérification de la session du directeur appelant
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

    // 3. Déduction stricte de l'école côté serveur
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from("profils")
      .select("id, ecole_id, role, nom, prenom")
      .eq("id", callerUser.id)
      .maybeSingle();

    const isDirecteur = callerProfile?.role === "directeur";
    const isSuperAdmin = callerProfile?.role === "super_admin";

    if (callerProfileError || !callerProfile || (!isDirecteur && !isSuperAdmin)) {
      return new Response(
        JSON.stringify({ error: "Action réservée à la direction de l'établissement." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Lecture et validation du payload
    const payload = (await req.json()) as InviteParentRequest;
    const { eleve_id, nom_tuteur, prenom_tuteur, email_tuteur, telephone_tuteur, lien_parente, redirect_to } = payload;

    if (!eleve_id || !email_tuteur?.trim() || !nom_tuteur?.trim()) {
      return new Response(
        JSON.stringify({ error: "L'identifiant de l'élève, le nom du tuteur et son email sont obligatoires." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email_tuteur.trim().toLowerCase();
    const cleanNom = nom_tuteur.trim().toUpperCase();
    const cleanPrenom = prenom_tuteur?.trim() || "";
    const cleanPhone = telephone_tuteur?.trim() || "";
    const validLien = lien_parente || "tuteur";

    // 5. Vérifier que l'élève appartient bien à l'école du directeur
    const { data: eleveData, error: eleveError } = await supabaseAdmin
      .from("eleves")
      .select("id, ecole_id, nom, prenom, classe, matricule")
      .eq("id", eleve_id)
      .maybeSingle();

    if (eleveError || !eleveData) {
      return new Response(
        JSON.stringify({ error: "Élève introuvable." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetEcoleId = callerProfile.ecole_id || eleveData.ecole_id;

    if (callerProfile.ecole_id && eleveData.ecole_id !== callerProfile.ecole_id) {
      return new Response(
        JSON.stringify({ error: "Cet élève n'appartient pas à votre établissement." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Récupérer le nom de l'école
    const { data: ecoleData } = await supabaseAdmin
      .from("ecoles")
      .select("nom")
      .eq("id", targetEcoleId)
      .maybeSingle();

    const nomEcole = ecoleData?.nom || "Votre établissement scolaire";
    const targetRedirectUrl = redirect_to || "https://ecosurv.mr";

    // 7. Vérifier si un profil existe déjà avec cet email
    const { data: existingProfile } = await supabaseAdmin
      .from("profils")
      .select("id, ecole_id, role, nom, prenom, actif")
      .eq("email", cleanEmail)
      .maybeSingle();

    // Garde-fou rôle : si l'email appartient déjà à un membre du personnel
    if (existingProfile && existingProfile.role !== "parent") {
      return new Response(
        JSON.stringify({
          error: `Cette adresse email est déjà associée à un compte membre du personnel (${existingProfile.role}). Veuillez utiliser une autre adresse.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Vérifier si cet élève est déjà rattaché à ce parent
    if (existingProfile) {
      const { data: existingLink } = await supabaseAdmin
        .from("parents_eleves")
        .select("id")
        .eq("parent_id", existingProfile.id)
        .eq("eleve_id", eleve_id)
        .maybeSingle();

      if (existingLink) {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyLinked: true,
            message: `Cet élève est déjà relié au compte parent de ${existingProfile.prenom} ${existingProfile.nom}.`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Cas FRATRIE / NOUVEL ENFANT pour un parent existant
      const { error: linkErr } = await supabaseAdmin
        .from("parents_eleves")
        .upsert(
          {
            ecole_id: targetEcoleId,
            parent_id: existingProfile.id,
            eleve_id: eleve_id,
            lien: validLien,
            principal: true,
          },
          { onConflict: "parent_id,eleve_id" }
        );

      if (linkErr) {
        console.error("[invite-parent] Erreur création liaison fratrie:", linkErr);
        return new Response(
          JSON.stringify({ error: linkErr.message || "Erreur lors de la liaison de l'élève au tuteur." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Si Resend est configuré, on envoie un email d'information de rattachement
      if (resendApiKey) {
        const subject = `Nouvel enfant rattaché à votre compte EcoSurv : ${eleveData.prenom} ${eleveData.nom}`;
        const siblingHtml = `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="utf-8">
            <title>${subject}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
              .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; }
              .header { background: #7c3aed; padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; }
              .content { padding: 32px 28px; }
              .message { font-size: 14px; line-height: 1.6; color: #94a3b8; }
              .card { background: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #334155; margin: 20px 0; }
              .cta-wrap { text-align: center; margin: 28px 0; }
              .cta-btn { display: inline-block; background: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; }
              .footer { text-align: center; padding: 20px; font-size: 11px; color: #475569; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>EcoSurv Espace Famille</h1>
              </div>
              <div class="content">
                <p class="message">Bonjour ${existingProfile.prenom} ${existingProfile.nom},</p>
                <p class="message">
                  L'établissement <strong>${nomEcole}</strong> a rattaché un nouvel élève à votre compte Famille existant :
                </p>
                <div class="card">
                  <div style="font-weight: 800; font-size: 16px; color: #ffffff;">${eleveData.prenom} ${eleveData.nom}</div>
                  <div style="font-size: 12px; color: #a78bfa; margin-top: 4px;">Classe : ${eleveData.classe} • Matr. #${eleveData.matricule || ''}</div>
                </div>
                <p class="message">
                  Vous pouvez dès à présent consulter son dossier, ses notes et sa situation financière directement dans votre Espace Famille avec vos identifiants habituels.
                </p>
                <div class="cta-wrap">
                  <a href="${targetRedirectUrl}" class="cta-btn">Accéder à mon Espace Famille</a>
                </div>
              </div>
              <div class="footer">
                EcoSurv • République Islamique de Mauritanie
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "EcoSurv <onboarding@resend.dev>",
              to: [cleanEmail],
              subject: subject,
              html: siblingHtml,
            }),
          });
        } catch (resendErr) {
          console.warn("[invite-parent] Note envoi email fratrie:", resendErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          isExistingParent: true,
          message: `L'élève ${eleveData.prenom} a été rattaché au compte Famille existant de ${existingProfile.prenom} ${existingProfile.nom}.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // CAS NOUVEAU PARENT : CRÉATION DE COMPTE + LIAISON + INVITATION
    // =========================================================================
    let parentUserId: string;
    let actionLink: string | null = null;

    // Tentative 1 : Générer un lien d'invitation (crée l'utilisateur dans auth.users de façon native)
    const { data: inviteLinkData, error: inviteLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: cleanEmail,
      options: {
        redirectTo: targetRedirectUrl,
        data: {
          role: "parent",
          nom: cleanNom,
          prenom: cleanPrenom,
          telephone: cleanPhone,
          ecole_id: targetEcoleId,
        },
      },
    });

    if (!inviteLinkError && inviteLinkData?.user) {
      parentUserId = inviteLinkData.user.id;
      actionLink = inviteLinkData.properties?.action_link || null;
    } else {
      // Tentative 2 : Si l'utilisateur existe déjà dans auth.users, générer un lien recovery pour qu'il puisse se connecter/définir son mot de passe
      const { data: recoveryLinkData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: {
          redirectTo: targetRedirectUrl,
        },
      });

      if (!recoveryError && recoveryLinkData?.user) {
        parentUserId = recoveryLinkData.user.id;
        actionLink = recoveryLinkData.properties?.action_link || null;
      } else {
        // Tentative 3 : Si recovery échoue également, tenter un lien de connexion magique (magiclink)
        const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: cleanEmail,
          options: {
            redirectTo: targetRedirectUrl,
          },
        });

        if (magicError || !magicData?.user) {
          console.error("[invite-parent] Erreur generateLink (invite/recovery/magiclink):", inviteLinkError, recoveryError, magicError);
          return new Response(
            JSON.stringify({
              error: recoveryError?.message || inviteLinkError?.message || magicError?.message || "Impossible de générer le compte tuteur ou son lien d'accès.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        parentUserId = magicData.user.id;
        actionLink = magicData.properties?.action_link || null;
      }
    }

    // Enregistrement ou mise à jour du profil dans public.profils
    const { error: profileError } = await supabaseAdmin
      .from("profils")
      .upsert(
        {
          id: parentUserId,
          ecole_id: targetEcoleId,
          role: "parent",
          nom: cleanNom,
          prenom: cleanPrenom,
          telephone: cleanPhone,
          email: cleanEmail,
          actif: true,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[invite-parent] Erreur upsert profil parent:", profileError);
      return new Response(
        JSON.stringify({ error: `Erreur lors de l'enregistrement du profil tuteur: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Création de la liaison dans public.parents_eleves
    const { error: linkError } = await supabaseAdmin
      .from("parents_eleves")
      .upsert(
        {
          ecole_id: targetEcoleId,
          parent_id: parentUserId,
          eleve_id: eleve_id,
          lien: validLien,
          principal: true,
        },
        { onConflict: "parent_id,eleve_id" }
      );

    if (linkError) {
      console.error("[invite-parent] Erreur parents_eleves:", linkError);
      return new Response(
        JSON.stringify({ error: `Erreur lors du rattachement de l'élève au tuteur: ${linkError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Envoi de l'email via Resend
    let emailSent = false;
    let emailErrorMsg = null;

    if (resendApiKey) {
      const subject = `Activation de votre Espace Famille EcoSurv : ${nomEcole}`;
      const welcomeHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
            .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { background: #7c3aed; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; }
            .header p { margin: 8px 0 0 0; font-size: 13px; color: #ddd6fe; }
            .content { padding: 32px 28px; }
            .greeting { font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
            .message { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
            .card { background: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #334155; margin: 20px 0; }
            .cta-wrap { text-align: center; margin: 30px 0; }
            .cta-btn { display: inline-block; background: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; }
            .notice { font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 11px; color: #475569; background: #0f172a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EcoSurv Mauritanie</h1>
              <p>Portail Famille & Scolarité</p>
            </div>
            <div class="content">
              <div class="greeting">Bonjour ${cleanPrenom} ${cleanNom},</div>
              <p class="message">
                La direction de l'établissement <strong>${nomEcole}</strong> a créé votre accès tuteur légal sur la plateforme EcoSurv suite à l'inscription de :
              </p>
              <div class="card">
                <div style="font-weight: 800; font-size: 16px; color: #ffffff;">${eleveData.prenom} ${eleveData.nom}</div>
                <div style="font-size: 12px; color: #a78bfa; margin-top: 4px;">Classe : ${eleveData.classe}</div>
              </div>
              <p class="message">
                Votre Espace Famille vous permet de suivre l'assiduité, les notes, les quittances de paiement et le calendrier des échéances de scolarité en temps réel.
              </p>
              <div class="cta-wrap">
                <a href="${actionLink}" class="cta-btn">Activer mon Espace Famille</a>
              </div>
              <p class="notice">
                Ce lien sécurisé est personnel, temporaire et à usage unique.
              </p>
            </div>
            <div class="footer">
              EcoSurv • République Islamique de Mauritanie • Support : contact@ecosurv.mr
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "EcoSurv <onboarding@resend.dev>",
            to: [cleanEmail],
            subject: subject,
            html: welcomeHtml,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const resendErrData = await resendRes.json();
          emailErrorMsg = resendErrData?.message || "Erreur API Resend";
          console.warn("[invite-parent] Erreur Resend:", resendErrData);
        }
      } catch (err: any) {
        emailErrorMsg = err?.message || "Erreur réseau Resend";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        isNewParent: true,
        emailSent: emailSent,
        emailError: emailErrorMsg,
        actionLink: actionLink,
        message: `Compte tuteur créé et rattaché avec succès à ${eleveData.prenom} ${eleveData.nom}.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[invite-parent] Erreur inattendue:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erreur interne du serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
