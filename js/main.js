/**
 * Buttons - Zentrale Button-Hilfsfunktionen
 *
 * Enthält:
 * - Button Loading States
 * - Button Enable/Disable
 * - Allgemeine Button-Handler
 */

// ===================================================
// BUTTON LOADING STATES
// ===================================================

/**
 * Setzt einen Button in den Ladezustand
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {string} [loadingText] - Optional: Text während des Ladens
 * @returns {Object} - Restore-Objekt mit original Daten
 */
function setButtonLoading(button, loadingText = 'Lädt...') {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return null;

    const original = {
        text: btn.innerHTML,
        disabled: btn.disabled,
        width: btn.style.minWidth
    };

    // Breite fixieren um Layout-Sprung zu vermeiden
    btn.style.minWidth = btn.offsetWidth + 'px';
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;

    return original;
}

/**
 * Entfernt den Ladezustand von einem Button
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {Object} original - Original-Daten von setButtonLoading
 */
function resetButtonLoading(button, original) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn || !original) return;

    btn.innerHTML = original.text;
    btn.disabled = original.disabled;
    btn.style.minWidth = original.width;
    btn.classList.remove('btn-loading');
}

/**
 * Führt eine async Aktion mit automatischem Loading-State aus
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {Function} action - Async Funktion die ausgeführt werden soll
 * @param {string} [loadingText] - Optional: Text während des Ladens
 * @returns {Promise} - Promise der Aktion
 */
async function withButtonLoading(button, action, loadingText = 'Lädt...') {
    const original = setButtonLoading(button, loadingText);
    try {
        return await action();
    } finally {
        resetButtonLoading(button, original);
    }
}

// ===================================================
// BUTTON ENABLE/DISABLE
// ===================================================

/**
 * Aktiviert oder deaktiviert einen Button
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {boolean} enabled - true = aktivieren, false = deaktivieren
 */
function setButtonEnabled(button, enabled) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return;

    btn.disabled = !enabled;
    btn.classList.toggle('btn-disabled', !enabled);
}

/**
 * Aktiviert mehrere Buttons
 * @param {Array<HTMLElement|string>} buttons - Array von Button-Elementen oder IDs
 */
function enableButtons(buttons) {
    buttons.forEach(btn => setButtonEnabled(btn, true));
}

/**
 * Deaktiviert mehrere Buttons
 * @param {Array<HTMLElement|string>} buttons - Array von Button-Elementen oder IDs
 */
function disableButtons(buttons) {
    buttons.forEach(btn => setButtonEnabled(btn, false));
}

// ===================================================
// NAVIGATION
// ===================================================

/**
 * Navigiert zur vorherigen Seite oder zu einer Fallback-URL
 * @param {string} [fallbackUrl='/'] - URL falls keine History vorhanden
 */
function goBack(fallbackUrl = '/') {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = fallbackUrl;
    }
}

// ===================================================
// CLICK HANDLER UTILITIES
// ===================================================

/**
 * Verhindert Doppelklicks auf einem Button
 * @param {HTMLElement} button - Button-Element
 * @param {Function} handler - Click-Handler
 * @param {number} [delay=500] - Sperrzeit in ms
 */
function preventDoubleClick(button, handler, delay = 500) {
    let isProcessing = false;

    button.addEventListener('click', async (e) => {
        if (isProcessing) {
            e.preventDefault();
            return;
        }

        isProcessing = true;
        try {
            await handler(e);
        } finally {
            setTimeout(() => {
                isProcessing = false;
            }, delay);
        }
    });
}

/**
 * Erstellt einen Debounced Click-Handler
 * @param {Function} handler - Original Handler
 * @param {number} [wait=300] - Wartezeit in ms
 * @returns {Function} - Debounced Handler
 */
function debounceClick(handler, wait = 300) {
    let timeout;
    return function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(() => handler.call(this, e), wait);
    };
}

// ===================================================
// TOGGLE BUTTONS
// ===================================================

/**
 * Wechselt den aktiven Zustand in einer Button-Gruppe
 * @param {HTMLElement} clickedButton - Der geklickte Button
 * @param {string} groupSelector - CSS-Selektor für die Button-Gruppe
 * @param {string} [activeClass='active'] - CSS-Klasse für aktiven Zustand
 */
function toggleButtonGroup(clickedButton, groupSelector, activeClass = 'active') {
    const buttons = document.querySelectorAll(groupSelector);
    buttons.forEach(btn => btn.classList.remove(activeClass));
    clickedButton.classList.add(activeClass);
}

/**
 * Toggle Button mit On/Off Zustand
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {boolean} [forceState] - Optional: Zustand erzwingen
 * @returns {boolean} - Neuer Zustand
 */
function toggleButton(button, forceState) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return false;

    const newState = forceState !== undefined ? forceState : !btn.classList.contains('active');
    btn.classList.toggle('active', newState);
    btn.setAttribute('aria-pressed', newState);

    return newState;
}

// ===================================================
// BUTTON FEEDBACK
// ===================================================

/**
 * Zeigt kurzes visuelles Feedback auf einem Button
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {string} type - 'success' oder 'error'
 * @param {number} [duration=1500] - Dauer in ms
 */
function showButtonFeedback(button, type, duration = 1500) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return;

    const feedbackClass = type === 'success' ? 'btn-success-flash' : 'btn-error-flash';
    btn.classList.add(feedbackClass);

    setTimeout(() => {
        btn.classList.remove(feedbackClass);
    }, duration);
}

/**
 * Zeigt "Kopiert!" Feedback
 * @param {HTMLElement|string} button - Button-Element oder ID
 * @param {string} [originalText] - Original-Text zum Wiederherstellen
 */
function showCopyFeedback(button, originalText) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return;

    const original = originalText || btn.innerHTML;
    btn.innerHTML = '✓ Kopiert!';
    btn.classList.add('btn-copied');

    setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('btn-copied');
    }, 2000);
}

// ===================================================
// EXPORTS
// ===================================================

// Global verfügbar machen
window.setButtonLoading = setButtonLoading;
window.resetButtonLoading = resetButtonLoading;
window.withButtonLoading = withButtonLoading;
window.setButtonEnabled = setButtonEnabled;
window.enableButtons = enableButtons;
window.disableButtons = disableButtons;
window.goBack = goBack;
window.preventDoubleClick = preventDoubleClick;
window.debounceClick = debounceClick;
window.toggleButtonGroup = toggleButtonGroup;
window.toggleButton = toggleButton;
window.showButtonFeedback = showButtonFeedback;
window.showCopyFeedback = showCopyFeedback;
/**
 * ========================================
 * MODALS.JS - Zentrale Modal-Funktionen
 * ========================================
 *
 * Enthält:
 * - Modal-Dialog-System (showAlert, showConfirm, showPrompt)
 * - Modal-Templates (Storno, Columns, Edit, Import, Export, etc.)
 * - Kalender-Modal
 *
 * ========================================
 */

// =====================================================
// MODAL-DIALOG-SYSTEM (Alert, Confirm, Prompt)
// =====================================================

// Container für das Modal-System (wird beim ersten Aufruf erstellt)
let modalContainer = null;

// Icons für verschiedene Modal-Typen
const MODAL_ICONS = {
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    question: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`
};

/**
 * Erstellt den Modal-Container (wird nur einmal erstellt)
 */
function ensureModalContainer() {
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'customModalContainer';
        document.body.appendChild(modalContainer);
    }
    return modalContainer;
}

/**
 * Erstellt und zeigt ein Modal an
 * @private
 */
function createModal(options) {
    return new Promise((resolve) => {
        const container = ensureModalContainer();

        // Modal-HTML erstellen
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        overlay.innerHTML = `
            <div class="custom-modal">
                <div class="custom-modal-icon ${options.type || 'info'}">
                    ${MODAL_ICONS[options.type] || MODAL_ICONS.info}
                </div>
                <div class="custom-modal-title">${options.title || 'Hinweis'}</div>
                <div class="custom-modal-message">${options.message || ''}</div>
                ${options.showInput ? `
                    <input type="text" class="eingabefeld"
                           placeholder="${options.placeholder || ''}"
                           value="${options.defaultValue || ''}">
                ` : ''}
                <div class="custom-modal-buttons">
                    ${options.showCancel ? `
                        <button class="custom-modal-btn cancel" data-action="cancel">
                            ${options.cancelText || 'Abbrechen'}
                        </button>
                    ` : ''}
                    <button class="custom-modal-btn ${options.confirmClass || 'confirm'}" data-action="confirm">
                        ${options.confirmText || 'OK'}
                    </button>
                </div>
            </div>
        `;

        container.appendChild(overlay);

        // Input-Feld fokussieren wenn vorhanden
        const input = overlay.querySelector('.eingabefeld');

        // Modal anzeigen (mit kleiner Verzögerung für Animation)
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            if (input) {
                input.focus();
                input.select();
            }
        });

        // Event-Handler für Buttons
        const handleAction = (action) => {
            overlay.classList.remove('active');

            setTimeout(() => {
                overlay.remove();

                if (action === 'confirm') {
                    if (options.showInput) {
                        resolve(input.value);
                    } else if (options.showCancel) {
                        resolve(true);
                    } else {
                        resolve();
                    }
                } else {
                    if (options.showInput) {
                        resolve(null);
                    } else {
                        resolve(false);
                    }
                }
            }, 300);
        };

        // Button-Klicks
        overlay.querySelectorAll('.custom-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => handleAction(btn.dataset.action));
        });

        // Overlay-Klick schließt (außer bei Confirm/Prompt)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && !options.showCancel && !options.showInput) {
                handleAction('confirm');
            }
        });

        // Enter-Taste bestätigt
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleAction('confirm');
                } else if (e.key === 'Escape') {
                    handleAction('cancel');
                }
            });
        }

        // Escape-Taste schließt
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleAction(options.showCancel || options.showInput ? 'cancel' : 'confirm');
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Zeigt einen Alert-Dialog (ersetzt alert())
 *
 * @param {string} title - Titel des Dialogs
 * @param {string} message - Nachricht
 * @param {string} type - 'info' | 'success' | 'warning' | 'error'
 * @returns {Promise<void>}
 *
 * @example
 * await showAlert('Erfolg', 'Daten wurden gespeichert!', 'success');
 */
async function showAlert(title, message, type = 'info') {
    return createModal({
        title,
        message,
        type,
        showCancel: false,
        showInput: false,
        confirmText: 'OK'
    });
}

/**
 * Zeigt einen Bestätigungs-Dialog (ersetzt confirm())
 *
 * @param {string} title - Titel des Dialogs
 * @param {string} message - Frage an den Benutzer
 * @param {string} type - 'info' | 'warning' | 'error' | 'question'
 * @param {object} options - Optionale Einstellungen
 * @returns {Promise<boolean>} - true wenn bestätigt, false wenn abgebrochen
 *
 * @example
 * const confirmed = await showConfirm('Löschen', 'Wirklich löschen?', 'warning');
 * if (confirmed) {
 *     // Löschen durchführen
 * }
 */
async function showConfirm(title, message, type = 'question', options = {}) {
    return createModal({
        title,
        message,
        type,
        showCancel: true,
        showInput: false,
        confirmText: options.confirmText || 'Bestätigen',
        cancelText: options.cancelText || 'Abbrechen',
        confirmClass: options.danger ? 'danger' : 'confirm'
    });
}

/**
 * Zeigt einen Eingabe-Dialog (ersetzt prompt())
 *
 * @param {string} title - Titel des Dialogs
 * @param {string} message - Beschreibung/Frage
 * @param {string} defaultValue - Vorausgefüllter Wert
 * @param {object} options - Optionale Einstellungen
 * @returns {Promise<string|null>} - Eingegebener Text oder null wenn abgebrochen
 *
 * @example
 * const name = await showPrompt('Name', 'Bitte Namen eingeben:', 'Max');
 * if (name !== null) {
 *     console.log('Eingegebener Name:', name);
 * }
 */
async function showPrompt(title, message, defaultValue = '', options = {}) {
    return createModal({
        title,
        message,
        type: 'question',
        showCancel: true,
        showInput: true,
        defaultValue,
        placeholder: options.placeholder || '',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Abbrechen'
    });
}

// Globale Funktionen verfügbar machen
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;

// =====================================================
// UNSAVED CHANGES WARNING SYSTEM
// =====================================================

/**
 * Initialisiert die Warnung bei ungespeicherten Änderungen
 * @param {Object} options - Konfiguration
 * @param {string} options.backBtnSelector - Selector für den Zurück-Button (default: '.back-btn, .back-btn-secondary')
 */
function initUnsavedChangesWarning(options = {}) {
    let hasUnsavedChanges = false;
    const backBtnSelector = options.backBtnSelector || '.back-btn, .back-btn-secondary';

    // Änderungen tracken
    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('change', () => hasUnsavedChanges = true);
        el.addEventListener('input', () => hasUnsavedChanges = true);
    });

    // Zurück-Buttons abfangen
    async function handleBack(e) {
        e.preventDefault();
        if (hasUnsavedChanges) {
            const confirmed = await showConfirm(
                'Ungespeicherte Änderungen',
                'Es gibt ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?',
                'warning',
                { confirmText: 'Verlassen', cancelText: 'Abbrechen', danger: true }
            );
            if (!confirmed) return;
        }
        history.back();
    }

    document.querySelectorAll(backBtnSelector).forEach(btn => {
        btn.addEventListener('click', handleBack);
    });

    // API zurückgeben
    return {
        hasChanges: () => hasUnsavedChanges,
        markSaved: () => hasUnsavedChanges = false,
        markChanged: () => hasUnsavedChanges = true
    };
}

window.initUnsavedChangesWarning = initUnsavedChangesWarning;

// =====================================================
// TOAST NOTIFICATION SYSTEM
// =====================================================

/**
 * Zeigt eine Toast-Benachrichtigung an
 * @param {string} message - Nachricht
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} [title] - Optionaler Titel
 * @param {number} [duration=6000] - Anzeigedauer in ms
 */
function showToast(message, type = 'info', title = null, duration = 6000) {
    // Container erstellen falls nicht vorhanden
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
        error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
        warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
        info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    };

    const titles = {
        success: 'Erfolg',
        error: 'Fehler',
        warning: 'Warnung',
        info: 'Info'
    };

    toast.innerHTML = `
        <svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${icons[type] || icons.info}
        </svg>
        <div class="toast-content">
            <div class="toast-title text-normal--fett">${title || titles[type] || 'Info'}</div>
            <div class="toast-message text-klein--fett">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

window.showToast = showToast;

// =====================================================
// MODAL TEMPLATES SYSTEM
// =====================================================

// Fallback für lockBodyScroll/unlockBodyScroll falls nicht definiert
if (typeof lockBodyScroll !== 'function') {
    window.lockBodyScroll = function() {
        document.body.style.overflow = 'hidden';
    };
}
if (typeof unlockBodyScroll !== 'function') {
    window.unlockBodyScroll = function() {
        document.body.style.overflow = '';
    };
}

const ModalTemplates = {
    // Container für initialisierte Modals
    initialized: new Set(),

    // Init-Funktion: Fügt angeforderte Modals in die Seite ein
    init: function(modalNames) {
        modalNames.forEach(name => {
            if (this.initialized.has(name)) return;
            if (this.templates[name]) {
                document.body.insertAdjacentHTML('beforeend', this.templates[name]());
                this.initialized.add(name);
            }
        });
    },

    // Icons (zentrale Feather Icons)
    icons: {
        close: `<span class="icon icon--schliessen"></span>`,
        info: `<span class="icon icon--info"></span>`,
        drag: `<span class="icon icon--menu"></span>`,
        plus: `<span class="icon icon--plus"></span>`,
        warning: `<span class="icon icon--warnung"></span>`,
        trash: `<span class="icon icon--papierkorb"></span>`
    },

    /**
     * Modal-Template-Definitionen
     */
    templates: {
        /**
         * STORNO MODAL (Größe S - 420px)
         */
        storno: () => `
            <div class="modal modal-s" id="stornoModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift">Datensatz stornieren</span>
                                <span class="text-klein" id="stornoModalSubtitle">-</span>
                            </div>
                            <div class="page-header-mitte"></div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeStornoModal()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                        <div class="page-header-tabs">
                            <div class="kw-tab active" data-tab="daten">Daten</div>
                        </div>
                    </div>
                    <!-- Modal Body -->
                    <div class="page-content page-content--modal">
                        <div class="zeile">
                            <div class="eingabefeld-gruppe">
                                <label class="eingabefeld-beschriftung-oben">Storno-Grund</label>
                                <select class="eingabefeld" id="stornoGrund" onchange="toggleStornoGrundFreitext && toggleStornoGrundFreitext()">
                                    <option value="">Bitte auswählen...</option>
                                    <option value="widerruf">Widerruf</option>
                                    <option value="kuendigung">Kündigung</option>
                                    <option value="nichtzahlung">Nichtzahlung</option>
                                    <option value="doppelt">Doppelerfassung</option>
                                    <option value="fehler">Eingabefehler</option>
                                    <option value="sonstiges">Sonstiges</option>
                                    <option value="freitext">Freie Eingabe</option>
                                </select>
                                <span class="eingabefeld-beschriftung-unten"></span>
                                <div class="freitext-fields" id="stornoGrundFreitextFields">
                                    <input type="text" class="eingabefeld" id="stornoGrundFreitext" placeholder="Storno-Grund eingeben..." style="margin-top: var(--spacing-sm);">
                                </div>
                            </div>
                        </div>
                        <div class="zeile">
                            <div class="eingabefeld-gruppe">
                                <label class="eingabefeld-beschriftung-oben">Storno-Datum</label>
                                <input type="date" class="eingabefeld" id="stornoDatum">
                                <span class="eingabefeld-beschriftung-unten"></span>
                            </div>
                        </div>
                        <div class="zeile zeile--center">
                            <label class="toggle-switch">
                                <input type="checkbox" id="stornoBeschwerde" onchange="toggleBeschwerdeFields && toggleBeschwerdeFields()">
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="eingabefeld-gruppe">
                                <label class="eingabefeld-beschriftung-oben">Beschwerde</label>
                                <span class="eingabefeld-beschriftung-unten" id="beschwerdeLabel">Nein</span>
                            </div>
                        </div>
                        <div class="beschwerde-fields" id="beschwerdeFields">
                            <div class="zeile">
                                <div class="eingabefeld-gruppe">
                                    <label class="eingabefeld-beschriftung-oben">Beschwerdegrund</label>
                                    <textarea class="eingabefeld" id="beschwerdeGrund" rows="3" placeholder="Beschreiben Sie den Beschwerdegrund..."></textarea>
                                    <span class="eingabefeld-beschriftung-unten"></span>
                                </div>
                            </div>
                        </div>
                        <div class="zeile zeile--center">
                            <label class="toggle-switch">
                                <input type="checkbox" id="stornoMailBestaetigung">
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="eingabefeld-gruppe">
                                <label class="eingabefeld-beschriftung-oben">Storno per Mail bestätigen</label>
                                <span class="eingabefeld-beschriftung-unten"></span>
                            </div>
                        </div>
                    </div>
                    <!-- Modal Footer -->
                    <div class="page-footer">
                        <button class="btn btn-secondary" onclick="closeStornoModal()">Abbrechen</button>
                        <button class="btn btn-warning" onclick="confirmStorno()">Stornieren</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * COLUMNS MODAL (Größe XL - Vollbild)
         */
        columns: () => `
            <div class="modal modal-xl" id="columnsModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift" id="columnsModalTitle">Spalten konfigurieren</span>
                            </div>
                            <div class="page-header-mitte">
                                <span class="text-ueberschrift">Konfiguration</span>
                            </div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeColumnsModal()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                        <div class="page-header-tabs">
                            <div class="kw-tab active" data-tab="daten">Daten</div>
                        </div>
                    </div>
                    <!-- Modal Body Split -->
                    <div class="page-content--modal-split">
                        <div class="page-content page-content--modal">
                            <div class="modal-hint text-klein">
                                ${ModalTemplates.icons.info}
                                Ziehen zum Sortieren, Checkbox zum Ein-/Ausblenden
                            </div>
                            <div class="columns-list" id="columnsList">
                                <!-- Wird dynamisch gefüllt -->
                            </div>
                        </div>
                        <div class="page-content--modal-split-sidebar">
                            <div class="text-ueberschrift-unterabschnitt">Vorlagen</div>
                            <div class="templates-list" id="templatesList">
                                <!-- Wird dynamisch gefüllt -->
                            </div>
                            <button class="template-add-btn text-normal--fett" id="templateAddBtn" onclick="startAddTemplate && startAddTemplate()">
                                ${ModalTemplates.icons.plus}
                                Als Vorlage speichern
                            </button>
                            <input type="text" class="eingabefeld" id="templateNameInput"
                                   placeholder="Vorlagenname..."
                                   style="display: none;"
                                   onkeydown="handleTemplateNameKeydown && handleTemplateNameKeydown(event)">
                        </div>
                    </div>
                    <!-- Modal Footer -->
                    <div class="page-footer">
                        <button class="btn btn-secondary" onclick="resetColumns && resetColumns()">Zurücksetzen</button>
                        <button class="btn btn-primary" onclick="saveColumns && saveColumns()">Übernehmen</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * EDIT MODAL (Größe L - Split-View mit Sidebar)
         */
        edit: () => `
            <div class="modal modal-l" id="editModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift" id="editModalName">Max Mustermann</span>
                                <span class="text-klein"><span class="pill pill--neumitglied" id="editModalTypeBadge">NMG</span> <span id="editModalDate">Erstellt am 10.12.2025</span></span>
                            </div>
                            <div class="page-header-mitte">
                                <span class="text-ueberschrift">Bearbeiten</span>
                            </div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeEditModal()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                        <div class="page-header-tabs">
                            <div class="kw-tab active" data-tab="daten">Daten</div>
                        </div>
                    </div>

                    <!-- Modal Body Split -->
                    <div class="page-content--modal-split">
                        <!-- Linke Seite: Formular -->
                        <div class="page-content page-content--modal">
                            <!-- Persönliche Daten -->
                            <div class="unterabschnitt--card">
                                <div class="zeile">
                                    <div class="text-ueberschrift-unterabschnitt">Persönliche Daten</div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Anrede</label>
                                        <select class="eingabefeld" id="editAnrede">
                                            <option value="Herr">Herr</option>
                                            <option value="Frau">Frau</option>
                                            <option value="Divers">Divers</option>
                                        </select>
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Titel</label>
                                        <input type="text" class="eingabefeld" id="editTitel" placeholder="z.B. Dr.">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Vorname</label>
                                        <input type="text" class="eingabefeld" id="editVorname">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Nachname</label>
                                        <input type="text" class="eingabefeld" id="editNachname">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Geburtsdatum</label>
                                        <input type="date" class="eingabefeld" id="editGeburtsdatum">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">E-Mail</label>
                                        <input type="email" class="eingabefeld" id="editEmail">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Telefon Mobil</label>
                                        <input type="tel" class="eingabefeld" id="editTelefonMobil">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Telefon Festnetz</label>
                                        <input type="tel" class="eingabefeld" id="editTelefonFestnetz">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Adresse -->
                            <div class="unterabschnitt--card">
                                <div class="zeile">
                                    <div class="text-ueberschrift-unterabschnitt">Adresse</div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe eingabefeld-gruppe--flex-3">
                                        <label class="eingabefeld-beschriftung-oben">Straße</label>
                                        <input type="text" class="eingabefeld" id="editStrasse">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Hausnr.</label>
                                        <input type="text" class="eingabefeld" id="editHausnummer">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">PLZ</label>
                                        <input type="text" class="eingabefeld" id="editPLZ">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe eingabefeld-gruppe--flex-2">
                                        <label class="eingabefeld-beschriftung-oben">Ort</label>
                                        <input type="text" class="eingabefeld" id="editOrt">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Beitrag & Zahlung -->
                            <div class="unterabschnitt--card">
                                <div class="zeile">
                                    <div class="text-ueberschrift-unterabschnitt">Beitrag & Zahlung</div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Beitrag (€)</label>
                                        <input type="number" class="eingabefeld" id="editBeitrag" step="0.01">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Intervall</label>
                                        <select class="eingabefeld" id="editIntervall">
                                            <option value="monatlich">Monatlich</option>
                                            <option value="vierteljaehrlich">Vierteljährlich</option>
                                            <option value="halbjaehrlich">Halbjährlich</option>
                                            <option value="jaehrlich">Jährlich</option>
                                        </select>
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Jahreseuros</label>
                                        <input type="text" class="eingabefeld" id="editJE" disabled>
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">IBAN</label>
                                        <input type="text" class="eingabefeld" id="editIBAN">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">BIC</label>
                                        <input type="text" class="eingabefeld" id="editBIC">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Kontoinhaber</label>
                                        <input type="text" class="eingabefeld" id="editKontoinhaber">
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Zuordnung -->
                            <div class="unterabschnitt--card">
                                <div class="zeile">
                                    <div class="text-ueberschrift-unterabschnitt">Zuordnung</div>
                                </div>
                                <div class="zeile">
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Werbegebiet</label>
                                        <input type="text" class="eingabefeld" id="editGebiet" disabled>
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                    <div class="eingabefeld-gruppe">
                                        <label class="eingabefeld-beschriftung-oben">Werber</label>
                                        <input type="text" class="eingabefeld" id="editWerber" disabled>
                                        <span class="eingabefeld-beschriftung-unten"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Rechte Seite: Historie -->
                        <div class="page-content--modal-split-sidebar">
                            <div class="text-ueberschrift-unterabschnitt">Verlauf</div>
                            <div class="history-timeline" id="editHistoryTimeline">
                                <!-- Wird dynamisch gefüllt -->
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="page-footer">
                        <button class="btn btn-secondary" onclick="closeEditModal()">Abbrechen</button>
                        <button class="btn btn-primary" onclick="saveEditModal()">Speichern</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * IMPORT MODAL (Größe L - Multi-Step)
         */
        import: () => `
            <div class="modal modal-m" id="importModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift">Datensätze importieren</span>
                            </div>
                            <div class="page-header-mitte">
                                <div class="import-steps">
                                    <div class="import-step active" data-step="1">
                                        <span class="import-step-number">1</span>
                                        <span class="import-step-label">Datei</span>
                                    </div>
                                    <div class="import-step-line"></div>
                                    <div class="import-step" data-step="2">
                                        <span class="import-step-number">2</span>
                                        <span class="import-step-label">Spalten</span>
                                    </div>
                                    <div class="import-step-line"></div>
                                    <div class="import-step" data-step="3">
                                        <span class="import-step-number">3</span>
                                        <span class="import-step-label">Vorschau</span>
                                    </div>
                                </div>
                            </div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeModalById('importModal')">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                        <div class="page-header-tabs">
                            <div class="kw-tab active" data-tab="daten">Daten</div>
                        </div>
                    </div>

                    <!-- Step 1: Datei hochladen -->
                    <div class="page-content page-content--modal import-step-content" id="importStep1">
                        <div class="import-drop-zone" id="importDropZone">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                            </svg>
                            <span class="import-drop-text">Datei hierher ziehen</span>
                            <span class="import-drop-hint">oder klicken zum Auswählen</span>
                            <input type="file" id="importFileInput" accept=".xls,.xlsx,.csv,.odt" onchange="handleImportFileSelect(event)">
                        </div>
                        <div class="import-file-info" id="importFileInfo" style="display: none;">
                            <div class="import-file-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                                </svg>
                            </div>
                            <div class="import-file-details">
                                <span class="import-file-name" id="importFileName">datei.xlsx</span>
                                <span class="import-file-size" id="importFileSize">125 KB</span>
                            </div>
                            <button class="import-file-remove" onclick="removeImportFile()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="import-formats">
                            <span class="text-klein">Unterstützte Formate: XLS, XLSX, CSV, ODT</span>
                        </div>
                    </div>

                    <!-- Step 2: Spalten zuordnen -->
                    <div class="page-content page-content--modal import-step-content" id="importStep2" style="display: none;">
                        <div class="import-mapping-container">
                            <div class="import-mapping-section">
                                <div class="import-mapping-section-header">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>Erkannte Spalten</span>
                                    <span class="import-mapping-count" id="mappedCount">0</span>
                                </div>
                                <div class="import-mapping-list" id="mappedColumnsList">
                                    <!-- Wird per JS gefüllt -->
                                </div>
                            </div>

                            <div class="import-mapping-section import-mapping-section-warning" id="unmappedSection" style="display: none;">
                                <div class="import-mapping-section-header">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                    <span>Nicht erkannte Spalten</span>
                                    <span class="import-mapping-count warning" id="unmappedCount">0</span>
                                </div>
                                <div class="import-mapping-list" id="unmappedColumnsList">
                                    <!-- Wird per JS gefüllt -->
                                </div>
                            </div>

                            <div class="zeile">
                                <span class="text-klein">Übersprungene Spalten werden:</span>
                            </div>
                            <div class="zeile">
                                <label class="radio-label">
                                    <input type="radio" name="skipOption" value="hidden" checked>
                                    <span>Unsichtbar gespeichert (später anzeigbar)</span>
                                </label>
                            </div>
                            <div class="zeile">
                                <label class="radio-label">
                                    <input type="radio" name="skipOption" value="delete">
                                    <span>Nicht importiert</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Vorschau -->
                    <div class="page-content page-content--modal import-step-content" id="importStep3" style="display: none;">
                        <div class="zeile">
                            <span class="text-klein" id="importPreviewCount">10 von 50 Datensätzen</span>
                        </div>
                        <div class="import-preview-table-container">
                            <table class="table table--compact">
                                <thead id="importPreviewHead">
                                    <!-- Wird per JS gefüllt -->
                                </thead>
                                <tbody id="importPreviewBody">
                                    <!-- Wird per JS gefüllt -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="page-footer">
                        <button class="btn btn-secondary" onclick="closeModalById('importModal')">Abbrechen</button>
                        <button class="btn btn-secondary" id="importBackBtn" onclick="importStepBack()" style="display: none;">Zurück</button>
                        <button class="btn btn-primary" id="importNextBtn" onclick="importStepNext()" disabled>Weiter</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * EXPORT MODAL (Größe S - 520px)
         */
        export: () => `
            <div class="modal modal-m" id="exportModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift">Datensätze exportieren</span>
                            </div>
                            <div class="page-header-mitte"></div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeModalById('exportModal')">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                        <div class="page-header-tabs">
                            <div class="kw-tab active" data-tab="daten">Daten</div>
                        </div>
                    </div>
                    <!-- Modal Body -->
                    <div class="page-content page-content--modal">
                        <!-- Export Info -->
                        <div class="unterabschnitt--card">
                            <div class="zeile">
                                <span class="text-normal">Zu exportieren:</span>
                                <span class="text-normal" id="exportCountInfo" style="margin-left: auto;">Alle 15 Datensätze</span>
                            </div>
                            <div class="zeile" id="exportFilterInfo" style="display: none;">
                                <span class="text-normal">Filter:</span>
                                <span class="text-normal" id="exportFilterValue" style="margin-left: auto;">Alle</span>
                            </div>
                            <div class="zeile" id="exportPeriodInfo" style="display: none;">
                                <span class="text-normal">Zeitraum:</span>
                                <span class="text-normal" id="exportPeriodValue" style="margin-left: auto;">01.12.2025 - 10.12.2025</span>
                            </div>
                            <div class="zeile">
                                <span class="text-normal">Gesamt JE:</span>
                                <span class="text-normal text--highlight" id="exportTotalJE" style="margin-left: auto;">1.800,00 €</span>
                            </div>
                        </div>

                        <!-- Format Selection -->
                        <div class="zeile zeile--center">
                            <div class="eingabefeld-gruppe" style="width: 100%;">
                                <label class="eingabefeld-beschriftung-oben">Dateiformat</label>
                                <div class="export-format-options">
                                    <label class="export-format-option">
                                        <input type="radio" name="exportFormat" value="xlsx" checked>
                                        <span class="export-format-box">
                                            <span class="export-format-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                    <path d="M14 2v6h6M8 13h2M8 17h2M14 13h2M14 17h2"/>
                                                </svg>
                                            </span>
                                            <span class="export-format-name">XLSX</span>
                                            <span class="export-format-desc">Excel</span>
                                        </span>
                                    </label>
                                    <label class="export-format-option">
                                        <input type="radio" name="exportFormat" value="xls">
                                        <span class="export-format-box">
                                            <span class="export-format-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                    <path d="M14 2v6h6M8 13h2M8 17h2M14 13h2M14 17h2"/>
                                                </svg>
                                            </span>
                                            <span class="export-format-name">XLS</span>
                                            <span class="export-format-desc">Excel 97-2003</span>
                                        </span>
                                    </label>
                                    <label class="export-format-option">
                                        <input type="radio" name="exportFormat" value="csv">
                                        <span class="export-format-box">
                                            <span class="export-format-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                    <path d="M14 2v6h6M12 11v6M9 14h6"/>
                                                </svg>
                                            </span>
                                            <span class="export-format-name">CSV</span>
                                            <span class="export-format-desc">Komma-getrennt</span>
                                        </span>
                                    </label>
                                    <label class="export-format-option">
                                        <input type="radio" name="exportFormat" value="odt">
                                        <span class="export-format-box">
                                            <span class="export-format-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                                                </svg>
                                            </span>
                                            <span class="export-format-name">ODT</span>
                                            <span class="export-format-desc">OpenDocument</span>
                                        </span>
                                    </label>
                                </div>
                                <span class="eingabefeld-beschriftung-unten"></span>
                            </div>
                        </div>

                        <!-- Filename -->
                        <div class="zeile">
                            <div class="eingabefeld-gruppe" style="width: 100%;">
                                <label class="eingabefeld-beschriftung-oben">Dateiname</label>
                                <div class="export-filename-input">
                                    <input type="text" class="eingabefeld" id="exportFilename" value="datensaetze_export" placeholder="Dateiname eingeben...">
                                    <span class="export-filename-ext" id="exportFilenameExt">.xlsx</span>
                                </div>
                                <span class="eingabefeld-beschriftung-unten"></span>
                            </div>
                        </div>
                    </div>
                    <!-- Modal Footer -->
                    <div class="page-footer">
                        <button class="btn btn-secondary" onclick="closeModalById('exportModal')">Abbrechen</button>
                        <button class="btn btn-primary" onclick="confirmExport()">Exportieren</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * CONFIRM MODAL (Größe XS - 280px)
         */
        confirm: () => `
            <div class="modal modal-xs" id="confirmModal">
                <div class="page-container page-container--modal">
                    <div class="modal-body" style="text-align: center; padding: var(--spacing-lg);">
                        <div class="confirm-icon" id="confirmIcon" style="margin-bottom: var(--spacing-md);">
                            ${ModalTemplates.icons.warning}
                        </div>
                        <div class="text-ueberschrift-abschnitt" id="confirmTitle" style="margin-bottom: var(--spacing-xs);">Bestätigung</div>
                        <span class="text-klein" id="confirmMessage">Möchten Sie fortfahren?</span>
                    </div>
                    <div class="page-footer" style="justify-content: center;">
                        <button class="btn btn-secondary" onclick="closeConfirmModal()">Abbrechen</button>
                        <button class="btn btn-danger" id="confirmBtn" onclick="executeConfirm()">Bestätigen</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * DELETE CONFIRM SIMPLE MODAL (Größe XS - 400px)
         */
        deleteConfirmSimple: () => `
            <div class="modal modal-xs" id="deleteConfirmSimpleModal">
                <div class="page-container page-container--modal">
                    <div class="modal-body">
                        <div class="zeile zeile--header">
                            <div class="text-ueberschrift-abschnitt" id="deleteConfirmSimpleTitle">Löschen bestätigen</div>
                            <button class="btn btn-icon" onclick="closeDeleteConfirmSimpleModal()" style="margin-left: auto;">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="zeile">
                            <span class="text-normal" id="deleteConfirmSimpleMessage"></span>
                        </div>
                        <div class="zeile" id="deleteConfirmSimpleWarning" style="display: none;">
                            <span class="text-klein" style="color: var(--warning-text);">Diese Aktion kann nicht rückgängig gemacht werden.</span>
                        </div>
                    </div>
                    <div class="page-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeDeleteConfirmSimpleModal()">Abbrechen</button>
                        <button type="button" class="btn btn-danger" id="deleteConfirmSimpleBtn" onclick="executeDeleteConfirmSimple()">Löschen</button>
                    </div>
                </div>
            </div>
        `,

        /**
         * DELETE CONFIRM MODAL (Größe XS - 280px)
         */
        deleteConfirm: () => `
            <div class="modal modal-xs" id="deleteConfirmModal">
                <div class="page-container page-container--modal">
                    <div class="modal-body" style="text-align: center; padding: var(--spacing-lg);">
                        <div class="confirm-icon error" style="margin-bottom: var(--spacing-md);">
                            ${ModalTemplates.icons.trash}
                        </div>
                        <div class="text-ueberschrift-abschnitt" id="deleteConfirmTitle" style="margin-bottom: var(--spacing-xs);">Löschen bestätigen</div>
                        <span class="text-klein" id="deleteConfirmMessage">Dieser Eintrag wird unwiderruflich gelöscht.</span>
                    </div>
                    <div class="page-footer" style="justify-content: center;">
                        <button class="btn btn-secondary" onclick="closeDeleteConfirmModal()">Abbrechen</button>
                        <button class="btn btn-danger" onclick="executeDeleteConfirm()">Löschen</button>
                    </div>
                </div>
            </div>
        `
    },

    /**
     * Initialisiert die angeforderten Modals
     * @param {string[]} modalNames - Array von Modal-Namen zum Initialisieren
     */
    init(modalNames) {
        // Container für Modals erstellen falls nicht vorhanden
        let container = document.getElementById('modalContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }

        modalNames.forEach(name => {
            if (this.initialized.has(name)) {
                console.log(`Modal "${name}" bereits initialisiert`);
                return;
            }

            if (!this.templates[name]) {
                console.warn(`Modal-Template "${name}" nicht gefunden`);
                return;
            }

            // Template einfügen
            const template = this.templates[name]();
            container.insertAdjacentHTML('beforeend', template);
            this.initialized.add(name);
            console.log(`Modal "${name}" initialisiert`);
        });

        // Event-Listener für Overlay-Klick (Modal schließen)
        this.setupOverlayCloseHandlers();
    },

    /**
     * Richtet Event-Handler für das Schließen durch Overlay-Klick ein
     */
    setupOverlayCloseHandlers() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            if (overlay.dataset.closeHandlerSet) return;

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    overlay.classList.remove('open');
                    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
                }
            });
            overlay.dataset.closeHandlerSet = 'true';
        });
    },

    /**
     * Öffnet ein Modal
     * @param {string} name - Name des Modals
     * @param {object} data - Optionale Daten zum Befüllen
     */
    open(name, data = {}) {
        const modalId = this.getModalId(name);
        const modal = document.getElementById(modalId);

        if (!modal) {
            console.error(`Modal "${name}" (ID: ${modalId}) nicht gefunden`);
            return;
        }

        // Daten setzen falls vorhanden
        if (data.subtitle) {
            const subtitle = modal.querySelector('.modal-subtitle, [id$="Subtitle"]');
            if (subtitle) subtitle.textContent = data.subtitle;
        }
        if (data.title) {
            const title = modal.querySelector('.ueberschrift, [id$="Title"]');
            if (title) title.textContent = data.title;
        }
        if (data.message) {
            const message = modal.querySelector('[id$="Message"]');
            if (message) message.textContent = data.message;
        }

        modal.classList.add('active');
    },

    /**
     * Schließt ein Modal
     * @param {string} name - Name des Modals
     */
    close(name) {
        const modalId = this.getModalId(name);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Gibt die Modal-ID für einen Namen zurück
     * @param {string} name - Name des Modals
     * @returns {string} - Modal-ID
     */
    getModalId(name) {
        const idMap = {
            'storno': 'stornoModal',
            'columns': 'columnsModal',
            'confirm': 'confirmModal',
            'deleteConfirm': 'deleteConfirmModal',
            'delete': 'deleteConfirmModal'
        };
        return idMap[name] || `${name}Modal`;
    }
};

// ========================================
// GLOBALE HELPER-FUNKTIONEN FÜR MODALS
// ========================================

/**
 * Öffnet das Storno-Modal
 * @param {object} data - { name: string, id: number }
 */
function openStornoModal(data = {}) {
    const modal = document.getElementById('stornoModal');
    if (!modal) return;

    // Subtitle setzen
    const subtitle = document.getElementById('stornoModalSubtitle');
    if (subtitle && data.name) {
        subtitle.textContent = data.name;
    }

    // Datum auf heute setzen
    const dateInput = document.getElementById('stornoDatum');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Formular zurücksetzen
    const grund = document.getElementById('stornoGrund');
    if (grund) grund.value = '';

    const freitext = document.getElementById('stornoGrundFreitext');
    if (freitext) freitext.value = '';

    const freitextFields = document.getElementById('stornoGrundFreitextFields');
    if (freitextFields) freitextFields.classList.remove('visible');

    const beschwerde = document.getElementById('stornoBeschwerde');
    if (beschwerde) beschwerde.checked = false;

    const beschwerdeFields = document.getElementById('beschwerdeFields');
    if (beschwerdeFields) beschwerdeFields.classList.remove('visible');

    const mailBestaetigung = document.getElementById('stornoMailBestaetigung');
    if (mailBestaetigung) mailBestaetigung.checked = false;

    // Speichere aktuelle ID für spätere Verwendung
    modal.dataset.currentId = data.id || '';

    modal.classList.add('active');
}

/**
 * Schließt das Storno-Modal
 */
function closeStornoModal() {
    const modal = document.getElementById('stornoModal');
    if (modal) modal.classList.remove('active');
}

/**
 * Toggle für Storno-Grund Freitext-Feld
 */
function toggleStornoGrundFreitext() {
    const grund = document.getElementById('stornoGrund');
    const freitextFields = document.getElementById('stornoGrundFreitextFields');

    if (grund && freitextFields) {
        if (grund.value === 'freitext') {
            freitextFields.classList.add('visible');
        } else {
            freitextFields.classList.remove('visible');
        }
    }
}

/**
 * Toggle für Beschwerde-Felder
 */
function toggleBeschwerdeFields() {
    const checkbox = document.getElementById('stornoBeschwerde');
    const fields = document.getElementById('beschwerdeFields');

    if (checkbox && fields) {
        if (checkbox.checked) {
            fields.classList.add('visible');
        } else {
            fields.classList.remove('visible');
        }
    }
}

/**
 * Storno bestätigen
 */
async function confirmStorno() {
    const grundSelect = document.getElementById('stornoGrund')?.value;
    const grundFreitext = document.getElementById('stornoGrundFreitext')?.value;
    const datum = document.getElementById('stornoDatum')?.value;
    const beschwerde = document.getElementById('stornoBeschwerde')?.checked;
    const beschwerdeGrund = document.getElementById('beschwerdeGrund')?.value;
    const mailBestaetigung = document.getElementById('stornoMailBestaetigung')?.checked;

    if (!grundSelect) {
        showToast('Bitte Storno-Grund auswählen', 'warning');
        return;
    }

    if (grundSelect === 'freitext' && !grundFreitext?.trim()) {
        showToast('Bitte Storno-Grund eingeben', 'warning');
        return;
    }

    if (!datum) {
        showToast('Bitte Storno-Datum eingeben', 'warning');
        return;
    }

    const grund = grundSelect === 'freitext' ? grundFreitext : grundSelect;

    // Storno-Daten ausgeben
    console.log('Storno durchgeführt:', {
        grund,
        datum,
        beschwerde,
        beschwerdeGrund: beschwerde ? beschwerdeGrund : null,
        mailBestaetigung
    });

    closeStornoModal();
    showToast('Datensatz storniert', 'success');
}

// ========================================
// GENERISCHES CONFIRM MODAL SYSTEM
// ========================================

const ConfirmModalSystem = (function() {
    // State für alle Modal-Typen
    const state = {
        callback: null,
        data: null,
        step: 1,
        currentModalId: null
    };

    /**
     * Öffnet ein Confirm-Modal
     * @param {string} modalId - ID des Modal-Elements (z.B. 'confirmModal', 'deleteConfirmModal')
     * @param {Object} options - Konfiguration
     * @param {string} options.title - Modal-Titel
     * @param {string} options.message - Modal-Nachricht
     * @param {string} options.buttonText - Button-Text
     * @param {string} options.buttonClass - CSS-Klasse für Button
     * @param {Function} options.onConfirm - Callback bei Bestätigung
     * @param {any} options.data - Daten für Callback
     * @param {boolean} options.twoStep - Zweistufige Bestätigung (für Löschungen)
     * @param {string} options.secondTitle - Titel für zweiten Schritt
     * @param {string} options.secondMessage - Nachricht für zweiten Schritt
     * @param {string} options.secondButtonText - Button-Text für zweiten Schritt
     */
    function open(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // State zurücksetzen
        state.callback = options.onConfirm || null;
        state.data = options.data || null;
        state.step = 1;
        state.currentModalId = modalId;
        state.options = options;

        // Elemente mit Prefix suchen (unterstützt verschiedene Naming-Conventions)
        const prefix = modalId.replace('Modal', '');
        const title = document.getElementById(`${prefix}Title`) || modal.querySelector('.ueberschrift, .confirm-title');
        const message = document.getElementById(`${prefix}Message`) || modal.querySelector('.modal-message, .confirm-message');
        const warning = document.getElementById(`${prefix}Warning`);
        const btn = document.getElementById(`${prefix}Btn`) || modal.querySelector('.modal-btn-danger, .modal-btn-primary');

        if (title) title.textContent = options.title || 'Bestätigung';
        if (message) message.textContent = options.message || 'Möchten Sie fortfahren?';
        if (warning) warning.style.display = 'none';
        if (btn) {
            btn.textContent = options.buttonText || 'Bestätigen';
            if (options.buttonClass) {
                btn.className = 'modal-btn ' + options.buttonClass;
            }
        }

        modal.classList.add('active');
        if (typeof lockBodyScroll === 'function') lockBodyScroll();
    }

    /**
     * Schließt das aktuelle Modal
     */
    function close() {
        if (state.currentModalId) {
            const modal = document.getElementById(state.currentModalId);
            if (modal) modal.classList.remove('active');
        }
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();

        // State zurücksetzen
        state.callback = null;
        state.data = null;
        state.step = 1;
        state.currentModalId = null;
        state.options = null;
    }

    /**
     * Führt die Bestätigung aus (mit optionalem zweiten Schritt)
     */
    function execute() {
        const options = state.options || {};

        // Zweistufige Bestätigung?
        if (options.twoStep && state.step === 1) {
            state.step = 2;

            const modal = document.getElementById(state.currentModalId);
            if (!modal) return;

            const prefix = state.currentModalId.replace('Modal', '');
            const title = document.getElementById(`${prefix}Title`) || modal.querySelector('.ueberschrift, .confirm-title');
            const message = document.getElementById(`${prefix}Message`) || modal.querySelector('.modal-message, .confirm-message');
            const warning = document.getElementById(`${prefix}Warning`);
            const btn = document.getElementById(`${prefix}Btn`) || modal.querySelector('.modal-btn-danger, .modal-btn-primary');

            if (title) title.textContent = options.secondTitle || 'Sind Sie sicher?';
            if (message) message.textContent = options.secondMessage || 'Diese Aktion kann nicht rückgängig gemacht werden.';
            if (warning) warning.style.display = 'block';
            if (btn) btn.textContent = options.secondButtonText || 'Endgültig bestätigen';

            return;
        }

        // Callback ausführen
        if (typeof state.callback === 'function') {
            state.callback(state.data);
        }
        close();
    }

    return { open, close, execute };
})();

// Wrapper-Funktionen für Rückwärtskompatibilität
function openConfirmModal(options = {}) {
    ConfirmModalSystem.open('confirmModal', {
        ...options,
        buttonClass: options.buttonClass || 'modal-btn-danger'
    });
}

function closeConfirmModal() {
    ConfirmModalSystem.close();
}

function executeConfirm() {
    ConfirmModalSystem.execute();
}

function openDeleteConfirmSimpleModal(options = {}) {
    ConfirmModalSystem.open('deleteConfirmSimpleModal', {
        title: options.title || 'Löschen bestätigen',
        message: options.message || 'Möchten Sie diesen Eintrag wirklich löschen?',
        buttonText: options.buttonText || 'Löschen',
        onConfirm: options.onConfirm,
        data: options.data,
        twoStep: true,
        secondTitle: 'Sind Sie sicher?',
        secondMessage: 'Der Eintrag wird unwiderruflich gelöscht.',
        secondButtonText: 'Endgültig löschen'
    });
}

function closeDeleteConfirmSimpleModal() {
    ConfirmModalSystem.close();
}

function executeDeleteConfirmSimple() {
    ConfirmModalSystem.execute();
}

function openDeleteConfirmModal(options = {}) {
    ConfirmModalSystem.open('deleteConfirmModal', {
        title: options.title || 'Löschen bestätigen',
        message: options.message || 'Dieser Eintrag wird unwiderruflich gelöscht.',
        buttonText: options.buttonText || 'Löschen',
        buttonClass: 'modal-btn-danger',
        onConfirm: options.onConfirm,
        data: options.data
    });
}

function closeDeleteConfirmModal() {
    ConfirmModalSystem.close();
}

function executeDeleteConfirm() {
    ConfirmModalSystem.execute();
}

// =====================================================
// KALENDER MODAL
// =====================================================

const CalendarModal = (function() {
    let calendarStartDate = null;
    let calendarEndDate = null;
    let calendarHoverDate = null;
    let isSelectingStart = true;
    let calendarBaseYear = new Date().getFullYear();
    let calendarBaseMonth = new Date().getMonth();
    let onApplyCallback = null;

    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    function init() {
        // Modal HTML einfügen falls nicht vorhanden
        if (!document.getElementById('calendarModal')) {
            const modalHTML = `
                <div class="calendar-modal" id="calendarModal" onmousedown="if(event.target === this) CalendarModal.close()">
                    <div class="calendar-modal-content" onmousedown="event.stopPropagation()">
                        <div class="calendar-modal-header">
                            <h3>Individueller Zeitraum</h3>
                            <button class="btn btn-icon" onclick="CalendarModal.close()" title="Schließen">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div class="calendar-modal-body">
                            <div class="calendar-inputs">
                                <div class="calendar-field">
                                    <label>Von</label>
                                    <input type="text" id="calendarFromInput" placeholder="TT.MM.JJJJ">
                                    <div class="calendar-kw-picker mt-sm" id="calendarFromKwPicker">
                                        <button type="button" class="btn btn-sm btn-icon" id="calendarFromKwPrev" title="Vorherige KW">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                                        </button>
                                        <span class="text-klein" id="calendarFromKwDisplay" title="Klicken zum Bearbeiten"><span id="calendarFromKwNumber">KW --</span> <span class="text-klein" id="calendarFromKwYear">----</span></span>
                                        <input type="text" class="eingabefeld text-klein" id="calendarFromKwInput" placeholder="KW" maxlength="2">
                                        <button type="button" class="btn btn-sm btn-icon" id="calendarFromKwNext" title="Nächste KW">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="calendar-field">
                                    <label>Bis</label>
                                    <input type="text" id="calendarToInput" placeholder="TT.MM.JJJJ">
                                    <div class="calendar-kw-picker mt-sm" id="calendarToKwPicker">
                                        <button type="button" class="btn btn-sm btn-icon" id="calendarToKwPrev" title="Vorherige KW">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                                        </button>
                                        <span class="text-klein" id="calendarToKwDisplay" title="Klicken zum Bearbeiten"><span id="calendarToKwNumber">KW --</span> <span class="text-klein" id="calendarToKwYear">----</span></span>
                                        <input type="text" class="eingabefeld text-klein" id="calendarToKwInput" placeholder="KW" maxlength="2">
                                        <button type="button" class="btn btn-sm btn-icon" id="calendarToKwNext" title="Nächste KW">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="calendar-container" id="calendarContainer">
                                <div class="calendar-nav">
                                    <button type="button" class="calendar-nav-btn" onclick="CalendarModal.navigate(-1)" title="1 Monat zurück">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                        </svg>
                                    </button>
                                    <div class="calendar-year-selector">
                                        <button type="button" class="calendar-year-btn" onclick="CalendarModal.changeYear(-1)" title="Vorheriges Jahr">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                            </svg>
                                        </button>
                                        <span class="calendar-year-display" id="calendarYearDisplay"></span>
                                        <button type="button" class="calendar-year-btn" onclick="CalendarModal.changeYear(1)" title="Nächstes Jahr">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <button type="button" class="calendar-nav-btn" onclick="CalendarModal.navigate(1)" title="1 Monat vor">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="calendar-today-row">
                                    <button type="button" class="calendar-today-btn" onclick="CalendarModal.goToToday()">Heute</button>
                                </div>
                                <div class="calendar-months-grid">
                                    <div class="calendar-month" id="calendarMonth1"></div>
                                    <div class="calendar-month" id="calendarMonth2"></div>
                                    <div class="calendar-month" id="calendarMonth3"></div>
                                </div>
                            </div>
                        </div>
                        <div class="calendar-page-footer">
                            <button class="btn-cancel" onclick="CalendarModal.close()">Abbrechen</button>
                            <button class="btn-apply" onclick="CalendarModal.apply()">Anwenden</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Event-Delegation für Kalender
        const container = document.getElementById('calendarContainer');
        if (container && !container.dataset.initialized) {
            container.dataset.initialized = 'true';

            container.addEventListener('click', function(e) {
                const dayEl = e.target.closest('.calendar-day[data-date]');
                if (dayEl) {
                    selectDate(new Date(dayEl.dataset.date));
                }
            });

            container.addEventListener('mouseover', function(e) {
                const dayEl = e.target.closest('.calendar-day[data-date]');
                if (dayEl) {
                    if (calendarStartDate && !calendarEndDate) {
                        const newHoverDate = new Date(dayEl.dataset.date);
                        if (!calendarHoverDate || calendarHoverDate.getTime() !== newHoverDate.getTime()) {
                            calendarHoverDate = newHoverDate;
                            renderCalendars();
                        }
                    }
                }
            });

            container.addEventListener('mouseleave', function() {
                if (calendarHoverDate) {
                    calendarHoverDate = null;
                    renderCalendars();
                }
            });
        }

        // Input Events
        const fromInput = document.getElementById('calendarFromInput');
        const toInput = document.getElementById('calendarToInput');

        if (fromInput) {
            fromInput.addEventListener('focus', () => {
                isSelectingStart = true;
                fromInput.classList.add('active');
                if (toInput) toInput.classList.remove('active');
            });

            fromInput.addEventListener('input', function() {
                const date = parseGermanDate(this.value);
                if (date) {
                    calendarStartDate = date;
                    renderCalendars();
                    updateKwDisplays();
                }
            });
        }

        if (toInput) {
            toInput.addEventListener('focus', () => {
                isSelectingStart = false;
                toInput.classList.add('active');
                if (fromInput) fromInput.classList.remove('active');
            });

            toInput.addEventListener('input', function() {
                const date = parseGermanDate(this.value);
                if (date) {
                    calendarEndDate = date;
                    renderCalendars();
                    updateKwDisplays();
                }
            });
        }

        // KW-Picker Event Listeners
        const fromKwPrev = document.getElementById('calendarFromKwPrev');
        const fromKwNext = document.getElementById('calendarFromKwNext');
        const toKwPrev = document.getElementById('calendarToKwPrev');
        const toKwNext = document.getElementById('calendarToKwNext');

        if (fromKwPrev) fromKwPrev.addEventListener('click', () => changeKw('from', -1));
        if (fromKwNext) fromKwNext.addEventListener('click', () => changeKw('from', 1));
        if (toKwPrev) toKwPrev.addEventListener('click', () => changeKw('to', -1));
        if (toKwNext) toKwNext.addEventListener('click', () => changeKw('to', 1));

        // KW-Eingabe: Klick auf Anzeige → Input zeigen
        const fromKwDisplay = document.getElementById('calendarFromKwDisplay');
        const fromKwInput = document.getElementById('calendarFromKwInput');
        const toKwDisplay = document.getElementById('calendarToKwDisplay');
        const toKwInput = document.getElementById('calendarToKwInput');

        // Initial verstecken
        if (fromKwInput) fromKwInput.style.display = 'none';
        if (toKwInput) toKwInput.style.display = 'none';

        // Klick auf Anzeige → Input zeigen
        if (fromKwDisplay && fromKwInput) {
            fromKwDisplay.style.cursor = 'pointer';
            fromKwDisplay.addEventListener('click', () => showKwInput('from'));
        }
        if (toKwDisplay && toKwInput) {
            toKwDisplay.style.cursor = 'pointer';
            toKwDisplay.addEventListener('click', () => showKwInput('to'));
        }

        // Enter/Blur → KW übernehmen
        if (fromKwInput) {
            fromKwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyKwInput('from'); });
            fromKwInput.addEventListener('blur', () => applyKwInput('from'));
        }
        if (toKwInput) {
            toKwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyKwInput('to'); });
            toKwInput.addEventListener('blur', () => applyKwInput('to'));
        }
    }

    // KW-Input anzeigen
    function showKwInput(type) {
        const display = document.getElementById(type === 'from' ? 'calendarFromKwDisplay' : 'calendarToKwDisplay');
        const input = document.getElementById(type === 'from' ? 'calendarFromKwInput' : 'calendarToKwInput');
        if (display && input) {
            const displayWidth = display.offsetWidth;
            const displayHeight = display.offsetHeight;
            display.style.display = 'none';
            input.style.display = 'block';
            input.style.width = Math.max(displayWidth, 70) + 'px';
            input.style.height = Math.max(displayHeight, 28) + 'px';
            input.style.textAlign = 'center';
            input.value = '';
            input.focus();
        }
    }

    // KW-Input übernehmen
    function applyKwInput(type) {
        const display = document.getElementById(type === 'from' ? 'calendarFromKwDisplay' : 'calendarToKwDisplay');
        const input = document.getElementById(type === 'from' ? 'calendarFromKwInput' : 'calendarToKwInput');
        if (!display || !input) return;

        const kw = parseInt(input.value);
        const year = new Date().getFullYear();

        if (kw >= 1 && kw <= 53) {
            const monday = getMondayOfWeek(kw, year);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            if (type === 'from') {
                calendarStartDate = monday;
                document.getElementById('calendarFromInput').value = formatGermanDate(monday);
            } else {
                calendarEndDate = sunday;
                document.getElementById('calendarToInput').value = formatGermanDate(sunday);
            }
            renderCalendars();
            updateKwDisplays();
        }

        // Input verstecken, Anzeige zeigen
        input.style.display = 'none';
        display.style.display = 'inline';
    }

    // KW ändern (from oder to)
    function changeKw(type, delta) {
        const isFrom = type === 'from';
        let currentDate = isFrom ? calendarStartDate : calendarEndDate;

        if (!currentDate) {
            currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
        }

        // Montag der aktuellen KW finden
        const dayOfWeek = currentDate.getDay() || 7;
        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() - dayOfWeek + 1);

        // KW verschieben
        monday.setDate(monday.getDate() + (delta * 7));

        // Sonntag der KW berechnen
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        if (isFrom) {
            calendarStartDate = monday;
            document.getElementById('calendarFromInput').value = formatGermanDate(monday);
        } else {
            calendarEndDate = sunday;
            document.getElementById('calendarToInput').value = formatGermanDate(sunday);
        }

        renderCalendars();
        updateKwDisplays();
    }

    // KW-Anzeigen aktualisieren
    function updateKwDisplays() {
        const fromKwNumber = document.getElementById('calendarFromKwNumber');
        const fromKwYear = document.getElementById('calendarFromKwYear');
        const toKwNumber = document.getElementById('calendarToKwNumber');
        const toKwYear = document.getElementById('calendarToKwYear');

        if (calendarStartDate && fromKwNumber && fromKwYear) {
            const kw = getWeekNumber(calendarStartDate);
            fromKwNumber.textContent = 'KW ' + kw;
            fromKwYear.textContent = calendarStartDate.getFullYear();
        } else if (fromKwNumber && fromKwYear) {
            fromKwNumber.textContent = 'KW --';
            fromKwYear.textContent = '----';
        }

        if (calendarEndDate && toKwNumber && toKwYear) {
            const kw = getWeekNumber(calendarEndDate);
            toKwNumber.textContent = 'KW ' + kw;
            toKwYear.textContent = calendarEndDate.getFullYear();
        } else if (toKwNumber && toKwYear) {
            toKwNumber.textContent = 'KW --';
            toKwYear.textContent = '----';
        }
    }

    function open(callback) {
        onApplyCallback = callback;
        const modal = document.getElementById('calendarModal');
        if (!modal) {
            init();
        }

        // Reset
        calendarStartDate = null;
        calendarEndDate = null;
        calendarHoverDate = null;
        isSelectingStart = true;
        calendarBaseYear = new Date().getFullYear();
        calendarBaseMonth = new Date().getMonth();

        const fromInput = document.getElementById('calendarFromInput');
        const toInput = document.getElementById('calendarToInput');

        if (fromInput) {
            fromInput.value = '';
            fromInput.classList.add('active');
        }
        if (toInput) {
            toInput.value = '';
            toInput.classList.remove('active');
        }

        renderCalendars();
        updateKwDisplays();
        document.getElementById('calendarModal')?.classList.add('active');
    }

    function close() {
        document.getElementById('calendarModal')?.classList.remove('active');
    }

    function apply() {
        if (calendarStartDate && calendarEndDate) {
            const from = formatGermanDate(calendarStartDate);
            const to = formatGermanDate(calendarEndDate);
            if (onApplyCallback) {
                onApplyCallback(from, to, `${from} - ${to}`);
            }
            close();
        }
    }

    function navigate(months) {
        calendarBaseMonth += months;
        while (calendarBaseMonth > 11) {
            calendarBaseMonth -= 12;
            calendarBaseYear++;
        }
        while (calendarBaseMonth < 0) {
            calendarBaseMonth += 12;
            calendarBaseYear--;
        }
        renderCalendars();
    }

    function changeYear(delta) {
        calendarBaseYear += delta;
        renderCalendars();
    }

    function goToToday() {
        const today = new Date();
        calendarBaseYear = today.getFullYear();
        calendarBaseMonth = today.getMonth();
        renderCalendars();
    }

    function renderCalendars() {
        const yearDisplay = document.getElementById('calendarYearDisplay');
        if (yearDisplay) yearDisplay.textContent = calendarBaseYear;

        for (let i = 0; i < 3; i++) {
            const monthDate = new Date(calendarBaseYear, calendarBaseMonth - (2 - i), 1);
            renderMonth(document.getElementById(`calendarMonth${i + 1}`), monthDate);
        }
    }

    function renderMonth(container, date) {
        if (!container) return;

        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        let html = `
            <div class="calendar-month-header">${monthNames[month]} ${year}</div>
            <div class="calendar-weekdays">
                <div class="calendar-weekday">Mo</div>
                <div class="calendar-weekday">Di</div>
                <div class="calendar-weekday">Mi</div>
                <div class="calendar-weekday">Do</div>
                <div class="calendar-weekday">Fr</div>
                <div class="calendar-weekday">Sa</div>
                <div class="calendar-weekday">So</div>
            </div>
            <div class="calendar-days">
        `;

        // Vormonat
        const prevMonth = new Date(year, month, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            html += `<div class="calendar-day other-month">${day}</div>`;
        }

        // Aktueller Monat
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateObj = new Date(year, month, day);
            dateObj.setHours(0, 0, 0, 0);
            let classes = 'calendar-day';

            if (dateObj.getTime() === today.getTime()) {
                classes += ' today';
            }

            if (calendarStartDate && calendarEndDate) {
                const start = calendarStartDate.getTime();
                const end = calendarEndDate.getTime();
                const current = dateObj.getTime();

                if (current === start && current === end) {
                    classes += ' selected range-start range-end';
                } else if (current === start) {
                    classes += ' range-start';
                } else if (current === end) {
                    classes += ' range-end';
                } else if (current > start && current < end) {
                    classes += ' in-range';
                }
            } else if (calendarStartDate && !calendarEndDate && calendarHoverDate) {
                const start = calendarStartDate.getTime();
                const hover = calendarHoverDate.getTime();
                const current = dateObj.getTime();
                const rangeStart = Math.min(start, hover);
                const rangeEnd = Math.max(start, hover);

                if (current === start) {
                    classes += ' selected';
                } else if (current > rangeStart && current < rangeEnd) {
                    classes += ' in-range hover-preview';
                } else if (current === rangeEnd && current !== start) {
                    classes += ' in-range hover-preview';
                }
            } else if (calendarStartDate && dateObj.getTime() === calendarStartDate.getTime()) {
                classes += ' selected';
            }

            html += `<div class="${classes}" data-date="${dateObj.toISOString()}">${day}</div>`;
        }

        // Nächster Monat (immer auf 42 Zellen = 6 Zeilen auffüllen)
        const totalCells = startDay + lastDay.getDate();
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    function selectDate(date) {
        date.setHours(0, 0, 0, 0);

        const fromInput = document.getElementById('calendarFromInput');
        const toInput = document.getElementById('calendarToInput');

        if (isSelectingStart || !calendarStartDate) {
            isSelectingStart = false;
            calendarStartDate = date;
            calendarEndDate = null;
            calendarHoverDate = null;
            if (fromInput) fromInput.classList.remove('active');
            if (toInput) toInput.classList.add('active');
        } else {
            if (date < calendarStartDate) {
                calendarEndDate = calendarStartDate;
                calendarStartDate = date;
            } else {
                calendarEndDate = date;
            }
            calendarHoverDate = null;
            isSelectingStart = true;
        }

        if (fromInput) fromInput.value = calendarStartDate ? formatGermanDate(calendarStartDate) : '';
        if (toInput) toInput.value = calendarEndDate ? formatGermanDate(calendarEndDate) : '';

        renderCalendars();
        updateKwDisplays();
    }

    function formatGermanDate(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}.${month}.${year}`;
    }

    // parseGermanDate() - nutzt globale Funktion (window.parseGermanDate)

    return {
        init,
        open,
        close,
        apply,
        navigate,
        changeYear,
        goToToday
    };
})();

// Auto-Init Kalender wenn DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CalendarModal.init());
} else {
    CalendarModal.init();
}

// =====================================================
// CSS FÜR ZUSÄTZLICHE STYLES
// =====================================================

const additionalModalStyles = `
.freitext-fields,
.beschwerde-fields {
    display: none;
}

.freitext-fields.visible,
.beschwerde-fields.visible {
    display: block;
}

.beschwerde-fields {
    margin-top: 0;
    padding: 12px;
    background: #fef3c7;
    border-radius: 6px;
}

.templates-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    flex: 1;
    overflow-y: auto;
}

.template-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
}

.template-item:hover {
    border-color: var(--color-werber);
    background: var(--bg-hover);
}

.template-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
}

.template-add-btn:hover:not(:disabled) {
    border-color: var(--color-werber);
    color: var(--color-werber);
    background: var(--bg-hover);
}

.modal-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    color: var(--text-secondary);
}

.template-item-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    flex-shrink: 0;
}

.template-item-info {
    flex: 1;
    min-width: 0;
}

.template-item-name {
    color: var(--text-primary);
}

.template-item-count {
    color: var(--text-secondary);
}

.template-empty {
    color: var(--text-secondary);
    text-align: center;
    padding: 16px;
}

.column-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: grab;
    transition: all 0.15s;
}

.column-item:hover {
    border-color: var(--color-werber);
    background: var(--bg-hover);
}

.column-item.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.column-item.dragging {
    opacity: 0.5;
}

.column-item.drag-over {
    border-color: var(--color-werber);
    background: var(--bg-hover);
}

.column-item-drag {
    color: var(--text-secondary);
    cursor: grab;
}

.column-item-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.column-item-label {
    color: var(--text-primary);
    flex: 1;
}

`;

// Styles einfügen falls nicht vorhanden
function injectModalStyles() {
    if (document.getElementById('modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = additionalModalStyles;
    document.head.appendChild(style);
}

// Auto-inject styles on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModalStyles);
} else {
    injectModalStyles();
}

// =====================================================
// GLOBAL EXPORTS
// =====================================================

window.ModalTemplates = ModalTemplates;
window.openImportModal = function() { openModalById('importModal'); };
window.openExportModal = function() { openModalById('exportModal'); };
window.CalendarModal = CalendarModal;
window.openStornoModal = openStornoModal;
window.closeStornoModal = closeStornoModal;
window.toggleStornoGrundFreitext = toggleStornoGrundFreitext;
window.toggleBeschwerdeFields = toggleBeschwerdeFields;
window.confirmStorno = confirmStorno;
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.executeConfirm = executeConfirm;
window.openDeleteConfirmSimpleModal = openDeleteConfirmSimpleModal;
window.closeDeleteConfirmSimpleModal = closeDeleteConfirmSimpleModal;
window.executeDeleteConfirmSimple = executeDeleteConfirmSimple;
window.openDeleteConfirmModal = openDeleteConfirmModal;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.executeDeleteConfirm = executeDeleteConfirm;
window.ConfirmModalSystem = ConfirmModalSystem;

console.log('%c Modals.js geladen ', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');
console.log('Verfügbare Funktionen: showAlert(), showConfirm(), showPrompt(), ModalTemplates, CalendarModal');
/**
 * ========================================
 * KARTEN.JS - Zentrale Karten-Funktionen
 * ========================================
 *
 * Enthält:
 * - Badge-System (Initialen, Status-Icons, Stufen)
 * - Member-Cards (Mitglieder-Kärtchen)
 * - Audit-System (Änderungshistorie)
 *
 * ========================================
 */

// =====================================================
// BADGE SYSTEM
// =====================================================

/**
 * Initialen aus Namen generieren
 * @param {string} name - Vollständiger Name
 * @returns {string} - Initialen (2 Buchstaben)
 */
function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * SVG Symbol für Badge-Typen (Neumitglied, Erhöhung, Bestandsmitglied, Storno)
 * @param {string} type - Typ des Badges
 * @returns {string} - SVG HTML
 */
function getBadgeSymbolSVG(type) {
    const icons = {
        neumitglied: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        erhoehung: '<svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
        bestandsmitglied: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>',
        storno: '<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>'
    };
    return icons[type] || '';
}

/**
 * Type-Row mit optionalen TC/Q Badges generieren
 * @param {string} label - Typ-Label
 * @param {boolean} isTC - Ist Teamchef
 * @param {boolean} isQ - Hat Q-Status
 * @returns {string} - HTML
 */
function getBadgeTypeRow(label, isTC = false, isQ = false) {
    let extras = '';
    if (isTC) extras += '<span class="user-badge__extra user-badge__extra--tc">TC</span>';
    if (isQ) extras += '<span class="user-badge__extra user-badge__extra--q">Q</span>';

    if (extras) {
        return `<div class="user-badge__type-row">
            <span class="user-badge__type">${label}</span>
            ${extras}
        </div>`;
    }
    return `<span class="user-badge__type">${label}</span>`;
}

/**
 * Stufen-Badge HTML generieren (für Avatar)
 * @param {string} stufe - Stufen-Kürzel
 * @returns {string} - HTML
 */
function getStufeBadge(stufe) {
    if (!stufe) return '';
    const s = stufe.toLowerCase();
    return `<span class="user-badge__stufe user-badge__stufe--${s}">${stufe.toUpperCase()}</span>`;
}

/**
 * Komplettes Werber-Badge generieren
 * @param {object} options - Optionen
 * @returns {string} - HTML
 */
function createWerberBadge(options = {}) {
    const {
        name = 'Unbekannt',
        size = '',           // '', 'small', 'mini', 'large', 'xl'
        isTC = false,
        isQ = false,
        stufe = '',          // 'SMA', 'EMA', 'JMM', 'EMM', 'CEMM', 'SPB', 'KAD', 'FUE'
        style = ''           // zusätzliche inline styles
    } = options;

    const initials = getInitials(name);
    const sizeClass = size ? `user-badge--${size}` : '';
    const styleAttr = style ? ` style="${style}"` : '';

    return `<div class="user-badge user-badge--werber ${sizeClass}"${styleAttr}>
        <div class="user-badge__avatar">
            ${initials}
            ${getStufeBadge(stufe)}
        </div>
        <div class="user-badge__info">
            <span class="user-badge__name">${name}</span>
            ${getBadgeTypeRow('Werber', isTC, isQ)}
        </div>
    </div>`;
}

/**
 * Komplettes Badge für beliebigen Typ generieren
 * @param {object} options - Optionen
 * @returns {string} - HTML
 */
function createBadge(options = {}) {
    const {
        type = 'werber',     // 'kunde', 'werbegebiet', 'werber', 'kampagne', 'neumitglied', 'erhoehung', 'bestandsmitglied', 'storno'
        name = 'Unbekannt',
        size = '',           // '', 'small', 'mini', 'large', 'xl'
        isTC = false,
        isQ = false,
        stufe = '',          // nur für Werber
        style = '',
        image = ''           // Profilbild-URL (optional)
    } = options;

    const sizeClass = size ? `user-badge--${size}` : '';
    const styleAttr = style ? ` style="${style}"` : '';

    // Typ-spezifische Labels
    const typeLabels = {
        kunde: 'Kunde',
        werbegebiet: 'Werbegebiet',
        werber: 'Werber',
        kampagne: 'Kampagne',
        neumitglied: 'Neumitglied',
        erhoehung: 'Erhöhung',
        bestandsmitglied: 'Bestandsmitglied',
        storno: 'Storno'
    };

    // Symbol-basierte Typen (Neumitglied, Erhöhung, Bestandsmitglied, Storno)
    const symbolTypes = ['neumitglied', 'erhoehung', 'bestandsmitglied', 'storno'];
    const useSymbol = symbolTypes.includes(type);

    // Avatar: Bild > Symbol > Initialen
    let avatarContent;
    if (image) {
        // onerror: Bei Ladefehler auf Initialen zurückfallen
        const initials = getInitials(name).replace(/'/g, "\\'");
        avatarContent = `<img src="${image}" alt="${name}" onerror="this.outerHTML='${initials}'">`;
    } else if (useSymbol) {
        avatarContent = getBadgeSymbolSVG(type);
    } else {
        avatarContent = getInitials(name);
    }
    const stufeBadge = (type === 'werber' && stufe) ? getStufeBadge(stufe) : '';
    const typeRow = type === 'werber' ? getBadgeTypeRow(typeLabels[type], isTC, isQ) : `<span class="user-badge__type">${typeLabels[type]}</span>`;
    const avatarStufeClass = (type === 'werber' && stufe) ? `user-badge__avatar--${stufe.toLowerCase()}` : '';

    return `<div class="user-badge user-badge--${type} ${sizeClass}"${styleAttr}>
        <div class="user-badge__avatar ${avatarStufeClass}">
            ${avatarContent}
            ${stufeBadge}
        </div>
        <div class="user-badge__info">
            <span class="user-badge__name">${name}</span>
            ${typeRow}
        </div>
    </div>`;
}

/**
 * Stufen-Konfiguration (zentral für alle Dateien)
 */
const STUFEN_CONFIG = {
    SMA: { name: 'Starting Marketing Advisor', class: 'sma', color: '#78909C' },
    EMA: { name: 'Executive Marketing Advisor', class: 'ema', color: '#4CAF50' },
    JMM: { name: 'Junior Marketing Manager', class: 'jmm', color: '#2196F3' },
    EMM: { name: 'Executive Marketing Manager', class: 'emm', color: '#9C27B0' },
    CEMM: { name: 'Chief Executive Marketing Manager', class: 'cemm', color: '#E040FB' },
    SPB: { name: 'Spitzen Botschafter', class: 'spb', color: '#FFA500' },
    KAD: { name: 'Kadermanager', class: 'kad', color: '#FFD700' },
    FUE: { name: 'Führungsebene', class: 'fue', color: '#2C3E50' }
};

/**
 * Stufen-Name abrufen
 * @param {string} stufe - Stufen-Kürzel
 * @returns {string} - Vollständiger Name
 */
function getStufeName(stufe) {
    return STUFEN_CONFIG[stufe?.toUpperCase()]?.name || stufe || 'Unbekannt';
}

// =====================================================
// MEMBER CARDS (Mitglieder-Kärtchen)
// =====================================================

/**
 * Rendert ein einzelnes Mitglied-Kärtchen (schrieb-compact Design)
 *
 * @param {Object} m - Mitglied-Daten
 * @param {number} m.id - Mitglied-ID
 * @param {string} m.name - Name des Mitglieds (oder m.memberName)
 * @param {number} m.eh - Einheiten
 * @param {string} [m.typ] - 'NMG' oder 'ERH'
 * @param {string} m.werbegebiet - Werbegebiet
 * @param {string} m.strasse - Straße
 * @param {string} m.hausnr - Hausnummer
 * @param {string} m.uhrzeit - Uhrzeit
 * @param {string} m.emailStatus - 'sent', 'opened', 'not_sent'
 * @param {boolean} m.ibanFilled - IBAN vorhanden
 * @param {string} [m.botschafter] - Botschafter-Name (optional)
 * @param {string} [m.botschafterStufe] - Botschafter-Stufe (optional)
 * @returns {string} HTML
 */
function renderMemberCard(m) {
    // Name kann als "name" oder "memberName" kommen
    const memberName = m.name || m.memberName || 'Unbekannt';

    // Email-Icon bestimmen
    let emailClass = 'email-sent';
    let emailTitle = 'E-Mail versendet';
    if (m.emailStatus === 'opened') {
        emailClass = 'email-opened';
        emailTitle = 'E-Mail geöffnet';
    } else if (m.emailStatus === 'not_sent') {
        emailClass = 'email-not-sent';
        emailTitle = 'E-Mail nicht gesendet';
    }

    const emailIcon = `<svg class="schrieb-status-icon ${emailClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="${emailTitle}">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>`;

    // IBAN-Status
    const ibanHtml = m.ibanFilled
        ? '<span class="schrieb-iban filled" title="IBAN nachgetragen">IBAN</span>'
        : '<span class="schrieb-iban missing" title="IBAN fehlt noch">IBAN</span>';

    // User-Badge Klasse basierend auf Typ
    const badgeType = m.typ === 'NMG' ? 'neumitglied' : 'erhoehung';
    const badgeClass = `user-badge--${badgeType}`;
    const typeLabel = m.typ === 'NMG' ? 'Neumitglied' : 'Erhöhung';
    const badgeSVG = getBadgeSymbolSVG(badgeType);

    // WG Initialen
    const wgInitials = getInitials(m.werbegebiet);

    // Botschafter (optional)
    let botschafterHtml = '';
    if (m.botschafter) {
        const botschafterInitials = getInitials(m.botschafter);
        const stufeBadge = getStufeBadge(m.botschafterStufe || '');

        botschafterHtml = `
            <div class="user-badge user-badge--werber user-badge--mini">
                <div class="user-badge__avatar">${botschafterInitials}${stufeBadge}</div>
                <div class="user-badge__info">
                    <span class="user-badge__name">${m.botschafter}</span>
                    <span class="user-badge__type">Werber</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="schrieb-compact" onclick="openSchriebDetails(${m.id})" title="${memberName} - ${m.eh} EH">
            <div class="schrieb-compact-header">
                <div class="schrieb-compact-member">
                    <div class="user-badge ${badgeClass} user-badge--small">
                        <div class="user-badge__avatar">${badgeSVG}</div>
                        <div class="user-badge__info">
                            <span class="user-badge__name">${memberName}</span>
                            <span class="user-badge__type">${typeLabel}</span>
                        </div>
                    </div>
                    <div class="schrieb-compact-location">
                        <div class="user-badge user-badge--werbegebiet user-badge--mini">
                            <div class="user-badge__avatar">${wgInitials}</div>
                            <div class="user-badge__info">
                                <span class="user-badge__name">${m.werbegebiet}</span>
                            </div>
                        </div>
                        <span class="schrieb-compact-strasse"><span class="location-emoji">📍</span>${m.strasse} ${m.hausnr}</span>
                    </div>
                </div>
                <div class="schrieb-compact-meta">
                    <span class="schrieb-compact-time">${m.uhrzeit}</span>
                    <span class="schrieb-compact-eh">${m.eh} EH</span>
                </div>
            </div>
            <div class="schrieb-compact-footer">
                <div class="schrieb-compact-status">
                    ${emailIcon}
                    ${ibanHtml}
                </div>
                ${botschafterHtml}
            </div>
        </div>
    `;
}

/**
 * Rendert mehrere Mitglied-Kärtchen
 * @param {Array} mitglieder - Array von Mitglied-Objekten
 * @returns {string} HTML
 */
function renderMemberCards(mitglieder) {
    if (!mitglieder || mitglieder.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center;">Keine Mitglieder</p>';
    }
    return mitglieder.map(m => renderMemberCard(m)).join('');
}

/**
 * Standard Click-Handler für Kärtchen
 * Kann von der jeweiligen Seite überschrieben werden
 */
if (typeof openSchriebDetails !== 'function') {
    window.openSchriebDetails = function(id) {
        console.log('openSchriebDetails:', id);
    };
}

// =====================================================
// AUDIT SYSTEM (Änderungshistorie)
// =====================================================

// ============================================================================
// MOCK-DATEN (später durch echte API ersetzen)
// ============================================================================

// Generiert Mock-Daten für verschiedene Kontexte
const MOCK_AUDIT_DATA = {
    'nmg-erh': {},  // Wird dynamisch gefüllt
    'bestand': {}   // Wird dynamisch gefüllt
};

// Initialisiere Mock-Daten für verschiedene Kontexte
(function initMockData() {
    const contexts = [
        { id: 'einsatzgebiet-1', name: 'Ludwigshafen-Mitte e.V.' },
        { id: 'einsatzgebiet-2', name: 'Ludwigshafen-Süd e.V.' },
        { id: 'einsatzgebiet-3', name: 'Mannheim-Nord e.V.' },
        { id: 'kunde-1', name: 'ADAC e.V.' },
        { id: 'kunde-2', name: 'WWF Deutschland' },
        { id: 'kampagne-1', name: 'Frühjahrskampagne 2024' },
        { id: 'benutzer-1', name: 'Max Mustermann' },
        { id: 'default', name: 'Alle' }
    ];

    contexts.forEach(ctx => {
        MOCK_AUDIT_DATA['nmg-erh'][ctx.id] = generateMockAuditData('NMG/ERH', ctx.name);
        MOCK_AUDIT_DATA['bestand'][ctx.id] = generateMockAuditData('Bestand', ctx.name);
    });
})();

// Generiert realistische Mock-Audit-Daten
function generateMockAuditData(auditType, contextName) {
    const users = ['Max Mustermann', 'Anna Schmidt', 'Thomas Weber', 'Lisa Müller', 'Admin'];
    const members = [
        'Peter Schneider', 'Maria Wagner', 'Klaus Fischer', 'Sabine Becker',
        'Hans Hoffmann', 'Ursula Meyer', 'Wolfgang Schulz', 'Monika Koch',
        'Dieter Richter', 'Ingrid Wolf', 'Rainer Neumann', 'Petra Braun',
        'Michael Zimmermann', 'Andrea Krüger', 'Stefan Lang', 'Karin Baumann'
    ];
    const areas = ['Ludwigshafen-Mitte e.V.', 'Ludwigshafen-Süd e.V.', 'Mannheim-Nord e.V.', 'Heidelberg e.V.'];

    // Felder je nach Audit-Typ
    const fields = auditType === 'NMG/ERH'
        ? ['E-Mail', 'Telefon', 'Adresse', 'IBAN', 'Betrag', 'Zahlungsart', 'Startdatum']
        : ['E-Mail', 'Telefon', 'Adresse', 'IBAN', 'Betrag', 'Status', 'Notizen', 'Bankverbindung'];

    const entries = [];
    const now = new Date();

    // Generiere 50 Einträge
    for (let i = 0; i < 50; i++) {
        const type = ['add', 'delete', 'edit'][Math.floor(Math.random() * 3)];
        const timestamp = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000); // Letzte 7 Tage
        const user = users[Math.floor(Math.random() * users.length)];

        let entry = {
            id: i + 1,
            type: type,
            timestamp: timestamp,
            user: user,
            auditType: auditType,
            context: contextName
        };

        if (type === 'add') {
            // Gruppiertes Hinzufügen (1-30 Datensätze)
            const count = Math.floor(Math.random() * 30) + 1;
            const area = areas[Math.floor(Math.random() * areas.length)];
            entry.count = count;
            entry.area = area;
            entry.details = [];
            for (let j = 0; j < Math.min(count, 10); j++) {
                entry.details.push(members[Math.floor(Math.random() * members.length)]);
            }
            if (count > 10) {
                entry.details.push(`... und ${count - 10} weitere`);
            }
        } else if (type === 'delete') {
            // Gruppiertes Löschen (1-15 Datensätze)
            const count = Math.floor(Math.random() * 15) + 1;
            entry.count = count;
            entry.details = [];
            for (let j = 0; j < count; j++) {
                entry.details.push(members[Math.floor(Math.random() * members.length)]);
            }
        } else {
            // Einzelne Bearbeitung
            const member = members[Math.floor(Math.random() * members.length)];
            const field = fields[Math.floor(Math.random() * fields.length)];
            entry.member = member;
            entry.changes = [{
                field: field,
                oldValue: generateOldValue(field),
                newValue: generateNewValue(field)
            }];
            // Manchmal mehrere Felder geändert
            if (Math.random() > 0.7) {
                const field2 = fields[Math.floor(Math.random() * fields.length)];
                if (field2 !== field) {
                    entry.changes.push({
                        field: field2,
                        oldValue: generateOldValue(field2),
                        newValue: generateNewValue(field2)
                    });
                }
            }
        }

        entries.push(entry);
    }

    // Nach Zeit sortieren (neueste zuerst)
    entries.sort((a, b) => b.timestamp - a.timestamp);

    return entries;
}

function generateOldValue(field) {
    const values = {
        'E-Mail': 'alte.email@beispiel.de',
        'Telefon': '0621 12345',
        'Adresse': 'Alte Straße 1',
        'IBAN': 'DE89 3704 0044 0000 0000 00',
        'Betrag': '25,00 €',
        'Status': 'Aktiv',
        'Notizen': 'Alte Notiz',
        'Zahlungsart': 'Lastschrift',
        'Startdatum': '01.01.2024',
        'Bankverbindung': 'Sparkasse'
    };
    return values[field] || 'Alt';
}

function generateNewValue(field) {
    const values = {
        'E-Mail': 'neue.email@beispiel.de',
        'Telefon': '0621 98765',
        'Adresse': 'Neue Straße 42',
        'IBAN': 'DE89 3704 0044 1111 1111 11',
        'Betrag': '30,00 €',
        'Status': 'Inaktiv',
        'Notizen': 'Aktualisierte Notiz',
        'Zahlungsart': 'Überweisung',
        'Startdatum': '01.03.2024',
        'Bankverbindung': 'Volksbank'
    };
    return values[field] || 'Neu';
}

// ============================================================================
// AUDIT MODAL FUNKTIONEN
// ============================================================================

let currentAuditType = null;
let currentAuditContext = null;

/**
 * Öffnet das Audit-Modal
 * @param {string} auditType - 'nmg-erh' oder 'bestand'
 * @param {string} contextId - ID des Kontexts (Einsatzgebiet, Kunde, Kampagne, Benutzer)
 */
function openAuditModal(auditType, contextId = 'default') {
    currentAuditType = auditType;
    currentAuditContext = contextId;

    // Modal erstellen falls nicht vorhanden
    let modal = document.getElementById('auditModal');
    if (!modal) {
        modal = createAuditModal();
        document.body.appendChild(modal);
    }

    // Titel aktualisieren
    const titleEl = modal.querySelector('#auditModalTitle');
    if (titleEl) {
        titleEl.textContent = auditType === 'nmg-erh' ? 'Audit NMG/ERH' : 'Audit Bestand';
    }

    // Daten laden und rendern
    const typeData = MOCK_AUDIT_DATA[auditType] || {};
    const data = typeData[contextId] || typeData['default'] || [];
    renderAuditList(data);

    // Modal öffnen
    modal.classList.add('active');

    // ESC zum Schließen
    document.addEventListener('keydown', handleAuditEscape);
}

function closeAuditModal() {
    const modal = document.getElementById('auditModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.removeEventListener('keydown', handleAuditEscape);
}

function handleAuditEscape(e) {
    if (e.key === 'Escape') {
        closeAuditModal();
    }
}

function createAuditModal() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'auditModal';
    modalDiv.className = 'modal modal-m';
    modalDiv.onclick = (e) => {
        if (e.target === modalDiv) closeAuditModal();
    };

    modalDiv.innerHTML = `
        <div class="page-container page-container--modal">
            <!-- Modal Header -->
            <div class="page-header">
                <div class="page-header-row">
                    <div class="page-header-links">
                        <span class="text-ueberschrift" id="auditModalTitle">Audit-Log</span>
                    </div>
                    <div class="page-header-mitte"></div>
                    <div class="page-header-rechts">
                        <button class="btn btn-icon" onclick="closeAuditModal()">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="page-header-tabs">
                    <div class="kw-tab active" data-tab="daten">Daten</div>
                </div>
            </div>
            <!-- Modal Body -->
            <div class="page-content page-content--modal">
                <div class="audit-list" id="auditList">
                    <!-- Wird per JS gefüllt -->
                </div>
            </div>
        </div>
    `;

    return modalDiv;
}

function renderAuditList(data) {
    const list = document.getElementById('auditList');
    if (!list) return;

    if (!data || data.length === 0) {
        list.innerHTML = `
            <div class="zeile zeile--center">
                <span class="text-normal text--disabled">Keine Änderungen vorhanden</span>
            </div>
        `;
        return;
    }

    list.innerHTML = data.map(entry => renderAuditItem(entry)).join('');

    // Event-Listener für gruppierte Einträge
    list.querySelectorAll('.audit-item--grouped').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('open');
        });
    });
}

function renderAuditItem(entry) {
    const timeStr = formatAuditTime(entry.timestamp);
    const dateStr = formatAuditDate(entry.timestamp);
    const entryId = entry.id;
    const memberId = entry.member ? entry.member.replace(/\s+/g, '-').toLowerCase() : 'unknown';

    // Icon und Farbe je nach Typ
    let typeIcon = '';
    let typeClass = '';
    let titleText = '';
    let previewText = '';
    let previewClass = '';
    let detailsHtml = '';

    if (entry.type === 'add') {
        // Hinzugefügt: grün
        typeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 4v16m8-8H4"/></svg>`;
        typeClass = 'audit-color-gruen';
        titleText = `${entry.count} ${entry.count === 1 ? 'Datensatz' : 'Datensätze'} hinzugefügt${entry.area ? ` · ${entry.area}` : ''}`;
        if (entry.details) {
            previewText = entry.details.join(', ');
            previewClass = 'audit-color-gruen';
            detailsHtml = entry.details.map(d => `
                <div class="zeile">
                    <div class="eingabefeld-card-gruppe">
                        <span class="eingabefeld-beschriftung-oben">Person</span>
                        <div class="eingabefeld-card audit-color-gruen">${d}</div>
                        <span class="eingabefeld-beschriftung-unten audit-color-gruen">Hinzugefügt</span>
                    </div>
                </div>
            `).join('');
        }
    } else if (entry.type === 'delete') {
        // Gelöscht: rot, Namen rot durchgestrichen
        typeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
        typeClass = 'audit-color-rot';
        titleText = `${entry.count} ${entry.count === 1 ? 'Datensatz' : 'Datensätze'} gelöscht`;
        if (entry.details) {
            previewText = entry.details.join(', ');
            previewClass = 'audit-color-rot-durchgestrichen';
            detailsHtml = entry.details.map(d => `
                <div class="zeile">
                    <div class="eingabefeld-card-gruppe">
                        <span class="eingabefeld-beschriftung-oben">Person</span>
                        <div class="eingabefeld-card audit-color-rot-durchgestrichen">${d}</div>
                        <span class="eingabefeld-beschriftung-unten audit-color-rot">Gelöscht</span>
                    </div>
                </div>
            `).join('');
        }
    } else {
        // Bearbeitet: orange, altes grau durchgestrichen, neues orange
        typeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        typeClass = 'audit-color-orange';
        titleText = `${entry.member} bearbeitet`;
        if (entry.changes) {
            previewText = entry.changes.map(c => {
                // IBAN: nur neuen Wert anzeigen
                if (c.field === 'IBAN') {
                    return `${c.field}:&nbsp; <span class="audit-color-orange">${c.newValue}</span>`;
                }
                return `${c.field}:&nbsp; <span class="audit-color-grau-durchgestrichen">${c.oldValue}</span> <span class="audit-color-grau">&nbsp;→&nbsp;</span> <span class="audit-color-orange">${c.newValue}</span>`;
            }).join(', ');
            detailsHtml = entry.changes.map(c => {
                // IBAN: nur neuen Wert anzeigen
                if (c.field === 'IBAN') {
                    return `
                <div class="zeile">
                    <div class="eingabefeld-card-gruppe">
                        <span class="eingabefeld-beschriftung-oben">Person</span>
                        <div class="eingabefeld-card">${entry.member}:&nbsp; <span class="audit-color-orange">${c.newValue}</span></div>
                        <span class="eingabefeld-beschriftung-unten audit-color-orange">${c.field} korrigiert</span>
                    </div>
                </div>
                    `;
                }
                return `
                <div class="zeile">
                    <div class="eingabefeld-card-gruppe">
                        <span class="eingabefeld-beschriftung-oben">Person</span>
                        <div class="eingabefeld-card">${entry.member}:&nbsp; <span class="audit-color-grau-durchgestrichen">${c.oldValue}</span> <span class="audit-color-grau">&nbsp;→&nbsp;</span> <span class="audit-color-orange">${c.newValue}</span></div>
                        <span class="eingabefeld-beschriftung-unten audit-color-orange">${c.field} bearbeitet</span>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

    return `
        <div class="unterabschnitt--card unterabschnitt--card--expandable" data-entry-id="${entryId}" data-member-id="${memberId}">
            <div class="zeile">
                <span class="${typeClass}" style="align-self: flex-start; margin-top: calc(var(--eingabefeld-beschriftung-oben-hoehe) + var(--spacing-xs) + (var(--eingabefeld-hoehe) - 18px) / 2);">${typeIcon}</span>
                <div class="eingabefeld-card-gruppe">
                    <span class="eingabefeld-beschriftung-oben">${entry.user} · ${dateStr}, ${timeStr}</span>
                    <div class="eingabefeld-card">${titleText}</div>
                    <span class="eingabefeld-beschriftung-unten eingabefeld-beschriftung-unten--einzeilig ${previewClass}">${previewText}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-self: center; gap: 4px;">
                    <button class="btn btn-icon" onclick="event.stopPropagation(); showUndoConfirm(${entryId}, this)" title="Rückgängig machen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l4-4M3 10l4 4"/>
                        </svg>
                    </button>
                    <button class="btn btn-icon" onclick="event.stopPropagation(); toggleAuditExpand(this)" title="Details anzeigen">
                        <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="unterabschnitt--card-details">
                ${detailsHtml}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPAND-FUNKTIONEN
// ============================================================================

/**
 * Toggled den expandierten Zustand eines Audit-Eintrags
 */
function toggleAuditExpand(buttonElement) {
    const card = buttonElement.closest('.unterabschnitt--card--expandable');
    if (!card) return;
    card.classList.toggle('open');
}

// ============================================================================
// RÜCKGÄNGIG-FUNKTIONEN
// ============================================================================

/**
 * Zeigt die Bestätigungs-Overlay für Rückgängig
 */
function showUndoConfirm(entryId, buttonElement) {
    const auditItem = buttonElement.closest('.unterabschnitt--card');
    if (!auditItem) return;

    // Entferne vorherige Overlays
    document.querySelectorAll('.audit-confirm-overlay').forEach(el => el.remove());

    // Erstelle Bestätigungs-Overlay
    const overlay = document.createElement('div');
    overlay.className = 'audit-confirm-overlay';
    overlay.innerHTML = `
        <div class="zeile zeile--center">
            <span class="text-normal">Änderung rückgängig machen?</span>
            <button class="btn btn-secondary btn-sm" onclick="cancelUndo(this)">Abbrechen</button>
            <button class="btn btn-primary btn-sm" onclick="confirmUndo(${entryId}, this)">Rückgängig</button>
        </div>
    `;

    auditItem.appendChild(overlay);
}

/**
 * Bricht die Rückgängig-Aktion ab
 */
function cancelUndo(buttonElement) {
    const overlay = buttonElement.closest('.audit-confirm-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Führt die Rückgängig-Aktion aus und springt zum Datensatz
 */
function confirmUndo(entryId, buttonElement) {
    const overlay = buttonElement.closest('.audit-confirm-overlay');
    const auditItem = overlay ? overlay.closest('.unterabschnitt--card') : null;

    // TODO: Hier echte API-Aktion zum Rückgängig machen
    console.log('Rückgängig für Entry:', entryId);

    // Schließe Modal
    closeAuditModal();

    // Springe zum Datensatz (Mock - später mit echter ID)
    jumpToRecord(entryId, auditItem);
}

/**
 * Springt zum betroffenen Datensatz in der Tabelle
 */
function jumpToRecord(entryId, auditItem) {
    // Versuche den Member-Namen aus dem Audit-Item zu holen
    let memberName = 'Unbekannt';
    if (auditItem) {
        const titleStrong = auditItem.querySelector('.audit-title strong');
        if (titleStrong) {
            memberName = titleStrong.textContent;
        }
    }

    // Finde die aktive Tabelle direkt über die bekannten IDs
    let activeTable = null;
    const recordsTab = document.getElementById('tab-records');
    const bestandTab = document.getElementById('tab-bestand');

    if (recordsTab && recordsTab.classList.contains('active')) {
        activeTable = document.getElementById('recordsTableBody');
    } else if (bestandTab && bestandTab.classList.contains('active')) {
        activeTable = document.getElementById('bestandTableBody');
    }

    // Fallback: Versuche beide
    if (!activeTable) {
        activeTable = document.getElementById('recordsTableBody') || document.getElementById('bestandTableBody');
    }

    let foundRow = null;

    // Suche nach Name in der aktiven Tabelle
    if (activeTable) {
        const rows = activeTable.querySelectorAll('tr:not(.totals-row)');
        rows.forEach(row => {
            const nameCell = row.querySelector('td:nth-child(2), .col-name, .name-cell');
            if (nameCell && nameCell.textContent.includes(memberName.split(' ')[0])) {
                foundRow = row;
            }
        });

        // Fallback: Nimm erste Zeile für Demo wenn Name nicht gefunden
        if (!foundRow && rows.length > 0) {
            foundRow = rows[0];
        }
    }

    if (foundRow) {
        // Scrolle zur Zeile
        foundRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Einfaches Highlight: Setze Hintergrund direkt auf alle td-Elemente
        const cells = foundRow.querySelectorAll('td');
        const originalBackgrounds = [];

        cells.forEach((td, i) => {
            originalBackgrounds[i] = td.style.backgroundColor;
            td.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
            td.style.transition = 'background-color 0.3s';
        });

        // Nach 2 Sekunden zurücksetzen
        setTimeout(() => {
            cells.forEach((td, i) => {
                td.style.backgroundColor = originalBackgrounds[i] || '';
            });
        }, 2000);
    } else {
        console.log('Keine Tabellen-Zeile gefunden. activeTable:', activeTable);
    }
}

function formatAuditTime(date) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatAuditDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Heute';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Gestern';
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ============================================================================
// HILFSFUNKTIONEN FÜR INTEGRATION
// ============================================================================

/**
 * Erstellt die beiden Audit-Buttons HTML-String
 * @param {string} contextId - ID des Kontexts (optional, default: 'default')
 * @returns {string} HTML-String für beide Buttons
 */
function getAuditButtonsHTML(contextId = 'default') {
    return `
        <button class="btn-audit" onclick="openAuditModal('nmg-erh', '${contextId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Audit NMG/ERH</span>
        </button>
        <button class="btn-audit" onclick="openAuditModal('bestand', '${contextId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Audit Bestand</span>
        </button>
    `;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Ansprechpartner-Rollen (zentral für alle Seiten)
 */
const CONTACT_ROLES = {
    'geschaeftsfuehrer': 'Geschäftsführer',
    'mitgliederbeauftragte': 'Mitgliederbeauftragte',
    'stv_geschaeftsfuehrer': 'Stv. Geschäftsführer',
    'oeffentlichkeitsarbeit': 'Öffentlichkeitsarbeit',
    'vorstand': 'Vorstand',
    'vorstandsvorsitzender': 'Vorstandsvorsitzender',
    'bereitschaftsleiter': 'Bereitschaftsleiter',
    'schatzmeister': 'Schatzmeister',
    'sonstige': 'Sonstige'
};

/**
 * Formatiert eine Adresse aus einem Objekt mit street, houseNumber, zip, city
 * @param {Object} addressObj - Objekt mit Adressdaten
 * @returns {string} Formatierte Adresse (z.B. "Bahnhofstr. 45, 67059 Ludwigshafen")
 */
function formatAddress(addressObj) {
    if (!addressObj) return '';
    let parts = [];
    if (addressObj.street) parts.push(addressObj.street + (addressObj.houseNumber ? ' ' + addressObj.houseNumber : ''));
    if (addressObj.zip || addressObj.city) parts.push((addressObj.zip || '') + ' ' + (addressObj.city || ''));
    return parts.join(', ') || '';
}

/**
 * Escaped HTML für sichere Darstellung
 * @param {string} text - Text zum Escapen
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Gibt die aktuelle Kalenderwoche zurück
 * @returns {number} Aktuelle KW
 */
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

/**
 * Gibt den Datumsbereich einer Kalenderwoche zurück
 * @param {number} kw - Kalenderwoche
 * @param {number} year - Jahr
 * @returns {string} Formatierter Bereich (z.B. "06.01 - 12.01")
 */
function getKWDateRange(kw, year) {
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay();
    const offsetToMonday = (dayOfWeek <= 4) ? (1 - dayOfWeek) : (8 - dayOfWeek);
    const firstMonday = new Date(year, 0, 1 + offsetToMonday);
    const targetMonday = new Date(firstMonday);
    targetMonday.setDate(firstMonday.getDate() + (kw - 1) * 7);
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    const formatDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    return `${formatDate(targetMonday)} - ${formatDate(targetSunday)}`;
}

/**
 * Formatiert ein Datum im deutschen Format
 * @param {string|Date} dateStr - Datum als String oder Date
 * @param {boolean} [withYear=true] - Mit Jahr anzeigen
 * @returns {string} Formatiertes Datum (z.B. "23.12.2025" oder "23.12.")
 */
function formatDate(dateStr, withYear = true) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (withYear) {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

/**
 * Formatiert einen Wert als Währung
 * @param {number} value - Wert
 * @returns {string} Formatierte Währung (z.B. "1.234 €")
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value);
}

/**
 * Gibt die CSS-Klasse für eine Stornoquote zurück
 * @param {number} value - Stornoquote in Prozent
 * @returns {string} CSS-Klasse
 */
function getStornoClass(value) {
    if (value < 8) return 'storno-low';
    if (value < 10) return 'storno-medium-low';
    if (value < 12) return 'storno-medium-high';
    return 'storno-high';
}

/**
 * Gibt den Status einer Kampagne basierend auf KW zurück
 * @param {number} kwFrom - Start-KW
 * @param {number} kwTo - End-KW
 * @returns {string} 'active', 'planned' oder 'inactive'
 */
function getCampaignStatus(kwFrom, kwTo) {
    const currentWeek = getCurrentWeek();
    if (currentWeek >= kwFrom && currentWeek <= kwTo) {
        return 'active';
    } else if (currentWeek < kwFrom) {
        return 'planned';
    } else {
        return 'inactive';
    }
}

window.escapeHtml = escapeHtml;
window.getCurrentWeek = getCurrentWeek;
window.getKWDateRange = getKWDateRange;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.getStornoClass = getStornoClass;
window.getCampaignStatus = getCampaignStatus;

// =====================================================
// DATUM PARSING
// =====================================================

/**
 * Parst ein deutsches Datum (TT.MM.JJ oder TT.MM.JJJJ)
 * @param {string} str - Datums-String (z.B. "23.12.25" oder "23.12.2025")
 * @returns {Date|null} - Date-Objekt oder null bei ungültigem Format
 */
function parseGermanDate(str) {
    if (!str) return null;
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
    }
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const dateObj = new Date(year, month, day);
    if (dateObj.getDate() !== day || dateObj.getMonth() !== month) return null;
    return dateObj;
}

window.parseGermanDate = parseGermanDate;

// =====================================================
// TOGGLE LABEL SYSTEM
// =====================================================

/**
 * Initialisiert einen Toggle-Switch mit automatischem Label-Update
 * @param {string} checkboxId - ID der Checkbox
 * @param {string} labelId - ID des Label-Elements
 * @param {object} labels - Label-Texte { on: 'Text wenn an', off: 'Text wenn aus' }
 * @param {function} [callback] - Optionale Callback-Funktion bei Änderung
 */
function initToggleLabel(checkboxId, labelId, labels, callback) {
    const checkbox = document.getElementById(checkboxId);
    const label = document.getElementById(labelId);
    if (!checkbox || !label) return;

    const updateLabel = () => {
        label.textContent = checkbox.checked ? labels.on : labels.off;
        if (callback) callback(checkbox.checked);
    };

    checkbox.addEventListener('change', updateLabel);
    updateLabel(); // Initial setzen
}

window.initToggleLabel = initToggleLabel;

// =====================================================
// STATUS BADGES (Online/Offline)
// =====================================================

/**
 * Zeigt Online-Status oder letztes Login-Datum als Badge
 * @param {Date} date - Letztes Login-Datum
 * @param {boolean} isOnline - Ist der Benutzer gerade online?
 * @returns {string} HTML für den Status-Badge
 */
function formatLastLogin(date, isOnline) {
    if (isOnline) {
        return `<span class="pill pill--success pill--online">Online</span>`;
    }
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `<span class="pill pill--inaktiv">${day}.${month}.${year} - ${hours}:${minutes}</span>`;
}

// =====================================================
// GLOBAL EXPORTS
// =====================================================

// Badge System
window.getInitials = getInitials;
window.getBadgeSymbolSVG = getBadgeSymbolSVG;
window.getBadgeTypeRow = getBadgeTypeRow;
window.getStufeBadge = getStufeBadge;
window.createWerberBadge = createWerberBadge;
window.createBadge = createBadge;
window.STUFEN_CONFIG = STUFEN_CONFIG;
window.getStufeName = getStufeName;
window.formatLastLogin = formatLastLogin;

// Member Cards
window.renderMemberCard = renderMemberCard;
window.renderMemberCards = renderMemberCards;

// Audit System
window.openAuditModal = openAuditModal;
window.closeAuditModal = closeAuditModal;
window.getAuditButtonsHTML = getAuditButtonsHTML;
window.showUndoConfirm = showUndoConfirm;
window.cancelUndo = cancelUndo;
window.confirmUndo = confirmUndo;
window.toggleAuditExpand = toggleAuditExpand;

console.log('%c Karten.js geladen ', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');
console.log('Verfügbare Funktionen: createBadge(), renderMemberCards(), openAuditModal()');
/**
 * ========================================
 * TABELLEN.JS - Zentrale Tabellen-Funktionen
 * ========================================
 *
 * Enthält:
 * - TableCheckbox: Checkbox-System für Tabellen
 * - Spalten-Konfiguration und Drag & Drop
 * - Sortierung und Filterung
 * - Render-Funktionen für Records/Bestand
 * - Vorlagen-System
 *
 * ========================================
 */

// =====================================================
// CHECKBOX SYSTEM
// =====================================================

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

// =====================================================
// HELPER FUNKTIONEN
// =====================================================

/**
 * Generiert den Text für eine Gesamt-Zeile
 * @param {string} count - Der Zähltext (z.B. "4 Werber", "12 Kunden")
 * @returns {string} HTML-String
 */
function createTotalsNameCell(count) {
    return `<strong>Gesamt</strong> <span class="totals-count">${count}</span>`;
}

// =====================================================
// DATENSÄTZE SYSTEM
// Zentrale Funktionen für alle Datensätze-Seiten
// =====================================================

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
    document.querySelectorAll('[data-filter]').forEach(btn => {
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
    const selectionGroup = document.getElementById(`${type}SelectionGroup`);

    if (btnCount) {
        btnCount.textContent = count;
    }
    if (selectionGroup) {
        selectionGroup.classList.toggle('visible', count > 0);
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
// Zentrale Dropdown-Verwaltung mit Body-Append für bessere Positionierung
let activeDropdownMenu = null;
let activeDropdownBtn = null;

/**
 * Öffnet/schließt ein Dropdown-Menü
 * Positioniert das Menü am Bildschirmrand, damit es nicht abgeschnitten wird
 * @param {HTMLElement} btn - Der 3-Punkte-Button
 * @param {string} [type] - Optional: Typ für Kontext (z.B. 'records', 'bestand')
 * @param {string|number} [id] - Optional: ID für Kontext
 */
function toggleDropdown(btn, type, id) {
    if (event) event.stopPropagation();

    const menu = btn.nextElementSibling;
    const wasOpen = activeDropdownMenu === menu && menu.classList.contains('open');

    closeAllDropdowns();

    if (!wasOpen) {
        activeDropdownMenu = menu;
        activeDropdownBtn = btn;

        // Kontext speichern falls übergeben
        if (type !== undefined) {
            const dropdown = btn.closest('.dropdown');
            if (dropdown) {
                dropdown.dataset.type = type;
                dropdown.dataset.id = id;
            }
            // Auch am Menü speichern (da es an body verschoben wird)
            menu.dataset.type = type;
            menu.dataset.id = id;
        }

        // Menü an Body anhängen für bessere Positionierung
        document.body.appendChild(menu);

        const rect = btn.getBoundingClientRect();
        const menuWidth = 180; // Geschätzte Menübreite
        const menuHeight = 200; // Geschätzte Menühöhe
        const spaceRight = window.innerWidth - rect.right;
        const spaceBottom = window.innerHeight - rect.bottom;
        const openLeft = spaceRight < menuWidth; // Nach links öffnen wenn wenig Platz rechts
        const openUp = spaceBottom < menuHeight; // Nach oben öffnen wenn wenig Platz unten

        menu.style.position = 'fixed';

        // Vertikale Positionierung
        if (openUp) {
            // Nach oben öffnen
            menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
            menu.style.top = 'auto';
        } else {
            // Nach unten öffnen
            menu.style.top = (rect.bottom + 4) + 'px';
            menu.style.bottom = 'auto';
        }

        // Horizontale Positionierung
        if (openLeft) {
            // Nach links öffnen (rechtsbündig zum Button)
            menu.style.right = (window.innerWidth - rect.right) + 'px';
            menu.style.left = 'auto';
        } else {
            // Nach rechts öffnen (linksbündig zum Button)
            menu.style.left = rect.left + 'px';
            menu.style.right = 'auto';
        }
        menu.classList.add('open');
    }
}

/**
 * Schließt alle offenen Dropdown-Menüs
 */
function closeAllDropdowns() {
    if (activeDropdownMenu && activeDropdownBtn) {
        const dropdown = activeDropdownBtn.closest('.dropdown');
        if (dropdown && activeDropdownMenu.parentNode === document.body) {
            dropdown.appendChild(activeDropdownMenu);
        }
        activeDropdownMenu.classList.remove('open');
        activeDropdownMenu.style.position = '';
        activeDropdownMenu.style.top = '';
        activeDropdownMenu.style.right = '';
        activeDropdownMenu.style.left = '';
    }
    activeDropdownMenu = null;
    activeDropdownBtn = null;
}

// Klick außerhalb schließt Dropdown
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown') && !e.target.closest('.dropdown-menu')) {
        closeAllDropdowns();
    }
});

// Scroll schließt Dropdown
window.addEventListener('scroll', closeAllDropdowns, true);

// ========== EXPANDABLE ROWS ==========
// Für Tabellen mit aufklappbaren Zeilen (z.B. Kunden mit Werbegebieten)
let allExpanded = false;

/**
 * Klappt eine einzelne Zeile auf/zu
 * @param {string} parentId - ID der Parent-Zeile
 */
function toggleExpandableRow(parentId) {
    const row = document.querySelector(`tr[data-user-id="${parentId}"], tr[data-parent-id="${parentId}"].expandable-row`);
    if (!row) return;

    const isOpen = row.classList.contains('open');
    row.classList.toggle('open');

    document.querySelectorAll(`.child-row[data-parent-id="${parentId}"]`).forEach(child => {
        child.classList.toggle('visible', !isOpen);
    });
}

/**
 * Klappt alle Zeilen auf einmal auf/zu
 * @param {string} [toggleBtnId='toggleAllBtn'] - ID des Toggle-Buttons
 */
function toggleAllExpand(toggleBtnId = 'toggleAllBtn') {
    const btn = document.getElementById(toggleBtnId);
    const expandableRows = document.querySelectorAll('.expandable-row');
    const childRows = document.querySelectorAll('.child-row');

    allExpanded = !allExpanded;

    expandableRows.forEach(row => {
        row.classList.toggle('open', allExpanded);
    });

    childRows.forEach(child => {
        child.classList.toggle('visible', allExpanded);
    });

    if (btn) {
        const icon = btn.querySelector('svg');
        const text = btn.querySelector('span');

        if (icon) icon.style.transform = allExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        if (text) text.textContent = allExpanded ? 'Alle zuklappen' : 'Alle aufklappen';
    }
}

// ========== SIMPLE TABLE SORTING ==========
// Für einfache Tabellen (Benutzer, etc.) - nicht für Records/Bestand

/**
 * Aktualisiert die Sortier-Richtung und die Pfeile in der Tabellen-Überschrift
 * @param {string} field - Spalten-Name
 * @param {Object} sortState - Objekt mit {field, direction} - wird von der Seite übergeben
 * @param {Function} renderCallback - Funktion die nach dem Sortieren aufgerufen wird
 */
function updateSortState(field, sortState, renderCallback) {
    // Sortier-Richtung ändern
    if (sortState.field !== field) {
        sortState.field = field;
        sortState.direction = 'asc';
    } else if (sortState.direction === 'asc') {
        sortState.direction = 'desc';
    } else {
        sortState.direction = 'asc';
    }

    // Pfeile in den Spalten-Überschriften aktualisieren
    document.querySelectorAll('th.sortable').forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
    });

    const th = document.querySelector(`th[data-sort="${field}"]`);
    if (th) {
        th.classList.add('sort-' + sortState.direction);
    }

    // Tabelle neu zeichnen
    if (renderCallback) {
        renderCallback();
    }
}

function handleDropdownAction(action, dropdownMenu) {
    // Daten vom Menü selbst holen (da es an body verschoben wurde)
    const type = dropdownMenu.dataset.type;
    const id = parseInt(dropdownMenu.dataset.id);

    // Dropdown schließen (zentrale Funktion nutzen)
    closeAllDropdowns();

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
            openStornoModalTable(type, [id], [record.name]);
            break;
        case 'delete':
            deleteSingle(type, id, record);
            break;
    }
}

// ========== TABLE ACTIONS (UNIFIED) ==========

/**
 * Hilfsfunktion: Holt selektierte Records mit Namen
 * @param {string} type - Tabellentyp ('records' oder 'bestand')
 * @returns {Object} { ids: number[], names: string[], records: Object[] }
 */
function getSelectedRecords(type) {
    const tableBodyId = `${type}TableBody`;
    const ids = TableCheckbox.getSelectedIds(tableBodyId);
    const data = type === 'records' ? recordsData : bestandData;

    const records = ids.map(id => data.find(d => d.id === parseInt(id))).filter(Boolean);
    const names = records.map(r => r.name);

    return { ids: ids.map(id => parseInt(id)), names, records };
}

/**
 * Unified Table Action Handler
 * @param {string} action - Aktion ('mail', 'pdf', 'storno', 'delete')
 * @param {string} type - Tabellentyp ('records' oder 'bestand')
 * @param {Object} [singleRecord] - Optional: Einzelner Record für Single-Actions
 */
async function tableAction(action, type, singleRecord = null) {
    let names, ids;

    if (singleRecord) {
        // Single Action
        names = [singleRecord.name];
        ids = [singleRecord.id];
    } else {
        // Bulk Action
        const selected = getSelectedRecords(type);
        if (selected.ids.length === 0) return;
        names = selected.names;
        ids = selected.ids;
    }

    const isSingle = names.length === 1;
    const nameList = names.join(', ');

    switch (action) {
        case 'mail':
            console.log(`E-Mail senden an: ${nameList}`);
            showToast(isSingle ? 'E-Mail gesendet' : `${ids.length} E-Mails gesendet`, 'success');
            break;

        case 'pdf':
            console.log(`PDF erstellen für: ${nameList}`);
            showToast(isSingle ? 'PDF erstellt' : `${ids.length} PDFs erstellt`, 'success');
            break;

        case 'storno':
            openStornoModalTable(type, ids, names);
            break;

        case 'delete':
            const countText = isSingle ? `"${names[0]}"` : `${ids.length} Datensatz/Datensätze`;
            const confirmed = typeof showConfirm === 'function'
                ? await showConfirm(
                    'Löschen',
                    `Möchten Sie ${countText} wirklich löschen?`,
                    'warning',
                    { danger: true, confirmText: 'Löschen' }
                )
                : confirm(`Möchten Sie ${countText} wirklich löschen?`);

            if (confirmed) {
                console.log('Löschen:', ids);
                const successText = isSingle ? `"${names[0]}" gelöscht` : `${ids.length} Einträge gelöscht`;
                showToast(successText, 'success');
                if (!singleRecord) clearSelection(type);
            }
            break;
    }
}

// Wrapper für Rückwärtskompatibilität (Bulk Actions)
function sendMail(type) { tableAction('mail', type); }
function downloadPDF(type) { tableAction('pdf', type); }
function stornoSelected(type) { tableAction('storno', type); }
async function deleteSelected(type) { await tableAction('delete', type); }

// Wrapper für Rückwärtskompatibilität (Single Actions)
function sendMailSingle(type, id, record) { tableAction('mail', type, record); }
function downloadPDFSingle(type, id, record) { tableAction('pdf', type, record); }
async function deleteSingle(type, id, record) { await tableAction('delete', type, record); }

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

    // Header-Definitionen (generische Spaltenbreiten)
    const headerDefs = {
        name: { class: 'col-name text-left', label: 'Name' },
        typ: { class: 'col-s text-center', label: 'Typ' },
        date: { class: 'col-m text-left', label: 'Datum' },
        je: { class: 'col-s text-right', label: 'JE' },
        kunde: { class: 'col-m text-left', label: 'Kunde' },
        gebiet: { class: 'col-m text-left', label: 'Werbegebiet' },
        werber: { class: 'col-m text-left', label: 'Werber' },
        teamchef: { class: 'col-m text-left', label: 'Teamchef' },
        street: { class: 'col-m text-left', label: 'Straße' },
        houseNumber: { class: 'col-s text-left', label: 'Nr' },
        zipCode: { class: 'col-s text-left', label: 'PLZ' },
        city: { class: 'col-m text-left', label: 'Ort' },
        email: { class: 'col-xl text-left', label: 'E-Mail' },
        phoneFixed: { class: 'col-m text-left', label: 'Tel. Festnetz' },
        phoneMobile: { class: 'col-m text-left', label: 'Tel. Mobil' },
        status: { class: 'col-s text-center', label: 'Status' }
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
                    <span class="icon icon--pfeil-auf arrow-up"></span>
                    <span class="icon icon--pfeil-ab arrow-down"></span>
                </span>
            </th>`;
        }
    });
    headerHtml += `<th class="col-spacer"></th></tr>`;
    thead.innerHTML = headerHtml;

    const body = document.getElementById('recordsTableBody');
    if (!body) return;

    body.innerHTML = filtered.map(d => {
        // Spalten-Daten mit Mapping (generische Spaltenbreiten)
        const colData = {
            name: { class: 'col-name text-left', html: d.name },
            typ: { class: 'col-s text-center', html: `<span class="pill pill--${d.typ === 'nmg' ? 'neumitglied' : 'erhoehung'}">${d.typ === 'nmg' ? 'NMG' : 'ERH'}</span>` },
            date: { class: 'col-m text-left', html: d.date },
            je: { class: 'col-s text-right', html: d.je },
            kunde: { class: 'col-m text-left', html: d.kunde || '' },
            gebiet: { class: 'col-m text-left', html: d.gebiet || '' },
            werber: { class: 'col-m text-left', html: d.werber || '' },
            teamchef: { class: 'col-m text-left', html: d.teamchef || '' },
            street: { class: 'col-m text-left', html: d.street || '' },
            houseNumber: { class: 'col-s text-left', html: d.houseNumber || '' },
            zipCode: { class: 'col-s text-left', html: d.zipCode || '' },
            city: { class: 'col-m text-left', html: d.city || '' },
            email: { class: 'col-xl text-left', html: d.email || '' },
            phoneFixed: { class: 'col-m text-left', html: d.phoneFixed || '' },
            phoneMobile: { class: 'col-m text-left', html: d.phoneMobile || '' },
            status: { class: 'col-s text-center', html: `<span class="pill pill--${d.status === 'aktiv' ? 'success' : d.status === 'storniert' ? 'error' : 'inaktiv'}">${d.status}</span>` }
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

/**
 * Generische Totals-Row Rendering Funktion
 * @param {string} tfootId - ID des tfoot-Elements
 * @param {Array} data - Die Daten für die Berechnung
 * @param {Array} config - Spalten-Konfiguration
 * @param {Object} columnDefs - Spalten-Definitionen mit CSS-Klassen
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {string} [options.sumField='je'] - Feld für die Summenberechnung
 * @param {boolean} [options.showCheckbox=true] - Checkbox-Zelle anzeigen
 * @param {boolean} [options.showAction=true] - Action-Zelle anzeigen
 */
function renderTableTotals(tfootId, data, config, columnDefs, options = {}) {
    const tfoot = document.getElementById(tfootId);
    if (!tfoot) return;

    const sumField = options.sumField || 'je';
    const showCheckbox = options.showCheckbox !== false;
    const showAction = options.showAction !== false;

    // Summe berechnen
    const totalSum = data.reduce((sum, d) => {
        const rawValue = d[sumField];
        if (typeof rawValue === 'number') return sum + rawValue;
        const value = parseFloat(String(rawValue).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return sum + value;
    }, 0);
    const formattedTotal = totalSum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // Totals-Definitionen mit dynamischen Werten
    const totalsDefs = {};
    Object.keys(columnDefs).forEach(key => {
        totalsDefs[key] = {
            class: columnDefs[key].class || columnDefs[key],
            html: key === 'name' ? `Gesamt<span class="totals-count">(${data.length})</span>` :
                  key === sumField ? formattedTotal : ''
        };
    });

    let totalsHtml = '<tr class="totals-row">';
    if (showCheckbox) totalsHtml += '<td class="checkbox-cell"></td>';
    if (showAction) totalsHtml += '<td class="action-cell"></td>';

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

// Wrapper für Rückwärtskompatibilität
function renderRecordsTotals(filtered, config) {
    const columnDefs = {
        name: 'col-name text-left', typ: 'col-s text-center', date: 'col-m text-left', je: 'col-s text-right',
        kunde: 'col-m text-left', gebiet: 'col-m text-left', werber: 'col-m text-left', teamchef: 'col-m text-left',
        street: 'col-m text-left', houseNumber: 'col-s text-left', zipCode: 'col-s text-left',
        city: 'col-m text-left', email: 'col-xl text-left', phoneFixed: 'col-m text-left',
        phoneMobile: 'col-m text-left', status: 'col-s text-center'
    };
    renderTableTotals('recordsTableFoot', filtered, config, columnDefs);
}

// ========== RENDER BESTAND TABLE ==========
function renderBestandTable() {
    // Spalten-Konfiguration holen (falls verfügbar)
    const config = currentColumnsConfig.bestand;

    // Header-Definitionen (generische Spaltenbreiten)
    const headerDefs = {
        name: { class: 'col-name text-left', label: 'Name' },
        memberNr: { class: 'col-m text-left', label: 'Mitgl.-Nr.' },
        seit: { class: 'col-m text-left', label: 'Mitglied seit' },
        je: { class: 'col-s text-right', label: 'JE' },
        email: { class: 'col-xl text-left', label: 'E-Mail' },
        status: { class: 'col-s text-center', label: 'Status' }
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
                    <span class="icon icon--pfeil-auf arrow-up"></span>
                    <span class="icon icon--pfeil-ab arrow-down"></span>
                </span>
            </th>`;
        }
    });
    headerHtml += `<th class="col-spacer"></th></tr>`;
    thead.innerHTML = headerHtml;

    const body = document.getElementById('bestandTableBody');
    if (!body) return;

    body.innerHTML = bestandData.map(d => {
        // Spalten-Daten mit Mapping (generische Spaltenbreiten)
        const colData = {
            name: { class: 'col-name text-left', html: d.name },
            memberNr: { class: 'col-m text-left', html: d.memberNr },
            seit: { class: 'col-m text-left', html: d.seit },
            je: { class: 'col-s text-right', html: d.je },
            email: { class: 'col-xl text-left', html: d.email },
            status: { class: 'col-s text-center', html: `<span class="pill pill--${d.status === 'aktiv' ? 'success' : d.status === 'storniert' ? 'error' : 'inaktiv'}">${d.status}</span>` }
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
    const columnDefs = {
        name: 'col-name text-left', memberNr: 'col-m text-left', seit: 'col-m text-left',
        je: 'col-s text-right', email: 'col-xl text-left', status: 'col-s text-center'
    };
    renderTableTotals('bestandTableFoot', bestandData, config, columnDefs);
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

// ========== STORNO MODAL (TABLE VERSION) ==========
function openStornoModalTable(type, ids, names) {
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
    const datumField = document.getElementById('stornoDatum');
    if (datumField) datumField.value = heute;

    // Formular zurücksetzen
    const stornoGrund = document.getElementById('stornoGrund');
    if (stornoGrund) stornoGrund.value = '';

    const stornoGrundFreitext = document.getElementById('stornoGrundFreitext');
    if (stornoGrundFreitext) stornoGrundFreitext.value = '';

    const stornoGrundFreitextFields = document.getElementById('stornoGrundFreitextFields');
    if (stornoGrundFreitextFields) stornoGrundFreitextFields.classList.remove('visible');

    const stornoBeschwerde = document.getElementById('stornoBeschwerde');
    if (stornoBeschwerde) stornoBeschwerde.checked = false;

    const beschwerdeGrund = document.getElementById('beschwerdeGrund');
    if (beschwerdeGrund) beschwerdeGrund.value = '';

    const beschwerdeFields = document.getElementById('beschwerdeFields');
    if (beschwerdeFields) beschwerdeFields.classList.remove('visible');

    const stornoMailBestaetigung = document.getElementById('stornoMailBestaetigung');
    if (stornoMailBestaetigung) stornoMailBestaetigung.checked = false;

    // Modal anzeigen
    const modal = document.getElementById('stornoModal');
    if (modal) modal.classList.add('active');
}

// ========== EDIT MODAL ==========
function openEditModal(type, id) {
    editContext = { type, id };

    // Modal erstellen falls es noch nicht existiert
    if (!document.getElementById('editModal')) {
        if (typeof ModalTemplates !== 'undefined' && ModalTemplates.edit) {
            document.body.insertAdjacentHTML('beforeend', ModalTemplates.edit());
        } else {
            console.error('ModalTemplates.edit nicht verfügbar');
            return;
        }
    }

    // Daten laden
    const data = type === 'records' ? recordsData : bestandData;
    const record = data.find(d => d.id === id);
    if (!record) return;

    // Header füllen
    const nameParts = record.name.split(' ');
    const initials = nameParts.map(p => p[0]).join('').toUpperCase().substring(0, 2);

    const nameEl = document.getElementById('editModalName');
    if (nameEl) nameEl.textContent = record.name;

    // Typ-Badge
    const typeBadge = document.getElementById('editModalTypeBadge');
    if (typeBadge) {
        if (type === 'records') {
            typeBadge.textContent = record.typ === 'nmg' ? 'NMG' : 'ERH';
            typeBadge.className = `badge ${record.typ}`;
        } else {
            typeBadge.textContent = 'BESTAND';
            typeBadge.className = 'badge bestand';
        }
    }

    // Datum
    const dateText = type === 'records' ? `Erstellt am ${record.date}` : `Mitglied seit ${record.seit}`;
    const dateEl = document.getElementById('editModalDate');
    if (dateEl) dateEl.textContent = dateText;

    // Formularfelder füllen (Beispieldaten)
    const vorname = nameParts[0] || '';
    const nachname = nameParts.slice(1).join(' ') || '';

    const vornameEl = document.getElementById('editVorname');
    if (vornameEl) vornameEl.value = vorname;

    const nachnameEl = document.getElementById('editNachname');
    if (nachnameEl) nachnameEl.value = nachname;

    if (type === 'records') {
        const gebietEl = document.getElementById('editGebiet');
        if (gebietEl) gebietEl.value = record.gebiet || '';

        const werberEl = document.getElementById('editWerber');
        if (werberEl) werberEl.value = record.werber || '';
    }

    // Beitrag aus JE berechnen (vereinfacht)
    const jeValue = parseFloat(record.je.replace('.', '').replace(',', '.').replace(' €', ''));
    const beitragEl = document.getElementById('editBeitrag');
    if (beitragEl) beitragEl.value = (jeValue / 12).toFixed(2);

    const jeEl = document.getElementById('editJE');
    if (jeEl) jeEl.value = record.je;

    if (type === 'bestand') {
        const emailEl = document.getElementById('editEmail');
        if (emailEl) emailEl.value = record.email || '';
    }

    // Historie rendern
    renderEditHistory(id);

    // Modal anzeigen
    const modal = document.getElementById('editModal');
    if (modal) modal.classList.add('active');
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
    const modal = document.getElementById('editModal');
    if (modal) modal.classList.remove('active');
    editContext = { type: null, id: null };
}

async function saveEditModal() {
    // Hier würden die Daten gespeichert werden
    console.log('Speichern:', editContext);

    // Beispiel: Formular-Daten sammeln
    const formData = {
        anrede: document.getElementById('editAnrede')?.value,
        titel: document.getElementById('editTitel')?.value,
        vorname: document.getElementById('editVorname')?.value,
        nachname: document.getElementById('editNachname')?.value,
        geburtsdatum: document.getElementById('editGeburtsdatum')?.value,
        email: document.getElementById('editEmail')?.value,
        telefonMobil: document.getElementById('editTelefonMobil')?.value,
        telefonFestnetz: document.getElementById('editTelefonFestnetz')?.value,
        strasse: document.getElementById('editStrasse')?.value,
        hausnummer: document.getElementById('editHausnummer')?.value,
        plz: document.getElementById('editPLZ')?.value,
        ort: document.getElementById('editOrt')?.value,
        beitrag: document.getElementById('editBeitrag')?.value,
        intervall: document.getElementById('editIntervall')?.value,
        iban: document.getElementById('editIBAN')?.value,
        bic: document.getElementById('editBIC')?.value,
        kontoinhaber: document.getElementById('editKontoinhaber')?.value
    };

    console.log('Formulardaten:', formData);

    closeEditModal();
    showToast('Änderungen wurden gespeichert', 'success');

    // Tabelle neu rendern
    renderRecordsTable();
    renderBestandTable();
}

// ========== COLUMNS MODAL ==========
function openColumnsModalTable(type) {
    columnsContext.type = type;

    // Titel setzen
    const title = type === 'records' ? 'Spalten: Neumitglieder / Erhöhungen' : 'Spalten: Bestandsmitglieder';
    const titleEl = document.getElementById('columnsModalTitle');
    if (titleEl) titleEl.textContent = title;

    // Temporäre Kopie erstellen
    tempColumnsConfig = JSON.parse(JSON.stringify(currentColumnsConfig[type]));

    // Liste rendern
    renderColumnsList();

    // Vorlagen rendern
    renderTemplatesList();

    // Name-Input verstecken
    const nameInput = document.getElementById('templateNameInput');
    if (nameInput) nameInput.style.display = 'none';

    // Modal öffnen
    const modal = document.getElementById('columnsModal');
    if (modal) modal.classList.add('active');
}

function closeColumnsModal() {
    const modal = document.getElementById('columnsModal');
    if (modal) modal.classList.remove('active');
    columnsContext.type = null;
    // Name-Input verstecken
    const nameInput = document.getElementById('templateNameInput');
    if (nameInput) nameInput.style.display = 'none';
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
                <span class="icon icon--menu"></span>
            </div>
            <input type="checkbox"
                   class="column-item-checkbox"
                   ${col.visible ? 'checked' : ''}
                   ${col.required ? 'disabled' : ''}
                   onchange="toggleColumnVisibility(${index})">
            <span class="column-item-label text-normal">${col.label}</span>
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
    showToast('Spalten-Konfiguration gespeichert', 'success');
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
        list.innerHTML = '<div class="template-empty text-klein">Keine Vorlagen</div>';
    } else {
        list.innerHTML = templates.map((tpl, index) => {
            const visibleCount = tpl.config.filter(c => c.visible).length;
            return `
                <div class="template-item" onclick="applyTemplate(${index})">
                    <div class="template-item-icon text-klein--fett">${index + 1}</div>
                    <div class="template-item-info">
                        <div class="template-item-name text-normal--fett">${tpl.name}</div>
                        <div class="template-item-count text-klein">${visibleCount} Spalten</div>
                    </div>
                    <button class="btn btn-icon" onclick="event.stopPropagation(); deleteTemplate(${index})">
                        <span class="icon icon--schliessen"></span>
                    </button>
                </div>
            `;
        }).join('');
    }

    // Add-Button deaktivieren wenn max erreicht
    addBtn.disabled = templates.length >= MAX_TEMPLATES;
    if (templates.length >= MAX_TEMPLATES) {
        addBtn.innerHTML = `
            <span class="icon icon--plus"></span>
            Max. ${MAX_TEMPLATES} Vorlagen
        `;
    } else {
        addBtn.innerHTML = `
            <span class="icon icon--plus"></span>
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
    showToast(`Vorlage "${name}" gespeichert`, 'success');
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
    showToast('Vorlage gelöscht', 'success');
}

// ========== MODAL EVENT LISTENERS ==========
function initTableModalEventListeners() {
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
    // Funktionen global exportieren
    exportTabellenFunctions();

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

    // Modal Event Listeners initialisieren
    initTableModalEventListeners();
}

// Auto-Init wenn DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Nur initialisieren wenn die nötigen Elemente vorhanden sind
    if (document.getElementById('recordsTableBody') || document.getElementById('bestandTableBody')) {
        initTableModalEventListeners();
    }
});

// Globale Funktionen exportieren
function exportTabellenFunctions() {
    window.switchTab = switchTab;
    window.setFilter = setFilter;
    window.sortTable = sortTable;
    window.updateSelectionUI = updateSelectionUI;
    window.handleRowCheckbox = handleRowCheckbox;
    window.clearSelection = clearSelection;
    window.handleDropdownAction = handleDropdownAction;
    window.sendMail = sendMail;
    window.downloadPDF = downloadPDF;
    window.stornoSelected = stornoSelected;
    window.deleteSelected = deleteSelected;
    window.tableAction = tableAction;
    window.getSelectedRecords = getSelectedRecords;
    window.renderTableTotals = renderTableTotals;
    window.openEditModal = openEditModal;
    window.closeEditModal = closeEditModal;
    window.saveEditModal = saveEditModal;
    window.openColumnsModal = openColumnsModalTable;
    window.closeColumnsModal = closeColumnsModal;
    window.resetColumns = resetColumns;
    window.saveColumns = saveColumns;
    window.handleDragStart = handleDragStart;
    window.handleDragOver = handleDragOver;
    window.handleDragLeave = handleDragLeave;
    window.handleDrop = handleDrop;
    window.handleDragEnd = handleDragEnd;
    window.toggleColumnVisibility = toggleColumnVisibility;
    window.startAddTemplate = startAddTemplate;
    window.handleTemplateNameKeydown = handleTemplateNameKeydown;
    window.applyTemplate = applyTemplate;
    window.deleteTemplate = deleteTemplate;
    window.renderRecordsTable = renderRecordsTable;
    window.renderBestandTable = renderBestandTable;
}

// Immer verfügbare Funktionen (auf allen Seiten nutzbar)
window.TableCheckbox = TableCheckbox;
window.initDatensaetze = initDatensaetze;
window.createTotalsNameCell = createTotalsNameCell;
window.toggleDropdown = toggleDropdown;
window.closeAllDropdowns = closeAllDropdowns;
window.toggleExpandableRow = toggleExpandableRow;
window.toggleAllExpand = toggleAllExpand;
window.updateSortState = updateSortState;

console.log('%c Tabellen.js geladen ', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');

// ========================================
// ZENTRALE UI UTILITIES
// ========================================

/**
 * Toggle Collapse-Button (klappt ein/aus, deaktiviert nicht)
 * @param {HTMLElement} btn - Der Collapse-Button
 * @param {string} sectionId - ID des zu klappenden Bereichs
 */
function toggleCollapse(btn, sectionId) {
    const section = document.getElementById(sectionId);
    const isOpen = btn.classList.contains('open');

    if (isOpen) {
        btn.classList.remove('open');
        section.style.display = 'none';
    } else {
        btn.classList.add('open');
        section.style.display = 'block';
    }
}
window.toggleCollapse = toggleCollapse;

/**
 * Initialisiert Tab-Switching für beliebige Tab-Container
 * @param {string} tabSelector - CSS-Selektor für Tab-Buttons (z.B. '.tab', '.template-tab')
 * @param {string} contentSelector - CSS-Selektor für Tab-Contents (z.B. '.tab-content', '.template-content')
 * @param {string} [contentIdPrefix='tab-'] - Prefix für Content-ID (Content-ID = prefix + tab.dataset.tab)
 */
function initTabs(tabSelector, contentSelector, contentIdPrefix = 'tab-') {
    document.querySelectorAll(tabSelector).forEach(tab => {
        tab.addEventListener('click', function() {
            // Nur Tabs im gleichen Container deaktivieren
            const tabContainer = this.closest('.page-header-tabs, .modal-tabs, .tabs-container') || this.parentElement;
            tabContainer.querySelectorAll(tabSelector.split(' ').pop()).forEach(t => t.classList.remove('active'));

            // Zugehörige Contents finden (im gleichen Modal oder Page)
            const scope = this.closest('.page-container--modal, .page-container') || document;
            scope.querySelectorAll(contentSelector).forEach(c => c.classList.remove('active'));

            // Aktuellen Tab aktivieren
            this.classList.add('active');
            const contentId = contentIdPrefix + this.dataset.tab;
            const content = scope.querySelector('#' + contentId) || document.getElementById(contentId);
            if (content) content.classList.add('active');
        });
    });
}

/**
 * Initialisiert Filter-Buttons (nur einer aktiv pro Gruppe)
 * @param {string} buttonSelector - CSS-Selektor für Filter-Buttons
 * @param {Function} [callback] - Optionale Callback-Funktion mit dem aktiven Button als Parameter
 */
function initFilterButtons(buttonSelector, callback) {
    document.querySelectorAll(buttonSelector).forEach(btn => {
        btn.addEventListener('click', function() {
            // Nur Buttons im gleichen Parent deaktivieren
            const selector = buttonSelector.split(' ').pop();
            this.parentElement.querySelectorAll(selector).forEach(b => {
                b.classList.remove('active');
                if (b.dataset.neutral !== undefined || b.classList.contains('btn-toggle')) {
                    b.classList.add('neutral');
                }
            });
            this.classList.add('active');
            this.classList.remove('neutral');

            if (callback) callback(this);
        });
    });
}

/**
 * Initialisiert Accordion-Toggle
 * @param {string} triggerSelector - CSS-Selektor für Trigger-Elemente
 * @param {string} [arrowSelector] - CSS-Selektor für Arrow-Icon (relativ zum Trigger)
 */
function initAccordion(triggerSelector, arrowSelector = null) {
    document.querySelectorAll(triggerSelector).forEach(trigger => {
        trigger.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isOpen = content.style.display !== 'none';

            content.style.display = isOpen ? 'none' : 'block';

            if (arrowSelector) {
                const arrow = this.querySelector(arrowSelector);
                if (arrow) {
                    arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
                }
            }
        });
    });
}

/**
 * Initialisiert Popup-Toggle (z.B. Info-Popups, Tooltips)
 * @param {string} triggerSelector - CSS-Selektor für Trigger-Elemente
 * @param {string} popupSelector - CSS-Selektor für Popup (relativ zum Trigger)
 */
function initPopupToggle(triggerSelector, popupSelector) {
    document.querySelectorAll(triggerSelector).forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const popup = this.querySelector(popupSelector);
            if (popup) {
                // Alle anderen Popups schließen
                document.querySelectorAll(popupSelector).forEach(p => {
                    if (p !== popup) p.style.display = 'none';
                });
                popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
            }
        });
    });

    // Klick außerhalb schließt alle Popups
    document.addEventListener('click', function() {
        document.querySelectorAll(popupSelector).forEach(p => p.style.display = 'none');
    });
}

/**
 * Öffnet ein Modal per ID
 * @param {string} modalId - ID des Modal-Elements
 * @param {Object} [options] - Optionale Einstellungen
 * @param {boolean} [options.scrollToTop=true] - Nach oben scrollen beim Öffnen
 * @param {boolean} [options.lockBody=true] - Body-Scroll sperren
 * @param {string} [options.focusId] - ID des Elements, das fokussiert werden soll
 */
function openModalById(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const { scrollToTop = true, lockBody = true, focusId } = options;

    modal.classList.add('active');

    // Body-Scroll sperren
    if (lockBody && typeof lockBodyScroll === 'function') {
        lockBodyScroll();
    }

    // Nach oben scrollen
    if (scrollToTop) {
        const scrollableContent = modal.querySelector('.page-content, .modal-body');
        if (scrollableContent) scrollableContent.scrollTop = 0;
    }

    // Element fokussieren
    if (focusId) {
        const focusEl = document.getElementById(focusId);
        if (focusEl) setTimeout(() => focusEl.focus(), 50);
    }
}

/**
 * Schließt ein Modal per ID
 * @param {string} modalId - ID des Modal-Elements
 * @param {Object} [options] - Optionale Einstellungen
 * @param {boolean} [options.unlockBody=true] - Body-Scroll entsperren
 */
function closeModalById(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const { unlockBody = true } = options;

    modal.classList.remove('active');

    // Body-Scroll entsperren
    if (unlockBody && typeof unlockBodyScroll === 'function') {
        unlockBodyScroll();
    }
}

/**
 * Initialisiert Modal-Klick-außerhalb-schließen
 * @param {string} modalId - ID des Modal-Elements
 * @param {Function} [closeFunction] - Optionale Close-Funktion
 */
function initModalBackdropClose(modalId, closeFunction) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (closeFunction) {
                    closeFunction();
                } else {
                    closeModalById(modalId);
                }
            }
        });
    }
}

/**
 * Shell-gesteuerte Tabs: Zeigt nur den aktiven Tab an
 * Wird von Shell per postMessage navFilter gesteuert
 * @param {string} value - Tab-Wert (data-tab Attribut)
 * @param {Object} [options] - Optionen
 * @param {string} [options.tabSelector='.page-header-tabs .kw-tab'] - CSS-Selektor für Tabs
 * @param {string} [options.contentSelector] - CSS-Selektor für Tab-Contents (optional)
 * @param {string} [options.titleSelector] - CSS-Selektor für Titel-Element (optional)
 * @param {Object} [options.labelMap] - Mapping von value zu Label-Text (optional)
 * @param {Object} [options.subTabs] - Sub-Tab-Container pro Section { sectionValue: { containerId, firstTabId } }
 */
function selectShellTab(value, options = {}) {
    // Alle Sub-Tab-Container ausblenden
    Object.values(options.subTabs).forEach(config => {
        const container = document.getElementById(config.containerId);
        if (container) container.style.display = 'none';
    });

    // Alle Contents ausblenden
    if (options.contentSelector) {
        document.querySelectorAll(options.contentSelector).forEach(c => {
            c.classList.remove('active');
        });
    }

    // Aktiven Sub-Tab-Container einblenden
    const cfg = options.subTabs[value];
    if (cfg) {
        const container = document.getElementById(cfg.containerId);
        if (container) {
            container.style.display = 'flex';
            // Ersten Tab im Container aktivieren
            container.querySelectorAll('.kw-tab').forEach(t => t.classList.remove('active'));
            const firstTab = container.querySelector('.kw-tab');
            if (firstTab) firstTab.classList.add('active');
        }
        // Ersten Content aktivieren
        if (cfg.firstContentId) {
            const firstContent = document.getElementById(cfg.firstContentId);
            if (firstContent) firstContent.classList.add('active');
        }
        // Titel aktualisieren
        if (options.titleSelector && cfg.title) {
            const titleEl = document.querySelector(options.titleSelector);
            if (titleEl) titleEl.textContent = cfg.title;
        }
    }
}

// Global verfügbar machen
window.initTabs = initTabs;
window.initFilterButtons = initFilterButtons;
window.initAccordion = initAccordion;
window.initPopupToggle = initPopupToggle;
window.openModalById = openModalById;
window.closeModalById = closeModalById;
window.initModalBackdropClose = initModalBackdropClose;
window.selectShellTab = selectShellTab;

// ============================================================================
// PREISVORLAGEN FUNKTIONEN
// ============================================================================

// Beispieldaten für Preisvorlagen
const preisvorlagenData = {
    standard: {
        name: 'DRK Standard',
        symbol: 'checkmark',
        desc: 'Standard-Preisvorlage für alle Formulare',
        beitraege: [
            { label: 'Klein', value: 5, sub: 'pro Monat' },
            { label: 'Mittel', value: 10, sub: 'pro Monat' },
            { label: 'Groß', value: 20, sub: 'pro Monat' }
        ]
    },
    premium: {
        name: 'Premium Beiträge',
        symbol: 'star',
        desc: 'Höhere Beiträge für engagierte Fördermitglieder',
        beitraege: [
            { label: 'Basis', value: 15, sub: 'pro Monat' },
            { label: 'Plus', value: 30, sub: 'pro Monat' },
            { label: 'Premium', value: 50, sub: 'pro Monat' }
        ]
    }
};

let currentPreisvorlageId = null;

function editPreisvorlage(id) {
    currentPreisvorlageId = id;
    const data = preisvorlagenData[id];

    if (!data) return;

    // Modal-Titel setzen
    document.getElementById('preisvorlageModalTitle').textContent = 'Preisvorlage bearbeiten';

    // Felder befüllen
    document.getElementById('preisvorlageName').value = data.name;
    document.getElementById('preisvorlageDesc').value = data.desc;

    // Symbol auswählen
    document.querySelectorAll('.symbol-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.symbol === data.symbol);
    });

    // Beiträge befüllen
    document.getElementById('beitrag1Label').value = data.beitraege[0]?.label || '';
    document.getElementById('beitrag1Value').value = data.beitraege[0]?.value || '';
    document.getElementById('beitrag1Sub').value = data.beitraege[0]?.sub || '';

    document.getElementById('beitrag2Label').value = data.beitraege[1]?.label || '';
    document.getElementById('beitrag2Value').value = data.beitraege[1]?.value || '';
    document.getElementById('beitrag2Sub').value = data.beitraege[1]?.sub || '';

    document.getElementById('beitrag3Label').value = data.beitraege[2]?.label || '';
    document.getElementById('beitrag3Value').value = data.beitraege[2]?.value || '';
    document.getElementById('beitrag3Sub').value = data.beitraege[2]?.sub || '';

    openModalById('preisvorlageModal');
}

function openNewPreisvorlageModal() {
    currentPreisvorlageId = null;

    // Modal-Titel setzen
    document.getElementById('preisvorlageModalTitle').textContent = 'Neue Preisvorlage erstellen';

    // Felder leeren
    document.getElementById('preisvorlageName').value = '';
    document.getElementById('preisvorlageDesc').value = '';

    // Erstes Symbol auswählen
    document.querySelectorAll('.symbol-option').forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
    });

    // Beiträge leeren
    ['1', '2', '3'].forEach(n => {
        document.getElementById('beitrag' + n + 'Label').value = '';
        document.getElementById('beitrag' + n + 'Value').value = '';
        document.getElementById('beitrag' + n + 'Sub').value = '';
    });

    openModalById('preisvorlageModal');
}

async function savePreisvorlage() {
    const name = document.getElementById('preisvorlageName').value.trim();
    const desc = document.getElementById('preisvorlageDesc').value.trim();
    const symbol = document.querySelector('.symbol-option.active')?.dataset.symbol || 'checkmark';

    if (!name) {
        showToast('Bitte Namen eingeben', 'warning');
        return;
    }

    const beitraege = [
        {
            label: document.getElementById('beitrag1Label').value,
            value: parseInt(document.getElementById('beitrag1Value').value) || 0,
            sub: document.getElementById('beitrag1Sub').value
        },
        {
            label: document.getElementById('beitrag2Label').value,
            value: parseInt(document.getElementById('beitrag2Value').value) || 0,
            sub: document.getElementById('beitrag2Sub').value
        },
        {
            label: document.getElementById('beitrag3Label').value,
            value: parseInt(document.getElementById('beitrag3Value').value) || 0,
            sub: document.getElementById('beitrag3Sub').value
        }
    ];

    // Hier würde normalerweise ein API-Call kommen
    closeModalById('preisvorlageModal');
    showToast('Preisvorlage gespeichert', 'success');
}

async function deletePreisvorlage(id) {
    const confirmed = await showConfirm('Löschen', 'Möchten Sie diese Preisvorlage wirklich löschen?', 'warning');
    if (confirmed) {
        showToast('Preisvorlage gelöscht', 'success');
    }
}

// Symbol-Picker initialisieren
function initSymbolPicker() {
    const picker = document.getElementById('symbolPicker');
    if (picker) {
        picker.addEventListener('click', (e) => {
            const btn = e.target.closest('.symbol-option');
            if (btn) {
                document.querySelectorAll('.symbol-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    }
}

// Global verfügbar machen
window.editPreisvorlage = editPreisvorlage;
window.openNewPreisvorlageModal = openNewPreisvorlageModal;
window.savePreisvorlage = savePreisvorlage;
window.deletePreisvorlage = deletePreisvorlage;
window.initSymbolPicker = initSymbolPicker;

/**
 * Formatiert ein Datum als relative Zeitangabe (z.B. "vor 5 Min.")
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} Relative Zeitangabe
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Gerade eben';
    if (diffMin < 60) return `vor ${diffMin} Min.`;
    if (diffHour < 24) return `vor ${diffHour} Std.`;
    return date.toLocaleDateString('de-DE');
}

window.formatTimeAgo = formatTimeAgo;

// ============================================================================
// PHOTO UPLOAD
// ============================================================================

/**
 * Initialisiert Photo-Upload mit Preview
 * @param {string} inputId - ID des File-Inputs
 * @param {string} previewId - ID des Preview-Image-Elements
 */
function initPhotoUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.parentElement.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });
}

window.initPhotoUpload = initPhotoUpload;

// ============================================================================
// VAT TOGGLE (Umsatzsteuer)
// ============================================================================

/**
 * Initialisiert einen Umsatzsteuer-Toggle
 * @param {string} checkboxId - ID der Checkbox
 * @param {string} labelId - ID des Label-Elements
 */
function initVatToggle(checkboxId, labelId) {
    const checkbox = document.getElementById(checkboxId);
    const label = document.getElementById(labelId);
    if (!checkbox || !label) return;

    function updateLabel() {
        if (checkbox.checked) {
            label.textContent = 'Ja - Umsatzsteuerpflichtig';
        } else {
            label.textContent = 'Nein - Kleinunternehmer (§19 UStG)';
        }
    }

    checkbox.addEventListener('change', updateLabel);
    updateLabel();
}

window.initVatToggle = initVatToggle;

// ============================================================================
// ADDRESS AUTOCOMPLETE
// ============================================================================

/**
 * Initialisiert Address-Autocomplete für ein Straßen-Feld
 * @param {Object} config - Konfiguration mit Feld-IDs
 * @param {string} config.streetId - ID des Straßen-Inputs
 * @param {string} config.resultsId - ID des Autocomplete-Results Containers
 * @param {string} config.houseNumberId - ID des Hausnummer-Felds
 * @param {string} config.postalCodeId - ID des PLZ-Felds
 * @param {string} config.cityId - ID des Stadt-Felds
 * @param {string} [config.countryId] - Optional: ID des Land-Felds
 * @param {string} [config.stateId] - Optional: ID des Bundesland-Felds
 */
function initAddressAutocomplete(config) {
    const streetInput = document.getElementById(config.streetId);
    const autocompleteResults = document.getElementById(config.resultsId);

    if (!streetInput || !autocompleteResults) return;

    let autocompleteTimer = null;
    let currentRequestId = 0;

    streetInput.addEventListener('input', function() {
        searchStreetAddress(this.value);
    });

    async function searchStreetAddress(query) {
        if (query.length < 3) {
            autocompleteResults.classList.remove('show');
            return;
        }

        if (autocompleteTimer) {
            clearTimeout(autocompleteTimer);
        }

        currentRequestId++;
        const thisRequestId = currentRequestId;

        autocompleteTimer = setTimeout(async () => {
            try {
                const url = `https://lgztglycqtiwcmiydxnm.supabase.co/functions/v1/address-search?query=${encodeURIComponent(query)}`;

                const response = await fetch(url, {
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc2MTUsImV4cCI6MjA3OTM4MzYxNX0.a_ZeubRokmhdevV3JinTiD1Ji92C4bDHSiiDcYGZnt0',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc2MTUsImV4cCI6MjA3OTM4MzYxNX0.a_ZeubRokmhdevV3JinTiD1Ji92C4bDHSiiDcYGZnt0'
                    }
                });

                if (thisRequestId !== currentRequestId) return;

                const data = await response.json();

                if (!data.results || data.results.length === 0) {
                    autocompleteResults.classList.remove('show');
                    return;
                }

                const streetResults = data.results.filter(result => {
                    return result.street && result.street.trim() !== '';
                });

                if (streetResults.length === 0) {
                    autocompleteResults.classList.remove('show');
                    return;
                }

                autocompleteResults.innerHTML = '';

                streetResults.slice(0, 5).forEach(result => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';

                    const street = result.street || '';
                    const houseNumber = result.housenumber || '';
                    const postcode = result.postcode || '';
                    const city = result.city || '';

                    item.innerHTML = `${street} ${houseNumber}, ${postcode} ${city}`;

                    item.addEventListener('click', function() {
                        document.getElementById(config.streetId).value = street;
                        if (config.houseNumberId) document.getElementById(config.houseNumberId).value = houseNumber;
                        if (config.postalCodeId) document.getElementById(config.postalCodeId).value = postcode;
                        if (config.cityId) document.getElementById(config.cityId).value = city;
                        if (config.countryId) document.getElementById(config.countryId).value = result.country || '';
                        if (config.stateId) document.getElementById(config.stateId).value = result.state || '';

                        autocompleteResults.classList.remove('show');
                    });

                    autocompleteResults.appendChild(item);
                });

                autocompleteResults.classList.add('show');

            } catch (error) {
                console.error('Address search error:', error);
                autocompleteResults.classList.remove('show');
            }
        }, 150);
    }

    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-container')) {
            autocompleteResults.classList.remove('show');
        }
    });
}

window.initAddressAutocomplete = initAddressAutocomplete;

// ============================================================================
// HISTORY ITEMS RENDERING (für Gutschriftrechnungen, Auszahlungen, etc.)
// ============================================================================

/**
 * Rendert History-Items in eine Timeline
 * @param {string} listId - ID des Listen-Containers
 * @param {string} emptyId - ID des Empty-State Elements
 * @param {Array} items - Array mit Items (benötigt: id, title, meta, status, statusClass)
 */
function renderHistoryItems(listId, emptyId, items) {
    const list = document.getElementById(listId);
    const emptyState = document.getElementById(emptyId);

    if (!list) return;

    if (!items || items.length === 0) {
        list.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    list.innerHTML = items.map(item => {
        const statusClass = item.statusClass || 'aenderung';
        const icon = statusClass === 'neumitglied'
            ? 'M5 13l4 4L19 7'
            : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';

        return `
            <div class="history-item ${statusClass}">
                <div class="history-item-dot">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"/>
                    </svg>
                </div>
                <div class="history-item-content">
                    <div class="history-item-title">${escapeHtml(item.title)}</div>
                    <div class="history-item-meta">${escapeHtml(item.meta)}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Rendert Gutschriftrechnungen als History-Items
 * @param {string} listId - ID des Listen-Containers
 * @param {string} emptyId - ID des Empty-State Elements
 * @param {Array} invoices - Array mit Rechnungs-Daten
 */
function renderInvoiceHistory(listId, emptyId, invoices) {
    if (!invoices) {
        renderHistoryItems(listId, emptyId, []);
        return;
    }

    const items = invoices.map(invoice => ({
        id: invoice.id,
        title: `${invoice.name} - ${formatCurrency(invoice.amount)}`,
        meta: `${invoice.date} • ${invoice.status === 'paid' ? 'Ausgezahlt' : 'Ausstehend'}`,
        statusClass: invoice.status === 'paid' ? 'neumitglied' : 'aenderung'
    }));

    renderHistoryItems(listId, emptyId, items);
}

window.renderHistoryItems = renderHistoryItems;
window.renderInvoiceHistory = renderInvoiceHistory;

// ============================================================================
// EINSATZ TIMELINE (Horizontal)
// ============================================================================

/**
 * Rendert eine horizontale Timeline mit Einsätzen
 * @param {string} containerId - ID des Container-Elements
 * @param {string} fromDate - Start-Datum des Zeitraums (Format: DD.MM.YYYY)
 * @param {string} toDate - End-Datum des Zeitraums (Format: DD.MM.YYYY)
 * @param {Array} einsaetze - Array mit Einsatz-Objekten
 *   - von: Start-Datum (DD.MM.YYYY)
 *   - bis: End-Datum (DD.MM.YYYY)
 *   - kampagne: Name der Kampagne
 *   - gebiet: Einsatzgebiet
 *   - mg: Anzahl Mitglieder
 *   - je: Jahreserfolg in Prozent
 *   - eh: Anzahl Erhöhungen
 */
function renderEinsatzTimeline(containerId, fromDate, toDate, einsaetze, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Standard-Stats oder custom Stats
    const defaultStats = [
        { key: 'mg', label: 'MG' },
        { key: 'je', label: 'JE', suffix: '%' },
        { key: 'eh', label: 'EH' }
    ];
    const stats = options.stats || defaultStats;

    // Container leeren und Wrapper-Klasse setzen
    container.innerHTML = '';
    container.className = 'timeline-horizontal-wrapper';

    // Timeline-Zeile erstellen
    const timeline = document.createElement('div');
    timeline.className = 'timeline-horizontal';
    container.appendChild(timeline);

    // Von-Label
    const fromLabel = document.createElement('span');
    fromLabel.className = 'timeline-horizontal-label timeline-horizontal-label--from';
    fromLabel.textContent = fromDate;
    timeline.appendChild(fromLabel);

    // Track
    const track = document.createElement('div');
    track.className = 'timeline-horizontal-track';
    timeline.appendChild(track);

    // Bis-Label
    const toLabel = document.createElement('span');
    toLabel.className = 'timeline-horizontal-label timeline-horizontal-label--to';
    toLabel.textContent = toDate;
    timeline.appendChild(toLabel);

    // Keine Einsätze?
    if (!einsaetze || einsaetze.length === 0) {
        track.innerHTML = '<span class="timeline-horizontal-empty">Keine Einsätze im Zeitraum</span>';
        return;
    }

    // Zeitraum berechnen
    const fromParsed = parseGermanDate(fromDate);
    const toParsed = parseGermanDate(toDate);
    const totalDays = Math.max(1, (toParsed - fromParsed) / (1000 * 60 * 60 * 24));

    // Einsätze als Punkte rendern
    einsaetze.forEach((einsatz, index) => {
        const einsatzStart = parseGermanDate(einsatz.von);
        const einsatzEnd = parseGermanDate(einsatz.bis);

        // Position berechnen (Mittelpunkt des Einsatzes)
        const einsatzMitte = new Date((einsatzStart.getTime() + einsatzEnd.getTime()) / 2);
        const daysFromStart = (einsatzMitte - fromParsed) / (1000 * 60 * 60 * 24);
        const position = Math.max(2, Math.min(98, (daysFromStart / totalDays) * 100));

        // Dot erstellen
        const dot = document.createElement('div');
        dot.className = 'timeline-horizontal-dot';
        dot.style.left = position + '%';

        // Kärtchen mit Kampagnenname (abwechselnd oben/unten)
        const card = document.createElement('div');
        const isTop = index % 2 === 0;
        card.className = 'timeline-horizontal-card timeline-horizontal-card--' + (isTop ? 'top' : 'bottom');
        card.textContent = einsatz.kampagne;
        dot.appendChild(card);

        // Stats HTML generieren
        const statsHtml = stats.map(stat => `
            <div class="timeline-horizontal-tooltip-stat">
                <div class="timeline-horizontal-tooltip-stat-value">${einsatz[stat.key]}${stat.suffix || ''}</div>
                <div class="timeline-horizontal-tooltip-stat-label">${stat.label}</div>
            </div>
        `).join('');

        // Tooltip erstellen
        const tooltip = document.createElement('div');
        tooltip.className = 'timeline-horizontal-tooltip';
        tooltip.innerHTML = `
            <div class="timeline-horizontal-tooltip-title">${einsatz.kampagne}</div>
            <div class="timeline-horizontal-tooltip-meta">${einsatz.gebiet} • ${einsatz.von} - ${einsatz.bis}</div>
            <div class="timeline-horizontal-tooltip-stats">${statsHtml}</div>
        `;

        dot.appendChild(tooltip);
        track.appendChild(dot);
    });
}

window.renderEinsatzTimeline = renderEinsatzTimeline;

// ============================================================================
// DOCUMENT UPLOAD
// ============================================================================

/**
 * Initialisiert Document-Upload Funktionalität mit Multi-File Support
 * @param {string} inputId - ID des File-Inputs
 * @param {string} boxId - ID der Upload-Box
 * @param {string} listId - ID der Dateiliste (optional, wird automatisch generiert wenn nicht vorhanden)
 */
function initDocumentUpload(inputId, boxId, listId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);

    if (!input || !box) return;

    // Dateiliste finden oder erstellen
    let list = listId ? document.getElementById(listId) : null;
    if (!list) {
        list = document.createElement('div');
        list.className = 'document-file-list';
        list.id = inputId + 'List';
        box.parentNode.appendChild(list);
    }

    // Dateien-Array für dieses Upload-Feld
    const files = [];
    const uploadKey = inputId;

    // Render-Funktion
    function renderFileList() {
        if (files.length === 0) {
            list.innerHTML = '';
            return;
        }

        list.innerHTML = files.map((file, index) => `
            <div class="document-file-row">
                <svg class="document-file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="document-file-name" title="${file.name}">${file.name}</span>
                <div class="document-file-actions">
                    <button type="button" class="btn btn-sm btn-icon" data-action="download" data-index="${index}" title="Herunterladen">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                    </button>
                    <button type="button" class="btn btn-sm btn-icon btn-danger" data-action="delete" data-index="${index}" title="Löschen">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Download-Handler
        list.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const fileData = files[index];
                if (fileData.file) {
                    // Lokale Datei - Download via Blob URL
                    const url = URL.createObjectURL(fileData.file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileData.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else if (fileData.url) {
                    // Remote-Datei - direkter Link
                    window.open(fileData.url, '_blank');
                }
            });
        });

        // Delete-Handler
        list.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const file = files[index];
                const confirmed = await showConfirm(
                    'Datei löschen',
                    `Möchtest du "${file.name}" wirklich löschen?`,
                    'warning'
                );
                if (confirmed) {
                    files.splice(index, 1);
                    renderFileList();
                    showToast('Datei gelöscht', 'success');
                }
            });
        });
    }

    // Click auf Box öffnet File-Dialog
    box.addEventListener('click', () => input.click());

    // File-Change Handler - unterstützt mehrere Dateien
    input.addEventListener('change', function() {
        if (!this.files || this.files.length === 0) return;

        // Alle ausgewählten Dateien hinzufügen
        Array.from(this.files).forEach(file => {
            files.push({ name: file.name, file: file });
        });

        renderFileList();
        this.value = '';
    });

    // Initiales Render
    renderFileList();
}

window.initDocumentUpload = initDocumentUpload;

console.log('%c UI Utilities geladen ', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');

// ============================================================================
// PROFIL-SEITE FUNKTIONEN
// ============================================================================

// ================================================================
// KARRIERESTUFEN KONFIGURATION
// ================================================================
const CAREER_LEVELS = {
    sma: { name: 'Starting Marketing Advisor', code: 'SMA', stufe: 'I', stars: 1, color: '#78909C' },
    ema: { name: 'Executive Marketing Advisor', code: 'EMA', stufe: 'II', stars: 2, color: '#4CAF50' },
    jmm: { name: 'Junior Marketing Manager', code: 'JMM', stufe: 'III', stars: 3, color: '#2196F3' },
    emm: { name: 'Executive Marketing Manager', code: 'EMM', stufe: 'IV', stars: 4, color: '#9C27B0' },
    cemm: { name: 'Chief Executive Marketing Manager', code: 'CEMM', stufe: 'V', stars: 5, color: '#E040FB' },
    spb: { name: 'Spitzen Botschafter', code: 'SPB', stufe: 'VI', stars: 6, color: '#FFA500' },
    kad: { name: 'Kadermanager', code: 'KAD', stufe: 'VII', stars: 7, color: '#FFD700' },
    fue: { name: 'Führungsebene', code: 'FUE', stufe: 'VIII', stars: 8, color: '#2C3E50' }
};

// Rollen-Konfiguration mit Faktoren und Benefits
const ROLE_CONFIG = {
    'sma': {
        name: 'Starting Marketing Advisor',
        short: 'SMA',
        faktor: 5.0,
        stars: 1,
        color: '#78909C',
        glow: 0,
        benefits: ['Einstieg ins Team', 'Grundprovision', 'Schulungszugang']
    },
    'ema': {
        name: 'Executive Marketing Advisor',
        short: 'EMA',
        faktor: 5.5,
        stars: 2,
        color: '#4CAF50',
        glow: 0,
        benefits: ['Erhöhte Provision', 'Bonus-Berechtigung', 'Erweiterte Schulungen']
    },
    'jmm': {
        name: 'Junior Marketing Manager',
        short: 'JMM',
        faktor: 6.0,
        stars: 3,
        color: '#2196F3',
        glow: 0,
        benefits: ['Factor 6.0', 'Team-Events Zugang', 'Mentoring-Programm']
    },
    'junior_marketing_manager': {
        name: 'Junior Marketing Manager',
        short: 'JMM',
        faktor: 6.0,
        stars: 3,
        color: '#2196F3',
        glow: 0,
        benefits: ['Factor 6.0', 'Team-Events Zugang', 'Mentoring-Programm']
    },
    'emm': {
        name: 'Executive Marketing Manager',
        short: 'EMM',
        faktor: 6.5,
        stars: 4,
        color: '#9C27B0',
        glow: 1,
        benefits: ['Factor 6.5', 'Leadership-Training', 'Bonus-Pool Zugang']
    },
    'senior_marketing_manager': {
        name: 'Executive Marketing Manager',
        short: 'EMM',
        faktor: 6.5,
        stars: 4,
        color: '#9C27B0',
        glow: 1,
        benefits: ['Factor 6.5', 'Leadership-Training', 'Bonus-Pool Zugang']
    },
    'cemm': {
        name: 'Chief Executive Marketing Manager',
        short: 'CEMM',
        faktor: 6.75,
        stars: 5,
        color: '#E040FB',
        glow: 2,
        benefits: ['Factor 6.75', 'Premium Events', 'Karriere-Coaching']
    },
    'spb': {
        name: 'Spitzen Botschafter',
        short: 'SPB',
        faktor: 7.0,
        stars: 6,
        color: '#FFA500',
        glow: 3,
        benefits: ['Factor 7.0', 'VIP Status', 'Exklusive Boni', 'Reise-Incentives']
    },
    'spitzenbotschafter': {
        name: 'Spitzen Botschafter',
        short: 'SPB',
        faktor: 7.0,
        stars: 6,
        color: '#FFA500',
        glow: 3,
        benefits: ['Factor 7.0', 'VIP Status', 'Exklusive Boni', 'Reise-Incentives']
    },
    'kad': {
        name: 'Kadermanager',
        short: 'KAD',
        faktor: 7.5,
        stars: 7,
        color: '#FFD700',
        glow: 4,
        benefits: ['Factor 7.5', 'Team-Provision', 'Management-Boni', 'Premium Support']
    },
    'kader_manager': {
        name: 'Kadermanager',
        short: 'KAD',
        faktor: 7.5,
        stars: 7,
        color: '#FFD700',
        glow: 4,
        benefits: ['Factor 7.5', 'Team-Provision', 'Management-Boni', 'Premium Support']
    },
    'fue': {
        name: 'Führungsebene',
        short: 'FUE',
        faktor: 8.0,
        stars: 8,
        color: '#2C3E50',
        glow: 5,
        benefits: ['Factor 8.0 MAX', 'Unternehmens-Beteiligung', 'Unbegrenzte Boni', 'Elite Status']
    },
    'führungsebene': {
        name: 'Führungsebene',
        short: 'FUE',
        faktor: 8.0,
        stars: 8,
        color: '#2C3E50',
        glow: 5,
        benefits: ['Factor 8.0 MAX', 'Unternehmens-Beteiligung', 'Unbegrenzte Boni', 'Elite Status']
    },
    'admin': {
        name: 'Administrator',
        short: 'ADM',
        faktor: 8.0,
        stars: 8,
        color: '#2C3E50',
        glow: 5,
        benefits: ['Volle System-Rechte', 'Alle Bereiche', 'Verwaltungs-Zugang', 'Elite Status']
    }
};

// Zusatz-Rollen Benefits
const ADDITIONAL_ROLE_BENEFITS = {
    quality_manager: {
        name: 'Quality Manager',
        benefits: ['Zugriff Qualitätsmodul', 'Datensatz-Prüfung', 'Auffälligkeiten markieren']
    },
    recruiting_manager: {
        name: 'Recruiting Manager',
        benefits: ['Zugriff Recruiting Portal', 'Empfehlungsprovision', 'Mitarbeiter werben']
    }
};

// Rollen die Preisvorlagen freischalten (EMM und höher)
const PREISVORLAGEN_ALLOWED_ROLES = ['emm', 'cemm', 'spb', 'kad', 'fue'];

window.CAREER_LEVELS = CAREER_LEVELS;
window.ROLE_CONFIG = ROLE_CONFIG;
window.ADDITIONAL_ROLE_BENEFITS = ADDITIONAL_ROLE_BENEFITS;
window.PREISVORLAGEN_ALLOWED_ROLES = PREISVORLAGEN_ALLOWED_ROLES;

// ================================================================
// HEADER BADGE FUNKTIONEN
// ================================================================

function updateHeaderBadge(roleKey) {
    const level = CAREER_LEVELS[roleKey];
    const badge = document.getElementById('headerBadge');
    const codeEl = document.getElementById('headerBadgeCode');
    const stufeEl = document.getElementById('headerBadgeStufe');
    const starsEl = document.getElementById('headerBadgeStars');
    const nameEl = document.getElementById('headerBadgeName');

    if (!badge) return;

    if (level) {
        badge.style.setProperty('--level-color', level.color);
        badge.style.background = level.color;
        if (codeEl) codeEl.textContent = level.code;
        if (stufeEl) stufeEl.textContent = 'Stufe ' + level.stufe;
        if (nameEl) nameEl.textContent = level.name;

        // Sterne generieren
        if (starsEl) {
            let starsHtml = '';
            for (let i = 0; i < level.stars; i++) {
                starsHtml += '<svg class="level-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            }
            starsEl.innerHTML = starsHtml;
        }
    } else {
        badge.style.background = '#78909C';
        if (codeEl) codeEl.textContent = '-';
        if (stufeEl) stufeEl.textContent = 'Stufe -';
        if (starsEl) starsEl.innerHTML = '';
        if (nameEl) nameEl.textContent = 'Keine Stufe';
    }
}

// ================================================================
// MINI BADGE GENERIERUNG
// ================================================================

function generateMiniBadge(roleKey) {
    const level = CAREER_LEVELS[roleKey];
    if (!level) return '';

    let starsHtml = '';
    const maxStars = Math.min(level.stars, 4);
    for (let i = 0; i < maxStars; i++) {
        starsHtml += '<svg class="mini-badge-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    return `
        <div class="mini-badge" style="background: ${level.color};">
            <span class="mini-badge-code">${level.code}</span>
            <div class="mini-badge-stars">${starsHtml}</div>
        </div>
    `;
}

function generateFactorBadge(roleKey) {
    const level = CAREER_LEVELS[roleKey];
    if (!level) return '';

    let starsHtml = '';
    const maxStars = Math.min(level.stars, 5);
    for (let i = 0; i < maxStars; i++) {
        starsHtml += '<svg class="factor-badge-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    return `
        <div class="factor-badge" style="background: ${level.color};">
            <span class="factor-badge-code">${level.code}</span>
            <div class="factor-badge-stars">${starsHtml}</div>
        </div>
    `;
}

function updateFactorBadge(roleKey) {
    const container = document.getElementById('factorBadgeContainer');
    if (!container) return;

    if (roleKey && CAREER_LEVELS[roleKey]) {
        container.innerHTML = generateFactorBadge(roleKey);
        container.style.display = 'flex';
        container.style.alignSelf = 'stretch';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

function updateCurrentRoleMiniWappen(roleKey) {
    const wappenContainer = document.getElementById('currentRoleMiniWappen');

    if (roleKey && CAREER_LEVELS[roleKey]) {
        const miniBadgeHtml = generateMiniBadge(roleKey);
        if (wappenContainer) {
            wappenContainer.innerHTML = miniBadgeHtml;
            wappenContainer.style.display = 'block';
        }
    } else {
        if (wappenContainer) {
            wappenContainer.innerHTML = '';
            wappenContainer.style.display = 'none';
        }
    }
}

window.updateHeaderBadge = updateHeaderBadge;
window.generateMiniBadge = generateMiniBadge;
window.generateFactorBadge = generateFactorBadge;
window.updateFactorBadge = updateFactorBadge;
window.updateCurrentRoleMiniWappen = updateCurrentRoleMiniWappen;

/**
 * Generiert ein Level-Badge HTML mit zentralen CSS-Klassen
 * @param {string} roleKey - z.B. 'jmm', 'emm'
 * @param {string} size - 'sm', 'md', 'lg', 'xl' (default: 'lg')
 * @returns {string} HTML des Badges
 */
function generateLevelBadge(roleKey, size = 'lg') {
    const level = CAREER_LEVELS[roleKey];

    // Platzhalter-Badge wenn keine Stufe ausgewählt (SMA-Struktur, hellgrau)
    if (!level) {
        return `
            <div class="level-badge level-badge--${size} level-badge--placeholder">
                <span class="level-badge-code">SMA</span>
                <span class="level-badge-stufe">Stufe I</span>
                <div class="level-stars">
                    <svg class="level-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
            </div>
            <span class="level-name">Keine Stufe ausgewählt</span>
        `;
    }

    const config = ROLE_CONFIG[roleKey] || {};
    const glowClass = config.glow ? `level-badge--glow-${config.glow}` : '';

    let starsHtml = '';
    for (let i = 0; i < level.stars; i++) {
        starsHtml += '<svg class="level-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    return `
        <div class="level-badge level-badge--${size} level-badge--${roleKey} ${glowClass}">
            <span class="level-badge-code">${level.code}</span>
            <span class="level-badge-stufe">Stufe ${level.stufe}</span>
            <div class="level-stars">${starsHtml}</div>
        </div>
        <span class="level-name">${level.name}</span>
    `;
}

window.generateLevelBadge = generateLevelBadge;

// ================================================================
// KALENDERWOCHE FUNKTIONEN
// ================================================================

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getMondayOfWeek(week, year) {
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
    return monday;
}

function getWeeksInYear(year) {
    const dec31 = new Date(year, 11, 31);
    const week = getWeekNumber(dec31);
    return week === 1 ? 52 : week;
}

function kwToDate(kw, year) {
    const jan1 = new Date(year, 0, 1);
    const daysToMonday = (8 - jan1.getDay()) % 7;
    const firstMonday = new Date(year, 0, 1 + daysToMonday);
    return new Date(firstMonday.getTime() + (kw - 1) * 7 * 24 * 60 * 60 * 1000);
}

window.getWeekNumber = getWeekNumber;
window.getMondayOfWeek = getMondayOfWeek;
window.getWeeksInYear = getWeeksInYear;
window.kwToDate = kwToDate;

// ================================================================
// KARRIERESTUFE AUSWAHL SYSTEM
// ================================================================

/**
 * Initialisiert das komplette Karrierestufe-Auswahl-System
 * @param {Object} config - Konfiguration mit Element-IDs
 */
function initCareerLevelSelector(config = {}) {
    const defaults = {
        mainRoleId: 'mainRole',
        kwNumberId: 'kwNumber',
        kwYearId: 'kwYear',
        kwPrevId: 'kwPrev',
        kwNextId: 'kwNext',
        roleKwToNumberId: 'roleKwToNumber',
        roleKwToYearId: 'roleKwToYear',
        roleKwToPrevId: 'roleKwToPrev',
        roleKwToNextId: 'roleKwToNext',
        roleEffectiveDateId: 'roleEffectiveDate',
        roleEffectiveDateToId: 'roleEffectiveDateTo',
        displayFaktorId: 'displayFaktor',
        factorIndividualHintId: 'factorIndividualHint',
        roleBenefitsId: 'roleBenefits',
        individualFactorCheckboxId: 'individualFactorCheckbox',
        individualFactorInputId: 'individualFactorInput',
        customFactorId: 'customFactor',
        saveRoleBtnId: 'saveRoleBtn',
        roleSaveHintId: 'roleSaveHint',
        kwHintId: 'kwHint',
        kwHintTextId: 'kwHintText',
        kwOverlapWarningId: 'kwOverlapWarning',
        kwOverlapDetailsId: 'kwOverlapDetails',
        careerHistoryTimelineId: 'careerHistoryTimeline',
        noCareerHistoryMessageId: 'noCareerHistoryMessage'
    };

    const cfg = { ...defaults, ...config };

    // State
    let currentKwYear = new Date().getFullYear();
    let currentKwWeek = getWeekNumber(new Date());
    const originalKwYear = currentKwYear;
    const originalKwWeek = currentKwWeek;
    let roleKwToYear = null;
    let roleKwToWeek = null;
    let roleKwToUnlimited = true;
    let individualFactorEnabled = false;
    let roleHistory = JSON.parse(localStorage.getItem('roleHistory') || '[]');

    // Elemente holen
    const mainRole = document.getElementById(cfg.mainRoleId);
    const kwNumber = document.getElementById(cfg.kwNumberId);
    const kwYear = document.getElementById(cfg.kwYearId);
    const kwPrev = document.getElementById(cfg.kwPrevId);
    const kwNext = document.getElementById(cfg.kwNextId);
    const roleKwToNumber = document.getElementById(cfg.roleKwToNumberId);
    const roleKwToYearEl = document.getElementById(cfg.roleKwToYearId);
    const roleKwToPrev = document.getElementById(cfg.roleKwToPrevId);
    const roleKwToNext = document.getElementById(cfg.roleKwToNextId);
    const displayFaktor = document.getElementById(cfg.displayFaktorId);
    const factorIndividualHint = document.getElementById(cfg.factorIndividualHintId);
    const roleBenefits = document.getElementById(cfg.roleBenefitsId);
    const individualFactorCheckbox = document.getElementById(cfg.individualFactorCheckboxId);
    const individualFactorInput = document.getElementById(cfg.individualFactorInputId);
    const customFactor = document.getElementById(cfg.customFactorId);
    const saveRoleBtn = document.getElementById(cfg.saveRoleBtnId);
    const roleSaveHint = document.getElementById(cfg.roleSaveHintId);
    const kwHint = document.getElementById(cfg.kwHintId);
    const kwHintText = document.getElementById(cfg.kwHintTextId);
    const kwOverlapWarning = document.getElementById(cfg.kwOverlapWarningId);
    const kwOverlapDetails = document.getElementById(cfg.kwOverlapDetailsId);
    const careerHistoryTimeline = document.getElementById(cfg.careerHistoryTimelineId);
    const noCareerHistoryMessage = document.getElementById(cfg.noCareerHistoryMessageId);

    // Prüfen ob alle benötigten Elemente vorhanden sind
    if (!mainRole) return;

    // KW-Anzeige aktualisieren
    function updateKwDisplay() {
        if (kwNumber) kwNumber.textContent = `KW ${currentKwWeek}`;
        if (kwYear) kwYear.textContent = currentKwYear;

        const selector = document.getElementById('roleKwFromSelector');

        if (currentKwWeek !== originalKwWeek || currentKwYear !== originalKwYear) {
            if (selector) selector.classList.add('changed');
            if (kwHint) kwHint.style.display = 'block';

            const mondayDate = getMondayOfWeek(currentKwWeek, currentKwYear);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (kwHintText) {
                if (mondayDate < today) {
                    kwHintText.textContent = `Rückwirkende Änderung ab ${mondayDate.toLocaleDateString('de-DE')} - Provisionen werden neu berechnet`;
                } else if (mondayDate > today) {
                    kwHintText.textContent = `Zukünftige Änderung ab ${mondayDate.toLocaleDateString('de-DE')}`;
                } else {
                    kwHintText.textContent = `Änderung ab dieser Woche (${mondayDate.toLocaleDateString('de-DE')})`;
                }
            }
        } else {
            if (selector) selector.classList.remove('changed');
            if (kwHint) kwHint.style.display = 'none';
        }

        const effectiveDate = getMondayOfWeek(currentKwWeek, currentKwYear);
        const roleEffectiveDate = document.getElementById(cfg.roleEffectiveDateId);
        if (roleEffectiveDate) roleEffectiveDate.value = effectiveDate.toISOString().split('T')[0];
    }

    // Bis-Datum Anzeige aktualisieren
    function updateRoleKwToDisplay() {
        if (roleKwToUnlimited) {
            if (roleKwToNumber) roleKwToNumber.textContent = '∞';
            if (roleKwToYearEl) roleKwToYearEl.textContent = '';
            const roleEffectiveDateTo = document.getElementById(cfg.roleEffectiveDateToId);
            if (roleEffectiveDateTo) roleEffectiveDateTo.value = '';
        } else {
            if (roleKwToNumber) roleKwToNumber.textContent = `KW ${roleKwToWeek}`;
            if (roleKwToYearEl) roleKwToYearEl.textContent = roleKwToYear;
            const effectiveDate = getMondayOfWeek(roleKwToWeek, roleKwToYear);
            const roleEffectiveDateTo = document.getElementById(cfg.roleEffectiveDateToId);
            if (roleEffectiveDateTo) roleEffectiveDateTo.value = effectiveDate.toISOString().split('T')[0];
        }
    }

    // Faktor-Anzeige aktualisieren
    function updateFactorDisplay() {
        const customFactorValue = customFactor ? customFactor.value : '';
        const faktorDisplay = displayFaktor;
        const faktorLabel = document.querySelector('.factor-label');
        const individualHint = factorIndividualHint;

        // Helper: Setzt Wert für input oder span
        function setDisplayValue(el, val) {
            if (!el) return;
            if (el.tagName === 'INPUT') {
                el.value = val;
            } else {
                el.textContent = val;
            }
        }

        if (individualFactorEnabled && customFactorValue && parseFloat(customFactorValue) > 0) {
            setDisplayValue(faktorDisplay, parseFloat(customFactorValue).toFixed(1));
            if (faktorLabel) faktorLabel.textContent = 'Faktor';
            if (individualHint) individualHint.style.display = 'block';
        } else if (mainRole && mainRole.value) {
            const config = ROLE_CONFIG[mainRole.value];
            if (config) {
                setDisplayValue(faktorDisplay, config.faktor.toFixed(1));
                if (faktorLabel) faktorLabel.textContent = 'Faktor';
                if (individualHint) individualHint.style.display = 'none';
            }
        } else {
            setDisplayValue(faktorDisplay, '-');
            if (faktorLabel) faktorLabel.textContent = 'Faktor';
            if (individualHint) individualHint.style.display = 'none';
        }
    }

    // Benefits anzeigen
    function updateRoleBenefits() {
        if (!roleBenefits || !mainRole) return;
        const config = ROLE_CONFIG[mainRole.value];
        if (config) {
            roleBenefits.innerHTML = `
                <div class="badge-column">
                    ${config.benefits.map(benefit => `<span class="section-badge">${benefit}</span>`).join('')}
                </div>
            `;
        } else {
            roleBenefits.innerHTML = '';
        }
    }

    // Badge-Anzeige aktualisieren
    function updateCareerBadgeDisplay() {
        const badgeContainer = document.getElementById('careerBadgeDisplay');
        if (!badgeContainer || !mainRole) return;
        badgeContainer.innerHTML = generateLevelBadge(mainRole.value, 'lg');
        // Name ausblenden (wie im Header)
        const levelName = badgeContainer.querySelector('.level-name');
        if (levelName) levelName.style.display = 'none';
    }

    // Prüfen ob Speichern möglich (für andere Validierungen)
    function checkRoleCanBeSaved() {
        // Button ist immer aktiv, Validierung erfolgt beim Klick via Toast
    }

    // KW-Überlappung prüfen
    function checkKwOverlap() {
        if (!kwOverlapWarning || !mainRole || !mainRole.value) {
            if (kwOverlapWarning) kwOverlapWarning.style.display = 'none';
            return;
        }

        const overlaps = roleHistory.filter(entry => {
            const entryFromDate = kwToDate(entry.fromKw, entry.fromYear);
            const entryToDate = entry.toKw ? kwToDate(entry.toKw, entry.toYear) : new Date(2099, 11, 31);
            const newFromDate = kwToDate(currentKwWeek, currentKwYear);
            const newToDate = roleKwToWeek ? kwToDate(roleKwToWeek, roleKwToYear) : new Date(2099, 11, 31);
            return newFromDate <= entryToDate && newToDate >= entryFromDate;
        });

        if (overlaps.length > 0) {
            kwOverlapWarning.style.display = 'block';
            if (kwOverlapDetails) {
                const overlapDetailsHtml = overlaps.map(entry => {
                    const config = ROLE_CONFIG[entry.role] || { name: entry.role, faktor: '-' };
                    const faktor = entry.customFactor ? entry.customFactor.toFixed(1) : config.faktor;
                    const roleName = entry.customFactor ? 'Individuell' : (config.short || config.name);
                    const toText = entry.toKw ? `KW ${entry.toKw}/${entry.toYear}` : '∞';
                    return `<div style="margin-top: 4px;">• <strong>${roleName}</strong> (Faktor ${faktor}) in KW ${entry.fromKw}/${entry.fromYear} - ${toText}</div>`;
                }).join('');
                kwOverlapDetails.innerHTML = `Diese KW überschneidet sich mit vorhandenen Einträgen:<br>${overlapDetailsHtml}<br><em style="margin-top: 8px; display: block;">Die neue Stufe überschreibt die überlappenden Zeiträume.</em>`;
            }
        } else {
            kwOverlapWarning.style.display = 'none';
        }
    }

    // Historie rendern
    function renderRoleHistory() {
        if (!careerHistoryTimeline) return;

        if (roleHistory.length === 0) {
            careerHistoryTimeline.innerHTML = '';
            if (noCareerHistoryMessage) noCareerHistoryMessage.style.display = 'block';
            return;
        }

        if (noCareerHistoryMessage) noCareerHistoryMessage.style.display = 'none';

        careerHistoryTimeline.innerHTML = roleHistory.map((entry, index) => {
            const config = ROLE_CONFIG[entry.role] || { name: entry.role, faktor: '-', short: entry.role.toUpperCase() };
            const toText = entry.toKw ? `KW ${entry.toKw}/${entry.toYear}` : '∞ (unbegrenzt)';
            const isFirst = index === 0;

            let displayName, displayFaktorValue;
            if (entry.customFactor) {
                displayName = entry.role !== 'individuell' ? `${config.name} (Ind.)` : 'Individuell';
                displayFaktorValue = entry.customFactor.toFixed(1);
            } else {
                displayName = `${config.name} (${config.short || entry.role.toUpperCase()})`;
                displayFaktorValue = config.faktor;
            }

            return `
                <div class="history-item ${isFirst ? 'erhoehung' : 'aenderung'}">
                    <div class="history-item-dot">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isFirst ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'}"/>
                        </svg>
                    </div>
                    <div class="history-item-content">
                        <div class="history-item-title">${displayName}</div>
                        <div class="history-item-meta">KW ${entry.fromKw}/${entry.fromYear} - ${toText} • Faktor ${displayFaktorValue}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Karrierestufe speichern
    async function saveRoleEntry() {
        const customFactorValue = customFactor ? parseFloat(customFactor.value) : null;

        if ((!mainRole || !mainRole.value) && !customFactorValue) {
            showToast('Bitte eine Karrierestufe oder individuellen Faktor eingeben', 'warning');
            return;
        }

        // Überlappungen prüfen und ggf. Bestätigung einholen
        const overlaps = roleHistory.filter(entry => {
            const entryFromDate = kwToDate(entry.fromKw, entry.fromYear);
            const entryToDate = entry.toKw ? kwToDate(entry.toKw, entry.toYear) : new Date(2099, 11, 31);
            const newFromDate = kwToDate(currentKwWeek, currentKwYear);
            const newToDate = roleKwToWeek ? kwToDate(roleKwToWeek, roleKwToYear) : new Date(2099, 11, 31);
            return newFromDate <= entryToDate && newToDate >= entryFromDate;
        });

        if (overlaps.length > 0) {
            const overlapDetailsHtml = overlaps.map(entry => {
                const config = ROLE_CONFIG[entry.role] || { name: entry.role, faktor: '-' };
                const faktor = entry.customFactor ? entry.customFactor.toFixed(1) : config.faktor;
                const roleName = entry.customFactor ? 'Individuell' : (config.short || config.name);
                const toText = entry.toKw ? `KW ${entry.toKw}/${entry.toYear}` : '∞';
                return `• ${roleName} (Faktor ${faktor}) in KW ${entry.fromKw}/${entry.fromYear} - ${toText}`;
            }).join('\n');

            const confirmed = await showConfirm(
                'KW-Überlappung erkannt',
                `Diese KW überschneidet sich mit vorhandenen Einträgen:\n\n${overlapDetailsHtml}\n\nDie neue Stufe überschreibt die überlappenden Zeiträume.`,
                'warning',
                { confirmText: 'Speichern', cancelText: 'Abbrechen' }
            );

            if (!confirmed) return;
        }

        if (saveRoleBtn) {
            saveRoleBtn.disabled = true;
            saveRoleBtn.innerHTML = `
                <svg class="icon-sm" style="animation: spin 1s linear infinite;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Speichern...
            `;
        }

        const newEntry = {
            id: Date.now(),
            role: mainRole ? mainRole.value || 'individuell' : 'individuell',
            customFactor: customFactorValue,
            fromKw: currentKwWeek,
            fromYear: currentKwYear,
            toKw: roleKwToWeek,
            toYear: roleKwToYear,
            savedAt: new Date().toISOString()
        };

        // Überlappende Einträge anpassen
        roleHistory = roleHistory.map(entry => {
            const entryFromDate = kwToDate(entry.fromKw, entry.fromYear);
            const entryToDate = entry.toKw ? kwToDate(entry.toKw, entry.toYear) : new Date(2099, 11, 31);
            const newFromDate = kwToDate(newEntry.fromKw, newEntry.fromYear);
            const newToDate = newEntry.toKw ? kwToDate(newEntry.toKw, newEntry.toYear) : new Date(2099, 11, 31);

            if (newFromDate <= entryFromDate && newToDate >= entryToDate) {
                return null;
            }

            if (newFromDate > entryFromDate && newFromDate <= entryToDate) {
                const newEndDate = new Date(newFromDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                const newEndKw = getWeekNumber(newEndDate);
                entry.toKw = newEndKw;
                entry.toYear = newEndDate.getFullYear();
            }

            return entry;
        }).filter(e => e !== null);

        roleHistory.push(newEntry);
        roleHistory.sort((a, b) => {
            const dateA = kwToDate(a.fromKw, a.fromYear);
            const dateB = kwToDate(b.fromKw, b.fromYear);
            return dateB - dateA;
        });

        localStorage.setItem('roleHistory', JSON.stringify(roleHistory));

        setTimeout(() => {
            if (saveRoleBtn) {
                saveRoleBtn.innerHTML = `
                    <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Gespeichert!
                `;
            }

            const toText = newEntry.toKw ? `KW ${newEntry.toKw}/${newEntry.toYear}` : '∞';
            let displayName;
            if (newEntry.customFactor) {
                displayName = `Individuell (${newEntry.customFactor.toFixed(1)}×)`;
            } else {
                const config = ROLE_CONFIG[mainRole.value];
                displayName = config ? (config.short || config.name) : mainRole.value;
            }
            showToast(`${displayName} für KW ${newEntry.fromKw}/${newEntry.fromYear} - ${toText} gespeichert`, 'success');

            renderRoleHistory();
            checkKwOverlap();

            setTimeout(() => {
                if (saveRoleBtn) {
                    saveRoleBtn.innerHTML = `
                        <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Karrierestufe speichern
                    `;
                }
                checkRoleCanBeSaved();
            }, 2000);
        }, 500);
    }

    // Toggle für individuellen Faktor
    function toggleIndividualFactor() {
        if (!individualFactorCheckbox) return;
        individualFactorEnabled = individualFactorCheckbox.checked;

        if (individualFactorInput) {
            individualFactorInput.style.visibility = individualFactorEnabled ? 'visible' : 'hidden';
            individualFactorInput.style.opacity = individualFactorEnabled ? '1' : '0';
        }

        if (individualFactorEnabled && customFactor) {
            customFactor.focus();
        } else if (customFactor) {
            customFactor.value = '';
        }

        updateFactorDisplay();
        checkRoleCanBeSaved();
    }

    // Event Listener
    if (kwPrev) {
        kwPrev.addEventListener('click', function() {
            currentKwWeek--;
            if (currentKwWeek < 1) {
                currentKwYear--;
                currentKwWeek = getWeeksInYear(currentKwYear);
            }
            updateKwDisplay();
            checkKwOverlap();
        });
    }

    if (kwNext) {
        kwNext.addEventListener('click', function() {
            const maxWeeks = getWeeksInYear(currentKwYear);
            currentKwWeek++;
            if (currentKwWeek > maxWeeks) {
                currentKwYear++;
                currentKwWeek = 1;
            }
            updateKwDisplay();
            checkKwOverlap();
        });
    }

    if (roleKwToPrev) {
        roleKwToPrev.addEventListener('click', function() {
            if (roleKwToUnlimited) {
                roleKwToUnlimited = false;
                roleKwToYear = new Date().getFullYear();
                roleKwToWeek = 52;
            } else {
                roleKwToWeek--;
                if (roleKwToWeek < 1) {
                    roleKwToYear--;
                    roleKwToWeek = getWeeksInYear(roleKwToYear);
                }
            }
            updateRoleKwToDisplay();
            checkKwOverlap();
        });
    }

    if (roleKwToNext) {
        roleKwToNext.addEventListener('click', function() {
            if (roleKwToUnlimited) return;
            const maxWeeks = getWeeksInYear(roleKwToYear);
            roleKwToWeek++;
            if (roleKwToWeek > maxWeeks) {
                roleKwToYear++;
                roleKwToWeek = 1;
            }
            updateRoleKwToDisplay();
            checkKwOverlap();
        });
    }

    if (mainRole) {
        mainRole.addEventListener('change', function() {
            updateFactorDisplay();
            updateRoleBenefits();
            updateCareerBadgeDisplay();
            checkRoleCanBeSaved();
            checkKwOverlap();
            if (typeof updateHeaderBadge === 'function') updateHeaderBadge(this.value);
            if (typeof updateFactorBadge === 'function') updateFactorBadge(this.value);
        });
    }

    if (customFactor) {
        customFactor.addEventListener('input', function() {
            updateFactorDisplay();
            checkRoleCanBeSaved();
        });
    }

    if (individualFactorCheckbox) {
        individualFactorCheckbox.addEventListener('change', toggleIndividualFactor);
    }

    if (saveRoleBtn) {
        saveRoleBtn.addEventListener('click', saveRoleEntry);
    }

    // Manuelle KW-Eingabe per Klick
    if (kwNumber) {
        kwNumber.addEventListener('click', async function() {
            if (typeof showPrompt !== 'function') return;
            const input = await showPrompt('Kalenderwoche', 'Kalenderwoche eingeben (1-52):', String(currentKwWeek));
            if (input !== null) {
                const week = parseInt(input);
                if (week >= 1 && week <= getWeeksInYear(currentKwYear)) {
                    currentKwWeek = week;
                    updateKwDisplay();
                    checkKwOverlap();
                }
            }
        });
    }

    if (kwYear) {
        kwYear.addEventListener('click', async function() {
            if (typeof showPrompt !== 'function') return;
            const input = await showPrompt('Jahr', 'Jahr eingeben:', String(currentKwYear));
            if (input !== null) {
                const year = parseInt(input);
                if (year >= 2020 && year <= 2100) {
                    currentKwYear = year;
                    updateKwDisplay();
                    checkKwOverlap();
                }
            }
        });
    }

    if (roleKwToNumber) {
        roleKwToNumber.addEventListener('click', async function() {
            if (typeof showPrompt !== 'function') return;
            const input = await showPrompt('Kalenderwoche Bis', 'Kalenderwoche eingeben (1-52, oder leer für ∞):', roleKwToUnlimited ? '' : String(roleKwToWeek));
            if (input === null) return;

            if (input.trim() === '' || input === '∞') {
                roleKwToUnlimited = true;
                roleKwToWeek = null;
                roleKwToYear = null;
            } else {
                const week = parseInt(input);
                if (week >= 1 && week <= 52) {
                    roleKwToUnlimited = false;
                    roleKwToWeek = week;
                    if (roleKwToYear === null) roleKwToYear = new Date().getFullYear();
                }
            }
            updateRoleKwToDisplay();
            checkKwOverlap();
        });
    }

    // Initialisierung
    updateKwDisplay();
    updateRoleKwToDisplay();
    updateCareerBadgeDisplay();
    updateFactorDisplay();
    checkRoleCanBeSaved();
    renderRoleHistory();

    // Public API zurückgeben
    return {
        updateKwDisplay,
        updateRoleKwToDisplay,
        updateFactorDisplay,
        updateRoleBenefits,
        checkRoleCanBeSaved,
        checkKwOverlap,
        renderRoleHistory,
        saveRoleEntry,
        toggleIndividualFactor
    };
}

window.initCareerLevelSelector = initCareerLevelSelector;

// ================================================================
// IBAN VALIDIERUNG & BANK-LOOKUP
// ================================================================

/**
 * Validiert IBAN, formatiert das Feld und holt Bankdaten
 * @param {string} iban - Die eingegebene IBAN
 * @param {HTMLElement} ibanField - Das IBAN Input-Feld
 * @param {HTMLElement} bankField - Input-Feld für Bankname
 * @param {HTMLElement} bicField - Input-Feld für BIC
 */
async function validateAndLookupIBAN(iban, ibanField, bankField, bicField) {
    const cleanIBAN = iban.toUpperCase().replace(/\s/g, '');

    // Format mit Leerzeichen alle 4 Zeichen
    if (cleanIBAN.length > 0) {
        const formatted = cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN;
        if (iban !== formatted) {
            ibanField.value = formatted;
            setTimeout(() => {
                ibanField.setSelectionRange(formatted.length, formatted.length);
            }, 0);
        }
    }

    // Leer = Reset
    if (cleanIBAN.length === 0) {
        ibanField.style.borderColor = '';
        ibanField.style.boxShadow = '';
        if (bankField) bankField.value = '';
        if (bicField) bicField.value = '';
        return;
    }

    // Erst ab 15 Zeichen validieren
    if (cleanIBAN.length < 15) {
        ibanField.style.borderColor = '';
        ibanField.style.boxShadow = '';
        return;
    }

    // IBAN Format prüfen
    if (!isValidIBANFormat(cleanIBAN)) {
        ibanField.style.borderColor = 'var(--error)';
        ibanField.style.boxShadow = '0 0 0 1.5px var(--error)';
        if (bankField) bankField.value = '';
        if (bicField) bicField.value = '';
        return;
    }

    ibanField.style.borderColor = 'var(--success)';
    ibanField.style.boxShadow = '0 0 0 1.5px var(--success)';

    // Bank-Lookup via API
    try {
        const response = await fetch(`https://lgztglycqtiwcmiydxnm.supabase.co/functions/v1/iban-validate?iban=${encodeURIComponent(cleanIBAN)}`, {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc2MTUsImV4cCI6MjA3OTM4MzYxNX0.a_ZeubRokmhdevV3JinTiD1Ji92C4bDHSiiDcYGZnt0',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc2MTUsImV4cCI6MjA3OTM4MzYxNX0.a_ZeubRokmhdevV3JinTiD1Ji92C4bDHSiiDcYGZnt0'
            }
        });
        const data = await response.json();
        if (data.valid && data.bankData) {
            if (bankField) bankField.value = data.bankData.name || '';
            if (bicField) bicField.value = data.bankData.bic || '';
        }
    } catch (error) {
        console.log('Bank-Lookup Error:', error);
    }
}

/**
 * Prüft ob IBAN-Format gültig ist (ISO 13616)
 */
function isValidIBANFormat(iban) {
    iban = iban.replace(/\s/g, '').toUpperCase();

    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
        return false;
    }

    const lengths = {
        'AD': 24, 'AE': 23, 'AL': 28, 'AT': 20, 'AZ': 28, 'BA': 20, 'BE': 16,
        'BG': 22, 'BH': 22, 'BR': 29, 'BY': 28, 'CH': 21, 'CR': 22, 'CY': 28,
        'CZ': 24, 'DE': 22, 'DK': 18, 'DO': 28, 'EE': 20, 'EG': 29, 'ES': 24,
        'FI': 18, 'FO': 18, 'FR': 27, 'GB': 22, 'GE': 22, 'GI': 23, 'GL': 18,
        'GR': 27, 'GT': 28, 'HR': 21, 'HU': 28, 'IE': 22, 'IL': 23, 'IS': 26,
        'IT': 27, 'JO': 30, 'KW': 30, 'KZ': 20, 'LB': 28, 'LC': 32, 'LI': 21,
        'LT': 20, 'LU': 20, 'LV': 21, 'MC': 27, 'MD': 24, 'ME': 22, 'MK': 19,
        'MR': 27, 'MT': 31, 'MU': 30, 'NL': 18, 'NO': 15, 'PK': 24, 'PL': 28,
        'PS': 29, 'PT': 25, 'QA': 29, 'RO': 24, 'RS': 22, 'SA': 24, 'SE': 24,
        'SI': 19, 'SK': 24, 'SM': 27, 'TN': 24, 'TR': 26, 'UA': 29, 'VA': 22,
        'VG': 24, 'XK': 20
    };

    const countryCode = iban.substring(0, 2);
    const expectedLength = lengths[countryCode];

    if (!expectedLength || iban.length !== expectedLength) {
        return false;
    }

    const rearranged = iban.substring(4) + iban.substring(0, 4);

    let numericString = '';
    for (let char of rearranged) {
        if (/[A-Z]/.test(char)) {
            numericString += (char.charCodeAt(0) - 55).toString();
        } else {
            numericString += char;
        }
    }

    let remainder = numericString;
    while (remainder.length > 2) {
        const block = remainder.substring(0, 9);
        remainder = (parseInt(block, 10) % 97).toString() + remainder.substring(block.length);
    }

    return parseInt(remainder, 10) % 97 === 1;
}

window.validateAndLookupIBAN = validateAndLookupIBAN;
window.isValidIBAN = isValidIBANFormat;

// ================================================================
// DAUER BERECHNUNG
// ================================================================

function calculateDuration(startDate, endDate) {
    const diff = endDate - startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) {
        const remainingMonths = months % 12;
        return remainingMonths > 0
            ? `${years} J, ${remainingMonths} M`
            : `${years} Jahr${years > 1 ? 'e' : ''}`;
    } else if (months > 0) {
        return `${months} Monat${months !== 1 ? 'e' : ''}`;
    } else if (days > 0) {
        return `${days} Tag${days !== 1 ? 'e' : ''}`;
    } else {
        return 'Heute';
    }
}

window.calculateDuration = calculateDuration;

// ================================================================
// PREISVORLAGEN LOCK
// ================================================================

function updatePreisvorlagenLock(mainRole) {
    const lockOverlay = document.getElementById('preisvorlagenLock');
    if (!lockOverlay) return;

    const roleLower = (mainRole || '').toLowerCase();
    const isUnlocked = PREISVORLAGEN_ALLOWED_ROLES.includes(roleLower);

    if (isUnlocked) {
        lockOverlay.classList.add('unlocked');
    } else {
        lockOverlay.classList.remove('unlocked');
    }
}

window.updatePreisvorlagenLock = updatePreisvorlagenLock;

// ================================================================
// VERTRAG FUNKTIONEN
// ================================================================

function showHvContract(fileName, uploadDate) {
    const emptyEl = document.getElementById('hvContractEmpty');
    const uploadedEl = document.getElementById('hvContractUploaded');
    const nameEl = document.getElementById('hvContractName');
    const dateEl = document.getElementById('hvContractDate');

    if (emptyEl) emptyEl.style.display = 'none';
    if (uploadedEl) uploadedEl.style.display = 'block';
    if (nameEl) nameEl.textContent = fileName;
    if (dateEl) dateEl.textContent = 'Hochgeladen am ' + uploadDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addOtherContractToList(contract) {
    const emptyEl = document.getElementById('otherContractsEmpty');
    if (emptyEl) emptyEl.style.display = 'none';

    const list = document.getElementById('otherContractsList');
    if (!list) return;

    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    const dateStr = contract.document_month && contract.document_year
        ? `${monthNames[contract.document_month - 1]} ${contract.document_year}`
        : new Date(contract.created_at).toLocaleDateString('de-DE');

    const item = document.createElement('div');
    item.className = 'contract-list-item';
    item.id = `contract-${contract.id}`;
    item.innerHTML = `
        <div class="contract-list-info">
            <div class="contract-list-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            </div>
            <div class="contract-list-details">
                <span class="contract-list-name">${contract.document_name}</span>
                <span class="contract-list-date">${dateStr}</span>
            </div>
        </div>
        <div class="contract-list-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="viewContract('${contract.id}', '${contract.document_url}')">
                Ansehen
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="requestContractDeletion('${contract.id}', '${contract.document_name}')">
                Löschen
            </button>
        </div>
    `;
    list.appendChild(item);
}

function viewContract(id, url) {
    if (url) {
        window.open(url, '_blank');
    }
}

window.showHvContract = showHvContract;
window.addOtherContractToList = addOtherContractToList;
window.viewContract = viewContract;

console.log('%c Profil-Funktionen geladen ', 'background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px;');

// ============================================================================
// STATISTIK TABELLE
// ============================================================================

/**
 * Initialisiert eine Statistik-Tabelle mit sticky linker Spalte und ausklappbaren Zeilen
 * @param {string} containerId - ID des Container-Elements
 * @param {Object} options - Optionale Konfiguration (columns, rows)
 */
function initStatsTable(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Standard-Spalten
    const defaultColumns = [
        { id: 'kategorie', label: 'Kategorie' },
        { id: 'anzahl', label: 'Anzahl' },
        { id: 'jahreseuros', label: 'Jahreseuros' },
        { id: 'einheiten', label: 'Einheiten' },
        { id: 'ruecklaufquote', label: 'Rücklaufquote' },
        { id: 'ruecklaufquoteMg', label: 'Rücklaufquote MG' },
        { id: 'ruecklaufquoteEur', label: 'Rücklaufquote EUR' },
        { id: 'beitrag', label: 'Ø-Beitrag' },
        { id: 'alter', label: 'Ø-Alter' },
        { id: 'mailOptin', label: '% Mail & Opt in' },
        { id: 'telOptin', label: '% Tel & Opt in' },
        { id: 'zahlungsrhythmus', label: 'Zahlungsrhythmus' },
        { id: 'provision', label: 'Provision' },
        { id: 'faktor', label: 'Ø-Faktor' }
    ];

    // Spalten filtern und Labels anpassen
    const hideColumns = options.hideColumns || [];
    const columnLabels = options.columnLabels || {};

    const columns = (options.columns || defaultColumns)
        .filter(col => !hideColumns.includes(col.id))
        .map(col => ({
            ...col,
            label: columnLabels[col.id] || col.label
        }));

    const rows = options.rows || [
        {
            kategorie: 'Netto Mitglieder',
            type: 'netto',
            anzahl: 38,
            jahreseuros: '4.560 €',
            einheiten: 9.5,
            ruecklaufquote: '5,0%',
            ruecklaufquoteMg: '4,2%',
            ruecklaufquoteEur: '7,1%',
            beitrag: '10,00 €',
            alter: 52,
            mailOptin: '85% / 72%',
            telOptin: '78% / 65%',
            zahlungsrhythmus: { m: 45, qt: 25, hj: 15, j: 15 },
            provision: '1.824 €',
            faktor: 6.2,
            children: [
                { kategorie: 'Neumitglieder', anzahl: 28, jahreseuros: '3.360 €', einheiten: 7.0, ruecklaufquote: '4,2%', ruecklaufquoteMg: '4,2%', ruecklaufquoteEur: '—', beitrag: '10,00 €', alter: 48, mailOptin: '88% / 75%', telOptin: '80% / 68%', zahlungsrhythmus: { m: 40, qt: 30, hj: 15, j: 15 }, provision: '1.344 €', faktor: 6.5 },
                { kategorie: 'Erhöhungen', anzahl: 10, jahreseuros: '1.200 €', einheiten: 2.5, ruecklaufquote: '7,1%', ruecklaufquoteMg: '—', ruecklaufquoteEur: '7,1%', beitrag: '10,00 €', alter: 62, mailOptin: '78% / 65%', telOptin: '72% / 58%', zahlungsrhythmus: { m: 55, qt: 15, hj: 15, j: 15 }, provision: '480 €', faktor: 5.5 }
            ]
        },
        {
            kategorie: 'Stornos',
            type: 'storno',
            anzahl: 4,
            jahreseuros: '480 €',
            einheiten: 1.0,
            ruecklaufquote: '—',
            ruecklaufquoteMg: '—',
            ruecklaufquoteEur: '—',
            beitrag: '10,00 €',
            alter: 45,
            mailOptin: '—',
            telOptin: '—',
            zahlungsrhythmus: '—',
            provision: '-192 €',
            faktor: '—',
            children: [
                { kategorie: 'Stornos Neumitglieder', anzahl: 3, jahreseuros: '360 €', einheiten: 0.75, ruecklaufquote: '—', ruecklaufquoteMg: '—', ruecklaufquoteEur: '—', beitrag: '10,00 €', alter: 42, mailOptin: '—', telOptin: '—', zahlungsrhythmus: '—', provision: '-144 €', faktor: '—' },
                { kategorie: 'Stornos Erhöhungen', anzahl: 1, jahreseuros: '120 €', einheiten: 0.25, ruecklaufquote: '—', ruecklaufquoteMg: '—', ruecklaufquoteEur: '—', beitrag: '10,00 €', alter: 55, mailOptin: '—', telOptin: '—', zahlungsrhythmus: '—', provision: '-48 €', faktor: '—' }
            ]
        },
        {
            kategorie: 'Brutto Mitglieder',
            type: 'brutto',
            anzahl: 42,
            jahreseuros: '5.040 €',
            einheiten: 10.5,
            ruecklaufquote: '9,5%',
            ruecklaufquoteMg: '9,7%',
            ruecklaufquoteEur: '9,1%',
            beitrag: '10,00 €',
            alter: 51,
            mailOptin: '84% / 71%',
            telOptin: '77% / 64%',
            zahlungsrhythmus: { m: 47, qt: 24, hj: 15, j: 14 },
            provision: '2.016 €',
            faktor: 6.0,
            children: [
                { kategorie: 'Neumitglieder', anzahl: 31, jahreseuros: '3.720 €', einheiten: 7.75, ruecklaufquote: '9,7%', ruecklaufquoteMg: '9,7%', ruecklaufquoteEur: '—', beitrag: '10,00 €', alter: 47, mailOptin: '87% / 74%', telOptin: '79% / 67%', zahlungsrhythmus: { m: 43, qt: 28, hj: 15, j: 14 }, provision: '1.488 €', faktor: 6.3 },
                { kategorie: 'Erhöhungen', anzahl: 11, jahreseuros: '1.320 €', einheiten: 2.75, ruecklaufquote: '9,1%', ruecklaufquoteMg: '—', ruecklaufquoteEur: '9,1%', beitrag: '10,00 €', alter: 61, mailOptin: '76% / 63%', telOptin: '71% / 57%', zahlungsrhythmus: { m: 57, qt: 14, hj: 15, j: 14 }, provision: '528 €', faktor: 5.3 }
            ]
        }
    ];

    // Helper: Zahlungsrhythmus-Balken rendern
    function renderZahlungsrhythmusBar(data) {
        if (!data || typeof data !== 'object') return data || '—';
        const labels = { m: 'Monatlich', qt: 'Quartal', hj: 'Halbjährlich', j: 'Jährlich' };
        let html = '<div class="stacked-bar">';
        ['m', 'qt', 'hj', 'j'].forEach(key => {
            const pct = data[key] || 0;
            if (pct > 0) {
                html += `<div class="stacked-bar__segment stacked-bar__segment--${key}" style="width: ${pct}%" data-label="${labels[key]}" data-pct="${pct}"></div>`;
            }
        });
        html += '</div>';
        return html;
    }

    // Helper: Zellenwert rendern
    function renderCellValue(colId, value) {
        if (colId === 'zahlungsrhythmus') {
            return renderZahlungsrhythmusBar(value);
        }
        return value !== undefined ? value : '';
    }

    // Header erstellen
    let headerHtml = '<tr>';
    columns.forEach(col => {
        headerHtml += `<th>${col.label}</th>`;
    });
    headerHtml += '</tr>';

    // Body erstellen
    let bodyHtml = '';
    rows.forEach((row, index) => {
        const hasChildren = row.children && row.children.length > 0;
        const typeClass = row.type ? ` stats-row--${row.type}` : '';
        const parentClass = hasChildren ? `expandable-row${typeClass}` : typeClass.trim();
        const classAttr = parentClass ? ` class="${parentClass}"` : '';
        const dataAttr = hasChildren ? ` data-parent-id="${index}"` : '';

        bodyHtml += `<tr${classAttr}${dataAttr}>`;
        columns.forEach((col, colIndex) => {
            const value = renderCellValue(col.id, row[col.id]);
            if (colIndex === 0 && hasChildren) {
                bodyHtml += `<td><span class="icon icon--pfeil-unten expand-icon"></span>${value}</td>`;
            } else {
                bodyHtml += `<td>${value}</td>`;
            }
        });
        bodyHtml += '</tr>';

        // Child-Rows
        if (hasChildren) {
            row.children.forEach(child => {
                bodyHtml += `<tr class="child-row child-row--${row.type}" data-parent-id="${index}">`;
                columns.forEach((col, colIndex) => {
                    const value = renderCellValue(col.id, child[col.id]);
                    if (colIndex === 0) {
                        bodyHtml += `<td><span class="child-indent">└</span>${value}</td>`;
                    } else {
                        bodyHtml += `<td>${value}</td>`;
                    }
                });
                bodyHtml += '</tr>';
            });
        }
    });

    // Tabelle zusammenbauen
    container.innerHTML = `
        <div class="stats-table-wrap">
            <div class="stats-table-scroll">
                <table class="stats-table">
                    <thead>${headerHtml}</thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            </div>
        </div>
    `;

    // Click-Handler für Parent-Rows
    container.querySelectorAll('.expandable-row').forEach(row => {
        row.addEventListener('click', function() {
            const parentId = this.dataset.parentId;
            const isOpen = this.classList.toggle('open');
            container.querySelectorAll(`.child-row[data-parent-id="${parentId}"]`).forEach(child => {
                child.classList.toggle('visible', isOpen);
            });
        });
    });

    // Tooltip für Stacked-Bar Segmente
    let tooltip = document.querySelector('.stacked-bar-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'stacked-bar-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
    }

    container.querySelectorAll('.stacked-bar__segment').forEach(segment => {
        segment.addEventListener('mouseenter', function(e) {
            const label = this.dataset.label;
            const pct = this.dataset.pct;
            tooltip.textContent = `${label}: ${pct}%`;
            tooltip.style.display = 'block';
        });

        segment.addEventListener('mousemove', function(e) {
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = e.clientY + 'px';
        });

        segment.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });
    });
}

window.initStatsTable = initStatsTable;

// ============================================================================
// STATISTIK CHARTS
// ============================================================================

/**
 * Initialisiert einen Wochenverlauf-Chart
 * @param {string} canvasId - ID des Canvas-Elements
 * @param {Object} data - Daten mit labels, nmgJE, erhJE, nmgAnzahl, erhAnzahl, gesamtAnzahl
 */
function initWochenverlaufChart(canvasId, data = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    // CSS-Variablen auslesen
    const styles = getComputedStyle(document.documentElement);
    const textKlein = parseInt(styles.getPropertyValue('--text-klein')) || 12;
    const textSecondary = styles.getPropertyValue('--text-secondary').trim();
    const textPrimary = styles.getPropertyValue('--text-primary').trim();
    const borderColor = styles.getPropertyValue('--border-color').trim();
    const bgPrimary = styles.getPropertyValue('--bg-primary').trim();

    // Chart.js Defaults
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.color = textSecondary;

    // Default-Daten falls keine übergeben
    const chartData = data || {
        labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        nmgJE: [960, 1440, 1080, 1800, 1200, 600, 360],
        erhJE: [480, 360, 600, 720, 480, 240, 120],
        nmgAnzahl: [4, 6, 5, 8, 5, 3, 2],
        erhAnzahl: [2, 3, 2, 3, 3, 1, 0],
        gesamtAnzahl: [6, 9, 7, 11, 8, 4, 2]
    };

    return new Chart(canvas, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Neumitglieder',
                    data: chartData.nmgJE,
                    backgroundColor: 'rgba(16, 185, 129, 0.85)',
                    borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
                    stack: 'je',
                    order: 2
                },
                {
                    label: 'Erhöhungen',
                    data: chartData.erhJE,
                    backgroundColor: 'rgba(245, 158, 11, 0.85)',
                    borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
                    stack: 'je',
                    order: 2
                },
                {
                    label: 'Anzahl MG',
                    data: chartData.gesamtAnzahl,
                    type: 'line',
                    borderColor: '#6366f1',
                    backgroundColor: '#6366f1',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: bgPrimary,
                    pointBorderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: textKlein }
                    }
                },
                tooltip: {
                    backgroundColor: bgPrimary,
                    titleColor: textPrimary,
                    bodyColor: textSecondary,
                    borderColor: borderColor,
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const datasetIndex = context.datasetIndex;
                            const value = context.parsed.y;

                            if (datasetIndex === 0) {
                                const anzahl = chartData.nmgAnzahl[index];
                                return 'Neumitglieder (' + anzahl + '): ' + value.toLocaleString('de-DE') + ' JE';
                            } else if (datasetIndex === 1) {
                                const anzahl = chartData.erhAnzahl[index];
                                return 'Erhöhungen (' + anzahl + '): ' + value.toLocaleString('de-DE') + ' JE';
                            } else {
                                return 'Anzahl MG: ' + value;
                            }
                        },
                        afterBody: function(context) {
                            const index = context[0].dataIndex;
                            const totalJE = chartData.nmgJE[index] + chartData.erhJE[index];
                            const totalEH = Math.round(totalJE / 12);
                            return '\nGesamt: ' + totalJE.toLocaleString('de-DE') + ' JE / ' + totalEH + ' EH';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: textKlein } }
                },
                y: {
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        font: { size: textKlein },
                        callback: function(value) {
                            return value.toLocaleString('de-DE') + ' JE';
                        }
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: {
                        font: { size: textKlein },
                        stepSize: 5,
                        callback: function(value) {
                            return value + ' MG';
                        }
                    }
                }
            }
        }
    });
}

window.initWochenverlaufChart = initWochenverlaufChart;

console.log('%c Statistik-Tabellen geladen ', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');

// ===================================================
// ACHIEVEMENT GRID
// ===================================================

/**
 * Rendert ein Achievement-Grid
 * @param {string} containerId - ID des Container-Elements
 * @param {Array} types - Array mit Achievement-Typen [{id, name}, ...]
 * @param {Object} data - Achievement-Daten {id: {score, datum, kampagne, active}, ...}
 */
function renderAchievementGrid(containerId, types, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = types.map(type => {
        const achievement = data[type.id];
        const isEmpty = !achievement;
        const isActive = achievement?.active;

        let meta = 'Keine Daten';
        if (achievement) {
            const datum = achievement.datumVon
                ? `${achievement.datumVon} - ${achievement.datumBis}`
                : achievement.datum;
            meta = `${datum}<br>${achievement.kampagne}`;
        }

        return `
            <div class="achievement-card${isEmpty ? ' achievement-card--empty' : ''}${isActive ? ' achievement-card--active' : ''}">
                <div class="achievement-name">${type.name}</div>
                <div class="achievement-meta">${meta}</div>
                <div class="achievement-score">${achievement?.score || '–'}</div>
            </div>
        `;
    }).join('');
}

window.renderAchievementGrid = renderAchievementGrid;

// ===================================================
// REFERRAL TREE (Recruiting/Empfehlung)
// ===================================================

/**
 * Rendert einen Referral-Tree (Stammbaum für Recruiting/Empfehlungen)
 * @param {string} containerId - ID des Container-Elements
 * @param {Object} data - Baum-Daten mit root und children
 *
 * Datenstruktur:
 * {
 *   name: 'Max Mustermann',
 *   initials: 'MM',
 *   date: '01.01.2024',
 *   mg: 42,
 *   eh: 8,
 *   children: [
 *     { name: '...', initials: '...', date: '...', mg: ..., eh: ..., children: [...] }
 *   ]
 * }
 */
function renderReferralTree(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;

    container.innerHTML = '';
    container.className = 'referral-tree';

    // Rekursive Funktion für Node + Kinder
    function createNode(person, isRoot = false, depth = 0) {
        const node = document.createElement('div');
        node.className = 'referral-tree__node';

        // Card erstellen
        const card = document.createElement('div');
        card.className = 'referral-tree__card' + (isRoot ? ' referral-tree__card--root' : '');

        // Nur erste Stufe (direkte Empfehlungen) hoverable
        if (depth === 1) {
            card.classList.add('referral-tree__card--hoverable');

            // Tooltip hinzufügen
            const tooltip = document.createElement('div');
            tooltip.className = 'referral-tree__tooltip';
            tooltip.innerHTML = `
                <div class="referral-tree__tooltip-stats">
                    <div class="referral-tree__tooltip-stat">
                        <div class="referral-tree__tooltip-stat-value">${person.mg || 0}</div>
                        <div class="referral-tree__tooltip-stat-label">MG</div>
                    </div>
                    <div class="referral-tree__tooltip-stat">
                        <div class="referral-tree__tooltip-stat-value">${person.eh || 0}</div>
                        <div class="referral-tree__tooltip-stat-label">EH</div>
                    </div>
                </div>
            `;
            card.appendChild(tooltip);
        }

        // Name
        const name = document.createElement('div');
        name.className = 'referral-tree__name';
        name.textContent = person.name;
        card.appendChild(name);

        // Datum
        if (person.date) {
            const date = document.createElement('div');
            date.className = 'referral-tree__date';
            date.textContent = person.date;
            card.appendChild(date);
        }

        node.appendChild(card);

        // Kinder hinzufügen (max 3 Stufen)
        if (person.children && person.children.length > 0 && depth < 2) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'referral-tree__children';

            person.children.forEach(child => {
                const childNode = createNode(child, false, depth + 1);
                childrenContainer.appendChild(childNode);
            });

            node.appendChild(childrenContainer);
        }

        return node;
    }

    // Root Node erstellen und einfügen
    const rootNode = createNode(data, true, 0);
    container.appendChild(rootNode);
}

window.renderReferralTree = renderReferralTree;
