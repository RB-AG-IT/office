# Migration: Provisions-Einstellungen

**Erstellt:** 10.01.2026
**Status:** Geplant
**Ziel:** Alle Provisions-Einstellungen pro Botschafter zentral in einer neuen Tabelle `user_provision_settings` speichern, mit automatischer Synchronisation zu bestehenden Tabellen.

---

## Hintergrund

### Anforderung

Auf den Botschafter-Profilseiten soll ein neuer Abschnitt "Provisions-Einstellungen" im Einstellungen-Tab eingefügt werden (nach "Empfehlung & Recruiting"). Dort können pro Botschafter individuelle Provisions-Faktoren und -Anforderungen eingetragen werden.

### Provisions-Typen

| Provision | Felder | Beschreibung |
|-----------|--------|--------------|
| **Werben** | *(aus `user_roles`)* | Faktor für eigene Provision (5.0 - 8.0 je nach Karrierestufe). Wird aus `user_roles.factor` für den jeweiligen Zeitraum gelesen. |
| **TC (Teamleitung)** | `tc_faktor`, `tc_mind_eh` | Faktor 1.0 auf alle Team-EH (außer eigene). Anforderung: Mind. X eigene EH (Default: 100), sonst 0 |
| **Empfehlung/Recruiting** | `empfehlung_faktor`, `empfehlung_mind_eh`, `empfehlung_mind_tage`, `empfehlung_zeitraum_monate` | Faktor 0.5 auf jede EH der empfohlenen Person. Anforderung: Mind. X EH ODER Mind. X Anwesenheitstage. Zeitraum: 12 Monate ab erstem Tag |
| **Quality** | `quality_faktor`, `quality_eh_durchschnitt` | Faktor 0.5 auf alle Team-EH (außer eigene). Anforderung: EH-Durchschnitt pro Tag pro Person mind. X (Default: 50) |

> **Hinweis:** Der Werben-Faktor wird NICHT in `user_provision_settings` gespeichert, da er sich pro KW/Zeitraum ändern kann. Er wird direkt aus `user_roles` (role_type='career') für den jeweiligen Abrechnungszeitraum ermittelt.

### Bisherige Speicherorte (aktueller Stand)

| Daten | Tabelle | Spalte |
|-------|---------|--------|
| Vorschuss-Anteil (%) | `user_profiles` | `advance_rate` |
| Stornorücklage-Anteil (%) | `user_profiles` | `reserve_rate` |
| Karrierestufe | `user_roles` | `role_name` (where role_type='career') |
| Individueller Werber-Faktor | `user_roles` | `factor` (where role_type='career') |
| Standard Werber-Faktor | `js/main.js` | `ROLE_CONFIG[stufe].faktor` |

### Problem

- Provisions-Daten sind über mehrere Tabellen verteilt
- TC-, Empfehlungs- und Quality-Provisions-Einstellungen fehlen komplett
- Keine zentrale Stelle für alle Provisions-Einstellungen

### Lösung

- Neue Tabelle `user_provision_settings` mit ALLEN Provisions-Einstellungen
- Database Triggers für automatische Synchronisation mit `user_profiles` und `user_roles`
- Bestehender Code funktioniert weiterhin (liest aus alten Tabellen)
- Neuer Code kann aus neuer Tabelle lesen

---

## Aufgaben

### Aufgabe 1: Neue Tabelle erstellen

**Datei:** `database/migrations/016-user-provision-settings.sql`

```sql
-- ============================================================================
-- Migration 016: User Provision Settings
-- ============================================================================

-- 1. Neue Tabelle erstellen
CREATE TABLE IF NOT EXISTS public.user_provision_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,

  -- Vorschuss/Stornorücklage (synchronisiert mit user_profiles)
  vorschuss_anteil integer NOT NULL DEFAULT 70,
  stornorucklage_anteil integer NOT NULL DEFAULT 30,

  -- TC (Teamleitung)
  tc_faktor numeric NOT NULL DEFAULT 1.0,
  tc_mind_eh integer NOT NULL DEFAULT 100,

  -- Empfehlung/Recruiting
  empfehlung_faktor numeric NOT NULL DEFAULT 0.5,
  empfehlung_mind_eh integer,          -- ENTWEDER mind. EH
  empfehlung_mind_tage integer,        -- ODER mind. Anwesenheitstage
  empfehlung_zeitraum_monate integer NOT NULL DEFAULT 12,

  -- Quality
  quality_faktor numeric NOT NULL DEFAULT 0.5,
  quality_eh_durchschnitt integer NOT NULL DEFAULT 50,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT user_provision_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_provision_settings_user_id_key UNIQUE (user_id),
  CONSTRAINT user_provision_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,

  -- Check: vorschuss + stornorucklage = 100
  CONSTRAINT user_provision_settings_anteil_check CHECK (vorschuss_anteil + stornorucklage_anteil = 100),

  -- Check: Entweder mind_eh ODER mind_tage, nicht beide
  CONSTRAINT user_provision_settings_empfehlung_check CHECK (
    (empfehlung_mind_eh IS NULL AND empfehlung_mind_tage IS NULL) OR
    (empfehlung_mind_eh IS NOT NULL AND empfehlung_mind_tage IS NULL) OR
    (empfehlung_mind_eh IS NULL AND empfehlung_mind_tage IS NOT NULL)
  )
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_user_provision_settings_user_id
ON public.user_provision_settings(user_id);

-- RLS aktivieren
ALTER TABLE public.user_provision_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own provision settings"
ON public.user_provision_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all provision settings"
ON public.user_provision_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'fue')
    AND is_active = true
  )
);

CREATE POLICY "Admins can insert provision settings"
ON public.user_provision_settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'fue')
    AND is_active = true
  )
);

CREATE POLICY "Admins can update provision settings"
ON public.user_provision_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'fue')
    AND is_active = true
  )
);

-- Service Role kann alles
CREATE POLICY "Service role full access"
ON public.user_provision_settings FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

---

### Aufgabe 2: Bestehende Daten migrieren

**Datei:** `database/migrations/016-user-provision-settings.sql` (Fortsetzung)

```sql
-- ============================================================================
-- 2. Bestehende Daten migrieren
-- ============================================================================

-- Für jeden User in users (role='werber') einen Eintrag erstellen
INSERT INTO public.user_provision_settings (user_id, vorschuss_anteil, stornorucklage_anteil)
SELECT
  u.id as user_id,
  COALESCE(p.advance_rate, 70) as vorschuss_anteil,
  COALESCE(p.reserve_rate, 30) as stornorucklage_anteil
FROM public.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
WHERE u.role = 'werber'
ON CONFLICT (user_id) DO UPDATE SET
  vorschuss_anteil = EXCLUDED.vorschuss_anteil,
  stornorucklage_anteil = EXCLUDED.stornorucklage_anteil,
  updated_at = now();
```

---

### Aufgabe 3: Synchronisations-Trigger erstellen

**Datei:** `database/migrations/016-user-provision-settings.sql` (Fortsetzung)

```sql
-- ============================================================================
-- 3. Synchronisations-Trigger
-- ============================================================================

-- 3a. Trigger: user_profiles → user_provision_settings
-- Wenn advance_rate oder reserve_rate in user_profiles geändert wird

CREATE OR REPLACE FUNCTION sync_profiles_to_provision_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur wenn advance_rate oder reserve_rate geändert wurde
  IF (TG_OP = 'UPDATE' AND
      (OLD.advance_rate IS DISTINCT FROM NEW.advance_rate OR
       OLD.reserve_rate IS DISTINCT FROM NEW.reserve_rate)) THEN

    INSERT INTO public.user_provision_settings (user_id, vorschuss_anteil, stornorucklage_anteil)
    VALUES (NEW.user_id, COALESCE(NEW.advance_rate, 70), COALESCE(NEW.reserve_rate, 30))
    ON CONFLICT (user_id) DO UPDATE SET
      vorschuss_anteil = COALESCE(NEW.advance_rate, 70),
      stornorucklage_anteil = COALESCE(NEW.reserve_rate, 30),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profiles_to_provision ON public.user_profiles;
CREATE TRIGGER trigger_sync_profiles_to_provision
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profiles_to_provision_settings();


-- 3b. Trigger: user_provision_settings → user_profiles
-- Wenn vorschuss_anteil oder stornorucklage_anteil geändert wird

CREATE OR REPLACE FUNCTION sync_provision_settings_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles
  UPDATE public.user_profiles
  SET
    advance_rate = NEW.vorschuss_anteil,
    reserve_rate = NEW.stornorucklage_anteil,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Falls kein Profil existiert, erstellen
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (user_id, advance_rate, reserve_rate)
    VALUES (NEW.user_id, NEW.vorschuss_anteil, NEW.stornorucklage_anteil);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_provision_to_profiles ON public.user_provision_settings;
CREATE TRIGGER trigger_sync_provision_to_profiles
  AFTER INSERT OR UPDATE ON public.user_provision_settings
  FOR EACH ROW
  EXECUTE FUNCTION sync_provision_settings_to_profiles();


-- 3c. Trigger: Neuer User → automatisch provision_settings erstellen

CREATE OR REPLACE FUNCTION create_provision_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'werber' THEN
    INSERT INTO public.user_provision_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_provision_settings ON public.users;
CREATE TRIGGER trigger_create_provision_settings
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_provision_settings_for_new_user();
```

---

### Aufgabe 4: Frontend - Neuer Abschnitt im Botschafter-Profil

**Datei:** `benutzer/BENUTZER-BOTSCHAFTER-PROFIL.html`

**Position:** Nach dem Abschnitt "Empfehlung & Recruiting" (ca. Zeile 480), vor "Karrierestufe"

**HTML einfügen:**

```html
<hr class="trennlinie">

<!-- Provisions-Einstellungen -->
<div class="abschnitt--card">
    <div class="zeile">
        <div class="text-ueberschrift-abschnitt">Provisions-Einstellungen</div>
    </div>
    <div class="zeile">
        <span class="text-klein">Individuelle Provisions-Faktoren und Anforderungen für diesen Botschafter.</span>
    </div>

    <!-- TC (Teamleitung) -->
    <div class="unterabschnitt--card">
        <div class="zeile">
            <div class="text-ueberschrift-unterabschnitt">TC (Teamleitung)</div>
        </div>
        <div class="zeile">
            <span class="text-klein">Faktor 1.0 auf alle Team-Einheiten (außer eigene). Anforderung: Mind. eigene EH, sonst 0.</span>
        </div>
        <div class="zeile">
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">TC-Faktor</label>
                <input type="number" class="eingabefeld" id="tcFaktor" value="1.0" min="0" max="5" step="0.1">
                <span class="eingabefeld-beschriftung-unten">Standard: 1.0</span>
            </div>
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">Mind. eigene EH</label>
                <input type="number" class="eingabefeld" id="tcMindEh" value="100" min="0" step="10">
                <span class="eingabefeld-beschriftung-unten">Standard: 100 EH</span>
            </div>
        </div>
    </div>

    <!-- Empfehlung / Recruiting -->
    <div class="unterabschnitt--card">
        <div class="zeile">
            <div class="text-ueberschrift-unterabschnitt">Empfehlung / Recruiting</div>
        </div>
        <div class="zeile">
            <span class="text-klein">Faktor 0.5 auf jede Einheit der empfohlenen/rekrutierten Person. Zeitraum: 1 Jahr seit erstem Tag.</span>
        </div>
        <div class="zeile">
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">Empfehlungs-Faktor</label>
                <input type="number" class="eingabefeld" id="empfehlungFaktor" value="0.5" min="0" max="5" step="0.1">
                <span class="eingabefeld-beschriftung-unten">Standard: 0.5</span>
            </div>
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">Zeitraum (Monate)</label>
                <input type="number" class="eingabefeld" id="empfehlungZeitraum" value="12" min="1" max="60">
                <span class="eingabefeld-beschriftung-unten">Standard: 12 Monate</span>
            </div>
        </div>
        <div class="zeile">
            <div class="text-klein" style="margin-bottom: 8px;">Anforderung (ENTWEDER/ODER):</div>
        </div>
        <div class="zeile">
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">Mind. EH</label>
                <input type="number" class="eingabefeld" id="empfehlungMindEh" placeholder="z.B. 50" min="0">
                <span class="eingabefeld-beschriftung-unten">EH bevor Empfehlung gültig</span>
            </div>
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-0-5" style="display: flex; align-items: center; justify-content: center;">
                <span class="text-normal--fett">ODER</span>
            </div>
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">Mind. Anwesenheitstage</label>
                <input type="number" class="eingabefeld" id="empfehlungMindTage" placeholder="z.B. 21" min="0">
                <span class="eingabefeld-beschriftung-unten">Tage bevor Empfehlung gültig</span>
            </div>
        </div>
    </div>

    <!-- Quality -->
    <div class="unterabschnitt--card">
        <div class="zeile">
            <div class="text-ueberschrift-unterabschnitt">Quality</div>
        </div>
        <div class="zeile">
            <span class="text-klein">Faktor 0.5 auf alle Team-Einheiten (außer eigene). Anforderung: EH-Durchschnitt pro Tag pro Person.</span>
        </div>
        <div class="zeile">
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">Quality-Faktor</label>
                <input type="number" class="eingabefeld" id="qualityFaktor" value="0.5" min="0" max="5" step="0.1">
                <span class="eingabefeld-beschriftung-unten">Standard: 0.5</span>
            </div>
            <div class="eingabefeld-gruppe eingabefeld-gruppe--fixed-1">
                <label class="eingabefeld-beschriftung-oben">EH-Durchschnitt (pro Tag/Person)</label>
                <input type="number" class="eingabefeld" id="qualityEhDurchschnitt" value="50" min="0" step="5">
                <span class="eingabefeld-beschriftung-unten">Standard: 50 EH</span>
            </div>
        </div>
    </div>
</div>
```

---

### Aufgabe 5: Frontend - JavaScript für Laden/Speichern

**Datei:** `benutzer/BENUTZER-BOTSCHAFTER-PROFIL.html`

**Im `<script>` Bereich hinzufügen:**

```javascript
// ================================================================
// PROVISIONS-EINSTELLUNGEN LADEN/SPEICHERN
// ================================================================

let provisionSettings = null;

// Provisions-Einstellungen laden
async function loadProvisionSettings() {
    if (!profileUserId) return;

    try {
        const { data, error } = await supabase
            .from('user_provision_settings')
            .select('*')
            .eq('user_id', profileUserId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        provisionSettings = data || {};
        populateProvisionSettings();

    } catch (error) {
        console.error('Error loading provision settings:', error);
    }
}

// Provisions-Felder befüllen
function populateProvisionSettings() {
    if (!provisionSettings) return;

    // TC
    setValue('tcFaktor', provisionSettings.tc_faktor ?? 1.0);
    setValue('tcMindEh', provisionSettings.tc_mind_eh ?? 100);

    // Empfehlung
    setValue('empfehlungFaktor', provisionSettings.empfehlung_faktor ?? 0.5);
    setValue('empfehlungZeitraum', provisionSettings.empfehlung_zeitraum_monate ?? 12);
    setValue('empfehlungMindEh', provisionSettings.empfehlung_mind_eh || '');
    setValue('empfehlungMindTage', provisionSettings.empfehlung_mind_tage || '');

    // Quality
    setValue('qualityFaktor', provisionSettings.quality_faktor ?? 0.5);
    setValue('qualityEhDurchschnitt', provisionSettings.quality_eh_durchschnitt ?? 50);
}

// Provisions-Einstellungen speichern
async function saveProvisionSettings() {
    if (!profileUserId) return;

    // Entweder/Oder Logik für Empfehlung
    const mindEh = document.getElementById('empfehlungMindEh').value;
    const mindTage = document.getElementById('empfehlungMindTage').value;

    // Wenn beide gefüllt, Warnung
    if (mindEh && mindTage) {
        showToast('Empfehlung: Bitte nur Mind. EH ODER Mind. Tage ausfüllen', 'warning');
        return false;
    }

    const data = {
        user_id: profileUserId,

        // TC
        tc_faktor: parseFloat(document.getElementById('tcFaktor').value) || 1.0,
        tc_mind_eh: parseInt(document.getElementById('tcMindEh').value) || 100,

        // Empfehlung
        empfehlung_faktor: parseFloat(document.getElementById('empfehlungFaktor').value) || 0.5,
        empfehlung_zeitraum_monate: parseInt(document.getElementById('empfehlungZeitraum').value) || 12,
        empfehlung_mind_eh: mindEh ? parseInt(mindEh) : null,
        empfehlung_mind_tage: mindTage ? parseInt(mindTage) : null,

        // Quality
        quality_faktor: parseFloat(document.getElementById('qualityFaktor').value) || 0.5,
        quality_eh_durchschnitt: parseInt(document.getElementById('qualityEhDurchschnitt').value) || 50,

        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from('user_provision_settings')
            .upsert(data, { onConflict: 'user_id' });

        if (error) throw error;

        provisionSettings = data;
        return true;

    } catch (error) {
        console.error('Error saving provision settings:', error);
        showToast('Fehler beim Speichern der Provisions-Einstellungen', 'error');
        return false;
    }
}
```

**In `loadProfileData()` hinzufügen (nach dem Laden der Rollen):**

```javascript
// Provisions-Einstellungen laden
await loadProvisionSettings();
```

**In `saveProfile()` hinzufügen (vor dem finalen showToast):**

```javascript
// Provisions-Einstellungen speichern
const provisionSaved = await saveProvisionSettings();
if (!provisionSaved) return;
```

---

### Aufgabe 6: main.js - ladeWerberStatistiken anpassen (optional)

**Datei:** `js/main.js`

**Funktion:** `ladeWerberStatistiken()` (Zeile ~11460)

**Änderung:** Zusätzlich `user_provision_settings` laden für TC/Quality/Empfehlungs-Faktoren.

```javascript
// Nach dem Laden der Profile (ca. Zeile 11480):

// Provision Settings laden
const { data: provisionData } = await supabase
    .from('user_provision_settings')
    .select('*');

const provisionMap = {};
(provisionData || []).forEach(p => {
    provisionMap[p.user_id] = p;
});

// Später beim Zusammenbauen der Werber-Daten (ca. Zeile 11600):
// provisionMap[user.id] enthält alle Provisions-Einstellungen
```

**Hinweis:** Diese Änderung ist optional und wird erst benötigt, wenn die Provisions-Berechnung die neuen Felder nutzt.

---

## Zusammenfassung der Dateien

| Datei | Aktion |
|-------|--------|
| `database/migrations/016-user-provision-settings.sql` | **NEU** - Komplettes SQL-Script |
| `benutzer/BENUTZER-BOTSCHAFTER-PROFIL.html` | **ÄNDERN** - HTML + JavaScript hinzufügen |
| `js/main.js` | **OPTIONAL** - `ladeWerberStatistiken()` erweitern |

---

## Ausführungsreihenfolge

1. **SQL-Migration ausführen** (Aufgabe 1-3)
   - In Supabase SQL Editor einfügen und ausführen
   - Prüfen: Tabelle `user_provision_settings` existiert
   - Prüfen: Daten wurden migriert (SELECT * FROM user_provision_settings)

2. **Frontend anpassen** (Aufgabe 4-5)
   - HTML-Abschnitt einfügen
   - JavaScript-Funktionen hinzufügen
   - Testen: Profil öffnen → Einstellungen-Tab → neuer Abschnitt sichtbar

3. **Synchronisation testen**
   - Vorschuss % im Profil ändern → prüfen ob in beiden Tabellen geändert
   - Wert in user_provision_settings ändern → prüfen ob user_profiles auch geändert

---

## Testfälle

| Test | Erwartetes Ergebnis |
|------|---------------------|
| Neuen Botschafter anlegen | Automatisch Eintrag in `user_provision_settings` |
| Vorschuss % im Profil ändern | Beide Tabellen synchron |
| TC-Faktor speichern | Wert in `user_provision_settings` |
| Empfehlung: Beide Felder ausfüllen | Warnung, nicht speichern |
| Werben-Faktor | Aus `user_roles.factor` für Zeitraum lesen |

---

## Rollback (falls nötig)

```sql
-- Trigger entfernen
DROP TRIGGER IF EXISTS trigger_sync_profiles_to_provision ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_sync_provision_to_profiles ON public.user_provision_settings;
DROP TRIGGER IF EXISTS trigger_create_provision_settings ON public.users;

-- Funktionen entfernen
DROP FUNCTION IF EXISTS sync_profiles_to_provision_settings();
DROP FUNCTION IF EXISTS sync_provision_settings_to_profiles();
DROP FUNCTION IF EXISTS create_provision_settings_for_new_user();

-- Tabelle entfernen
DROP TABLE IF EXISTS public.user_provision_settings;
```

---

*Dokumentation erstellt am 10.01.2026*
