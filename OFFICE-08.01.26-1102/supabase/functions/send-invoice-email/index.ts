// Supabase Edge Function: send-invoice-email
// Versendet Abrechnungen per E-Mail mit PDF-Anhang
// Kann manuell oder via Cron aufgerufen werden

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

interface InvoiceEmailRequest {
  invoice_id?: string;      // Einzelne Abrechnung senden
  send_scheduled?: boolean; // Alle fälligen Abrechnungen senden (für Cron)
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { invoice_id, send_scheduled }: InvoiceEmailRequest = await req.json();

    let invoicesToSend: any[] = [];

    if (send_scheduled) {
      // Alle fälligen Abrechnungen laden
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          users!inner(name, email),
          user_profiles(street, house_number, postal_code, city)
        `)
        .eq("status", "freigegeben")
        .not("scheduled_send_at", "is", null)
        .lte("scheduled_send_at", new Date().toISOString());

      if (error) throw error;
      invoicesToSend = data || [];
      console.log(`${invoicesToSend.length} fällige Abrechnungen gefunden`);

    } else if (invoice_id) {
      // Einzelne Abrechnung laden
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          users!inner(name, email),
          user_profiles(street, house_number, postal_code, city)
        `)
        .eq("id", invoice_id)
        .single();

      if (error) throw error;
      if (data) invoicesToSend = [data];
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "invoice_id oder send_scheduled erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invoicesToSend.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Keine Abrechnungen zu versenden", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const invoice of invoicesToSend) {
      try {
        const email = invoice.users?.email;
        const name = invoice.users?.name || "Botschafter";

        if (!email) {
          results.push({ id: invoice.id, success: false, error: "Keine E-Mail-Adresse" });
          continue;
        }

        // PDF aus Storage laden (falls vorhanden)
        let pdfAttachment = null;
        if (invoice.pdf_url) {
          try {
            const pdfResponse = await fetch(invoice.pdf_url);
            if (pdfResponse.ok) {
              const pdfBuffer = await pdfResponse.arrayBuffer();
              pdfAttachment = {
                filename: `${invoice.invoice_number}.pdf`,
                content: base64Encode(new Uint8Array(pdfBuffer)),
                encoding: "base64",
                contentType: "application/pdf",
              };
            }
          } catch (pdfError) {
            console.error("PDF konnte nicht geladen werden:", pdfError);
          }
        }

        // E-Mail-Inhalt
        const typText = invoice.invoice_type === "vorschuss"
          ? "Vorschuss-Abrechnung"
          : "Stornorücklage-Auszahlung";

        const periodText = invoice.invoice_type === "vorschuss"
          ? `KW ${invoice.kw_start}${invoice.kw_end !== invoice.kw_start ? "-" + invoice.kw_end : ""} / ${invoice.year}`
          : `H${Math.ceil(new Date(invoice.period_start).getMonth() / 6 + 0.1)} / ${invoice.year}`;

        const emailBody = `
Sehr geehrte/r ${name},

anbei erhalten Sie Ihre ${typText} für den Zeitraum ${periodText}.

Abrechnungsdetails:
- Rechnungsnummer: ${invoice.invoice_number}
- Abrechnungszeitraum: ${new Date(invoice.period_start).toLocaleDateString("de-DE")} - ${new Date(invoice.period_end).toLocaleDateString("de-DE")}
- Auszahlungsbetrag: ${parseFloat(invoice.netto_auszahlung).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €

Die Auszahlung erfolgt auf Ihre hinterlegte Bankverbindung.

Mit freundlichen Grüßen
RB AG IT - Verwaltung
        `.trim();

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .details { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #22c55e; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${typText}</h1>
    <p>${periodText}</p>
  </div>
  <div class="content">
    <p>Sehr geehrte/r ${name},</p>
    <p>anbei erhalten Sie Ihre ${typText}.</p>

    <div class="details">
      <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
      <p><strong>Zeitraum:</strong> ${new Date(invoice.period_start).toLocaleDateString("de-DE")} - ${new Date(invoice.period_end).toLocaleDateString("de-DE")}</p>
      <p><strong>Auszahlungsbetrag:</strong></p>
      <p class="amount">${parseFloat(invoice.netto_auszahlung).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</p>
    </div>

    <p>Die Auszahlung erfolgt auf Ihre hinterlegte Bankverbindung.</p>

    <div class="footer">
      <p>Mit freundlichen Grüßen<br>RB AG IT - Verwaltung</p>
    </div>
  </div>
</body>
</html>
        `.trim();

        // E-Mail senden
        const emailOptions: any = {
          from: {
            name: "RB AG IT - Abrechnungen",
            address: SMTP_CONFIG.username,
          },
          to: email,
          subject: `Ihre ${typText} - ${invoice.invoice_number}`,
          content: emailBody,
          html: htmlBody,
        };

        // PDF-Anhang hinzufügen falls vorhanden
        if (pdfAttachment) {
          emailOptions.attachments = [pdfAttachment];
        }

        await client.send(emailOptions);

        // Status in Datenbank aktualisieren
        await supabase
          .from("invoices")
          .update({
            status: "versendet",
            email_sent_at: new Date().toISOString(),
            email_recipient: email,
          })
          .eq("id", invoice.id);

        console.log(`E-Mail gesendet an: ${email} (${invoice.invoice_number})`);
        results.push({ id: invoice.id, success: true });

      } catch (sendError: any) {
        console.error(`Fehler bei ${invoice.id}:`, sendError);
        results.push({ id: invoice.id, success: false, error: sendError.message });
      }
    }

    // Verbindung schließen
    await client.close();

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} von ${results.length} E-Mails versendet`,
        count: successCount,
        failed: failCount,
        results,
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
