# RB Inside Office - Systemübersicht

---

## Über das System

RB Inside Office ist ein umfassendes Verwaltungssystem für ein Direktmarketing-Unternehmen. Es verwaltet Mitarbeiter, Kunden, Kampagnen, Provisionen und mehr.

---

## Module

### Dashboard (dashboard.html)
Zentrale Übersichtsseite mit:
- **Statistik-Karten:** Aktive Mitarbeiter, Neue Mitglieder (KW), EH, Provisionen, Stornoquote
- **Aktive Kampagnen:** Fortschrittsbalken mit MG-Zielen
- **Letzte Aktivitäten:** Feed mit Schrieben, Aufstiegen, TC-Ernennungen
- **Top Performer:** Wöchentliches Leaderboard (Gold/Silber/Bronze)
- **Auffälligkeiten-Preview:** Schnellansicht der wichtigsten Alerts
- **Schnellzugriff:** Buttons für häufige Aktionen

### Auffälligkeiten (auffaelligkeiten/)
Automatische Erkennung von Qualitätsproblemen und besonderen Ereignissen:

**Quality-Warnungen:**
- Stornoquote über 8%, 10%, 12%, 15%
- Visuelle Schwellenwert-Anzeige
- Auswirkung auf Qualitätsbonus

**Hohe Schriebe:**
- Schriebe ab 360 JE
- JE und EH-Wert, Mitgliedsdaten

**Anomalien:**
- Ungewöhnliche Leistungssteigerungen (+300% etc.)
- Starke Leistungsabfälle
- Tag-zu-Tag und Wochendurchschnitt-Vergleich

**Features:**
- Filter-Tabs (Alle/Quality/Schriebe/Anomalien)
- Status-Indikatoren (Neu/In Prüfung/Geprüft)
- Export-Funktion

### Mitarbeiter (mitarbeiter.html)
Vollständige Mitarbeiterverwaltung:
- Persönliche Daten
- Karrierestufen (I-VIII)
- Badges und Achievements
- Empfehlungen/Recruiting
- Profilbilder

### Mitarbeiter-Profil (mitarbeiter/profil.html)
Detailliertes Profil-Formular mit:

**Karrierestufen-Verwaltung:**
- Separater "Karrierestufe speichern" Button für direkte Speicherung
- KW-basierter Gültigkeitszeitraum (Von - Bis)
- **KW-Überlappungs-Prüfung:** Warnung wenn neue Stufe bestehende Einträge überlappt
  - Zeigt vorhandene Rolle, Faktor und KW-Zeitraum
  - Neue Stufe überschreibt überlappende Zeiträume automatisch
- Karriere-Historie mit allen vergangenen Stufen

**Provisions-Einstellungen:**
- Individueller Faktor (überschreibt Karriere-Faktor für Zeitraum)
- Vorschuss/Stornorücklage Aufteilung
- USt-Pflichtig Toggle

**Sichtbarkeit & Ranking:** *(NEU)*
- **Ghost-Modus:** Mitarbeiter ist für andere unsichtbar (nur Office/Admins sehen)
  - Sub-Option: Ob der Ghost-Mitarbeiter andere Mitarbeiter sehen darf
- **Ranking-Teilnahme:** An/Aus für Base-Leaderboard
  - Wenn deaktiviert, erscheint Mitarbeiter nicht im öffentlichen Ranking

**Preisvorlagen (ab EMM):** *(NEU)*
- Gesperrte Sektion für niedrigere Stufen (SMA, EMA, JMM)
- Ab EMM (Stufe IV) freigeschaltet
- Individuelle Preisvorlagen für Formulare
- Überschreibt Firmen-Standard bei der Mitglieder-Erfassung

**Dokumentation:** [KARRIERE.md](KARRIERE.md)

### Kunden (kunden/)
Kundenverwaltung mit Werbegebieten:
- Übersicht aller Kunden mit KV/OV Abkürzungen (`kunden/index.html`)
- Einzelkunde mit Werbegebieten (`kunden/kunde.html`)
- Werbegebiete werden in der Detailseite bearbeitet (klickbar)
- Fallback-System: Ansprechpartner, Website, Datenschutz vom Kunden wenn leer

**Dokumentation:** [KUNDEN.md](KUNDEN.md)

### Kampagnen (kampagnen.html)
Kampagnenplanung und -verwaltung:
- Kampagnen erstellen/bearbeiten
- KW-basierte Mitarbeiterzuweisung
- Teamchef (TC) pro Kalenderwoche
- Werbegebiet-Referenzierung

**Dokumentation:** [KAMPAGNEN.md](KAMPAGNEN.md)

### Provisionen
Komplettes Provisionsmodell:
- Eigene Provision (Karrierefaktor)
- Empfehlungsprovision (0,5)
- Teamleiter-Provision (1,0 mit Rollenverteilung)
- Quality Manager Provision (0,5)
- DRK-Provision (Kundenkonditionen)

**Dokumentation:** [PROVISIONEN.md](PROVISIONEN.md)

### Stufen & Achievements (stufen/)
Übersicht aller Karrierestufen:
- Visuelles Karriere-Leiter Design (FUE → SMA)
- Klappbare Anforderungen-Panels pro Stufe
- Anforderungen in Kategorien sortiert:
  - 📊 Wochenleistung (EH, MG, ERH pro Woche)
  - ✈️ Einmalig (Empfehlungen mit Anreise-Bestätigung)
  - Stornoquote-Limits
  - Sammel-Anforderungen (JE-Schriebe kumulativ)
- Bearbeitbare Anforderungen (Hinzufügen/Löschen)

### Datensätze (datensaetze/)
Verwaltung von Mitgliedsdatensätzen:
- Erfassung neuer Mitglieder
- Statusverfolgung (offen, bestätigt, storniert)
- EH-Berechnung

### Statistik (statistik/)
Auswertungen und Berichte:
- Mitarbeiter-Performance
- Kampagnen-Erfolge
- Stornoquoten
- Team-Statistiken

### Vorlagen (vorlagen/)
Verwaltung von Preis- und E-Mail-Vorlagen:

**Haupt-Tabs:**
1. **Preisvorlagen** *(NEU)*
2. **E-Mails**

---

#### Tab: Preisvorlagen *(NEU)*
Firmenweite Preisvorlagen für Rhodenburg:

- **Standard-Preisvorlage:** Basis für alle Formulare (nicht löschbar)
  - Monatlich: 5€ / 7€ / 10€ / 15€ / 20€
  - Jährlich: 60€ / 84€ / 120€
  - Einmalig: 50€ / 100€ / 200€
- **Premium-Preisvorlage:** Höhere Beiträge
- Neue Preisvorlagen erstellen
- Bearbeiten und Löschen (außer Standard)

---

#### Tab: E-Mails
E-Mail-Template-Verwaltung:

**Automatische Vorlagen:**
- Willkommensmail (nach NMG-Formular)
- Erhöhungsmail (nach ERH)
- IBAN-Nachtragen

**Manuelle Vorlagen:**
- Storno-Bestätigung
- Erneut versenden

**Newsletter:**
- Standard-Newsletter
- Saisonale Grüße

**Individuelle Vorlagen (ab Stufe III):**
- Persönliche E-Mail-Vorlagen erstellen
- Nur für JMM und höher freigeschaltet
- Erstellen, Bearbeiten, Löschen eigener Vorlagen

**Features:**
- Platzhalter-System ({vorname}, {nachname}, etc.)
- Live-Vorschau
- Test-Mail versenden

### Abrechnungen (abrechnungen/)
Finanzverwaltung:
- Wöchentliche Abrechnungen
- Vorschuss-Berechnungen
- Stornorücklagen
- Freigabe nach 24 Monaten

---

## Architektur

### Frontend
- Reines HTML/CSS/JavaScript
- Keine Build-Tools erforderlich
- Responsive Design
- Dark/Light Theme Support

### Backend (geplant)
- Supabase als Backend-as-a-Service
- PostgreSQL Datenbank
- Row Level Security (RLS)
- Real-time Subscriptions

### Datenfluss

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Mitarbeiter │────▶│  Kampagnen  │────▶│ Provisionen │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │            ┌──────┴──────┐             │
       │            ▼             ▼             │
       │     ┌───────────┐ ┌───────────┐       │
       │     │   Kunden  │ │    KW     │       │
       │     └───────────┘ └───────────┘       │
       │            │                          │
       │            ▼                          │
       │     ┌───────────┐                     │
       └────▶│ Datensätze│─────────────────────┘
             └───────────┘
```

---

## Kernkonzepte

### Einheiten (EH)
- **Jahreseuros (JE):** Jahresbeitrag eines Mitglieds
- **Einheit (EH):** JE ÷ 12
- **Beispiel:** 120 JE = 10 EH

### Karrierestufen

| Stufe | Code | Faktor |
|-------|------|--------|
| I | SMA | 5.0 |
| II | EMA | 5.5 |
| III | JMM | 6.0 |
| IV | EMM | 6.5 |
| V | CEMM | 6.75 |
| VI | SPB | 7.0 |
| VII | KAD | 7.5 |
| VIII | FUE | 8.0 |

### Stornoquote
- Berechnung innerhalb 13 Monaten
- Beeinflusst Qualitätsbonus
- Zwei Varianten: Anzahl und Summe

---

## Navigation (Sidebar)

```
├── Dashboard
├── Kampagnen
├── Auffälligkeiten
├── Mitarbeiter
│   └── [Profil mit KW-Karrierestufen]
├── Stufen & Achievements  ← NEU
├── Datensätze
├── Statistik
├── Kunden
│   └── [Einzelkunde]
├── Abrechnungen
├── Vorlagen
└── Einstellungen
```

---

## Badges-System

### Karriere-Badges
Visuelle Anzeige der Karrierestufe mit Sternen.

### Achievement-Badges
Spezielle Leistungen werden als Badges angezeigt:
- EH-Rekorde
- Mitglieder-Rekorde
- Spezielle Schriebe

### Konditions-Badges
Werbegebiete zeigen Konditions-Status:
- S: X% (Sondierung)
- R: X% (Regular)
- QB (Qualitätsbonus)
- TV X% (Teilvergütung)

---

## Berechtigungen

| Stufe | TC möglich | QM möglich | Ind. Vorlagen | Preisvorlagen | Provisionen |
|-------|------------|------------|---------------|---------------|-------------|
| I-II | Nein | Nein | Nein | Nein | Eigene + Empfehlung |
| III | Nein | Nein | **Ja** | Nein | Eigene + Empfehlung |
| IV-V | Ja | Nein | Ja | **Ja** | + Teamleiter |
| VI-VII | Ja | Ja | Ja | Ja | + Quality Manager |
| VIII | Nein | Nein | Ja | Ja | Nur Eigene |

> **Individuelle Vorlagen:** Ab Stufe III (JMM) können Mitarbeiter eigene E-Mail-Vorlagen erstellen.

> **Preisvorlagen:** Ab Stufe IV (EMM) können Mitarbeiter individuelle Preisvorlagen im Profil verwenden.

---

## UI-Konventionen

### Info-Icons (ℹ️)
Überall wo komplexe Geschäftsregeln gelten, gibt es Info-Icons mit Tooltips.

### Modale Dialoge
Erstellen/Bearbeiten erfolgt in modalen Dialogen mit Tabs für komplexe Formulare.

### Tags/Badges
Farbcodierte Tags zeigen Status und Kategorien an.

### Validierung
Eingaben werden validiert, Warnungen werden angezeigt aber blockieren nicht immer.

### Toast-Benachrichtigungen
Statt Browser-Alerts werden schöne Toast-Meldungen angezeigt:
- Erscheinen rechts oben
- Auto-Entfernung nach 4 Sekunden
- Typen: success (grün), error (rot), warning (gelb), info (blau)

### Confirm-Dialoge
Statt Browser-Confirm werden modale Dialoge verwendet:
- Async/Await kompatibel (`const confirmed = await showConfirm(...)`)
- Optionaler Titel und Typ
- Abbrechen/Bestätigen Buttons

---

## Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [SYSTEM.md](SYSTEM.md) | Diese Übersicht |
| [KARRIERE.md](KARRIERE.md) | Karrierestufen und Aufstiegsanforderungen |
| [PROVISIONEN.md](PROVISIONEN.md) | Vollständiges Provisionsmodell |
| [KUNDEN.md](KUNDEN.md) | Kundenmanagement und Werbegebiete |
| [KAMPAGNEN.md](KAMPAGNEN.md) | Kampagnenplanung mit KW und TC |

---

## Technische Details

### Datei-Struktur

```
office/
├── index.html              # Haupt-Navigation (Sidebar + iFrame)
├── dashboard.html          # Dashboard-Übersicht
├── mitarbeiter.html        # Mitarbeiter-Verwaltung
├── kampagnen.html          # Kampagnen-Planung
├── auffaelligkeiten/
│   └── index.html          # Auffälligkeiten (Quality, Schriebe, Anomalien)
├── mitarbeiter/
│   └── profil.html         # Mitarbeiter-Profil (Karrierestufen, KW-Speicherung)
├── stufen/
│   └── index.html          # Stufen & Achievements (Karriere-Leiter)
├── kunden/
│   ├── index.html          # Kunden-Übersicht
│   └── kunde.html          # Einzelkunde mit Werbegebieten
├── datensaetze/
│   └── index.html          # Datensatz-Verwaltung
├── statistik/
│   └── index.html          # Auswertungen
├── vorlagen/
│   └── index.html          # Template-Verwaltung (inkl. Individuell ab Stufe III)
├── abrechnungen/
│   └── index.html          # Finanzverwaltung
├── styles.css              # Globale Styles
└── docs/
    ├── SYSTEM.md           # Diese Datei
    ├── KARRIERE.md
    ├── PROVISIONEN.md
    ├── KUNDEN.md
    └── KAMPAGNEN.md
```

---

## TODO: Geplante Features

- [ ] Supabase-Integration
- [ ] Echtzeit-Synchronisation
- [ ] Mobile App
- [ ] Push-Benachrichtigungen
- [ ] Offline-Modus
- [ ] Export-Funktionen (PDF, Excel)
- [ ] Automatische Abrechnungsgenerierung

---

*Letzte Aktualisierung: November 2025*

---

## Changelog

### November 2025 (2)
- **Ghost-Modus:** Mitarbeiter können als "Ghost" markiert werden (nur Office sichtbar)
- **Andere sehen:** Option ob Ghost-Mitarbeiter andere sehen darf
- **Ranking-Teilnahme:** An/Aus für Base-Leaderboard
- **Preisvorlagen im Profil:** Ab EMM freigeschaltet, für individuelle Formular-Preise
- **Vorlagen-Seite:** Neue Haupt-Tabs für Preisvorlagen und E-Mails
- **Stufen-Page:** Gesamtzahlen bei Sammlungen entfernt (redundant mit Wochenleistung)
- **EMM:** 10 ERH statt 5 ERH in einer Woche als Anforderung

### November 2025 (1)
- Karrierestufen-Speicherung mit KW-Überlappungsprüfung
- Neue Aufstiegsanforderungen (JE statt EH)
