# Kunden - RB Inside Office

---

## Übersicht

Das Kunden-Modul verwaltet DRK-Kunden (z.B. Kreisverbände) mit ihren Werbegebieten und den zugehörigen Konditionen.

### Hierarchie

```
Kunde (z.B. DRK KV Ludwigshafen e.V.)
├── Werbegebiet 1 (z.B. Ludwigshafen-Mitte)
│   ├── Stammdaten
│   └── Konditionen
├── Werbegebiet 2 (z.B. Ludwigshafen-Süd)
│   ├── Stammdaten
│   └── Konditionen
└── Kampagnen (referenzieren Werbegebiete)
```

---

## Werbegebiete

### Stammdaten

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Name** | Eindeutiger Name des Gebiets | Ludwigshafen-Mitte e.V. |
| **Straße** | Adresse des Standorts | Musterstraße 123 |
| **PLZ** | Postleitzahl | 67063 |
| **Stadt** | Ort | Ludwigshafen |
| **Gruppenfoto** | URL zum Foto | https://... |
| **Website** | Webseite des Ortsverbands | https://... |
| **Datenschutzinfo** | Link zur Datenschutzerklärung | https://... |
| **Ansprechpartner** | Name des Kontakts | Herr Müller |
| **E-Mail** | Kontakt-Email | mueller@drk.de |
| **Telefon** | Telefonnummer | 0621 123456 |

---

## Konditionen (pro Werbegebiet)

> **Wichtig:** Konditionen werden zentral im Werbegebiet gepflegt. Kampagnen referenzieren das Werbegebiet und erben dessen Konditionen automatisch.

### Bevölkerung & Sondierungslimit

| Feld | Beschreibung |
|------|--------------|
| **Bevölkerung** | Einwohnerzahl im Werbegebiet |
| **Sondierungslimit** | Art der Sondierungsberechnung |

**Zwei Varianten für Sondierungslimit:**

| Variante | Beschreibung | Beispiel |
|----------|--------------|----------|
| **Feste Anzahl** | Sondierung für X Mitglieder direkt | 50 Mitglieder |
| **Prozent** | Sondierung für X% der Bevölkerung | 0.15% von 85.000 = 127 MG |

### Provisionsstaffel (5 Jahre)

Beide Staffeln (Sondierung & Regular) werden für 5 Jahre definiert:

| Jahr | Sondierung (%) | Regular (%) |
|------|----------------|-------------|
| 1 | z.B. 5.0% | z.B. 3.0% |
| 2 | z.B. 4.5% | z.B. 2.8% |
| 3 | z.B. 4.0% | z.B. 2.5% |
| 4 | z.B. 3.5% | z.B. 2.3% |
| 5 | z.B. 3.0% | z.B. 2.0% |

**Berechnung:** `Mitglieds-JE × Prozentsatz = DRK-Provision`

### Qualitätsbonus

Aktivierbar pro Werbegebiet. Zusätzliche Prozentpunkte bei niedriger Stornoquote:

| Stornoquote | Bonus | Erklärung |
|-------------|-------|-----------|
| < 15% | +3 PP | 3 Prozentpunkte Aufschlag |
| < 12% | +3 PP | weitere 3 Prozentpunkte |
| < 10% | +3 PP | weitere 3 Prozentpunkte |
| < 8% | +1 PP | weiterer 1 Prozentpunkt |

**Beispiel:**
```
Regular-Kondition: 10%
Stornoquote:       9% (< 10%)
═══════════════════════════════
Bonus: 3% + 3% + 3% = 9%
Effektive Kondition: 10% + 9% = 19%
```

### Storno-Regeln

Konfigurierbare Stornobedingungen:

| Feld | Beschreibung |
|------|--------------|
| **Storno-Schwellenwert** | Ab welcher Quote der Bonus gilt |
| **Bonus-Betrag** | Höhe des Bonus in Prozentpunkten |

### Teilvergütung

Für spezielle Vereinbarungen:

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Aktiviert** | Ob Teilvergütung gilt | Ja/Nein |
| **Prozentsatz** | Anteil der Vergütung | 80% |

### Sondervereinbarungen

Freitextfeld für besondere Absprachen mit dem Kunden.

---

## Datenstruktur (JavaScript)

```javascript
// Werbegebiet mit Konditionen
const area = {
    // Stammdaten
    name: 'Ludwigshafen-Mitte e.V.',
    street: 'Musterstraße 123',
    zip: '67063',
    city: 'Ludwigshafen',
    groupPhoto: '',
    website: '',
    privacyPolicy: '',
    contact: 'Herr Müller',
    email: 'mueller@drk.de',
    phone: '0621 123456',

    // Konditionen
    population: 85000,
    sondLimitType: 'percent',  // 'percent' oder 'members'
    sondMembersDirect: null,    // Bei 'members': Anzahl
    sondMembersPercent: 0.15,   // Bei 'percent': %-Wert

    // Provisionsstaffel (5 Jahre)
    sondierung: [5, 4.5, 4, 3.5, 3],     // Sondierungs-Prozentsätze
    regular: [3, 2.8, 2.5, 2.3, 2],      // Regular-Prozentsätze

    // Qualitätsbonus
    qualityBonus: true,
    stornoRules: [
        { threshold: 15, bonus: 3 },
        { threshold: 12, bonus: 3 },
        { threshold: 10, bonus: 3 },
        { threshold: 8, bonus: 1 }
    ],

    // Teilvergütung
    partialPayment: false,
    partialPaymentPercent: null,

    // Sondervereinbarungen
    specialAgreements: ''
};
```

---

## UI-Elemente

### Werbegebiet-Modal (2 Tabs)

| Tab | Inhalt |
|-----|--------|
| **Stammdaten** | Alle Adress- und Kontaktfelder |
| **Konditionen** | Alle Provisions- und Stornoregelungen |

### Konditions-Badges

Werbegebiete zeigen Badges an, die den Konditionsstatus anzeigen:

| Badge | Bedeutung |
|-------|-----------|
| `S: 5%` | Sondierungs-Prozentsatz Jahr 1 |
| `R: 3%` | Regular-Prozentsatz Jahr 1 |
| `QB` | Qualitätsbonus aktiviert |
| `TV 80%` | Teilvergütung mit 80% |

### Info-Icons (ℹ️)

Tooltips erklären Geschäftsregeln direkt im UI:

- **Bevölkerung:** "Die Einwohnerzahl des Werbegebiets dient zur Berechnung des Sondierungslimits in Prozent."
- **Sondierungslimit:** Erklärt die beiden Varianten (feste Anzahl vs. Prozent)
- **Qualitätsbonus:** Erklärt die Storno-basierte Bonusberechnung

---

## Kampagnen-Referenz

Kampagnen referenzieren das Werbegebiet über `areaIndex`:

```javascript
const campaign = {
    id: 1,
    name: 'Frühjahrskampagne 2024',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    areaIndex: 0,     // Index des Werbegebiets
    hasContract: true
};
```

In der Kampagnen-Ansicht werden die Konditionen des referenzierten Werbegebiets angezeigt.

---

## Verwandte Dokumentation

- [PROVISIONEN.md](PROVISIONEN.md) - Vollständiges Provisionsmodell
- [KAMPAGNEN.md](KAMPAGNEN.md) - Kampagnenplanung mit KW-Zuweisung
- [SYSTEM.md](SYSTEM.md) - Systemübersicht

---

*Letzte Aktualisierung: November 2024*
