# Kunden - RB Inside Office

---

## Übersicht

Das Kunden-Modul verwaltet DRK-Kunden (z.B. Kreisverbände) mit ihren Werbegebieten.

> **WICHTIG:** Kampagnen werden **nur im Kampagnen-Modul** angelegt. Bei Kunde werden Kampagnen nur **angezeigt**, in denen dieser Kunde beteiligt ist.

### Hierarchie

```
Kunde (z.B. DRK KV Ludwigshafen e.V.)
├── Stammdaten (Ansprechpartner, Website, etc.)
├── Werbegebiet 1 (z.B. Ludwigshafen-Mitte)
│   └── Stammdaten + optionaler Ansprechpartner
├── Werbegebiet 2 (z.B. Ludwigshafen-Süd)
│   └── Stammdaten + optionaler Ansprechpartner
└── Kampagnen (nur Anzeige! Werden im Kampagnen-Modul angelegt)
```

---

## Kampagnen bei Kunde

Kampagnen werden **nicht** bei Kunde angelegt, sondern nur **angezeigt**.

| Aktion | Ort |
|--------|-----|
| **Kampagne anlegen** | Kampagnen-Modul (`/kampagnen.html`) |
| **Kampagne anzeigen** | Kunde-Seite (gefiltert nach Kunde) |
| **Kampagne bearbeiten** | Kampagnen-Modul |

> **Grund:** Konditionen gehören zur Kombination **Kampagne + Einsatzgebiet**, nicht zum Kunden oder Werbegebiet.

---

## Werbegebiete

### Stammdaten

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Name** | Eindeutiger Name des Gebiets | Ludwigshafen-Mitte e.V. |
| **Straße** | Adresse des Standorts | Musterstraße 123 |
| **PLZ** | Postleitzahl | 67063 |
| **Stadt** | Ort | Ludwigshafen |
| **Gruppenfoto** | Foto des Ortsvereins | (Upload) |
| **Website** | Webseite des Ortsverbands | https://... |
| **Datenschutzinfo** | Link zur Datenschutzerklärung | https://... |
| **Ansprechpartner** | Name des Kontakts (optional) | Herr Müller |
| **E-Mail** | Kontakt-Email (optional) | mueller@drk.de |
| **Telefon** | Telefonnummer (optional) | 0621 123456 |

---

## Ansprechpartner - Fallback-Mechanismus

Für die Willkommensmail an neue Fördermitglieder wird ein Ansprechpartner benötigt.

### Hierarchie (Fallback)

```
1. Ansprechpartner im Werbegebiet (falls vorhanden)
   ↓ Falls leer:
2. Ansprechpartner beim Kunden (übergeordnet)
```

### Beispiel

| Ebene | Ansprechpartner | E-Mail | Verwendet? |
|-------|-----------------|--------|------------|
| **Kunde** | Frau Schmidt | schmidt@drk.de | Fallback |
| **Werbegebiet Mitte** | Herr Müller | mueller@drk.de | ✅ Wird verwendet |
| **Werbegebiet Süd** | (leer) | (leer) | ❌ Fallback auf Kunde |

> **Für Werbegebiet Süd** wird automatisch Frau Schmidt als Ansprechpartner verwendet.

---

## Konditionen (NEU: pro Kampagne/Einsatzgebiet)

> **WICHTIG:** Konditionen werden **nicht mehr** im Werbegebiet gepflegt, sondern **pro Einsatzgebiet in der Kampagne**.

### Warum?

Ein Werbegebiet kann **mehrere Kampagnen/Durchläufe** haben mit **unterschiedlichen Konditionen** je Durchlauf.

### Beispiel

| Kampagne | Werbegebiet | Konditionen Jahr 1 |
|----------|-------------|-------------------|
| **Frühjahr 2024** | LU-Mitte | 80% |
| **Herbst 2024** | LU-Mitte | 85% (bessere Konditionen ausgehandelt) |

→ Die Konditionen werden beim Anlegen/Bearbeiten der **Kampagne** im **Kampagnen-Modul** festgelegt.

Siehe [PROVISIONEN.md](PROVISIONEN.md) für Details zu den Konditionen.

---

## Datenstruktur (JavaScript)

```javascript
// Kunde
const customer = {
    id: 1,
    name: 'DRK Kreisverband Ludwigshafen',
    type: 'kreisverband',

    // Ansprechpartner (übergeordnet - Fallback)
    contactPerson: 'Frau Schmidt',
    contactEmail: 'schmidt@drk-ludwigshafen.de',
    contactPhone: '+49 621 57000',

    // Links
    website: 'https://www.drk-ludwigshafen.de',
    privacyPolicy: 'https://www.drk-ludwigshafen.de/datenschutz',

    // Werbegebiete
    areas: [...]
};

// Werbegebiet (nur Stammdaten, keine Konditionen!)
const area = {
    name: 'Ludwigshafen-Mitte e.V.',
    street: 'Musterstraße 123',
    zip: '67063',
    city: 'Ludwigshafen',
    groupPhoto: '',
    website: '',           // Falls leer → Kunde-Website verwenden
    privacyPolicy: '',     // Falls leer → Kunde-Datenschutz verwenden

    // Ansprechpartner (optional - Fallback auf Kunde)
    contact: 'Herr Müller',
    email: 'mueller@drk-mitte.de',
    phone: '0621 11111'
};
```

---

## UI-Elemente

### Werbegebiet-Modal (1 Tab)

| Tab | Inhalt |
|-----|--------|
| **Stammdaten** | Adresse, Kontaktdaten, Links, Ansprechpartner |

> **Hinweis:** Der Konditionen-Tab wurde entfernt. Konditionen werden im Kampagnen-Modul festgelegt.

### Info-Icons

| Icon | Bedeutung |
|------|-----------|
| 📍 | Adresse hinterlegt |
| 📷 | Gruppenbild vorhanden |
| 👤 | Ansprechpartner hinterlegt |
| 🔗 | Eigene Links (Website/Datenschutz) |

### Kampagnen-Anzeige bei Kunde

- Nur Kampagnen anzeigen, in denen dieser Kunde beteiligt ist
- Kein "Neue Kampagne anlegen" Button
- Link zum Kampagnen-Modul für Neuanlage

---

## Verwandte Dokumentation

- [PROVISIONEN.md](PROVISIONEN.md) - Konditionen und Abrechnungs-Timeline
- [KAMPAGNEN.md](KAMPAGNEN.md) - Kampagnenplanung mit Einsatzgebieten und Konditionen
- [SYSTEM.md](SYSTEM.md) - Systemübersicht

---

*Letzte Aktualisierung: November 2024 - Konditionen zu Kampagne verschoben, Ansprechpartner-Fallback dokumentiert*
