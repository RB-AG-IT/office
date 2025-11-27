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
| **Vorschuss** | 70% der Provision (Standard) |
| **Stornorücklage** | 30% der Provision (Standard) |
| **Auszahlung Vorschuss** | Wöchentlich (Montag) |
| **Freigabe Stornorücklage** | Nach 24 Monaten, quartalsweise |
| **Individuell anpassbar** | Ja, pro Werber im Profil einstellbar |

> **WICHTIG:** Die Aufteilung 70%/30% ist der Standard, kann aber pro Werber individuell angepasst werden. Diese Einstellung befindet sich im Werber-Profil unter "Provisions- und Abrechnungsmodalitäten".

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
| **Rhythmus** | Quartalsweise, zum Anfang des nächsten Quartals |
| **Berechnung** | Rücklage minus tatsächliche Stornos |
| **Verrechnungszeitraum** | Immer nur 1 Jahr (4 Quartale) pro Abrechnung |

#### Feste Regel: 2-Jahre + Quartalsanfang

Die Stornorücklage wird **exakt 2 Jahre** nach dem Ursprungsquartal zum **Anfang des nächsten Quartals** ausgeschüttet:

| Ursprungs-Quartal | Ausschüttung |
|-------------------|--------------|
| Q1 2020 (Jan-Mär) | Anfang Q2 2022 (April) |
| Q2 2020 (Apr-Jun) | Anfang Q3 2022 (Juli) |
| Q3 2020 (Jul-Sep) | Anfang Q4 2022 (Oktober) |
| Q4 2020 (Okt-Dez) | Anfang Q1 2023 (Januar) |

#### Quartalsgetrennte Verrechnung

> **WICHTIG:** Stornierungen werden **quartalsgetrennt** zugeordnet und verrechnet!

**Beispiel:**
```
Mitglied wird im Q2 2022 storniert
→ Abzug erfolgt von der Stornorücklage Q2 2022
→ Ausschüttung dieser Rücklage: Anfang Q3 2024
```

Die Verrechnung erfolgt **nur für Stornos bis zum Zeitpunkt der Stornorücklagen-Abrechnung**.

> **Beispiel:** Stornorücklage 300 EUR, 100 EUR Stornos → 200 EUR Auszahlung nach 24 Monaten

#### Einfrieren nach Stornoabrechnung

> **WICHTIG:** Sobald eine Stornoabrechnung für einen Zeitraum erfolgt ist, ist dieser Zeitraum **eingefroren** - keine weitere Verrechnung möglich!

| Regel | Beschreibung |
|-------|--------------|
| **Abschluss** | Mit der Stornoabrechnung ist das Quartal abgeschlossen |
| **Stornos danach** | Können noch eingetragen werden, aber sind für die Abrechnung irrelevant |
| **Keine Rückwirkung** | Nachträgliche Stornos haben keinen Einfluss auf bereits abgerechnete Zeiträume |

**Beispiel:**
```
Q1 2020 Rücklage:         500 EUR
Q2 2022: Stornoabrechnung erfolgt
         Stornos bis dahin: 120 EUR
         → Auszahlung:      380 EUR
         → Q1 2020 ist ERLEDIGT

Später eingetragene Stornos für Q1 2020:
→ Werden gespeichert (Dokumentation)
→ Aber KEINE Verrechnung mehr!
```

#### Kaskadenlogik bei unzureichender Rücklage

Wenn die Stornorücklage eines Quartals nicht ausreicht, greift folgende Kaskade:

```
┌─────────────────────────────────────────────────────────────┐
│ Stornos anfallen                                            │
│        ↓                                                    │
│ Rücklage des Quartals reicht aus?                          │
│        ├── JA → Von Rücklage abziehen ✓                    │
│        │                                                    │
│        └── NEIN ↓                                          │
│                                                             │
│ Nächstes verfügbares Quartal heranziehen                   │
│        ↓                                                    │
│ Immer noch nicht ausreichend?                              │
│        ├── JA → Weiteres Quartal heranziehen               │
│        │                                                    │
│        └── KEINE Rücklage mehr vorhanden?                  │
│                   ↓                                         │
│ ⚠️ VOM VORSCHUSS ABZIEHEN!                                  │
└─────────────────────────────────────────────────────────────┘
```

| Schritt | Aktion |
|---------|--------|
| 1 | Stornos vom aktuellen Quartal abziehen |
| 2 | Bei Überschreitung: Nächstes Quartal verwenden |
| 3 | Bei völliger Erschöpfung: **Vom Vorschuss abziehen** |

> **KRITISCH:** Wenn keine Stornorücklage mehr vorhanden ist, muss die Provision direkt vom Vorschuss abgezogen werden!

#### Frühwarnung bei geringer Stornorücklage

> **Auffälligkeiten-Panel:** Sobald die Stornorücklage sehr gering wird (weil zu viele Stornos reinkommen), wird automatisch eine **Warnung im System** angezeigt.

| Schwellenwert | Warnstufe | Aktion |
|---------------|-----------|--------|
| < 30% der ursprünglichen Rücklage | ⚠️ Warnung | Gelbe Markierung im Auffälligkeiten-Panel |
| < 15% der ursprünglichen Rücklage | 🔴 Kritisch | Rote Markierung + Benachrichtigung |
| 0% (aufgebraucht) | ❌ Erschöpft | Vorschuss-Abzug wird aktiviert |

---

## 1. Eigene Provision (Werber-Faktor)

Basierend auf der Karrierestufe:

| Stufe | Kürzel | Name | Faktor |
|-------|--------|------|--------|
| I | SMA | Starting Marketing Advisor | 5.0 |
| II | EMA | Executive Marketing Advisor | 5.5 |
| III | JMM | Junior Marketing Manager | 6.0 |
| IV | EMM | Executive Marketing Manager | 6.5 |
| V | CEMM | Chief Executive Marketing Manager | 6.75 |
| VI | SPB | Spitzen Botschafter | 7.0 |
| VII | KAD | Kadermanager | 7.5 |
| VIII | FUE | Führungsebene | 8.0 |

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

### Erhöhungs-Provision (Beitragserhöhung)

Bei Beitragserhöhungen zählt **die Differenz** zwischen altem und neuem Beitrag als Basis.

**Berechnung:**
```
1. Differenz in JE berechnen: Neuer Beitrag - Alter Beitrag
2. Differenz in EH umrechnen: Differenz JE ÷ 12
3. Provision berechnen: Differenz EH × Faktor
4. Aufteilung: 70% Vorschuss / 30% Rücklage (oder individuell)
```

**Beispiel Erhöhung:**
```
Alter Beitrag:   84 JE (Jahresbeitrag)
Neuer Beitrag:  120 JE
═══════════════════════════════════════
Differenz:       36 JE
Einheiten:       36 ÷ 12 = 3 EH

Faktor (z.B. Stufe III): 6.0
Provision:       3 EH × 6.0 = 18 EUR

Aufteilung (Standard 70/30):
- Vorschuss:  12,60 EUR
- Rücklage:    5,40 EUR

Oder individuell (z.B. 80/20):
- Vorschuss:  14,40 EUR
- Rücklage:    3,60 EUR
```

> **WICHTIG:** Die Erhöhungs-Provision wird genauso behandelt wie eine Neuanwerbung - mit voller Stornorücklage-Haltedauer von 24 Monaten.

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

Die DRK-Provision wird **pro Kampagne und Einsatzgebiet** festgelegt.

> **WICHTIG:** Konditionen gehören zur Kombination **Kampagne + Einsatzgebiet**, NICHT zum Werbegebiet allein. Grund: Ein Werbegebiet kann mehrere Kampagnen/Durchläufe haben mit unterschiedlichen Konditionen je Durchlauf.

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

## Abrechnungs-Timeline (Werber-Provision)

> **TODO:** Details noch zu besprechen!

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

| Phase | Zeitpunkt | Aktion |
|-------|-----------|--------|
| **Vorschuss** | Montag nach der Woche | 70% Auszahlung |
| **Rücklage** | Sofort | 30% einbehalten |
| **Freigabe** | Nach 24 Monaten | Quartalsweise, minus Stornos |

> **Hinweis:** Dies ist die Abrechnung **RB → Werber**. Nicht verwechseln mit DRK-Abrechnung!

---

## Abrechnungs-Timeline (DRK-Abrechnung)

### Übersicht - Beispiel Kampagne KW 1-6

```
KW 1    KW 2    KW 3    KW 4    KW 5    KW 6    │ +4 Wo  │        +12 Mo         │  +12 Mo  │  +12 Mo
  ↓       ↓       ↓       ↓       ↓       ↓     │        │                       │          │
 AR1     AR2     AR3     AR4     AR5     AR6    │  END   │    ZWEITJAHRESRATE    │  J3-Rate │  J4-Rate
(90%)   (90%)   (90%)   (90%)   (90%)   (90%)   │        │    + Qualitätsbonus   │          │
                                                │        │                       │          │
                                                └────────┴───────────────────────┴──────────┴──────────→
```

### Phase 1: Wöchentliche Abrechnungen

| Eigenschaft | Wert |
|-------------|------|
| **Anzahl** | Eine pro Kampagnenwoche |
| **Zeitpunkt** | Jeweils nach einer Woche |
| **Fälliger Betrag** | 90% der Rechnungssumme (Standard) |
| **Puffer** | 10% werden einbehalten (Standard) |
| **Puffer individuell** | Pro Kampagne einstellbar! |

> **Beispiel:** Kampagne KW 1-6 → 6 wöchentliche Abrechnungen à 90%

### Phase 2: Endabrechnung

| Eigenschaft | Wert |
|-------------|------|
| **Zeitpunkt** | X Wochen nach Kampagnenende (Standard: 4 Wochen) |
| **Wartezeit individuell** | Pro Kampagne einstellbar! |
| **Inhalt** | Verrechnung aller bisherigen Stornos |
| **Puffer** | Auszahlung/Verrechnung der einbehaltenen 10% |

> **WICHTIG:** Zeitpunkt der Endabrechnung merken! Ab diesem Datum beginnt der 12-Monats-Zyklus für alle Folgejahre.

### Phase 3: Zweitjahresrate (12 Monate nach Endabrechnung)

| Eigenschaft | Wert |
|-------------|------|
| **Zeitpunkt** | Exakt 12 Monate nach Endabrechnung |
| **Inhalt** | Abrechnung Jahr 2 Konditionen |
| **Feststellung** | Stornoquote wird ermittelt |
| **Qualitätsbonus** | Wird berechnet und angewendet |

### Phase 4+: Folgejahre

- Jedes Jahr exakt **12 Monate nach der vorherigen Rate**
- Abrechnung der jeweiligen Jahres-Kondition
- Qualitätsbonus gilt weiterhin

---

## Qualitätsbonus - Berechnung & Anwendung

### Feststellung (bei Zweitjahresrate)

Nach 12 Monaten wird die Stornoquote der Kampagne festgestellt:

| Stornoquote | Bonus |
|-------------|-------|
| unter 15% | +3 PP |
| unter 12% | +3 PP |
| unter 10% | +3 PP |
| unter 8% | +1 PP |

> **PP = Prozentpunkte** auf die Jahres-Konditionen

### Anwendung des Qualitätsbonus

**Beispiel:** Kampagne hat nach 12 Monaten nur **5% Stornos**
→ Unter 15%, 12%, 10%, 8% = **+3 +3 +3 +1 = +10 PP**

| Jahr | Original-Kondition | Mit Qualitätsbonus |
|------|--------------------|--------------------|
| Jahr 1 | 80% | **90%** |
| Jahr 2 | 50% | **60%** |
| Jahr 3 | 30% | **40%** |
| Jahr 4 | 20% | **30%** |
| Jahr 5 | 10% | **20%** |

**Wichtig:** Der Qualitätsbonus wird auf die **Zweitjahresrate rückwirkend für Jahr 1 + Jahr 2** angewendet und gilt dann für alle Folgejahre.

---

## Teilvergütung - AN vs. AUS

### Was ist Teilvergütung?

Regelt, was passiert wenn ein Mitglied **vor Ablauf von 12 Monaten storniert**.

### Teilvergütung AUS (Standard)

| Situation | Vergütung |
|-----------|-----------|
| Mitglied bleibt 12+ Monate | ✅ Volle Vergütung |
| Mitglied storniert vorher | ❌ Zählt als Storno, wird vollständig verrechnet |

> **Alles-oder-Nichts-Prinzip:** Nur Mitglieder, die nach 12 Monaten (nach Endabrechnungszeitraum) noch vorhanden sind, werden vergütet.

### Teilvergütung AN (mit %-Satz)

| Situation | Vergütung |
|-----------|-----------|
| Mitglied bleibt 12+ Monate | ✅ Volle Vergütung |
| Mitglied storniert vorher | ✅ Anteilige Vergütung |

**Berechnung bei Storno:**
```
Gezahlte Monate nach Aufnahmedatum × Teilvergütungs-Prozentsatz
```

**Beispiel:**
```
Mitglied spendet: 10 EUR/Monat
Storniert nach:   3 Monaten
DRK hat erhalten: 30 EUR

Teilvergütung:    50%
═══════════════════════════
Vergütung:        30 EUR × 50% = 15 EUR
```

---

## Kampagnen-Einstellungen (NEU)

Folgende Felder müssen **pro Kampagne** einstellbar sein:

| Feld | Standard | Beschreibung |
|------|----------|--------------|
| **Abrechnungs-Puffer %** | 10% | Prozent der wöchentlichen Rechnung, die einbehalten wird |
| **Wartezeit Endabrechnung** | 4 Wochen | Wochen nach Kampagnenende bis zur Endabrechnung |

---

## Konditionen pro Einsatzgebiet (NEU)

Beim Erstellen/Bearbeiten einer Kampagne müssen **pro Einsatzgebiet** folgende Konditionen festgelegt werden:

| Konditions-Feld | Beschreibung |
|-----------------|--------------|
| **Bevölkerung** | Anzahl Einwohner im Gebiet |
| **Sondierungslimit** | Anzahl MG oder % der Bevölkerung |
| **Sondierungskonditionen** | Jahr 1-5 (% vom Jahresbeitrag) |
| **Reguläre Konditionen** | Jahr 1-5 (% vom Jahresbeitrag) |
| **Qualitätsbonus** | AN/AUS + Storno-Regeln |
| **Teilvergütung** | AN/AUS + %-Satz |
| **Vertrag** | Zugeordneter Rahmenvertrag |

> **Grund:** Ein Werbegebiet kann in mehreren Kampagnen mit unterschiedlichen Konditionen vorkommen.

---

## Abrechnungs-Verwaltung

### Mitarbeiter-Profil: Provisions- und Abrechnungsmodalitäten

Im Mitarbeiter-Profil (`/mitarbeiter/profil.html`) gibt es einen eigenen Bereich "Provisions- und Abrechnungsmodalitäten":

#### Karrierestufe mit Faktor und Benefits

| Element | Beschreibung |
|---------|--------------|
| **Karrierestufe** | Dropdown zur Auswahl (JMM, SMM, SPB, KAD, FUE) |
| **Gültig ab KW** | Kalenderwoche ab der die Änderung gilt (vor/zurück navigierbar) |
| **Faktor-Anzeige** | Zeigt automatisch den Faktor der gewählten Stufe |
| **Benefits** | Pill-Badges mit den Vorteilen der Stufe |

> **WICHTIG:** Änderungen der Karrierestufe wirken sich immer pro **kompletter Kalenderwoche** aus. Bei rückwirkenden Änderungen werden die Provisionen neu berechnet.

**Faktoren pro Stufe:**
| Stufe | Kürzel | Name | Faktor | Sterne | Farbe | Benefits |
|-------|--------|------|--------|--------|-------|----------|
| I | SMA | Starting Marketing Advisor | 5.0 | 1 | Grau (#78909C) | Einstieg ins Team, Grundprovision, Schulungszugang |
| II | EMA | Executive Marketing Advisor | 5.5 | 2 | Grün (#4CAF50) | Erhöhte Provision, Bonus-Berechtigung, Erweiterte Schulungen |
| III | JMM | Junior Marketing Manager | 6.0 | 3 | Blau (#2196F3) | Factor 6.0, Team-Events Zugang, Mentoring-Programm |
| IV | EMM | Executive Marketing Manager | 6.5 | 4 | Lila (#9C27B0) | Factor 6.5, Leadership-Training, Bonus-Pool Zugang |
| V | CEMM | Chief Executive Marketing Manager | 6.75 | 5 | Pink (#E040FB) | Factor 6.75, Premium Events, Karriere-Coaching |
| VI | SPB | Spitzen Botschafter | 7.0 | 6 | Orange (#FFA500) | Factor 7.0, VIP Status, Exklusive Boni, Reise-Incentives |
| VII | KAD | Kadermanager | 7.5 | 7 | Gold (#FFD700) | Factor 7.5, Team-Provision, Management-Boni, Premium Support |
| VIII | FUE | Führungsebene | 8.0 | 8 | Slate (#2C3E50) | Factor 8.0 MAX, Unternehmens-Beteiligung, Unbegrenzte Boni, Elite Status |
| - | ADM | Administrator | 8.0 | - | - | Volle System-Rechte, Alle Bereiche, Verwaltungs-Zugang |

> **Visuelle Darstellung:** Jede Stufe hat eine eigene Farbe und Anzahl Sterne. Ab EMM (Stufe IV) gibt es einen "Glow"-Effekt (leuchtende Umrandung), der mit jeder Stufe stärker wird.

#### Zusatz-Rollen (Berechtigungen)

Im Provisions-Bereich können zusätzliche Rollen vergeben werden, die weitere Berechtigungen und Provisionsansprüche ermöglichen:

| Rolle | Beschreibung | Benefits |
|-------|--------------|----------|
| **Quality Manager** | Prüft Datensätze auf Qualität, kann Auffälligkeiten markieren | Zugriff Qualitätsmodul |
| **Recruiting Manager** | Wirbt neue Mitarbeiter, erhält Empfehlungsprovision | Zugriff Recruiting Portal |

> **Hinweis:** Diese Rollen sind zusätzlich zur Karrierestufe und können kombiniert werden.
>
> **Teamleiter** wird nicht hier vergeben, sondern direkt in den **Kampagnen** zugewiesen.

#### Individuelle Provision

| Einstellung | Beschreibung |
|-------------|--------------|
| **Individueller Faktor** | Optional - überschreibt den Standard-Faktor der Karrierestufe |
| **Gültig ab KW** | Kalenderwoche ab der der individuelle Faktor gilt |

> **Hinweis:** Nur ausfüllen wenn abweichend vom Standard. Z.B. für Sondervereinbarungen.
>
> **Pro KW gilt immer nur ein Faktor** - bei erneuter Änderung für dieselbe KW wird der vorherige Wert überschrieben.

#### Vorschuss/Rücklage Aufteilung

| Einstellung | Standard | Beschreibung |
|-------------|----------|--------------|
| **Vorschuss-Anteil** | 70% | Anteil der sofortigen Auszahlung |
| **Rücklage-Anteil** | 30% | Wird automatisch berechnet (100% - Vorschuss) |
| **Umsatzsteuerpflichtig** | Nein | Ob USt auf Abrechnungen ausgewiesen wird |

> **WICHTIG:** Die Aufteilung 70%/30% ist der Standard, kann aber pro Werber individuell angepasst werden (z.B. 80/20, 60/40).

#### Vorschau-Berechnung

Das Profil zeigt eine **Live-Vorschau** bei 1.000 € Brutto-Provision:
- Vorschuss: z.B. 700 € (bei 70%)
- Stornorücklage: z.B. 300 € (bei 30%)

### Karriere & Rollen-Historie

Im Profil wird auch die **Rollen-Historie** angezeigt:

| Element | Beschreibung |
|---------|--------------|
| **Aktuelle Karrierestufe** | Hero-Anzeige mit Faktor, "Seit"-Datum und Dauer |

#### Rollen-Historie

Die Rollen-Historie zeigt den gültigen Faktor pro KW (nur neuester Wert pro KW).

> **Rollen-Historie**: Konsolidierte Ansicht - zeigt nur was für die Provisionsberechnung relevant ist (ein Faktor pro KW)

> Die Historie wird automatisch geführt sobald Rollenwechsel vorgenommen werden.

### Audit-Log (eigener Menüpunkt)

Der **Audit-Log** ist ein eigenständiger Bereich in der Sidebar (`/audit-log/`), der alle wichtigen Änderungen im System protokolliert.

| Feature | Beschreibung |
|---------|--------------|
| **Zeitraum-Filter** | Heute, Diese Woche, Dieser Monat, Alle |
| **Aktions-Filter** | Erstellt, Aktualisiert, Gelöscht, Rollenänderung |
| **Bereichs-Filter** | Mitarbeiter, Kampagnen, Datensätze, Rollen, Provisionen |
| **Benutzer-Filter** | Nach Admin/Führungsebene filtern |
| **Export** | CSV-Export mit allen gefilterten Daten |

> **Vollständiges Protokoll**: Zeigt alle Admin-Änderungen mit Zeitstempel, Benutzer, alte und neue Werte.

### Abrechnungs-Seiten im Office

Die Abrechnungen sind in drei separate Seiten aufgeteilt mit gemeinsamer Sub-Navigation:

#### Navigation

| Seite | Pfad | Beschreibung |
|-------|------|--------------|
| **Werber** | `/abrechnungen/werber/` | Werber-Provisionen |
| **DRK** | `/abrechnungen/drk/` | DRK-Rechnungen |
| **Gesamt** | `/abrechnungen/` | Gewinn/Verlust Übersicht |

> Der Sidebar-Menüpunkt "Abrechnungen" führt zur **Gesamt**-Seite. Auf jeder Seite gibt es oben eine Sub-Navigation zum Wechseln.

#### Werber-Abrechnungen (`/abrechnungen/werber/`)

**Kategorien (Tabs):**
| Kategorie | Beschreibung |
|-----------|--------------|
| **Gesamt** | Übersicht aller Werber zusammen |
| **Einzeln** | Pro Werber aufgeschlüsselt |
| **Teamleiter** | TL-Provisionen (Kopfprovision vom Team) |
| **Empfehlung** | Empfehlungsprovisionen |

**Toggle:** Jede Kategorie hat einen Toggle zwischen:
- **Vorschuss (70%)** - Wöchentliche Auszahlung
- **Stornorücklage (30%)** - Einbehalten

**Features:**
- KW-Navigation (vor/zurück)
- Übersicht pro Werber mit Avatar, Rolle, Faktor
- Stornoquote-Anzeige mit Progress-Bar
- Status: Bereit, Versendet, Bezahlt

#### DRK-Abrechnungen (`/abrechnungen/drk/`)

**Gruppierung:** Nach Kampagnen

**Tabs:**
| Tab | Beschreibung |
|-----|--------------|
| **Wöchentlich** | 90% fällig, 10% Puffer |
| **Endabrechnung** | Nach Kampagnenende (Puffer minus Stornos) |
| **Zweitjahresrate** | 12 Monate nach Endabrechnung |
| **Folgejahre** | Jährlich wiederkehrend |

**Features:**
- Filter nach Kampagne, Zeitraum, Status
- Konditionen-Übersicht pro Kampagne (Sondierung, Regular, Qualitätsbonus)
- Status: Ausstehend, Erstellt, Versendet, Bezahlt

#### Gesamt-Übersicht (`/abrechnungen/`)

**Hero-Cards:**
| Card | Farbe | Beschreibung |
|------|-------|--------------|
| **Einnahmen** | Grün | DRK-Rechnungen (diese Woche fällig) |
| **Ausgaben** | Rot | Werber-Provisionen (Vorschuss-Auszahlung) |
| **Saldo** | Lila/Orange | Gewinn/Verlust (Einnahmen - Ausgaben) |

**Features:**
- Zeitraum-Filter: Woche / Monat / Quartal
- Einnahmen/Ausgaben Breakdown nebeneinander
- Offene Posten Tabelle (kombiniert Einnahmen + Ausgaben)
- Status-Anzeige: Bereit, Ausstehend, Überfällig

### Abrechnungen bearbeiten

> **Absegnen/Freigeben darf NUR die Verwaltung im Office!**

**Bei Fehlern in einer bereits erstellten Abrechnung:**

1. System zeigt **doppelte Sicherheitsabfrage**: "Möchten Sie diese Abrechnung wirklich bearbeiten?"
2. Bei Bestätigung: Abrechnung kann bearbeitet werden
3. System erstellt die **PDF automatisch neu**
4. System übernimmt die **neuen Zahlen**
5. Im Mitarbeiter-Profil erscheint eine **Notiz**: "Datum:XX bearbeitet"

### Export-Formate

Abrechnungen können in folgenden Formaten exportiert werden:
- **Excel** (.xlsx)
- **CSV** (.csv)
- **ODT** (.odt)

### Ansichtszeitraum

Standard-Ansicht: **4 Wochen zurück**

---

## TODO: Offene Punkte

- [x] ~~Sondervereinbarungen (Teilvergütung %-Anteil)~~ → Dokumentiert
- [x] ~~DRK-Abrechnungs-Timeline mit Phasen~~ → Dokumentiert
- [x] ~~Qualitätsbonus-Berechnung~~ → Dokumentiert
- [x] ~~Konditionen pro Kampagne/Einsatzgebiet~~ → Dokumentiert
- [x] ~~Individuelle Provisionsaufteilung (70/30)~~ → Dokumentiert
- [x] ~~Stornorücklage-Freigabe-Regel (2 Jahre + Quartalsanfang)~~ → Dokumentiert
- [x] ~~Erhöhungs-Provision~~ → Dokumentiert
- [x] ~~Abrechnungen bearbeiten mit doppelter Bestätigung~~ → Dokumentiert
- [x] ~~Umsatzsteuerpflichtig-Option~~ → Dokumentiert
- [ ] Kleidungs-/Auto-Vereinbarungen und deren Verrechnung
- [ ] Detailregeln für Kampagnen-übergreifende Stornos

---

## Verwandte Dokumentation

- [KARRIERE.md](KARRIERE.md) - Karrierestufen und Aufstiegsanforderungen
- [KUNDEN.md](KUNDEN.md) - Kundenmanagement, Werbegebiete und Konditionen
- [KAMPAGNEN.md](KAMPAGNEN.md) - Kampagnenplanung mit KW und Teamchef-Zuweisung
- [SYSTEM.md](SYSTEM.md) - Systemübersicht aller Module

---

*Letzte Aktualisierung: November 2025*
