# Ledger-System: Werber & Kunden

**Erstellt:** 11.01.2026
**Status:** ✅ Abgeschlossen (getestet)
**Ziel:** Vollständiges Buchungssystem für Einheiten (Werber) und Jahreseuros (Kunden)

> **WICHTIG:** Bei jedem Fortschritt muss diese Datei aktualisiert werden!
> Dokumentiere hier: Status-Änderungen, neue Erkenntnisse, Probleme, Entscheidungen.

---

## Migration vom alten System

**Entscheidung:** Option B - Altes System komplett löschen und durch neues ersetzen.

### Betroffene Stellen (müssen angepasst/entfernt werden)

| Datei | Komponente | Aktion | Status |
|-------|------------|--------|--------|
| `database/migrations/018-provision-update-trigger.sql` | `handle_record_provision_update()` Trigger | LÖSCHEN | ✅ Erledigt |
| `js/main.js` (Zeile ~12095) | `erstelleAbrechnung()` → Insert in provisions_ledger | ENTFERNT | ✅ Erledigt |
| `tests/test-provisions-db.html` | Test für altes provisions_ledger Schema | ANGEPASST | ✅ Erledigt |
| Supabase DB | Tabelle `provisions_ledger` (altes Schema) | DROP + NEU | ✅ Ausgeführt |
| Supabase DB | View `user_provisions_saldo` | GELÖSCHT | ✅ Erledigt |

### Detaillierte Code-Stellen

**js/main.js (~Zeile 12092-12098):**
```javascript
// ALT - Muss angepasst werden:
const { error: ledgerError } = await supabase
    .from('provisions_ledger')
    .insert(ledgerEntries);  // ledgerEntries verwendet altes Schema!
```

**tests/test-provisions-db.html:**
- Test-Funktion `test5_provisionsLedger()` erwartet altes Schema
- Muss auf neue Spalten (`einheiten`, `kw`, `year`, etc.) angepasst werden

### Unterschied Alt vs. Neu

| Aspekt | Altes System | Neues System |
|--------|--------------|--------------|
| Einheit | EUR (betrag_provision) | EH (einheiten) |
| Vorschuss | Direkt berechnet & gespeichert | Erst bei Abrechnung berechnet |
| Spalten | vorschuss_anteil, betrag_vorschuss, betrag_stornorucklage | einheiten, kw, year, referenz_datum, beschreibung |
| Flexibilität | Faktor-Änderung = Umbuchung nötig | Faktor-Änderung = kein Problem |

---

## Konzept

### Warum Ledger?

| Vorteil | Beschreibung |
|---------|--------------|
| **Korrektheit** | Zeitraum-Filter funktionieren (EH für KW 3-5 abfragen) |
| **Nachvollziehbarkeit** | Jede Buchung dokumentiert (Audit-Trail) |
| **Einfachere Logik** | Keine Neuberechnung, nur SUM() |
| **Storno-Handling** | Gegenbuchung statt Neuberechnung |
| **Konsistenz** | Einmal gebucht = bleibt so |
| **Performance** | Schnellere Dashboard-Abfragen |

### Drei Ledger

| | Werber-Ledger | Kunden-Ledger | Euro-Ledger |
|---|---------------|---------------|-------------|
| **Tabelle** | `provisions_ledger` | `customer_billing_ledger` | `euro_ledger` |
| **Referenz** | `user_id` | `customer_id` | `user_id` |
| **Einheit** | EH (Einheiten) | Jahreseuros | EUR |
| **Kategorien** | werben, teamleitung, quality, empfehlung, recruiting | - | unterkunft, sonderposten, sonstiges |
| **Typen** | provision, storno, korrektur | provision, storno, korrektur | abzug, zubuchung, korrektur |
| **Zweck** | Provision berechnen | Rechnung an Kunde | Abzüge/Zubuchungen bei Abrechnung |

### Prinzip: Nur EH buchen, Provision bei Abrechnung

```
Record erstellt → EH sofort ins Ledger buchen
Abrechnung erstellt → EH aus Ledger × Faktor = Provision
```

**Vorteil:** Bei Faktor-Änderung keine Umbuchungen nötig. Faktor wird erst bei Abrechnung angewendet.

---

## Datenbank-Schema

### 1. Werber-Ledger (provisions_ledger)

```sql
CREATE TABLE IF NOT EXISTS public.provisions_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

    -- Kontext-Referenzen (für Filterung)
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    campaign_area_id UUID REFERENCES public.campaign_areas(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

    -- Buchungsdetails
    kategorie TEXT NOT NULL CHECK (kategorie IN ('werben', 'teamleitung', 'quality', 'empfehlung', 'recruiting')),
    typ TEXT NOT NULL CHECK (typ IN ('provision', 'storno', 'korrektur')),
    einheiten DECIMAL(10,4) NOT NULL,  -- Kann negativ sein bei Storno

    -- Zeitbezug (wann wurde EH verdient)
    kw INTEGER CHECK (kw >= 1 AND kw <= 53),
    year INTEGER,
    referenz_datum DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    beschreibung TEXT
);

-- Indizes
CREATE INDEX idx_provisions_ledger_user_id ON provisions_ledger(user_id);
CREATE INDEX idx_provisions_ledger_record_id ON provisions_ledger(record_id);
CREATE INDEX idx_provisions_ledger_kategorie ON provisions_ledger(kategorie);
CREATE INDEX idx_provisions_ledger_kw_year ON provisions_ledger(kw, year);
CREATE INDEX idx_provisions_ledger_created_at ON provisions_ledger(created_at);
CREATE INDEX idx_provisions_ledger_campaign ON provisions_ledger(campaign_id);
CREATE INDEX idx_provisions_ledger_area ON provisions_ledger(campaign_area_id);
CREATE INDEX idx_provisions_ledger_customer ON provisions_ledger(customer_id);
```

### 2. Kunden-Ledger (customer_billing_ledger)

```sql
CREATE TABLE IF NOT EXISTS public.customer_billing_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,  -- Verknüpfung zur Kundenrechnung

    -- Kontext-Referenzen (für Filterung)
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    campaign_area_id UUID REFERENCES public.campaign_areas(id) ON DELETE SET NULL,
    werber_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Buchungsdetails
    typ TEXT NOT NULL CHECK (typ IN ('provision', 'storno', 'korrektur')),
    jahreseuros DECIMAL(10,2) NOT NULL,  -- Kann negativ sein bei Storno

    -- Zeitbezug
    kw INTEGER CHECK (kw >= 1 AND kw <= 53),
    year INTEGER,
    referenz_datum DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    beschreibung TEXT
);

-- Indizes
CREATE INDEX idx_customer_billing_ledger_customer_id ON customer_billing_ledger(customer_id);
CREATE INDEX idx_customer_billing_ledger_record_id ON customer_billing_ledger(record_id);
CREATE INDEX idx_customer_billing_ledger_invoice_id ON customer_billing_ledger(invoice_id);
CREATE INDEX idx_customer_billing_ledger_kw_year ON customer_billing_ledger(kw, year);
CREATE INDEX idx_billing_ledger_campaign ON customer_billing_ledger(campaign_id);
CREATE INDEX idx_billing_ledger_area ON customer_billing_ledger(campaign_area_id);
CREATE INDEX idx_billing_ledger_werber ON customer_billing_ledger(werber_id);
```

### 3. Euro-Ledger (euro_ledger)

```sql
CREATE TABLE IF NOT EXISTS public.euro_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

    -- Buchungsdetails
    kategorie TEXT NOT NULL CHECK (kategorie IN ('unterkunft', 'sonderposten', 'sonstiges')),
    typ TEXT NOT NULL CHECK (typ IN ('abzug', 'zubuchung', 'korrektur')),
    betrag DECIMAL(10,2) NOT NULL,  -- Positiv = Zubuchung, Negativ = Abzug
    quelle TEXT CHECK (quelle IN ('vorschuss', 'stornorucklage')),

    -- Kontext
    beschreibung TEXT,
    kw INTEGER,
    year INTEGER,
    referenz_datum DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indizes
CREATE INDEX idx_euro_ledger_user_id ON euro_ledger(user_id);
CREATE INDEX idx_euro_ledger_invoice_id ON euro_ledger(invoice_id);
CREATE INDEX idx_euro_ledger_kategorie ON euro_ledger(kategorie);
```

**Hinweis:** Euro-Ledger hat keine Trigger - Einträge werden manuell über `fuegeAbzugHinzu()` erstellt.

---

## Trigger-Logik

### Übersicht: Record-Events

| Event | Werber-Ledger | Kunden-Ledger |
|-------|---------------|---------------|
| **INSERT** | Buchung für alle zugewiesenen Kategorien | Buchung für customer_id |
| **UPDATE: yearly_amount** | Differenz-Buchung (Korrektur) | Differenz-Buchung |
| **UPDATE: record_status → storno** | Gegenbuchung alle Kategorien | Gegenbuchung |
| **UPDATE: werber_id** | Storno alt + Buchung neu | - |
| **UPDATE: teamchef_id** | Storno alt + Buchung neu | - |
| **UPDATE: quality_id** | Storno alt + Buchung neu | - |
| **UPDATE: empfehlung_id** | Storno alt + Buchung neu | - |
| **UPDATE: recruiting_id** | Storno alt + Buchung neu | - |
| **UPDATE: customer_id** | - | Storno alt + Buchung neu |
| **DELETE** | Gegenbuchung alle | Gegenbuchung |

### Trigger 1: Record INSERT

```sql
CREATE OR REPLACE FUNCTION handle_record_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_einheiten DECIMAL(10,4);
BEGIN
    -- Nur bei aktiven Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- Einheiten berechnen (Jahreseuros / 12)
    v_einheiten := COALESCE(NEW.yearly_amount, 0) / 12;

    -- ========== WERBER-LEDGER ==========

    -- 1. Werben-Provision (werber_id)
    IF NEW.werber_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 2. Teamleitung-Provision (teamchef_id)
    IF NEW.teamchef_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 3. Quality-Provision (quality_id)
    IF NEW.quality_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 4. Empfehlungs-Provision (empfehlung_id)
    IF NEW.empfehlung_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 5. Recruiting-Provision (recruiting_id)
    IF NEW.recruiting_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- ========== KUNDEN-LEDGER ==========

    IF NEW.customer_id IS NOT NULL THEN
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_insert ON public.records;
CREATE TRIGGER on_record_insert
    AFTER INSERT ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_insert();
```

### Trigger 2: Record UPDATE (yearly_amount, record_status, werber_id, customer_id)

```sql
CREATE OR REPLACE FUNCTION handle_record_update()
RETURNS TRIGGER AS $$
DECLARE
    v_old_einheiten DECIMAL(10,4);
    v_new_einheiten DECIMAL(10,4);
    v_diff_einheiten DECIMAL(10,4);
    v_diff_jahreseuros DECIMAL(10,2);
BEGIN
    v_old_einheiten := COALESCE(OLD.yearly_amount, 0) / 12;
    v_new_einheiten := COALESCE(NEW.yearly_amount, 0) / 12;
    v_diff_einheiten := v_new_einheiten - v_old_einheiten;
    v_diff_jahreseuros := COALESCE(NEW.yearly_amount, 0) - COALESCE(OLD.yearly_amount, 0);

    -- ========== STORNO (record_status → storno) ==========

    IF OLD.record_status = 'aktiv' AND NEW.record_status = 'storno' THEN
        -- Werber-Ledger: Gegenbuchung für alle Kategorien
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        SELECT user_id, record_id, kategorie, 'storno', -einheiten, kw, year, referenz_datum, 'Record storniert'
        FROM provisions_ledger
        WHERE record_id = NEW.id AND typ = 'provision';

        -- Kunden-Ledger: Gegenbuchung
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
        SELECT customer_id, record_id, 'storno', -jahreseuros, kw, year, referenz_datum, 'Record storniert'
        FROM customer_billing_ledger
        WHERE record_id = NEW.id AND typ = 'provision';

        RETURN NEW;
    END IF;

    -- ========== REAKTIVIERUNG (record_status storno → aktiv) ==========

    IF OLD.record_status = 'storno' AND NEW.record_status = 'aktiv' THEN
        -- Werber-Ledger: Neue Buchungen
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;
        -- (analog für teamchef_id, quality_id, empfehlung_id, recruiting_id)

        -- Kunden-Ledger: Neue Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        RETURN NEW;
    END IF;

    -- Ab hier nur für aktive Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- ========== BETRAGS-ÄNDERUNG (yearly_amount) ==========

    IF OLD.yearly_amount IS DISTINCT FROM NEW.yearly_amount THEN
        -- Werber-Ledger: Korrektur-Buchung für alle bestehenden Kategorien
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        SELECT DISTINCT user_id, record_id, kategorie, 'korrektur', v_diff_einheiten, NEW.kw, NEW.year, NEW.start_date,
               'Betrag geändert: ' || COALESCE(OLD.yearly_amount, 0) || ' → ' || COALESCE(NEW.yearly_amount, 0)
        FROM provisions_ledger
        WHERE record_id = NEW.id AND typ IN ('provision', 'korrektur')
        GROUP BY user_id, kategorie, record_id;

        -- Kunden-Ledger: Korrektur-Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.customer_id, NEW.id, 'korrektur', v_diff_jahreseuros, NEW.kw, NEW.year, NEW.start_date,
                   'Betrag geändert: ' || COALESCE(OLD.yearly_amount, 0) || ' → ' || COALESCE(NEW.yearly_amount, 0));
        END IF;
    END IF;

    -- ========== WERBER-ÄNDERUNG (werber_id) ==========

    IF OLD.werber_id IS DISTINCT FROM NEW.werber_id THEN
        -- Alter Werber: Storno
        IF OLD.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Werber geändert'
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'werben' AND user_id = OLD.werber_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neuer Werber: Buchung
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Werber zugewiesen');
        END IF;
    END IF;

    -- ========== KUNDEN-ÄNDERUNG (customer_id) ==========

    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
        -- Alter Kunde: Storno
        IF OLD.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), NEW.kw, NEW.year, NEW.start_date, 'Kunde geändert'
            FROM customer_billing_ledger
            WHERE record_id = NEW.id AND customer_id = OLD.customer_id
            GROUP BY customer_id, record_id;
        END IF;

        -- Neuer Kunde: Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Kunde zugewiesen');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_update ON public.records;
CREATE TRIGGER on_record_update
    AFTER UPDATE ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_update();
```

### Trigger 3: Record DELETE

```sql
CREATE OR REPLACE FUNCTION handle_record_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Werber-Ledger: Gegenbuchung für alle Kategorien
    INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
    SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), OLD.kw, OLD.year, OLD.start_date, 'Record gelöscht'
    FROM provisions_ledger
    WHERE record_id = OLD.id
    GROUP BY user_id, record_id, kategorie;

    -- Kunden-Ledger: Gegenbuchung
    INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
    SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), OLD.kw, OLD.year, OLD.start_date, 'Record gelöscht'
    FROM customer_billing_ledger
    WHERE record_id = OLD.id
    GROUP BY customer_id, record_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_delete ON public.records;
CREATE TRIGGER on_record_delete
    BEFORE DELETE ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_delete();
```

### Trigger 4: Record UPDATE (TC, Quality, Empfehlung, Recruiting)

> **ENTSCHEIDUNG:** Migration 018 wird GELÖSCHT. Die Logik für TC/Quality/Empfehlung/Recruiting
> wird in den neuen `handle_record_update()` Trigger integriert (siehe Trigger 2).

Änderungen von `teamchef_id`, `quality_id`, `empfehlung_id`, `recruiting_id` werden
im neuen UPDATE-Trigger behandelt (analog zu `werber_id`).

---

## Frontend-Änderungen

### Abrechnungsseite Werber

**Alte Logik (ersetzen):**
```javascript
// ALT: Records laden → Einheiten berechnen
botschafterData = await ladeWerberStatistiken();
```

**Neue Logik:**
```javascript
// NEU: Einheiten aus Ledger laden
async function ladeEinheitenAusLedger(userId, zeitraumVon, zeitraumBis) {
    const { data, error } = await supabase
        .from('provisions_ledger')
        .select('kategorie, einheiten')
        .eq('user_id', userId)
        .gte('referenz_datum', zeitraumVon)
        .lte('referenz_datum', zeitraumBis);

    if (error) throw error;

    // Summen pro Kategorie
    return data.reduce((acc, row) => {
        acc[row.kategorie] = (acc[row.kategorie] || 0) + parseFloat(row.einheiten);
        return acc;
    }, {});
}

// Bei Abrechnung:
// 1. EH aus Ledger für Zeitraum
// 2. Faktor aus user_provision_settings / user_roles
// 3. Provision = EH × Faktor
```

### Abrechnungsseite Kunden (DRK)

```javascript
// Offene Jahreseuros (noch nicht abgerechnet)
async function ladeOffeneJahreseuros(customerId) {
    const { data, error } = await supabase
        .from('customer_billing_ledger')
        .select('jahreseuros')
        .eq('customer_id', customerId)
        .is('invoice_id', null);  // Noch nicht abgerechnet

    if (error) throw error;

    return data.reduce((sum, row) => sum + parseFloat(row.jahreseuros), 0);
}

// Abgerechnete Jahreseuros
async function ladeAbgerechneteJahreseuros(customerId, invoiceId) {
    const { data, error } = await supabase
        .from('customer_billing_ledger')
        .select('jahreseuros')
        .eq('customer_id', customerId)
        .eq('invoice_id', invoiceId);

    if (error) throw error;

    return data.reduce((sum, row) => sum + parseFloat(row.jahreseuros), 0);
}
```

---

## Migration bestehender Daten

### Schritt 1: Werber-Ledger befüllen

```sql
-- Werben-Provision aus bestehenden aktiven Records
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    werber_id,
    id,
    'werben',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND werber_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Teamleitung aus bestehenden Records
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    teamchef_id,
    id,
    'teamleitung',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND teamchef_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Quality aus bestehenden Records
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    quality_id,
    id,
    'quality',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND quality_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Empfehlung aus bestehenden Records
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    empfehlung_id,
    id,
    'empfehlung',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND empfehlung_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Recruiting aus bestehenden Records
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    recruiting_id,
    id,
    'recruiting',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND recruiting_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

### Schritt 2: Kunden-Ledger befüllen

```sql
INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
SELECT
    customer_id,
    id,
    'provision',
    COALESCE(yearly_amount, 0),
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND customer_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

---

## Prüf-Queries

### Werber-Ledger prüfen

```sql
-- Einheiten pro User und Kategorie
SELECT
    u.name,
    pl.kategorie,
    SUM(pl.einheiten) as total_eh
FROM provisions_ledger pl
JOIN users u ON u.id = pl.user_id
GROUP BY u.name, pl.kategorie
ORDER BY u.name, pl.kategorie;

-- Einheiten für Zeitraum (z.B. KW 1-5, 2026)
SELECT
    u.name,
    pl.kategorie,
    SUM(pl.einheiten) as eh
FROM provisions_ledger pl
JOIN users u ON u.id = pl.user_id
WHERE pl.year = 2026 AND pl.kw BETWEEN 1 AND 5
GROUP BY u.name, pl.kategorie;
```

### Kunden-Ledger prüfen

```sql
-- Jahreseuros pro Kunde
SELECT
    c.name,
    SUM(cbl.jahreseuros) as total_je,
    SUM(CASE WHEN cbl.invoice_id IS NULL THEN cbl.jahreseuros ELSE 0 END) as offen,
    SUM(CASE WHEN cbl.invoice_id IS NOT NULL THEN cbl.jahreseuros ELSE 0 END) as abgerechnet
FROM customer_billing_ledger cbl
JOIN customers c ON c.id = cbl.customer_id
GROUP BY c.name;
```

### Filterung nach Kampagne/Einsatzgebiet

```sql
-- EH pro Werber für eine bestimmte Kampagne
SELECT
    u.name,
    pl.kategorie,
    SUM(pl.einheiten) as eh
FROM provisions_ledger pl
JOIN users u ON u.id = pl.user_id
WHERE pl.campaign_id = 'UUID-der-Kampagne'
GROUP BY u.name, pl.kategorie;

-- Jahreseuros pro Kunde für ein bestimmtes Einsatzgebiet
SELECT
    c.name,
    SUM(cbl.jahreseuros) as jahreseuros
FROM customer_billing_ledger cbl
JOIN customers c ON c.id = cbl.customer_id
WHERE cbl.campaign_area_id = 'UUID-des-Einsatzgebiets'
GROUP BY c.name;

-- EH eines Werbers gefiltert nach Kunde und Kampagne
SELECT
    pl.kategorie,
    SUM(pl.einheiten) as eh
FROM provisions_ledger pl
WHERE pl.user_id = 'UUID-des-Werbers'
  AND pl.customer_id = 'UUID-des-Kunden'
  AND pl.campaign_id = 'UUID-der-Kampagne'
GROUP BY pl.kategorie;
```

---

## Umsetzungsreihenfolge

| Phase | Migration | Aufgabe | Status | Datum |
|-------|-----------|---------|--------|-------|
| 1 | 020 | Altes System löschen (Trigger + Tabelle + View) | ✅ Ausgeführt | 11.01.2026 |
| 2 | 021 | Neue Tabellen erstellen (provisions_ledger + customer_billing_ledger) | ✅ Ausgeführt | 11.01.2026 |
| 3 | 022 | Trigger erstellen (INSERT, UPDATE, DELETE) | ✅ Ausgeführt | 11.01.2026 |
| 4 | 023 | Bestandsdaten migrieren | ✅ Ausgeführt | 11.01.2026 |
| 5 | - | Frontend: js/main.js `erstelleAbrechnung()` anpassen | ✅ Erledigt | 11.01.2026 |
| 6 | - | Frontend: tests/test-provisions-db.html anpassen | ✅ Erledigt | 11.01.2026 |
| 7 | - | Testen (Record erstellen, Storno, Änderungen) | ✅ Bestanden | 11.01.2026 |
| 8 | 024 | Schema erweitern (campaign_id, campaign_area_id, customer_id/werber_id) | ✅ Ausgeführt | 11.01.2026 |
| 9 | 025 | Trigger anpassen (neue Felder kopieren) | ✅ Ausgeführt | 11.01.2026 |
| 10 | 026 | Bestandsdaten aktualisieren (neue Felder befüllen) | ✅ Ausgeführt | 11.01.2026 |
| 11 | 027 | Erhöhungen: increase_amount statt yearly_amount verwenden | ✅ Ausgeführt | 11.01.2026 |
| 12 | 028 | Auto-Set: kw, year aus start_date + teamchef_id, quality_id aus campaign_assignments | ✅ Ausgeführt | 11.01.2026 |
| 13 | 029 | TC/Quality ≠ Werber: Keine Provision für eigene Records | ✅ Ausgeführt | 11.01.2026 |

---

## Änderungsprotokoll

| Datum | Änderung |
|-------|----------|
| 11.01.2026 | Dokumentation erstellt |
| 11.01.2026 | Entscheidung: Option B (altes System komplett ersetzen) |
| 11.01.2026 | Migration 018 gelöscht |
| 11.01.2026 | Migration 020-023 erstellt (Cleanup, Tables, Triggers, Data) |
| 11.01.2026 | Migration 020-023 in Supabase ausgeführt (inkl. View `user_provisions_saldo` gelöscht) |
| 11.01.2026 | **DB-Status:** Neues Ledger-System aktiv, Trigger laufen |
| 11.01.2026 | js/main.js: Altes ledgerEntries-Insert entfernt (EH via Trigger) |
| 11.01.2026 | tests/test-provisions-db.html: Tests auf neues Schema angepasst + customer_billing_ledger Test |
| 11.01.2026 | Alte Trigger gelöscht (on_record_insert_provision, on_record_status_change) |
| 11.01.2026 | **Phase 7 abgeschlossen:** Alle 18 Trigger-Tests bestanden (INSERT, STORNO, Reaktivierung, Betragsänderung, Werber-Wechsel, DELETE) |
| 11.01.2026 | **Schema-Erweiterung:** Migration 024-026 erstellt (campaign_id, campaign_area_id, customer_id/werber_id) |
| 11.01.2026 | **Migration 024-026 ausgeführt:** Ledger-Schema erweitert, Trigger aktualisiert, Bestandsdaten migriert |
| 11.01.2026 | **Migration 027 erstellt:** Trigger unterscheidet jetzt record_type (neumitglied → yearly_amount, erhoehung → increase_amount) |
| 11.01.2026 | **Migration 028 ausgeführt:** BEFORE INSERT Trigger setzt automatisch kw, year, teamchef_id, quality_id |
| 11.01.2026 | **Migration 029 ausgeführt:** TC/Quality bekommen keine Provision für eigene Records (TC ≠ Werber Regel) |

---

## Wichtige Regeln

### TC/Quality ≠ Werber
- **teamleitung**-Eintrag wird nur erstellt wenn `teamchef_id ≠ werber_id`
- **quality**-Eintrag wird nur erstellt wenn `quality_id ≠ werber_id`
- Bei TC/Quality-Wechsel: Neuer TC/Quality bekommt nur Provision wenn er nicht selbst der Werber ist

### Auto-Set bei INSERT
- `kw` und `year` werden automatisch aus `start_date` berechnet
- `teamchef_id` und `quality_id` werden aus `campaign_assignments` geladen (basierend auf campaign_id + kw)

---

## Verwandte Dokumentation

- [PROVISIONEN.md](PROVISIONEN.md) - Provisionsmodell und Regeln
- [KARRIERE.md](KARRIERE.md) - Karrierestufen und Faktoren
- [KUNDEN.md](KUNDEN.md) - Kundenmanagement

---

*Erstellt: 11.01.2026*
*Letzte Aktualisierung: 11.01.2026*
