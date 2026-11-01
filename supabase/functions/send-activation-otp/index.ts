import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Envoi du code d'activation d'une école.
// Le code est généré, haché et enregistré ICI, côté serveur. Il n'est jamais renvoyé au navigateur.
// Le corps de la requête est ignoré : l'école et l'adresse e-mail viennent du compte authentifié.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

const CODE_VALIDITY_MINUTES = 15;
const MAX_CODES_PER_HOUR = 3;

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Code à 6 chiffres sans biais de modulo (rejet des valeurs hors du plus grand multiple de 1 000 000).
function generateCode(): string {
  const limit = Math.floor(0x100000000 / 1_000_000) * 1_000_000;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return (buf[0] % 1_000_000).toString().padStart(6, "0");
}

// Même formule que la fonction SQL verifier_code_activation : sha256(ecole_id || ':' || code), en hexadécimal.
async function hashCode(ecoleId: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${ecoleId}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildHtml(params: { nomDirecteur: string; nomEcole: string; code: string; activationUrl: string | null }): string {
  const { nomDirecteur, nomEcole, code, activationUrl } = params;
  const link = activationUrl
    ? `<div style="text-align: center; margin: 24px 0 20px 0;">
              <a href="${escapeHtml(activationUrl)}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px;">
                Ouvrir l'écran d'activation
              </a>
            </div>`
    : "";

  return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Votre code d'activation EcoSurv</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; }
          .header { background: #1d4ed8; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .content { padding: 32px 24px; }
          .welcome { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
          .code-box { background: #0f172a; border: 2px dashed #3b82f6; border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0; }
          .code-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 8px; }
          .otp-number { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; margin: 0; }
          .expiry-badge { display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 12px; }
          .footer { border-top: 1px solid #334155; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EcoSurv Mauritanie</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe;">Activation de votre établissement scolaire</p>
          </div>
          <div class="content">
            <p class="welcome">
              Bonjour <strong>${escapeHtml(nomDirecteur) || "Directeur"}</strong>,<br><br>
              Votre établissement <strong>« ${escapeHtml(nomEcole)} »</strong> a bien été créé sur EcoSurv. Pour finaliser l'accès à votre tableau de bord de direction, saisissez le code de vérification ci-dessous :
            </p>

            <div class="code-box">
              <div class="code-title">Code de vérification</div>
              <p class="otp-number">${escapeHtml(code)}</p>
              <div class="expiry-badge">Expire dans ${CODE_VALIDITY_MINUTES} minutes</div>
            </div>

            ${link}

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
              Ce code est à usage unique et strictement confidentiel. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
            </p>
          </div>
          <div class="footer">
            EcoSurv
          </div>
        </div>
      </body>
      </html>
    `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = (Deno.env.get("RESEND_FROM") || "").trim() || "EcoSurv <onboarding@resend.dev>";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[send-activation-otp] Configuration Supabase manquante.");
      return json({ error: "Configuration serveur incomplète." }, 500);
    }
    if (!resendApiKey) {
      console.error("[send-activation-otp] RESEND_API_KEY non configurée dans les secrets Supabase.");
      return json({ error: "Service d'envoi non configuré côté serveur." }, 500);
    }

    // 1. JWT obligatoire
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json({ error: "Session non fournie. Veuillez vous reconnecter." }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user || !user.email) {
      return json({ error: "Session expirée ou non autorisée." }, 401);
    }

    // 2. Profil et école lus côté serveur (le corps de la requête n'est jamais lu)
    const { data: profil, error: profilError } = await supabaseAdmin
      .from("profils")
      .select("id, ecole_id, role, nom, prenom")
      .eq("id", user.id)
      .maybeSingle();

    if (profilError || !profil || profil.role !== "directeur" || !profil.ecole_id) {
      return json({ error: "Action réservée au directeur de l'établissement." }, 403);
    }

    const { data: ecole, error: ecoleError } = await supabaseAdmin
      .from("ecoles")
      .select("id, nom, statut_activation")
      .eq("id", profil.ecole_id)
      .maybeSingle();

    if (ecoleError || !ecole) {
      return json({ error: "Établissement introuvable." }, 404);
    }
    if (ecole.statut_activation !== "en_attente") {
      return json({ error: "Cet établissement n'est pas en attente d'activation." }, 409);
    }

    // 3. Limite : 3 codes par heure et par école
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: countError } = await supabaseAdmin
      .from("codes_activation")
      .select("id", { count: "exact", head: true })
      .eq("ecole_id", ecole.id)
      .gte("created_at", sinceIso);

    if (countError) {
      console.error("[send-activation-otp] Erreur comptage:", countError);
      return json({ error: "Erreur interne du serveur lors de l'envoi." }, 500);
    }
    if ((recentCount ?? 0) >= MAX_CODES_PER_HOUR) {
      return json({ error: "Trop de demandes de code. Veuillez patienter avant de redemander un code." }, 429);
    }

    // 4. Génération, hash et enregistrement côté serveur
    const code = generateCode();
    const codeHash = await hashCode(ecole.id, code);

    const { error: invalidateError } = await supabaseAdmin
      .from("codes_activation")
      .update({ utilise: true })
      .eq("ecole_id", ecole.id)
      .eq("utilise", false);

    if (invalidateError) {
      console.error("[send-activation-otp] Erreur invalidation anciens codes:", invalidateError);
      return json({ error: "Erreur interne du serveur lors de l'envoi." }, 500);
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("codes_activation")
      .insert({
        ecole_id: ecole.id,
        email: user.email,
        code_hash: codeHash,
        expire_a: new Date(Date.now() + CODE_VALIDITY_MINUTES * 60 * 1000).toISOString(),
        utilise: false,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[send-activation-otp] Erreur enregistrement du code:", insertError);
      return json({ error: "Erreur interne du serveur lors de l'envoi." }, 500);
    }

    // 5. Lien vers l'écran d'activation : origine du client seulement si elle est dans ALLOWED_ORIGINS, sinon SITE_URL
    let activationUrl: string | null = null;
    const siteUrl = (Deno.env.get("SITE_URL") || "").trim().replace(/\/+$/, "");
    const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
    let clientOrigin = "";
    const rawOrigin = (req.headers.get("origin") || "").trim();
    if (rawOrigin) {
      try {
        clientOrigin = new URL(rawOrigin).origin;
      } catch {
        clientOrigin = "";
      }
    }
    const baseUrl = clientOrigin && allowedOrigins.includes(clientOrigin) ? clientOrigin : siteUrl;
    if (baseUrl) activationUrl = `${baseUrl}/activation`;

    // 6. Envoi via Resend : toutes les valeurs insérées dans le HTML sont échappées
    const nomDirecteur = `${profil.prenom || ""} ${profil.nom || ""}`.trim();
    const html = buildHtml({ nomDirecteur, nomEcole: ecole.nom || "", code, activationUrl });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [user.email],
        subject: "Votre code d'activation EcoSurv",
        html,
      }),
    });

    if (!resendResponse.ok) {
      let resendMessage = "";
      try {
        const resendData = await resendResponse.json();
        resendMessage = String(resendData?.message || "");
      } catch {
        // corps non JSON
      }
      console.error("[send-activation-otp] Erreur Resend:", resendResponse.status, resendMessage);

      // Le code n'a pas été remis : on le retire pour qu'il ne reste pas valide ni ne compte dans la limite horaire.
      await supabaseAdmin.from("codes_activation").delete().eq("id", inserted.id);

      return json(
        { ok: false, error: "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques minutes." },
        502,
      );
    }

    // Jamais de code ni de hash dans la réponse
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("[send-activation-otp] Exception interne:", error);
    return json({ error: "Erreur interne du serveur lors de l'envoi." }, 500);
  }
});
