import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ManageStaffRequest {
  action: "reset_password" | "update_member" | "toggle_active";
  member_id: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  role?: "enseignant" | "caissier";
  classe_assignee?: string;
  actif?: boolean;
  redirect_to?: string;
}

Deno.serve(async (req: Request) => {
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
      console.error("[manage-staff-member] Configuration Supabase manquante.");
      return new Response(
        JSON.stringify({ error: "Configuration serveur Supabase incomplète." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Vérification de la session du directeur appelant
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

    // 2. Vérification que l'appelant est bien directeur d'une école
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

    // 3. Lecture et validation du corps de la requête
    const payload = (await req.json()) as ManageStaffRequest;
    const { action, member_id } = payload;

    if (!action || !member_id) {
      return new Response(
        JSON.stringify({ error: "Action et identifiant du membre obligatoires." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Vérifier que le membre ciblé appartient STRICTEMENT à la même école
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profils")
      .select("id, ecole_id, role, nom, prenom, email, telephone, actif")
      .eq("id", member_id)
      .maybeSingle();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: "Membre du personnel introuvable." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetProfile.ecole_id !== callerProfile.ecole_id) {
      return new Response(
        JSON.stringify({ error: "Ce membre n'appartient pas à votre établissement." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetProfile.role === "super_admin") {
      return new Response(
        JSON.stringify({ error: "Impossible de modifier un compte Super Admin." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // ACTION A : RÉINITIALISATION DU MOT DE PASSE
    // =========================================================================
    if (action === "reset_password") {
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "Service Resend non configuré." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!targetProfile.email) {
        return new Response(
          JSON.stringify({ error: "Ce membre n'a pas d'adresse email enregistrée." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetRedirectUrl = payload.redirect_to || "https://ecosurv.mr";

      // Générer le lien de récupération sécurisé
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: targetProfile.email,
        options: {
          redirectTo: targetRedirectUrl,
        },
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error("[manage-staff-member] Erreur generateLink recovery:", linkError);
        return new Response(
          JSON.stringify({ error: linkError?.message || "Impossible de générer le lien de réinitialisation." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const actionLink = linkData.properties.action_link;

      // Récupérer le nom de l'école
      const { data: ecoleData } = await supabaseAdmin
        .from("ecoles")
        .select("nom")
        .eq("id", callerProfile.ecole_id)
        .maybeSingle();

      const nomEcole = ecoleData?.nom || "Votre établissement scolaire";
      const subject = `Réinitialisation de votre mot de passe EcoSurv : ${nomEcole}`;

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
              <p>Sécurité & Gestion des Accès</p>
            </div>
            <div class="content">
              <div class="greeting">Bonjour ${targetProfile.prenom || ''} ${targetProfile.nom || ''},</div>
              <p class="message">
                La direction de <strong>${nomEcole}</strong> a initié une demande de réinitialisation de votre mot de passe pour votre compte EcoSurv.
              </p>
              <div class="cta-wrap">
                <a href="${actionLink}" class="cta-btn">Définir un nouveau mot de passe</a>
              </div>
              <p class="notice">
                Ce lien sécurisé est personnel, temporaire et à usage unique. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
              </p>
            </div>
            <div class="footer">
              EcoSurv • République Islamique de Mauritanie • Support : contact@ecosurv.mr
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
          to: [targetProfile.email],
          subject: subject,
          html: htmlContent,
        }),
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error("[manage-staff-member] Erreur Resend API:", resendData);
        return new Response(
          JSON.stringify({
            success: false,
            error: resendData.message || "Échec de l'envoi de l'email de réinitialisation.",
            actionLink: actionLink,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Lien de réinitialisation envoyé avec succès à ${targetProfile.email}.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // ACTION B : MODIFIER LES ACCÈS, INFOS & RÔLE
    // =========================================================================
    if (action === "update_member") {
      const { nom, prenom, telephone, role, classe_assignee } = payload;

      const updateData: Record<string, any> = {};
      if (nom?.trim()) updateData.nom = nom.trim().toUpperCase();
      if (prenom?.trim()) updateData.prenom = prenom.trim();
      if (telephone !== undefined) updateData.telephone = telephone.trim();

      if (role) {
        if (role !== "enseignant" && role !== "caissier") {
          return new Response(
            JSON.stringify({ error: "Rôle non valide. Seuls les rôles Enseignant et Caissier peuvent être assignés." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData.role = role;
      }

      const { error: updateError } = await supabaseAdmin
        .from("profils")
        .update(updateData)
        .eq("id", member_id)
        .eq("ecole_id", callerProfile.ecole_id);

      if (updateError) {
        console.error("[manage-staff-member] Erreur update profil:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message || "Erreur lors de la mise à jour du profil." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gestion de l'affectation de classe
      const effectiveRole = role || targetProfile.role;

      if (effectiveRole === "enseignant") {
        if (classe_assignee?.trim()) {
          // Mettre à jour l'affectation
          await supabaseAdmin
            .from("affectations_enseignants")
            .delete()
            .eq("enseignant_id", member_id)
            .eq("ecole_id", callerProfile.ecole_id);

          await supabaseAdmin
            .from("affectations_enseignants")
            .insert({
              ecole_id: callerProfile.ecole_id,
              enseignant_id: member_id,
              classe: classe_assignee.trim(),
            });
        }
      } else {
        // Si le rôle n'est plus enseignant, retirer les affectations
        await supabaseAdmin
          .from("affectations_enseignants")
          .delete()
          .eq("enseignant_id", member_id)
          .eq("ecole_id", callerProfile.ecole_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Profil de ${updateData.prenom || targetProfile.prenom} ${updateData.nom || targetProfile.nom} mis à jour avec succès.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // ACTION C : DÉSACTIVER / RÉACTIVER LE COMPTE (AVEC RÉVOCATION IMMÉDIATE)
    // =========================================================================
    if (action === "toggle_active") {
      // Garde-fou absolu : le directeur ne peut pas désactiver son propre compte
      if (member_id === callerUser.id) {
        return new Response(
          JSON.stringify({ error: "Vous ne pouvez pas désactiver votre propre compte administrateur." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetNewActif = payload.actif !== undefined ? Boolean(payload.actif) : !targetProfile.actif;

      // 1. Mettre à jour la colonne actif en base
      const { error: toggleError } = await supabaseAdmin
        .from("profils")
        .update({ actif: targetNewActif })
        .eq("id", member_id)
        .eq("ecole_id", callerProfile.ecole_id);

      if (toggleError) {
        console.error("[manage-staff-member] Erreur toggle actif:", toggleError);
        return new Response(
          JSON.stringify({ error: toggleError.message || "Erreur lors du changement de statut." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Si désactivation : RÉVOCATION IMMÉDIATE DE TOUTES LES SESSIONS ACTIVES
      if (!targetNewActif) {
        try {
          // Déconnecte toutes les sessions sur tous les appareils (téléphone, autres navigateurs)
          await supabaseAdmin.auth.admin.signOut(member_id, "global");
          console.log(`[manage-staff-member] Session globale révoquée pour ${member_id}`);
        } catch (signOutErr) {
          console.warn("[manage-staff-member] Note signOut global:", signOutErr);
        }
      }

      const actionLabel = targetNewActif ? "réactivé" : "désactivé";

      return new Response(
        JSON.stringify({
          success: true,
          actif: targetNewActif,
          message: `Le compte de ${targetProfile.prenom} ${targetProfile.nom} a été ${actionLabel} avec succès.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Action '${action}' non reconnue.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[manage-staff-member] Erreur inattendue:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erreur interne du serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
