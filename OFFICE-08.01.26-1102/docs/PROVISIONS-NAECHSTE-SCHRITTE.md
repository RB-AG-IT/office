# Provisions-System: Nächste Schritte

**Erstellt:** 10.01.2026
**Status:** Phase 1 + 2 + 3 erledigt (Ledger-Prinzip implementiert)
**Ziel:** Vollständige Integration des Provisions-Systems

---

## Erledigte Aufgaben

- [x] Aufgabe 1: Neue Tabelle `user_provision_settings` erstellt
- [x] Aufgabe 2: Bestehende Daten migriert
- [x] Aufgabe 3: Synchronisations-Trigger erstellt
- [x] Aufgabe 4: Frontend HTML (neuer Abschnitt im Profil)
- [x] Aufgabe 5: Frontend JavaScript (Laden/Speichern)
- [x] Phase 1: Prüfung (Testing) abgeschlossen
- [x] Phase 2.1: `ladeWerberStatistiken` erweitert (lädt `user_provision_settings`)
- [x] Phase 2.2: Berechnungs-Funktionen erstellt (`berechneTcProvision`, `berechneQualityProvision`, `berechneEmpfehlungsProvision`)
- [x] Phase 2.3: Abrechnungs-Workflow erweitert (Vorschau zeigt TC/Quality/Empfehlung)
- [x] Phase 3: Ledger-Prinzip implementiert (`invoice_positions` + `provisions_ledger`)

---

## Phase 1: Prüfung (Testing) - ERLEDIGT

### 1.1 Datenbank-Prüfung

**In Supabase SQL Editor ausführen:**

```sql
-- Prüfen: Tabelle existiert und hat Daten
SELECT COUNT(*) as anzahl FROM user_provision_settings;

-- Prüfen: Beispiel-Daten anzeigen
SELECT
  u.name,
  ps.vorschuss_anteil,
  ps.stornorucklage_anteil,
  ps.werben_faktor,
  ps.tc_faktor,
  ps.tc_mind_eh,
  ps.empfehlung_faktor,
  ps.quality_faktor
FROM user_provision_settings ps
JOIN users u ON u.id = ps.user_id
LIMIT 10;

-- Prüfen: Trigger existieren
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE '%provision%' OR tgname LIKE '%sync%';
```

**Erwartetes Ergebnis:**
- Anzahl Einträge = Anzahl Werber
- Alle Felder haben sinnvolle Werte (Defaults oder migrierte Daten)
- 5 Trigger vorhanden

### 1.2 Synchronisations-Test

**Test A: user_profiles → user_provision_settings**

```sql
-- Vorher: Werte notieren
SELECT user_id, advance_rate FROM user_profiles WHERE user_id = '[TEST-USER-ID]';
SELECT user_id, vorschuss_anteil FROM user_provision_settings WHERE user_id = '[TEST-USER-ID]';

-- Ändern in user_profiles
UPDATE user_profiles SET advance_rate = 75, reserve_rate = 25 WHERE user_id = '[TEST-USER-ID]';

-- Nachher: Prüfen ob synchronisiert
SELECT user_id, vorschuss_anteil, stornorucklage_anteil FROM user_provision_settings WHERE user_id = '[TEST-USER-ID]';
-- Erwartung: vorschuss_anteil = 75, stornorucklage_anteil = 25
```

**Test B: user_provision_settings → user_profiles**

```sql
-- Ändern in user_provision_settings
UPDATE user_provision_settings SET vorschuss_anteil = 80, stornorucklage_anteil = 20 WHERE user_id = '[TEST-USER-ID]';

-- Nachher: Prüfen ob synchronisiert
SELECT user_id, advance_rate, reserve_rate FROM user_profiles WHERE user_id = '[TEST-USER-ID]';
-- Erwartung: advance_rate = 80, reserve_rate = 20
```

**Test C: Neuen User anlegen**

```sql
-- Neuen Werber anlegen
INSERT INTO users (id, email, name, role) VALUES (gen_random_uuid(), 'test@test.de', 'Test User', 'werber');

-- Prüfen ob automatisch provision_settings erstellt
SELECT * FROM user_provision_settings WHERE user_id = (SELECT id FROM users WHERE email = 'test@test.de');
-- Erwartung: Ein Eintrag mit Default-Werten

-- Aufräumen
DELETE FROM users WHERE email = 'test@test.de';
```

### 1.3 Frontend-Test

1. **Profil öffnen:** Botschafter-Profil im Office öffnen
2. **Einstellungen-Tab:** Auf "Einstellungen" klicken
3. **Neuer Abschnitt:** "Provisions-Einstellungen" nach "Empfehlung & Recruiting" sichtbar?
4. **Felder prüfen:**
   - TC: Faktor (1.0), Mind. EH (100)
   - Empfehlung: Faktor (0.5), Zeitraum (12), Mind. EH ODER Mind. Tage
   - Quality: Faktor (0.5), EH-Durchschnitt (50)
5. **Speichern:** Werte ändern → Speichern → Seite neu laden → Werte noch da?
6. **Validierung:** Empfehlung Mind. EH UND Mind. Tage ausfüllen → Warnung?

---

## Phase 2: Integration in Abrechnungs-Logik

### 2.1 main.js: ladeWerberStatistiken erweitern - ERLEDIGT ✓

**Datei:** `js/main.js`
**Funktion:** `ladeWerberStatistiken()` (ca. Zeile 11460)

**Umgesetzt:**
- `user_provision_settings` wird geladen (Zeile 11488-11496)
- `provisionMap` in Werber-Objekt integriert (Zeile 11625)
- Faktor-Logik erweitert: `provision.werben_faktor || career.factor || ROLE_CONFIG` (Zeile 11630-11631)
- `provisionSettings` Objekt im return (Zeile 11669-11679)

**Ursprüngliche Anleitung:**

```javascript
// Nach Zeile ~11486 (nach profilesMap) einfügen:

// Provision Settings laden
const { data: provisionData } = await supabase
    .from('user_provision_settings')
    .select('*');

const provisionMap = {};
(provisionData || []).forEach(p => {
    provisionMap[p.user_id] = p;
});
```

```javascript
// Im return-Objekt (ca. Zeile 11620) erweitern:

return users.map(user => {
    const profile = profilesMap[user.id] || {};
    const career = careerMap[user.id] || {};
    const stats = statsMap[user.id] || { total: 0, aktiv: 0, storno: 0, nettoJE: 0, einheiten: 0 };
    const abzuege = abzuegeMap[user.id] || { unterkunft: 0, sonderposten: 0 };
    const lastInvoice = lastInvoiceMap[user.id];
    const stornorucklage = stornorucklageMap[user.id] || 0;
    const provision = provisionMap[user.id] || {};  // NEU

    // Faktor: individuell aus provision_settings, sonst aus career, sonst aus ROLE_CONFIG
    const faktor = provision.werben_faktor
        || career.factor
        || getBotschafterFaktor(career.roleName);

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: profile.photo_intern_url || user.avatar_url,
        karrierestufe: career.stufe || '-',
        faktor: faktor,
        vorschussAnteil: provision.vorschuss_anteil || profile.advance_rate || 70,

        // NEU: Provisions-Einstellungen
        provisionSettings: {
            tc_faktor: provision.tc_faktor ?? 1.0,
            tc_mind_eh: provision.tc_mind_eh ?? 100,
            empfehlung_faktor: provision.empfehlung_faktor ?? 0.5,
            empfehlung_mind_eh: provision.empfehlung_mind_eh,
            empfehlung_mind_tage: provision.empfehlung_mind_tage,
            empfehlung_zeitraum_monate: provision.empfehlung_zeitraum_monate ?? 12,
            quality_faktor: provision.quality_faktor ?? 0.5,
            quality_eh_durchschnitt: provision.quality_eh_durchschnitt ?? 50
        },

        // ... restliche Felder
        einheiten: stats.einheiten,
        // ...
    };
});
```

### 2.2 Provisions-Berechnungs-Funktionen erstellen - ERLEDIGT ✓

**Datei:** `js/main.js`
**Position:** Zeile 11099-11185

**Umgesetzt:**
- `berechneTcProvision(teamleiter, teamEhGesamt, eigeneEh)` → TC-Provision
- `berechneQualityProvision(qualityManager, teamEhGesamt, teamPersonen, teamTage)` → Quality-Provision
- `berechneEmpfehlungsProvision(empfehler, empfohlenerEh, empfehlungsDatum, empfohlenerTage)` → Empfehlungs-Provision
- Alle 3 Funktionen global verfügbar (Zeile 11793-11795)

**Ursprüngliche Anleitung:**

```javascript
// ================================================================
// PROVISIONS-BERECHNUNG (TC, Quality, Empfehlung)
// ================================================================

/**
 * Berechnet TC-Provision (Teamleitung)
 * @param {object} teamleiter - Teamleiter-Objekt mit provisionSettings
 * @param {number} teamEhGesamt - Gesamte Team-EH (ohne Teamleiter)
 * @param {number} eigeneEh - Eigene EH des Teamleiters
 * @returns {number} TC-Provision in EUR
 */
function berechneTcProvision(teamleiter, teamEhGesamt, eigeneEh) {
    const settings = teamleiter.provisionSettings || {};
    const faktor = settings.tc_faktor ?? 1.0;
    const mindEh = settings.tc_mind_eh ?? 100;

    // Anforderung prüfen: Mind. eigene EH
    if (eigeneEh < mindEh) {
        return 0;
    }

    return teamEhGesamt * faktor;
}

/**
 * Berechnet Quality-Provision
 * @param {object} qualityManager - Quality-Manager-Objekt mit provisionSettings
 * @param {number} teamEhGesamt - Gesamte Team-EH (ohne Quality-Manager)
 * @param {number} teamPersonen - Anzahl Personen im Team
 * @param {number} teamTage - Anzahl Arbeitstage
 * @returns {number} Quality-Provision in EUR
 */
function berechneQualityProvision(qualityManager, teamEhGesamt, teamPersonen, teamTage) {
    const settings = qualityManager.provisionSettings || {};
    const faktor = settings.quality_faktor ?? 0.5;
    const mindDurchschnitt = settings.quality_eh_durchschnitt ?? 50;

    // EH-Durchschnitt pro Tag pro Person berechnen
    const durchschnitt = (teamPersonen > 0 && teamTage > 0)
        ? teamEhGesamt / teamPersonen / teamTage
        : 0;

    // Anforderung prüfen
    if (durchschnitt < mindDurchschnitt) {
        return 0;
    }

    return teamEhGesamt * faktor;
}

/**
 * Berechnet Empfehlungs-Provision
 * @param {object} empfehler - Empfehler-Objekt mit provisionSettings
 * @param {object} empfohlener - Empfohlener-Objekt
 * @param {number} empfohlenerEh - EH des Empfohlenen
 * @param {Date} empfehlungsDatum - Datum der Empfehlung
 * @param {number} empfohlenerTage - Anwesenheitstage des Empfohlenen (optional)
 * @returns {number} Empfehlungs-Provision in EUR
 */
function berechneEmpfehlungsProvision(empfehler, empfohlener, empfohlenerEh, empfehlungsDatum, empfohlenerTage = null) {
    const settings = empfehler.provisionSettings || {};
    const faktor = settings.empfehlung_faktor ?? 0.5;
    const zeitraumMonate = settings.empfehlung_zeitraum_monate ?? 12;
    const mindEh = settings.empfehlung_mind_eh;
    const mindTage = settings.empfehlung_mind_tage;

    // Zeitraum prüfen: 1 Jahr seit Empfehlungsdatum
    const jetzt = new Date();
    const empfehlungPlusMonate = new Date(empfehlungsDatum);
    empfehlungPlusMonate.setMonth(empfehlungPlusMonate.getMonth() + zeitraumMonate);

    if (jetzt > empfehlungPlusMonate) {
        return 0; // Zeitraum abgelaufen
    }

    // Anforderung prüfen: Mind. EH ODER Mind. Tage
    if (mindEh !== null && mindEh !== undefined) {
        // Prüfung gegen Mind. EH
        if (empfohlenerEh < mindEh) {
            return 0;
        }
    } else if (mindTage !== null && mindTage !== undefined) {
        // Prüfung gegen Mind. Anwesenheitstage
        if (empfohlenerTage === null || empfohlenerTage < mindTage) {
            return 0;
        }
    }
    // Wenn keine Anforderung gesetzt → immer gültig

    return empfohlenerEh * faktor;
}

// Global verfügbar machen
window.berechneTcProvision = berechneTcProvision;
window.berechneQualityProvision = berechneQualityProvision;
window.berechneEmpfehlungsProvision = berechneEmpfehlungsProvision;
```

### 2.3 Abrechnungen: Provisions-Typen integrieren - ERLEDIGT ✓

**Datei:** `abrechnungen/Botschafter/index.html`

**Umgesetzt:**
- `ladeWerberStatistiken()` erweitert um TC/Quality/Empfehlungs-Zuordnungen (Zeile 11704-11789)
- Vorschau-Berechnung in `renderWorkflowStep()` Step 2 (Zeile 877-952)
- TC-Provision, Quality-Provision, Empfehlungs-Provision werden berechnet und angezeigt
- Berechnungen werden in `b._berechnungen` für Speicherung zwischengespeichert

**Neue Felder im Werber-Objekt:**
- `tcZuordnungen` - Liste der KWs wo User Teamchef ist + Team-Mitglieder
- `istTeamleiter` - Boolean
- `qualityZuordnungen` - Liste der KWs wo User Quality-Manager ist
- `istQualityManager` - Boolean
- `empfehlungen` - Liste der empfohlenen Mitarbeiter
- `hatEmpfehlungen` - Boolean
- `ersterAnwesenheitstag` - Für Empfehlungs-Zeitraum-Berechnung

---

## Phase 3: Ledger-Prinzip - ERLEDIGT ✓

### 3.1 erstelleAbrechnung() erweitert

**Datei:** `js/main.js` (Zeile 11354-11583)

**Umgesetzt:**
- Neue Parameter: `data.provisionen` mit einzelnen Typen (werben, teamleitung, quality, empfehlung)
- **invoice_positions:** Separate Zeile pro Provisions-Typ mit Vorschuss/Stornorücklage-Aufteilung
- **provisions_ledger:** Audit-Eintrag pro Position für Nachvollziehbarkeit
- Rückwärtskompatibel: Falls `data.provisionen` nicht übergeben wird, wird wie bisher nur `werben` verwendet

### 3.2 Datenfluss (Ledger-Prinzip)

```
Abrechnung erstellen
    ↓
createAbrechnungen() [abrechnungen/Botschafter/index.html]
    - Nutzt b._berechnungen aus Vorschau
    - Übergibt data.provisionen = { werben, teamleitung, quality, empfehlung }
    ↓
erstelleAbrechnung() [js/main.js]
    ↓
┌─────────────────────────────────────────────────────────────┐
│ invoices (Hauptdokument)                                    │
│   - gesamt_provision, gesamt_vorschuss, gesamt_stornorucklage│
│   - calculation_data.provisionen (JSON)                     │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ invoice_positions (pro Typ)                                 │
│   typ: werben | teamleitung | quality | empfehlung          │
│   provision, vorschuss_anteil, vorschuss, stornorucklage    │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ provisions_ledger (Audit-Trail)                             │
│   kategorie: werben | teamleitung | quality | empfehlung    │
│   typ: 'abrechnung'                                          │
│   betrag_provision, betrag_vorschuss, betrag_stornorucklage │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Prüf-Query

```sql
-- Alle Ledger-Einträge pro Kategorie
SELECT kategorie, COUNT(*), SUM(betrag_provision) as summe
FROM provisions_ledger
GROUP BY kategorie;

-- Invoice mit Positions
SELECT
    i.invoice_number,
    ip.typ,
    ip.provision,
    ip.vorschuss,
    ip.stornorucklage
FROM invoices i
JOIN invoice_positions ip ON ip.invoice_id = i.id
ORDER BY i.created_at DESC;
```

---

## Phase 4: Vollständiger Test

### 4.1 End-to-End Test

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 1 | Botschafter-Profil öffnen | Provisions-Einstellungen sichtbar |
| 2 | TC-Faktor auf 1.5 setzen, speichern | Wert gespeichert |
| 3 | Abrechnung erstellen für diesen Botschafter | TC-Provision mit Faktor 1.5 berechnet |
| 4 | Empfehlungs-Mind. EH auf 50 setzen | Wert gespeichert |
| 5 | Empfohlener hat 40 EH | Keine Empfehlungs-Provision |
| 6 | Empfohlener hat 60 EH | Empfehlungs-Provision berechnet |

### 4.2 Regressions-Test

- Bestehende Abrechnungen funktionieren noch?
- Vorschuss/Stornorücklage korrekt?
- PDF-Generierung funktioniert?

---

## Zusammenfassung: Reihenfolge

| Phase | Aufgabe | Status |
|-------|---------|--------|
| **1** | Prüfung (1.1-1.3) | ✓ Erledigt |
| **2.1** | main.js: ladeWerberStatistiken erweitern | ✓ Erledigt |
| **2.2** | Provisions-Berechnungs-Funktionen erstellen | ✓ Erledigt |
| **2.3** | Abrechnungen: Provisions-Typen integrieren | ✓ Erledigt |
| **3** | Ledger-Prinzip implementiert | ✓ Erledigt |
| **4** | Vollständiger Test | ⏳ Offen |

---

## Geklärte Fragen (für Phase 2.3 + 3)

1. **Teamzuordnung:** Aus der Kampagnen-Seite (`campaign_assignments`)

2. **Anwesenheitstage:** Aus der Kampagnen-Seite (`campaign_attendance`)

3. **Empfehlungs-Datum:** Erster Anwesenheitstag des Empfohlenen. Die 12 Monate Empfehlungs-Provision beginnen ab diesem Tag.

4. **Abrechnungs-Zeitraum:** Pro Woche (alle Provisions-Typen: Werben, TC, Quality, Empfehlung)

---

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 10.01.2026 | Dokument erstellt |
| 10.01.2026 | Phase 2.1 + 2.2 umgesetzt in `js/main.js` |
| 10.01.2026 | Offene Fragen 1-4 geklärt |
| 10.01.2026 | Phase 2.3 umgesetzt: Vorschau zeigt TC/Quality/Empfehlung |
| 10.01.2026 | Phase 3 umgesetzt: Ledger-Prinzip (invoice_positions + provisions_ledger) |

---

*Letzte Aktualisierung: 10.01.2026*
