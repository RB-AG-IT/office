# Kunden-Ledger: Folgevergütung & Abrechnungssystem

**Erstellt:** 20.01.2026
**Aktualisiert:** 20.01.2026
**Status:** Konzept abgeschlossen, Implementierung ausstehend
**Ziel:** Vollständiges Abrechnungssystem für DRK-Kunden mit 5-jähriger Folgevergütung

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Vergütungsmodell](#2-vergütungsmodell)
3. [Datensatz-Typen](#3-datensatz-typen)
4. [Abrechnungstypen](#4-abrechnungstypen)
5. [Rechnungsaufbau & Workflow](#5-rechnungsaufbau--workflow)
6. [Sondierung vs. Regular](#6-sondierung-vs-regular)
7. [Qualitätsbonus](#7-qualitätsbonus)
8. [Absicherungsfristen](#8-absicherungsfristen)
9. [Stornopuffer](#9-stornopuffer)
10. [Teilvergütung bei Storno](#10-teilvergütung-bei-storno)
11. [Sonderfälle](#11-sonderfälle)
12. [Zubuchungen](#12-zubuchungen)
13. [Zeitliche Abläufe](#13-zeitliche-abläufe)
14. [Datenbank-Schema](#14-datenbank-schema)
15. [Implementierungsschritte](#15-implementierungsschritte)
16. [Frontend: DRK Abrechnungsseite](#16-frontend-drk-abrechnungsseite)

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

Ein Record erzeugt Vergütungsansprüche über 5 Jahre:

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

## 3. Datensatz-Typen

### 3.1 Neumitglieder

Neu geworbene Mitglieder. Das 5-Jahres-Modell gilt vollständig.

**Berechnungsgrundlage:** Voller Jahresbeitrag (yearly_amount)

```
Beispiel:
Jahresbeitrag: 120 €
VJ1: 120 € × 80% = 96 €
```

### 3.2 Erhöhungen

Bestehende Mitglieder, die ihren Beitrag erhöhen. Das 5-Jahres-Modell gilt auch hier.

**Berechnungsgrundlage:** Nur der Erhöhungsbetrag (nicht der volle neue Beitrag!)

```
Beispiel:
Alter Beitrag: 60 €
Neuer Beitrag: 120 €
Erhöhungsbetrag: 60 €

VJ1: 60 € × 80% = 48 €
```

### 3.3 Neuträge

Wie Neumitglieder behandelt. Berechnungsgrundlage ist der volle Jahresbeitrag.

---

## 4. Abrechnungstypen

### 4.1 Zwischenabrechnungen (VJ 1)

- **Anzahl:** 3-4 Stück während der Kampagne
- **Zeitpunkt:** Während des Einsatzes (z.B. wöchentlich)
- **Inhalt:** Neu geworbene Mitglieder seit letzter Abrechnung
- **Besonderheit:** 10% Stornopuffer wird zurückgehalten

### 4.2 Endabrechnung (VJ 1)

- **Anzahl:** 1 pro Einsatzgebiet
- **Zeitpunkt:** XX Wochen nach letztem Einsatztag (einstellbar: `endabr_wochen`)
- **Inhalt:**
  - Restliche nicht abgerechnete MG
  - Auflösung Stornopuffer
  - Verrechnung aller Stornos seit Zwischenabrechnungen
- **Besonderheit:** Noch OHNE Qualitätsbonus

### 4.3 Jahresabrechnungen (VJ 2-5)

- **Zeitpunkt:** 12 Monate nach vorheriger Abrechnung
- **Inhalt:**
  - Noch aktive Mitglieder (nicht storniert)
  - Verrechnung von Stornos
- **Besonderheit VJ 2:** Qualitätsbonus wird berechnet und rückwirkend auf VJ 1 angewendet

---

## 5. Rechnungsaufbau & Workflow

### 5.1 Grundprinzipien

- **Separate Rechnungen:** Sondierung und Regular werden IMMER als separate Rechnungen erstellt
- **Pro Kampagne:** Jede Kampagne wird separat abgerechnet (keine Zusammenfassung mehrerer Kampagnen)
- **Manueller Zeitraum:** Der Abrechnungszeitraum wird manuell gewählt (typisch wöchentlich oder monatlich)
- **USt:** Immer 19% Umsatzsteuer

### 5.2 Rechnungsnummern

**Format:** `[JJ]-[Empfänger]-[KundenNr]-[Typ]-[Nummer]`

```
Beispiel Kunden-ID: A025-023
→ KundenNr: 023

026-OV-023-ZA-00422  → Zwischenabrechnung
026-KV-023-EA-00423  → Endabrechnung
026-OV-015-1JA-00424 → 1. Jahresabrechnung (anderer Kunde)
```

**Komponenten:**

| Teil | Bedeutung | Quelle |
|------|-----------|--------|
| 026 | Jahr (2026) | Automatisch |
| OV/KV/LV | Empfängertyp | Kundenprofil |
| 023 | Kunden-Nr (3 Ziffern aus Kunden-ID) | Kundenprofil |
| ZA/EA/1JA/2JA/3JA/4JA | Abrechnungstyp | Automatisch |
| 00422 | Fortlaufende Nummer (global) | Automatisch |

**Abrechnungstypen:**
- ZA = Zwischenabrechnung
- EA = Endabrechnung (VJ1)
- 1JA = 1. Jahresabrechnung (VJ2)
- 2JA = 2. Jahresabrechnung (VJ3)
- 3JA = 3. Jahresabrechnung (VJ4)
- 4JA = 4. Jahresabrechnung (VJ5)

**Empfängertypen:**
- OV = Ortsverein
- KV = Kreisverband
- LV = Landesverband

### 5.3 MG-Gruppierung nach Kalenderwoche

Mitglieder werden **pro Kalenderwoche (KW) gruppiert** dargestellt:

```
POSITIONEN:
  KW 12: 25 MG | 3.000 JE | 80% | 2.400€
  KW 13: 30 MG | 3.600 JE | 80% | 2.880€
  KW 14: 20 MG | 2.400 JE | 80% | 1.920€
```

### 5.4 Sondierungslimit über KWs

Das Sondierungslimit wird **kumulativ über alle KWs** gezählt:

```
Beispiel (Limit: 100 MG Sondierung):

KW 12: 60 MG → alle Sondierung (60/100)
KW 13: 50 MG → 40 Sondierung + 10 Regular (100/100 erreicht)
KW 14: 30 MG → alle Regular

Rechnungen KW 13:
  - 1x Sondierung (40 MG)
  - 1x Regular (10 MG)
```

### 5.5 Rechnungsaufbau Zwischenabrechnung

```
┌─────────────────────────────────────────────────────┐
│ POSITIONEN (pro KW):                                │
│   KW 12: 25 MG | 3.000 JE | 80% | 2.400€           │
│   KW 13: 30 MG | 3.600 JE | 80% | 2.880€           │
├─────────────────────────────────────────────────────┤
│ ABZÜGE STORNOS (nicht abgerechnet):                 │
│   5 Stornos | -400€                                 │
├─────────────────────────────────────────────────────┤
│ ZUBUCHUNGEN:                                        │
│   KFZ-Pauschale | 300€                              │
│   Ausweise | 150€                                   │
├─────────────────────────────────────────────────────┤
│ NETTO:                          5.330€              │
│ Stornopuffer 10%:                -533€              │
│ ZWISCHENSUMME:                  4.797€              │
│ UST (19%):                        911€              │
│ BRUTTO:                         5.708€              │
└─────────────────────────────────────────────────────┘
```

### 5.6 Rechnungsaufbau Endabrechnung (VJ1)

Die Endabrechnung ist eine **Gesamtauflistung** mit Verrechnung:

```
┌─────────────────────────────────────────────────────┐
│ GESAMT:                                             │
│   140 MG | 16.800 JE | 80% | 13.440€               │
├─────────────────────────────────────────────────────┤
│ ABZÜGE STORNOS:                                     │
│   12 Stornos | -960€                                │
├─────────────────────────────────────────────────────┤
│ ABZÜGE BEREITS BEZAHLT:                             │
│   Zwischenabr. 1 (KW12-13): -4.752€                │
│   Zwischenabr. 2 (KW14-15): -3.420€                │
├─────────────────────────────────────────────────────┤
│ ZUBUCHUNGEN:                                        │
│   (falls vorhanden)                                 │
├─────────────────────────────────────────────────────┤
│ NETTO:                          4.308€              │
│ (KEIN Stornopuffer bei Endabrechnung!)             │
│ UST (19%):                        818€              │
│ BRUTTO:                         5.126€              │
└─────────────────────────────────────────────────────┘
```

**Wichtig:** Bei der Endabrechnung wird KEIN Stornopuffer einbehalten.

### 5.7 Rechnungsaufbau Jahresabrechnung (VJ2+)

```
┌─────────────────────────────────────────────────────┐
│ GESAMT VJ2:                                         │
│   128 MG (aktiv) | 15.360 JE | 50% | 7.680€        │
├─────────────────────────────────────────────────────┤
│ QUALITÄTSBONUS VJ1 (Nachzahlung):                   │
│   128 MG | +10 PP | +1.536€                        │
├─────────────────────────────────────────────────────┤
│ ABZÜGE STORNOS (Gutschrift):                        │
│   8 Stornos | -640€ (bereits abgerechneter Betrag) │
├─────────────────────────────────────────────────────┤
│ NETTO:                          8.576€              │
│ UST (19%):                      1.629€              │
│ BRUTTO:                        10.205€              │
└─────────────────────────────────────────────────────┘
```

**Wichtig bei Stornos in VJ2+:**
- Storno-Gutschrift = **bereits abgerechneter Betrag aus VJ1**
- NICHT der aktuelle VJ-Satz!

```
Beispiel:
- MG Müller in VJ1 abgerechnet: 120€ × 80% = 96€
- Storno vor VJ2
- Gutschrift auf VJ2-Rechnung: -96€ (nicht VJ2-Betrag!)
```

### 5.8 Rechnungs-PDF Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO]                           RHODENBURG GmbH            │
│                                  QP-Qualitätspartner der    │
│                                  Gemeinwohl & Sozialwirtsch.│
│ Absender-Zeile (klein)           Adresse Verwaltung         │
│                                  Poststelle                 │
│ Herr / Frau / Firma              Telefon/Fax               │
│ [EMPFÄNGER]                      www / E-Mail              │
│ z.Hd. [Ansprechpartner]                                    │
│ [Adresse]                                                   │
├─────────────────────────────────────────────────────────────┤
│ Rechnung                         Ansprechpartner:           │
│                                  [Name/Abteilung]           │
│ Bezeichnung  : Zwischenrechnung  E-Mail: buchhaltung@...   │
│ Datum        : 31.07.2025                                  │
│ Nummer       : 025-OV-031-ZR-A00384                        │
│ Bank         : DE53 1001 8000 0480 9659 32 (BIC: ...)      │
│ KD-ID: A025-031 | Vertr.-Nr.: 025/RV/00412                 │
│ E-Mail: drk-ov-beispiel@web.de                             │
│ *sofortige Fälligkeit (sofern vertraglich nicht anders)    │
├─────────────────────────────────────────────────────────────┤
│ Pos │ Beschreibung           │ Anz MG │ JE EUR │ % │Gesamt │
│─────┼────────────────────────┼────────┼────────┼───┼───────│
│ A1  │ Neumitglieder          │ 51     │ 4.329  │79 │3.419  │
│     │ (Sonderkonditionen)    │        │        │   │       │
│ A2  │ Neumitglieder          │ 04     │ 960    │89 │ 854   │
│     │ (Regular)              │        │        │   │       │
│ A3  │ Erhöhungen             │ 06     │ 402    │89 │ 357   │
│     │ (Differenzbetrag)      │        │        │   │       │
├─────────────────────────────────────────────────────────────┤
│                              Zwischensumme EUR    4.632,09  │
├─────────────────────────────────────────────────────────────┤
│ B1  │ Stornopuffer -10%      │        │        │   │-463,21│
│     │ (vertragliche Vereinb.)│        │        │   │       │
├─────────────────────────────────────────────────────────────┤
│                              Gesamtsumme EUR      4.168,88  │
│                              Gesetzl. USt (19%)     792,09  │
│                              RECHNUNGSBETRAG      4.960,97  │
├─────────────────────────────────────────────────────────────┤
│ [LOGO] [QP-Siegel]  Firmendaten | Registergericht |         │
│                     Geschäftsführer | Website     Seite: X  │
└─────────────────────────────────────────────────────────────┘
```

**PDF-Elemente:**

| Element | Inhalt | Quelle |
|---------|--------|--------|
| Logo | Rhodenburg Logo | Statisch |
| Absender | Firmenname, Adressen, Kontakt | Statisch |
| Empfänger | Kundenname, z.Hd., Adresse | Kundenprofil |
| Rechnungsdaten | Bezeichnung, Datum, Nummer, Bank | System |
| KD-ID | Kunden-ID | Kundenprofil |
| Vertr.-Nr. | Vertragsnummer | Kampagne/Vertrag |
| Positionen | MG gruppiert nach Typ | Abrechnungsdaten |
| Abzüge | Stornopuffer, Stornos | Berechnet |
| Summen | Netto, USt, Brutto | Berechnet |
| Footer | Firmendaten, Registergericht, GF | Statisch |

### 5.9 Rechnungsstatus

```
entwurf → offen → geplant → bezahlt
                     ↓
                 storniert
```

| Status | Bedeutung | Aktion |
|--------|-----------|--------|
| entwurf | In Bearbeitung | Bearbeiten möglich |
| offen | Freigegeben, Rechnungsnummer vergeben | Versand möglich |
| geplant | Versand geplant/erfolgt | Warten auf Zahlung |
| bezahlt | Vollständig bezahlt | Abgeschlossen |
| storniert | Rechnung storniert | Gutschrift erstellen |

**Hinweis:** Bei Teilzahlung bleibt Status "offen" bis vollständig bezahlt.

### 5.10 Zahlungstracking

**Manuelle Erfassung:** Zahlungen werden manuell über ein Pop-up erfasst.

**Eingabefelder:**
- Bezahlter Betrag (Netto)
- USt
- Brutto
- Datum

**Mehrere Zahlungen möglich:**

```
Rechnung: 1.000€ Brutto
├── Zahlung 1: 400€ (01.02.2026)
├── Zahlung 2: 300€ (15.02.2026)
├── Zahlung 3: 300€ (28.02.2026)
└── Status: bezahlt (100%)
```

**Zahlungshistorie:** Pro Rechnung werden alle Zahlungseingänge mit Datum und Betrag gespeichert.

### 5.11 Rechnungsversand

**Versandoptionen:**
- E-Mail automatisch (bei geplanter Abrechnung)
- E-Mail manuell (Button "Jetzt senden")
- PDF-Download (zum selbst versenden/archivieren)

**E-Mail-Empfänger:**
- Ansprechpartner **"Schatzmeister (Rechnungsstellung)"** im Kundenprofil
- Bestehendes Feld "Schatzmeister", Label visuell um "(Rechnungsstellung)" ergänzen
- **Ohne Eintrag ist E-Mail-Versand nicht möglich!**

**Mahnwesen:** Nicht automatisch. Später: Manuelle Vorlage mit Versandfunktion.

---

## 6. Sondierung vs. Regular

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

## 7. Qualitätsbonus

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

**Grenzfall:** Bei exakt 8,00% Stornoquote wird der Bonus gewährt (≤ bedeutet "kleiner oder gleich").

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

## 8. Absicherungsfristen

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

## 9. Stornopuffer

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

**Individuell pro Kampagne/Einsatzgebiet** einstellbar im Kampagnen-Modal.

In `campaign_areas`:
```json
{
  "stornopuffer": 10  // Prozent (individuell einstellbar, Standard: 10%)
}
```

---

## 10. Teilvergütung bei Storno

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

### Gültigkeit

**Wichtig:** Teilvergütung ist nur relevant BIS zur Absicherung!

```
Monat 1-12:  Storno → Teilvergütung möglich (falls aktiviert)
Monat 13+:   VJ 1+2 abgesichert → keine Rückforderung mehr
Monat 25+:   VJ 3 abgesichert → etc.
```

Sobald ein Abrechnungsintervall (Absicherungsfrist) erreicht ist, gibt es keine Rückforderung mehr für die abgesicherten VJ.

---

## 11. Sonderfälle

### 11.1 Beitragsänderung während Laufzeit

Wenn ein MG seinen Jahresbeitrag ändert (erhöht oder senkt):

- **Berechnungsgrundlage:** Der NEUE Betrag gilt ab Änderung
- **Rückwirkend:** Falls nötig, müssen bereits abgerechnete VJ korrigiert werden

```
Beispiel:
- VJ1 abgerechnet mit 120€ × 80% = 96€
- MG erhöht auf 180€
- VJ2 wird mit 180€ berechnet: 180€ × 50% = 90€
- Falls Qualitätsbonus rückwirkend: Korrektur auf Basis 180€
```

### 11.2 Reaktivierung nach Storno

Wenn ein storniertes MG wieder aktiviert wird:

- **Ursprüngliche Ansprüche:** Werden wieder aktiviert (nicht neu von vorne)
- **Differenzberechnung:** Bereits als Gutschrift verrechnete Beträge müssen ausgeglichen werden

```
Beispiel:
- MG storniert nach VJ1 (96€ als Gutschrift verrechnet)
- MG wird reaktiviert
- Bei nächster Abrechnung: +96€ Zubuchung (Ausgleich der Gutschrift)
- VJ2-5 werden normal weiter abgerechnet
```

### 11.3 Storno nach Rechnungsstellung, vor Zahlung

Wenn eine Rechnung bereits erstellt wurde, aber noch nicht bezahlt:

- **Rechnung bleibt bestehen** (wird NICHT storniert/gelöscht)
- **Gutschrift auf nächste Rechnung**

```
Beispiel:
- Rechnung 1: 1.000€ (noch offen)
- MG Müller storniert (war mit 96€ auf Rechnung)
- Rechnung 2: Gutschrift -96€ für Storno Müller
```

### 11.4 Storno zwischen Endabrechnung und VJ2

Wenn ein MG nach der Endabrechnung (VJ1) aber vor der 2. Jahresabrechnung (VJ2) storniert:

- **Verrechnung mit VJ2-Rechnung**
- **Mit Teilvergütung:** Nur teilweise Rückforderung (je nach Einstellung)
- **Ohne Teilvergütung:** Vollständige Rückforderung des VJ1-Betrags

```
Beispiel mit Teilvergütung (50%):
- VJ1 abgerechnet: 96€
- Storno nach 10 Monaten
- Rückforderung: 96€ × 50% = 48€ (auf VJ2-Rechnung)

Beispiel ohne Teilvergütung:
- VJ1 abgerechnet: 96€
- Storno nach 10 Monaten
- Rückforderung: 96€ vollständig (auf VJ2-Rechnung)
```

### 11.5 Negative Rechnungsbeträge

**Ja, möglich.** Wenn Storno-Gutschriften die Positionen übersteigen, kann eine Rechnung negativ werden.

### 11.6 0€-Rechnung

**Wird NICHT erstellt.** Wenn der Nettobetrag nach allen Verrechnungen 0€ beträgt, wird keine Rechnung generiert.

### 11.7 Rechnung manuell stornieren

Eine Rechnung kann nur **manuell** storniert werden (Button "Stornieren"). Es gibt keine automatische Stornierung.

### 11.8 Storno vor erster Abrechnung

Wenn ein MG storniert wird, **bevor** überhaupt eine Zwischenabrechnung erstellt wurde:

- **Nichts passiert** - MG wird einfach nicht abgerechnet
- Keine Gutschrift, keine Verrechnung

### 11.9 Mehrfache Erhöhungen

Wenn ein MG seinen Beitrag mehrfach erhöht:

- **Immer nur der Erhöhungsbetrag** (Differenz zum vorherigen Beitrag)
- Jede Erhöhung startet KEINEN neuen 5-Jahres-Zyklus

```
Beispiel:
- Start: 60€
- Erhöhung 1: 60€ → 90€ → Differenz 30€ für Provision
- Erhöhung 2: 90€ → 120€ → Differenz 30€ für Provision
```

### 11.10 Beitragssenkung

Wenn ein MG seinen Beitrag senkt:

- **Gleiches Prinzip wie Erhöhung:** Differenzbetrag wird verwendet
- Differenz ist negativ → führt zu Gutschrift
- Falls bereits abgerechnet → Gutschrift auf nächste Rechnung

```
Beispiel:
- VJ1 abgerechnet mit 120€ × 80% = 96€
- MG senkt auf 80€ (Differenz: -40€)
- VJ2: Gutschrift für bereits abgerechneten Betrag
```

---

## 12. Zubuchungen

### Konzept

Zusatzkosten die pro Kampagne/Werbegebiet manuell eingetragen werden können.

### Beispiele

- **KFZ:** Fahrzeugkosten
- **Kleidung:** Arbeitskleidung
- **Ausweise:** Mitarbeiterausweise

### Konfiguration

Einstellbar im **Kampagnen-Modal** pro Werbegebiet/Kampagne. Die Beträge werden individuell eingetragen.

### Darstellung auf Rechnung

```
ZUBUCHUNGEN:
  KFZ-Pauschale | 500€
  Ausweise (10 Stk) | 150€
  Kleidung | 200€
```

---

## 13. Zeitliche Abläufe

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

## 14. Datenbank-Schema

### 14.0 Übersicht Datenbank-Erweiterungen

| Bereich | Lösung |
|---------|--------|
| DRK-Rechnungen | Bestehende `invoices` Tabelle erweitern |
| Zahlungshistorie | Neue Tabelle `invoice_payments` |
| Zubuchungen | Neue Tabelle `campaign_zubuchungen` |
| Kunden-Daten | `customers` Tabelle erweitern |

### 14.1 Neue Tabelle: `record_entitlements`

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

### 14.2 Neue Tabelle: `qualitaetsbonus_berechnungen`

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

### 14.3 Neue Tabelle: `absicherungsfristen` (Konstanten)

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

### 14.4 Erweiterung: `campaign_areas`

```sql
ALTER TABLE campaign_areas ADD COLUMN IF NOT EXISTS qualitaetsbonus_datum DATE;
-- NULL = Standard (bei VJ2-Abrechnung), oder festes Datum

COMMENT ON COLUMN campaign_areas.qualitaetsbonus_datum IS
'Datum für Qualitätsbonus-Berechnung. NULL = Standard bei VJ2-Abrechnung.';
```

### 14.5 Erweiterung: `campaign_areas` - Einwohnerzahl

Die Einwohnerzahl für das Sondierungslimit (bei `limitType: "prozent"`) wird in `campaign_areas` gespeichert.

```sql
ALTER TABLE campaign_areas ADD COLUMN IF NOT EXISTS einwohnerzahl INTEGER;

COMMENT ON COLUMN campaign_areas.einwohnerzahl IS
'Einwohnerzahl des Einsatzgebiets für Sondierungslimit-Berechnung (bei limitType=prozent).';
```

Die Eingabe erfolgt auf der **Kundenprofil-Seite** pro Einsatzgebiet.

### 14.6 Erweiterung: `customer_billing_ledger`

```sql
ALTER TABLE customer_billing_ledger
ADD COLUMN IF NOT EXISTS verguetungsjahr INTEGER CHECK (verguetungsjahr BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS entitlement_id UUID REFERENCES record_entitlements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ist_korrektur BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS korrektur_grund TEXT;

CREATE INDEX IF NOT EXISTS idx_billing_ledger_vj ON customer_billing_ledger(verguetungsjahr);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_entitlement ON customer_billing_ledger(entitlement_id);
```

### 14.7 Neue Tabelle: `invoice_payments`

Speichert Zahlungseingänge für Teilzahlungen.

```sql
CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenz
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Beträge
    betrag_netto DECIMAL(10,2) NOT NULL,
    betrag_ust DECIMAL(10,2) NOT NULL,
    betrag_brutto DECIMAL(10,2) NOT NULL,

    -- Zeitpunkt
    zahlungsdatum DATE NOT NULL,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_datum ON invoice_payments(zahlungsdatum);
```

### 14.8 Neue Tabelle: `campaign_zubuchungen`

Speichert Zubuchungen (KFZ, Kleidung, Ausweise) pro Kampagne/Werbegebiet.

```sql
CREATE TABLE campaign_zubuchungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE CASCADE,

    -- Daten
    typ TEXT NOT NULL CHECK (typ IN ('kfz', 'kleidung', 'ausweise', 'sonstiges')),
    bezeichnung TEXT,
    betrag DECIMAL(10,2) NOT NULL,

    -- Abrechnung
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    abgerechnet_am DATE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zubuchungen_campaign ON campaign_zubuchungen(campaign_id);
CREATE INDEX idx_zubuchungen_area ON campaign_zubuchungen(campaign_area_id);
CREATE INDEX idx_zubuchungen_invoice ON campaign_zubuchungen(invoice_id);
```

### 14.9 Erweiterung: `customers`

```sql
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS empfaenger_typ TEXT CHECK (empfaenger_typ IN ('OV', 'KV', 'LV')),
ADD COLUMN IF NOT EXISTS kunden_nr_ziffern CHAR(3);

COMMENT ON COLUMN customers.empfaenger_typ IS
'Empfängertyp für Rechnungsnummer: OV=Ortsverein, KV=Kreisverband, LV=Landesverband';

COMMENT ON COLUMN customers.kunden_nr_ziffern IS
'3-stellige Nummer aus Kunden-ID für Rechnungsnummer (z.B. "023" aus A025-023)';
```

### 14.10 Erweiterung: `invoices` (für DRK-Rechnungen)

```sql
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS empfaenger_typ TEXT CHECK (empfaenger_typ IN ('OV', 'KV', 'LV')),
ADD COLUMN IF NOT EXISTS kunden_nr CHAR(3),
ADD COLUMN IF NOT EXISTS abrechnungstyp TEXT CHECK (abrechnungstyp IN ('ZA', 'EA', '1JA', '2JA', '3JA', '4JA')),
ADD COLUMN IF NOT EXISTS fortlaufende_nr INTEGER,
ADD COLUMN IF NOT EXISTS vertragsnummer TEXT,
ADD COLUMN IF NOT EXISTS ist_sondierung BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_campaign ON invoices(campaign_id);
CREATE INDEX IF NOT EXISTS idx_invoices_area ON invoices(campaign_area_id);
```

### 14.11 Kunden-ID Generierung

**Format:** `A[JJ]-[NNN]`

| Teil | Bedeutung | Beispiel |
|------|-----------|----------|
| A | Prefix (konstant) | A |
| JJ | Kalenderjahr (2-stellig) | 025 (für 2025) |
| NNN | Fortlaufende Nummer (3-stellig) | 023 |

**Beispiel:** `A025-023` = 23. Kunde im Jahr 2025

**Generierung:**
- Automatisch bei Kundenanlage
- Fortlaufende Nummer pro Jahr
- Neue Nummer bei Jahreswechsel beginnt bei 001

```sql
-- Generierung der nächsten Kunden-ID
SELECT 'A' || TO_CHAR(NOW(), 'YY') || '-' ||
       LPAD((COALESCE(MAX(CAST(SUBSTRING(kunden_id FROM 6 FOR 3) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
FROM customers
WHERE kunden_id LIKE 'A' || TO_CHAR(NOW(), 'YY') || '-%';
```

### 14.12 Vertragsnummer

**Quelle:** Kundenprofil-Seite (Vertragsauswahl pro Kampagne)

**ERLEDIGT:** (20.01.2026)
- [x] Backend: Speicherung in DB (Migration 066)
- [x] Frontend: Eingabefeld im Kundenprofil (Rahmenverträge)

---

## 15. Implementierungsschritte

> **WICHTIG:** Vor jedem Schritt Kontext/Abhängigkeiten prüfen, nach Ausführung Double-Check ob es funktioniert, dann abhaken `[x]` mit Datum.

---

### Phase 1: Datenbank-Grundlagen (Fundament)

#### 1.1 Neue Tabellen erstellen
- [x] **1.1.1** Migration: `absicherungsfristen` Tabelle + Konstanten einfügen (20.01.2026)
- [x] **1.1.2** Migration: `record_entitlements` Tabelle (Ansprüche pro Record × VJ) (20.01.2026)
- [x] **1.1.3** Migration: `qualitaetsbonus_berechnungen` Tabelle (20.01.2026)
- [x] **1.1.4** Migration: `invoice_payments` Tabelle (Zahlungshistorie) (20.01.2026)
- [x] **1.1.5** Migration: `campaign_zubuchungen` Tabelle (20.01.2026)

#### 1.2 Bestehende Tabellen erweitern
- [x] **1.2.1** Migration: `customers` erweitern (empfaenger_typ, kunden_nr_ziffern) (20.01.2026)
- [x] **1.2.2** Migration: `campaign_areas` erweitern (qualitaetsbonus_datum, einwohnerzahl, stornopuffer) (20.01.2026)
- [x] **1.2.3** Migration: `customer_billing_ledger` erweitern (verguetungsjahr, entitlement_id) (20.01.2026)
- [x] **1.2.4** Migration: `invoices` erweitern für DRK (customer_id, campaign_id, abrechnungstyp, etc.) (20.01.2026)

#### 1.3 Indizes und Constraints
- [x] **1.3.1** Indizes für `record_entitlements` anlegen (20.01.2026)
- [x] **1.3.2** Indizes für `invoice_payments` anlegen (20.01.2026)
- [x] **1.3.3** Indizes für erweiterte `invoices` Spalten anlegen (20.01.2026)

---

### Phase 2: Kunden-ID Generierung

- [x] **2.1** SQL-Funktion: `generate_customer_id()` erstellen (20.01.2026)
- [x] **2.2** Trigger: Automatische Kunden-ID bei INSERT in `customers` (20.01.2026)
- [x] **2.3** Frontend Kundenprofil: Kunden-ID Feld anzeigen (20.01.2026)

---

### Phase 3: Record-Entitlements (Ansprüche)

#### 3.1 Trigger für automatische Anspruchserstellung
- [x] **3.1.1** Funktion: `create_record_entitlements()` - erstellt 5 VJ-Ansprüche (20.01.2026)
- [x] **3.1.2** Trigger: Bei Record INSERT → 5 Ansprüche erstellen (20.01.2026)
- [x] **3.1.3** Funktion: Absicherungsdatum berechnen (basierend auf Zahlungsart) (20.01.2026)
- [x] **3.1.4** Funktion: Fälligkeitsdatum berechnen (VJ2 = VJ1 + 12 Monate) (20.01.2026)

#### 3.2 Storno-Handling
- [x] **3.2.1** Funktion: `handle_record_storno()` - Ansprüche stornieren (20.01.2026)
- [x] **3.2.2** Trigger: Bei Record UPDATE (status → storno) → Ansprüche aktualisieren (20.01.2026)
- [x] **3.2.3** Logik: Abgesicherte VJ behalten, nicht abgesicherte stornieren (20.01.2026)

---

### Phase 4: Rechnungsnummern-Generierung

- [x] **4.1** SQL-Funktion: `generate_invoice_number()` erstellen (20.01.2026)
- [x] **4.2** Format: `[JJ]-[Empfänger]-[KundenNr]-[Typ]-[Nummer]` (20.01.2026)
- [x] **4.3** Trigger: Automatische Nummer bei Status → offen (20.01.2026)

---

### Phase 5: Frontend - DRK Abrechnungsseite Grundstruktur

#### 5.1 Tab-Struktur
- [x] **5.1.1** HTML: Tab "Rechnungen" hinzufügen (20.01.2026)
- [x] **5.1.2** HTML: Tab "Fällig" hinzufügen (20.01.2026)
- [x] **5.1.3** JS: Tab-Initialisierung mit Badges (20.01.2026)

#### 5.2 Tab Kunden (erweitern)
- [x] **5.2.1** Dropdown erweitern: "Abrechnung erstellen" (20.01.2026)
- [x] **5.2.2** Dropdown erweitern: "Rechnungen anzeigen" (20.01.2026)

---

### Phase 6: Frontend - Tab Rechnungen

#### 6.1 Tabelle
- [x] **6.1.1** HTML: Rechnungen-Tabelle Struktur (20.01.2026)
- [x] **6.1.2** JS: Spalten-Konfiguration (Rechnungsnr, Kunde, Typ, Brutto, Status, Datum) (20.01.2026)
- [x] **6.1.3** JS: Render-Funktion für Rechnungen (20.01.2026)
- [x] **6.1.4** CSS: Status-Badges (entwurf, offen, geplant, bezahlt, storniert) (20.01.2026)

#### 6.2 Filter
- [x] **6.2.1** HTML: Filter-Dropdowns (Status, Typ) (20.01.2026)
- [x] **6.2.2** JS: Filter-Logik implementieren (20.01.2026)

#### 6.3 Zeilen-Dropdown
- [x] **6.3.1** Details anzeigen (Placeholder) (20.01.2026)
- [x] **6.3.2** PDF Download (Placeholder) (20.01.2026)
- [x] **6.3.3** E-Mail senden (Placeholder) (20.01.2026)
- [x] **6.3.4** Zahlung erfassen (Placeholder) (20.01.2026)
- [x] **6.3.5** Stornieren (Placeholder) (20.01.2026)

#### 6.4 Auswahl-Aktionen
- [x] **6.4.1** Mehrfachselektion aktivieren (20.01.2026)
- [x] **6.4.2** Sammel-E-Mail (Placeholder) (20.01.2026)
- [x] **6.4.3** Sammel-PDF (ZIP) (Placeholder) (20.01.2026)
- [x] **6.4.4** Export (CSV/Excel) (Placeholder) (20.01.2026)

---

### Phase 7: Frontend - Tab Fällig

- [x] **7.1** HTML: Fällig-Tabelle Struktur (20.01.2026)
- [x] **7.2** JS: Fällige Abrechnungen berechnen (Placeholder mit Testdaten) (20.01.2026)
- [x] **7.3** JS: Render-Funktion (20.01.2026)
- [x] **7.4** Auswahl-Aktion: "Abrechnung erstellen" für ausgewählte (20.01.2026)

---

### Phase 8: Frontend - Modal Abrechnung erstellen

#### 8.1 Schritt 1: Auswahl
- [x] **8.1.1** HTML: Modal-Struktur (20.01.2026)
- [x] **8.1.2** Dropdown: Kunde laden (20.01.2026)
- [x] **8.1.3** Dropdown: Kampagnen des Kunden laden (20.01.2026)
- [x] **8.1.4** Dropdown: Abrechnungstyp (ZA/EA/1JA-4JA) (20.01.2026)
- [x] **8.1.5** Datepicker: Zeitraum von/bis (20.01.2026)
- [x] **8.1.6** Dropdown: Vertragsnummer aus Kundenprofil (20.01.2026)
- [x] **8.1.7** Checkboxen: Einsatzgebiete mit MG-Anzahl (20.01.2026)

#### 8.2 Schritt 2: Vorschau
- [x] **8.2.1** JS: MG nach Sondierung/Regular aufteilen (yearly_amount ASC, dann last_name) (20.01.2026)
- [x] **8.2.2** JS: Sondierungslimit aus campaign_areas (MG oder % Einwohner) (20.01.2026)
- [x] **8.2.3** JS: Positionen pro Einsatzgebiet berechnen (20.01.2026)
- [x] **8.2.4** HTML: Vorschau-Tabelle rendern (20.01.2026)
- [x] **8.2.5** JS: Stornopuffer aus campaign_areas (bei ZA) (20.01.2026)
- [x] **8.2.6** JS: Summen berechnen (Netto, USt, Brutto) (20.01.2026)

#### 8.3 Kundenprofil-Einstellung beachten
- [x] **8.3.1** Prüfen: Zusammen oder Getrennt? (20.01.2026)
- [x] **8.3.2** Zusammen: Eine Rechnung, alle Einsatzgebiete als Posten (20.01.2026)
- [x] **8.3.3** Getrennt: Mehrere Rechnungen generieren (20.01.2026)

#### 8.4 Speichern
- [x] **8.4.1** Button "Als Entwurf": Status = entwurf (20.01.2026)
- [x] **8.4.2** Button "Erstellen": Status = offen (20.01.2026)
- [x] **8.4.3** RPC: `create_drk_invoice()` Funktion (20.01.2026)

---

### Phase 9: Frontend - Modal Rechnung Details

- [x] **9.1** HTML: Modal-Struktur (20.01.2026)
- [x] **9.2** JS: Rechnung laden und anzeigen (20.01.2026)
- [x] **9.3** Status-Dropdown zum Ändern (20.01.2026)
- [x] **9.4** Positionen-Tabelle (20.01.2026)
- [x] **9.5** Zahlungen-Liste (20.01.2026)
- [x] **9.6** Button: Zahlung erfassen (Placeholder) (20.01.2026)
- [x] **9.7** Button: PDF Download (Placeholder) (20.01.2026)
- [x] **9.8** Button: E-Mail senden (Placeholder) (20.01.2026)
- [x] **9.9** Button: Stornieren (mit Bestätigung) (20.01.2026)

---

### Phase 10: Frontend - Modal Zahlung erfassen

- [x] **10.1** HTML: Modal-Struktur (20.01.2026)
- [x] **10.2** Input: Betrag Brutto + Button "Vollständig" (20.01.2026)
- [x] **10.3** Datepicker: Zahlungsdatum (20.01.2026)
- [x] **10.4** Input: Notiz (optional) (20.01.2026)
- [x] **10.5** Vorschau: Netto/USt/Brutto Aufschlüsselung (20.01.2026)
- [x] **10.6** JS: Zahlung in `invoice_payments` speichern (20.01.2026)
- [x] **10.7** JS: Rechnungsstatus aktualisieren (wenn vollständig → bezahlt) (20.01.2026)

---

### Phase 11: Backend - Abrechnungslogik

#### 11.1 Zwischenabrechnung
- [ ] **11.1.1** RPC: MG für Zeitraum laden
- [ ] **11.1.2** RPC: Nach Jahresbeitrag sortieren (kleinste → Sondierung)
- [ ] **11.1.3** RPC: Sondierungslimit anwenden
- [ ] **11.1.4** RPC: Stornopuffer berechnen
- [ ] **11.1.5** RPC: Entitlements als abgerechnet markieren

#### 11.2 Endabrechnung
- [ ] **11.2.1** RPC: Stornopuffer auflösen
- [ ] **11.2.2** RPC: Stornos seit letzter ZA verrechnen
- [ ] **11.2.3** RPC: Restliche MG abrechnen

#### 11.3 Jahresabrechnung VJ2
- [ ] **11.3.1** RPC: Qualitätsbonus berechnen (Stornoquote)
- [ ] **11.3.2** RPC: Bonus in `qualitaetsbonus_berechnungen` speichern
- [ ] **11.3.3** RPC: Rückwirkende VJ1-Korrektur berechnen
- [ ] **11.3.4** RPC: VJ2 mit Bonus abrechnen

#### 11.4 Jahresabrechnung VJ3-5
- [ ] **11.4.1** RPC: Mit Qualitätsbonus abrechnen
- [ ] **11.4.2** RPC: Stornos verrechnen

---

### Phase 12: PDF-Generierung

- [ ] **12.1** Lib einbinden (jsPDF oder Backend)
- [ ] **12.2** Template: Rechnungs-PDF Layout (wie in Abschnitt 5.8)
- [ ] **12.3** Funktion: Positionen formatieren
- [ ] **12.4** Funktion: PDF generieren und Download

---

### Phase 13: E-Mail-Versand

- [ ] **13.1** Supabase Edge Function: `send_invoice_email`
- [ ] **13.2** Empfänger: Schatzmeister aus Ansprechpartner
- [ ] **13.3** Template: E-Mail Text
- [ ] **13.4** Anhang: PDF
- [ ] **13.5** Frontend: Button "E-Mail senden"

---

### Phase 14: Kundenprofil Anpassungen

#### 14.1 Rechnungshistorie (read-only)
- [ ] **14.1.1** Rechnungen des Kunden laden
- [ ] **14.1.2** Liste rendern (Rechnungsnr, Datum, Betrag, Status)
- [ ] **14.1.3** Link zur DRK Abrechnungsseite

#### 14.2 Einstellungen
- [x] **14.2.1** Toggle "Zusammen/Getrennt" in DB speichern (Migration 057)
- [x] **14.2.2** Empfängertyp aus DB laden (20.01.2026)

---

### Phase 15: Zubuchungen

- [ ] **15.1** Kampagnen-Modal: Zubuchungen-Abschnitt
- [ ] **15.2** Eingabe: Typ, Bezeichnung, Betrag
- [ ] **15.3** Speichern in `campaign_zubuchungen`
- [ ] **15.4** Abrechnungs-Modal: Zubuchungen anzeigen und hinzufügen

---

### Phase 16: Qualitätsbonus-Konfiguration

- [ ] **16.1** Kampagnen-Modal: Qualitätsbonus-Regeln bearbeiten
- [ ] **16.2** Eingabe: Stornoquote-Schwellen und Bonus-PP
- [ ] **16.3** Optional: Festes Qualitätsbonus-Datum

---

### Phase 17: RLS (Row Level Security)

- [ ] **17.0.1** RLS für alle neuen Tabellen aktivieren
- [ ] **17.0.2** Policies definieren (authenticated, service_role)

> **HINWEIS:** RLS wird erst ganz am Schluss aktiviert, nicht bei den einzelnen Migrationen.

---

### Phase 18: Testing & Validierung

- [ ] **18.1** Test: Kunden-ID Generierung
- [ ] **18.2** Test: Record-Entitlements bei neuem Record
- [ ] **18.3** Test: Storno-Handling
- [ ] **18.4** Test: Zwischenabrechnung erstellen
- [ ] **18.5** Test: Endabrechnung mit Stornopuffer-Auflösung
- [ ] **18.6** Test: VJ2 mit Qualitätsbonus
- [ ] **18.7** Test: Zusammen vs. Getrennt Rechnungen
- [ ] **18.8** Test: Zahlungserfassung und Status-Update
- [ ] **18.9** Test: PDF-Generierung
- [ ] **18.10** Test: E-Mail-Versand

---

**Gesamt: 18 Phasen, ~100 Einzelschritte**

---

## 16. Frontend: DRK Abrechnungsseite

### 16.1 Seitenstruktur (Tabs)

| Tab | Inhalt | Badge |
|-----|--------|-------|
| **Kunden** | Übersicht aller Kunden mit offener Provision | Anzahl Kunden |
| **Rechnungen** | Liste aller erstellten Rechnungen | Anzahl offen |
| **Fällig** | Anstehende Abrechnungen (automatisch berechnet) | Anzahl fällig |

### 16.2 Tab: Kunden (erweitern)

Bestehende Tabelle bleibt, Zeilen-Dropdown erweitern:

- Bearbeiten (→ Kundenprofil)
- E-Mail senden
- ---
- Abrechnung erstellen
- Rechnungen anzeigen (→ Tab Rechnungen gefiltert)

### 16.3 Tab: Rechnungen (neu)

**Filter:** Status | Typ | Kunde | Jahr

**Spalten:** Rechnungsnr. | Kunde | Typ | Brutto | Status | Datum

**Zeilen-Dropdown:**
- Details anzeigen
- PDF Download
- E-Mail senden
- ---
- Zahlung erfassen
- ---
- Stornieren

**Auswahl-Aktionen (Mehrfachselektion):**
- E-Mail senden (Sammelversand)
- PDF Download (ZIP)
- Export

### 16.4 Tab: Fällig (neu)

**Spalten:** Kunde | Kampagne | Typ | Fällig seit | Betrag (ca.)

**Logik:**
- EA: X Wochen nach letztem Einsatztag
- 1JA-4JA: 12 Monate nach vorheriger Abrechnung

**Auswahl-Aktion:** Abrechnung erstellen

### 16.5 Modal: Abrechnung erstellen

**Schritt 1: Auswahl**
- Kunde (Dropdown)
- Kampagne (Dropdown)
- Abrechnungstyp (ZA/EA/1JA...)
- Zeitraum (von/bis)
- Vertragsnummer (aus Kundenprofil)
- Einsatzgebiete (Checkboxen, mit MG-Anzahl)

**Schritt 2: Vorschau**

Je nach Kundenprofil-Einstellung (Zusammen/Getrennt):

**Zusammen:** Eine Rechnung mit allen Einsatzgebieten als Posten

```
SONDIERUNGSKONDITIONEN
Pos │ Einsatzgebiet    │ MG  │ JE      │ %  │ Betrag
A1  │ OV Musterstadt   │ 35  │ 4.200 € │ 80 │ 3.360 €
A2  │ OV Neustadt      │ 20  │ 2.400 € │ 80 │ 1.920 €
A3  │ OV Altstadt      │ 15  │ 1.800 € │ 80 │ 1.440 €
...
Summe Sondierung:                      │ 6.720 €

REGULARKONDITIONEN
Pos │ Einsatzgebiet    │ MG  │ JE      │ %  │ Betrag
B1  │ OV Musterstadt   │ 12  │ 1.440 € │ 60 │   864 €
B2  │ OV Neustadt      │  8  │   960 € │ 60 │   576 €
...
Summe Regular:                         │ 1.440 €

Zwischensumme:                         │ 8.160 €
Stornopuffer (10%):                    │  -816 €
Netto:                                 │ 7.344 €
USt (19%):                             │ 1.395 €
BRUTTO:                                │ 8.739 €
```

**Getrennt:** Mehrere Rechnungen (eine pro Einsatzgebiet)

**Buttons:** Zurück | Als Entwurf | Erstellen

### 16.6 Modal: Rechnung Details

**Kopfbereich:**
- Status (mit Dropdown zum Ändern)
- Kunde, Kampagne, Typ, Zeitraum, Vertrag

**Positionen:**
- Tabelle mit Einsatzgebieten + Sondierung/Regular
- Summen (Zwischensumme, Stornopuffer, Netto, USt, Brutto)

**Zahlungen:**
- Liste der erfassten Zahlungen
- Button "Zahlung erfassen"
- Offener Betrag

**Buttons:** PDF Download | E-Mail senden | Bearbeiten | Stornieren

### 16.7 Modal: Zahlung erfassen

- Rechnung (readonly)
- Offener Betrag (readonly)
- Betrag Brutto (Input + Button "Vollständig")
- Datum
- Notiz (optional)
- Vorschau: Netto/USt/Brutto Aufschlüsselung

### 16.8 Status-Workflow

```
entwurf → offen → geplant → bezahlt
                     ↓
                 storniert
```

| Status | Bedeutung |
|--------|-----------|
| entwurf | In Bearbeitung, bearbeitbar |
| offen | Freigegeben, Rechnungsnummer vergeben |
| geplant | Versand geplant/erfolgt |
| bezahlt | Vollständig bezahlt |
| storniert | Rechnung storniert |

### 16.9 Kundenprofil-Einstellung

Im Tab "Einstellungen" des Kundenprofils:

```
Rechnungsstellung:
○ Zusammen - Alle Werbegebiete auf einer Rechnung
● Getrennt - Pro Werbegebiet eine separate Rechnung
```

### 16.10 Toolbar (Shell)

| Position | Elemente |
|----------|----------|
| Links | Filter: Kunde, Kampagne, Jahr |
| Mitte | Suchfeld |
| Rechts | Export, + Neue Abrechnung |

### 16.11 Kundenprofil: Rechnungshistorie

Im Kundenprofil wird der Abschnitt "Rechnungen" als **read-only Liste** angezeigt:
- Zeigt alle Rechnungen des Kunden
- Link zur DRK Abrechnungsseite für Details/Bearbeitung
- Keine Erstellung möglich (nur über DRK Abrechnungsseite)

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

## Änderungshistorie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 20.01.2026 | Initiale Version |
| 1.1 | 20.01.2026 | Ergänzt: Datensatz-Typen (Erhöhungen), Rechnungsaufbau & Workflow, Sonderfälle, Zubuchungen, Einwohnerzahl-Speicherung |
| 1.2 | 20.01.2026 | Ergänzt: Rechnungsnummern-Format, PDF-Layout, Rechnungsstatus, Zahlungstracking, Rechnungsversand |
| 1.3 | 20.01.2026 | Ergänzt: Datenbank-Schema (invoice_payments, campaign_zubuchungen, customers/invoices Erweiterung), Sonderfälle 11.4-11.7 (Storno EA-VJ2, negative Beträge, 0€-Rechnung, manuelles Stornieren), Kunden-ID Generierung, Vertragsnummer, Stornopuffer individuell einstellbar, Schatzmeister Label |
| 1.4 | 20.01.2026 | Ergänzt: Sonderfälle 11.8-11.10 (Storno vor 1. Abrechnung, mehrfache Erhöhungen, Beitragssenkung), Qualitätsbonus Grenzfall-Klarstellung |
| 1.5 | 20.01.2026 | Ergänzt: Abschnitt 16 Frontend DRK Abrechnungsseite (Tabs, Modals, Rechnungserstellung, Zahlungserfassung, Status-Workflow, Kundenprofil-Einstellung Zusammen/Getrennt) |

---

*Erstellt: 20.01.2026*
*Aktualisiert: 20.01.2026*
*Version: 1.5*
