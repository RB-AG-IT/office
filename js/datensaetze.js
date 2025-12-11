/**
 * Datensätze System
 * Spezifische Funktionen für Datensätze-Seiten (Neumitglieder, Erhöhungen, Bestandsmitglieder)
 * Benötigt: table-common.js (TableCheckbox, createTotalsNameCell)
 */

// ========== CONFIGURATION ==========

/**
 * Spalten-Definitionen für beide Tabellen
 */
const columnDefinitions = {
    records: [
        { id: 'name', label: 'Name', visible: true, required: true },
        { id: 'typ', label: 'Typ', visible: true, required: false },
        { id: 'status', label: 'Status', visible: true, required: false },
        { id: 'date', label: 'Datum', visible: true, required: false },
        { id: 'je', label: 'JE (Jahreseuros)', visible: true, required: false },
        { id: 'kunde', label: 'Kunde', visible: true, required: false },
        { id: 'gebiet', label: 'Werbegebiet', visible: true, required: false },
        { id: 'werber', label: 'Werber', visible: true, required: false },
        { id: 'teamchef', label: 'Teamchef', visible: true, required: false },
        { id: 'street', label: 'Straße', visible: true, required: false },
        { id: 'houseNumber', label: 'Nr', visible: true, required: false },
        { id: 'zipCode', label: 'PLZ', visible: true, required: false },
        { id: 'city', label: 'Ort', visible: true, required: false },
        { id: 'email', label: 'E-Mail', visible: true, required: false },
        { id: 'phoneFixed', label: 'Tel. Festnetz', visible: true, required: false },
        { id: 'phoneMobile', label: 'Tel. Mobil', visible: true, required: false }
    ],
    bestand: [
        { id: 'name', label: 'Name', visible: true, required: true },
        { id: 'memberNr', label: 'Mitgl.-Nr.', visible: true, required: false },
        { id: 'seit', label: 'Mitglied seit', visible: true, required: false },
        { id: 'je', label: 'JE (Jahreseuros)', visible: true, required: false },
        { id: 'email', label: 'E-Mail', visible: true, required: false },
        { id: 'status', label: 'Status', visible: true, required: false }
    ]
};

// Aktuelle Konfiguration (Kopie der Definitionen)
let currentColumnsConfig = {
    records: JSON.parse(JSON.stringify(columnDefinitions.records)),
    bestand: JSON.parse(JSON.stringify(columnDefinitions.bestand))
};

// Temporäre Konfiguration während des Bearbeitens
let tempColumnsConfig = [];

// ========== STATE ==========

let currentFilter = 'all';

let currentSort = {
    records: { col: null, direction: 'asc' },
    bestand: { col: null, direction: 'asc' }
};

// Storno Modal Context
let stornoContext = { type: null, ids: [], names: [] };

// Edit Modal Context
let editContext = { type: null, id: null };

// Columns Modal Context
let columnsContext = { type: null };

// Drag & Drop
let draggedIndex = null;

// ========== DATA (muss von der Seite überschrieben werden) ==========

// Placeholder - wird von der Seite überschrieben
let recordsData = [];
let bestandData = [];

// Beispiel-Historie-Daten (würden normalerweise vom Server kommen)
const historyData = {};

// ========== BACK BUTTON ==========
function goBack() {
    console.log('Zurück geklickt');
    window.history.back();
}

// ========== TAB SWITCHING ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

// ========== FILTER ==========
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderRecordsTable();
}

// ========== SORTING ==========
function sortTable(tableType, col) {
    const sort = currentSort[tableType];

    // Toggle Richtung wenn gleiche Spalte, sonst reset auf asc
    if (sort.col === col) {
        sort.direction = sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sort.col = col;
        sort.direction = 'asc';
    }

    // Daten sortieren
    const data = tableType === 'records' ? recordsData : bestandData;
    data.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];

        // Spezialbehandlung für verschiedene Datentypen
        if (col === 'je') {
            // Währung: "120,00 €" -> 120.00
            valA = parseFloat(valA.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            valB = parseFloat(valB.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        } else if (col === 'date' || col === 'seit') {
            // Datum: "01.03.2024" -> Date
            const parseDate = (str) => {
                const parts = str.split('.');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };
            valA = parseDate(valA);
            valB = parseDate(valB);
        } else {
            // String: Groß-/Kleinschreibung ignorieren
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }

        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Tabelle neu rendern
    if (tableType === 'records') {
        renderRecordsTable();
    } else {
        renderBestandTable();
    }
}

// ========== SELECTION MANAGEMENT ==========
function updateSelectionUI(tableBodyId) {
    const count = TableCheckbox.updateSelectionCount(tableBodyId);
    const type = tableBodyId.replace('TableBody', '');

    const btnCount = document.getElementById(`${type}SelectedCount`);
    const selectionBtn = document.getElementById(`${type}SelectionBtn`);
    const headerActions = document.getElementById(`${type}HeaderActions`);

    if (btnCount) {
        btnCount.textContent = count;
    }
    if (selectionBtn) {
        selectionBtn.classList.toggle('visible', count > 0);
    }
    if (headerActions) {
        headerActions.classList.toggle('visible', count > 0);
    }
}

function handleRowCheckbox(checkbox, type, id) {
    const tableBodyId = `${type}TableBody`;
    updateSelectionUI(tableBodyId);
}

function clearSelection(type) {
    const tableBodyId = `${type}TableBody`;
    TableCheckbox.clearAll(tableBodyId);
    updateSelectionUI(tableBodyId);
}

// ========== DROPDOWN ACTIONS ==========
let currentDropdown = null;

function toggleDropdown(button, type, id) {
    const dropdown = button.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');

    // Wenn gleiche Dropdown, toggle
    if (currentDropdown === dropdown) {
        menu.classList.remove('active');
        currentDropdown = null;
        return;
    }

    // Andere Dropdowns schließen
    document.querySelectorAll('.dropdown-menu.active').forEach(m => m.classList.remove('active'));

    // Kontext speichern
    dropdown.dataset.type = type;
    dropdown.dataset.id = id;

    // Dropdown öffnen
    menu.classList.add('active');
    currentDropdown = dropdown;
}

// Klick außerhalb schließt Dropdown
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
        currentDropdown = null;
    }
});

function handleDropdownAction(action, dropdownMenu) {
    const dropdown = dropdownMenu.closest('.dropdown');
    const type = dropdown.dataset.type;
    const id = parseInt(dropdown.dataset.id);

    // Dropdown schließen
    dropdownMenu.classList.remove('active');
    currentDropdown = null;

    // Daten laden
    const data = type === 'records' ? recordsData : bestandData;
    const record = data.find(d => d.id === id);
    if (!record) return;

    switch (action) {
        case 'edit':
            openEditModal(type, id);
            break;
        case 'mail':
            sendMailSingle(type, id, record);
            break;
        case 'pdf':
            downloadPDFSingle(type, id, record);
            break;
        case 'storno':
            openStornoModal(type, [id], [record.name]);
            break;
        case 'delete':
            deleteSingle(type, id, record);
            break;
    }
}

// ========== BULK ACTIONS ==========
function sendMail(type) {
    const tableBodyId = `${type}TableBody`;
    const ids = TableCheckbox.getSelectedIds(tableBodyId);
    const data = type === 'records' ? recordsData : bestandData;
    const names = ids.map(id => {
        const record = data.find(d => d.id === parseInt(id));
        return record ? record.name : id;
    });

    console.log(`E-Mail senden an: ${names.join(', ')}`);
    showAlert('E-Mail', `E-Mail würde gesendet an: ${names.join(', ')}`, 'info');
}

function downloadPDF(type) {
    const tableBodyId = `${type}TableBody`;
    const ids = TableCheckbox.getSelectedIds(tableBodyId);
    const data = type === 'records' ? recordsData : bestandData;
    const names = ids.map(id => {
        const record = data.find(d => d.id === parseInt(id));
        return record ? record.name : id;
    });

    console.log(`PDF erstellen für: ${names.join(', ')}`);
    showAlert('PDF', `PDF würde erstellt für: ${names.join(', ')}`, 'info');
}

function stornoSelected(type) {
    const tableBodyId = `${type}TableBody`;
    const ids = TableCheckbox.getSelectedIds(tableBodyId);
    const data = type === 'records' ? recordsData : bestandData;
    const names = ids.map(id => {
        const record = data.find(d => d.id === parseInt(id));
        return record ? record.name : id;
    });

    openStornoModal(type, ids.map(id => parseInt(id)), names);
}

async function deleteSelected(type) {
    const tableBodyId = `${type}TableBody`;
    const ids = TableCheckbox.getSelectedIds(tableBodyId);

    if (ids.length === 0) return;

    const confirmed = await showConfirm(
        'Löschen',
        `Möchten Sie ${ids.length} Datensatz/Datensätze wirklich löschen?`,
        'warning',
        { danger: true, confirmText: 'Löschen' }
    );

    if (confirmed) {
        console.log('Löschen:', ids);
        showAlert('Gelöscht', `${ids.length} Datensatz/Datensätze wurden gelöscht.`, 'success');
        clearSelection(type);
    }
}

// ========== SINGLE ACTIONS ==========
function sendMailSingle(type, id, record) {
    console.log(`E-Mail senden an: ${record.name}`);
    showAlert('E-Mail', `E-Mail würde gesendet an: ${record.name}`, 'info');
}

function downloadPDFSingle(type, id, record) {
    console.log(`PDF erstellen für: ${record.name}`);
    showAlert('PDF', `PDF würde erstellt für: ${record.name}`, 'info');
}

async function deleteSingle(type, id, record) {
    const confirmed = await showConfirm(
        'Löschen',
        `Möchten Sie "${record.name}" wirklich löschen?`,
        'warning',
        { danger: true, confirmText: 'Löschen' }
    );

    if (confirmed) {
        console.log('Löschen:', id);
        showAlert('Gelöscht', `"${record.name}" wurde gelöscht.`, 'success');
    }
}

// ========== RENDER RECORDS TABLE ==========
function renderRecordsTable() {
    let filtered;
    if (currentFilter === 'all') {
        filtered = recordsData;
    } else if (currentFilter === 'storno') {
        filtered = recordsData.filter(d => d.status === 'storniert');
    } else {
        filtered = recordsData.filter(d => d.typ === currentFilter);
    }

    // Spalten-Konfiguration holen (falls verfügbar)
    const config = currentColumnsConfig.records;

    // Header-Definitionen
    const headerDefs = {
        name: { class: 'col-name', label: 'Name' },
        typ: { class: 'col-type', label: 'Typ' },
        date: { class: 'col-date', label: 'Datum' },
        je: { class: 'col-amount', label: 'JE' },
        kunde: { class: 'col-kunde', label: 'Kunde' },
        gebiet: { class: 'col-area', label: 'Werbegebiet' },
        werber: { class: 'col-werber', label: 'Werber' },
        teamchef: { class: 'col-teamchef', label: 'Teamchef' },
        street: { class: 'col-street', label: 'Straße' },
        houseNumber: { class: 'col-houseNumber', label: 'Nr' },
        zipCode: { class: 'col-zipCode', label: 'PLZ' },
        city: { class: 'col-city', label: 'Ort' },
        email: { class: 'col-email', label: 'E-Mail' },
        phoneFixed: { class: 'col-phoneFixed', label: 'Tel. Festnetz' },
        phoneMobile: { class: 'col-phoneMobile', label: 'Tel. Mobil' },
        status: { class: 'col-status', label: 'Status' }
    };

    // Header rendern
    const sort = currentSort.records;
    const thead = document.getElementById('recordsTableHead');
    if (!thead) return;

    let headerHtml = `<tr>
        <th class="checkbox-cell">
            <input type="checkbox" class="row-checkbox" id="selectAllRecords" onclick="TableCheckbox.toggleSelectAll(this, 'recordsTableBody'); updateSelectionUI('recordsTableBody')">
        </th>
        <th class="action-cell"></th>`;

    config.forEach(col => {
        const def = headerDefs[col.id];
        if (def) {
            const display = col.visible ? '' : 'display:none;';
            const sortClass = sort.col === col.id ? (sort.direction === 'asc' ? 'sort-asc' : 'sort-desc') : '';
            headerHtml += `<th class="sortable ${def.class} ${sortClass}" data-col="${col.id}" style="${display}" onclick="sortTable('records', '${col.id}')">
                ${def.label}
                <span class="sort-arrows">
                    <svg class="arrow-up" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                    <svg class="arrow-down" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </span>
            </th>`;
        }
    });
    headerHtml += `<th class="col-spacer"></th></tr>`;
    thead.innerHTML = headerHtml;

    const body = document.getElementById('recordsTableBody');
    if (!body) return;

    body.innerHTML = filtered.map(d => {
        // Spalten-Daten mit Mapping
        const colData = {
            name: { class: 'col-name', html: d.name },
            typ: { class: 'col-type', html: `<span class="badge ${d.typ}">${d.typ === 'nmg' ? 'NMG' : 'ERH'}</span>` },
            date: { class: 'col-date', html: d.date },
            je: { class: 'col-amount', html: d.je },
            kunde: { class: 'col-kunde', html: d.kunde || '' },
            gebiet: { class: 'col-area', html: d.gebiet || '' },
            werber: { class: 'col-werber', html: d.werber || '' },
            teamchef: { class: 'col-teamchef', html: d.teamchef || '' },
            street: { class: 'col-street', html: d.street || '' },
            houseNumber: { class: 'col-houseNumber', html: d.houseNumber || '' },
            zipCode: { class: 'col-zipCode', html: d.zipCode || '' },
            city: { class: 'col-city', html: d.city || '' },
            email: { class: 'col-email', html: d.email || '' },
            phoneFixed: { class: 'col-phoneFixed', html: d.phoneFixed || '' },
            phoneMobile: { class: 'col-phoneMobile', html: d.phoneMobile || '' },
            status: { class: 'col-status', html: `<span class="badge ${d.status}">${d.status.toUpperCase()}</span>` }
        };

        // Spalten in konfigurierter Reihenfolge rendern
        let columnsHtml = '';
        config.forEach(col => {
            const data = colData[col.id];
            if (data) {
                const display = col.visible ? '' : 'display:none;';
                columnsHtml += `<td class="${data.class}" style="${display}">${data.html}</td>`;
            }
        });

        return `
        <tr data-id="${d.id}" data-typ="${d.typ}">
            <td class="checkbox-cell">
                <input type="checkbox" class="row-checkbox" onchange="handleRowCheckbox(this, 'records', ${d.id})">
            </td>
            <td class="action-cell">
                <div class="dropdown">
                    <button class="dropdown-btn" onclick="toggleDropdown(this, 'records', ${d.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" onclick="handleDropdownAction('edit', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Bearbeiten
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" onclick="handleDropdownAction('mail', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            E-Mail senden
                        </div>
                        <div class="dropdown-item" onclick="handleDropdownAction('pdf', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            PDF Download
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item warning" onclick="handleDropdownAction('storno', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                            Stornieren
                        </div>
                        <div class="dropdown-item danger" onclick="handleDropdownAction('delete', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Löschen
                        </div>
                    </div>
                </div>
            </td>
            ${columnsHtml}
            <td class="col-spacer"></td>
        </tr>
    `;
    }).join('');

    // Totals-Row rendern
    renderRecordsTotals(filtered, config);
}

function renderRecordsTotals(filtered, config) {
    const tfoot = document.getElementById('recordsTableFoot');
    if (!tfoot) return;

    // JE-Summe berechnen
    const totalJE = filtered.reduce((sum, d) => {
        const value = parseFloat(d.je.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return sum + value;
    }, 0);
    const formattedTotal = totalJE.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    const totalsDefs = {
        name: { class: 'col-name', html: `Gesamt<span class="totals-count">(${filtered.length})</span>` },
        typ: { class: 'col-type', html: '' },
        date: { class: 'col-date', html: '' },
        je: { class: 'col-amount', html: formattedTotal },
        kunde: { class: 'col-kunde', html: '' },
        gebiet: { class: 'col-area', html: '' },
        werber: { class: 'col-werber', html: '' },
        teamchef: { class: 'col-teamchef', html: '' },
        street: { class: 'col-street', html: '' },
        houseNumber: { class: 'col-houseNumber', html: '' },
        zipCode: { class: 'col-zipCode', html: '' },
        city: { class: 'col-city', html: '' },
        email: { class: 'col-email', html: '' },
        phoneFixed: { class: 'col-phoneFixed', html: '' },
        phoneMobile: { class: 'col-phoneMobile', html: '' },
        status: { class: 'col-status', html: '' }
    };

    let totalsHtml = '<tr class="totals-row"><td class="checkbox-cell"></td><td class="action-cell"></td>';
    config.forEach(col => {
        const def = totalsDefs[col.id];
        if (def) {
            const display = col.visible ? '' : 'display:none;';
            totalsHtml += `<td class="${def.class}" style="${display}">${def.html}</td>`;
        }
    });
    totalsHtml += '<td class="col-spacer"></td></tr>';
    tfoot.innerHTML = totalsHtml;
}

// ========== RENDER BESTAND TABLE ==========
function renderBestandTable() {
    // Spalten-Konfiguration holen (falls verfügbar)
    const config = currentColumnsConfig.bestand;

    // Header-Definitionen
    const headerDefs = {
        name: { class: 'col-name', label: 'Name' },
        memberNr: { class: 'col-memberNumber', label: 'Mitgl.-Nr.' },
        seit: { class: 'col-memberSince', label: 'Mitglied seit' },
        je: { class: 'col-amount', label: 'JE' },
        email: { class: 'col-email', label: 'E-Mail' },
        status: { class: 'col-status', label: 'Status' }
    };

    // Header rendern
    const sort = currentSort.bestand;
    const thead = document.getElementById('bestandTableHead');
    if (!thead) return;

    let headerHtml = `<tr>
        <th class="checkbox-cell">
            <input type="checkbox" class="row-checkbox" id="selectAllBestand" onclick="TableCheckbox.toggleSelectAll(this, 'bestandTableBody'); updateSelectionUI('bestandTableBody')">
        </th>
        <th class="action-cell"></th>`;

    config.forEach(col => {
        const def = headerDefs[col.id];
        if (def) {
            const display = col.visible ? '' : 'display:none;';
            const sortClass = sort.col === col.id ? (sort.direction === 'asc' ? 'sort-asc' : 'sort-desc') : '';
            headerHtml += `<th class="sortable ${def.class} ${sortClass}" data-col="${col.id}" style="${display}" onclick="sortTable('bestand', '${col.id}')">
                ${def.label}
                <span class="sort-arrows">
                    <svg class="arrow-up" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                    <svg class="arrow-down" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </span>
            </th>`;
        }
    });
    headerHtml += `<th class="col-spacer"></th></tr>`;
    thead.innerHTML = headerHtml;

    const body = document.getElementById('bestandTableBody');
    if (!body) return;

    body.innerHTML = bestandData.map(d => {
        // Spalten-Daten mit Mapping
        const colData = {
            name: { class: 'col-name', html: d.name },
            memberNr: { class: 'col-memberNumber', html: d.memberNr },
            seit: { class: 'col-memberSince', html: d.seit },
            je: { class: 'col-amount', html: d.je },
            email: { class: 'col-email', html: d.email },
            status: { class: 'col-status', html: `<span class="badge ${d.status}">${d.status.toUpperCase()}</span>` }
        };

        // Spalten in konfigurierter Reihenfolge rendern
        let columnsHtml = '';
        config.forEach(col => {
            const data = colData[col.id];
            if (data) {
                const display = col.visible ? '' : 'display:none;';
                columnsHtml += `<td class="${data.class}" style="${display}">${data.html}</td>`;
            }
        });

        return `
        <tr data-id="${d.id}">
            <td class="checkbox-cell">
                <input type="checkbox" class="row-checkbox" onchange="handleRowCheckbox(this, 'bestand', ${d.id})">
            </td>
            <td class="action-cell">
                <div class="dropdown">
                    <button class="dropdown-btn" onclick="toggleDropdown(this, 'bestand', ${d.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" onclick="handleDropdownAction('edit', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Bearbeiten
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" onclick="handleDropdownAction('mail', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            E-Mail senden
                        </div>
                        <div class="dropdown-item" onclick="handleDropdownAction('pdf', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            PDF Download
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item warning" onclick="handleDropdownAction('storno', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                            Stornieren
                        </div>
                        <div class="dropdown-item danger" onclick="handleDropdownAction('delete', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Löschen
                        </div>
                    </div>
                </div>
            </td>
            ${columnsHtml}
            <td class="col-spacer"></td>
        </tr>
    `;
    }).join('');

    // Totals-Row rendern
    renderBestandTotals(config);
}

function renderBestandTotals(config) {
    const tfoot = document.getElementById('bestandTableFoot');
    if (!tfoot) return;

    // JE-Summe berechnen
    const totalJE = bestandData.reduce((sum, d) => {
        const value = parseFloat(d.je.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return sum + value;
    }, 0);
    const formattedTotal = totalJE.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    const totalsDefs = {
        name: { class: 'col-name', html: `Gesamt<span class="totals-count">(${bestandData.length})</span>` },
        memberNr: { class: 'col-memberNumber', html: '' },
        seit: { class: 'col-memberSince', html: '' },
        je: { class: 'col-amount', html: formattedTotal },
        email: { class: 'col-email', html: '' },
        status: { class: 'col-status', html: '' }
    };

    let totalsHtml = '<tr class="totals-row"><td class="checkbox-cell"></td><td class="action-cell"></td>';
    config.forEach(col => {
        const def = totalsDefs[col.id];
        if (def) {
            const display = col.visible ? '' : 'display:none;';
            totalsHtml += `<td class="${def.class}" style="${display}">${def.html}</td>`;
        }
    });
    totalsHtml += '<td class="col-spacer"></td></tr>';
    tfoot.innerHTML = totalsHtml;
}

// ========== CONTEXT BADGE ==========
function setContextBadge(data) {
    const container = document.getElementById('contextBadge');
    if (!container || typeof createBadge !== 'function') return;

    container.innerHTML = createBadge({
        type: data.type,
        name: data.name,
        stufe: data.stufe,
        isTC: data.isTC,
        isQ: data.isQ
    });
}

// Bestandsmitglieder-Tab nur für Kunden und Werbegebiete anzeigen
function updateBestandTabVisibility(type) {
    const bestandTab = document.querySelector('[data-tab="bestand"]');
    if (!bestandTab) return;

    const showBestand = (type === 'kunde' || type === 'werbegebiet');
    bestandTab.style.display = showBestand ? '' : 'none';
}

// ========== STORNO MODAL ==========
function openStornoModal(type, ids, names) {
    stornoContext = { type, ids, names };

    // Subtitle setzen
    const subtitle = document.getElementById('stornoModalSubtitle');
    if (ids.length === 1 && names.length === 1) {
        subtitle.textContent = names[0];
    } else {
        subtitle.textContent = `${ids.length} Datensätze ausgewählt`;
    }

    // Datum auf heute setzen
    const heute = new Date().toISOString().split('T')[0];
    document.getElementById('stornoDatum').value = heute;

    // Formular zurücksetzen
    document.getElementById('stornoGrund').value = '';
    document.getElementById('stornoGrundFreitext').value = '';
    document.getElementById('stornoGrundFreitextFields').classList.remove('visible');
    document.getElementById('stornoBeschwerde').checked = false;
    document.getElementById('beschwerdeGrund').value = '';
    document.getElementById('beschwerdeFields').classList.remove('visible');
    document.getElementById('stornoMailBestaetigung').checked = false;

    // Modal anzeigen
    document.getElementById('stornoModal').classList.add('active');
}

function closeStornoModal() {
    document.getElementById('stornoModal').classList.remove('active');
    stornoContext = { type: null, ids: [], names: [] };
}

function toggleBeschwerdeFields() {
    const checkbox = document.getElementById('stornoBeschwerde');
    const fields = document.getElementById('beschwerdeFields');
    fields.classList.toggle('visible', checkbox.checked);
}

function toggleStornoGrundFreitext() {
    const select = document.getElementById('stornoGrund');
    const fields = document.getElementById('stornoGrundFreitextFields');
    fields.classList.toggle('visible', select.value === 'freitext');
}

async function confirmStorno() {
    const grundSelect = document.getElementById('stornoGrund').value;
    const grundFreitext = document.getElementById('stornoGrundFreitext').value;
    const datum = document.getElementById('stornoDatum').value;
    const beschwerde = document.getElementById('stornoBeschwerde').checked;
    const beschwerdeGrund = document.getElementById('beschwerdeGrund').value;
    const mailBestaetigung = document.getElementById('stornoMailBestaetigung').checked;

    if (!grundSelect) {
        await showAlert('Fehler', 'Bitte wählen Sie einen Storno-Grund aus.', 'warning');
        return;
    }

    if (grundSelect === 'freitext' && !grundFreitext.trim()) {
        await showAlert('Fehler', 'Bitte geben Sie einen Storno-Grund ein.', 'warning');
        return;
    }

    if (!datum) {
        await showAlert('Fehler', 'Bitte geben Sie ein Storno-Datum ein.', 'warning');
        return;
    }

    const grund = grundSelect === 'freitext' ? grundFreitext : grundSelect;

    // Storno-Daten ausgeben
    console.log('Storno durchgeführt:', {
        type: stornoContext.type,
        ids: stornoContext.ids,
        grund,
        datum,
        beschwerde,
        beschwerdeGrund: beschwerde ? beschwerdeGrund : null,
        mailBestaetigung
    });

    closeStornoModal();
    await showAlert('Erfolg', `${stornoContext.ids.length} Datensatz/Datensätze erfolgreich storniert.`, 'success');

    // Selection aufheben
    if (stornoContext.type) {
        clearSelection(stornoContext.type);
    }
}

// ========== EDIT MODAL ==========
function openEditModal(type, id) {
    editContext = { type, id };

    // Daten laden
    const data = type === 'records' ? recordsData : bestandData;
    const record = data.find(d => d.id === id);
    if (!record) return;

    // Header füllen
    const nameParts = record.name.split(' ');
    const initials = nameParts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
    document.getElementById('editModalAvatar').textContent = initials;
    document.getElementById('editModalName').textContent = record.name;

    // Typ-Badge
    const typeBadge = document.getElementById('editModalTypeBadge');
    if (type === 'records') {
        typeBadge.textContent = record.typ === 'nmg' ? 'NMG' : 'ERH';
        typeBadge.className = `badge ${record.typ}`;
    } else {
        typeBadge.textContent = 'BESTAND';
        typeBadge.className = 'badge aktiv';
    }

    // Datum
    const dateText = type === 'records' ? `Erstellt am ${record.date}` : `Mitglied seit ${record.seit}`;
    document.getElementById('editModalDate').textContent = dateText;

    // Formularfelder füllen (Beispieldaten)
    if (type === 'records') {
        const vorname = nameParts[0] || '';
        const nachname = nameParts.slice(1).join(' ') || '';
        document.getElementById('editVorname').value = vorname;
        document.getElementById('editNachname').value = nachname;
        document.getElementById('editGebiet').value = record.gebiet || '';
        document.getElementById('editWerber').value = record.werber || '';
        // Beitrag aus JE berechnen (vereinfacht)
        const jeValue = parseFloat(record.je.replace('.', '').replace(',', '.').replace(' €', ''));
        document.getElementById('editBeitrag').value = (jeValue / 12).toFixed(2);
        document.getElementById('editJE').value = record.je;
    } else {
        const vorname = nameParts[0] || '';
        const nachname = nameParts.slice(1).join(' ') || '';
        document.getElementById('editVorname').value = vorname;
        document.getElementById('editNachname').value = nachname;
        document.getElementById('editEmail').value = record.email || '';
        const jeValue = parseFloat(record.je.replace('.', '').replace(',', '.').replace(' €', ''));
        document.getElementById('editBeitrag').value = (jeValue / 12).toFixed(2);
        document.getElementById('editJE').value = record.je;
    }

    // Historie rendern
    renderEditHistory(id);

    // Modal anzeigen
    document.getElementById('editModal').classList.add('active');
}

function renderEditHistory(recordId) {
    const timeline = document.getElementById('editHistoryTimeline');
    if (!timeline) return;

    const history = historyData[recordId] || [
        { type: 'neumitglied', date: 'Unbekannt', title: 'Mitglied geworden', detail: 'Keine Details verfügbar' }
    ];

    // Icons für verschiedene Typen
    const icons = {
        neumitglied: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        erhoehung: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
        storno: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
        aenderung: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>'
    };

    timeline.innerHTML = history.map(item => `
        <div class="history-item ${item.type}">
            <div class="history-item-dot">
                ${icons[item.type] || ''}
            </div>
            <div class="history-item-content">
                <div class="history-item-title">${item.title}</div>
                <div class="history-item-meta">${item.date}</div>
                ${item.detail ? `<div class="history-item-detail">${item.detail}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editContext = { type: null, id: null };
}

async function saveEditModal() {
    // Hier würden die Daten gespeichert werden
    console.log('Speichern:', editContext);

    // Beispiel: Formular-Daten sammeln
    const formData = {
        anrede: document.getElementById('editAnrede').value,
        titel: document.getElementById('editTitel').value,
        vorname: document.getElementById('editVorname').value,
        nachname: document.getElementById('editNachname').value,
        geburtsdatum: document.getElementById('editGeburtsdatum').value,
        email: document.getElementById('editEmail').value,
        telefonMobil: document.getElementById('editTelefonMobil').value,
        telefonFestnetz: document.getElementById('editTelefonFestnetz').value,
        strasse: document.getElementById('editStrasse').value,
        hausnummer: document.getElementById('editHausnummer').value,
        plz: document.getElementById('editPLZ').value,
        ort: document.getElementById('editOrt').value,
        beitrag: document.getElementById('editBeitrag').value,
        intervall: document.getElementById('editIntervall').value,
        iban: document.getElementById('editIBAN').value,
        bic: document.getElementById('editBIC').value,
        kontoinhaber: document.getElementById('editKontoinhaber').value
    };

    console.log('Formulardaten:', formData);

    closeEditModal();
    await showAlert('Erfolg', 'Änderungen wurden gespeichert.', 'success');

    // Tabelle neu rendern
    renderRecordsTable();
    renderBestandTable();
}

// ========== COLUMNS MODAL ==========
function openColumnsModal(type) {
    columnsContext.type = type;

    // Titel setzen
    const title = type === 'records' ? 'Spalten: Neumitglieder / Erhöhungen' : 'Spalten: Bestandsmitglieder';
    document.getElementById('columnsModalTitle').textContent = title;

    // Temporäre Kopie erstellen
    tempColumnsConfig = JSON.parse(JSON.stringify(currentColumnsConfig[type]));

    // Liste rendern
    renderColumnsList();

    // Vorlagen rendern
    renderTemplatesList();

    // Name-Input verstecken
    document.getElementById('templateNameInput').style.display = 'none';

    // Modal öffnen
    document.getElementById('columnsModal').classList.add('active');
}

function closeColumnsModal() {
    document.getElementById('columnsModal').classList.remove('active');
    columnsContext.type = null;
    // Name-Input verstecken
    document.getElementById('templateNameInput').style.display = 'none';
}

function renderColumnsList() {
    const list = document.getElementById('columnsList');
    if (!list) return;

    list.innerHTML = tempColumnsConfig.map((col, index) => `
        <div class="column-item ${col.required ? 'disabled' : ''}"
             draggable="true"
             data-index="${index}"
             ondragstart="handleDragStart(event)"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event)"
             ondragend="handleDragEnd(event)">
            <div class="column-item-drag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"/>
                </svg>
            </div>
            <input type="checkbox"
                   class="column-item-checkbox"
                   ${col.visible ? 'checked' : ''}
                   ${col.required ? 'disabled' : ''}
                   onchange="toggleColumnVisibility(${index})">
            <span class="column-item-label">${col.label}</span>
        </div>
    `).join('');
}

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.column-item');
    if (item && parseInt(item.dataset.index) !== draggedIndex) {
        item.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const item = e.target.closest('.column-item');
    if (item) {
        item.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const item = e.target.closest('.column-item');
    if (!item) return;

    const dropIndex = parseInt(item.dataset.index);
    item.classList.remove('drag-over');

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        // Array umordnen
        const [movedItem] = tempColumnsConfig.splice(draggedIndex, 1);
        tempColumnsConfig.splice(dropIndex, 0, movedItem);
        renderColumnsList();
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedIndex = null;
    // Alle drag-over Klassen entfernen
    document.querySelectorAll('.column-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function toggleColumnVisibility(index) {
    if (!tempColumnsConfig[index].required) {
        tempColumnsConfig[index].visible = !tempColumnsConfig[index].visible;
    }
}

function resetColumns() {
    // Zurück zu den Standard-Definitionen
    tempColumnsConfig = JSON.parse(JSON.stringify(columnDefinitions[columnsContext.type]));
    renderColumnsList();
}

function saveColumns() {
    const type = columnsContext.type;

    // Konfiguration speichern
    currentColumnsConfig[type] = JSON.parse(JSON.stringify(tempColumnsConfig));

    // Tabelle aktualisieren
    if (type === 'records') {
        renderRecordsTable();
    } else {
        renderBestandTable();
    }

    closeColumnsModal();
}

// Globale Funktion um Spalten-Sichtbarkeit in Render-Funktionen zu berücksichtigen
function getVisibleColumns(type) {
    return currentColumnsConfig[type].filter(col => col.visible).map(col => col.id);
}

function isColumnVisible(type, colId) {
    const col = currentColumnsConfig[type].find(c => c.id === colId);
    return col ? col.visible : true;
}

// ========== VORLAGEN SYSTEM ==========
const MAX_TEMPLATES = 3;

// Vorlagen aus localStorage laden oder leer initialisieren
let columnTemplates = {
    records: JSON.parse(localStorage.getItem('columnTemplates_records') || '[]'),
    bestand: JSON.parse(localStorage.getItem('columnTemplates_bestand') || '[]')
};

function saveTemplatesToStorage(type) {
    localStorage.setItem(`columnTemplates_${type}`, JSON.stringify(columnTemplates[type]));
}

function renderTemplatesList() {
    const type = columnsContext.type;
    const templates = columnTemplates[type];
    const list = document.getElementById('templatesList');
    const addBtn = document.getElementById('templateAddBtn');

    if (!list || !addBtn) return;

    if (templates.length === 0) {
        list.innerHTML = '<div class="template-empty">Keine Vorlagen</div>';
    } else {
        list.innerHTML = templates.map((tpl, index) => {
            const visibleCount = tpl.config.filter(c => c.visible).length;
            return `
                <div class="template-item" onclick="applyTemplate(${index})">
                    <div class="template-item-icon">${index + 1}</div>
                    <div class="template-item-info">
                        <div class="template-item-name">${tpl.name}</div>
                        <div class="template-item-count">${visibleCount} Spalten</div>
                    </div>
                    <button class="template-item-delete" onclick="event.stopPropagation(); deleteTemplate(${index})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    // Add-Button deaktivieren wenn max erreicht
    addBtn.disabled = templates.length >= MAX_TEMPLATES;
    if (templates.length >= MAX_TEMPLATES) {
        addBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
            </svg>
            Max. ${MAX_TEMPLATES} Vorlagen
        `;
    } else {
        addBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
            </svg>
            Als Vorlage speichern
        `;
    }
}

function startAddTemplate() {
    const type = columnsContext.type;
    if (columnTemplates[type].length >= MAX_TEMPLATES) return;

    const input = document.getElementById('templateNameInput');
    const addBtn = document.getElementById('templateAddBtn');

    addBtn.style.display = 'none';
    input.style.display = 'block';
    input.value = '';
    input.focus();
}

function handleTemplateNameKeydown(e) {
    if (e.key === 'Enter') {
        saveNewTemplate();
    } else if (e.key === 'Escape') {
        cancelAddTemplate();
    }
}

function saveNewTemplate() {
    const type = columnsContext.type;
    const input = document.getElementById('templateNameInput');
    const name = input.value.trim();

    if (!name) {
        cancelAddTemplate();
        return;
    }

    // Neue Vorlage hinzufügen
    columnTemplates[type].push({
        name: name,
        config: JSON.parse(JSON.stringify(tempColumnsConfig))
    });

    saveTemplatesToStorage(type);
    cancelAddTemplate();
    renderTemplatesList();
}

function cancelAddTemplate() {
    const input = document.getElementById('templateNameInput');
    const addBtn = document.getElementById('templateAddBtn');

    input.style.display = 'none';
    addBtn.style.display = 'flex';
}

function applyTemplate(index) {
    const type = columnsContext.type;
    const template = columnTemplates[type][index];

    if (template) {
        // Temporäre Config mit Vorlage überschreiben
        tempColumnsConfig = JSON.parse(JSON.stringify(template.config));
        renderColumnsList();
    }
}

function deleteTemplate(index) {
    const type = columnsContext.type;
    columnTemplates[type].splice(index, 1);
    saveTemplatesToStorage(type);
    renderTemplatesList();
}

// ========== MODAL EVENT LISTENERS ==========
function initModalEventListeners() {
    // Storno Modal
    const stornoModal = document.getElementById('stornoModal');
    if (stornoModal) {
        stornoModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeStornoModal();
            }
        });
    }

    // Edit Modal
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditModal();
            }
        });
    }

    // Columns Modal
    const columnsModal = document.getElementById('columnsModal');
    if (columnsModal) {
        columnsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeColumnsModal();
            }
        });
    }

    // Escape schließt Modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (stornoModal && stornoModal.classList.contains('active')) {
                closeStornoModal();
            }
            if (editModal && editModal.classList.contains('active')) {
                closeEditModal();
            }
            if (columnsModal && columnsModal.classList.contains('active')) {
                closeColumnsModal();
            }
        }
    });
}

// ========== INIT ==========
function initDatensaetze(config = {}) {
    // Daten übernehmen wenn vorhanden
    if (config.recordsData) {
        recordsData = config.recordsData;
    }
    if (config.bestandData) {
        bestandData = config.bestandData;
    }
    if (config.historyData) {
        Object.assign(historyData, config.historyData);
    }

    // Tabellen rendern
    renderRecordsTable();
    renderBestandTable();

    // Context Badge setzen wenn vorhanden
    if (config.contextData) {
        setContextBadge(config.contextData);
        updateBestandTabVisibility(config.contextData.type);
    }

    // Iframe-Check
    if (window.self !== window.top) {
        document.body.classList.add('in-iframe');
    }

    // Modal Event Listeners initialisieren
    initModalEventListeners();
}

// Auto-Init wenn DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Nur Modal-Listener initialisieren wenn die nötigen Elemente vorhanden sind
    if (document.getElementById('recordsTableBody') || document.getElementById('bestandTableBody')) {
        initModalEventListeners();
    }
});

console.log('%c Datensätze-System geladen ', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
