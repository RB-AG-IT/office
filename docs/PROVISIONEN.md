# Provisionsmodell - RB Inside Office

---

## Grundlagen

### Einheiten (EH)

| Begriff | Definition | Beispiel |
|---------|------------|----------|
| **Jahreseuros (JE)** | Jahresbeitrag eines Mitglieds | 120 € |
| **Einheit (EH)** | JE ÷ 12 | 120 JE = 10 EH |

> **Merke:** 1 EH = 1 € Monatsbeitrag-Äquivalent

### Auszahlungssystem

| Regel | Wert |
|-------|------|
| **Vorschuss** | 70% der Provision |
| **Stornorücklage** | 30% der Provision |
| **Auszahlung Vorschuss** | Wöchentlich (Montag) |
| **Freigabe Stornorücklage** | Nach 24 Monaten, quartalsweise |

---

## Vorschuss & Stornorücklage - Funktionsweise

### Prinzip

```
Werber schreibt: 100 EH
Faktor:          10 (Beispiel)
═════════════════════════════
Brutto-Provision: 100 × 10 = 1.000 EUR

Vorschuss (70%):      700 EUR → Auszahlung am Montag
Stornorücklage (30%): 300 EUR → Einbehalten
```

### Bei Storno

```
Ein Mitglied storniert: 10 EH
Provision verloren:     10 × 10 = 100 EUR

Abzug von Stornorücklage:
- Vorher: 300 EUR
- Abzug:  100 EUR
- Nachher: 200 EUR
```

### Freigabe der Stornorücklage

| Eigenschaft | Wert |
|-------------|------|
| **Zeitpunkt** | 24 Monate nach Ersterfassung |
| **Rhythmus** | Quartalsweise |
| **Berechnung** | Rücklage minus tatsächliche Stornos |

> **Beispiel:** Stornorücklage 300 EUR, 100 EUR Stornos → 200 EUR Auszahlung nach 24 Monaten

---

## 1. Eigene Provision (Werber-Faktor)

Basierend auf der Karrierestufe:

| Stufe | Name | Faktor |
|-------|------|--------|
| I | SMA (Studentische Mitarbeiter Aquise) | 5.0 |
| II | EMA (Erfahrene Mitarbeiter Aquise) | 5.5 |
| III | JMM (Junior Mitarbeiter Management) | 6.0 |
| IV | EMM (Erfahrene Mitarbeiter Management) | 6.5 |
| V | CEMM (Chef Erfahrene Mitarbeiter Management) | 6.75 |
| VI | SPB (Spitzen Botschafter) | 7.0 |
| VII | KAD (Kadermanager) | 7.5 |
| VIII | FUE (Führungsebene) | 8.0 |

**Berechnung:** `Eigene Netto-EH × Faktor`

**Beispiel Stufe III (JMM):**
```
Eigene Leistung: 150 EH
Faktor:          6.0
═════════════════════════
Brutto-Provision: 150 × 6.0 = 900 EUR
Vorschuss (70%):  630 EUR
Rücklage (30%):   270 EUR
```

---

## 2. Empfehlungs-/Recruiting-Provision

| Eigenschaft | Wert |
|-------------|------|
| **Faktor** | 0,5 |
| **Basis** | Alle Netto-EH des Empfohlenen |
| **Bedingung** | Empfohlener mind. 3 Wochen gearbeitet |
| **Wer kann empfehlen?** | Alle Stufen I-VII |
| **Für wen gibt es Provision?** | Alle Stufen I-VII |
| **Ausnahme KAD** | KAD (VII) kann empfehlen und erhält Provision |
| **Ausnahme FUE** | Führungsebene (VIII): KEINE Empfehlungsprovision |

**Berechnung:** `Netto-EH des Empfohlenen × 0,5`

> **Hinweis:** Wenn ein Empfohlener zur Führungsebene aufsteigt, endet die Empfehlungsprovision für den Empfehler.

---

## 3. Teamleiter-Provision

### Grundlagen

| Eigenschaft | Wert |
|-------------|------|
| **Berechtigung** | Ab Stufe IV (EMM) |
| **Zuweisung** | Pro Kampagne und KW durch Verwaltung |
| **Faktor** | 1,0 (fest) |
| **Basis** | Alle EH im Team |
| **Kann nicht gleichzeitig sein** | Quality Manager |

**Berechnung:** `Team-EH × Teamleiter-Faktor`

### Rollen-Vergabe Feature

Der Teamleiter kann seinen Faktor aufteilen und Rollen vergeben:

| Eigenschaft | Wert |
|-------------|------|
| **Deadline** | Sonntag 24:00 Uhr |
| **Wenn nicht vergeben** | Teamleiter erhält alles |
| **Beispiel-Rollen** | Mülldienst, Motivator, Küchendienst, etc. |

**Beispiel Aufteilung:**
```
Teamleiter behält: 0,8
Mülldienst:        0,1
Motivator:         0,1
═══════════════════════
Summe:             1,0
```

### Bedingung: Eigenleistung

> **WICHTIG:** Wenn EINE Person im Team unter 100 EH Eigenleistung hat, wird die Teamleiter-Provision für ALLE halbiert!

| Bedingung | Anforderung |
|-----------|-------------|
| Eigenleistung | mind. 100 EH pro Person pro Woche |

**Beispiel - Alle erfüllen Bedingung:**
```
Team produziert: 1000 EH
Verteilung: TL 0,8 / Müll 0,1 / Motivator 0,1

TL:        1000 × 0,8 = 800 EUR ✅
Müll:      1000 × 0,1 = 100 EUR ✅
Motivator: 1000 × 0,1 = 100 EUR ✅
```

**Beispiel - Motivator hat <100 EH (ALLE halbiert!):**
```
Team produziert: 1000 EH
Verteilung: TL 0,8 / Müll 0,1 / Motivator 0,1

TL:        1000 × 0,8 × 0,5 = 400 EUR ❌
Müll:      1000 × 0,1 × 0,5 = 50 EUR  ❌
Motivator: 1000 × 0,1 × 0,5 = 50 EUR  ❌
```

### Sichtbarkeit

| Wer | Sieht was |
|-----|-----------|
| **Teamleiter** | Alle TL-Provisions-Anteile im Team |
| **Andere** | Nur den eigenen Anteil (privat) |
| **Live-Anzeige** | Jeder sieht seinen Verdienst live basierend auf Team-EH |

---

## 4. Quality Manager Provision

| Eigenschaft | Wert |
|-------------|------|
| **Faktor** | 0,5 |
| **Basis** | Netto-EH im Team |
| **Zeitraum** | Pro Woche |
| **Kann nicht gleichzeitig sein** | Teamleiter |

### Bedingung

| Ziel | Wert |
|------|------|
| Durchschnitt EH p.P. | ≥ 50 EH pro Person pro Woche |

- **Wenn erreicht:** `Netto-EH im Team × 0,5`
- **Wenn nicht erreicht:** 0 €

---

## 5. DRK-Provision (Kundenkonditionen)

Die DRK-Provision wird **pro Werbegebiet** und **pro Kampagne** festgelegt.

### Konditionsarten

| Art | Beschreibung |
|-----|--------------|
| **Sondierung** | Erhöhte Provision für die ersten X Mitglieder |
| **Regular** | Normale Provision nach Sondierungsphase |

### Sondierungs-Berechnung

Zwei Varianten:

**A) Feste Anzahl Mitglieder:**
```
Sondierungskonditionen für: 50 Mitglieder
→ Die ersten 50 MG bekommen Sondierungsprozent
```

**B) Prozent der Bevölkerung:**
```
Bevölkerung im Werbegebiet: 11.250 Einwohner
Sondierung für:             0,3% der Bevölkerung
═══════════════════════════════════════════════
Berechnung: 11.250 × 0,003 = 33,75 → abgerundet: 33 MG
→ Die ersten 33 MG bekommen Sondierungsprozent
```

### Konditionen-Tabelle (5 Jahre)

| Jahr | Sondierung | Regular |
|------|------------|---------|
| 1 | __% | __% |
| 2 | __% | __% |
| 3 | __% | __% |
| 4 | __% | __% |
| 5 | __% | __% |

> Diese Werte werden pro Werbegebiet und Kampagne eingetragen.

### Qualitätsbonus (optional aktivierbar)

Zusätzliche Prozentpunkte bei niedriger Stornoquote:

| Stornoquote | Bonus |
|-------------|-------|
| unter 15% | +3 Prozentpunkte |
| unter 12% | +3 Prozentpunkte |
| unter 10% | +3 Prozentpunkte |
| unter 8% | +1 Prozentpunkt |

**Beispiel:**
```
Regular-Kondition: 10%
Stornoquote:       9% (unter 10%)
═══════════════════════════════
Effektive Kondition: 10% + 3% + 3% + 3% = 19%
```

---

## Provisions-Übersicht (Zusammenfassung)

### Werber-Provisionen (Faktor 9 Gesamtbudget)

| Provision | Faktor | Basis | Bedingung |
|-----------|--------|-------|-----------|
| Eigene | 5.0 - 8.0 | Eigene Netto-EH | Karrierestufe |
| Empfehlung | 0,5 | Netto-EH des Empfohlenen | 3 Wochen gearbeitet |
| Teamleiter | 1,0 | Team-EH | Ab Stufe IV, 100 EH Eigenleistung |
| Quality | 0,5 | Netto-EH im Team | Ø 50 EH p.P./Woche |

### DRK-Provision (Kunde)

| Provision | Basis | Festlegung |
|-----------|-------|------------|
| Sondierung | Prozent vom JE | Pro Werbegebiet/Kampagne |
| Regular | Prozent vom JE | Pro Werbegebiet/Kampagne |
| Qualitätsbonus | Zusatz-Prozente | Bei niedriger Stornoquote |

---

## Rechenbeispiel - Komplette Woche

```
WERBER (Stufe III - JMM, Faktor 6.0)
════════════════════════════════════
Eigene Leistung: 150 EH

Eigene Provision:     150 × 6.0 = 900 EUR
Empfehlungsprovision: 80 EH × 0.5 = 40 EUR (von empfohlenem Werber)
─────────────────────────────────────────
Gesamt:               940 EUR

Vorschuss (70%):      658 EUR → Auszahlung Montag
Stornorücklage (30%): 282 EUR → Einbehalten (24 Monate)


TEAMLEITER (Stufe IV - EMM)
═══════════════════════════
Team-Leistung: 800 EH
Eigenleistung: 120 EH (✅ über 100)
Rollen: TL 0.7, Müll 0.15, Motivator 0.15

TL-Provision:    800 × 0.7 = 560 EUR
Müll-Provision:  800 × 0.15 = 120 EUR
Moti-Provision:  800 × 0.15 = 120 EUR


DRK (Werbegebiet "Mitte")
═════════════════════════
Kampagne: Frühjahr 2024
Regular-Kondition: 12%
Qualitätsbonus: +6% (Stornoquote 11%)

Netto-JE der Woche: 5.000 EUR
DRK-Provision: 5.000 × 18% = 900 EUR
```

---

## Storno-Regeln

### 13-Monats-Regel

| Zeitraum | Auswirkung |
|----------|------------|
| Storno innerhalb 13 Monate | Zählt zur Stornoquote |
| Storno nach 13 Monaten | Zählt NICHT mehr |

### Stornoquoten (2 verschiedene!)

| Quote | Berechnung |
|-------|------------|
| **Stornoquote (Anzahl)** | Stornierte MG ÷ Brutto MG × 100% |
| **Stornoquote (Summe)** | Stornierte JE ÷ Brutto JE × 100% |

---

## Abrechnungs-Timeline

```
Woche 1 (Kampagne)
│
├─ Montag: Vorschuss-Auszahlung (70%)
├─ Stornorücklage wird einbehalten (30%)
│
... 24 Monate später ...
│
└─ Quartal X: Freigabe Stornorücklage (minus Stornos)
```

---

## TODO: Offene Punkte

- [ ] Sondervereinbarungen (Teilvergütung %-Anteil)
- [ ] Kleidungs-/Auto-Vereinbarungen und deren Verrechnung
- [ ] Rechnungsstellung-Intervall (wöchentlich vs. 2-wöchentlich)
- [ ] Detailregeln für Kampagnen-übergreifende Stornos

---

*Letzte Aktualisierung: November 2024*
