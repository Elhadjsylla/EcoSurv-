import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendOtpRequest {
  to: string;
  nomDirecteur?: string;
  nomEcole: string;
  code: string;
}

Deno.serve(async (req: Request) => {
  // Gestion requêtes pré-vol CORS
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-activation-otp] RESEND_API_KEY non configurée dans les secrets Supabase.");
      return new Response(
        JSON.stringify({ error: "Service d'envoi non configuré côté serveur." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = (await req.json()) as SendOtpRequest;
    const { to, nomDirecteur, nomEcole, code } = payload;

    if (!to || !to.includes("@") || !code || code.length !== 6 || !nomEcole) {
      return new Response(
        JSON.stringify({ error: "Paramètres d'envoi invalides." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = to.trim();
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Votre code d'activation EcoSurv</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
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
              Bonjour <strong>${nomDirecteur || 'Directeur'}</strong>,<br><br>
              Votre établissement <strong>« ${nomEcole} »</strong> a bien été créé sur EcoSurv. Pour finaliser l'accès et accéder immédiatement à votre tableau de bord de direction, saisissez le code de vérification ci-dessous :
            </p>

            <div class="code-box">
              <div class="code-title">Code de vérification sécurisé</div>
              <p class="otp-number">${code}</p>
              <div class="expiry-badge">Expire dans 15 minutes</div>
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
              Ce code est à usage unique et strictement confidentiel. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
            </p>
          </div>
          <div class="footer">
            EcoSurv SARL • Nouakchott, Mauritanie<br>
            Plateforme de Recouvrement et Gestion de Scolarité
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
        subject: `Votre code d'activation EcoSurv : ${code}`,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[send-activation-otp] Erreur Resend API:", resendData);
      const isTestLimitation =
        resendData.message &&
        resendData.message.toLowerCase().includes("you can only send testing emails");

      return new Response(
        JSON.stringify({
          success: false,
          error: resendData.message || "Échec de distribution de l'email.",
          isTestModeLimitation: Boolean(isTestLimitation),
          code,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        code,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[send-activation-otp] Exception interne:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur lors de l'envoi." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
