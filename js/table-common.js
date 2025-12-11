/**
 * Table Common - Gemeinsame Funktionen für alle Tabellen
 * Wird von Statistik, Benutzer und Datensätze-Seiten verwendet
 */

/**
 * Generiert den Text für eine Gesamt-Zeile
 * @param {string} count - Der Zähltext (z.B. "4 Werber", "12 Kunden")
 * @returns {string} HTML-String
 */
function createTotalsNameCell(count) {
    return `<strong>Gesamt</strong> <span class="totals-count">${count}</span>`;
}

// ========== CHECKBOX SYSTEM ==========

/**
 * Zentrale Checkbox-Verwaltung für Tabellen
 * Verwaltet Select-All, Parent-Child-Verknüpfung und Selection-State
 */
const TableCheckbox = {
    /**
     * Toggle "Select All" für eine Tabelle
     * @param {HTMLInputElement} checkbox - Die Select-All Checkbox
     * @param {string} tableBodyId - ID des tbody Elements
     * @param {string} rowSelector - CSS-Selektor für die Zeilen (optional, default: 'tr:not(.child-row)')
     */
    toggleSelectAll(checkbox, tableBodyId, rowSelector = 'tr:not(.child-row):not(.totals-row)') {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;

        const rows = tbody.querySelectorAll(rowSelector);
        rows.forEach(row => {
            const cb = row.querySelector('.row-checkbox');
            if (cb) {
                cb.checked = checkbox.checked;
                // Wenn Parent, auch Children setzen
                if (cb.classList.contains('parent-checkbox')) {
                    this.toggleChildren(cb);
                }
            }
        });

        this.updateSelectionCount(tableBodyId);
    },

    /**
     * Toggle Parent-Checkbox und alle zugehörigen Child-Checkboxen
     * @param {HTMLInputElement} checkbox - Die Parent-Checkbox
     */
    toggleParent(checkbox) {
        const parentId = checkbox.dataset.parentId;
        if (!parentId) return;

        const childCheckboxes = document.querySelectorAll(`.child-checkbox[data-parent-id="${parentId}"]`);
        childCheckboxes.forEach(cb => cb.checked = checkbox.checked);

        // Update Select-All Status und Selection Count
        const table = checkbox.closest('table');
        if (table) {
            this.updateSelectAllState(table);
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.id) {
                const count = this.updateSelectionCount(tbody.id);
                this.updateSelectionUI(tbody.id, count);
            }
        }
    },

    /**
     * Wenn Child-Checkbox geklickt wird, Parent-State aktualisieren
     * @param {HTMLInputElement} checkbox - Die Child-Checkbox
     */
    toggleChild(checkbox) {
        const parentId = checkbox.dataset.parentId;
        if (!parentId) return;

        const parentCheckbox = document.querySelector(`.parent-checkbox[data-parent-id="${parentId}"]`);
        if (!parentCheckbox) return;

        const childCheckboxes = document.querySelectorAll(`.child-checkbox[data-parent-id="${parentId}"]`);
        const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(childCheckboxes).some(cb => cb.checked);

        parentCheckbox.checked = allChecked;
        parentCheckbox.indeterminate = someChecked && !allChecked;

        // Update Select-All Status und Selection Count
        const table = checkbox.closest('table');
        if (table) {
            this.updateSelectAllState(table);
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.id) {
                const count = this.updateSelectionCount(tbody.id);
                this.updateSelectionUI(tbody.id, count);
            }
        }
    },

    /**
     * Hilfsfunktion: Children einer Parent-Checkbox setzen
     * @param {HTMLInputElement} parentCheckbox - Die Parent-Checkbox
     */
    toggleChildren(parentCheckbox) {
        const parentId = parentCheckbox.dataset.parentId;
        if (!parentId) return;

        const childCheckboxes = document.querySelectorAll(`.child-checkbox[data-parent-id="${parentId}"]`);
        childCheckboxes.forEach(cb => cb.checked = parentCheckbox.checked);
    },

    /**
     * Select-All Checkbox Status basierend auf Zeilen-Checkboxen aktualisieren
     * @param {HTMLElement} table - Das Table-Element
     */
    updateSelectAllState(table) {
        const selectAll = table.querySelector('thead .row-checkbox');
        if (!selectAll) return;

        const rowCheckboxes = table.querySelectorAll('tbody .row-checkbox:not(.child-checkbox)');
        const allChecked = rowCheckboxes.length > 0 && Array.from(rowCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(rowCheckboxes).some(cb => cb.checked);

        selectAll.checked = allChecked;
        selectAll.indeterminate = someChecked && !allChecked;
    },

    /**
     * Anzahl ausgewählter Zeilen aktualisieren (optional für UI)
     * Zählt Parent-Checkboxen + sichtbare Child-Checkboxen
     * (Eingeklappte Children werden nicht gezählt, nur der Parent)
     * @param {string} tableBodyId - ID des tbody Elements
     * @returns {number} Anzahl ausgewählter Zeilen
     */
    updateSelectionCount(tableBodyId) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return 0;

        let count = 0;

        // Alle ausgewählten Parent-Checkboxen zählen
        const parentCheckboxes = tbody.querySelectorAll('.row-checkbox:checked:not(.child-checkbox)');
        count += parentCheckboxes.length;

        // Nur sichtbare Child-Checkboxen zählen (Parent muss ausgeklappt sein)
        const visibleChildCheckboxes = tbody.querySelectorAll('.child-row.visible .row-checkbox:checked');
        count += visibleChildCheckboxes.length;

        // Event dispatchen für UI-Updates
        document.dispatchEvent(new CustomEvent('table-selection-changed', {
            detail: { tableBodyId, count: count }
        }));

        return count;
    },

    /**
     * Alle ausgewählten IDs einer Tabelle zurückgeben
     * @param {string} tableBodyId - ID des tbody Elements
     * @param {string} dataAttribute - Name des data-Attributs für die ID (default: 'id')
     * @returns {Array} Array von IDs
     */
    getSelectedIds(tableBodyId, dataAttribute = 'id') {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return [];

        const checkedRows = tbody.querySelectorAll('.row-checkbox:checked');
        return Array.from(checkedRows).map(cb => {
            const row = cb.closest('tr');
            return row ? row.dataset[dataAttribute] : null;
        }).filter(id => id !== null);
    },

    /**
     * Alle Checkboxen einer Tabelle zurücksetzen
     * @param {string} tableBodyId - ID des tbody Elements
     */
    clearAll(tableBodyId) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;

        const table = tbody.closest('table');
        if (table) {
            const selectAll = table.querySelector('thead .row-checkbox');
            if (selectAll) {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            }
        }

        tbody.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.checked = false;
            cb.indeterminate = false;
        });

        this.updateSelectionCount(tableBodyId);
    },

    // ========== SELECTION UI ==========

    /**
     * Konfiguration für Selection-UI pro Tabelle
     * Speichert Button-ID und Count-Span-ID
     */
    selectionUI: {},

    /**
     * Selection-UI für eine Tabelle registrieren
     * @param {string} tableBodyId - ID des tbody Elements
     * @param {string} buttonId - ID des Selection-Buttons
     * @param {string} countSpanId - ID des Count-Spans
     */
    registerSelectionUI(tableBodyId, buttonId, countSpanId) {
        this.selectionUI[tableBodyId] = { buttonId, countSpanId };
    },

    /**
     * Selection-UI aktualisieren (Button anzeigen/verstecken, Count setzen)
     * @param {string} tableBodyId - ID des tbody Elements
     * @param {number} count - Anzahl ausgewählter Zeilen
     */
    updateSelectionUI(tableBodyId, count) {
        const config = this.selectionUI[tableBodyId];
        if (!config) return;

        const btn = document.getElementById(config.buttonId);
        const countSpan = document.getElementById(config.countSpanId);

        if (btn) {
            btn.classList.toggle('visible', count > 0);
        }
        if (countSpan) {
            countSpan.textContent = count;
        }
    },

    /**
     * Initialisiert Event-Listener für Selection-UI Updates
     * Muss einmal beim Laden aufgerufen werden
     */
    initSelectionUI() {
        // Auf Checkbox-Änderungen reagieren
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                const tbody = e.target.closest('tbody');
                if (tbody && tbody.id && this.selectionUI[tbody.id]) {
                    const count = this.updateSelectionCount(tbody.id);
                    this.updateSelectionUI(tbody.id, count);
                }
            }
        });

        // Auf das zentrale Event hören
        document.addEventListener('table-selection-changed', (e) => {
            const { tableBodyId, count } = e.detail;
            this.updateSelectionUI(tableBodyId, count);
        });
    }
};

console.log('%c Table-Common geladen ', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');
