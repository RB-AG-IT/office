# Kampagnen - RB Inside Office

---

## Übersicht

Das Kampagnen-Modul verwaltet Werbekampagnen mit:
- Kalenderwochen-Planung (KW) und Mitarbeiter-Zuweisung
- **Einsatzgebiete** mit eigenen Konditionen pro Kampagne
- Abrechnungs-Einstellungen (Puffer, Wartezeit)
- Übersichts- und Bearbeitungs-Ansicht

---

## Zwei-Ansichten-Konzept

### 1. Übersichts-Ansicht (View)

Beim Klick auf eine Kampagne öffnet sich zuerst die **Übersicht** (read-only):

```
┌─────────────────────────────────────────────────────────┐
│ Frühjahrs-Kampagne 2025                    [Bearbeiten] │
│ Aktiv | KW 10-15                                        │
├─────────────────────────────────────────────────────────┤
│ ALLGEMEINE INFORMATIONEN                                │
│ Kunde: DRK Ludwigshafen                                 │
│ Zeitraum: 03.03. - 13.04.2025                           │
│ Puffer: 10%  |  Wartezeit: 4 Wochen                     │
├─────────────────────────────────────────────────────────┤
│ MITARBEITER-EINSATZ                                     │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐              │
│ │KW10│ │KW11│ │KW12│ │KW13│ │KW14│ │KW15│              │
│ │5 P.│ │4 P.│ │6 P.│ │5 P.│ │4 P.│ │3 P.│              │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘              │
├─────────────────────────────────────────────────────────┤
│ EINSATZGEBIETE & KONDITIONEN (lila Box)                 │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Ludwigshafen-Mitte e.V.                   [67059] │   │
│ │ Bevölkerung: 150.000 | Sondierung: 100 MG         │   │
│ │ Qualitätsbonus aktiv | Teilvergütung: 80%         │   │
│ │                                                   │   │
│ │ Sondierungskonditionen:                           │   │
│ │ [J1: 80%] [J2: 50%] [J3: 20%] [J4: 10%] [J5: 5%]  │   │
│ │                                                   │   │
│ │ Reguläre Konditionen:                             │   │
│ │ [J1: 65%] [J2: 40%] [J3: 15%] [J4: 8%] [J5: 4%]   │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2. Bearbeitungs-Ansicht (Edit)

Klick auf **"Bearbeiten"** öffnet das vollständige Formular mit allen Eingabefeldern.

---

## Kampagnen-Struktur

### Grunddaten

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Name** | Kampagnenname | Frühjahrskampagne 2025 |
| **Von KW** | Start-Kalenderwoche | 10 |
| **Bis KW** | End-Kalenderwoche | 15 |
| **Kunde** | Referenz auf Kunde | DRK Ludwigshafen |

### Abrechnungs-Einstellungen

| Feld | Beschreibung | Standard |
|------|--------------|----------|
| **Puffer %** | Einbehaltene % pro Wochenauszahlung | 10% |
| **Wartezeit** | Wochen bis Endabrechnung | 4 Wochen |

> Diese Werte können pro Kampagne individuell angepasst werden. Siehe [PROVISIONEN.md](PROVISIONEN.md) für Details zum DRK-Abrechnungssystem.

---

## Einsatzgebiete & Konditionen

### Konzept

> **WICHTIG:** Konditionen werden **pro Einsatzgebiet innerhalb einer Kampagne** festgelegt, NICHT mehr am Werbegebiet!

Eine Kampagne kann mehrere Einsatzgebiete haben. Jedes Einsatzgebiet hat:

```
Kampagne: Frühjahrs-Kampagne 2025
├── Einsatzgebiet 1: Ludwigshafen-Mitte
│   ├── Werbegebiet: LU-Mitte e.V.
│   ├── Vertrag: Rahmenvertrag 2024
│   ├── Sondierungslimit: 100 MG (oder 0.5% Bevölkerung)
│   ├── Sondierungskonditionen: 80/50/20/10/5%
│   ├── Reguläre Konditionen: 65/40/15/8/4%
│   ├── Qualitätsbonus: AN
│   └── Teilvergütung: 80%
│
└── Einsatzgebiet 2: Ludwigshafen-Süd
    ├── Werbegebiet: LU-Süd e.V.
    ├── Vertrag: ...
    └── (eigene Konditionen)
```

### Konditionen-Felder pro Einsatzgebiet

| Kategorie | Felder |
|-----------|--------|
| **Bevölkerung** | Anzahl Einwohner im Gebiet |
| **Sondierungslimit** | Anzahl MG ODER % der Bevölkerung |
| **Sondierungskonditionen** | Jahr 1-5 (% vom Jahresbeitrag) |
| **Reguläre Konditionen** | Jahr 1-5 (% vom Jahresbeitrag) |
| **Qualitätsbonus** | AN/AUS + Staffelung |
| **Teilvergütung** | AN/AUS + Prozentsatz |

---

## Kampagnen-Karten

### Einheitliches Design

Die Kampagnen-Karten sehen auf beiden Seiten (Kampagnen & Kunde) gleich aus:

```
┌─────────────────────────────────────────────┐
│ Frühjahrskampagne 2025              [Aktiv] │
│ 03.03. - 13.04.2025 (KW 10-15)              │
├─────────────────────────────────────────────┤
│ Kunde: DRK Ludwigshafen                     │
│ Einsatzgebiet: Ludwigshafen-Mitte           │
│ Puffer: 10%                                 │
├─────────────────────────────────────────────┤
│ [✓ Vertrag] [Konditionen]                   │
│                                             │
│ Aktuelle & Nächste KW                       │
│ [KW10: 5P.] [KW11: 4P.]                     │
└─────────────────────────────────────────────┘
```

### Badges

| Badge | Farbe | Bedeutung |
|-------|-------|-----------|
| **Vertrag** (grün) | `#dcfce7` | Vertrag vorhanden |
| **Kein Vertrag** (gelb) | `#fef3c7` | Vertrag fehlt |
| **Konditionen** (lila) | `#f3e8ff` | Konditionen gesetzt |
| **Keine Kond.** (rot) | `#fef2f2` | Konditionen fehlen |

---

## Navigation: Kunde → Kampagne

### Flow

1. Benutzer ist auf **Kunde** Seite (im iframe)
2. Klickt auf eine Kampagnen-Karte
3. **Parent-Window** navigiert zu Kampagnen-Modul
4. Sidebar aktualisiert sich (zeigt "Kampagnen" als aktiv)
5. Kampagnen-Übersicht öffnet sich automatisch

### Technische Umsetzung

```javascript
// In kunde.html
function openCampaignInKampagnen(campaignId) {
    // Speichere ID in sessionStorage
    sessionStorage.setItem('viewCampaignId', campaignId);
    // Navigiere Parent-Window
    window.parent.location.hash = 'campaigns';
    window.parent.loadPage('campaigns');
}

// In kampagnen.html
const viewId = sessionStorage.getItem('viewCampaignId');
if (viewId) {
    sessionStorage.removeItem('viewCampaignId');
    viewCampaign(parseInt(viewId));
}
```

---

## KW-Planung (Kalenderwochen)

### Konzept

Jede Kampagne wird in Kalenderwochen unterteilt. Pro KW können Mitarbeiter und ein Teamchef zugewiesen werden.

### KW-Blöcke in Übersicht

Vertikale Blöcke mit:
- KW-Nummer oben
- Personenzahl unten

```
┌────┐ ┌────┐ ┌────┐
│KW10│ │KW11│ │KW12│
│5 P.│ │4 P.│ │6 P.│
└────┘ └────┘ └────┘
```

### Teamchef (TC) pro KW

| Regel | Beschreibung |
|-------|--------------|
| **Berechtigung** | Nur Mitarbeiter ab Stufe IV (EMM) |
| **Pflicht** | Jede KW sollte einen TC haben |
| **Warnung** | KW ohne TC wird visuell markiert |

---

## Datenstruktur

### Kampagne

```javascript
const campaign = {
    id: 1,
    name: 'Frühjahrs-Kampagne 2025',
    kwFrom: 10,
    kwTo: 15,
    customer: 'DRK Ludwigshafen',
    area: 'Ludwigshafen-Mitte',

    // Abrechnungs-Einstellungen
    pufferPercent: 10,
    wartezeitWochen: 4,

    // Einsatzgebiete mit Konditionen
    einsatzgebiete: [
        {
            werbegebietId: 'lu-mitte',
            vertragId: 'rv-2024-001',
            population: 150000,
            sondierungslimit: 100,
            sondierung: [80, 50, 20, 10, 5],
            regular: [65, 40, 15, 8, 4],
            qualityBonus: true,
            stornoRules: [...],
            teilvergutung: true,
            teilvergutungPercent: 80
        }
    ],

    // KW-Zuweisungen
    assignments: {
        10: { teamchef: 1, werber: [2, 4, 6] },
        11: { teamchef: 1, werber: [2, 3, 5] },
        // ...
    }
};
```

---

## Zusammenspiel mit anderen Modulen

| Modul | Verbindung |
|-------|------------|
| **Kunden** | Kampagnen werden beim Kunden angezeigt (nur lesen) |
| **Provisionen** | Konditionen fließen in Provisionsberechnung |
| **Mitarbeiter** | Werden pro KW zugewiesen |
| **Abrechnungen** | Puffer & Wartezeit steuern Auszahlungszeitpunkte |

---

## Verwandte Dokumentation

- [KUNDEN.md](KUNDEN.md) - Kunden & Werbegebiete (ohne Konditionen)
- [PROVISIONEN.md](PROVISIONEN.md) - Provisionsmodell & DRK-Abrechnung
- [SYSTEM.md](SYSTEM.md) - Systemübersicht

---

*Letzte Aktualisierung: November 2025*
