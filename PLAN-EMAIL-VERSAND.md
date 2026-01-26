# Plan: Zuverlässiger Willkommensemail-Versand

## Übersicht

Dieses Dokument beschreibt die Umstellung des Willkommensemail-Versands von einer Frontend-basierten Lösung auf eine Server-basierte Lösung mit Tracking.

---

## Das Problem (Ist-Zustand)

### Aktueller Ablauf

```
1. Mitarbeiter füllt Formular aus → Klickt "Absenden"
2. Daten werden auf dem Handy gespeichert (offline)
3. Erfolgsseite wird angezeigt
4. IM HINTERGRUND: Handy lädt Daten hoch + sendet Email
5. Wenn Mitarbeiter Formular/Browser schließt → Email wird NICHT gesendet
```

### Probleme

| Problem | Auswirkung |
|---------|------------|
| Email wird vom Handy gesendet | Wenn Browser geschlossen → keine Email |
| Kein Tracking | Wir wissen nicht ob Email ankam |
| Kein Logging | Wir wissen nicht ob Email gesendet wurde |
| Keine Retry-Logik | Bei Fehler kein erneuter Versuch |

---

## Die Lösung (Soll-Zustand)

### Neuer Ablauf

```
1. Mitarbeiter füllt Formular aus → Klickt "Absenden"
2. Daten werden auf dem Handy gespeichert (offline)
3. Erfolgsseite wird angezeigt
4. Daten werden hochgeladen (kann auch später passieren)
5. SERVER erkennt neuen Eintrag → SERVER sendet Email automatisch
6. Mitarbeiter sieht Toast: "Email an Max Mustermann gesendet"
```

### Vorteile

| Vorteil | Beschreibung |
|---------|--------------|
| 100% zuverlässig | Server sendet, egal was mit Handy passiert |
| Tracking | Wir sehen ob Email geöffnet wurde |
| Logging | Jeder Versand wird protokolliert |
| Bounce-Handling | Wir erkennen ungültige Email-Adressen |

---

## Technische Komponenten

### 1. Datenbank (Supabase PostgreSQL)

**Neue Felder in `records`-Tabelle:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `email_status` | TEXT | Status: pending, queued, sent, failed, bounced, skipped |
| `email_sent_at` | TIMESTAMPTZ | Zeitpunkt des Versands |
| `email_opened_at` | TIMESTAMPTZ | Zeitpunkt der Öffnung (Tracking) |
| `email_error` | TEXT | Fehlermeldung bei Problemen |
| `email_tracking_id` | UUID | Eindeutige ID für Tracking-Pixel |

**Neue Tabelle `email_log`:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `record_id` | UUID | Verknüpfung zum Datensatz |
| `event_type` | TEXT | queued, sent, opened, bounced, failed |
| `event_data` | JSONB | Zusätzliche Daten |
| `created_at` | TIMESTAMPTZ | Zeitstempel |

### 2. Database Webhook (Supabase Dashboard)

**Was ist ein Webhook?**
Ein Webhook ist ein automatischer "Anruf" zwischen Systemen. Wenn ein neuer Datensatz in der Datenbank gespeichert wird, "ruft" die Datenbank automatisch unsere Email-Funktion an.

**Konfiguration:**
- Tabelle: `records`
- Event: `INSERT`
- URL: `https://lgztglycqtiwcmiydxnm.supabase.co/functions/v1/send-welcome-email`

### 3. Edge Functions (Serverless Functions)

**a) `send-welcome-email`**
- Wird vom Webhook aufgerufen
- Lädt alle benötigten Daten
- Baut Email zusammen
- Fügt Tracking-Pixel ein
- Sendet via SMTP
- Aktualisiert Status in Datenbank

**b) `email-tracking`**
- Wird aufgerufen wenn Empfänger Email öffnet
- Speichert Öffnungszeitpunkt
- Gibt transparentes 1x1 Pixel zurück

### 4. Frontend (Base/formular)

**Änderungen:**
- Alter Email-Code wird entfernt
- Realtime-Listener für `email_status`
- Toast-Benachrichtigung wenn Email versendet

---

## Datenbank-Schema

### Tabellen-Beziehungen für Email-Platzhalter

```
records
    │
    ├── campaign_area_id ──→ campaign_areas
    │                              │
    │                              └── customer_area_id ──→ customer_areas
    │                                                            │
    │                                                            ├── website
    │                                                            ├── privacy_policy
    │                                                            ├── adresse
    │                                                            │
    │                                                            └── customer_id ──→ customers (Fallback)
    │
    └── customer_id ──→ customers (Fallback)


customer_areas ←── customer_area_contacts (Ansprechpartner)
customers ←── customer_contacts (Ansprechpartner Fallback)
```

### Platzhalter-Mapping

| Platzhalter | Quelle |
|-------------|--------|
| `{{vorname}}` | records.first_name |
| `{{nachname}}` | records.last_name |
| `{{anrede}}` | records.salutation |
| `{{email}}` | records.email |
| `{{telefon}}` | records.phone_mobile oder phone_fixed |
| `{{geburtsdatum}}` | records.birth_date (formatiert) |
| `{{adresse}}` | records.street + house_number + zip_code + city |
| `{{kontoinhaber}}` | records.account_holder |
| `{{iban_maskiert}}` | records.iban (maskiert: DE89 **** **** 1234) |
| `{{betrag}}` | records.amount |
| `{{intervall}}` | records.interval (Monat/Quartal/Jahr) |
| `{{werbegebiet_name}}` | campaign_areas.name |
| `{{ansprechpartner_name}}` | customer_area_contacts oder customer_contacts |
| `{{ansprechpartner_telefon}}` | customer_area_contacts.phone |
| `{{ansprechpartner_email}}` | customer_area_contacts.email |
| `{{website_link}}` | customer_areas.website oder customers.website |
| `{{datenschutz_link}}` | customer_areas.privacy_policy oder customers.privacy_policy |
| `{{anschrift_ov}}` | customer_areas Adresse oder customers Adresse |

---

## Implementierung Schritt für Schritt

### Schritt 1: Migration erstellen

**Datei:** `database/migrations/080-email-tracking.sql`

```sql
-- ================================================================
-- MIGRATION 080: Email-Tracking Felder
-- ================================================================

-- 1. Neue Felder in records
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_status TEXT
    DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'queued', 'sent', 'failed', 'bounced', 'skipped'));

ALTER TABLE records ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ;
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_error TEXT;
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_tracking_id UUID DEFAULT gen_random_uuid();

-- 2. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_records_email_status ON records(email_status);
CREATE INDEX IF NOT EXISTS idx_records_email_tracking_id ON records(email_tracking_id);

-- 3. Email-Log Tabelle
CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES records(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('queued', 'sent', 'opened', 'bounced', 'failed')),
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_record ON email_log(record_id);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(event_type);

-- 4. RLS für email_log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_log_select" ON email_log FOR SELECT USING (true);
CREATE POLICY "email_log_insert" ON email_log FOR INSERT WITH CHECK (true);

-- 5. Trigger für email_status bei INSERT
CREATE OR REPLACE FUNCTION set_email_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur für Neumitglieder mit Email
    IF NEW.record_type = 'neumitglied' AND NEW.email IS NOT NULL AND NEW.email != '' THEN
        NEW.email_status := 'queued';
    ELSE
        NEW.email_status := 'skipped';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_record_insert_set_email_status ON records;
CREATE TRIGGER on_record_insert_set_email_status
    BEFORE INSERT ON records
    FOR EACH ROW
    EXECUTE FUNCTION set_email_status_on_insert();
```

**Ausführen:**
```bash
# Im Supabase Dashboard unter SQL Editor ausführen
# ODER via Supabase CLI:
supabase db push
```

---

### Schritt 2: Edge Function `send-welcome-email` erstellen

**Datei:** `supabase/functions/send-welcome-email/index.ts`

```typescript
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
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "aZemi211!";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Record-ID aus Request oder Webhook-Payload
    const payload = await req.json();
    const recordId = payload.record_id || payload.record?.id;

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

    // 3. Prüfen ob Email gesendet werden soll
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

            // Ansprechpartner laden
            const { data: contacts } = await supabase
              .from("customer_area_contacts")
              .select("first_name, last_name, phone, email")
              .eq("area_id", campaignArea.customer_area_id)
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

              // Fallback: Kunden-Ansprechpartner
              if (!ansprechpartnerName) {
                const { data: customerContacts } = await supabase
                  .from("customer_contacts")
                  .select("first_name, last_name, phone, email")
                  .eq("customer_id", customerId)
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
      .replace(/\{\{vorname\}\}/g, record.first_name || "")
      .replace(/\{\{nachname\}\}/g, record.last_name || "");

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

    // Fehler in DB speichern
    if (payload?.record_id || payload?.record?.id) {
      const recordId = payload.record_id || payload.record?.id;
      await supabase
        .from("records")
        .update({
          email_status: "failed",
          email_error: error.message,
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
```

---

### Schritt 3: Edge Function `email-tracking` erstellen

**Datei:** `supabase/functions/email-tracking/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = "https://lgztglycqtiwcmiydxnm.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Transparentes 1x1 GIF
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

serve(async (req) => {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get("id");

  if (trackingId) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Nur beim ersten Öffnen speichern
      const { data: record } = await supabase
        .from("records")
        .select("id, email_opened_at")
        .eq("email_tracking_id", trackingId)
        .single();

      if (record && !record.email_opened_at) {
        await supabase
          .from("records")
          .update({ email_opened_at: new Date().toISOString() })
          .eq("id", record.id);

        await supabase
          .from("email_log")
          .insert({
            record_id: record.id,
            event_type: "opened",
          });

        console.log(`Email geöffnet: ${record.id}`);
      }
    } catch (error) {
      console.error("Tracking-Fehler:", error.message);
    }
  }

  // Immer das Pixel zurückgeben
  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
});
```

---

### Schritt 4: Edge Functions deployen

```bash
cd /Users/verwaltung/Desktop/RB-AG-IT/Office

# send-welcome-email deployen
supabase functions deploy send-welcome-email --no-verify-jwt

# email-tracking deployen
supabase functions deploy email-tracking --no-verify-jwt
```

---

### Schritt 5: Database Webhook einrichten

**Im Supabase Dashboard:**

1. Gehe zu: Database → Webhooks
2. Klicke: "Create a new webhook"
3. Konfiguration:
   - **Name:** `send-welcome-email-on-insert`
   - **Table:** `records`
   - **Events:** `INSERT`
   - **Type:** `Supabase Edge Function`
   - **Function:** `send-welcome-email`
   - **HTTP Headers:** (keine nötig)
4. Speichern

---

### Schritt 6: Frontend anpassen (Base/formular/index.html)

**6.1 Alten Email-Code entfernen:**

Lösche folgende Bereiche:
- Zeilen 2150-2160 (Email-Versand in `backgroundUpload()`)
- Zeilen 2163-2168 (Email-bezogene Toasts)
- Zeilen 2944-3138 (komplette `sendConfirmationEmail()` Funktion)

**6.2 Neue Toast-Funktion hinzufügen:**

```javascript
// Nach showToast() Funktion (ca. Zeile 2120) einfügen:

function showEmailToast(firstName, lastName, email) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: white; border-radius: 50%; padding: 8px; display: flex; align-items: center; justify-content: center;">
                <svg style="width: 20px; height: 20px; color: #10B981;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
            </div>
            <div>
                <div style="font-weight: 600;">Willkommensemail versendet</div>
                <div style="font-size: 12px; opacity: 0.9;">${firstName} ${lastName} (${email})</div>
            </div>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}
```

**6.3 Realtime-Subscription hinzufügen:**

In `backgroundUpload()` nach dem erfolgreichen Insert:

```javascript
// Nach: console.log('Hintergrund-Upload erfolgreich:', insertedRecord.id);

// Realtime-Subscription für Email-Status
if (formData.type === 'NMG' && formData.email) {
    const emailChannel = supabaseClient
        .channel(`email-${insertedRecord.id}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'records',
            filter: `id=eq.${insertedRecord.id}`
        }, (payload) => {
            if (payload.new.email_status === 'sent') {
                showEmailToast(
                    payload.new.first_name,
                    payload.new.last_name,
                    payload.new.email
                );
                supabaseClient.removeChannel(emailChannel);
            } else if (payload.new.email_status === 'failed') {
                showToast('Email-Versand fehlgeschlagen', 5000, 'info');
                supabaseClient.removeChannel(emailChannel);
            }
        })
        .subscribe();

    // Timeout nach 30 Sekunden
    setTimeout(() => {
        supabaseClient.removeChannel(emailChannel);
    }, 30000);
}
```

**6.4 Erfolgsseite-Text anpassen:**

Ändere Zeile 2927:
```javascript
// Alt:
${formData.email ? 'Die Bestätigungs-E-Mail wird im Hintergrund versendet.' : ''}

// Neu:
${formData.email ? 'Die Willkommensemail wird automatisch versendet.' : ''}
```

**6.5 backgroundUpload() Toast vereinfachen:**

```javascript
// Alt (Zeilen 2162-2169):
if (emailSent) {
    showToast('Erfolgreich hochgeladen & Willkommensemail verschickt');
} else if (formData.type === 'NMG' && formData.email) {
    showToast('Erfolgreich hochgeladen (Email-Versand fehlgeschlagen)');
} else {
    showToast('Erfolgreich hochgeladen');
}

// Neu:
showToast('Erfolgreich hochgeladen');
```

---

### Schritt 7: Realtime für `records` aktivieren

**Im Supabase Dashboard:**

1. Gehe zu: Database → Replication
2. Finde Tabelle: `records`
3. Aktiviere: `Realtime` (falls nicht aktiv)
4. Wähle Events: `UPDATE`

---

### Schritt 8: Testen

| Test | Erwartung |
|------|-----------|
| NMG mit Email erstellen | Email wird gesendet, Toast erscheint |
| NMG ohne Email erstellen | email_status = 'skipped' |
| Erhöhung erstellen | email_status = 'skipped' |
| Email öffnen | email_opened_at wird gesetzt |
| Formular sofort schließen | Email wird trotzdem gesendet |

---

## Dateien-Übersicht

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `database/migrations/080-email-tracking.sql` | NEU | DB-Schema |
| `supabase/functions/send-welcome-email/index.ts` | NEU | Email-Versand |
| `supabase/functions/email-tracking/index.ts` | NEU | Öffnungs-Tracking |
| `Base/formular/index.html` | ÄNDERN | Frontend |

---

## Glossar

| Begriff | Erklärung |
|---------|-----------|
| **Edge Function** | Serverless Funktion die auf Supabase läuft |
| **Webhook** | Automatischer HTTP-Aufruf bei Datenbank-Events |
| **Realtime** | Live-Updates vom Server zum Browser |
| **Tracking-Pixel** | Unsichtbares 1x1 Bild das Öffnungen trackt |
| **SMTP** | Protokoll zum Email-Versand |
| **Bounce** | Email die nicht zugestellt werden konnte |

---

## Kontakt

Bei Fragen zur Implementierung: [Entwickler kontaktieren]
