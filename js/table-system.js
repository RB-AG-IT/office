/**
 * Table System - Zentrale Funktionen für Tabellen
 */

/**
 * Generiert die HTML-Struktur für eine Gesamt-Zeile Name-Zelle
 * @param {string} count - Der Zähltext (z.B. "4 Werber", "12 Kunden")
 * @returns {string} HTML-String
 */
function createTotalsNameCell(count) {
    return `<div class="totals-name-cell"><span class="totals-label">Gesamt</span><span class="totals-count">${count}</span></div>`;
}
