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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // payload außerhalb try-Block für catch-Zugriff
  let payload: any = null;
  let recordId: string | null = null;

  try {
    // 1. Record-ID aus Request oder Webhook-Payload
    payload = await req.json();
    recordId = payload.record_id || payload.record?.id;

    if (!recordId) {
      return new Response(
        JSON.stringify({ success: false, error: "record_id fehlt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Record laden
    const { data: record, error: recordError } = await supabase
      .from("records")
      .select("*")
      .eq("id", recordId)
      .single();

    if (recordError || !record) {
      throw new Error(`Record nicht gefunden: ${recordId}`);
    }

    // 3. Prüfen ob Email bereits gesendet wurde (Schutz vor Doppelversand)
    if (record.email_status === "sent") {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "already_sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3b. Prüfen ob max. Versuche erreicht (Schutz vor Endlos-Loop)
    if ((record.email_retry_count || 0) >= 3) {
      await supabase
        .from("records")
        .update({ email_status: "permanently_failed" })
        .eq("id", recordId);
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "max_retries_reached" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Prüfen ob Email gesendet werden soll
    if (record.record_type !== "neumitglied" || !record.email) {
      await supabase
        .from("records")
        .update({ email_status: "skipped" })
        .eq("id", recordId);
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      // Campaign Area laden
      const { data: campaignArea } = await supabase
        .from("campaign_areas")
        .select("name, customer_area_id")
        .eq("id", record.campaign_area_id)
        .single();

      if (campaignArea) {
        werbegebietName = campaignArea.name || werbegebietName;

        if (campaignArea.customer_area_id) {
          // Customer Area laden
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

    // 6. Hilfsfunktionen
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

    // 7. Adresse zusammenbauen
    const adresse = [
      record.street && record.house_number ? `${record.street} ${record.house_number}` : record.street,
      record.zip_code && record.city ? `${record.zip_code} ${record.city}` : record.city,
    ].filter(Boolean).join(", ");

    const telefon = record.phone_mobile || record.phone_fixed || "";

    // 8. Platzhalter ersetzen
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

    // 9. Tracking-Pixel URL
    const trackingUrl = `${SUPABASE_URL}/functions/v1/email-tracking?id=${record.email_tracking_id}`;

    // 10. HTML-Email mit Tracking-Pixel
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

    // 11. Email senden
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

    // 12. Status aktualisieren
    await supabase
      .from("records")
      .update({
        email_status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    // 13. Log-Eintrag
    await supabase
      .from("email_log")
      .insert({
        record_id: recordId,
        event_type: "sent",
        event_data: { to: record.email, subject: emailSubject },
      });

    console.log(`Email gesendet an: ${record.email}`);

    return new Response(
      JSON.stringify({ success: true, email: record.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Email-Fehler:", error.message);

    // Fehler in DB speichern + Retry-Zähler erhöhen
    if (recordId) {
      // Aktuellen retry_count laden
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
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
