import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://lgztglycqtiwcmiydxnm.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const EMAIL_ADDRESS = "verwaltung@drk-mitgliederwerbungen.de";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";

// Max. Alter in Tagen fuer automatischen Versand (Cron-Modus)
const MAX_AGE_DAYS = 2;

// ============================================
// Hilfsfunktionen
// ============================================

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE");
};

const maskIban = (iban: string | null) => {
  if (!iban) return "";
  const clean = iban.replace(/\s/g, "");
  if (clean.length < 6) return iban;
  return clean.substring(0, 4) + " **** **** **** " + clean.substring(clean.length - 2);
};

const intervallMap: Record<string, string> = {
  monthly: "Monat",
  quarterly: "Quartal",
  halfyearly: "Halbjahr",
  yearly: "Jahr",
};

// ============================================
// Einzelne Email versenden
// ============================================

async function sendEmailForRecord(supabase: any, record: any): Promise<{ success: boolean; skipped?: boolean; reason?: string; error?: string }> {
  const recordId = record.id;

  try {
    // 1. Prüfen ob Email bereits gesendet (Doppelversand-Schutz)
    if (record.email_status === "sent") {
      return { success: true, skipped: true, reason: "already_sent" };
    }

    // 2. Prüfen ob max. Versuche erreicht
    if ((record.email_retry_count || 0) >= 3) {
      await supabase
        .from("records")
        .update({ email_status: "permanently_failed" })
        .eq("id", recordId);
      return { success: false, skipped: true, reason: "max_retries_reached" };
    }

    // 3. Prüfen ob Email gesendet werden soll
    if (record.record_type !== "neumitglied" || !record.email) {
      await supabase
        .from("records")
        .update({ email_status: "skipped" })
        .eq("id", recordId);
      return { success: true, skipped: true, reason: "not_applicable" };
    }

    // 4. Email-Vorlage laden
    const { data: vorlage, error: vorlageError } = await supabase
      .from("email_vorlagen")
      .select("betreff, inhalt")
      .eq("vorlage_typ", "willkommen")
      .eq("aktiv", true)
      .single();

    if (vorlageError || !vorlage) {
      throw new Error("Email-Vorlage nicht gefunden");
    }

    // 5. Werbegebiet-Daten laden
    let werbegebietName = "DRK Mitgliederwerbung";
    let websiteLink = "";
    let datenschutzLink = "";
    let ansprechpartnerName = "";
    let ansprechpartnerTelefon = "";
    let ansprechpartnerEmail = "";
    let anschriftOv = "";

    if (record.campaign_area_id) {
      const { data: campaignArea } = await supabase
        .from("campaign_areas")
        .select("name, customer_area_id")
        .eq("id", record.campaign_area_id)
        .single();

      if (campaignArea) {
        werbegebietName = campaignArea.name || werbegebietName;

        if (campaignArea.customer_area_id) {
          const { data: customerArea } = await supabase
            .from("customer_areas")
            .select("website, privacy_policy, customer_id, street, house_number, postal_code, city")
            .eq("id", campaignArea.customer_area_id)
            .single();

          if (customerArea) {
            websiteLink = customerArea.website || "";
            datenschutzLink = customerArea.privacy_policy || "";

            if (customerArea.street || customerArea.city) {
              const strasseHnr = [customerArea.street, customerArea.house_number].filter(Boolean).join(" ");
              const plzOrt = [customerArea.postal_code, customerArea.city].filter(Boolean).join(" ");
              anschriftOv = [strasseHnr, plzOrt].filter(Boolean).join(", ");
            }

            // Ansprechpartner laden (nur Mitgliederbeauftragte)
            const { data: contacts } = await supabase
              .from("customer_area_contacts")
              .select("first_name, last_name, phone, email")
              .eq("area_id", campaignArea.customer_area_id)
              .eq("role", "mitgliederbeauftragte")
              .limit(1);

            if (contacts && contacts.length > 0) {
              const c = contacts[0];
              ansprechpartnerName = [c.first_name, c.last_name].filter(Boolean).join(" ");
              ansprechpartnerTelefon = c.phone || "";
              ansprechpartnerEmail = c.email || "";
            }

            // Fallback: Kunden-Daten
            const customerId = customerArea.customer_id || record.customer_id;
            if (customerId && (!websiteLink || !datenschutzLink || !ansprechpartnerName)) {
              const { data: customer } = await supabase
                .from("customers")
                .select("website, privacy_policy, street, house_number, postal_code, city")
                .eq("id", customerId)
                .single();

              if (customer) {
                if (!websiteLink) websiteLink = customer.website || "";
                if (!datenschutzLink) datenschutzLink = customer.privacy_policy || "";
                if (!anschriftOv && (customer.street || customer.city)) {
                  const strasseHnr = [customer.street, customer.house_number].filter(Boolean).join(" ");
                  const plzOrt = [customer.postal_code, customer.city].filter(Boolean).join(" ");
                  anschriftOv = [strasseHnr, plzOrt].filter(Boolean).join(", ");
                }
              }

              // Fallback: Kunden-Ansprechpartner (nur Mitgliederbeauftragte)
              if (!ansprechpartnerName) {
                const { data: customerContacts } = await supabase
                  .from("customer_contacts")
                  .select("first_name, last_name, phone, email")
                  .eq("customer_id", customerId)
                  .eq("role", "mitgliederbeauftragte")
                  .limit(1);

                if (customerContacts && customerContacts.length > 0) {
                  const c = customerContacts[0];
                  ansprechpartnerName = [c.first_name, c.last_name].filter(Boolean).join(" ");
                  ansprechpartnerTelefon = c.phone || "";
                  ansprechpartnerEmail = c.email || "";
                }
              }
            }
          }
        }
      }
    }

    // 6. Adresse zusammenbauen
    const adresse = [
      record.street && record.house_number ? `${record.street} ${record.house_number}` : record.street,
      record.zip_code && record.city ? `${record.zip_code} ${record.city}` : record.city,
    ].filter(Boolean).join(", ");

    const telefon = record.phone_mobile || record.phone_fixed || "";

    // 7. Platzhalter ersetzen
    let emailBody = vorlage.inhalt
      .replace(/\{\{anrede\}\}/g, record.salutation || "")
      .replace(/\{\{vorname\}\}/g, record.first_name || "")
      .replace(/\{\{nachname\}\}/g, record.last_name || "")
      .replace(/\{\{email\}\}/g, record.email || "")
      .replace(/\{\{telefon\}\}/g, telefon)
      .replace(/\{\{geburtsdatum\}\}/g, formatDate(record.birth_date))
      .replace(/\{\{adresse\}\}/g, adresse)
      .replace(/\{\{kontoinhaber\}\}/g, record.account_holder || "")
      .replace(/\{\{iban_maskiert\}\}/g, maskIban(record.iban))
      .replace(/\{\{betrag\}\}/g, record.amount?.toString() || "")
      .replace(/\{\{intervall\}\}/g, intervallMap[record.interval] || record.interval || "")
      .replace(/\{\{werbegebiet_name\}\}/g, werbegebietName)
      .replace(/\{\{ansprechpartner_name\}\}/g, ansprechpartnerName)
      .replace(/\{\{ansprechpartner_telefon\}\}/g, ansprechpartnerTelefon)
      .replace(/\{\{ansprechpartner_email\}\}/g, ansprechpartnerEmail)
      .replace(/\{\{website_link\}\}/g, websiteLink)
      .replace(/\{\{datenschutz_link\}\}/g, datenschutzLink)
      .replace(/\{\{anschrift_ov\}\}/g, anschriftOv);

    let emailSubject = vorlage.betreff
      .replace(/\{\{anrede\}\}/g, record.salutation || "")
      .replace(/\{\{vorname\}\}/g, record.first_name || "")
      .replace(/\{\{nachname\}\}/g, record.last_name || "")
      .replace(/\{\{werbegebiet_name\}\}/g, werbegebietName);

    // 8. Tracking-Pixel URL
    const trackingUrl = `${SUPABASE_URL}/functions/v1/email-tracking?id=${record.email_tracking_id}`;

    // 9. HTML-Email mit Tracking-Pixel
    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="font-family: Arial, sans-serif;">
${emailBody.replace(/\n/g, "<br>")}
<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="">
</body>
</html>`;

    // 10. Email senden via SMTP
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.hostinger.com",
        port: 465,
        tls: true,
        auth: {
          username: EMAIL_ADDRESS,
          password: SMTP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `${werbegebietName} <${EMAIL_ADDRESS}>`,
      to: record.email,
      subject: emailSubject,
      content: emailBody,
      html: htmlBody,
    });

    await client.close();

    // 11. Status aktualisieren
    await supabase
      .from("records")
      .update({
        email_status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    // 12. Log-Eintrag
    await supabase
      .from("email_log")
      .insert({
        record_id: recordId,
        event_type: "sent",
        event_data: { to: record.email, subject: emailSubject },
      });

    console.log(`Email gesendet an: ${record.email}`);
    return { success: true };

  } catch (error) {
    console.error(`Email-Fehler fuer ${record.email}:`, error.message);

    // Fehler in DB speichern + Retry-Zaehler erhoehen
    const { data: currentRecord } = await supabase
      .from("records")
      .select("email_retry_count")
      .eq("id", recordId)
      .single();

    const newRetryCount = ((currentRecord?.email_retry_count || 0) + 1);
    const newStatus = newRetryCount >= 3 ? "permanently_failed" : "failed";

    await supabase
      .from("records")
      .update({
        email_status: newStatus,
        email_error: error.message,
        email_retry_count: newRetryCount,
      })
      .eq("id", recordId);

    await supabase
      .from("email_log")
      .insert({
        record_id: recordId,
        event_type: "failed",
        event_data: { error: error.message },
      });

    return { success: false, error: error.message };
  }
}

// ============================================
// Hauptserver: Einzelmodus + Cron-Modus
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Request-Body lesen
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      // Leerer Body = Cron-Modus
      payload = {};
    }

    const recordId = payload.record_id || payload.record?.id;

    // ============================================
    // MODUS 1: Einzelne Email (mit record_id)
    // ============================================
    if (recordId) {
      const { data: record, error: recordError } = await supabase
        .from("records")
        .select("*")
        .eq("id", recordId)
        .single();

      if (recordError || !record) {
        return new Response(
          JSON.stringify({ success: false, error: `Record nicht gefunden: ${recordId}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await sendEmailForRecord(supabase, record);
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // MODUS 2: Cron (ohne record_id)
    // Sucht alle offenen Emails und verschickt sie
    // ============================================

    const twoDaysAgo = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Nur Records der letzten 2 Tage laden (max 3 Versuche)
    const { data: records, error } = await supabase
      .from("records")
      .select("*")
      .in("email_status", ["queued", "failed"])
      .lt("email_retry_count", 3)
      .eq("record_type", "neumitglied")
      .not("email", "is", null)
      .gte("created_at", twoDaysAgo)
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(`DB-Abfrage fehlgeschlagen: ${error.message}`);
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Keine ausstehenden Emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${records.length} ausstehende Emails gefunden`);

    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
      const result = await sendEmailForRecord(supabase, record);
      if (result.success && !result.skipped) {
        successCount++;
      } else if (!result.success) {
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: records.length,
        sent: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fehler:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
