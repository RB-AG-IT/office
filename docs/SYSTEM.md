# RB Inside Office - Systemübersicht

---

## Über das System

RB Inside Office ist ein umfassendes Verwaltungssystem für ein Direktmarketing-Unternehmen. Es verwaltet Mitarbeiter, Kunden, Kampagnen, Provisionen und mehr.

---

## Module

### Dashboard (index.html)
Startseite mit Übersicht aller wichtigen Kennzahlen und schnellem Zugriff auf alle Module.

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
- Übersicht aller Kunden (`kunden/index.html`)
- Einzelkunde mit Werbegebieten (`kunden/kunde.html`)
- Konditionen pro Werbegebiet
- Kampagnen-Referenzen

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
Template-Verwaltung:
- Dokumentvorlagen
- E-Mail-Templates
- Vertragsvorlagen

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
├── Mitarbeiter
├── Kunden
│   └── [Einzelkunde]
├── Kampagnen
├── Provisionen
├── Datensätze
├── Statistik
├── Vorlagen
├── Abrechnungen
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

| Stufe | TC möglich | QM möglich | Provisionen |
|-------|------------|------------|-------------|
| I-III | Nein | Nein | Eigene + Empfehlung |
| IV-V | Ja | Nein | + Teamleiter |
| VI-VII | Ja | Ja | + Quality Manager |
| VIII | Nein | Nein | Nur Eigene |

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
├── index.html              # Dashboard
├── mitarbeiter.html        # Mitarbeiter-Verwaltung
├── kampagnen.html          # Kampagnen-Planung
├── kunden/
│   ├── index.html          # Kunden-Übersicht
│   └── kunde.html          # Einzelkunde mit Werbegebieten
├── datensaetze/
│   └── index.html          # Datensatz-Verwaltung
├── statistik/
│   └── index.html          # Auswertungen
├── vorlagen/
│   └── index.html          # Template-Verwaltung
├── abrechnungen/
│   └── index.html          # Finanzverwaltung
├── css/
│   └── ...                 # Stylesheets
├── js/
│   └── ...                 # JavaScript-Module
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

*Letzte Aktualisierung: November 2024*
