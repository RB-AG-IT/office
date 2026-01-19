# Kunden-Ledger: Folgevergütung & Abrechnungssystem

**Erstellt:** 20.01.2026
**Status:** Konzept abgeschlossen, Implementierung ausstehend
**Ziel:** Vollständiges Abrechnungssystem für DRK-Kunden mit 5-jähriger Folgevergütung

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Vergütungsmodell](#2-vergütungsmodell)
3. [Abrechnungstypen](#3-abrechnungstypen)
4. [Sondierung vs. Regular](#4-sondierung-vs-regular)
5. [Qualitätsbonus](#5-qualitätsbonus)
6. [Absicherungsfristen](#6-absicherungsfristen)
7. [Stornopuffer](#7-stornopuffer)
8. [Teilvergütung bei Storno](#8-teilvergütung-bei-storno)
9. [Zeitliche Abläufe](#9-zeitliche-abläufe)
10. [Datenbank-Schema](#10-datenbank-schema)
11. [Implementierungsschritte](#11-implementierungsschritte)

---

## 1. Überblick

### Was ist das System?

Ein Abrechnungssystem für die Vergütung von Mitgliederwerbung gegenüber DRK-Kunden (Deutsches Rotes Kreuz). Pro geworbenes Mitglied (Record) erhält der DRK-Kunde eine Rechnung über bis zu 5 Jahre (Folgevergütung).

### Beteiligte Parteien

| Partei | Rolle |
|--------|-------|
| **RB-AG** | Stellt Rechnungen an DRK |
| **DRK-Kunde** | Zahlt für geworbene Mitglieder |
| **Mitglied (MG)** | Geworbene Person mit Jahresbeitrag |

### Bestehendes System

- `customer_billing_ledger`: Speichert Buchungen pro Kunde
- Trigger erstellen automatisch Einträge bei Record-Änderungen
- **Problem**: Kein Konzept für Folgevergütung (VJ 1-5)

---

## 2. Vergütungsmodell

### Grundprinzip

Ein Record (Neumitglied) erzeugt Vergütungsansprüche über 5 Jahre:

| Vergütungsjahr | Bezeichnung | Beispiel-Satz (Sondierung) | Beispiel-Satz (Regular) |
|----------------|-------------|----------------------------|-------------------------|
| VJ 1 | Erstjahr | 80% | 60% |
| VJ 2 | Folgejahr 1 | 50% | 40% |
| VJ 3 | Folgejahr 2 | 30% | 20% |
| VJ 4 | Folgejahr 3 | 0% | 0% |
| VJ 5 | Folgejahr 4 | 0% | 0% |

**Hinweis:** Die Prozentsätze sind pro Einsatzgebiet (campaign_area) individuell einstellbar.

### Berechnung

```
Vergütung = Jahresbeitrag (yearly_amount) × Provisionssatz (%)

Beispiel:
- Jahresbeitrag: 120 €
- Sondierung VJ1: 80%
- Vergütung VJ1: 120 € × 80% = 96 €
```

### Speicherung der Sätze

Die Provisionssätze werden in `campaign_areas` gespeichert:

```json
{
  "provision_sondierung": { "j1": 80, "j2": 50, "j3": 30, "j4": 0, "j5": 0, "limit": 100, "limitType": "mg" },
  "provision_regular": { "j1": 60, "j2": 40, "j3": 20, "j4": 0, "j5": 0 }
}
```

---

## 3. Abrechnungstypen

### 3.1 Zwischenabrechnungen (VJ 1)

- **Anzahl:** 3-4 Stück während der Kampagne
- **Zeitpunkt:** Während des Einsatzes (z.B. wöchentlich)
- **Inhalt:** Neu geworbene Mitglieder seit letzter Abrechnung
- **Besonderheit:** 10% Stornopuffer wird zurückgehalten

### 3.2 Endabrechnung (VJ 1)

- **Anzahl:** 1 pro Einsatzgebiet
- **Zeitpunkt:** XX Wochen nach letztem Einsatztag (einstellbar: `endabr_wochen`)
- **Inhalt:**
  - Restliche nicht abgerechnete MG
  - Auflösung Stornopuffer
  - Verrechnung aller Stornos seit Zwischenabrechnungen
- **Besonderheit:** Noch OHNE Qualitätsbonus

### 3.3 Jahresabrechnungen (VJ 2-5)

- **Zeitpunkt:** 12 Monate nach vorheriger Abrechnung
- **Inhalt:**
  - Noch aktive Mitglieder (nicht storniert)
  - Verrechnung von Stornos
- **Besonderheit VJ 2:** Qualitätsbonus wird berechnet und rückwirkend auf VJ 1 angewendet

---

## 4. Sondierung vs. Regular

### Konzept

Die ersten X Mitglieder eines Einsatzgebiets werden zu besseren Konditionen (Sondierung) abgerechnet, danach zu Regular-Konditionen.

### Wichtig: Bestimmung bei Abrechnung

Die Zuordnung Sondierung/Regular wird **NICHT** bei Record-Erstellung festgelegt, sondern **bei der Abrechnung**!

### Logik bei Abrechnung

```
1. Alle MG für Abrechnungszeitraum sammeln
2. Nach Jahresbeitrag sortieren (aufsteigend = kleinste zuerst)
3. Sondierungslimit prüfen (z.B. erste 100 MG oder X% der Einwohner)
4. Aufteilung:
   - MG mit kleinstem Beitrag → Sondierungsliste
   - Restliche MG → Regular-Liste
5. Beide Listen nach Familienname sortieren
6. Zwei separate Abrechnungen erstellen
```

### Warum kleinste Beiträge zu Sondierung?

Bei Sondierung gibt es höhere Prozentsätze. Kleine Beiträge zu Sondierung bedeutet:
- Höherer Prozentsatz × kleiner Betrag = moderater Absolutbetrag
- Optimierung für den Kunden

### Konfiguration

In `campaign_areas.provision_sondierung`:
```json
{
  "limit": 100,
  "limitType": "mg"  // oder "prozent" (der Einwohner)
}
```

---

## 5. Qualitätsbonus

### Konzept

Nach 13 Monaten wird die Stornoquote berechnet. Je niedriger die Quote, desto höher der Bonus (in Prozentpunkten).

### Zeitpunkt der Berechnung

**Bei der 2. Jahresrate (VJ 2)**, nicht bei der Endabrechnung VJ 1!

### Stornoquote-Berechnung

```
Stornoquote = (Stornierte MG / Gesamt MG im Einsatzgebiet) × 100

Beispiel:
- 100 MG geworben
- 8 MG storniert
- Stornoquote = 8%
```

### Bonus-Regeln (Beispiel)

| Stornoquote ≤ | Bonus |
|---------------|-------|
| 8% | +10 PP |
| 10% | +7 PP |
| 12% | +4 PP |
| 15% | +1 PP |

**PP = Prozentpunkte**, werden auf den Provisionssatz addiert.

### Anwendung

- **Rückwirkend VJ 1:** Differenz wird mit VJ 2 verrechnet
- **VJ 2-5:** Bonus wird direkt angewendet

### Beispiel

```
Ursprünglich VJ 1: 80% von 120 € = 96 € (bereits abgerechnet)
Qualitätsbonus: +10 PP → effektiv 90%
Korrektur: 90% von 120 € = 108 €
Differenz: 108 € - 96 € = 12 € (wird mit VJ 2 verrechnet)
```

### Konfiguration

In `campaign_areas`:
```json
{
  "qualitaetsbonus": {
    "aktiv": true,
    "regeln": [
      { "storno": 8, "pp": 10 },
      { "storno": 10, "pp": 7 },
      { "storno": 12, "pp": 4 },
      { "storno": 15, "pp": 1 }
    ]
  },
  "qualitaetsbonus_datum": null  // NULL = 13 Monate, oder festes Datum
}
```

---

## 6. Absicherungsfristen

### Konzept

Nach einer bestimmten Zeit ist ein Vergütungsjahr "abgesichert" - bei Storno muss keine Rückzahlung mehr erfolgen.

### Berechnung

Die Absicherung wird vom **Startdatum des Records** + Zahlungsart berechnet (nicht durch Tracking von Zahlungseingängen).

### Feste Fristen (Konstanten)

| Zahlungsart | VJ 1+2 sicher | VJ 3 sicher | VJ 4 sicher | VJ 5 sicher |
|-------------|---------------|-------------|-------------|-------------|
| **Monatlich** | 13 Monate | 25 Monate | 37 Monate | 49 Monate |
| **Quartalsweise** | 27 Monate (9 Q) | 39 Monate (13 Q) | 51 Monate (17 Q) | 63 Monate (21 Q) |
| **Halbjährlich** | 30 Monate (5 HJ) | 42 Monate (7 HJ) | 54 Monate (9 HJ) | 66 Monate (11 HJ) |
| **Jährlich** | 24 Monate (2 J) | 36 Monate (3 J) | 48 Monate (4 J) | 60 Monate (5 J) |

**Logik:**
- Monatlich: 13, +12 pro Jahr
- Quartalsweise: 9, +4 pro Jahr (× 3 Monate)
- Halbjährlich: 5, +2 pro Jahr (× 6 Monate)
- Jährlich: 2, +1 pro Jahr (× 12 Monate)

### Beispiel

```
Record erstellt: 01.03.2026
Zahlungsart: Monatlich
Start-Datum: 01.03.2026

VJ 1+2 abgesichert ab: 01.03.2026 + 13 Monate = 01.04.2027
VJ 3 abgesichert ab: 01.03.2026 + 25 Monate = 01.04.2028
...
```

### Storno vor Absicherung

Wenn ein MG storniert wird, bevor das VJ abgesichert ist:
- Bereits abgerechnete Beträge müssen verrechnet werden
- Zukünftige VJ verfallen

### Storno nach Absicherung

Wenn ein MG storniert wird, nachdem das VJ abgesichert ist:
- Keine Rückzahlung für abgesicherte VJ
- Nur zukünftige VJ verfallen

---

## 7. Stornopuffer

### Konzept

Bei Zwischenabrechnungen werden 10% der Nettosumme zurückgehalten als Puffer für Stornos.

### Ablauf

```
Zwischenabrechnung 1:
- Brutto: 1.000 €
- Stornopuffer (10%): 100 €
- Auszahlung: 900 €

Zwischenabrechnung 2:
- Brutto: 800 €
- Stornopuffer (10%): 80 €
- Auszahlung: 720 €

Endabrechnung:
- Neue MG: 500 €
- Stornopuffer auflösen: 180 € (100 + 80)
- Stornos verrechnen: -200 €
- Netto: 480 €
```

### Konfiguration

In `campaign_areas`:
```json
{
  "stornopuffer": 10  // Prozent
}
```

---

## 8. Teilvergütung bei Storno

### Konzept

Wenn ein MG storniert wird, bevor es abgesichert ist, kann eine Teilvergütung gewährt werden (statt 100% Rückforderung).

### Beispiel

```
VJ 1 abgerechnet: 80 € (80% von 100 €)
Storno nach 10 Monaten (vor Absicherung)
Teilvergütung: 50%

Rückforderung: 80 € × 50% = 40 €
(statt volle 80 €)
```

### Konfiguration

In `campaign_areas`:
```json
{
  "teilverguetung": true,
  "teilv_prozent": 50
}
```

---

## 9. Zeitliche Abläufe

### Gesamtübersicht

```
KAMPAGNE LÄUFT
│
├── Woche 1: Zwischenabrechnung 1 (Sondierung + Regular)
├── Woche 2: Zwischenabrechnung 2
├── Woche 3: Zwischenabrechnung 3
├── Woche 4: Zwischenabrechnung 4 (letzte)
│
LETZTER EINSATZTAG
│
+ XX Wochen (endabr_wochen, z.B. 8)
│
▼
ENDABRECHNUNG VJ 1
├── Stornopuffer auflösen
├── Stornos verrechnen
└── OHNE Qualitätsbonus
│
+ 12 Monate
│
▼
JAHRESRATE VJ 2
├── Qualitätsbonus berechnen (Stornoquote)
├── Rückwirkende Korrektur VJ 1 verrechnen
├── VJ 2 mit Bonus abrechnen
└── Stornos verrechnen
│
+ 12 Monate
│
▼
JAHRESRATE VJ 3
├── Mit Qualitätsbonus
└── Stornos verrechnen
│
+ 12 Monate
│
▼
JAHRESRATE VJ 4
│
+ 12 Monate
│
▼
JAHRESRATE VJ 5 (letzte)
```

---

## 10. Datenbank-Schema

### 10.1 Neue Tabelle: `record_entitlements`

Speichert Ansprüche pro Record × Vergütungsjahr.

```sql
CREATE TABLE record_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE SET NULL,

    -- Vergütungsjahr
    verguetungsjahr INTEGER NOT NULL CHECK (verguetungsjahr BETWEEN 1 AND 5),

    -- Beträge
    jahreseuros DECIMAL(10,2) NOT NULL,  -- Basis-Jahresbeitrag

    -- Provisionssatz (wird bei ABRECHNUNG gesetzt, nicht bei Erstellung!)
    ist_sondierung BOOLEAN,              -- NULL bis Abrechnung
    basis_satz INTEGER,                  -- NULL bis Abrechnung, dann z.B. 80

    -- Qualitätsbonus (wird bei VJ2 gesetzt)
    qualitaetsbonus_pp INTEGER DEFAULT 0,

    -- Effektiver Betrag = jahreseuros × (basis_satz + qualitaetsbonus_pp) / 100

    -- Status
    status TEXT NOT NULL DEFAULT 'ausstehend' CHECK (status IN (
        'ausstehend',      -- Noch nicht fällig
        'faellig',         -- Fällig, aber nicht abgerechnet
        'abgerechnet',     -- In Rechnung gestellt
        'storniert',       -- Durch Storno verfallen
        'teilverguetet'    -- Storniert mit Teilvergütung
    )),

    -- Zeitliche Steuerung
    faellig_ab DATE,                     -- Ab wann abrechnbar
    absicherung_ab DATE,                 -- Ab wann abgesichert (berechnet)
    ist_abgesichert BOOLEAN DEFAULT false,

    -- Abrechnung
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    abgerechnet_am DATE,
    abgerechneter_betrag DECIMAL(10,2),  -- Tatsächlich abgerechneter Betrag

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: Ein Anspruch pro Record + VJ
    UNIQUE(record_id, verguetungsjahr)
);

-- Indizes
CREATE INDEX idx_entitlements_record ON record_entitlements(record_id);
CREATE INDEX idx_entitlements_customer ON record_entitlements(customer_id);
CREATE INDEX idx_entitlements_campaign_area ON record_entitlements(campaign_area_id);
CREATE INDEX idx_entitlements_status ON record_entitlements(status);
CREATE INDEX idx_entitlements_vj ON record_entitlements(verguetungsjahr);
CREATE INDEX idx_entitlements_faellig ON record_entitlements(faellig_ab);
CREATE INDEX idx_entitlements_invoice ON record_entitlements(invoice_id);
```

### 10.2 Neue Tabelle: `qualitaetsbonus_berechnungen`

Tracking der Qualitätsbonus-Berechnungen pro Einsatzgebiet.

```sql
CREATE TABLE qualitaetsbonus_berechnungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_area_id UUID NOT NULL REFERENCES campaign_areas(id) ON DELETE CASCADE,

    -- Berechnung
    berechnet_am DATE NOT NULL,
    gesamt_mg INTEGER NOT NULL,
    stornierte_mg INTEGER NOT NULL,
    stornoquote DECIMAL(5,2) NOT NULL,   -- z.B. 8.50 für 8,5%
    bonus_pp INTEGER NOT NULL,            -- Ermittelter Bonus in PP

    -- Anwendung
    angewendet_auf_records INTEGER,       -- Anzahl betroffener Records
    korrektur_summe DECIMAL(10,2),        -- Gesamte rückwirkende Korrektur VJ1

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: Eine Berechnung pro Einsatzgebiet
    UNIQUE(campaign_area_id)
);
```

### 10.3 Neue Tabelle: `absicherungsfristen` (Konstanten)

```sql
CREATE TABLE absicherungsfristen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zahlungsart TEXT NOT NULL UNIQUE CHECK (zahlungsart IN ('monthly', 'quarterly', 'biannual', 'annual')),
    monate_vj_1_2 INTEGER NOT NULL,
    monate_vj_3 INTEGER NOT NULL,
    monate_vj_4 INTEGER NOT NULL,
    monate_vj_5 INTEGER NOT NULL
);

-- Feste Daten einfügen
INSERT INTO absicherungsfristen (zahlungsart, monate_vj_1_2, monate_vj_3, monate_vj_4, monate_vj_5) VALUES
('monthly', 13, 25, 37, 49),
('quarterly', 27, 39, 51, 63),
('biannual', 30, 42, 54, 66),
('annual', 24, 36, 48, 60);
```

### 10.4 Erweiterung: `campaign_areas`

```sql
ALTER TABLE campaign_areas ADD COLUMN IF NOT EXISTS qualitaetsbonus_datum DATE;
-- NULL = Standard (bei VJ2-Abrechnung), oder festes Datum

COMMENT ON COLUMN campaign_areas.qualitaetsbonus_datum IS
'Datum für Qualitätsbonus-Berechnung. NULL = Standard bei VJ2-Abrechnung.';
```

### 10.5 Erweiterung: `customer_billing_ledger`

```sql
ALTER TABLE customer_billing_ledger
ADD COLUMN IF NOT EXISTS verguetungsjahr INTEGER CHECK (verguetungsjahr BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS entitlement_id UUID REFERENCES record_entitlements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ist_korrektur BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS korrektur_grund TEXT;

CREATE INDEX IF NOT EXISTS idx_billing_ledger_vj ON customer_billing_ledger(verguetungsjahr);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_entitlement ON customer_billing_ledger(entitlement_id);
```

---

## 11. Implementierungsschritte

### Phase 1: Datenbank-Schema

1. [ ] Migration erstellen: `record_entitlements` Tabelle
2. [ ] Migration erstellen: `qualitaetsbonus_berechnungen` Tabelle
3. [ ] Migration erstellen: `absicherungsfristen` Tabelle + Daten
4. [ ] Migration erstellen: `campaign_areas` erweitern
5. [ ] Migration erstellen: `customer_billing_ledger` erweitern

### Phase 2: Trigger anpassen

1. [ ] `handle_record_insert()`: 5 Ansprüche erstellen (Status: ausstehend)
2. [ ] `handle_record_update()`: Bei Storno → Ansprüche stornieren
3. [ ] Absicherungs-Datum bei Ansprüchen automatisch berechnen

### Phase 3: Abrechnungslogik (Frontend/Backend)

1. [ ] Zwischenabrechnung erstellen:
   - MG nach Beitrag sortieren
   - Sondierung/Regular aufteilen
   - Stornopuffer berechnen
   - Ansprüche als "abgerechnet" markieren

2. [ ] Endabrechnung erstellen:
   - Stornopuffer auflösen
   - Stornos verrechnen
   - Ohne Qualitätsbonus

3. [ ] Jahresabrechnung VJ2:
   - Qualitätsbonus berechnen
   - Rückwirkende Korrektur VJ1
   - Stornos verrechnen

4. [ ] Jahresabrechnung VJ3-5:
   - Mit Qualitätsbonus
   - Stornos verrechnen

### Phase 4: Storno-Handling

1. [ ] Bei Storno prüfen: Welche VJ sind abgesichert?
2. [ ] Nicht abgesicherte VJ: Status → storniert
3. [ ] Bereits abgerechnete VJ: Gegenbuchung oder Teilvergütung
4. [ ] Abgesicherte VJ: Keine Rückforderung

### Phase 5: UI-Erweiterungen

1. [ ] Kampagnen-Modal: Absicherungsfristen anzeigen (read-only)
2. [ ] Kampagnen-Modal: Qualitätsbonus-Datum Feld
3. [ ] Abrechnungsseite DRK: Vergütungsjahr-Filter
4. [ ] Abrechnungsseite DRK: Qualitätsbonus-Status anzeigen
5. [ ] Record-Detail: Ansprüche (VJ 1-5) mit Status anzeigen

---

## Anhang: Beispiel-Workflow

### Szenario

- Kampagne: "Frühjahr 2026"
- Einsatzgebiet: "OV Musterstadt"
- 100 Mitglieder geworben
- Sondierungslimit: 20 MG
- Provisionssätze: Sondierung 80/50/30, Regular 60/40/20
- 8 Stornos nach 10 Monaten

### Ablauf

```
WOCHE 1-4: Zwischenabrechnungen
├── 100 MG geworben
├── Sortiert nach Beitrag: kleinste 20 → Sondierung
├── Zwischenabr. Sondierung: 20 MG × Ø100€ × 80% = 1.600€
│   └── Stornopuffer 10%: 160€ → Auszahlung: 1.440€
├── Zwischenabr. Regular: 80 MG × Ø100€ × 60% = 4.800€
│   └── Stornopuffer 10%: 480€ → Auszahlung: 4.320€

+ 8 WOCHEN: Endabrechnung VJ1
├── Stornopuffer auflösen: 640€ (160 + 480)
├── 8 Stornos: -640€ (8 × 80€ Durchschnitt)
├── Netto: 0€ (Puffer und Stornos gleichen sich aus)
└── 92 MG aktiv für VJ2

+ 12 MONATE: Jahresrate VJ2
├── Qualitätsbonus berechnen:
│   └── Stornoquote: 8/100 = 8% → +10 PP Bonus
├── Rückwirkende Korrektur VJ1:
│   └── 92 MG × 10 PP × Ø100€ = 920€ Nachzahlung
├── VJ2 Abrechnung:
│   └── 20 Sondierung: 20 × 100€ × (50+10)% = 1.200€
│   └── 72 Regular: 72 × 100€ × (40+10)% = 3.600€
└── Gesamt VJ2: 920€ + 1.200€ + 3.600€ = 5.720€

+ 12 MONATE: Jahresrate VJ3
├── 92 MG noch aktiv
├── 20 Sondierung: 20 × 100€ × (30+10)% = 800€
├── 72 Regular: 72 × 100€ × (20+10)% = 2.160€
└── Gesamt VJ3: 2.960€

VJ4 + VJ5: Keine Vergütung (0% Sätze)
```

---

*Erstellt: 20.01.2026*
*Version: 1.0*
