/**
 * Table System - Zentrale Funktionen für Tabellen
 */

/**
 * Generiert den Text für eine Gesamt-Zeile
 * @param {string} count - Der Zähltext (z.B. "4 Werber", "12 Kunden")
 * @returns {string} HTML-String
 */
function createTotalsNameCell(count) {
    return `<strong>Gesamt</strong> <span class="totals-count">${count}</span>`;
}
