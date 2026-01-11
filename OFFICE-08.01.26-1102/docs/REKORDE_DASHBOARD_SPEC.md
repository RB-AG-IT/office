# Rekorde & Dashboard Spezifikation

## Dashboard Tabs (6 Tabs)
1. **Allgemein** - Zusammenfassung aller anderen Tabs
2. Werben
3. Teamleitung
4. Empfehlung
5. Recruiting
6. Quality

Jeder Tab zeigt das gleiche Dashboard-Layout mit Adaptionen + nur die entsprechenden Rekorde unten.

---

## Dashboard-Elemente (pro Tab)

### Oberer Bereich
- Zurück-Button
- Name des Mitarbeiters (groß)
- Zeitraum-Auswahl

### Karten/Badges
- MG Gesamt (Anzahl, JE, EH, Storno)
- NMG (Anzahl, JE, EH, Storno)
- ERH (Anzahl, JE, EH, Storno)
- Stornoquote
- Ø Alter NMG
- Beitragsschnitt
- ERH-Schnitt

### Charts
- Wochen-Chart (Mo-So): Linien + Balken für MG/JE/EH
- Frequenz-Donut: Monatlich/Quartärlich/Halbjährlich/Jährlich
- Altersverteilung: Histogramm

### Weitere Metriken
- % mit Telefonnummer
- % mit Email
- MG Tagesdurchschnitt

### Info-Icons (i)
- Tooltips zur Erklärung bei allen Metriken
- Erscheinen bei HOVER (nicht Klick)

---

## REKORDE

### Filter
- Standard: Pro Jahr
- Option: Gesamt (All-Time)
- Immer mit Datum angezeigt

### "Allgemein" Rekorde (Streaks etc.)
- Werden in JEDEM Tab ganz unten angezeigt

---

### WERBEN
*Jeweils pro Tag UND pro Woche:*
- Meiste MG
- Meiste NMG
- Meiste ERH
- Meiste JE (EH in Klammern)

### ALLGEMEIN
- Höchster Schrieb (einzelner Beitrag)
- Höchste Erhöhung (einzelne ERH)
- Längste stündliche Streak (xx Stunden) - jede Stunde eine Person
- Längste 15-Minuten Streak (xx Zyklen) - alle 15 Min ein Mitglied
- Längste 30-Minuten Streak (xx Zyklen) - alle 30 Min ein Mitglied

### TEAMCHEF / TEAMLEITUNG

#### Team-Rekorde
*Jeweils pro Tag, pro Woche, im Einsatzteam, Durchschnitt pro Person:*
- Meiste MG
- Meiste NMG
- Meiste ERH
- Meiste JE (EH)

#### Pro Teamleitung (KW am Stück)
- Meiste Wochen am Stück
- Größte Teamgröße
- Höchste Effizienz: % Mitglieder vs. Bevölkerung im Einsatzgebiet

#### Eigenleistung als Teamleiter
- Meiste MG
- Meiste NMG
- Meiste ERH
- Meiste JE (EH)

### RECRUITING
*Jeweils einer Empfehlung in einer Woche:*
- Meiste MG
- Meiste NMG
- Meiste ERH
- Meiste JE (EH)

*Empfehlungen (Anreisen):*
- Meiste pro Monat
- Meiste pro Quartal

### EMPFEHLUNGEN
(Identisch zu Recruiting, aber mit Empfehlungs-Beschriftung)

---

### QUALITY
*Quality = Qualitätssicherungs-Rolle vor Ort (wie Teamleiter-Status)*
*Ziel: Niedrige Stornoquote gewährleisten, Team-Performance sichern*

**Relevante Metriken:**
- Stornoquote in der Woche (wo Quality anwesend)
- Ø Tagesleistung pro Person im Team
- Ø Beitrag pro MG (zu hoch = stornoanfällig)

**Rekorde:**
- Niedrigste Stornoquote in einer Woche (als Quality)
- Höchste Ø Tagesleistung pro Person
- Optimaler Ø Beitrag pro MG
- Meiste Wochen Quality am Stück

---

## Tab-spezifische Anpassungen

### Tab: Allgemein
- Zusammenfassung aller anderen Tabs
- Alle Rekorde-Kategorien anzeigen

### Tab: Werben
- Standard-Dashboard
- Rekorde: Werben + Allgemein (unten)

### Tab: Teamleitung
- Dashboard zeigt Team-Daten für gewählten Zeitraum
- Falls kein Teamleiter: Tab leer / "Keine Daten"
- Rekorde: Teamchef/Teamleitung + Allgemein (unten)

### Tab: Empfehlung
- Dashboard zeigt Durchschnittswerte aller Empfehlungen
- Rekorde: Empfehlungen + Allgemein (unten)

### Tab: Recruiting
- Dashboard zeigt Durchschnittswerte aller Recruitments
- Rekorde: Recruiting + Allgemein (unten)

### Tab: Quality
- Dashboard zeigt Zeiträume wo man Quality war
- Team-Performance während dieser Zeiträume
- Stornoquoten, Ø Tagesleistung, Ø Beitrag pro MG
- Falls nie Quality: Tab leer / "Keine Daten"
- Rekorde: Quality + Allgemein (unten)

---

## Design
- Achievement-Felder für jeden Rekord
- Übersichtliche Abschnitte
- Kleine Datums-Anzeige bei jedem Rekord
- Info-Icons (i) mit Erklärungen
- Visuell getrennte Bereiche
