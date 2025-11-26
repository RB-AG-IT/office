# Kampagnen - RB Inside Office

---

## Übersicht

Das Kampagnen-Modul verwaltet Werbekampagnen mit Kalenderwochen-Planung und Mitarbeiter-Zuweisung.

### Hauptfunktionen

- Kampagnen erstellen und verwalten
- Werbegebiete zuweisen (mit Konditionen)
- Mitarbeiter pro Kalenderwoche einplanen
- Teamchef (TC) pro KW bestimmen

---

## Kampagnen-Struktur

### Grunddaten

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Name** | Kampagnenname | Frühjahrskampagne 2024 |
| **Startdatum** | Beginn der Kampagne | 01.03.2024 |
| **Enddatum** | Ende der Kampagne | 31.05.2024 |
| **Werbegebiet** | Referenz auf Werbegebiet | Ludwigshafen-Mitte |
| **Vertrag** | Ob Vertrag vorliegt | Ja/Nein |

### Werbegebiet-Referenz

> **Wichtig:** Kampagnen speichern keine eigenen Konditionen. Sie referenzieren ein Werbegebiet und erben dessen Konditionen automatisch.

Bei Änderung des Werbegebiets werden die Konditionen in der Kampagnenansicht aktualisiert angezeigt.

---

## KW-Planung (Kalenderwochen)

### Konzept

Jede Kampagne wird in Kalenderwochen unterteilt. Pro KW können Mitarbeiter und ein Teamchef zugewiesen werden.

```
Kampagne: Frühjahrskampagne 2024
├── KW 10 (04.03. - 10.03.)
│   ├── TC: Max Mustermann
│   └── Werber: [Anna, Peter, Lisa]
├── KW 11 (11.03. - 17.03.)
│   ├── TC: Max Mustermann
│   └── Werber: [Anna, Peter, Tim]
└── ...
```

### KW-Datumsbereich

Jede KW-Karte zeigt den Datumsbereich an (Montag - Sonntag):

```
KW 10: 04.03. - 10.03.2024
KW 11: 11.03. - 17.03.2024
```

---

## Teamchef (TC) pro KW

### Konzept

Jede Kalenderwoche hat einen eigenen Teamchef. Dies ermöglicht:

- Wechselnde Teamleitung pro Woche
- Flexiblere Einsatzplanung
- Klare Verantwortlichkeiten pro KW

### Anforderungen

| Regel | Beschreibung |
|-------|--------------|
| **Berechtigung** | Nur Mitarbeiter ab Stufe IV (EMM) |
| **Pflicht** | Jede KW sollte einen TC haben |
| **Warnung** | KW ohne TC wird visuell markiert |

### Visuelle Darstellung

| Zustand | Darstellung |
|---------|-------------|
| KW mit TC | Grüner/gelber Rahmen, TC-Badge |
| KW ohne TC | Roter Rahmen, Warnung |
| TC-Badge | Gelbes Tag mit "TC" Präfix |

```css
/* TC-Styling */
.employee-tag.teamchef {
    background: #f59e0b;  /* Gelb */
}
.employee-tag.teamchef::before {
    content: 'TC';
}
.kw-card.has-tc { border-color: #f59e0b; }
.kw-card.no-tc { border-color: red; }
```

---

## Datenstruktur

### Kampagne

```javascript
const campaign = {
    id: 1,
    name: 'Frühjahrskampagne 2024',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    areaIndex: 0,      // Referenz auf Werbegebiet
    hasContract: true,

    // KW-Zuweisungen
    assignments: {
        10: {
            teamchef: 1,           // Mitarbeiter-ID des TC
            werber: [2, 4, 6]      // Mitarbeiter-IDs der Werber
        },
        11: {
            teamchef: 1,
            werber: [2, 3, 5]
        },
        12: {
            teamchef: 3,
            werber: [1, 4, 6]
        }
    }
};
```

### KW-Assignment Objekt

```javascript
{
    teamchef: number | null,  // Mitarbeiter-ID oder null
    werber: number[]          // Array von Mitarbeiter-IDs
}
```

---

## UI-Elemente

### Kampagnen-Modal

| Bereich | Inhalt |
|---------|--------|
| **Header** | Kampagnenname, Datum |
| **Werbegebiet** | Dropdown + Konditions-Info |
| **KW-Bereich** | KW-Karten mit Zuweisungen |

### KW-Karte

```
┌─────────────────────────────────────┐
│ KW 10                04.03.-10.03.  │
├─────────────────────────────────────┤
│ Teamchef: [Dropdown TC auswählen]   │
├─────────────────────────────────────┤
│ [TC Max] [Anna] [Peter] [Lisa] [+]  │
└─────────────────────────────────────┘
```

### Mitarbeiter-Tags

| Typ | Farbe | Beschreibung |
|-----|-------|--------------|
| Normal | Blau | Regulärer Werber |
| Teamchef | Gelb | Aktueller TC der KW |

---

## Funktionen

### KW-Berechnung

```javascript
// Berechnet Datumsbereich für KW
function getKWDateRange(kw, year) {
    // Erster Januar des Jahres
    const jan1 = new Date(year, 0, 1);

    // Erster Montag der KW
    const firstMonday = ...

    // Sonntag der KW
    const sunday = ...

    return { monday, sunday };
}
```

### TC-Zuweisung

```javascript
function setTeamchefForKW(kw, teamchefId) {
    // TC in Assignments speichern
    campaign.assignments[kw].teamchef = teamchefId;

    // Visuellen Status aktualisieren
    updateKWCard(kw);
}
```

---

## Validierung

### Beim Speichern

| Prüfung | Aktion |
|---------|--------|
| KW ohne TC | Warnung anzeigen (kein Blockieren) |
| Kein Werbegebiet | Fehler, Speichern verhindern |
| Ungültige Daten | Fehler anzeigen |

### TC-Berechtigung

Nur Mitarbeiter ab Stufe IV (EMM) können als Teamchef eingesetzt werden. Das Dropdown filtert automatisch.

---

## Workflow

1. **Kampagne erstellen**
   - Name, Datum eingeben
   - Werbegebiet auswählen

2. **KW-Planung**
   - Mitarbeiter per Dropdown zu KW hinzufügen
   - TC pro KW festlegen

3. **Speichern**
   - Validierung prüfen
   - Daten speichern

---

## Zusammenspiel mit Provisionen

Die Kampagnen-Daten fließen in die Provisionsberechnung:

| Daten | Verwendung |
|-------|------------|
| **Werbegebiet** | Konditionen (Sondierung, Regular, Qualitätsbonus) |
| **TC pro KW** | Teamleiter-Provision für die Woche |
| **Werber pro KW** | Eigene Provision, Empfehlungsprovision |

Siehe [PROVISIONEN.md](PROVISIONEN.md) für Details.

---

## Verwandte Dokumentation

- [KUNDEN.md](KUNDEN.md) - Werbegebiete und Konditionen
- [PROVISIONEN.md](PROVISIONEN.md) - Provisionsmodell
- [SYSTEM.md](SYSTEM.md) - Systemübersicht

---

*Letzte Aktualisierung: November 2024*
