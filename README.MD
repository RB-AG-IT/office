# RB Office

Backoffice-System der RB-AG-IT.

## Tech Stack

- HTML, CSS, JavaScript (ohne Frameworks)
- Supabase (Auth implementiert, Daten-Anbindung als Ziel)

## Architektur

### Shell-System

Zentrale `index.html` mit Sidebar + persistenter Shell-Toolbar. Alle Unterseiten werden per iframe geladen.

### Toolbar-Aufbau

Persistente Shell-Toolbar mit 3 festen Bereichen:

```
┌─────────────────────────────────────────┐
│ [Links] [Mitte: Search/Filters] [Rechts]│
└─────────────────────────────────────────┘
```

**Struktur:**
- `.shell-action-toolbar` - Container (56px hoch)
  - `.toolbar-left` - Links fixiert (Dropdowns, Filter)
  - `.toolbar-search` - Mitte zentriert (Suchfeld)
  - `.toolbar-right` - Rechts fixiert (Action-Buttons)

**Key-Feature:**
- `position: absolute` für alle Bereiche → bewegen sich nie
- Buttons senden Messages via `postMessage()` an iframe-Inhalt
- Seiten-spezifische Anpassung via `updateShellToolbar(page)`

### Supabase Auth (implementiert)

- `signInWithPassword()` für Login
- `signOut()` mit Custom Modal
- `checkAuthState()` bei Seitenload
- `onAuthStateChange()` überwacht Session (ignoriert TOKEN_REFRESHED)
- Daten aus: `users`, `user_with_roles`, `user_profiles`
- Keine E-Mail Verifizierung

### Datenarchitektur (Zwei-Bereiche-Prinzip)

| Bereich | Datenquelle | Zweck |
|---------|-------------|-------|
| **Bezahlung** | `provisions_ledger` / `customer_billing_ledger` | EH, Jahreseuros, Abrechnungen |
| **Statistik** | `records` (direkt) | Alter, Opt-Ins, Stornoquote |

**Ledger-System:** Buchungsprinzip für alle geldrelevanten Daten. Trigger buchen automatisch bei Record-Änderungen (INSERT, UPDATE, DELETE). Speichert EH (Einheiten), nicht EUR - Faktor wird erst bei Abrechnung angewendet.

**Records:** Stammdaten der Mitglieder für Statistiken und Auswertungen.

→ Details: [docs/LEDGER-SYSTEM.md](docs/LEDGER-SYSTEM.md)

### Dummy-Daten (Übergang)

**IST:** Lokal in JS-Dateien gespeichert

**ZIEL:**
1. Alle Dummy-Daten in einer zentralen Datei
2. Mit Supabase verbinden
3. Bei Löschung → auch in Supabase gelöscht

## Ziel-Struktur (WICHTIG!)

**Das Projekt arbeitet auf folgende zentrale Struktur hin:**

- **1x `styles.css`** - Alle Styles zentral in `/css/`
- **1x `main.js`** - Alle Skripte zentral in `/js/`

**Prinzipien:**
- Kein doppelter Code
- Kein toter Code
- Alles zentral definieren, dann verlinken
- Bei jeder Änderung prüfen: Kann das zentralisiert werden?

## Dateistruktur

```
/root
├── index.html              # Shell (Sidebar + Toolbar + iframe)
├── .clauderc               # Claude Code Regeln
├── README.md               # Diese Datei
│
├── /css                    # Zentrale Styles
│   └── styles.css
│
├── /js                     # Zentrale Skripte (Ziel: 1 Datei)
│
└── /[seiten-ordner]        # Jeder Ordner = eine iframe-Seite
    └── index.html          # + ggf. weitere Unterseiten
```

**Seiten-Ordner:** Jeder Ordner im Root (außer css, js, docs, etc.) ist eine eigenständige Seite die per iframe geladen wird. Jeder enthält mindestens eine `index.html`.

## Base

- `/base/` - Werber-App (Formular für Datensätze)

## Hinweise für Claude

1. Vor Änderungen: Bestehende Struktur analysieren
2. Bei jeder Gelegenheit: Auf Zentralisierung hinweisen
3. Doppelten Code identifizieren und Zusammenführung vorschlagen
4. Keine eigenmächtigen Änderungen - immer erst fragen
5. Git Workflow: Nach jeder Änderung `git add` → `git commit` → `git push`