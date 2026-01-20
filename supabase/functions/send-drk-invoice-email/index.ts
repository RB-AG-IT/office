// Supabase Edge Function: send-drk-invoice-email
// Versendet DRK-Kundenrechnungen per E-Mail mit PDF-Anhang
// Empfänger: Schatzmeister aus customer_contacts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMTP Konfiguration (Hostinger)
const SMTP_CONFIG = {
  hostname: "smtp.hostinger.com",
  port: 465,
  username: "verwaltung@drk-mitgliederwerbungen.de",
  password: Deno.env.get("SMTP_PASSWORD") || "aZemi211!",
  tls: true,
};

// Supabase Config
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://lgztglycqtiwcmiydxnm.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface DrkInvoiceEmailRequest {
  invoice_id: string;
  pdf_base64?: string;  // PDF als Base64 vom Frontend
  pdf_filename?: string;
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { invoice_id, pdf_base64, pdf_filename }: DrkInvoiceEmailRequest = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ success: false, error: "invoice_id erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rechnung mit Kunde laden
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        customers!customer_id (
          id,
          name,
          kunden_id
        )
      `)
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ success: false, error: "Rechnung nicht gefunden" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!invoice.customer_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Keine Kunden-ID in Rechnung" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Schatzmeister (Rechnungsempfänger) laden
    const { data: contacts, error: contactError } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("customer_id", invoice.customer_id)
      .eq("role", "schatzmeister");

    if (contactError || !contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kein Schatzmeister (Rechnungsempfänger) im Kundenprofil hinterlegt"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const schatzmeister = contacts[0];
    const email = schatzmeister.email;

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Schatzmeister hat keine E-Mail-Adresse"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Empfängername
    const empfaengerName = [schatzmeister.first_name, schatzmeister.last_name]
      .filter(Boolean).join(" ") || "Sehr geehrte Damen und Herren";

    // Kundenname
    const kundenName = invoice.customers?.name || "Kunde";

    // Abrechnungstyp-Text
    const typTexte: Record<string, string> = {
      'ZA': 'Zwischenabrechnung',
      'EA': 'Endabrechnung',
      '1JA': '1. Jahresabrechnung',
      '2JA': '2. Jahresabrechnung',
      '3JA': '3. Jahresabrechnung',
      '4JA': '4. Jahresabrechnung'
    };
    const typText = typTexte[invoice.abrechnungstyp] || 'Rechnung';

    // Beträge formatieren
    const formatEuro = (val: number) =>
      val.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

    const calcData = invoice.calculation_data || {};
    const brutto = calcData.brutto || 0;

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

    // E-Mail-Inhalt
    const emailBody = `
Sehr geehrte/r ${empfaengerName},

anbei erhalten Sie die ${typText} für die Mitgliederwerbung.

Rechnungsdetails:
- Rechnungsnummer: ${invoice.invoice_number || 'Entwurf'}
- Kunde: ${kundenName}
- Rechnungsbetrag: ${formatEuro(brutto)}

Die Rechnung ist sofort fällig, sofern vertraglich nicht anders vereinbart.

Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
RHODENBURG GmbH
Verwaltung
    `.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .header { background: #c41e3a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .details { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #c41e3a; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${typText}</h1>
    <p>${kundenName}</p>
  </div>
  <div class="content">
    <p>Sehr geehrte/r ${empfaengerName},</p>
    <p>anbei erhalten Sie die ${typText} für die Mitgliederwerbung.</p>

    <div class="details">
      <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number || 'Entwurf'}</p>
      <p><strong>Kunde:</strong> ${kundenName}</p>
      <p><strong>Rechnungsbetrag:</strong></p>
      <p class="amount">${formatEuro(brutto)}</p>
    </div>

    <p>Die Rechnung ist sofort fällig, sofern vertraglich nicht anders vereinbart.</p>
    <p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>

    <div class="footer">
      <p>Mit freundlichen Grüßen<br><strong>RHODENBURG GmbH</strong><br>Verwaltung</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // E-Mail-Optionen
    const emailOptions: any = {
      from: {
        name: "RHODENBURG GmbH - Rechnungen",
        address: SMTP_CONFIG.username,
      },
      to: email,
      subject: `${typText} - ${invoice.invoice_number || 'Entwurf'} - ${kundenName}`,
      content: emailBody,
      html: htmlBody,
    };

    // PDF-Anhang hinzufügen falls vorhanden
    if (pdf_base64) {
      emailOptions.attachments = [{
        filename: pdf_filename || `${invoice.invoice_number || 'Rechnung'}.pdf`,
        content: pdf_base64,
        encoding: "base64",
        contentType: "application/pdf",
      }];
    }

    await client.send(emailOptions);

    // Status in Datenbank aktualisieren
    await supabase
      .from("invoices")
      .update({
        status: invoice.status === 'entwurf' ? 'offen' : invoice.status,
        email_sent_at: new Date().toISOString(),
        email_recipient: email,
      })
      .eq("id", invoice.id);

    // Verbindung schließen
    await client.close();

    console.log(`DRK-Rechnung E-Mail gesendet an: ${email} (${invoice.invoice_number})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `E-Mail erfolgreich an ${email} gesendet`,
        recipient: email,
        invoice_number: invoice.invoice_number,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Edge Function Fehler:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unbekannter Fehler",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
