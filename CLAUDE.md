# Allgemeine Regeln

- Immer 1x nachfragen vor Beginn/Ausführung (auch wenn Auftrag sicher ist)
- Immer genau und nur das Gefragte tun
- Kurz und knappe Kommunikation

## Git Workflow

Nach jeder Änderung: `git add` → `git commit` → `git push`

## Technik

- Frontend: Website
- Backend: Supabase
- Supabase Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwNzYxNSwiZXhwIjoyMDc5MzgzNjE1fQ.54kSk9ZSUdQt6LKYWkblqgR6Sjev80W80qkNHYEbPgk

### Supabase Daten laden
**WICHTIG:** Vor dem Laden von Daten aus Supabase immer zuerst prüfen:
1. Welche Spalten existieren in der Tabelle?
2. Wie heißen die Felder genau?

Prüfen via curl:
```bash
curl -s "https://lgztglycqtiwcmiydxnm.supabase.co/rest/v1/TABELLE?select=*&limit=1" -H "apikey: [KEY]"
```

## Projekt Struktur

- Kunden (zur Zuordnung)
- Botschafter (Mitarbeiter mit eigenem Login)
- Datensätze: Neumitglieder, Erhöhung, Neutrag
- Datensatz-Status: Aktiv / Storno (passiv)

## Styles

- Zentrales System für: Schriftklassen, Farben, Buttons, Layout
- Eigene Funktionen pro Unterseite erstellen
- Für Layout/wiederkehrende Elemente immer Klassen aus Styles verwenden
- Bei neuen Objekten: Nachfragen

---

# Bereichs-Dokumentation

## Abrechnungen

### Übersicht
- Fällige Provision (automatisch berechnet über zentral gespeicherte Vergütungen pro Botschafter oder Werbegebiet)
- Offene Provision

### Erstellung
- Abrechnungen per Serienbrief
- Pro Kunde / Werbegebiet / Botschafter oder mehrere
- Individuelle Optionen bei der Abrechnung

### Tracking
- Welche Rechnung wurde gezahlt
- Welche Rechnung ist noch offen

### Provisionsanzeige
- Für die vereinbarten Vergütungsjahre

---

## Benutzer

### Allgemein
- Speicherung der Benutzer
- Verlinkung zum jeweiligen persönlichen Dashboard

### Botschafterprofil
- Persönliche Daten
- Verträge
- Provision
- Alle persönlichen Einstellungen

### Kundenprofil
- Kundendaten
- Zugehörige Werbegebiete (Ortsvereine oder ggf. Kreisverbände)
- Verträge
- Einstellungen für den Kunden

---

## Kampagnen

### Funktionen
- Erstellen und Bearbeiten von Kampagnen
- Mitarbeiterzuordnung

### Übersicht
- Teammitglieder
- Teamchef
- Quality

### Provisionsbestimmung
- Einstellungen pro Werbegebiet für diese Kampagne

### Verträge
- Zuordnung der Verträge pro Werbegebiet

---

**HINWEIS:** Supabase-Key zum Ende des Projekts entfernen!
