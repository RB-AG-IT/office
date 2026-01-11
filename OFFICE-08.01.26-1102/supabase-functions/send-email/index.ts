// Supabase Edge Function: send-email
// SMTP E-Mail-Versand für Bestätigungsmails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMTP Konfiguration (Hostinger)
const SMTP_CONFIG = {
  hostname: "smtp.hostinger.com",
  port: 465,
  username: "verwaltung@drk-mitgliederwerbungen.de",
  password: "aZemi211!",
  tls: true,
};

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  senderName: string; // Werbegebietsname
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, body, senderName }: EmailRequest = await req.json();

    // Validierung
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Fehlende Parameter: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // E-Mail validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ success: false, error: "Ungültige E-Mail-Adresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SMTP Client erstellen
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_CONFIG.hostname,
        port: SMTP_CONFIG.port,
        tls: SMTP_CONFIG.tls,
        auth: {
          username: SMTP_CONFIG.username,
          password: SMTP_CONFIG.password,
        },
      },
    });

    // E-Mail senden
    await client.send({
      from: {
        name: senderName || "DRK Mitgliederwerbung",
        address: SMTP_CONFIG.username,
      },
      to: to,
      subject: subject,
      content: body,
      html: body.replace(/\n/g, "<br>"), // Einfache Text-zu-HTML Konvertierung
    });

    // Verbindung schließen
    await client.close();

    console.log(`E-Mail erfolgreich gesendet an: ${to}`);

    return new Response(
      JSON.stringify({ success: true, message: "E-Mail erfolgreich gesendet" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("E-Mail Fehler:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "E-Mail konnte nicht gesendet werden"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
