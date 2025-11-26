# Provisionsmodell - RB Inside Office

---

## Grundregeln

| Regel | Wert |
|-------|------|
| **Gesamtbudget** | Faktor 9 |
| **Vorschuss** | 70% der Provision |
| **Stornorücklage** | 30% der Provision |
| **Auszahlung** | Wöchentlich (Montag) |

---

## 1. Eigene Provision (Werber-Faktor)

Basierend auf der Karrierestufe:

| Stufe | Faktor |
|-------|--------|
| I (SMA) | 5.0 |
| II (EMA) | 5.5 |
| III (JMM) | 6.0 |
| IV (EMM) | 6.5 |
| V (CEMM) | 6.75 |
| VI (Spitzen Botschafter) | 7.0 |
| VII (Kadermanager) | 7.5 |
| VIII (Führungsebene) | 8.0 |

**Berechnung:** `Eigene Netto-EH × Faktor`

---

## 2. Empfehlungs-/Recruiting-Provision

| Eigenschaft | Wert |
|-------------|------|
| **Faktor** | 0,5 |
| **Basis** | Alle Netto-EH des Empfohlenen |
| **Bedingung** | Empfohlener mind. 3 Wochen gearbeitet |
| **Wer kann empfehlen?** | Alle Stufen I-VII |
| **Für wen gibt es Provision?** | Alle Stufen I-VII |
| **Ausnahme** | Führungsebene (VIII): KEINE Empfehlungsprovision |

**Berechnung:** `Netto-EH des Empfohlenen × 0,5`

> **Hinweis:** Wenn ein Empfohlener zur Führungsebene aufsteigt, endet die Empfehlungsprovision.

---

## 3. Teamleiter-Provision

### Grundlagen

| Eigenschaft | Wert |
|-------------|------|
| **Berechtigung** | Ab Stufe IV (EMM) |
| **Zuweisung** | Durch Verwaltung einer Kampagne |
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
| **Beispiel-Rollen** | Mülldienst, Motivator, etc. |

**Beispiel Aufteilung:**
- Teamleiter behält: 0,8
- Mülldienst: 0,1
- Motivator: 0,1
- **Summe:** 1,0

### Sichtbarkeit

| Wer | Sieht was |
|-----|-----------|
| **Teamleiter** | Alle TL-Provisions-Anteile im Team |
| **Andere** | Nur den eigenen Anteil (privat) |
| **Live-Anzeige** | Jeder sieht seinen Verdienst live basierend auf Team-EH |

### Bedingungen (Kollektive Strafe!)

> **WICHTIG:** Wenn EINE Person die Bedingung nicht erfüllt, wird die Provision für ALLE halbiert!

| Bedingung | Anforderung | Status |
|-----------|-------------|--------|
| Eigenleistung | mind. 100 EH pro Woche | ✅ Aktiv |
| *(weitere später)* | | |

**Beispiel - Alle erfüllen Bedingung:**
```
Team produziert: 1000 EH
Verteilung: TL 0,8 / Müll 0,1 / Motivator 0,1

TL:        1000 × 0,8 = 800
Müll:      1000 × 0,1 = 100
Motivator: 1000 × 0,1 = 100
```

**Beispiel - Motivator hat <100 EH (ALLE halbiert!):**
```
Team produziert: 1000 EH
Verteilung: TL 0,8 / Müll 0,1 / Motivator 0,1

TL:        1000 × 0,8 × 0,5 = 400 ❌
Müll:      1000 × 0,1 × 0,5 = 50  ❌
Motivator: 1000 × 0,1 × 0,5 = 50  ❌
```

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

## Provisions-Übersicht (Zusammenfassung)

| Provision | Faktor | Basis | Bedingung |
|-----------|--------|-------|-----------|
| Eigene | 5.0 - 8.0 | Eigene Netto-EH | Karrierestufe |
| Empfehlung | 0,5 | Netto-EH des Empfohlenen | 3 Wochen gearbeitet |
| Teamleiter | 1,0 | Team-EH | Ab Stufe IV, 100 EH Eigenleistung |
| Quality | 0,5 | Netto-EH im Team | Ø 50 EH p.P./Woche |

---

## TODO: Offene Punkte

- [ ] Weitere Teamleiter-Bedingungen definieren
- [ ] Kampagnen-spezifische Provisionsregeln?

---

*Letzte Aktualisierung: November 2024*
