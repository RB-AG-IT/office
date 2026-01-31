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
const MAX_AGE_DAYS = 3;

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

async function sendEmailForRecord(supabase: any, record: any, vorlageTyp: string, force = false): Promise<{ success: boolean; skipped?: boolean; reason?: string; error?: string }> {
  const recordId = record.id;

  try {
    // 1. Bestehenden Eintrag in email_sends suchen
    const { data: existingSend } = await supabase
      .from("email_sends")
      .select("id, status, retry_count, tracking_id")
      .eq("record_id", recordId)
      .eq("vorlage_typ", vorlageTyp)
      .single();

    let emailSendId: string;
    let trackingId: string;

    if (existingSend) {
      emailSendId = existingSend.id;
      trackingId = existingSend.tracking_id;

      if (!force) {
        // Doppelversand-Schutz
        if (existingSend.status === "sent") {
          return { success: true, skipped: true, reason: "already_sent" };
        }

        // Max. Versuche erreicht
        if ((existingSend.retry_count || 0) >= 3) {
          await supabase
            .from("email_sends")
            .update({ status: "permanently_failed" })
            .eq("id", emailSendId);
          return { success: false, skipped: true, reason: "max_retries_reached" };
        }
      }
    } else {
      // Neuen Eintrag erstellen
      const { data: newSend, error: insertError } = await supabase
        .from("email_sends")
        .insert({ record_id: recordId, vorlage_typ: vorlageTyp })
        .select("id, tracking_id")
        .single();

      if (insertError || !newSend) {
        throw new Error("email_sends Eintrag konnte nicht erstellt werden");
      }

      emailSendId = newSend.id;
      trackingId = newSend.tracking_id;
    }

    // 2. Prüfen ob Email gesendet werden soll (nur bei willkommen)
    if (vorlageTyp === "willkommen") {
      if (record.record_type !== "neumitglied" || !record.email) {
        return { success: true, skipped: true, reason: "not_applicable" };
      }
    } else {
      if (!record.email) {
        return { success: true, skipped: true, reason: "no_email" };
      }
    }

    // 3. Email-Vorlage laden
    const { data: vorlage, error: vorlageError } = await supabase
      .from("email_vorlagen")
      .select("betreff, inhalt")
      .eq("vorlage_typ", vorlageTyp)
      .eq("aktiv", true)
      .single();

    if (vorlageError || !vorlage) {
      throw new Error("Email-Vorlage nicht gefunden");
    }

    // 4. Werbegebiet-Daten laden
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
        .select("customer_area_id")
        .eq("id", record.campaign_area_id)
        .single();

      if (campaignArea) {
        if (campaignArea.customer_area_id) {
          const { data: customerArea } = await supabase
            .from("customer_areas")
            .select("name_long, website, privacy_policy, customer_id, street, house_number, postal_code, city")
            .eq("id", campaignArea.customer_area_id)
            .single();

          if (customerArea) {
            werbegebietName = customerArea.name_long || "";
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

    // 5. Adresse zusammenbauen
    const adresse = [
      record.street && record.house_number ? `${record.street} ${record.house_number}` : record.street,
      record.zip_code && record.city ? `${record.zip_code} ${record.city}` : record.city,
    ].filter(Boolean).join(", ");

    const telefon = record.phone_mobile || record.phone_fixed || "";

    // 6. Platzhalter ersetzen
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

    // 7. Tracking-Pixel URL
    const trackingUrl = `${SUPABASE_URL}/functions/v1/email-tracking?id=${trackingId}`;

    // 8. HTML-Email mit Tracking-Pixel
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

    // 9. Storno-Mails: Ausserhalb 8-17 Uhr (Berlin) nur queuen, nicht senden
    if (vorlageTyp === "storno" && !force) {
      const berlinHour = new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin", hour: "numeric", hour12: false });
      const hour = parseInt(berlinHour, 10);
      if (hour >= 17 || hour < 8) {
        console.log(`Storno-Mail fuer ${record.email} queued (ausserhalb Sendezeit, ${hour} Uhr Berlin)`);
        return { success: true, skipped: true, reason: "queued_for_morning" };
      }
    }

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

    // 10. Status in email_sends aktualisieren
    await supabase
      .from("email_sends")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", emailSendId);

    console.log(`Email gesendet an: ${record.email}`);
    return { success: true };

  } catch (error) {
    console.error(`Email-Fehler fuer ${record.email}:`, error.message);

    // Fehler in email_sends speichern + Retry-Zaehler erhoehen
    const { data: currentSend } = await supabase
      .from("email_sends")
      .select("id, retry_count")
      .eq("record_id", recordId)
      .eq("vorlage_typ", vorlageTyp)
      .single();

    if (currentSend) {
      const newRetryCount = ((currentSend.retry_count || 0) + 1);
      const newStatus = newRetryCount >= 3 ? "permanently_failed" : "failed";

      await supabase
        .from("email_sends")
        .update({
          status: newStatus,
          error: error.message,
          retry_count: newRetryCount,
        })
        .eq("id", currentSend.id);
    }

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
    const vorlageTyp = payload.vorlage_typ || "willkommen";
    const force = payload.force === true;

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

      const result = await sendEmailForRecord(supabase, record, vorlageTyp, force);
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

    // Offene Eintraege in email_sends suchen
    const { data: pendingSends, error } = await supabase
      .from("email_sends")
      .select("record_id, vorlage_typ")
      .in("vorlage_typ", ["willkommen", "storno"])
      .in("status", ["queued", "failed"])
      .lt("retry_count", 3)
      .gte("created_at", twoDaysAgo)
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(`DB-Abfrage fehlgeschlagen: ${error.message}`);
    }

    if (!pendingSends || pendingSends.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Keine ausstehenden Emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${pendingSends.length} ausstehende Emails gefunden`);

    let successCount = 0;
    let failCount = 0;

    for (const send of pendingSends) {
      // Record-Daten laden
      const { data: record } = await supabase
        .from("records")
        .select("*")
        .eq("id", send.record_id)
        .single();

      if (!record) continue;

      const result = await sendEmailForRecord(supabase, record, send.vorlage_typ);
      if (result.success && !result.skipped) {
        successCount++;
      } else if (!result.success) {
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingSends.length,
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
