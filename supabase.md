# Supabase Dokumentation

## Allgemein / Workflow

Datensätze kommen aus dem Formular oder einem Import in die Datenbank.

**Neue Datensätze** sind immer zugeordnet zu:
- Kunde
- Einsatzgebiet
- Kampagne
- Botschafter

**Bestehende Datensätze** können nur einem Kunden oder Einsatzgebiet zugeordnet sein (ohne Kampagne).

### Filterung & Auswertung

Die Datensätze werden gefiltert und ausgewertet nach:
- Botschafter
- Kampagne
- Kunde
- Einsatzgebiet
- Zeitraum

Daraus werden Quoten und Statistiken erstellt.

---

## Datensatz-Typen

**Fördermitglieder** - können sein:
- Bestandsmitglieder
- Neumitglieder / Erhöhung

**Status:**
- Aktiv
- Passiv (Storno)
