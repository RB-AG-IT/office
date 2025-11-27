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
├── Auffälligkeiten    ← NEU
├── Mitarbeiter
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

| Stufe | TC möglich | QM möglich | Ind. Vorlagen | Provisionen |
|-------|------------|------------|---------------|-------------|
| I-II | Nein | Nein | Nein | Eigene + Empfehlung |
| III | Nein | Nein | **Ja** | Eigene + Empfehlung |
| IV-V | Ja | Nein | Ja | + Teamleiter |
| VI-VII | Ja | Ja | Ja | + Quality Manager |
| VIII | Nein | Nein | Ja | Nur Eigene |

> **Individuelle Vorlagen:** Ab Stufe III (JMM) können Mitarbeiter eigene E-Mail-Vorlagen erstellen.

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

*Letzte Aktualisierung: November 2025 - Toast/Confirm System, Fallback-System für Werbegebiete*
