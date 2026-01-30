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
 * @param {string} [fallbackUrl='dashboard'] - Seite falls keine Return-Page vorhanden
 */
function goBack(fallbackUrl = 'dashboard') {
    // returnTo aus URL-Parameter lesen (falls von Shell gesetzt)
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('returnTo') || fallbackUrl;

    // Wenn in iframe, Nachricht an Shell senden
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'navigateBack', returnTo: returnTo }, '*');
    } else if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = returnTo;
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
                                    <option value="partner_dagegen">Partner dagegen</option>
                                    <option value="finanzielle_situation">Finanzielle Situation</option>
                                    <option value="verstorben">Verstorben</option>
                                    <option value="einmalig_spenden">Wollte einmalig spenden</option>
                                    <option value="ueberrumpelt">Hat sich überrumpelt gefühlt</option>
                                    <option value="nicht_entscheidungsfaehig">Ist nicht entscheidungsfähig</option>
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
                        <button class="btn btn-secondary" onclick="selectAllColumns && selectAllColumns()">Alle auswählen</button>
                        <button class="btn btn-secondary" onclick="deselectAllColumns && deselectAllColumns()">Alle abwählen</button>
                        <div class="anzeigenfeld--spacer"></div>
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
                                    <div class="eingabefeld-gruppe eingabefeld-gruppe--flex-3 autocomplete-container">
                                        <label class="eingabefeld-beschriftung-oben">Straße</label>
                                        <input type="text" class="eingabefeld" id="editStrasse">
                                        <div class="autocomplete-results" id="editStrasseAutocomplete"></div>
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
                                            <option value="monthly">Monatlich</option>
                                            <option value="quarterly">Vierteljährlich</option>
                                            <option value="halfyearly">Halbjährlich</option>
                                            <option value="yearly">Jährlich</option>
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
         * IMPORT MODAL (Größe XL - Multi-Step)
         */
        import: () => `
            <div class="modal modal-xl" id="importModal">
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
                                        <span class="import-step-label">Zuordnung</span>
                                    </div>
                                    <div class="import-step-line"></div>
                                    <div class="import-step" data-step="2">
                                        <span class="import-step-number">2</span>
                                        <span class="import-step-label">Datei</span>
                                    </div>
                                    <div class="import-step-line"></div>
                                    <div class="import-step" data-step="3">
                                        <span class="import-step-number">3</span>
                                        <span class="import-step-label">Spalten</span>
                                    </div>
                                    <div class="import-step-line"></div>
                                    <div class="import-step" data-step="4">
                                        <span class="import-step-number">4</span>
                                        <span class="import-step-label">Import</span>
                                    </div>
                                </div>
                            </div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeImportModal()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 1: Zuordnung -->
                    <div class="page-content page-content--modal import-step-content" id="importStep1">
                        <div class="abschnitt" style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                            <div class="zeile" style="gap: 10px; align-items: center;">
                                <span style="font-size: 1.5rem;">&#9888;</span>
                                <span style="font-weight: 700; color: #856404; font-size: 1rem;">Hinweis: Beim Import werden KEINE Willkommensmails versendet. Der E-Mail-Status wird automatisch auf „gesendet" gesetzt, damit kein nachträglicher Versand ausgelöst wird. Der Mailversand erfolgt ausschließlich über das Aufnahmeformular.</span>
                            </div>
                        </div>
                        <div class="abschnitt">
                            <div class="zeile">
                                <span class="text-ueberschrift-unterabschnitt">Kunde & Kampagne zuordnen</span>
                            </div>
                            <div class="zeile">
                                <div class="anzeigenfeld anzeigenfeld--col">
                                    <span class="text-klein">Kunde</span>
                                    <select class="eingabefeld" id="importCustomerSelect" onchange="ImportSystem.onCustomerChange()">
                                        <option value="">Bitte wählen...</option>
                                    </select>
                                </div>
                                <div class="anzeigenfeld anzeigenfeld--col">
                                    <span class="text-klein">Kampagne</span>
                                    <select class="eingabefeld" id="importCampaignSelect" onchange="ImportSystem.onCampaignChange()" disabled>
                                        <option value="">Erst Kunde wählen...</option>
                                    </select>
                                </div>
                                <div class="anzeigenfeld anzeigenfeld--col">
                                    <span class="text-klein">Werbegebiet</span>
                                    <select class="eingabefeld" id="importAreaSelect" disabled>
                                        <option value="">Erst Kampagne wählen...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="abschnitt">
                            <div class="zeile">
                                <span class="text-ueberschrift-unterabschnitt">Werber IDs</span>
                            </div>
                            <div class="zeile">
                                <span class="text-klein">Diese IDs in die Import-Datei eintragen (Spalte: werber_id). Teamchef wird pro KW im Kampagnen-Modal zugeordnet.</span>
                            </div>
                            <div class="zeile">
                                <div class="anzeigenfeld anzeigenfeld--col" style="flex: 1;">
                                    <div class="import-ids-list" id="importWerberList">
                                        <!-- Wird per JS gefüllt -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Datei hochladen -->
                    <div class="page-content page-content--modal import-step-content" id="importStep2" style="display: none;">
                        <div class="abschnitt">
                            <div class="import-drop-zone" id="importDropZone">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                </svg>
                                <span class="import-drop-text">Datei hierher ziehen</span>
                                <span class="import-drop-hint">oder klicken zum Auswählen</span>
                                <input type="file" id="importFileInput" accept=".xls,.xlsx,.csv" onchange="handleImportFileSelect(event)">
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
                                <button class="btn btn-icon btn-sm" onclick="removeImportFile()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                            <div class="zeile zeile--center">
                                <span class="text-klein">Unterstützte Formate: XLS, XLSX, CSV</span>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Spalten zuordnen -->
                    <div class="page-content page-content--modal import-step-content" id="importStep3" style="display: none;">
                        <div class="zeile" style="margin-bottom: 12px;">
                            <button class="btn btn-sm" onclick="ImportSystem.clearAllMappings()">Alle aufheben</button>
                            <button class="btn btn-sm" onclick="ImportSystem.autoMapAll()">Auto-Zuordnung</button>
                        </div>
                        <div class="import-mapping-wrap" id="importMappingContainer">
                            <table class="table-simple">
                                <thead>
                                    <tr>
                                        <th>Spalte (Datei)</th>
                                        <th>Beispiel</th>
                                        <th>Zuordnung</th>
                                        <th>Vorschau</th>
                                    </tr>
                                </thead>
                                <tbody id="importMappingTableBody"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Step 4: Vorschau & Import -->
                    <div class="page-content page-content--modal import-step-content" id="importStep4" style="display: none;">
                        <div class="zeile">
                            <span class="text-klein" id="importPreviewCount">0 Datensätze werden importiert</span>
                        </div>
                        <div class="table-container">
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
                        <button class="btn btn-secondary" onclick="closeImportModal()">Abbrechen</button>
                        <button class="btn btn-secondary" id="importBackBtn" onclick="importStepBack()" style="display: none;">Zurück</button>
                        <button class="btn btn-primary" id="importNextBtn" onclick="importStepNext()">Weiter</button>
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
        `,

        /**
         * TEMPLATE EDIT MODAL (Größe XS)
         */
        templateEdit: () => `
            <div class="modal modal-sm" id="templateEditModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift">Vorlage bearbeiten</span>
                            </div>
                            <div class="page-header-mitte"></div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="closeTemplateEditModal()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Modal Body -->
                    <div class="page-content page-content--modal">
                        <div class="zeile">
                            <div class="eingabefeld-gruppe">
                                <label class="eingabefeld-beschriftung-oben">Vorlagenname</label>
                                <input type="text" class="eingabefeld" id="templateEditName" placeholder="Name der Vorlage...">
                                <span class="eingabefeld-beschriftung-unten"></span>
                            </div>
                        </div>
                        <div class="zeile">
                            <span class="text-klein">Die aktuelle Spalten-Konfiguration wird in dieser Vorlage gespeichert.</span>
                        </div>
                    </div>
                    <!-- Modal Footer -->
                    <div class="page-footer">
                        <button class="btn btn-secondary" onclick="closeTemplateEditModal()">Abbrechen</button>
                        <button class="btn btn-primary" onclick="saveTemplateEdit()">Speichern</button>
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
    const modal = document.getElementById('stornoModal');

    // IDs aus stornoContext (Tabellen-Version) oder modal.dataset (Einzel-Version)
    let recordIds = [];
    if (typeof stornoContext !== 'undefined' && stornoContext.ids && stornoContext.ids.length > 0) {
        recordIds = stornoContext.ids;
    } else if (modal?.dataset.currentId) {
        recordIds = [modal.dataset.currentId];
    }

    if (recordIds.length === 0) {
        showToast('Kein Datensatz ausgewählt', 'error');
        return;
    }

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

    // Supabase Client holen (aus Parent-Frame oder global)
    const supabase = window.parent?.supabaseClient || window.supabaseClient;

    if (!supabase) {
        showToast('Datenbankverbindung fehlt', 'error');
        return;
    }

    try {
        // Records in Supabase aktualisieren (unterstützt mehrere IDs)
        const { error } = await supabase
            .from('records')
            .update({
                record_status: 'storno',
                storno_date: datum,
                storno_reason: grund,
                beschwerde: beschwerde || false,
                beschwerde_grund: beschwerde ? beschwerdeGrund : null,
                str_per_mail_bestaetigt: mailBestaetigung || false
            })
            .in('id', recordIds);

        if (error) {
            console.error('Storno-Fehler:', error);
            showToast('Fehler beim Stornieren', 'error');
            return;
        }

        // Gegenbuchungen werden automatisch durch DB-Trigger erstellt (022-ledger-triggers.sql)

        // Lokale Daten aktualisieren (falls recordsData verfügbar)
        if (typeof recordsData !== 'undefined') {
            recordIds.forEach(id => {
                const record = recordsData.find(r => r.id === id);
                if (record) {
                    record.recordStatus = 'storno';
                    record.stornoDate = datum;
                    record.stornoReason = grund;
                }
            });
        }

        // stornoContext zurücksetzen
        if (typeof stornoContext !== 'undefined') {
            stornoContext = { type: null, ids: [], names: [] };
        }

        closeStornoModal();
        const msg = recordIds.length === 1 ? 'Datensatz storniert' : `${recordIds.length} Datensätze storniert`;
        showToast(msg, 'success');

        // Tabelle neu rendern (falls Funktion verfügbar)
        if (typeof renderRecordsTable === 'function') {
            renderRecordsTable();
        }

    } catch (error) {
        console.error('Storno-Fehler:', error);
        showToast('Fehler beim Stornieren', 'error');
    }
}

// ========================================
// UNSTORNO (STORNO RÜCKGÄNGIG)
// ========================================

let unstornoContext = { type: null, id: null, name: '' };

/**
 * Öffnet Bestätigungs-Dialog für Storno rückgängig
 */
function openUnstornoConfirm(type, id, name) {
    unstornoContext = { type, id, name };

    // Confirm-Modal öffnen
    ConfirmModalSystem.open('confirmModal', {
        title: 'Storno rückgängig machen',
        message: `Möchten Sie den Storno für "${name}" wirklich rückgängig machen?`,
        buttonText: 'Rückgängig machen',
        onConfirm: confirmUnstorno
    });
}

/**
 * Führt Storno rückgängig aus
 */
async function confirmUnstorno() {
    const { type, id, name } = unstornoContext;

    if (!id) {
        showToast('Kein Datensatz ausgewählt', 'error');
        return;
    }

    // Supabase Client holen
    const supabase = window.parent?.supabaseClient || window.supabaseClient;

    if (!supabase) {
        showToast('Datenbankverbindung fehlt', 'error');
        return;
    }

    try {
        // Record in Supabase aktualisieren
        const { error } = await supabase
            .from('records')
            .update({
                record_status: 'aktiv',
                storno_date: null,
                storno_reason: null
            })
            .eq('id', id);

        if (error) {
            console.error('Unstorno-Fehler:', error);
            showToast('Fehler beim Rückgängigmachen', 'error');
            return;
        }

        // Lokale Daten aktualisieren
        const data = type === 'records' ? recordsData : bestandData;
        if (data) {
            const record = data.find(r => String(r.id) === String(id));
            if (record) {
                record.status = 'aktiv';
                record.stornoDate = '';
                record.stornoReason = '';
            }
        }

        // Context zurücksetzen
        unstornoContext = { type: null, id: null, name: '' };

        showToast('Storno rückgängig gemacht', 'success');

        // Tabelle neu rendern
        if (typeof renderRecordsTable === 'function') {
            renderRecordsTable();
        }
        if (typeof renderBestandTable === 'function') {
            renderBestandTable();
        }

    } catch (error) {
        console.error('Unstorno-Fehler:', error);
        showToast('Fehler beim Rückgängigmachen', 'error');
    }
}

// Global verfügbar machen
window.openUnstornoConfirm = openUnstornoConfirm;
window.confirmUnstorno = confirmUnstorno;

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
        // Einzeltag: Wenn nur Start gesetzt, als Ende übernehmen
        if (calendarStartDate && !calendarEndDate) {
            calendarEndDate = new Date(calendarStartDate);
        }
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
        const year = date.getFullYear();
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
// IMPORT SYSTEM
// =====================================================

const ImportSystem = {
    currentStep: 1,
    maxSteps: 4,
    fileData: null,
    parsedData: [],
    columnMapping: {},
    customers: [],
    areas: [],
    users: [],

    // Spalten-Definitionen für das Mapping (neue einheitliche IDs)
    fieldDefinitions: {
        // Kombinierte Felder (werden automatisch getrennt)
        fullName: { label: 'Name (Vor- + Nachname)', aliases: ['vollständiger name', 'full_name', 'fullname'], splitField: 'name' },
        fullStreet: { label: 'Straße + Hausnr.', aliases: ['adresse', 'anschrift', 'straße hausnummer', 'strasse hausnummer'], splitField: 'street' },
        fullLocation: { label: 'PLZ + Ort', aliases: ['plz ort', 'postleitzahl ort', 'plz/ort', 'plz stadt'], splitField: 'location' },
        // Persönliche Daten
        firstName: { label: 'Vorname', aliases: ['vorname', 'first_name', 'firstname', 'vname'] },
        lastName: { label: 'Nachname', aliases: ['nachname', 'last_name', 'lastname', 'nname', 'name'] },
        salutation: { label: 'Anrede', aliases: ['anrede', 'salut'] },
        title: { label: 'Titel', aliases: ['titel'] },
        company: { label: 'Firma', aliases: ['firma', 'firmenname', 'unternehmen', 'company'] },
        birthDate: { label: 'Geburtsdatum', aliases: ['geburtsdatum', 'birth_date', 'birthdate', 'geb', 'geb_datum'] },
        // Adresse
        street: { label: 'Straße', aliases: ['strasse', 'straße', 'str'] },
        houseNumber: { label: 'Hausnummer', aliases: ['hausnummer', 'hausnr', 'hnr', 'house_number'] },
        zipCode: { label: 'PLZ', aliases: ['plz', 'postleitzahl', 'zip', 'zip_code'] },
        city: { label: 'Ort', aliases: ['ort', 'stadt', 'city', 'wohnort'] },
        country: { label: 'Land', aliases: ['land', 'country'] },
        // Kontakt
        email: { label: 'E-Mail', aliases: ['email', 'e-mail', 'mail'] },
        phoneFixed: { label: 'Tel. Festnetz', aliases: ['telefon', 'festnetz', 'phone', 'tel'] },
        phoneMobile: { label: 'Tel. Mobil', aliases: ['mobil', 'handy', 'mobile', 'mobiltelefon'] },
        // Zahlungsdaten
        iban: { label: 'IBAN', aliases: ['iban'] },
        bic: { label: 'BIC', aliases: ['bic', 'swift'] },
        bankName: { label: 'Bank', aliases: ['bank', 'bankname', 'kreditinstitut'] },
        accountHolder: { label: 'Kontoinhaber', aliases: ['kontoinhaber', 'account_holder'] },
        // Beitrag (neue IDs)
        intervalAmount: { label: 'Betrag pro Intervall', aliases: ['betrag', 'beitrag', 'amount', 'interval_amount'] },
        yearlyAmount: { label: 'Jahresbeitrag', aliases: ['jahresbeitrag', 'je', 'yearly_amount', 'jahresbetrag', 'neuer_beitrag', 'neuer_jahresbeitrag'] },
        interval: { label: 'Buchungsintervall', aliases: ['buchungsintervall', 'intervall', 'interval', 'zahlweise', 'rhythmus'] },
        donationReceipt: { label: 'Spendenquittung', aliases: ['spendenquittung', 'quittung', 'donation_receipt'] },
        // Erhöhung (ERH)
        memberNumber: { label: 'Mitgliedsnummer', aliases: ['mitgliedsnummer', 'mitglnr', 'member_number', 'mitgl_nr', 'mitgliednr'] },
        memberSince: { label: 'Mitglied seit', aliases: ['mitglied_seit', 'member_since', 'eintrittsdatum'] },
        oldYearlyAmount: { label: 'Alter Jahresbeitrag', aliases: ['alter_beitrag', 'alter_jahresbeitrag', 'old_amount', 'old_yearly_amount', 'bisheriger_beitrag', 'vorheriger_beitrag'] },
        increaseAmount: { label: 'Erhöhungsbetrag', aliases: ['erhoehung', 'erhöhung', 'erhoehungsbetrag', 'erhöhungsbetrag', 'increase_amount', 'differenz'] },
        // Typ & Status
        recordType: { label: 'Typ (NMG/ERH)', aliases: ['typ', 'type', 'art', 'record_type'] },
        recordStatus: { label: 'Status', aliases: ['status', 'record_status', 'datensatz_status'] },
        stornoDate: { label: 'Storniert am', aliases: ['storniert_am', 'storno_datum', 'storno_date', 'stornodatum', 'gekündigt_am', 'kuendigung'] },
        // IDs für Zuordnung
        werberId: { label: 'Werber ID', aliases: ['werber_id', 'werberid'] },
        // Sonstiges (neue IDs)
        notes: { label: 'Anmerkungen', aliases: ['anmerkungen', 'notizen', 'bemerkung', 'notes', 'kommentar'] },
        entryDate: { label: 'Aufnahmedatum', aliases: ['aufnahmedatum', 'entry_date', 'entrydate', 'aufnahme', 'beitrittsdatum', 'beitritt'] },
        laterEntryDate: { label: 'Späteres Beitrittsdatum', aliases: ['startdatum', 'start_date', 'later_start', 'later_entry_date', 'spaeteres_beitrittsdatum'] }
    },

    // Modal öffnen
    open: async function() {
        this.reset();
        await this.loadLookupData();
        this.populateStep1();
        openModalById('importModal');
    },

    // Modal schließen
    close: function() {
        this.reset();
        closeModalById('importModal');
    },

    // Reset
    reset: function() {
        this.currentStep = 1;
        this.fileData = null;
        this.parsedData = [];
        this.columnMapping = {};
        this.updateStepUI();
    },

    // Lookup-Daten laden
    loadLookupData: async function() {
        const supabase = window.supabaseClient || window.parent?.supabaseClient;
        if (!supabase) {
            console.error('Supabase nicht verfügbar');
            return;
        }

        try {
            const [customersRes, campaignsRes, usersRes] = await Promise.all([
                supabase.from('customers').select('id, name, full_name'),
                supabase.from('campaigns').select('id, name, year, kw_from, kw_to, customer_id, campaign_areas(id, name, plz, customer_area_id, customer_areas(customer_id))'),
                supabase.from('users').select('id, name, role')
            ]);

            this.customers = customersRes.data || [];
            this.campaigns = campaignsRes.data || [];
            this.users = usersRes.data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Lookup-Daten:', error);
        }
    },

    // Kunde gewechselt - Kampagnen filtern
    onCustomerChange: function() {
        const customerId = document.getElementById('importCustomerSelect')?.value;
        const campaignSelect = document.getElementById('importCampaignSelect');
        const areaSelect = document.getElementById('importAreaSelect');

        // Werbegebiet zurücksetzen
        if (areaSelect) {
            areaSelect.innerHTML = '<option value="">Erst Kampagne wählen...</option>';
            areaSelect.disabled = true;
        }

        if (!customerId || !campaignSelect) {
            campaignSelect.innerHTML = '<option value="">Erst Kunde wählen...</option>';
            campaignSelect.disabled = true;
            return;
        }

        // Kampagnen filtern: entweder direkt über customer_id oder über campaign_areas → customer_areas
        const filteredCampaigns = this.campaigns.filter(c => {
            // Direkte Zuordnung
            if (c.customer_id === customerId) return true;
            // Zuordnung über campaign_areas
            if (c.campaign_areas && c.campaign_areas.length > 0) {
                return c.campaign_areas.some(area =>
                    area.customer_areas?.customer_id === customerId
                );
            }
            return false;
        });

        if (filteredCampaigns.length === 0) {
            campaignSelect.innerHTML = '<option value="">Keine Kampagnen für diesen Kunden</option>';
            campaignSelect.disabled = true;
            return;
        }

        campaignSelect.innerHTML = '<option value="">Bitte wählen...</option>' +
            filteredCampaigns.map(c => `<option value="${c.id}">${c.name} (${c.year}, KW ${c.kw_from}-${c.kw_to})</option>`).join('');
        campaignSelect.disabled = false;
    },

    // Kampagne gewechselt - Werbegebiete aktualisieren
    onCampaignChange: function() {
        const campaignId = document.getElementById('importCampaignSelect')?.value;
        const areaSelect = document.getElementById('importAreaSelect');

        if (!campaignId || !areaSelect) {
            areaSelect.innerHTML = '<option value="">Erst Kampagne wählen...</option>';
            areaSelect.disabled = true;
            return;
        }

        const campaign = this.campaigns.find(c => c.id === campaignId);
        const areas = campaign?.campaign_areas || [];

        if (areas.length === 0) {
            areaSelect.innerHTML = '<option value="">Keine Werbegebiete in dieser Kampagne</option>';
            areaSelect.disabled = true;
            return;
        }

        areaSelect.innerHTML = '<option value="">Bitte wählen...</option>' +
            areas.map(a => `<option value="${a.id}">${a.name}${a.plz ? ' (' + a.plz + ')' : ''}</option>`).join('');
        areaSelect.disabled = false;
    },

    // Schritt 1: Dropdowns und ID-Listen befüllen
    populateStep1: function() {
        // Kunde-Dropdown
        const customerSelect = document.getElementById('importCustomerSelect');
        if (customerSelect) {
            customerSelect.innerHTML = '<option value="">Bitte wählen...</option>' +
                this.customers.map(c => `<option value="${c.id}">${c.full_name || c.name}</option>`).join('');
        }

        // Kampagne-Dropdown (initial deaktiviert)
        const campaignSelect = document.getElementById('importCampaignSelect');
        if (campaignSelect) {
            campaignSelect.innerHTML = '<option value="">Erst Kunde wählen...</option>';
            campaignSelect.disabled = true;
        }

        // Werbegebiet-Dropdown (initial deaktiviert)
        const areaSelect = document.getElementById('importAreaSelect');
        if (areaSelect) {
            areaSelect.innerHTML = '<option value="">Erst Kampagne wählen...</option>';
            areaSelect.disabled = true;
        }

        // Alle Botschafter/Werber anzeigen (alle außer 'kunde')
        const botschafter = this.users.filter(u => u.role !== 'kunde');

        // Werber-Liste
        const werberList = document.getElementById('importWerberList');
        if (werberList) {
            werberList.innerHTML = botschafter.length > 0
                ? botschafter.map(w => `
                    <div class="import-id-item" onclick="ImportSystem.copyId('${w.id}')">
                        <span class="import-id-name">${w.name}</span>
                        <span class="import-id-value">${w.id}</span>
                        <span class="import-id-copy" title="ID kopieren">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                            </svg>
                        </span>
                    </div>
                `).join('')
                : '<span class="text-klein">Keine Botschafter gefunden</span>';
        }
    },

    // ID kopieren
    copyId: function(id) {
        navigator.clipboard.writeText(id).then(() => {
            showToast('ID kopiert', 'success');
        }).catch(() => {
            showToast('Kopieren fehlgeschlagen', 'error');
        });
    },

    // Nächster Schritt
    nextStep: function() {
        if (this.currentStep === 1) {
            // Validierung: Kunde, Kampagne und Werbegebiet müssen gewählt sein
            const customerId = document.getElementById('importCustomerSelect')?.value;
            const campaignId = document.getElementById('importCampaignSelect')?.value;
            const areaId = document.getElementById('importAreaSelect')?.value;
            if (!customerId || !campaignId || !areaId) {
                showToast('Bitte Kunde, Kampagne und Werbegebiet auswählen', 'error');
                return;
            }
        } else if (this.currentStep === 2) {
            // Validierung: Datei muss hochgeladen sein
            if (!this.fileData || this.parsedData.length === 0) {
                showToast('Bitte eine Datei hochladen', 'error');
                return;
            }
        } else if (this.currentStep === 3) {
            // Prüfen ob Aufnahmedatum gemappt ist (Pflichtfeld)
            const hasEntryDate = Object.values(this.columnMapping).includes('entryDate');
            if (!hasEntryDate) {
                showToast('Aufnahmedatum ist ein Pflichtfeld - bitte eine Spalte zuordnen', 'error');
                return;
            }
            // Spalten-Mapping anwenden
            this.applyColumnMapping();
        } else if (this.currentStep === 4) {
            // Import ausführen
            this.executeImport();
            return;
        }

        if (this.currentStep < this.maxSteps) {
            this.currentStep++;
            this.updateStepUI();

            if (this.currentStep === 3) {
                this.renderColumnMapping();
            } else if (this.currentStep === 4) {
                this.renderPreview();
            }
        }
    },

    // Vorheriger Schritt
    prevStep: function() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    // UI aktualisieren
    updateStepUI: function() {
        // Steps im Header aktualisieren
        document.querySelectorAll('.import-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);
        });

        // Content-Bereiche ein-/ausblenden
        for (let i = 1; i <= this.maxSteps; i++) {
            const stepContent = document.getElementById(`importStep${i}`);
            if (stepContent) {
                stepContent.style.display = i === this.currentStep ? '' : 'none';
            }
        }

        // Buttons aktualisieren
        const backBtn = document.getElementById('importBackBtn');
        const nextBtn = document.getElementById('importNextBtn');

        if (backBtn) {
            backBtn.style.display = this.currentStep > 1 ? '' : 'none';
        }
        if (nextBtn) {
            nextBtn.textContent = this.currentStep === this.maxSteps ? 'Importieren' : 'Weiter';
        }
    },

    // Datei verarbeiten
    handleFileSelect: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.fileData = file;

        // UI aktualisieren
        document.getElementById('importDropZone').style.display = 'none';
        document.getElementById('importFileInfo').style.display = 'flex';
        document.getElementById('importFileName').textContent = file.name;
        document.getElementById('importFileSize').textContent = this.formatFileSize(file.size);

        // Datei parsen
        this.parseFile(file);
    },

    // Datei entfernen
    removeFile: function() {
        this.fileData = null;
        this.parsedData = [];
        this.columnMapping = {};

        document.getElementById('importDropZone').style.display = '';
        document.getElementById('importFileInfo').style.display = 'none';
        document.getElementById('importFileInput').value = '';
    },

    // Dateigröße formatieren
    formatFileSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    // Datei parsen (CSV/Excel)
    parseFile: function(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;
                let workbook;

                if (file.name.endsWith('.csv')) {
                    workbook = XLSX.read(data, { type: 'string', raw: true });
                } else {
                    workbook = XLSX.read(data, { type: 'binary' });
                }

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length < 2) {
                    showToast('Datei enthält keine Daten', 'error');
                    return;
                }

                // Header und Daten extrahieren
                const headers = jsonData[0].map(h => String(h || '').trim());
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

                this.parsedData = rows.map(row => {
                    const obj = {};
                    headers.forEach((header, i) => {
                        obj[header] = row[i] !== undefined ? row[i] : '';
                    });
                    return obj;
                });

                // Auto-Mapping erstellen
                this.autoMapColumns(headers);

                showToast(`${this.parsedData.length} Datensätze erkannt`, 'success');
            } catch (error) {
                console.error('Parse-Fehler:', error);
                showToast('Fehler beim Lesen der Datei', 'error');
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    },

    // Automatisches Spalten-Mapping
    autoMapColumns: function(headers) {
        this.columnMapping = {};

        headers.forEach(header => {
            const headerLower = header.toLowerCase().trim();

            // Suche passendes Feld
            for (const [fieldId, fieldDef] of Object.entries(this.fieldDefinitions)) {
                if (fieldDef.aliases.some(alias => headerLower === alias || headerLower.includes(alias))) {
                    this.columnMapping[header] = fieldId;
                    break;
                }
            }
        });
    },

    // Aktuelle Headers speichern für Re-Render
    currentHeaders: [],

    // Beispielwerte aus Daten extrahieren
    getSampleValues: function(header, maxSamples = 1) {
        const samples = [];
        for (let i = 0; i < Math.min(maxSamples, this.parsedData.length); i++) {
            const val = this.parsedData[i][header];
            if (val !== undefined && val !== null && val !== '') {
                samples.push(String(val).substring(0, 25) + (String(val).length > 25 ? '…' : ''));
            }
        }
        return samples;
    },

    // Vorschau-Wert für Zielfeld generieren
    getPreviewValue: function(header, fieldId) {
        if (!fieldId || this.parsedData.length === 0) return '';

        const firstRow = this.parsedData[0];
        const val = firstRow[header];
        if (val === undefined || val === null || val === '') return '';

        // Formatierung je nach Feldtyp
        if (fieldId === 'birthDate' || fieldId === 'laterEntryDate') {
            const isoDate = this.parseGermanDate(val);
            return isoDate ? this.formatDateGerman(isoDate) : String(val);
        }

        return String(val).substring(0, 30);
    },

    // ISO-Datum zu deutschem Format
    formatDateGerman: function(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
        return isoDate;
    },

    // Spalten-Mapping rendern (Tabellen-UI wie bei Bestandsmitglieder)
    renderColumnMapping: function() {
        const headers = this.parsedData.length > 0 ? Object.keys(this.parsedData[0]) : [];
        const tableBody = document.getElementById('importMappingTableBody');
        if (!tableBody) return;

        let html = '';

        headers.forEach(header => {
            const fieldId = this.columnMapping[header];
            const fieldDef = fieldId ? this.fieldDefinitions[fieldId] : null;

            // Beispielwerte holen
            const samples = this.getSampleValues(header, 1);
            const sampleText = samples.length > 0 ? samples[0] : '–';

            // Vorschau-Wert
            const previewText = fieldId ? this.getPreviewValue(header, fieldId) : '';
            const targetLabel = fieldDef ? fieldDef.label : '';

            const selectOptions = Object.entries(this.fieldDefinitions)
                .map(([id, def]) => `<option value="${id}" ${fieldId === id ? 'selected' : ''}>${def.label}</option>`)
                .join('');

            const rowClass = fieldId ? 'import-row--mapped' : 'import-row--ignored';

            html += `
                <tr class="${rowClass}">
                    <td>${header}</td>
                    <td><code>${sampleText}</code></td>
                    <td>
                        <select class="eingabefeld eingabefeld--klein" onchange="ImportSystem.updateMapping('${header}', this.value)">
                            <option value="">– ignorieren –</option>
                            ${selectOptions}
                        </select>
                    </td>
                    <td>${fieldId ? `<code>${previewText}</code> → <strong>${targetLabel}</strong>` : '<span class="text-muted">–</span>'}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        this.currentHeaders = headers;
    },

    // Mapping aktualisieren
    updateMapping: function(header, fieldId) {
        if (fieldId) {
            // Prüfen ob Feld schon zugeordnet ist
            for (const [h, f] of Object.entries(this.columnMapping)) {
                if (f === fieldId && h !== header) {
                    delete this.columnMapping[h];
                }
            }
            this.columnMapping[header] = fieldId;
        } else {
            delete this.columnMapping[header];
        }
        this.renderColumnMapping();
    },

    // Alle Zuordnungen aufheben
    clearAllMappings: function() {
        this.columnMapping = {};
        this.renderColumnMapping();
    },

    // Auto-Zuordnung erneut ausführen
    autoMapAll: function() {
        const headers = this.currentHeaders || (this.parsedData.length > 0 ? Object.keys(this.parsedData[0]) : []);
        this.autoMapColumns(headers);
        this.renderColumnMapping();
    },

    // Spalten-Mapping anwenden
    applyColumnMapping: function() {
        // Mapping wird beim Import angewendet
    },

    // Deutsches Datum (DD.MM.YYYY) zu ISO (YYYY-MM-DD) konvertieren
    parseGermanDate: function(dateStr) {
        if (!dateStr) return null;
        // Bereits ISO-Format?
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);
        // Deutsches Format DD.MM.YYYY
        const match = String(dateStr).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (match) {
            const [, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Deutsches Format DD.MM.YY
        const match2 = String(dateStr).match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
        if (match2) {
            const [, day, month, year] = match2;
            const fullYear = parseInt(year) > 50 ? '19' + year : '20' + year;
            return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return null;
    },

    // Name in Vor- und Nachname aufsplitten
    splitFullName: function(fullName) {
        const name = (fullName || '').trim();
        if (!name) return { firstName: '', lastName: '' };

        const parts = name.split(/\s+/);
        if (parts.length === 1) {
            return { firstName: '', lastName: parts[0] };
        } else if (parts.length === 2) {
            return { firstName: parts[0], lastName: parts[1] };
        } else {
            // Mehr als 2 Teile: letztes = Nachname, Rest = Vorname
            return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
        }
    },

    // Straße + Hausnummer aufsplitten
    splitStreet: function(fullStreet) {
        const street = (fullStreet || '').trim();
        if (!street) return { street: '', houseNumber: '' };

        // Muster: "Straßenname 123a" oder "Straßenname 12-14"
        const match = street.match(/^(.+?)\s+(\d+[\w\-\/]*)\s*$/);
        if (match) {
            return { street: match[1].trim(), houseNumber: match[2].trim() };
        }
        return { street: street, houseNumber: '' };
    },

    // PLZ + Ort aufsplitten
    splitLocation: function(fullLocation) {
        const loc = (fullLocation || '').trim();
        if (!loc) return { zipCode: '', city: '' };

        // Muster: "12345 Stadtname" oder "D-12345 Stadtname"
        const match = loc.match(/^(?:[A-Z]{1,3}[\-\s]?)?(\d{4,5})\s+(.+)$/);
        if (match) {
            return { zipCode: match[1].trim(), city: match[2].trim() };
        }
        return { zipCode: '', city: loc };
    },

    // Zelle bearbeiten
    editCell: function(rowIndex, header, element) {
        const currentValue = this.parsedData[rowIndex][header] || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.className = 'eingabefeld';
        input.style.cssText = 'width: 100%; padding: 2px 4px; font-size: inherit;';

        const saveValue = () => {
            this.parsedData[rowIndex][header] = input.value;
            element.textContent = input.value || '';
            element.onclick = () => this.editCell(rowIndex, header, element);
        };

        input.onblur = saveValue;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') saveValue();
            if (e.key === 'Escape') {
                element.textContent = currentValue || '';
                element.onclick = () => this.editCell(rowIndex, header, element);
            }
        };

        element.textContent = '';
        element.onclick = null;
        element.appendChild(input);
        input.focus();
        input.select();
    },

    // Vorschau rendern
    renderPreview: function() {
        const previewHead = document.getElementById('importPreviewHead');
        const previewBody = document.getElementById('importPreviewBody');
        const previewCount = document.getElementById('importPreviewCount');

        // Gemappte Felder
        const mappedFields = Object.entries(this.columnMapping).map(([header, fieldId]) => ({
            header,
            fieldId,
            label: this.fieldDefinitions[fieldId]?.label || fieldId
        }));

        // Header
        previewHead.innerHTML = `<tr>${mappedFields.map(f => `<th>${f.label}</th>`).join('')}</tr>`;

        // Body - ALLE Zeilen editierbar
        previewBody.innerHTML = this.parsedData.map((row, rowIndex) => {
            return `<tr>${mappedFields.map(f =>
                `<td class="import-cell-editable" onclick="ImportSystem.editCell(${rowIndex}, '${f.header}', this)">${row[f.header] || ''}</td>`
            ).join('')}</tr>`;
        }).join('');

        previewCount.textContent = `${this.parsedData.length} Datensätze werden importiert (Zellen anklicken zum Bearbeiten)`;
    },

    // Import ausführen
    executeImport: async function() {
        const supabase = window.supabaseClient || window.parent?.supabaseClient;
        if (!supabase) {
            showToast('Supabase nicht verfügbar', 'error');
            return;
        }

        const customerId = document.getElementById('importCustomerSelect')?.value;
        const campaignId = document.getElementById('importCampaignSelect')?.value;
        const areaId = document.getElementById('importAreaSelect')?.value;

        if (!customerId || !campaignId || !areaId) {
            showToast('Kunde, Kampagne und Werbegebiet nicht ausgewählt', 'error');
            return;
        }

        const nextBtn = document.getElementById('importNextBtn');
        nextBtn.disabled = true;
        nextBtn.textContent = 'Importiere...';

        try {
            const records = this.parsedData.map(row => {
                const data = {};

                // Gemappte Felder übertragen
                for (const [header, fieldId] of Object.entries(this.columnMapping)) {
                    data[fieldId] = row[header];
                }

                // Kombinierte Felder aufsplitten
                if (data.fullName && !data.firstName && !data.lastName) {
                    const split = this.splitFullName(String(data.fullName));
                    data.firstName = split.firstName;
                    data.lastName = split.lastName;
                }
                if (data.fullStreet && !data.street && !data.houseNumber) {
                    const split = this.splitStreet(String(data.fullStreet));
                    data.street = split.street;
                    data.houseNumber = split.houseNumber;
                }
                if (data.fullLocation && !data.zipCode && !data.city) {
                    const split = this.splitLocation(String(data.fullLocation));
                    data.zipCode = split.zipCode;
                    data.city = split.city;
                }

                // Jahresbeitrag berechnen falls nicht vorhanden
                if (!data.yearlyAmount && data.amount && data.interval) {
                    const amount = parseFloat(String(data.amount).replace(',', '.')) || 0;
                    const multiplier = { 'monatlich': 12, 'monthly': 12, 'vierteljährlich': 4, 'quarterly': 4, 'halbjährlich': 2, 'halfyearly': 2, 'jährlich': 1, 'yearly': 1 };
                    data.yearlyAmount = amount * (multiplier[data.interval?.toLowerCase()] || 12);
                }

                // Status ermitteln: Storno wenn stornoDate vorhanden ODER recordStatus = storno/storniert/inaktiv
                const stornoDateParsed = this.parseGermanDate(data.stornoDate);
                const statusLower = String(data.recordStatus || '').toLowerCase();
                const isStorno = stornoDateParsed || ['storno', 'storniert', 'inaktiv', 'gekündigt', 'cancelled'].includes(statusLower);

                // Record-Objekt für Supabase (mit Datumskonvertierung)
                return {
                    customer_id: customerId,
                    campaign_id: campaignId,
                    campaign_area_id: areaId,
                    werber_id: data.werberId || null,
                    record_type: (data.recordType?.toUpperCase() === 'ERH' || data.recordType?.toLowerCase() === 'erhöhung') ? 'erhoehung' : 'neumitglied',
                    record_status: isStorno ? 'storno' : 'aktiv',
                    storno_date: stornoDateParsed,
                    first_name: data.firstName || '',
                    last_name: data.lastName || '',
                    salutation: data.salutation || '',
                    title: data.title || '',
                    company: data.company || '',
                    birth_date: this.parseGermanDate(data.birthDate),
                    street: data.street || '',
                    house_number: data.houseNumber || '',
                    zip_code: data.zipCode || '',
                    city: data.city || '',
                    country: data.country || 'Deutschland',
                    email: data.email || '',
                    phone_fixed: data.phoneFixed || '',
                    phone_mobile: data.phoneMobile || '',
                    iban: data.iban || '',
                    bic: data.bic || '',
                    bank_name: data.bankName || '',
                    account_holder: data.accountHolder || '',
                    amount: parseFloat(String(data.intervalAmount || '0').replace(',', '.')) || 0,
                    yearly_amount: parseFloat(String(data.yearlyAmount || '0').replace(',', '.')) || 0,
                    interval: data.interval || 'monthly',
                    donation_receipt: data.donationReceipt === 'Ja' || data.donationReceipt === 'true' || data.donationReceipt === true,
                    // Erhöhungs-Felder
                    member_number: data.memberNumber || '',
                    member_since: this.parseGermanDate(data.memberSince),
                    old_amount: parseFloat(String(data.oldYearlyAmount || '0').replace(',', '.')) || 0,
                    increase_amount: parseFloat(String(data.increaseAmount || '0').replace(',', '.')) || 0,
                    // Sonstige
                    notes: data.notes || '',
                    // Aufnahmedatum: Datum aus Datei + 12:00 Uhr als Zeitstempel
                    start_date: (() => {
                        const dateStr = this.parseGermanDate(data.entryDate) || this.parseGermanDate(data.laterEntryDate);
                        return dateStr ? dateStr + 'T12:00:00' : null;
                    })(),
                    data: data, // Alle Daten auch als JSON speichern
                    email_status: 'sent' // Import: keine Willkommensmail versenden
                };
            });

            // In Supabase einfügen
            const { data, error } = await supabase
                .from('records')
                .insert(records)
                .select();

            if (error) {
                throw error;
            }

            showToast(`${records.length} Datensätze erfolgreich importiert`, 'success');
            this.close();

            // Tabelle neu laden
            if (typeof loadAllData === 'function') {
                await loadAllData();
            }
            if (typeof renderRecordsTable === 'function') {
                renderRecordsTable();
            }

        } catch (error) {
            console.error('Import-Fehler:', error);
            showToast('Fehler beim Import: ' + error.message, 'error');
        } finally {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Importieren';
        }
    }
};

// =====================================================
// BESTANDSMITGLIEDER IMPORT SYSTEM
// =====================================================

const BestandImportSystem = {
    currentStep: 1,
    maxSteps: 2,
    fileData: null,
    parsedData: [],
    columnMapping: {},
    customerAreas: [],
    preselectedAreaId: null,

    // Spalten-Definitionen für Bestandsmitglieder (neue einheitliche IDs)
    fieldDefinitions: {
        // Kombinierte Felder (werden automatisch getrennt)
        fullName: { label: 'Name (Vor- + Nachname)', aliases: ['vollständiger name', 'full_name', 'fullname'], splitField: 'name' },
        fullStreet: { label: 'Straße + Hausnr.', aliases: ['adresse', 'anschrift', 'straße hausnummer', 'strasse hausnummer'], splitField: 'street' },
        fullLocation: { label: 'PLZ + Ort', aliases: ['plz ort', 'postleitzahl ort', 'plz/ort', 'plz stadt'], splitField: 'location' },
        // Pflichtfelder (oder fullName)
        firstName: { label: 'Vorname', aliases: ['vorname', 'first_name', 'firstname', 'vname'], required: true },
        lastName: { label: 'Nachname', aliases: ['nachname', 'last_name', 'lastname', 'nname', 'familienname', 'zuname'], required: true },
        oldYearlyAmount: { label: 'Alter Jahresbeitrag', aliases: ['beitrag', 'alter_beitrag', 'alter_jahresbeitrag', 'old_amount', 'old_yearly_amount', 'bisheriger_beitrag', 'vorheriger_beitrag', 'betrag', 'amount', 'jahresbeitrag'], required: true },
        // Optionale Felder - Erhöhung
        yearlyAmount: { label: 'Jahresbeitrag (neu)', aliases: ['neuer_beitrag', 'neuer_jahresbeitrag', 'yearly_amount', 'new_amount'] },
        increaseAmount: { label: 'Erhöhungsbetrag', aliases: ['erhoehung', 'erhöhung', 'erhoehungsbetrag', 'erhöhungsbetrag', 'increase_amount', 'differenz'] },
        intervalAmount: { label: 'Betrag pro Intervall', aliases: ['intervallbetrag', 'interval_amount', 'ratenbetrag', 'monatsbeitrag'] },
        memberNumber: { label: 'Mitgliedsnummer', aliases: ['mitgliedsnummer', 'mitglnr', 'member_number', 'mitgl_nr', 'mitgliednr'] },
        memberSince: { label: 'Mitglied seit', aliases: ['mitglied_seit', 'member_since', 'eintrittsdatum', 'beitritt'] },
        interval: { label: 'Buchungsintervall', aliases: ['intervall', 'zahlweise', 'rhythmus', 'interval', 'old_interval', 'buchungsintervall'] },
        // Persönliche Daten
        salutation: { label: 'Anrede', aliases: ['anrede', 'salut'] },
        title: { label: 'Titel', aliases: ['titel', 'title'] },
        company: { label: 'Firma', aliases: ['firma', 'firmenname', 'unternehmen', 'company'] },
        birthDate: { label: 'Geburtsdatum', aliases: ['geburtsdatum', 'birth_date', 'birthdate', 'geb', 'geb_datum'] },
        // Adresse
        street: { label: 'Straße', aliases: ['strasse', 'straße', 'str', 'street'] },
        houseNumber: { label: 'Hausnummer', aliases: ['hausnummer', 'hausnr', 'hnr', 'house_number', 'nr'] },
        zipCode: { label: 'PLZ', aliases: ['plz', 'postleitzahl', 'zip', 'zip_code'] },
        city: { label: 'Ort', aliases: ['ort', 'stadt', 'city', 'wohnort'] },
        country: { label: 'Land', aliases: ['land', 'country'] },
        // Kontakt
        email: { label: 'E-Mail', aliases: ['email', 'e-mail', 'mail'] },
        phoneFixed: { label: 'Tel. Festnetz', aliases: ['telefon', 'festnetz', 'phone', 'tel'] },
        phoneMobile: { label: 'Tel. Mobil', aliases: ['mobil', 'handy', 'mobile', 'mobiltelefon'] },
        // Bankdaten
        iban: { label: 'IBAN', aliases: ['iban'] },
        bic: { label: 'BIC', aliases: ['bic', 'swift'] },
        bankName: { label: 'Bank', aliases: ['bank', 'bankname', 'kreditinstitut'] },
        accountHolder: { label: 'Kontoinhaber', aliases: ['kontoinhaber', 'account_holder'] }
    },

    // Modal öffnen
    open: async function(preselectedAreaId = null) {
        this.reset();
        this.preselectedAreaId = preselectedAreaId;
        await this.loadCustomerAreas();
        this.ensureModalExists();
        this.populateStep1();
        openModalById('bestandImportModal');
    },

    // Modal schließen
    close: function() {
        this.reset();
        closeModalById('bestandImportModal');
    },

    // Reset
    reset: function() {
        this.currentStep = 1;
        this.fileData = null;
        this.parsedData = [];
        this.columnMapping = {};
        this.preselectedAreaId = null;

        // UI zurücksetzen falls Modal existiert
        const dropZone = document.getElementById('bestandDropZone');
        const fileInfo = document.getElementById('bestandFileInfo');
        const fileInput = document.getElementById('bestandFileInput');
        const mappingContainer = document.getElementById('bestandMappingContainer');

        if (dropZone) dropZone.style.display = 'flex';
        if (fileInfo) fileInfo.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (mappingContainer) mappingContainer.style.display = 'none';

        this.updateStepUI();
    },

    // Modal im DOM erstellen falls nicht vorhanden
    ensureModalExists: function() {
        if (document.getElementById('bestandImportModal')) return;

        const modalHtml = `
            <div class="modal modal-xl" id="bestandImportModal">
                <div class="page-container page-container--modal">
                    <!-- Modal Header -->
                    <div class="page-header">
                        <div class="page-header-row">
                            <div class="page-header-links">
                                <span class="text-ueberschrift">Bestandsmitglieder importieren</span>
                            </div>
                            <div class="page-header-mitte">
                                <div class="import-steps">
                                    <div class="import-step active" data-step="1">
                                        <span class="import-step-number">1</span>
                                        <span class="import-step-label">Zuordnung</span>
                                    </div>
                                    <div class="import-step-line"></div>
                                    <div class="import-step" data-step="2">
                                        <span class="import-step-number">2</span>
                                        <span class="import-step-label">Import</span>
                                    </div>
                                </div>
                            </div>
                            <div class="page-header-rechts">
                                <button class="btn btn-icon" onclick="BestandImportSystem.close()">
                                    <span class="icon icon--schliessen"></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 1: Werbegebiet + Datei + Mapping -->
                    <div class="page-content page-content--modal import-step-content" id="bestandImportStep1">
                        <!-- Werbegebiet + Datei in einer Zeile -->
                        <div class="zeile" style="gap: 16px; margin-bottom: 16px;">
                            <div class="anzeigenfeld anzeigenfeld--col">
                                <span class="text-klein">Werbegebiet</span>
                                <select class="eingabefeld" id="bestandAreaSelect" style="min-width: 200px;">
                                    <option value="">Bitte wählen...</option>
                                </select>
                            </div>
                            <div class="anzeigenfeld anzeigenfeld--col import-file-field" id="bestandDropZone">
                                <span class="text-klein">Datei</span>
                                <div class="import-file-btn">
                                    <span class="icon icon--upload"></span>
                                    <span>Datei wählen...</span>
                                </div>
                                <input type="file" id="bestandFileInput" accept=".xls,.xlsx,.csv" onchange="BestandImportSystem.handleFileSelect(event)">
                            </div>
                            <div class="anzeigenfeld anzeigenfeld--col" id="bestandFileInfo" style="display: none;">
                                <span class="text-klein">Datei</span>
                                <div class="import-file-btn import-file-btn--success">
                                    <span class="icon icon--haken"></span>
                                    <span id="bestandFileName">datei.xlsx</span>
                                    <button class="btn btn-icon btn-icon--klein" onclick="BestandImportSystem.removeFile();">
                                        <span class="icon icon--schliessen"></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Mapping-Tabelle -->
                        <div class="import-mapping-wrap" id="bestandMappingContainer" style="display: none;">
                            <div class="zeile" style="margin-bottom: 12px;">
                                <button class="btn btn-sm" onclick="BestandImportSystem.clearAllMappings()">Alle aufheben</button>
                                <button class="btn btn-sm" onclick="BestandImportSystem.autoMapAll()">Auto-Zuordnung</button>
                            </div>
                            <table class="table-simple">
                                <thead>
                                    <tr>
                                        <th>Spalte (Datei)</th>
                                        <th>Beispiel</th>
                                        <th>Zuordnung</th>
                                        <th>Vorschau</th>
                                    </tr>
                                </thead>
                                <tbody id="bestandMappingTableBody"></tbody>
                            </table>
                        </div>

                        <!-- Hinweis wenn keine Datei -->
                        <div class="zeile zeile--center" id="bestandEmptyHint" style="padding: 40px;">
                            <span class="text-klein">Bitte Werbegebiet wählen und Datei hochladen</span>
                        </div>
                    </div>

                    <!-- Step 2: Bestätigung & Import -->
                    <div class="page-content page-content--modal import-step-content" id="bestandImportStep2" style="display: none;">
                        <div class="zeile" style="gap: 32px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div class="anzeigenfeld anzeigenfeld--col">
                                <span class="text-klein">Werbegebiet</span>
                                <span class="text-normal" id="bestandSummaryArea">-</span>
                            </div>
                            <div class="anzeigenfeld anzeigenfeld--col">
                                <span class="text-klein">Datei</span>
                                <span class="text-normal" id="bestandSummaryFile">-</span>
                            </div>
                            <div class="anzeigenfeld anzeigenfeld--col">
                                <span class="text-klein">Einträge</span>
                                <span class="text-normal" id="bestandSummaryCount">0</span>
                            </div>
                        </div>
                        <div class="zeile" id="bestandMissingFieldsWarning" style="display: none; margin-top: 16px;">
                            <div class="alert alert--warning" style="width: 100%;">
                                <span class="icon icon--warnung"></span>
                                <span>Pflichtfelder fehlen: <strong id="bestandMissingFieldsList"></strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="page-footer page-footer--modal">
                        <button class="btn btn--grau" id="bestandImportBackBtn" onclick="BestandImportSystem.prevStep()" style="display: none;">Zurück</button>
                        <button class="btn btn--blau" id="bestandImportNextBtn" onclick="BestandImportSystem.nextStep()">Weiter</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Drag & Drop Events
        const dropZone = document.getElementById('bestandDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    this.handleFileSelect({ target: { files: e.dataTransfer.files } });
                }
            });
        }
    },

    // Werbegebiete laden
    loadCustomerAreas: async function() {
        const supabase = window.supabaseClient || window.parent?.supabaseClient;
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('customer_areas')
                .select('id, name, customers(name)')
                .order('name');

            if (!error && data) {
                this.customerAreas = data;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Werbegebiete:', error);
        }
    },

    // Step 1 befüllen
    populateStep1: function() {
        const select = document.getElementById('bestandAreaSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Bitte wählen...</option>';
        this.customerAreas.forEach(area => {
            const customerName = area.customers?.name || '';
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = customerName ? `${area.name} (${customerName})` : area.name;
            select.appendChild(option);
        });

        // Vorauswahl wenn areaId übergeben
        if (this.preselectedAreaId) {
            select.value = this.preselectedAreaId;
        }

        this.updateStepUI();
    },

    // Datei auswählen
    handleFileSelect: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.fileData = file;

        // UI aktualisieren
        document.getElementById('bestandDropZone').style.display = 'none';
        document.getElementById('bestandFileInfo').style.display = 'flex';
        document.getElementById('bestandFileName').textContent = file.name;
        document.getElementById('bestandEmptyHint').style.display = 'none';

        // Datei parsen
        this.parseFile(file);
    },

    // Datei entfernen
    removeFile: function() {
        this.fileData = null;
        this.parsedData = [];
        this.columnMapping = {};

        document.getElementById('bestandDropZone').style.display = 'flex';
        document.getElementById('bestandFileInfo').style.display = 'none';
        document.getElementById('bestandMappingContainer').style.display = 'none';
        document.getElementById('bestandEmptyHint').style.display = 'flex';
        document.getElementById('bestandFileInput').value = '';
    },

    // Dateigröße formatieren
    formatFileSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    // Datei parsen
    parseFile: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                let workbook;

                if (file.name.endsWith('.csv')) {
                    workbook = XLSX.read(data, { type: 'string', raw: true });
                } else {
                    workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                }

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, dateNF: 'dd.mm.yyyy' });

                // Header und Daten extrahieren
                const headers = jsonData[0].map(h => String(h || '').trim());
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

                // In Objekte umwandeln
                this.parsedData = rows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] !== undefined ? row[index] : '';
                    });
                    return obj;
                });

                // Auto-Mapping
                this.autoMapColumns(headers);

                // Mapping-UI anzeigen
                this.renderMappingUI(headers);
                document.getElementById('bestandMappingContainer').style.display = 'flex';

            } catch (error) {
                console.error('Fehler beim Parsen:', error);
                showToast('Fehler beim Lesen der Datei', 'error');
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    },

    // Automatisches Spalten-Mapping
    autoMapColumns: function(headers) {
        this.columnMapping = {};
        headers.forEach(header => {
            const headerLower = header.toLowerCase().trim();
            for (const [fieldId, fieldDef] of Object.entries(this.fieldDefinitions)) {
                if (fieldDef.aliases.some(alias => headerLower === alias || headerLower.includes(alias))) {
                    this.columnMapping[header] = fieldId;
                    break;
                }
            }
        });
    },

    // Beispielwerte aus Daten extrahieren
    getSampleValues: function(header, maxSamples = 3) {
        const samples = [];
        for (let i = 0; i < Math.min(maxSamples, this.parsedData.length); i++) {
            const val = this.parsedData[i][header];
            if (val !== undefined && val !== null && val !== '') {
                samples.push(String(val).substring(0, 25) + (String(val).length > 25 ? '…' : ''));
            }
        }
        return samples;
    },

    // Vorschau-Wert für Zielfeld generieren
    getPreviewValue: function(header, fieldId) {
        if (!fieldId || this.parsedData.length === 0) return '';

        const firstRow = this.parsedData[0];
        const val = firstRow[header];
        if (val === undefined || val === null || val === '') return '';

        // Formatierung je nach Feldtyp
        if (fieldId === 'memberSince' || fieldId === 'birthDate') {
            const isoDate = this.parseDate(val);
            return this.formatDateGerman(isoDate);
        }

        return String(val).substring(0, 30);
    },

    // Mapping UI rendern
    renderMappingUI: function(headers) {
        const tableBody = document.getElementById('bestandMappingTableBody');
        if (!tableBody) return;

        let html = '';

        headers.forEach(header => {
            const fieldId = this.columnMapping[header];
            const fieldDef = fieldId ? this.fieldDefinitions[fieldId] : null;

            // Beispielwerte holen (1 Wert für kompakte Darstellung)
            const samples = this.getSampleValues(header, 1);
            const sampleText = samples.length > 0 ? samples[0] : '–';

            // Vorschau-Wert
            const previewText = fieldId ? this.getPreviewValue(header, fieldId) : '';
            const targetLabel = fieldDef ? fieldDef.label : '';

            const selectOptions = Object.entries(this.fieldDefinitions)
                .map(([id, def]) => `<option value="${id}" ${fieldId === id ? 'selected' : ''}>${def.label}${def.required ? ' *' : ''}</option>`)
                .join('');

            const rowClass = fieldId ? 'import-row--mapped' : 'import-row--ignored';

            html += `
                <tr class="${rowClass}">
                    <td>${header}</td>
                    <td><code>${sampleText}</code></td>
                    <td>
                        <select class="eingabefeld eingabefeld--klein" onchange="BestandImportSystem.updateMapping('${header}', this.value); BestandImportSystem.renderMappingUI(BestandImportSystem.currentHeaders);">
                            <option value="">– ignorieren –</option>
                            ${selectOptions}
                        </select>
                    </td>
                    <td>${fieldId ? `<code>${previewText}</code> → <strong>${targetLabel}</strong>` : '<span class="text-muted">–</span>'}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        this.currentHeaders = headers;
    },

    // Mapping aktualisieren
    updateMapping: function(header, fieldId) {
        if (fieldId) {
            // Prüfen ob Feld schon zugeordnet ist
            for (const [h, f] of Object.entries(this.columnMapping)) {
                if (f === fieldId && h !== header) {
                    delete this.columnMapping[h];
                }
            }
            this.columnMapping[header] = fieldId;
        } else {
            delete this.columnMapping[header];
        }
    },

    // Alle Zuordnungen aufheben
    clearAllMappings: function() {
        this.columnMapping = {};
        this.renderMappingUI(this.currentHeaders);
    },

    // Auto-Zuordnung erneut ausführen
    autoMapAll: function() {
        const headers = this.currentHeaders || (this.parsedData.length > 0 ? Object.keys(this.parsedData[0]) : []);
        this.autoMapColumns(headers);
        this.renderMappingUI(headers);
    },

    // Nächster Schritt
    nextStep: async function() {
        // Validierung Schritt 1
        if (this.currentStep === 1) {
            const areaId = document.getElementById('bestandAreaSelect')?.value;
            if (!areaId) {
                showToast('Bitte Werbegebiet auswählen', 'warning');
                return;
            }
            if (!this.fileData || this.parsedData.length === 0) {
                showToast('Bitte Datei hochladen', 'warning');
                return;
            }

            // Pflichtfelder prüfen
            const mappedFields = Object.values(this.columnMapping);
            const hasFullName = mappedFields.includes('fullName');
            const hasFirstName = mappedFields.includes('firstName');
            const hasLastName = mappedFields.includes('lastName');
            const hasOldAmount = mappedFields.includes('oldYearlyAmount');

            const hasValidName = hasFullName || (hasFirstName && hasLastName);

            if (!hasValidName) {
                showToast('Name fehlt: Bitte "Name (Vor- + Nachname)" ODER "Vorname" + "Nachname" zuordnen', 'warning');
                return;
            }
            if (!hasOldAmount) {
                showToast('Pflichtfeld fehlt: Alter Jahresbeitrag', 'warning');
                return;
            }

            // Summary für Schritt 2 aktualisieren
            this.updateSummary();
        }

        // Schritt 2 = Import ausführen
        if (this.currentStep === 2) {
            await this.executeImport();
            return;
        }

        this.currentStep++;
        this.updateStepUI();
    },

    // Summary für Schritt 2 aktualisieren
    updateSummary: function() {
        const areaSelect = document.getElementById('bestandAreaSelect');
        const areaText = areaSelect?.options[areaSelect.selectedIndex]?.text || '-';

        document.getElementById('bestandSummaryArea').textContent = areaText;
        document.getElementById('bestandSummaryFile').textContent = this.fileData?.name || '-';
        document.getElementById('bestandSummaryCount').textContent = this.parsedData.length;
    },

    // Vorheriger Schritt
    prevStep: function() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    // Step UI aktualisieren
    updateStepUI: function() {
        // Steps im Header
        document.querySelectorAll('#bestandImportModal .import-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);
        });

        // Content-Bereiche (nur noch 2 Steps)
        for (let i = 1; i <= 2; i++) {
            const content = document.getElementById(`bestandImportStep${i}`);
            if (content) {
                content.style.display = i === this.currentStep ? 'block' : 'none';
            }
        }

        // Buttons
        const backBtn = document.getElementById('bestandImportBackBtn');
        const nextBtn = document.getElementById('bestandImportNextBtn');
        if (backBtn) backBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.textContent = this.currentStep === 2 ? 'Importieren' : 'Weiter';
    },

    // Vorschau rendern
    renderPreview: function() {
        const headerRow = document.getElementById('bestandPreviewHeader');
        const bodyEl = document.getElementById('bestandPreviewBody');
        const countEl = document.getElementById('bestandPreviewCount');

        // Prüfen welche Split-Felder verwendet werden
        const mappedFields = [...new Set(Object.values(this.columnMapping))];
        const hasFullName = mappedFields.includes('fullName');
        const hasFullStreet = mappedFields.includes('fullStreet');
        const hasFullLocation = mappedFields.includes('fullLocation');

        // Header erstellen - Split-Felder durch ihre Einzelfelder ersetzen
        let displayFields = [];
        mappedFields.forEach(fieldId => {
            if (fieldId === 'fullName') {
                displayFields.push({ id: '_firstName', label: 'Vorname (getrennt)', splitType: 'name' });
                displayFields.push({ id: '_lastName', label: 'Nachname (getrennt)', splitType: 'name' });
            } else if (fieldId === 'fullStreet') {
                displayFields.push({ id: '_street', label: 'Straße (getrennt)', splitType: 'street' });
                displayFields.push({ id: '_houseNumber', label: 'Hausnr. (getrennt)', splitType: 'street' });
            } else if (fieldId === 'fullLocation') {
                displayFields.push({ id: '_zipCode', label: 'PLZ (getrennt)', splitType: 'location' });
                displayFields.push({ id: '_city', label: 'Ort (getrennt)', splitType: 'location' });
            } else {
                const def = this.fieldDefinitions[fieldId];
                displayFields.push({ id: fieldId, label: def?.label || fieldId });
            }
        });

        let headerHtml = '<tr>';
        displayFields.forEach(field => {
            headerHtml += `<th>${field.label}</th>`;
        });
        headerHtml += '</tr>';
        headerRow.innerHTML = headerHtml;

        // Body (max 50 Zeilen Vorschau)
        let bodyHtml = '';
        let unsafeNameCount = 0;
        let unsafeStreetCount = 0;
        let unsafeLocationCount = 0;
        const previewData = this.parsedData.slice(0, 50);

        previewData.forEach(row => {
            // Split-Ergebnisse berechnen
            let nameSplit = null;
            let streetSplit = null;
            let locationSplit = null;

            if (hasFullName) {
                const header = Object.entries(this.columnMapping).find(([h, f]) => f === 'fullName')?.[0];
                const value = header ? row[header] : '';
                if (value) nameSplit = this.splitFullName(String(value));
            }
            if (hasFullStreet) {
                const header = Object.entries(this.columnMapping).find(([h, f]) => f === 'fullStreet')?.[0];
                const value = header ? row[header] : '';
                if (value) streetSplit = this.splitStreet(String(value));
            }
            if (hasFullLocation) {
                const header = Object.entries(this.columnMapping).find(([h, f]) => f === 'fullLocation')?.[0];
                const value = header ? row[header] : '';
                if (value) locationSplit = this.splitLocation(String(value));
            }

            // Unsichere Zeilen zählen
            if (nameSplit?.uncertain) unsafeNameCount++;
            if (streetSplit?.uncertain) unsafeStreetCount++;
            if (locationSplit?.uncertain) unsafeLocationCount++;

            const hasAnyUncertain = nameSplit?.uncertain || streetSplit?.uncertain || locationSplit?.uncertain;

            bodyHtml += `<tr${hasAnyUncertain ? ' class="row-warning"' : ''}>`;
            displayFields.forEach(field => {
                const warnIcon = '<span class="icon icon--warnung" title="Unsichere Trennung"></span>';

                if (field.splitType === 'name' && nameSplit) {
                    if (field.id === '_firstName') {
                        const warn = nameSplit.uncertain ? ' ' + warnIcon : '';
                        bodyHtml += `<td>${nameSplit.firstName || '-'}${warn}</td>`;
                    } else if (field.id === '_lastName') {
                        bodyHtml += `<td>${nameSplit.lastName || '-'}</td>`;
                    }
                } else if (field.splitType === 'street' && streetSplit) {
                    if (field.id === '_street') {
                        const warn = streetSplit.uncertain ? ' ' + warnIcon : '';
                        bodyHtml += `<td>${streetSplit.street || '-'}${warn}</td>`;
                    } else if (field.id === '_houseNumber') {
                        bodyHtml += `<td>${streetSplit.houseNumber || '-'}</td>`;
                    }
                } else if (field.splitType === 'location' && locationSplit) {
                    if (field.id === '_zipCode') {
                        const warn = locationSplit.uncertain ? ' ' + warnIcon : '';
                        bodyHtml += `<td>${locationSplit.zipCode || '-'}${warn}</td>`;
                    } else if (field.id === '_city') {
                        bodyHtml += `<td>${locationSplit.city || '-'}</td>`;
                    }
                } else {
                    // Normale Felder
                    const header = Object.entries(this.columnMapping).find(([h, f]) => f === field.id)?.[0];
                    let value = header ? row[header] : '';

                    // Datumsfelder im deutschen Format anzeigen
                    if ((field.id === 'memberSince' || field.id === 'birthDate') && value) {
                        const isoDate = this.parseDate(value);
                        value = this.formatDateGerman(isoDate);
                    }

                    bodyHtml += `<td>${value || ''}</td>`;
                }
            });
            bodyHtml += '</tr>';
        });
        bodyEl.innerHTML = bodyHtml;

        // Warnung bei unsicheren Trennungen
        const warningEl = document.getElementById('bestandMissingFieldsWarning');
        const warningListEl = document.getElementById('bestandMissingFieldsList');
        const totalUnsafe = unsafeNameCount + unsafeStreetCount + unsafeLocationCount;

        if (totalUnsafe > 0 && warningEl && warningListEl) {
            let warnings = [];
            if (unsafeNameCount > 0) warnings.push(`${unsafeNameCount} Namen`);
            if (unsafeStreetCount > 0) warnings.push(`${unsafeStreetCount} Adressen`);
            if (unsafeLocationCount > 0) warnings.push(`${unsafeLocationCount} PLZ/Orte`);
            warningListEl.innerHTML = `Unsichere Trennungen: ${warnings.join(', ')} - bitte prüfen`;
            warningEl.style.display = 'flex';
        } else if (warningEl) {
            warningEl.style.display = 'none';
        }

        countEl.textContent = `${this.parsedData.length} Einträge`;
    },

    // Import ausführen
    executeImport: async function() {
        const supabase = window.supabaseClient || window.parent?.supabaseClient;
        if (!supabase) {
            showToast('Supabase nicht verfügbar', 'error');
            return;
        }

        const nextBtn = document.getElementById('bestandImportNextBtn');
        nextBtn.disabled = true;
        nextBtn.textContent = 'Importiere...';

        try {
            const areaId = document.getElementById('bestandAreaSelect')?.value;

            const records = this.parsedData.map(row => {
                const record = {
                    customer_area_id: areaId
                };

                // Gemappte Felder übertragen
                for (const [header, fieldId] of Object.entries(this.columnMapping)) {
                    const value = row[header];
                    if (value === undefined || value === '') continue;

                    // Spezialfall: fullName automatisch in Vor- und Nachname trennen
                    if (fieldId === 'fullName') {
                        const { firstName, lastName } = this.splitFullName(String(value));
                        if (!record.first_name) record.first_name = firstName;
                        if (!record.last_name) record.last_name = lastName;
                        continue;
                    }

                    // Spezialfall: fullStreet automatisch in Straße und Hausnummer trennen
                    if (fieldId === 'fullStreet') {
                        const { street, houseNumber } = this.splitStreet(String(value));
                        if (!record.street) record.street = street;
                        if (!record.house_number) record.house_number = houseNumber;
                        continue;
                    }

                    // Spezialfall: fullLocation automatisch in PLZ und Ort trennen
                    if (fieldId === 'fullLocation') {
                        const { zipCode, city } = this.splitLocation(String(value));
                        if (!record.zip_code) record.zip_code = zipCode;
                        if (!record.city) record.city = city;
                        continue;
                    }

                    // Feld-Mapping auf DB-Spalten
                    const dbFieldMap = {
                        firstName: 'first_name',
                        lastName: 'last_name',
                        oldYearlyAmount: 'old_amount',
                        memberNumber: 'member_number',
                        memberSince: 'member_since',
                        oldInterval: 'old_interval',
                        salutation: 'salutation',
                        title: 'title',
                        birthDate: 'birth_date',
                        street: 'street',
                        houseNumber: 'house_number',
                        zipCode: 'zip_code',
                        city: 'city',
                        country: 'country',
                        email: 'email',
                        phoneFixed: 'phone_fixed',
                        phoneMobile: 'phone_mobile',
                        iban: 'iban',
                        bic: 'bic',
                        bankName: 'bank_name',
                        accountHolder: 'account_holder'
                    };

                    const dbField = dbFieldMap[fieldId];
                    if (!dbField) continue;

                    // Wert konvertieren
                    if (fieldId === 'oldYearlyAmount') {
                        record[dbField] = parseFloat(String(value).replace(',', '.')) || 0;
                    } else if (fieldId === 'memberSince' || fieldId === 'birthDate') {
                        // Datum konvertieren - verschiedene Formate erkennen -> YYYY-MM-DD für DB
                        record[dbField] = this.parseDate(value);
                    } else {
                        record[dbField] = String(value).trim();
                    }
                }

                // Default-Werte für Pflichtfelder falls nicht gemappt
                if (!record.first_name) record.first_name = '';
                if (!record.last_name) record.last_name = '';
                if (record.old_amount === undefined || record.old_amount === null) {
                    record.old_amount = 0;
                }

                return record;
            });

            // Debug: Ersten Record anzeigen
            console.log('Import Records (erste 2):', records.slice(0, 2));

            // In Supabase einfügen
            const { data, error } = await supabase
                .from('bestandsmitglieder')
                .insert(records)
                .select();

            if (error) throw error;

            showToast(`${records.length} Bestandsmitglieder erfolgreich importiert`, 'success');
            this.close();

            // Falls auf Datensätze-Seite, Tabelle neu laden
            if (typeof loadBestandsmitglieder === 'function') {
                await loadBestandsmitglieder();
            }
            if (typeof renderBestandsmitgliederTable === 'function') {
                renderBestandsmitgliederTable();
            }

        } catch (error) {
            console.error('Import-Fehler:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            const errorMsg = error.message || error.details || 'Unbekannter Fehler';
            showToast('Fehler beim Import: ' + errorMsg, 'error');
        } finally {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Importieren';
        }
    },

    // Hilfsfunktion: Namen automatisch trennen
    // Erkennt: "Müller, Hans" | "Hans Müller" | "Dr. Hans Müller"
    // Gibt auch uncertain: true zurück wenn Trennung unsicher ist
    splitFullName: function(fullName) {
        const name = fullName.trim();
        let firstName = '';
        let lastName = '';
        let uncertain = false;

        // Namenspräfixe die zum Nachnamen gehören
        const namePrefixes = ['van', 'von', 'de', 'del', 'della', 'da', 'di', 'du', 'la', 'le', 'ten', 'ter', 'den', 'der', 'dos', 'das', 'mc', 'mac', 'o\'', 'al', 'el', 'bin', 'ibn'];

        // Format: "Nachname, Vorname" (Komma-getrennt) - SICHER
        if (name.includes(',')) {
            const parts = name.split(',').map(p => p.trim());
            lastName = parts[0] || '';
            firstName = parts[1] || '';
            uncertain = false; // Komma = sichere Trennung
        }
        // Format: "Vorname Nachname" (Leerzeichen-getrennt)
        else if (name.includes(' ')) {
            const parts = name.split(' ').filter(p => p.trim());

            // Titel erkennen und überspringen (Dr., Prof., etc.)
            const titles = ['dr.', 'dr', 'prof.', 'prof', 'ing.', 'dipl.', 'mag.'];
            let startIndex = 0;
            while (startIndex < parts.length && titles.includes(parts[startIndex].toLowerCase())) {
                startIndex++;
            }

            const nameParts = parts.slice(startIndex);

            if (nameParts.length >= 2) {
                // Prüfen ob Namens-Präfix vorhanden (van, von, de, etc.)
                // Suche von hinten nach vorne nach Präfixen
                let lastNameStartIndex = nameParts.length - 1;

                // Prüfe ob vorletztes (oder frühere) Wort ein Präfix ist
                for (let i = nameParts.length - 2; i >= 0; i--) {
                    if (namePrefixes.includes(nameParts[i].toLowerCase())) {
                        lastNameStartIndex = i;
                        uncertain = true; // Präfix gefunden = unsicher
                    } else {
                        break; // Kein Präfix mehr, aufhören
                    }
                }

                // Wenn mehr als 2 Wörter und kein Präfix erkannt: könnte trotzdem Doppelname sein
                if (nameParts.length > 2 && lastNameStartIndex === nameParts.length - 1) {
                    uncertain = true; // Mehr als 2 Wörter ohne Präfix = unsicher
                }

                lastName = nameParts.slice(lastNameStartIndex).join(' ');
                firstName = nameParts.slice(0, lastNameStartIndex).join(' ');

            } else if (nameParts.length === 1) {
                // Nur ein Name übrig
                lastName = nameParts[0];
                uncertain = true; // Nur Nachname = unsicher
            }
        }
        // Nur ein Wort
        else {
            lastName = name;
            uncertain = true; // Nur ein Wort = unsicher
        }

        return { firstName, lastName, uncertain };
    },

    // Hilfsfunktion: Straße und Hausnummer trennen
    // Erkennt: "Musterstraße 12" | "Musterstr. 12a" | "Hauptstr. 123 b"
    splitStreet: function(fullStreet) {
        const street = fullStreet.trim();
        let streetName = '';
        let houseNumber = '';
        let uncertain = false;

        if (!street) {
            return { street: '', houseNumber: '', uncertain: false };
        }

        // Regex für Hausnummer am Ende: Zahl mit optionalem Buchstaben
        // z.B. "12", "12a", "12 a", "12-14", "12/1"
        const houseNumberMatch = street.match(/^(.+?)\s+(\d+[\s\-\/]?[a-zA-Z0-9]*)\s*$/);

        if (houseNumberMatch) {
            streetName = houseNumberMatch[1].trim();
            houseNumber = houseNumberMatch[2].trim().replace(/\s+/g, ''); // Leerzeichen in Hausnr. entfernen

            // Unsicher wenn:
            // - Hausnummer komplex ist (z.B. 12-14, 12/1)
            // - Straßenname ungewöhnlich kurz ist
            if (houseNumber.includes('-') || houseNumber.includes('/')) {
                uncertain = true;
            }
            if (streetName.length < 3) {
                uncertain = true;
            }
        } else {
            // Keine Hausnummer erkannt
            streetName = street;
            uncertain = true; // Keine Hausnummer = unsicher
        }

        return { street: streetName, houseNumber, uncertain };
    },

    // Hilfsfunktion: PLZ und Ort trennen
    // Erkennt: "12345 Berlin" | "D-12345 Berlin" | "12345 Bad Homburg"
    splitLocation: function(fullLocation) {
        const location = fullLocation.trim();
        let zipCode = '';
        let city = '';
        let uncertain = false;

        if (!location) {
            return { zipCode: '', city: '', uncertain: false };
        }

        // Deutsche PLZ: 5 Ziffern, optional mit Länderkennung (D-, DE-)
        const plzMatch = location.match(/^(?:[A-Z]{1,2}[\-\s]?)?(\d{4,5})\s+(.+)$/i);

        if (plzMatch) {
            zipCode = plzMatch[1].trim();
            city = plzMatch[2].trim();

            // Unsicher wenn:
            // - PLZ nicht genau 5 Stellen (DE Standard)
            // - Stadt hat mehrere Wörter (könnte Zusatz sein)
            if (zipCode.length !== 5) {
                uncertain = true;
            }
            // Mehrere Wörter ohne Bindestrich können Zusatz sein (z.B. "Bad Homburg vor der Höhe")
            const cityWords = city.split(/\s+/);
            if (cityWords.length > 3) {
                uncertain = true;
            }
        } else {
            // Keine PLZ erkannt - vielleicht nur Ort?
            city = location;
            uncertain = true;
        }

        return { zipCode, city, uncertain };
    },

    // Hilfsfunktion: Datum parsen (verschiedene Formate) -> YYYY-MM-DD für DB
    // Erkennt: DD.MM.YYYY, DD.MM.YY, YYYY-MM-DD, DD/MM/YYYY, Excel-Seriennummer
    parseDate: function(value) {
        if (!value) return null;

        const str = String(value).trim();

        // Excel-Seriennummer (Zahl > 1000 und < 100000)
        const numVal = parseFloat(str);
        if (!isNaN(numVal) && numVal > 1000 && numVal < 100000) {
            // Excel-Datum: Tage seit 30.12.1899
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + numVal * 24 * 60 * 60 * 1000);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${year}-${month}-${day}`;
        }

        // Format: DD.MM.YYYY oder DD.MM.YY
        const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
        if (dotMatch) {
            const day = dotMatch[1].padStart(2, '0');
            const month = dotMatch[2].padStart(2, '0');
            let year = dotMatch[3];
            if (year.length === 2) {
                year = parseInt(year) > 50 ? '19' + year : '20' + year;
            }
            return `${year}-${month}-${day}`;
        }

        // Format: DD/MM/YYYY
        const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (slashMatch) {
            const day = slashMatch[1].padStart(2, '0');
            const month = slashMatch[2].padStart(2, '0');
            let year = slashMatch[3];
            if (year.length === 2) {
                year = parseInt(year) > 50 ? '19' + year : '20' + year;
            }
            return `${year}-${month}-${day}`;
        }

        // Format: YYYY-MM-DD (bereits ISO)
        const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
        }

        // Fallback: Originalwert
        return str;
    },

    // Hilfsfunktion: DB-Datum (YYYY-MM-DD) -> deutsches Format (DD.MM.YYYY)
    formatDateGerman: function(isoDate) {
        if (!isoDate) return '';
        const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return `${match[3]}.${match[2]}.${match[1]}`;
        }
        return isoDate;
    }
};

// Bestand-Import-Funktionen global verfügbar machen
function openBestandImportModal(areaId) { BestandImportSystem.open(areaId); }
function closeBestandImportModal() { BestandImportSystem.close(); }

// Import-Funktionen global verfügbar machen
function openImportModal() { ImportSystem.open(); }
function closeImportModal() { ImportSystem.close(); }
function importStepNext() { ImportSystem.nextStep(); }
function importStepBack() { ImportSystem.prevStep(); }
function handleImportFileSelect(event) { ImportSystem.handleFileSelect(event); }
function removeImportFile() { ImportSystem.removeFile(); }

// =====================================================
// GLOBAL EXPORTS
// =====================================================

window.ModalTemplates = ModalTemplates;
window.ImportSystem = ImportSystem;
window.BestandImportSystem = BestandImportSystem;
window.openImportModal = openImportModal;
window.openBestandImportModal = openBestandImportModal;
window.closeBestandImportModal = closeBestandImportModal;
window.closeImportModal = closeImportModal;
window.importStepNext = importStepNext;
window.importStepBack = importStepBack;
window.handleImportFileSelect = handleImportFileSelect;
window.removeImportFile = removeImportFile;
window.openExportModal = function() {
    // Modal öffnen
    openModalById('exportModal');
    // Export-Info aktualisieren
    updateExportModalInfo();
    // Format-Listener initialisieren
    initExportFormatListener();
};

// Export-Modal Info aktualisieren
function updateExportModalInfo() {
    // Gefilterte Daten holen (wie in renderRecordsTable)
    let filtered;
    if (typeof currentFilter !== 'undefined' && typeof recordsData !== 'undefined') {
        if (currentFilter === 'all') {
            filtered = recordsData;
        } else if (currentFilter === 'storno') {
            filtered = recordsData.filter(d => d.recordStatus === 'storno');
        } else {
            filtered = recordsData.filter(d => d.recordType === currentFilter);
        }
    } else {
        filtered = [];
    }

    // Anzahl anzeigen
    const countInfo = document.getElementById('exportCountInfo');
    if (countInfo) {
        countInfo.textContent = `${filtered.length} Datensätze`;
    }

    // Gesamt-JE berechnen
    const totalJE = filtered.reduce((sum, r) => sum + (r.jeValue || 0), 0);
    const totalJEEl = document.getElementById('exportTotalJE');
    if (totalJEEl) {
        totalJEEl.textContent = totalJE.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' €';
    }

    // Filter-Info anzeigen
    const filterInfo = document.getElementById('exportFilterInfo');
    const filterValue = document.getElementById('exportFilterValue');
    if (filterInfo && filterValue && typeof currentFilter !== 'undefined') {
        if (currentFilter !== 'all') {
            filterInfo.style.display = 'flex';
            const filterLabels = {
                'nmg': 'Neumitglieder',
                'erh': 'Erhöhungen',
                'storno': 'Stornos'
            };
            filterValue.textContent = filterLabels[currentFilter] || currentFilter;
        } else {
            filterInfo.style.display = 'none';
        }
    }
}

// Format-Listener für Extension-Update
function initExportFormatListener() {
    const formatRadios = document.querySelectorAll('input[name="exportFormat"]');
    const extSpan = document.getElementById('exportFilenameExt');

    formatRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (extSpan) {
                extSpan.textContent = '.' + this.value;
            }
        });
    });
}

// Export bestätigen und durchführen
window.confirmExport = function() {
    // Format und Dateiname holen
    const format = document.querySelector('input[name="exportFormat"]:checked')?.value || 'xlsx';
    const filename = document.getElementById('exportFilename')?.value || 'datensaetze_export';

    // Gefilterte Daten holen
    let filtered;
    if (typeof currentFilter !== 'undefined' && typeof recordsData !== 'undefined') {
        if (currentFilter === 'all') {
            filtered = recordsData;
        } else if (currentFilter === 'storno') {
            filtered = recordsData.filter(d => d.recordStatus === 'storno');
        } else {
            filtered = recordsData.filter(d => d.recordType === currentFilter);
        }
    } else {
        filtered = [];
    }

    if (filtered.length === 0) {
        showToast('Keine Daten zum Exportieren vorhanden', 'warning');
        return;
    }

    // Sichtbare Spalten aus currentColumnsConfig holen (in Reihenfolge)
    const config = currentColumnsConfig.records || [];
    const visibleColumns = config.filter(col => col.visible);

    // Label-Mapping für Spalten
    const columnLabels = {
        // Neue einheitliche IDs
        name: 'Name',
        firstName: 'Vorname',
        lastName: 'Nachname',
        recordType: 'Typ',
        recordStatus: 'Status',
        entryDate: 'Aufnahmedatum',
        yearlyAmount: 'Jahresbeitrag',
        customerId: 'Kunde',
        campaignAreaId: 'Werbegebiet',
        werberId: 'Werber',
        teamchefId: 'Teamchef',
        street: 'Straße',
        houseNumber: 'Hausnummer',
        zipCode: 'PLZ',
        city: 'Ort',
        country: 'Land',
        email: 'E-Mail',
        phoneFixed: 'Tel. Festnetz',
        phoneMobile: 'Tel. Mobil',
        salutation: 'Anrede',
        title: 'Titel',
        company: 'Firma',
        birthDate: 'Geburtsdatum',
        iban: 'IBAN',
        bic: 'BIC',
        bankName: 'Bank',
        accountHolder: 'Kontoinhaber',
        intervalAmount: 'Betrag pro Intervall',
        interval: 'Buchungsintervall',
        donationReceipt: 'Spendenquittung',
        memberNumber: 'Mitgliedsnummer',
        memberSince: 'Mitglied seit',
        oldYearlyAmount: 'Alter Jahresbeitrag',
        increaseAmount: 'Erhöhungsbetrag',
        laterEntryDate: 'Späteres Beitrittsdatum',
        notes: 'Anmerkungen',
        stornoDate: 'Storno-Datum',
        stornoReason: 'Storno-Grund',
        contactEmailAllowed: 'Kontakt per E-Mail',
        contactPhoneAllowed: 'Kontakt per Telefon'
    };

    // Wert-Formatter für spezielle Spalten (neue einheitliche IDs)
    const formatValue = (colId, record) => {
        switch (colId) {
            case 'recordType':
                return record.recordType === 'nmg' ? 'Neumitglied' : 'Erhöhung';
            case 'recordStatus':
                return record.recordStatus === 'storno' ? 'Storniert' : 'Aktiv';
            case 'yearlyAmount':
                return record.yearlyAmountValue || 0;
            default:
                return record[colId] || '';
        }
    };

    // Daten für Export vorbereiten (nur sichtbare Spalten in Reihenfolge)
    const exportData = filtered.map(r => {
        const row = {};
        visibleColumns.forEach(col => {
            const label = columnLabels[col.id] || col.id;
            row[label] = formatValue(col.id, r);
        });
        return row;
    });

    try {
        // SheetJS Workbook erstellen
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Datensätze');

        // Spaltenbreiten dynamisch setzen (neue einheitliche IDs)
        const colWidths = {
            name: 25, firstName: 15, lastName: 15, recordType: 12, recordStatus: 10,
            entryDate: 12, yearlyAmount: 12, customerId: 20, campaignAreaId: 20, werberId: 15, teamchefId: 15,
            street: 20, houseNumber: 8, zipCode: 8, city: 15, country: 12,
            email: 25, phoneFixed: 15, phoneMobile: 15, salutation: 8, title: 10,
            company: 20, birthDate: 12, iban: 25, bic: 12, bankName: 20,
            accountHolder: 20, intervalAmount: 18, interval: 16, donationReceipt: 15,
            memberNumber: 15, memberSince: 12, oldYearlyAmount: 15, increaseAmount: 15,
            laterEntryDate: 20, notes: 25, stornoDate: 12, stornoReason: 20,
            contactEmailAllowed: 15, contactPhoneAllowed: 15
        };
        ws['!cols'] = visibleColumns.map(col => ({ wch: colWidths[col.id] || 15 }));

        // Datei exportieren
        const fullFilename = filename + '.' + format;
        XLSX.writeFile(wb, fullFilename);

        // Modal schließen
        closeModalById('exportModal');

        // Erfolgs-Toast
        showToast(`${filtered.length} Datensätze exportiert`, 'success');

    } catch (error) {
        console.error('Export-Fehler:', error);
        showToast('Fehler beim Export: ' + error.message, 'error');
    }
};
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

    // CSS-Klassen normalisieren (Aliase auf zentrale Klassen mappen)
    const typeClassMap = {
        gebiet: 'werbegebiet',
        customer_area: 'werbegebiet',
        kampagne_gebiet: 'kampagne'
    };
    const cssType = typeClassMap[type] || type;

    // Typ-spezifische Labels
    const typeLabels = {
        kunde: 'Kunde',
        werbegebiet: 'Werbegebiet',
        gebiet: 'Werbegebiet',
        customer_area: 'Werbegebiet',
        werber: 'Werber',
        kampagne: 'Kampagne',
        kampagne_gebiet: 'Kampagne',
        neumitglied: 'Neumitglied',
        erhoehung: 'Erhöhung',
        bestandsmitglied: 'Bestandsmitglied',
        storno: 'Storno',
        alle: 'Übersicht'
    };

    // Symbol-basierte Typen (Neumitglied, Erhöhung, Bestandsmitglied, Storno)
    const symbolTypes = ['neumitglied', 'erhoehung', 'bestandsmitglied', 'storno'];
    const useSymbol = symbolTypes.includes(cssType);

    // Avatar: Bild > Symbol > Initialen
    let avatarContent;
    if (image) {
        // onerror: Bei Ladefehler auf Initialen zurückfallen
        const initials = getInitials(name).replace(/'/g, "\\'");
        avatarContent = `<img src="${image}" alt="${name}" onerror="this.outerHTML='${initials}'">`;
    } else if (useSymbol) {
        avatarContent = getBadgeSymbolSVG(cssType);
    } else {
        avatarContent = getInitials(name);
    }
    const stufeBadge = (cssType === 'werber' && stufe) ? getStufeBadge(stufe) : '';
    const typeRow = cssType === 'werber' ? getBadgeTypeRow(typeLabels[type], isTC, isQ) : `<span class="user-badge__type">${typeLabels[type]}</span>`;
    const avatarStufeClass = (cssType === 'werber' && stufe) ? `user-badge__avatar--${stufe.toLowerCase()}` : '';

    return `<div class="user-badge user-badge--${cssType} ${sizeClass}"${styleAttr}>
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
const KOSTENART_LABELS = {
    'kfz': 'KFZ',
    'unterkunft': 'Unterkunft',
    'verpflegung': 'Verpflegung',
    'kleidung': 'DRK Kleidung - Vollmontur',
    'ausweise': 'DRK-Ausweise'
};

const CONTACT_ROLES = {
    'geschaeftsfuehrer': 'Geschäftsführer',
    'mitgliederbeauftragte': 'Mitgliederbeauftragte',
    'stv_geschaeftsfuehrer': 'Stv. Geschäftsführer',
    'oeffentlichkeitsarbeit': 'Öffentlichkeitsarbeit',
    'vorstand': 'Vorstand',
    'vorstandsvorsitzender': 'Vorstandsvorsitzender',
    'bereitschaftsleiter': 'Bereitschaftsleiter',
    'schatzmeister': 'Schatzmeister',
    'jugendrotkreuzleitung': 'Jugendrotkreuzleitung',
    'sonstige': 'Sonstige'
};

const CONTACT_ROLE_BADGES = {
    'schatzmeister': 'Pre-Fill Rechnung',
    'mitgliederbeauftragte': 'Pre-Fill Formular + Email Ansprechpartner'
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

    const formatDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
 * Gibt den Status einer Kampagne basierend auf KW und Jahr zurück
 * @param {number} kwFrom - Start-KW
 * @param {number} kwTo - End-KW
 * @param {number} year - Jahr der Kampagne
 * @returns {string} 'active', 'planned' oder 'inactive'
 */
function getCampaignStatus(kwFrom, kwTo, year) {
    const currentWeek = getCurrentWeek();
    const currentYear = new Date().getFullYear();

    if (year < currentYear) {
        return 'inactive';
    } else if (year > currentYear) {
        return 'planned';
    } else {
        // Gleiches Jahr - KW vergleichen
        if (currentWeek >= kwFrom && currentWeek <= kwTo) {
            return 'active';
        } else if (currentWeek < kwFrom) {
            return 'planned';
        } else {
            return 'inactive';
        }
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
 * Zentrale Feld-Definitionen für alle Tabellen
 * nmg = Neumitglieder, erh = Erhöhung, bestand = Bestandsmitglieder
 */
const FIELD_DEFINITIONS = {
    // Persönliche Daten
    salutation:          { id: 'salutation',          label: 'Anrede',                  category: 'person',   nmg: true,  erh: true,  bestand: true  },
    title:               { id: 'title',               label: 'Titel',                   category: 'person',   nmg: true,  erh: true,  bestand: true  },
    firstName:           { id: 'firstName',           label: 'Vorname',                 category: 'person',   nmg: true,  erh: true,  bestand: true  },
    lastName:            { id: 'lastName',            label: 'Nachname',                category: 'person',   nmg: true,  erh: true,  bestand: true  },
    company:             { id: 'company',             label: 'Firma',                   category: 'person',   nmg: true,  erh: true,  bestand: true  },
    birthDate:           { id: 'birthDate',           label: 'Geburtsdatum',            category: 'person',   nmg: true,  erh: true,  bestand: true  },

    // Adresse
    street:              { id: 'street',              label: 'Straße',                  category: 'address',  nmg: true,  erh: true,  bestand: true  },
    houseNumber:         { id: 'houseNumber',         label: 'Hausnummer',              category: 'address',  nmg: true,  erh: true,  bestand: true  },
    zipCode:             { id: 'zipCode',             label: 'PLZ',                     category: 'address',  nmg: true,  erh: true,  bestand: true  },
    city:                { id: 'city',                label: 'Ort',                     category: 'address',  nmg: true,  erh: true,  bestand: true  },
    country:             { id: 'country',             label: 'Land',                    category: 'address',  nmg: true,  erh: true,  bestand: true  },

    // Kontakt
    email:               { id: 'email',               label: 'E-Mail',                  category: 'contact',  nmg: true,  erh: true,  bestand: true  },
    phoneMobile:         { id: 'phoneMobile',         label: 'Telefon Mobil',           category: 'contact',  nmg: true,  erh: true,  bestand: true  },
    phoneFixed:          { id: 'phoneFixed',          label: 'Telefon Festnetz',        category: 'contact',  nmg: true,  erh: true,  bestand: true  },

    // Bankdaten
    iban:                { id: 'iban',                label: 'IBAN',                    category: 'bank',     nmg: true,  erh: true,  bestand: true  },
    bic:                 { id: 'bic',                 label: 'BIC',                     category: 'bank',     nmg: true,  erh: true,  bestand: true  },
    bankName:            { id: 'bankName',            label: 'Bank',                    category: 'bank',     nmg: true,  erh: true,  bestand: true  },
    accountHolder:       { id: 'accountHolder',       label: 'Kontoinhaber',            category: 'bank',     nmg: true,  erh: true,  bestand: true  },

    // Beitrag
    intervalAmount:      { id: 'intervalAmount',      label: 'Betrag pro Intervall',    category: 'payment',  nmg: true,  erh: true,  bestand: true  },
    interval:            { id: 'interval',            label: 'Buchungsintervall',       category: 'payment',  nmg: true,  erh: true,  bestand: true  },
    yearlyAmount:        { id: 'yearlyAmount',        label: 'Jahresbeitrag',           category: 'payment',  nmg: true,  erh: true,  bestand: true  },
    donationReceipt:     { id: 'donationReceipt',     label: 'Spendenquittung',         category: 'payment',  nmg: true,  erh: true,  bestand: false },

    // Erhöhung (ERH + Bestand)
    memberNumber:        { id: 'memberNumber',        label: 'Mitgliedsnummer',         category: 'increase', nmg: false, erh: true,  bestand: true  },
    memberSince:         { id: 'memberSince',         label: 'Mitglied seit',           category: 'increase', nmg: false, erh: true,  bestand: true  },
    oldYearlyAmount:     { id: 'oldYearlyAmount',     label: 'Alter Jahresbeitrag',     category: 'increase', nmg: false, erh: true,  bestand: true  },
    increaseAmount:      { id: 'increaseAmount',      label: 'Erhöhungsbetrag',         category: 'increase', nmg: false, erh: true,  bestand: true  },

    // Einwilligungen
    contactEmailAllowed: { id: 'contactEmailAllowed', label: 'Kontakt per E-Mail',      category: 'optin',    nmg: true,  erh: true,  bestand: false },
    contactPhoneAllowed: { id: 'contactPhoneAllowed', label: 'Kontakt per Telefon',     category: 'optin',    nmg: true,  erh: true,  bestand: false },

    // Sonstiges
    entryDate:           { id: 'entryDate',           label: 'Aufnahmedatum',           category: 'other',    nmg: true,  erh: true,  bestand: false },
    laterEntryDate:      { id: 'laterEntryDate',      label: 'Späteres Beitrittsdatum', category: 'other',    nmg: true,  erh: true,  bestand: false },
    notes:               { id: 'notes',               label: 'Anmerkungen',             category: 'other',    nmg: true,  erh: true,  bestand: false },

    // Meta (System)
    recordType:          { id: 'recordType',          label: 'Typ',                     category: 'meta',     nmg: true,  erh: true,  bestand: false },
    recordStatus:        { id: 'recordStatus',        label: 'Status',                  category: 'meta',     nmg: true,  erh: true,  bestand: false },
    stornoDate:          { id: 'stornoDate',          label: 'Storno-Datum',            category: 'meta',     nmg: true,  erh: true,  bestand: false },
    stornoReason:        { id: 'stornoReason',        label: 'Storno-Grund',            category: 'meta',     nmg: true,  erh: true,  bestand: false },

    // Zuordnung
    customerId:          { id: 'customerId',          label: 'Kunde',                   category: 'assign',   nmg: true,  erh: true,  bestand: true  },
    campaignAreaId:      { id: 'campaignAreaId',      label: 'Werbegebiet',             category: 'assign',   nmg: true,  erh: true,  bestand: true  },
    werberId:            { id: 'werberId',            label: 'Werber',                  category: 'assign',   nmg: true,  erh: true,  bestand: false },
    teamchefId:          { id: 'teamchefId',          label: 'Teamchef',                category: 'assign',   nmg: true,  erh: true,  bestand: false }
};

// Helper: Spalten für einen Typ generieren
function getColumnsForType(type) {
    return Object.values(FIELD_DEFINITIONS).filter(field => {
        if (type === 'all') return field.nmg || field.erh;
        if (type === 'nmg') return field.nmg;
        if (type === 'erh') return field.erh;
        if (type === 'bestand') return field.bestand;
        return false;
    });
}

/**
 * Spalten-Definitionen für beide Tabellen (generiert aus FIELD_DEFINITIONS)
 */
const columnDefinitions = {
    records: [
        // Basis-Felder (Standard sichtbar)
        { id: 'name', label: 'Name', visible: true, required: true },
        { id: 'firstName', label: 'Vorname', visible: true, required: false },
        { id: 'lastName', label: 'Nachname', visible: true, required: false },
        { id: 'recordType', label: 'Typ', visible: true, required: false },
        { id: 'recordStatus', label: 'Status', visible: true, required: false },
        { id: 'entryDate', label: 'Aufnahmedatum', visible: true, required: false },
        { id: 'yearlyAmount', label: 'Jahresbeitrag', visible: true, required: false },
        { id: 'customerId', label: 'Kunde', visible: true, required: false },
        { id: 'campaignAreaId', label: 'Werbegebiet', visible: true, required: false },
        { id: 'werberId', label: 'Werber', visible: true, required: false },
        { id: 'teamchefId', label: 'Teamchef', visible: true, required: false },
        // Adresse
        { id: 'street', label: 'Straße', visible: true, required: false },
        { id: 'houseNumber', label: 'Hausnummer', visible: true, required: false },
        { id: 'zipCode', label: 'PLZ', visible: true, required: false },
        { id: 'city', label: 'Ort', visible: true, required: false },
        { id: 'country', label: 'Land', visible: false, required: false },
        // Kontakt
        { id: 'email', label: 'E-Mail', visible: true, required: false },
        { id: 'phoneFixed', label: 'Tel. Festnetz', visible: true, required: false },
        { id: 'phoneMobile', label: 'Tel. Mobil', visible: true, required: false },
        // Persönliche Daten (Standard ausgeblendet)
        { id: 'salutation', label: 'Anrede', visible: false, required: false },
        { id: 'title', label: 'Titel', visible: false, required: false },
        { id: 'company', label: 'Firma', visible: false, required: false },
        { id: 'birthDate', label: 'Geburtsdatum', visible: false, required: false },
        // Zahlungsdaten (Standard ausgeblendet)
        { id: 'iban', label: 'IBAN', visible: false, required: false },
        { id: 'bic', label: 'BIC', visible: false, required: false },
        { id: 'bankName', label: 'Bank', visible: false, required: false },
        { id: 'accountHolder', label: 'Kontoinhaber', visible: false, required: false },
        // Beiträge
        { id: 'intervalAmount', label: 'Betrag pro Intervall', visible: false, required: false },
        { id: 'interval', label: 'Buchungsintervall', visible: false, required: false },
        { id: 'donationReceipt', label: 'Spendenquittung', visible: false, required: false },
        // Erhöhungs-spezifisch
        { id: 'memberNumber', label: 'Mitgliedsnr.', visible: false, required: false },
        { id: 'memberSince', label: 'Mitglied seit', visible: false, required: false },
        { id: 'oldYearlyAmount', label: 'Alter Jahresbeitrag', visible: false, required: false },
        { id: 'increaseAmount', label: 'Erhöhungsbetrag', visible: false, required: false },
        // Opt-In
        { id: 'contactEmailAllowed', label: 'Kontakt per E-Mail', visible: false, required: false },
        { id: 'contactPhoneAllowed', label: 'Kontakt per Telefon', visible: false, required: false },
        // Sonstiges
        { id: 'laterEntryDate', label: 'Späteres Beitrittsdatum', visible: false, required: false },
        { id: 'notes', label: 'Anmerkungen', visible: false, required: false },
        { id: 'stornoDate', label: 'Storno-Datum', visible: false, required: false },
        { id: 'stornoReason', label: 'Storno-Grund', visible: false, required: false }
    ],
    bestand: [
        // Basis-Felder (Standard sichtbar)
        { id: 'name', label: 'Name', visible: true, required: true },
        { id: 'firstName', label: 'Vorname', visible: false, required: false },
        { id: 'lastName', label: 'Nachname', visible: false, required: false },
        { id: 'memberNumber', label: 'Mitgliedsnummer', visible: true, required: false },
        { id: 'memberSince', label: 'Mitglied seit', visible: true, required: false },
        { id: 'yearlyAmount', label: 'Jahresbeitrag', visible: true, required: false },
        { id: 'oldYearlyAmount', label: 'Alter Jahresbeitrag', visible: false, required: false },
        { id: 'increaseAmount', label: 'Erhöhungsbetrag', visible: false, required: false },
        { id: 'intervalAmount', label: 'Betrag pro Intervall', visible: false, required: false },
        { id: 'interval', label: 'Buchungsintervall', visible: false, required: false },
        { id: 'customerId', label: 'Kunde', visible: false, required: false },
        { id: 'campaignAreaId', label: 'Werbegebiet', visible: false, required: false },
        // Persönliche Daten
        { id: 'salutation', label: 'Anrede', visible: false, required: false },
        { id: 'title', label: 'Titel', visible: false, required: false },
        { id: 'company', label: 'Firma', visible: false, required: false },
        { id: 'birthDate', label: 'Geburtsdatum', visible: false, required: false },
        // Adresse
        { id: 'street', label: 'Straße', visible: false, required: false },
        { id: 'houseNumber', label: 'Hausnummer', visible: false, required: false },
        { id: 'zipCode', label: 'PLZ', visible: false, required: false },
        { id: 'city', label: 'Ort', visible: false, required: false },
        { id: 'country', label: 'Land', visible: false, required: false },
        // Kontakt
        { id: 'email', label: 'E-Mail', visible: true, required: false },
        { id: 'phoneFixed', label: 'Tel. Festnetz', visible: false, required: false },
        { id: 'phoneMobile', label: 'Tel. Mobil', visible: false, required: false },
        // Zahlungsdaten
        { id: 'iban', label: 'IBAN', visible: false, required: false },
        { id: 'bic', label: 'BIC', visible: false, required: false },
        { id: 'bankName', label: 'Bank', visible: false, required: false },
        { id: 'accountHolder', label: 'Kontoinhaber', visible: false, required: false },
        // Status
        { id: 'recordStatus', label: 'Status', visible: true, required: false }
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

        // Spezialbehandlung für verschiedene Datentypen (neue einheitliche IDs)
        if (col === 'yearlyAmount' || col === 'intervalAmount' || col === 'oldYearlyAmount' || col === 'increaseAmount') {
            // Währung: "120,00 €" -> 120.00
            valA = parseFloat((valA || '').toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            valB = parseFloat((valB || '').toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        } else if (col === 'entryDate' || col === 'memberSince' || col === 'birthDate' || col === 'laterEntryDate' || col === 'stornoDate') {
            // Datum: "01.03.2024" -> Date
            const parseDate = (str) => {
                if (!str) return new Date(0);
                const parts = str.split('.');
                if (parts.length !== 3) return new Date(0);
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
    if (!menu || !menu.classList.contains('dropdown-menu')) {
        console.warn('Dropdown menu not found for button', btn);
        return;
    }
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
    const id = dropdownMenu.dataset.id;

    // Dropdown schließen (zentrale Funktion nutzen)
    closeAllDropdowns();

    // Daten laden
    const data = type === 'records' ? recordsData : bestandData;
    const record = data.find(d => String(d.id) === String(id));
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
        case 'unstorno':
            openUnstornoConfirm(type, id, record.name);
            break;
        case 'delete':
            deleteSingle(type, id, record);
            break;
    }
}

// ========== SOFT-DELETE MIT GEGENBUCHUNG ==========

/**
 * Löscht einen Record (Soft-Delete) und erstellt Gegenbuchungen
 * Verwendet RPC-Funktion für transaktionssichere Ausführung
 * @param {string} recordId - Record UUID
 * @returns {Promise<boolean>} Erfolg
 */
async function loescheRecord(recordId) {
    const supabase = window.supabase || (window.parent && window.parent.supabaseClient);
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    const { data, error } = await supabase.rpc('loesche_record_transaction', {
        p_record_id: recordId
    });

    if (error) throw error;

    return true;
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

    // IDs sind UUIDs (Strings), nicht parseInt verwenden
    const records = ids.map(id => data.find(d => d.id === id)).filter(Boolean);
    const names = records.map(r => r.name);

    return { ids, names, records };
}

/**
 * Sendet Willkommensmail an einen Record
 * @param {Object} record - Der Record mit allen Daten
 * @returns {Promise<boolean>} - true wenn erfolgreich, false sonst
 */
async function sendWelcomeEmail(record) {
    if (!record.email) {
        console.warn('Keine E-Mail-Adresse vorhanden');
        return false;
    }

    const recordId = record._raw?.id || record.id;
    if (!recordId) {
        console.error('Keine Record-ID vorhanden');
        return false;
    }

    try {
        const response = await fetch('https://lgztglycqtiwcmiydxnm.supabase.co/functions/v1/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDc2MTUsImV4cCI6MjA3OTM4MzYxNX0.a_ZeubRokmhdevV3JinTiD1Ji92C4bDHSiiDcYGZnt0'
            },
            body: JSON.stringify({ record_id: recordId, vorlage_typ: 'willkommen', force: true })
        });

        const result = await response.json();

        if (result.success) {
            if (result.skipped) {
                console.log('Email bereits gesendet oder übersprungen:', result.reason);
                return true;
            }
            console.log('Willkommensmail erfolgreich gesendet an:', record.email);
            return true;
        } else {
            console.error('E-Mail-Versand fehlgeschlagen:', result.error);
            return false;
        }
    } catch (err) {
        console.error('Fehler beim E-Mail-Versand:', err);
        return false;
    }
}

/**
 * Unified Table Action Handler
 * @param {string} action - Aktion ('mail', 'pdf', 'storno', 'delete')
 * @param {string} type - Tabellentyp ('records' oder 'bestand')
 * @param {Object} [singleRecord] - Optional: Einzelner Record für Single-Actions
 */
async function tableAction(action, type, singleRecord = null) {
    let names, ids, records;

    if (singleRecord) {
        // Single Action
        names = [singleRecord.name];
        ids = [singleRecord.id];
        records = [singleRecord];
    } else {
        // Bulk Action
        const selected = getSelectedRecords(type);
        if (selected.ids.length === 0) return;
        names = selected.names;
        ids = selected.ids;
        records = selected.records;
    }

    const isSingle = names.length === 1;
    const nameList = names.join(', ');

    switch (action) {
        case 'mail':
            // Records mit E-Mail filtern
            const recordsWithEmail = records.filter(r => r.email);
            if (recordsWithEmail.length === 0) {
                showToast('Keine E-Mail-Adresse vorhanden', 'warning');
                break;
            }

            // Mails senden
            let successCount = 0;
            let failCount = 0;
            for (const record of recordsWithEmail) {
                const success = await sendWelcomeEmail(record);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Toast nur bei Erfolg
            if (successCount > 0) {
                showToast(successCount === 1 ? 'E-Mail gesendet' : `${successCount} E-Mails gesendet`, 'success');
            }
            if (failCount > 0) {
                showToast(failCount === 1 ? 'E-Mail fehlgeschlagen' : `${failCount} E-Mails fehlgeschlagen`, 'error');
            }
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
                try {
                    // Soft-Delete mit Gegenbuchung für jeden Record
                    for (const id of ids) {
                        await loescheRecord(id);
                    }

                    // Aus lokalem Array entfernen
                    ids.forEach(id => {
                        const index = recordsData.findIndex(r => r.id === id);
                        if (index > -1) recordsData.splice(index, 1);
                    });

                    // Tabelle neu rendern
                    renderRecordsTable();

                    // Badge aktualisieren
                    const badge = document.getElementById('recordsBadge');
                    if (badge) badge.textContent = recordsData.length;

                    const successText = isSingle ? `"${names[0]}" gelöscht` : `${ids.length} Einträge gelöscht`;
                    showToast(successText, 'success');
                    if (!singleRecord) clearSelection(type);
                } catch (error) {
                    console.error('Fehler beim Löschen:', error);
                    showToast('Fehler beim Löschen: ' + error.message, 'error');
                }
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
        // Alle Datensätze (inkl. Stornos)
        filtered = recordsData;
    } else if (currentFilter === 'storno') {
        // Nur Stornos
        filtered = recordsData.filter(d => d.recordStatus === 'storno');
    } else {
        // NMG oder ERH - nur aktive (ohne Stornos)
        filtered = recordsData.filter(d => d.recordType === currentFilter && d.recordStatus !== 'storno');
    }

    // Spalten-Konfiguration holen (falls verfügbar)
    const config = currentColumnsConfig.records;

    // Header-Definitionen (col-auto 100px, col-auto-l 200px) - neue einheitliche IDs
    const headerDefs = {
        // Basis-Felder
        name: { class: 'col-name text-left', label: 'Name' },
        firstName: { class: 'col-auto-l text-left', label: 'Vorname' },
        lastName: { class: 'col-auto-l text-left', label: 'Nachname' },
        recordType: { class: 'col-auto text-center', label: 'Typ' },
        recordStatus: { class: 'col-auto text-center', label: 'Status' },
        entryDate: { class: 'col-auto-l text-left', label: 'Aufnahmedatum' },
        yearlyAmount: { class: 'col-auto-l text-right', label: 'Jahresbeitrag' },
        customerId: { class: 'col-auto-l text-left', label: 'Kunde' },
        campaignAreaId: { class: 'col-auto-l text-left', label: 'Werbegebiet' },
        werberId: { class: 'col-auto-l text-left', label: 'Werber' },
        teamchefId: { class: 'col-auto-l text-left', label: 'Teamchef' },
        // Adresse
        street: { class: 'col-auto-l text-left', label: 'Straße' },
        houseNumber: { class: 'col-auto text-left', label: 'Hausnummer' },
        zipCode: { class: 'col-auto text-left', label: 'PLZ' },
        city: { class: 'col-auto-l text-left', label: 'Ort' },
        country: { class: 'col-auto-l text-left', label: 'Land' },
        // Kontakt
        email: { class: 'col-auto-l text-left', label: 'E-Mail' },
        phoneFixed: { class: 'col-auto-l text-left', label: 'Tel. Festnetz' },
        phoneMobile: { class: 'col-auto-l text-left', label: 'Tel. Mobil' },
        // Persönliche Daten
        salutation: { class: 'col-auto text-left', label: 'Anrede' },
        title: { class: 'col-auto text-left', label: 'Titel' },
        company: { class: 'col-auto-l text-left', label: 'Firma' },
        birthDate: { class: 'col-auto-l text-left', label: 'Geburtsdatum' },
        // Zahlungsdaten
        iban: { class: 'col-auto-l text-left', label: 'IBAN' },
        bic: { class: 'col-auto-l text-left', label: 'BIC' },
        bankName: { class: 'col-auto-l text-left', label: 'Bank' },
        accountHolder: { class: 'col-auto-l text-left', label: 'Kontoinhaber' },
        // Beiträge
        intervalAmount: { class: 'col-auto-l text-right', label: 'Betrag pro Intervall' },
        interval: { class: 'col-auto text-left', label: 'Buchungsintervall' },
        donationReceipt: { class: 'col-auto-l text-center', label: 'Spendenquittung' },
        // Erhöhungs-spezifisch
        memberNumber: { class: 'col-auto-l text-left', label: 'Mitgliedsnummer' },
        memberSince: { class: 'col-auto-l text-left', label: 'Mitglied seit' },
        oldYearlyAmount: { class: 'col-auto-l text-right', label: 'Alter Jahresbeitrag' },
        increaseAmount: { class: 'col-auto-l text-right', label: 'Erhöhungsbetrag' },
        // Sonstiges
        laterEntryDate: { class: 'col-auto-l text-left', label: 'Späteres Beitrittsdatum' },
        notes: { class: 'col-auto-l text-left', label: 'Anmerkungen' },
        stornoDate: { class: 'col-auto-l text-left', label: 'Storno-Datum' },
        stornoReason: { class: 'col-auto-l text-left', label: 'Storno-Grund' },
        // Opt-In
        contactEmailAllowed: { class: 'col-auto text-center', label: 'Kontakt per E-Mail' },
        contactPhoneAllowed: { class: 'col-auto text-center', label: 'Kontakt per Telefon' }
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
        // Intervall-Mapping für Anzeige
        const intervalLabels = { 'monthly': 'Monatlich', 'quarterly': 'Vierteljährlich', 'halfyearly': 'Halbjährlich', 'yearly': 'Jährlich' };

        // Betrag formatieren
        const formatAmount = (val) => val ? val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '';

        // Datum formatieren
        const formatDate = (val) => val ? new Date(val).toLocaleDateString('de-DE') : '';

        // Spalten-Daten mit Mapping (col-auto 100px, col-auto-l 200px) - neue einheitliche IDs
        const colData = {
            // Basis-Felder
            name: { class: 'col-name text-left', html: d.name },
            firstName: { class: 'col-auto-l text-left', html: d.firstName || '' },
            lastName: { class: 'col-auto-l text-left', html: d.lastName || '' },
            recordType: { class: 'col-auto text-center', html: `<span class="pill pill--${d.recordType === 'nmg' ? 'neumitglied' : 'erhoehung'}">${d.recordType === 'nmg' ? 'NMG' : 'ERH'}</span>` },
            recordStatus: { class: 'col-auto text-center', html: `<span class="pill pill--${d.recordStatus === 'aktiv' ? 'success' : d.recordStatus === 'storno' ? 'error' : 'inaktiv'}">${d.recordStatus}</span>` },
            entryDate: { class: 'col-auto-l text-left', html: d.entryDate },
            yearlyAmount: { class: 'col-auto-l text-right', html: d.yearlyAmount },
            customerId: { class: 'col-auto-l text-left', html: d.customerId || '' },
            campaignAreaId: { class: 'col-auto-l text-left', html: d.campaignAreaId || '' },
            werberId: { class: 'col-auto-l text-left', html: d.werberId || '' },
            teamchefId: { class: 'col-auto-l text-left', html: d.teamchefId || '' },
            // Adresse
            street: { class: 'col-auto-l text-left', html: d.street || '' },
            houseNumber: { class: 'col-auto text-left', html: d.houseNumber || '' },
            zipCode: { class: 'col-auto text-left', html: d.zipCode || '' },
            city: { class: 'col-auto-l text-left', html: d.city || '' },
            country: { class: 'col-auto-l text-left', html: d.country || '' },
            // Kontakt
            email: { class: 'col-auto-l text-left', html: d.email || '' },
            phoneFixed: { class: 'col-auto-l text-left', html: d.phoneFixed || '' },
            phoneMobile: { class: 'col-auto-l text-left', html: d.phoneMobile || '' },
            // Persönliche Daten
            salutation: { class: 'col-auto text-left', html: d.salutation || '' },
            title: { class: 'col-auto text-left', html: d.title || '' },
            company: { class: 'col-auto-l text-left', html: d.company || '' },
            birthDate: { class: 'col-auto-l text-left', html: d.birthDate || '' },
            // Zahlungsdaten
            iban: { class: 'col-auto-l text-left', html: d.iban || '' },
            bic: { class: 'col-auto-l text-left', html: d.bic || '' },
            bankName: { class: 'col-auto-l text-left', html: d.bankName || '' },
            accountHolder: { class: 'col-auto-l text-left', html: d.accountHolder || '' },
            // Beiträge
            intervalAmount: { class: 'col-auto-l text-right', html: formatAmount(d.intervalAmount) },
            interval: { class: 'col-auto text-left', html: intervalLabels[d.interval] || d.interval || '' },
            donationReceipt: { class: 'col-auto-l text-center', html: d.donationReceipt || '' },
            // Erhöhungs-spezifisch
            memberNumber: { class: 'col-auto-l text-left', html: d.memberNumber || '' },
            memberSince: { class: 'col-auto-l text-left', html: formatDate(d.memberSince) },
            oldYearlyAmount: { class: 'col-auto-l text-right', html: formatAmount(d.oldYearlyAmount) },
            increaseAmount: { class: 'col-auto-l text-right', html: formatAmount(d.increaseAmount) },
            // Sonstiges
            laterEntryDate: { class: 'col-auto-l text-left', html: formatDate(d.laterEntryDate) },
            notes: { class: 'col-auto-l text-left', html: d.notes || '' },
            stornoDate: { class: 'col-auto-l text-left', html: formatDate(d.stornoDate) },
            stornoReason: { class: 'col-auto-l text-left', html: d.stornoReason || '' },
            // Opt-In
            contactEmailAllowed: { class: 'col-auto text-center', html: d.contactEmailAllowed || '' },
            contactPhoneAllowed: { class: 'col-auto text-center', html: d.contactPhoneAllowed || '' }
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
        <tr data-id="${d.id}" data-typ="${d.recordType}">
            <td class="checkbox-cell">
                <input type="checkbox" class="row-checkbox" onchange="handleRowCheckbox(this, 'records', '${d.id}')">
            </td>
            <td class="action-cell">
                <div class="dropdown">
                    <button class="dropdown-btn" onclick="toggleDropdown(this, 'records', '${d.id}')">
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
                            Willkommensmail senden
                        </div>
                        <div class="dropdown-item" onclick="handleDropdownAction('pdf', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            PDF Download
                        </div>
                        <div class="dropdown-divider"></div>
                        ${d.recordStatus === 'storno' ? `
                        <div class="dropdown-item success" onclick="handleDropdownAction('unstorno', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Storno rückgängig
                        </div>
                        ` : `
                        <div class="dropdown-item warning" onclick="handleDropdownAction('storno', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                            Stornieren
                        </div>
                        `}
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
    if (currentFilter === 'all' || currentFilter === 'storno') {
        // Bei "Alle" und "Storno": Jahresbeitrag für NMG + Erhöhungsbetrag für ERH
        renderRecordsTotals(filtered, config, 'combined');
    } else if (currentFilter === 'erh') {
        // Bei Erhöhungen: nur Erhöhungsbetrag summieren
        renderRecordsTotals(filtered, config, 'increaseAmount');
    } else {
        // Bei NMG: nur Jahresbeitrag summieren
        renderRecordsTotals(filtered, config, 'yearlyAmountValue');
    }
}

/**
 * Generische Totals-Row Rendering Funktion
 * @param {string} tfootId - ID des tfoot-Elements
 * @param {Array} data - Die Daten für die Berechnung
 * @param {Array} config - Spalten-Konfiguration
 * @param {Object} columnDefs - Spalten-Definitionen mit CSS-Klassen
 * @param {Object} [options] - Zusätzliche Optionen
 * @param {string} [options.sumField='yearlyAmount'] - Feld für die Summenberechnung
 * @param {boolean} [options.showCheckbox=true] - Checkbox-Zelle anzeigen
 * @param {boolean} [options.showAction=true] - Action-Zelle anzeigen
 */
function renderTableTotals(tfootId, data, config, columnDefs, options = {}) {
    const tfoot = document.getElementById(tfootId);
    if (!tfoot) return;

    const sumField = options.sumField || 'yearlyAmount';
    const displayField = options.displayField || sumField; // Spalte in der die Summe angezeigt wird
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
                  key === displayField ? formattedTotal : ''
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

// Wrapper für Rückwärtskompatibilität (neue einheitliche IDs)
function renderRecordsTotals(filtered, config, sumField = 'yearlyAmountValue') {
    const columnDefs = {
        // Basis-Felder
        name: 'col-name text-left',
        firstName: 'col-auto-l text-left',
        lastName: 'col-auto-l text-left',
        recordType: 'col-auto text-center',
        recordStatus: 'col-auto text-center',
        entryDate: 'col-auto-l text-left',
        yearlyAmount: 'col-auto-l text-right',
        customerId: 'col-auto-l text-left',
        campaignAreaId: 'col-auto-l text-left',
        werberId: 'col-auto-l text-left',
        teamchefId: 'col-auto-l text-left',
        // Adresse
        street: 'col-auto-l text-left',
        houseNumber: 'col-auto text-left',
        zipCode: 'col-auto text-left',
        city: 'col-auto-l text-left',
        country: 'col-auto-l text-left',
        // Kontakt
        email: 'col-auto-l text-left',
        phoneFixed: 'col-auto-l text-left',
        phoneMobile: 'col-auto-l text-left',
        // Persönliche Daten
        salutation: 'col-auto text-left',
        title: 'col-auto text-left',
        company: 'col-auto-l text-left',
        birthDate: 'col-auto-l text-left',
        // Zahlungsdaten
        iban: 'col-auto-l text-left',
        bic: 'col-auto-l text-left',
        bankName: 'col-auto-l text-left',
        accountHolder: 'col-auto-l text-left',
        // Beiträge
        intervalAmount: 'col-auto-l text-right',
        interval: 'col-auto text-left',
        donationReceipt: 'col-auto-l text-center',
        // Erhöhungs-spezifisch
        memberNumber: 'col-auto-l text-left',
        memberSince: 'col-auto-l text-left',
        oldYearlyAmount: 'col-auto-l text-right',
        increaseAmount: 'col-auto-l text-right',
        // Sonstiges
        laterEntryDate: 'col-auto-l text-left',
        notes: 'col-auto-l text-left',
        stornoDate: 'col-auto-l text-left',
        stornoReason: 'col-auto-l text-left',
        // Opt-In
        contactEmailAllowed: 'col-auto text-center',
        contactPhoneAllowed: 'col-auto text-center'
    };

    // Combined-Modus: NMG Jahresbeitrag + ERH Erhöhungsbetrag
    if (sumField === 'combined') {
        renderTableTotalsCombined('recordsTableFoot', filtered, config, columnDefs);
    } else {
        // Bei Erhöhungen die Summe in der increaseAmount-Spalte anzeigen, sonst in yearlyAmount
        const displayField = sumField === 'increaseAmount' ? 'increaseAmount' : 'yearlyAmount';
        renderTableTotals('recordsTableFoot', filtered, config, columnDefs, { sumField: sumField, displayField: displayField });
    }
}

// Kombinierte Totals für "Alle"-Filter: NMG Jahresbeitrag + ERH Erhöhungsbetrag
function renderTableTotalsCombined(tfootId, data, config, columnDefs) {
    const tfoot = document.getElementById(tfootId);
    if (!tfoot) return;

    // NMG: Jahresbeitrag summieren
    const nmgData = data.filter(d => d.recordType === 'nmg');
    const nmgSum = nmgData.reduce((sum, d) => {
        const val = d.yearlyAmountValue;
        return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    // ERH: Erhöhungsbetrag summieren
    const erhData = data.filter(d => d.recordType === 'erh');
    const erhSum = erhData.reduce((sum, d) => {
        const val = d.increaseAmount;
        return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    const formatAmount = (val) => val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // Totals-Definitionen
    const totalsDefs = {};
    Object.keys(columnDefs).forEach(key => {
        totalsDefs[key] = {
            class: columnDefs[key].class || columnDefs[key],
            html: key === 'name' ? `Gesamt<span class="totals-count">(${data.length})</span>` :
                  key === 'yearlyAmount' ? formatAmount(nmgSum) :
                  key === 'increaseAmount' ? formatAmount(erhSum) : ''
        };
    });

    let totalsHtml = '<tr class="totals-row">';
    totalsHtml += '<td class="checkbox-cell"></td>';
    totalsHtml += '<td class="action-cell"></td>';

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

    // Header-Definitionen (col-auto 100px, col-auto-l 200px) - neue einheitliche IDs mit 28 Spalten
    const headerDefs = {
        // Basis-Felder
        name: { class: 'col-name text-left', label: 'Name' },
        firstName: { class: 'col-auto-l text-left', label: 'Vorname' },
        lastName: { class: 'col-auto-l text-left', label: 'Nachname' },
        memberNumber: { class: 'col-auto-l text-left', label: 'Mitgliedsnummer' },
        memberSince: { class: 'col-auto-l text-left', label: 'Mitglied seit' },
        yearlyAmount: { class: 'col-auto-l text-right', label: 'Jahresbeitrag' },
        oldYearlyAmount: { class: 'col-auto-l text-right', label: 'Alter Jahresbeitrag' },
        increaseAmount: { class: 'col-auto-l text-right', label: 'Erhöhungsbetrag' },
        intervalAmount: { class: 'col-auto-l text-right', label: 'Betrag pro Intervall' },
        interval: { class: 'col-auto text-left', label: 'Buchungsintervall' },
        customerId: { class: 'col-auto-l text-left', label: 'Kunde' },
        campaignAreaId: { class: 'col-auto-l text-left', label: 'Werbegebiet' },
        // Persönliche Daten
        salutation: { class: 'col-auto text-left', label: 'Anrede' },
        title: { class: 'col-auto text-left', label: 'Titel' },
        company: { class: 'col-auto-l text-left', label: 'Firma' },
        birthDate: { class: 'col-auto-l text-left', label: 'Geburtsdatum' },
        // Adresse
        street: { class: 'col-auto-l text-left', label: 'Straße' },
        houseNumber: { class: 'col-auto text-left', label: 'Hausnummer' },
        zipCode: { class: 'col-auto text-left', label: 'PLZ' },
        city: { class: 'col-auto-l text-left', label: 'Ort' },
        country: { class: 'col-auto-l text-left', label: 'Land' },
        // Kontakt
        email: { class: 'col-auto-l text-left', label: 'E-Mail' },
        phoneFixed: { class: 'col-auto-l text-left', label: 'Tel. Festnetz' },
        phoneMobile: { class: 'col-auto-l text-left', label: 'Tel. Mobil' },
        // Zahlungsdaten
        iban: { class: 'col-auto-l text-left', label: 'IBAN' },
        bic: { class: 'col-auto-l text-left', label: 'BIC' },
        bankName: { class: 'col-auto-l text-left', label: 'Bank' },
        accountHolder: { class: 'col-auto-l text-left', label: 'Kontoinhaber' },
        // Status
        recordStatus: { class: 'col-auto text-center', label: 'Status' }
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
        // Intervall-Mapping für Anzeige
        const intervalLabels = { 'monthly': 'Monatlich', 'quarterly': 'Vierteljährlich', 'halfyearly': 'Halbjährlich', 'yearly': 'Jährlich' };

        // Betrag formatieren
        const formatAmount = (val) => val ? val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '';

        // Spalten-Daten mit Mapping (col-auto 100px, col-auto-l 200px) - neue einheitliche IDs mit 28 Spalten
        const colData = {
            // Basis-Felder
            name: { class: 'col-name text-left', html: d.name },
            firstName: { class: 'col-auto-l text-left', html: d.firstName || '' },
            lastName: { class: 'col-auto-l text-left', html: d.lastName || '' },
            memberNumber: { class: 'col-auto-l text-left', html: d.memberNumber || '' },
            memberSince: { class: 'col-auto-l text-left', html: d.memberSince || '' },
            yearlyAmount: { class: 'col-auto-l text-right', html: d.yearlyAmount || '' },
            oldYearlyAmount: { class: 'col-auto-l text-right', html: formatAmount(d.oldYearlyAmountValue) },
            increaseAmount: { class: 'col-auto-l text-right', html: formatAmount(d.increaseAmountValue) },
            intervalAmount: { class: 'col-auto-l text-right', html: formatAmount(d.intervalAmountValue) },
            interval: { class: 'col-auto text-left', html: intervalLabels[d.interval] || d.interval || '' },
            customerId: { class: 'col-auto-l text-left', html: d.customerId || '' },
            campaignAreaId: { class: 'col-auto-l text-left', html: d.campaignAreaId || '' },
            // Persönliche Daten
            salutation: { class: 'col-auto text-left', html: d.salutation || '' },
            title: { class: 'col-auto text-left', html: d.title || '' },
            company: { class: 'col-auto-l text-left', html: d.company || '' },
            birthDate: { class: 'col-auto-l text-left', html: d.birthDate || '' },
            // Adresse
            street: { class: 'col-auto-l text-left', html: d.street || '' },
            houseNumber: { class: 'col-auto text-left', html: d.houseNumber || '' },
            zipCode: { class: 'col-auto text-left', html: d.zipCode || '' },
            city: { class: 'col-auto-l text-left', html: d.city || '' },
            country: { class: 'col-auto-l text-left', html: d.country || '' },
            // Kontakt
            email: { class: 'col-auto-l text-left', html: d.email || '' },
            phoneFixed: { class: 'col-auto-l text-left', html: d.phoneFixed || '' },
            phoneMobile: { class: 'col-auto-l text-left', html: d.phoneMobile || '' },
            // Zahlungsdaten
            iban: { class: 'col-auto-l text-left', html: d.iban || '' },
            bic: { class: 'col-auto-l text-left', html: d.bic || '' },
            bankName: { class: 'col-auto-l text-left', html: d.bankName || '' },
            accountHolder: { class: 'col-auto-l text-left', html: d.accountHolder || '' },
            // Status
            recordStatus: { class: 'col-auto text-center', html: `<span class="pill pill--${d.recordStatus === 'aktiv' ? 'success' : d.recordStatus === 'storno' ? 'error' : 'inaktiv'}">${d.recordStatus}</span>` }
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
                <input type="checkbox" class="row-checkbox" onchange="handleRowCheckbox(this, 'bestand', '${d.id}')">
            </td>
            <td class="action-cell">
                <div class="dropdown">
                    <button class="dropdown-btn" onclick="toggleDropdown(this, 'bestand', '${d.id}')">
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
                        ${d.recordStatus === 'storno' ? `
                        <div class="dropdown-item success" onclick="handleDropdownAction('unstorno', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Storno rückgängig
                        </div>
                        ` : `
                        <div class="dropdown-item warning" onclick="handleDropdownAction('storno', this.parentElement)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                            Stornieren
                        </div>
                        `}
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
        // Basis-Felder
        name: 'col-name text-left', firstName: 'col-auto-l text-left', lastName: 'col-auto-l text-left',
        memberNumber: 'col-auto-l text-left', memberSince: 'col-auto-l text-left', yearlyAmount: 'col-auto-l text-right',
        intervalAmount: 'col-auto-l text-right', interval: 'col-auto text-left', customerId: 'col-auto-l text-left', campaignAreaId: 'col-auto-l text-left',
        // Persönliche Daten
        salutation: 'col-auto text-left', title: 'col-auto text-left', company: 'col-auto-l text-left', birthDate: 'col-auto-l text-left',
        // Adresse
        street: 'col-auto-l text-left', houseNumber: 'col-auto text-left', zipCode: 'col-auto text-left',
        city: 'col-auto-l text-left', country: 'col-auto-l text-left',
        // Kontakt
        email: 'col-auto-l text-left', phoneFixed: 'col-auto-l text-left', phoneMobile: 'col-auto-l text-left',
        // Zahlungsdaten
        iban: 'col-auto-l text-left', bic: 'col-auto-l text-left', bankName: 'col-auto-l text-left', accountHolder: 'col-auto-l text-left',
        // Erhöhung
        oldYearlyAmount: 'col-auto-l text-right', increaseAmount: 'col-auto-l text-right',
        // Status
        recordStatus: 'col-auto text-center'
    };
    renderTableTotals('bestandTableFoot', bestandData, config, columnDefs, { sumField: 'yearlyAmount' });
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

    const showBestand = (type === 'kunde' || type === 'werbegebiet' || type === 'gebiet' || type === 'customer_area' || type === 'alle');
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
    const nameEl = document.getElementById('editModalName');
    if (nameEl) nameEl.textContent = record.name || `${record.firstName} ${record.lastName}`;

    // Typ-Badge
    const typeBadge = document.getElementById('editModalTypeBadge');
    if (typeBadge) {
        if (type === 'records') {
            typeBadge.textContent = record.recordType === 'nmg' ? 'NMG' : 'ERH';
            typeBadge.className = `pill pill--${record.recordType === 'nmg' ? 'neumitglied' : 'erhoehung'}`;
        } else {
            typeBadge.textContent = 'BESTAND';
            typeBadge.className = 'pill pill--bestand';
        }
    }

    // Datum
    const dateText = type === 'records' ? `Erstellt am ${record.entryDate}` : `Mitglied seit ${record.memberSince}`;
    const dateEl = document.getElementById('editModalDate');
    if (dateEl) dateEl.textContent = dateText;

    // === Persönliche Daten ===
    const anredeEl = document.getElementById('editAnrede');
    if (anredeEl) anredeEl.value = record.salutation || '';

    const titelEl = document.getElementById('editTitel');
    if (titelEl) titelEl.value = record.title || '';

    const vornameEl = document.getElementById('editVorname');
    if (vornameEl) vornameEl.value = record.firstName || '';

    const nachnameEl = document.getElementById('editNachname');
    if (nachnameEl) nachnameEl.value = record.lastName || '';

    // Geburtsdatum (von DD.MM.YYYY zu YYYY-MM-DD für Input)
    const geburtsdatumEl = document.getElementById('editGeburtsdatum');
    if (geburtsdatumEl) {
        if (record.birthDate) {
            const parts = record.birthDate.split('.');
            if (parts.length === 3) {
                geburtsdatumEl.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
                geburtsdatumEl.value = '';
            }
        } else {
            geburtsdatumEl.value = '';
        }
    }

    const emailEl = document.getElementById('editEmail');
    if (emailEl) emailEl.value = record.email || '';

    const telefonMobilEl = document.getElementById('editTelefonMobil');
    if (telefonMobilEl) telefonMobilEl.value = record.phoneMobile || '';

    const telefonFestnetzEl = document.getElementById('editTelefonFestnetz');
    if (telefonFestnetzEl) telefonFestnetzEl.value = record.phoneFixed || '';

    // === Adresse ===
    initAddressAutocomplete({
        streetId: 'editStrasse',
        resultsId: 'editStrasseAutocomplete',
        houseNumberId: 'editHausnummer',
        postalCodeId: 'editPLZ',
        cityId: 'editOrt'
    });

    const strasseEl = document.getElementById('editStrasse');
    if (strasseEl) strasseEl.value = record.street || '';

    const hausnummerEl = document.getElementById('editHausnummer');
    if (hausnummerEl) hausnummerEl.value = record.houseNumber || '';

    const plzEl = document.getElementById('editPLZ');
    if (plzEl) plzEl.value = record.zipCode || '';

    const ortEl = document.getElementById('editOrt');
    if (ortEl) ortEl.value = record.city || '';

    // === Beitrag & Zahlung ===
    const beitragEl = document.getElementById('editBeitrag');
    if (beitragEl) beitragEl.value = record.intervalAmount || record.intervalAmountValue || '';

    const intervallEl = document.getElementById('editIntervall');
    if (intervallEl) {
        // Intervall-Mapping (alle Varianten auf englisch)
        const intervalMap = {
            'monatlich': 'monthly',
            'monthly': 'monthly',
            'vierteljährlich': 'quarterly',
            'vierteljaehrlich': 'quarterly',
            'quarterly': 'quarterly',
            'halbjährlich': 'halfyearly',
            'halbjaehrlich': 'halfyearly',
            'half-yearly': 'halfyearly',
            'halfyearly': 'halfyearly',
            'jährlich': 'yearly',
            'jaehrlich': 'yearly',
            'yearly': 'yearly'
        };
        intervallEl.value = intervalMap[record.interval?.toLowerCase()] || 'monthly';
    }

    const jeEl = document.getElementById('editJE');
    if (jeEl) jeEl.value = record.yearlyAmount || '';

    const ibanEl = document.getElementById('editIBAN');
    if (ibanEl) ibanEl.value = record.iban || '';

    const bicEl = document.getElementById('editBIC');
    if (bicEl) bicEl.value = record.bic || '';

    const kontoinhaberEl = document.getElementById('editKontoinhaber');
    if (kontoinhaberEl) kontoinhaberEl.value = record.accountHolder || '';

    // === Zuordnung ===
    const gebietEl = document.getElementById('editGebiet');
    if (gebietEl) gebietEl.value = record.campaignAreaId || '';

    const werberEl = document.getElementById('editWerber');
    if (werberEl) werberEl.value = record.werberId || '';

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
    const { type, id } = editContext;
    if (!type || !id) {
        showToast('Fehler: Kein Datensatz ausgewählt', 'error');
        return;
    }

    // Supabase-Client holen
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) {
        showToast('Fehler: Keine Datenbankverbindung', 'error');
        return;
    }

    // Formular-Daten sammeln
    const formData = {
        salutation: document.getElementById('editAnrede')?.value || '',
        title: document.getElementById('editTitel')?.value || '',
        first_name: document.getElementById('editVorname')?.value || '',
        last_name: document.getElementById('editNachname')?.value || '',
        birth_date: document.getElementById('editGeburtsdatum')?.value || null,
        email: document.getElementById('editEmail')?.value || '',
        phone_mobile: document.getElementById('editTelefonMobil')?.value || '',
        phone_fixed: document.getElementById('editTelefonFestnetz')?.value || '',
        street: document.getElementById('editStrasse')?.value || '',
        house_number: document.getElementById('editHausnummer')?.value || '',
        zip_code: document.getElementById('editPLZ')?.value || '',
        city: document.getElementById('editOrt')?.value || '',
        iban: document.getElementById('editIBAN')?.value || '',
        bic: document.getElementById('editBIC')?.value || '',
        account_holder: document.getElementById('editKontoinhaber')?.value || ''
    };

    // Beitrag und Intervall
    const beitrag = parseFloat(document.getElementById('editBeitrag')?.value) || 0;
    const intervall = document.getElementById('editIntervall')?.value || 'monthly';

    // Intervall-Multiplikator für Jahresbeitrag
    const intervallMultiplier = {
        'monthly': 12,
        'quarterly': 4,
        'halfyearly': 2,
        'yearly': 1
    };
    const yearlyAmount = beitrag * (intervallMultiplier[intervall] || 12);

    try {
        if (type === 'records') {
            // Records-Tabelle aktualisieren
            // Aktueller Record für data-Objekt holen
            const currentRecord = recordsData.find(r => r.id === id);
            const existingData = currentRecord?._raw?.data || {};

            const updateData = {
                salutation: formData.salutation,
                title: formData.title,
                first_name: formData.first_name,
                last_name: formData.last_name,
                birth_date: formData.birth_date,
                email: formData.email,
                phone_mobile: formData.phone_mobile,
                phone_fixed: formData.phone_fixed,
                street: formData.street,
                house_number: formData.house_number,
                zip_code: formData.zip_code,
                city: formData.city,
                iban: formData.iban,
                bic: formData.bic,
                account_holder: formData.account_holder,
                amount: beitrag,
                interval: intervall,
                yearly_amount: yearlyAmount,
                // data-Objekt aktualisieren
                data: {
                    ...existingData,
                    salutation: formData.salutation,
                    title: formData.title,
                    firstName: formData.first_name,
                    lastName: formData.last_name,
                    birthDate: formData.birth_date,
                    email: formData.email,
                    phoneMobile: formData.phone_mobile,
                    phoneFixed: formData.phone_fixed,
                    street: formData.street,
                    houseNumber: formData.house_number,
                    zipCode: formData.zip_code,
                    city: formData.city,
                    iban: formData.iban,
                    bic: formData.bic,
                    accountHolder: formData.account_holder,
                    amount: beitrag,
                    interval: intervall,
                    yearlyAmount: yearlyAmount
                }
            };

            const { error } = await supabase
                .from('records')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

        } else if (type === 'bestand') {
            // Bestandsmitglieder-Tabelle aktualisieren
            const updateData = {
                salutation: formData.salutation,
                title: formData.title,
                first_name: formData.first_name,
                last_name: formData.last_name,
                birth_date: formData.birth_date,
                email: formData.email,
                phone_mobile: formData.phone_mobile,
                phone_fixed: formData.phone_fixed,
                street: formData.street,
                house_number: formData.house_number,
                zip_code: formData.zip_code,
                city: formData.city,
                iban: formData.iban,
                bic: formData.bic,
                account_holder: formData.account_holder,
                interval_amount: beitrag,
                old_interval: intervall,
                old_amount: yearlyAmount
            };

            const { error } = await supabase
                .from('bestandsmitglieder')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        }

        closeEditModal();
        showToast('Änderungen wurden gespeichert', 'success');

        // Daten neu laden und Tabellen rendern
        if (typeof loadAllData === 'function') {
            await loadAllData();
        }
        if (typeof renderRecordsTable === 'function') renderRecordsTable();
        if (typeof renderBestandTable === 'function') renderBestandTable();

    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showToast('Fehler beim Speichern: ' + error.message, 'error');
    }
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

    // Auto-Scroll Event-Listener auf der Liste registrieren
    list.ondragover = handleColumnsListDragOver;
}

// Auto-Scroll Variablen
let dragScrollInterval = null;
const SCROLL_ZONE = 300; // Pixel vom Rand
const SCROLL_SPEED = 8; // Scroll-Geschwindigkeit

// Auto-Scroll Funktion (wird auf columnsList aufgerufen)
function handleColumnsListDragOver(e) {
    e.preventDefault();

    const columnsList = e.currentTarget;
    // Scroll-Container ist der Parent (page-content--modal)
    const scrollContainer = columnsList.closest('.page-content--modal') || columnsList;
    const rect = scrollContainer.getBoundingClientRect();
    const mouseY = e.clientY;
    const containerHeight = rect.height;

    // Position relativ zum Container (0 = oben, 1 = unten)
    const relativeY = (mouseY - rect.top) / containerHeight;

    // Stoppe vorherigen Scroll-Interval
    if (dragScrollInterval) {
        clearInterval(dragScrollInterval);
        dragScrollInterval = null;
    }

    // Obere 30% = nach oben scrollen
    if (relativeY < 0.3 && scrollContainer.scrollTop > 0) {
        // Je näher am Rand, desto schneller
        const speed = SCROLL_SPEED * (1 - relativeY / 0.3);
        dragScrollInterval = setInterval(() => {
            scrollContainer.scrollTop -= speed;
        }, 16);
    }
    // Untere 30% = nach unten scrollen
    else if (relativeY > 0.7 && scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight) {
        // Je näher am Rand, desto schneller
        const speed = SCROLL_SPEED * ((relativeY - 0.7) / 0.3);
        dragScrollInterval = setInterval(() => {
            scrollContainer.scrollTop += speed;
        }, 16);
    }
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
    // Auto-Scroll stoppen
    if (dragScrollInterval) {
        clearInterval(dragScrollInterval);
        dragScrollInterval = null;
    }
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

function selectAllColumns() {
    // Alle Spalten sichtbar machen
    tempColumnsConfig.forEach(col => {
        col.visible = true;
    });
    renderColumnsList();
}

function deselectAllColumns() {
    // Alle Spalten ausblenden (außer required)
    tempColumnsConfig.forEach(col => {
        if (!col.required) {
            col.visible = false;
        }
    });
    renderColumnsList();
}

function saveColumns() {
    const type = columnsContext.type;

    // Konfiguration speichern
    currentColumnsConfig[type] = JSON.parse(JSON.stringify(tempColumnsConfig));

    // In Supabase speichern
    saveCurrentColumnsToStorage(type);

    // Tabelle aktualisieren
    if (type === 'records') {
        renderRecordsTable();
    } else {
        renderBestandTable();
    }

    closeColumnsModal();
    showToast('Spalten-Konfiguration gespeichert', 'success');
}

// Aktuelle Spalten-Konfiguration in Supabase speichern
async function saveCurrentColumnsToStorage(type) {
    const supabase = getSupabaseClient();

    // Immer auch in localStorage speichern (Backup)
    localStorage.setItem(`currentColumns_${type}`, JSON.stringify(currentColumnsConfig[type]));

    if (!supabase || !currentUserId) return;

    const settingKey = `currentColumns_${type}`;

    try {
        // Prüfen ob Eintrag existiert
        const { data: existing } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('setting_key', settingKey)
            .single();

        if (existing) {
            // Update
            const { error } = await supabase
                .from('user_settings')
                .update({
                    setting_value: currentColumnsConfig[type],
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase
                .from('user_settings')
                .insert({
                    user_id: currentUserId,
                    setting_key: settingKey,
                    setting_value: currentColumnsConfig[type]
                });

            if (error) throw error;
        }
    } catch (err) {
        console.warn('Fehler beim Speichern der Spalten-Konfiguration in Supabase:', err);
    }
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

// Vorlagen - werden aus Supabase geladen (Fallback: localStorage)
let columnTemplates = {
    records: [],
    bestand: []
};

// Aktueller User für Supabase-Speicherung
let currentUserId = null;

// Supabase-Client holen (von Parent-Frame oder global)
function getSupabaseClient() {
    return window.supabase || (window.parent && window.parent.supabaseClient) || null;
}

// Vorlagen und aktuelle Spalten-Konfiguration aus Supabase laden
async function loadTemplatesFromSupabase() {
    const supabase = getSupabaseClient();
    if (!supabase || !currentUserId) {
        // Fallback: localStorage
        columnTemplates.records = JSON.parse(localStorage.getItem('columnTemplates_records') || '[]');
        columnTemplates.bestand = JSON.parse(localStorage.getItem('columnTemplates_bestand') || '[]');
        loadCurrentColumnsFromLocalStorage();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('setting_key, setting_value')
            .eq('user_id', currentUserId)
            .in('setting_key', [
                'columnTemplates_records',
                'columnTemplates_bestand',
                'currentColumns_records',
                'currentColumns_bestand'
            ]);

        if (error) throw error;

        // Daten zuweisen
        data?.forEach(row => {
            if (row.setting_key === 'columnTemplates_records') {
                columnTemplates.records = row.setting_value || [];
            } else if (row.setting_key === 'columnTemplates_bestand') {
                columnTemplates.bestand = row.setting_value || [];
            } else if (row.setting_key === 'currentColumns_records' && row.setting_value) {
                currentColumnsConfig.records = row.setting_value;
            } else if (row.setting_key === 'currentColumns_bestand' && row.setting_value) {
                currentColumnsConfig.bestand = row.setting_value;
            }
        });

        // Labels aus columnDefinitions synchronisieren (für Updates)
        syncColumnLabels();
    } catch (err) {
        console.warn('Fehler beim Laden der Einstellungen aus Supabase, nutze localStorage:', err);
        columnTemplates.records = JSON.parse(localStorage.getItem('columnTemplates_records') || '[]');
        columnTemplates.bestand = JSON.parse(localStorage.getItem('columnTemplates_bestand') || '[]');
        loadCurrentColumnsFromLocalStorage();
    }
}

// Fallback: Aktuelle Spalten-Konfiguration aus localStorage laden
function loadCurrentColumnsFromLocalStorage() {
    const recordsConfig = localStorage.getItem('currentColumns_records');
    const bestandConfig = localStorage.getItem('currentColumns_bestand');

    if (recordsConfig) {
        try {
            currentColumnsConfig.records = JSON.parse(recordsConfig);
        } catch (e) {}
    }
    if (bestandConfig) {
        try {
            currentColumnsConfig.bestand = JSON.parse(bestandConfig);
        } catch (e) {}
    }

    // Labels aus columnDefinitions synchronisieren (für Updates)
    syncColumnLabels();
}

// Labels aus columnDefinitions in currentColumnsConfig synchronisieren
function syncColumnLabels() {
    ['records', 'bestand'].forEach(type => {
        const definitions = columnDefinitions[type];
        if (!definitions || !currentColumnsConfig[type]) return;

        currentColumnsConfig[type].forEach(col => {
            const def = definitions.find(d => d.id === col.id);
            if (def) {
                col.label = def.label;
            }
        });
    });
}

// Vorlagen in Supabase speichern
async function saveTemplatesToStorage(type) {
    const supabase = getSupabaseClient();

    // Immer auch in localStorage speichern (Backup)
    localStorage.setItem(`columnTemplates_${type}`, JSON.stringify(columnTemplates[type]));

    if (!supabase || !currentUserId) return;

    try {
        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: currentUserId,
                setting_key: `columnTemplates_${type}`,
                setting_value: columnTemplates[type]
            }, {
                onConflict: 'user_id,setting_key'
            });

        if (error) throw error;
    } catch (err) {
        console.warn('Fehler beim Speichern der Vorlagen in Supabase:', err);
    }
}

// User-ID setzen und Vorlagen laden
async function initColumnTemplates(userId) {
    currentUserId = userId;
    window.currentUserId = userId; // Für iFrame-Zugriff
    await loadTemplatesFromSupabase();
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
                        <div class="template-item-name text-klein--fett">${tpl.name}</div>
                        <div class="template-item-count text-klein">${visibleCount} Spalten</div>
                    </div>
                    <button class="btn btn-icon" onclick="event.stopPropagation(); editTemplate(${index})" title="Bearbeiten">
                        <span class="icon icon--bearbeiten"></span>
                    </button>
                    <button class="btn btn-icon" onclick="event.stopPropagation(); deleteTemplate(${index})" title="Löschen">
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
        const savedConfig = JSON.parse(JSON.stringify(template.config));
        const definitions = columnDefinitions[type];

        // Neue Spalten ergänzen, die in der gespeicherten Vorlage fehlen
        const savedIds = savedConfig.map(col => col.id);
        definitions.forEach((defCol, defIndex) => {
            if (!savedIds.includes(defCol.id)) {
                // Neue Spalte an der richtigen Position einfügen (standardmäßig ausgeblendet)
                const newCol = { ...defCol, visible: false };
                // Position: nach der vorherigen Definition-Spalte oder am Ende
                let insertIndex = savedConfig.length;
                for (let i = defIndex - 1; i >= 0; i--) {
                    const prevId = definitions[i].id;
                    const prevIndex = savedConfig.findIndex(c => c.id === prevId);
                    if (prevIndex !== -1) {
                        insertIndex = prevIndex + 1;
                        break;
                    }
                }
                savedConfig.splice(insertIndex, 0, newCol);
            }
        });

        tempColumnsConfig = savedConfig;
        renderColumnsList();
    }
}

// Kontext für Template-Bearbeitung
let editingTemplateIndex = null;

function editTemplate(index) {
    const type = columnsContext.type;
    const template = columnTemplates[type][index];
    if (!template) return;

    editingTemplateIndex = index;

    // Modal erstellen falls nicht vorhanden
    if (!document.getElementById('templateEditModal')) {
        if (typeof ModalTemplates !== 'undefined' && ModalTemplates.templates.templateEdit) {
            document.body.insertAdjacentHTML('beforeend', ModalTemplates.templates.templateEdit());
        }
    }

    // Name setzen
    const nameInput = document.getElementById('templateEditName');
    if (nameInput) {
        nameInput.value = template.name;
    }

    // Modal öffnen
    const modal = document.getElementById('templateEditModal');
    if (modal) {
        modal.classList.add('active');
        // Focus auf Input
        setTimeout(() => nameInput?.focus(), 100);
    }
}

function closeTemplateEditModal() {
    const modal = document.getElementById('templateEditModal');
    if (modal) modal.classList.remove('active');
    editingTemplateIndex = null;
}

function saveTemplateEdit() {
    if (editingTemplateIndex === null) return;

    const type = columnsContext.type;
    const nameInput = document.getElementById('templateEditName');
    const newName = nameInput?.value?.trim();

    if (!newName) {
        showToast('Name darf nicht leer sein', 'error');
        return;
    }

    // Vorlage mit aktueller Konfiguration und neuem Namen aktualisieren
    columnTemplates[type][editingTemplateIndex] = {
        name: newName,
        config: JSON.parse(JSON.stringify(tempColumnsConfig))
    };

    saveTemplatesToStorage(type);
    closeTemplateEditModal();
    renderTemplatesList();
    showToast(`Vorlage "${newName}" aktualisiert`, 'success');
}

async function deleteTemplate(index) {
    const type = columnsContext.type;
    const template = columnTemplates[type][index];
    const templateName = template?.name || 'diese Vorlage';

    const confirmed = await showConfirm(
        'Vorlage löschen',
        `Möchten Sie "${templateName}" wirklich löschen?`,
        'warning',
        { danger: true, confirmText: 'Löschen' }
    );

    if (!confirmed) return;

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
        editModal.addEventListener('mousedown', function(e) {
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
    window.selectAllColumns = selectAllColumns;
    window.deselectAllColumns = deselectAllColumns;
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
    window.editTemplate = editTemplate;
    window.closeTemplateEditModal = closeTemplateEditModal;
    window.saveTemplateEdit = saveTemplateEdit;
    window.deleteTemplate = deleteTemplate;
    window.renderRecordsTable = renderRecordsTable;
    window.renderBestandTable = renderBestandTable;
}

// Immer verfügbare Funktionen (auf allen Seiten nutzbar)
window.TableCheckbox = TableCheckbox;
window.initDatensaetze = initDatensaetze;
window.initColumnTemplates = initColumnTemplates;
window.loadTemplatesFromSupabase = loadTemplatesFromSupabase;
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
 * @param {Object} [options] - Optionale Einstellungen
 * @param {boolean} [options.persistInUrl=true] - Tab-Zustand in URL speichern (für Reload)
 */
function initTabs(tabSelector, contentSelector, contentIdPrefix = 'tab-', options = {}) {
    const { persistInUrl = true } = options;

    // Bei Seitenload: Tab aus URL-Hash wiederherstellen (nur für Hauptseiten, nicht Modals)
    if (persistInUrl) {
        const hash = window.location.hash.substring(1); // z.B. "bestand"
        if (hash) {
            const targetTab = document.querySelector(`${tabSelector}[data-tab="${hash}"]`);
            if (targetTab && !targetTab.closest('.modal')) {
                // Alle Tabs/Contents deaktivieren
                document.querySelectorAll(tabSelector).forEach(t => {
                    if (!t.closest('.modal')) t.classList.remove('active');
                });
                document.querySelectorAll(contentSelector).forEach(c => {
                    if (!c.closest('.modal')) c.classList.remove('active');
                });
                // Ziel-Tab aktivieren
                targetTab.classList.add('active');
                const content = document.getElementById(contentIdPrefix + hash);
                if (content) content.classList.add('active');
            }
        }
    }

    document.querySelectorAll(tabSelector).forEach(tab => {
        tab.addEventListener('click', function() {
            // Bereits aktiver Tab - nichts tun (verhindert Flackern)
            if (this.classList.contains('active')) return;

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

            // Tab in URL-Hash speichern (nur wenn nicht in Modal)
            if (persistInUrl && !this.closest('.modal')) {
                const tabValue = this.dataset.tab;
                // URL-Hash setzen ohne Scroll
                history.replaceState(null, '', '#' + tabValue);
            }
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
        let mouseDownOnBackdrop = false;

        modal.addEventListener('mousedown', function(e) {
            mouseDownOnBackdrop = (e.target === this);
        });

        modal.addEventListener('mouseup', function(e) {
            if (mouseDownOnBackdrop && e.target === this) {
                if (closeFunction) {
                    closeFunction();
                } else {
                    closeModalById(modalId);
                }
            }
            mouseDownOnBackdrop = false;
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

    // Bestehendes Chart zerstören falls vorhanden
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

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
                            const totalEH = (Math.round(totalJE / 12 * 100) / 100).toFixed(2);
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

// ============================================================================
// BOTSCHAFTER ABRECHNUNGS-MODUL
// ============================================================================

/**
 * Berechnet Einheiten aus Jahresbeitrag
 * @param {number} jahresbeitrag - Jahresbeitrag in EUR
 * @returns {number} Einheiten (JE / 12)
 */
function berechneEinheiten(jahresbeitrag) {
    return jahresbeitrag / 12;
}

/**
 * Berechnet die Brutto-Provision
 * @param {number} einheiten - Anzahl Einheiten
 * @param {number} faktor - Karrierestufen-Faktor (5.0 - 8.0)
 * @returns {number} Brutto-Provision in EUR
 */
function berechneBruttoProvision(einheiten, faktor) {
    return Math.round(einheiten * faktor * 100) / 100;
}

/**
 * Berechnet Vorschuss und Stornorücklage
 * @param {number} brutto - Brutto-Provision
 * @param {number} vorschussAnteil - Prozent für Vorschuss (default 75)
 * @returns {object} { vorschuss, stornorucklage }
 */
function berechneAufteilung(brutto, vorschussAnteil = 75) {
    const vorschuss = brutto * (vorschussAnteil / 100);
    const stornorucklage = brutto - vorschuss;
    return {
        vorschuss: Math.round(vorschuss * 100) / 100,
        stornorucklage: Math.round(stornorucklage * 100) / 100
    };
}

/**
 * Berechnet Netto-Auszahlung nach Abzügen
 * @param {number} vorschuss - Vorschuss-Betrag
 * @param {number} abzuegeUnterkunft - Unterkunftskosten
 * @param {number} abzuegeSonderposten - Sonderposten
 * @returns {number} Netto-Auszahlung
 */
function berechneNetto(vorschuss, abzuegeUnterkunft = 0, abzuegeSonderposten = 0) {
    return Math.round((vorschuss - abzuegeUnterkunft - abzuegeSonderposten) * 100) / 100;
}

/**
 * Berechnet den Montag einer gegebenen Kalenderwoche (ISO 8601)
 * @param {number} kw - Kalenderwoche (1-53)
 * @param {number} year - Jahr
 * @returns {Date} Montag der KW
 */
function getMontagDerKW(kw, year) {
    // ISO 8601: KW 1 ist die Woche mit dem ersten Donnerstag des Jahres
    const jan4 = new Date(year, 0, 4); // 4. Januar ist immer in KW 1
    const dayOfWeek = jan4.getDay() || 7; // Sonntag = 7 statt 0
    const montagKW1 = new Date(jan4);
    montagKW1.setDate(jan4.getDate() - dayOfWeek + 1); // Zurück zum Montag

    // Montag der gewünschten KW berechnen
    const montag = new Date(montagKW1);
    montag.setDate(montagKW1.getDate() + (kw - 1) * 7);
    montag.setHours(0, 0, 0, 0);

    return montag;
}

/**
 * Berechnet Anwesenheitskosten pro Woche basierend auf Anwesenheitstagen
 * @param {number} anwesenheitstage - Anzahl der Anwesenheitstage in der Woche (0-7)
 * @param {boolean} istPlatinumPrime - Ob der User Platinum Prime Mitglied ist
 * @returns {number} Wochenkosten in EUR
 */
function berechneAnwesenheitskosten(anwesenheitstage, istPlatinumPrime = false) {
    if (anwesenheitstage >= 4) {
        return istPlatinumPrime ? 175 : 200;
    }
    return anwesenheitstage * 30;
}

/**
 * Erstellt Anwesenheitsabzüge für einen User basierend auf campaign_attendance
 * @param {string} userId - User UUID
 * @param {number} kw - Kalenderwoche
 * @param {number} year - Jahr
 * @returns {Promise<object|null>} Erstellter Abzug oder null
 */
// Lock-Map um Race Conditions zu verhindern
const anwesenheitsAbzugLocks = new Map();

async function erstelleAnwesenheitsAbzug(userId, campaignId, kw, year) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) return null;

    // Lock-Key für diese Kombination
    const lockKey = `${userId}-${campaignId}-${kw}-${year}`;

    // Warten falls bereits ein Aufruf läuft
    while (anwesenheitsAbzugLocks.has(lockKey)) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Lock setzen
    anwesenheitsAbzugLocks.set(lockKey, true);

    try {
        // Anwesenheit NUR für diese Kampagne laden
        const { data: attendance, error: attError } = await supabase
            .from('campaign_attendance')
            .select('day_0, day_1, day_2, day_3, day_4, day_5, day_6, keine_unterkunft')
            .eq('user_id', userId)
            .eq('campaign_id', campaignId)
            .eq('kw', kw)
            .single();

        // Anwesenheitstage zählen
        let totalDays = 0;
        if (attendance && !attError) {
            const days = [attendance.day_0, attendance.day_1, attendance.day_2,
                         attendance.day_3, attendance.day_4, attendance.day_5, attendance.day_6];
            totalDays = days.filter(d => d === true).length;
        }

        const kwStart = getMontagDerKW(kw, year);

        // Prüfen ob bereits ein Eintrag für diese Kampagne/KW existiert (ALLE finden, nicht nur einen)
        const { data: existingEntries } = await supabase
            .from('euro_ledger')
            .select('id, betrag, invoice_id_vorschuss')
            .eq('user_id', userId)
            .eq('campaign_id', campaignId)
            .eq('kategorie', 'unterkunft')
            .eq('kw', kw)
            .eq('year', year)
            .eq('typ', 'abzug');

        // Ersten Eintrag als "existing" verwenden
        const existing = existingEntries && existingEntries.length > 0 ? existingEntries[0] : null;

        // Duplikate warnen und ignorieren
        if (existingEntries && existingEntries.length > 1) {
            console.warn(`WARNUNG: ${existingEntries.length} Duplikate gefunden für User ${userId}, KW ${kw}/${year}`);
        }

        // Bereits abgerechnet = unveränderbar, Korrektur erstellen
        const bereitsAbgerechnet = existing?.invoice_id_vorschuss != null;

        // Prüfen ob keine Unterkunftskosten berechnet werden sollen
        const keineUnterkunft = attendance?.keine_unterkunft === true;

        // Keine Tage oder keine Unterkunftskosten = Eintrag löschen falls vorhanden und nicht abgerechnet
        if (totalDays === 0 || keineUnterkunft) {
            if (existing && !bereitsAbgerechnet) {
                await supabase.from('euro_ledger').delete().eq('id', existing.id);
            } else if (existing && bereitsAbgerechnet) {
                // Korrektur-Buchung: Betrag zurückbuchen
                await supabase.from('euro_ledger').insert({
                    user_id: userId,
                    campaign_id: campaignId,
                    kategorie: 'unterkunft',
                    typ: 'korrektur',
                    betrag: -existing.betrag, // Gegenbuchung (positiv)
                    beschreibung: `Korrektur: Unterkunft KW ${kw}/${year} (${keineUnterkunft ? 'keine Unterkunftskosten' : '0 Tage'})`,
                    kw: kw,
                    year: year,
                    quelle: 'vorschuss',
                    referenz_datum: new Date().toISOString().split('T')[0]
                });
            }
            return null;
        }

        // Platinum Prime Status prüfen
        let istPlatinumPrime = false;
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('platinum_prime_start, platinum_prime_end')
            .eq('user_id', userId)
            .single();

        if (userProfile?.platinum_prime_start && userProfile?.platinum_prime_end) {
            const kwStartStr = kwStart.toISOString().split('T')[0];
            istPlatinumPrime = kwStartStr >= userProfile.platinum_prime_start &&
                              kwStartStr <= userProfile.platinum_prime_end;
        }

        // Kosten berechnen
        const kosten = berechneAnwesenheitskosten(totalDays, istPlatinumPrime);

        // Beschreibung
        const beschreibung = istPlatinumPrime && totalDays >= 4
            ? `Unterkunft KW ${kw}/${year} (${totalDays} Tage, PPM)`
            : `Unterkunft KW ${kw}/${year} (${totalDays} Tage)`;

        if (existing) {
            // Update wenn sich Betrag geändert hat
            if (existing.betrag !== -kosten) {
                if (bereitsAbgerechnet) {
                    // Korrektur-Buchung mit Differenz erstellen
                    const differenz = (-kosten) - existing.betrag; // Neue Kosten - Alte Kosten
                    const { data: korrektur, error: korrekturError } = await supabase
                        .from('euro_ledger')
                        .insert({
                            user_id: userId,
                            campaign_id: campaignId,
                            kategorie: 'unterkunft',
                            typ: 'korrektur',
                            betrag: differenz,
                            beschreibung: `Korrektur: ${beschreibung}`,
                            kw: kw,
                            year: year,
                            quelle: 'vorschuss',
                            referenz_datum: new Date().toISOString().split('T')[0]
                        })
                        .select()
                        .single();

                    if (korrekturError) {
                        console.error('Fehler beim Erstellen der Korrektur:', korrekturError);
                        return null;
                    }
                    return korrektur;
                } else {
                    // Normales Update (noch nicht abgerechnet)
                    const { data: updated, error: updateError } = await supabase
                        .from('euro_ledger')
                        .update({
                            betrag: -kosten,
                            beschreibung: beschreibung
                        })
                        .eq('id', existing.id)
                        .select()
                        .single();

                    if (updateError) {
                        console.error('Fehler beim Update des Anwesenheitsabzugs:', updateError);
                        return null;
                    }
                    return updated;
                }
            }
            return existing;
        }

        // Neuen Eintrag erstellen
        const { data: created, error: createError } = await supabase
            .from('euro_ledger')
            .insert({
                user_id: userId,
                campaign_id: campaignId,
                kategorie: 'unterkunft',
                typ: 'abzug',
                betrag: -kosten,
                beschreibung: beschreibung,
                kw: kw,
                year: year,
                quelle: 'vorschuss',
                referenz_datum: kwStart.toISOString().split('T')[0]
            })
            .select()
            .single();

        if (createError) {
            console.error('Fehler beim Erstellen des Anwesenheitsabzugs:', createError);
            return null;
        }

        return created;
    } catch (error) {
        console.error('Fehler in erstelleAnwesenheitsAbzug:', error);
        return null;
    } finally {
        // Lock entfernen
        anwesenheitsAbzugLocks.delete(lockKey);
    }
}

/**
 * Erstellt Anwesenheitsabzüge für alle Kampagnen/KWs eines Zeitraums
 * @param {string} userId - User UUID
 * @param {object} zeitraum - { von: Date, bis: Date }
 * @returns {Promise<Array>} Erstellte Abzüge
 */
async function erstelleAnwesenheitsAbzuegeFuerZeitraum(userId, zeitraum) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) return [];

    const erstellteAbzuege = [];
    const startKw = getKW(zeitraum.von);
    const endKw = getKW(zeitraum.bis);
    const year = zeitraum.von.getFullYear();

    // Alle Anwesenheiten für diesen User im Zeitraum laden
    const { data: attendances } = await supabase
        .from('campaign_attendance')
        .select('campaign_id, kw')
        .eq('user_id', userId)
        .gte('kw', startKw)
        .lte('kw', endKw);

    if (!attendances) return [];

    // Unique Kampagne/KW-Kombinationen
    const processed = new Set();
    for (const att of attendances) {
        const key = `${att.campaign_id}-${att.kw}`;
        if (processed.has(key)) continue;
        processed.add(key);

        const abzug = await erstelleAnwesenheitsAbzug(userId, att.campaign_id, att.kw, year);
        if (abzug) {
            erstellteAbzuege.push(abzug);
        }
    }

    return erstellteAbzuege;
}

/**
 * Ermittelt die aktuelle Karrierestufe für einen User.
 * Der neueste Eintrag (nach assigned_at) gilt immer.
 *
 * @param {Array} careerEntries - Array mit Karriere-Einträgen aus user_roles
 * @param {Date|null} referenceDate - Referenzdatum (nicht mehr verwendet)
 * @returns {object} { roleName, factor, stufe, isExpired }
 */
function getAktuelleKarriereStufe(careerEntries, referenceDate = null) {
    const ROLE_TO_STUFE = {
        'starting_marketing_advisor': 'SMA',
        'executive_marketing_advisor': 'EMA',
        'junior_marketing_manager': 'JMM',
        'executive_marketing_manager': 'EMM',
        'senior_marketing_manager': 'SMM',
        'chief_executive_marketing_manager': 'CEMM',
        'spitzen_botschafter': 'SPB',
        'kadermanager': 'KAD',
        'führungsebene': 'FUE',
        'sma': 'SMA', 'ema': 'EMA', 'jmm': 'JMM', 'emm': 'EMM',
        'smm': 'SMM', 'cemm': 'CEMM', 'spb': 'SPB', 'kad': 'KAD', 'fue': 'FUE'
    };

    const defaultResult = { roleName: null, factor: null, stufe: '-', isExpired: false };

    if (!careerEntries || careerEntries.length === 0) {
        return defaultResult;
    }

    // Neuste Karrierestufe gilt immer (sortiert nach assigned_at absteigend)
    const sortedEntries = [...careerEntries].sort((a, b) => {
        const dateA = a.assigned_at ? new Date(a.assigned_at) : new Date(0);
        const dateB = b.assigned_at ? new Date(b.assigned_at) : new Date(0);
        return dateB - dateA;
    });

    const latestEntry = sortedEntries[0];
    const careerName = latestEntry.role_name?.toLowerCase() || '';

    return {
        roleName: latestEntry.role_name,
        factor: latestEntry.factor,
        stufe: ROLE_TO_STUFE[careerName] || '-',
        isExpired: false
    };
}

window.getAktuelleKarriereStufe = getAktuelleKarriereStufe;

/**
 * Formatiert einen Betrag als Euro-String
 * @param {number} betrag - Betrag in EUR
 * @returns {string} Formatierter String z.B. "1.234,56 €"
 */
function formatEuro(betrag) {
    return betrag.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' €';
}

/**
 * Parst einen Euro-String zu einer Zahl
 * @param {string|number} wert - Euro-String oder Zahl
 * @returns {number} Betrag als Zahl
 */
function parseEuro(wert) {
    if (typeof wert === 'number') return wert;
    return parseFloat(String(wert || '0').replace(/[^\d,\-]/g, '').replace(',', '.')) || 0;
}

/**
 * Generiert die nächste Rechnungsnummer
 * Format: GS-[VS/STR]-[JJ]-[MM]-[A-F][NNNNN]
 * Beispiel: GS-VS-026-01-A00001
 *
 * @param {string} typ - 'vorschuss' | 'stornorucklage'
 * @param {number} jahr - Jahr (z.B. 2026)
 * @param {number} monat - Monat (1-12)
 * @param {string} kategorie - Provisions-Kategorie: 'all'|'werben'|'teamleitung'|'quality'|'empfehlung'|'recruiting'
 * @param {Array} existingInvoices - Bestehende Rechnungen
 * @returns {string} Rechnungsnummer z.B. "GS-VS-026-01-A00001"
 */
function generateInvoiceNumber(typ, jahr, monat, kategorie = 'all', existingInvoices = []) {
    // Typ-Kürzel
    const typKuerzel = typ === 'vorschuss' ? 'VS' : 'STR';

    // Jahr kurz (letzte 3 Ziffern: 2026 -> 026)
    const jahrKurz = String(jahr).slice(-3).padStart(3, '0');

    // Monat 2-stellig
    const monatStr = String(monat).padStart(2, '0');

    // Kategorie-Buchstabe
    const kategorieBuchstaben = {
        'all': 'A',
        'werben': 'B',
        'teamleitung': 'C',
        'quality': 'D',
        'empfehlung': 'E',
        'recruiting': 'F'
    };
    const buchstabe = kategorieBuchstaben[kategorie] || 'A';

    // Höchste Nummer im Jahr finden (über alle Monate, da fortlaufend übers Jahr)
    // Pattern: GS-VS-026-XX-X##### oder GS-STR-026-XX-X#####
    const pattern = new RegExp(`^GS-(?:VS|STR)-${jahrKurz}-\\d{2}-[A-F](\\d+)$`);

    let maxNum = 0;
    existingInvoices.forEach(inv => {
        const match = inv.invoice_number?.match(pattern);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    });

    return `GS-${typKuerzel}-${jahrKurz}-${monatStr}-${buchstabe}${String(maxNum + 1).padStart(5, '0')}`;
}

/**
 * Berechnet KW-Nummer aus Datum
 * @param {Date|string} datum - Datum
 * @returns {number} Kalenderwoche
 */
function getKW(datum) {
    const d = new Date(datum);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============================================================================
// PROVISIONS-BERECHNUNG (TC, Quality, Empfehlung)
// ============================================================================

/**
 * Berechnet TC-Provision (Teamleitung)
 * @param {object} teamleiter - Teamleiter-Objekt mit provisionSettings
 * @param {number} teamEhGesamt - Gesamte Team-EH (ohne Teamleiter)
 * @param {number} eigeneEh - Eigene EH des Teamleiters
 * @returns {number} TC-Provision in EUR
 */
function berechneTcProvision(teamleiter, teamEhGesamt, eigeneEh) {
    const settings = teamleiter.provisionSettings || {};
    const faktor = settings.tc_faktor ?? 1.0;
    const mindEh = settings.tc_mind_eh ?? 100;

    // Anforderung prüfen: Mind. eigene EH
    if (eigeneEh < mindEh) {
        return 0;
    }

    return Math.round(teamEhGesamt * faktor * 100) / 100;
}

/**
 * Berechnet Quality-Provision
 * @param {object} qualityManager - Quality-Manager-Objekt mit provisionSettings
 * @param {number} teamEhGesamt - Gesamte Team-EH (ohne Quality-Manager)
 * @param {number} teamPersonen - Anzahl Personen im Team
 * @param {number} teamTage - Anzahl Arbeitstage
 * @returns {number} Quality-Provision in EUR
 */
function berechneQualityProvision(qualityManager, teamEhGesamt, teamPersonen, teamTage) {
    const settings = qualityManager.provisionSettings || {};
    const faktor = settings.quality_faktor ?? 0.5;
    const mindDurchschnitt = settings.quality_eh_durchschnitt ?? 50;

    // EH-Durchschnitt pro Tag pro Person berechnen
    const durchschnitt = (teamPersonen > 0 && teamTage > 0)
        ? teamEhGesamt / teamPersonen / teamTage
        : 0;

    // Anforderung prüfen
    if (durchschnitt < mindDurchschnitt) {
        return 0;
    }

    return Math.round(teamEhGesamt * faktor * 100) / 100;
}

/**
 * Berechnet Empfehlungs-Provision
 * @param {object} empfehler - Empfehler-Objekt mit provisionSettings
 * @param {number} empfohlenerEh - EH des Empfohlenen
 * @param {Date|string} empfehlungsDatum - Datum der Empfehlung
 * @param {number|null} empfohlenerTage - Anwesenheitstage des Empfohlenen (optional)
 * @returns {number} Empfehlungs-Provision in EUR
 */
function berechneEmpfehlungsProvision(empfehler, empfohlenerEh, empfehlungsDatum, empfohlenerTage = null) {
    const settings = empfehler.provisionSettings || {};
    const faktor = settings.empfehlung_faktor ?? 0.5;
    const zeitraumMonate = settings.empfehlung_zeitraum_monate ?? 12;
    const mindEh = settings.empfehlung_mind_eh;
    const mindTage = settings.empfehlung_mind_tage;

    // Zeitraum prüfen
    const jetzt = new Date();
    const empfehlungPlusMonate = new Date(empfehlungsDatum);
    empfehlungPlusMonate.setMonth(empfehlungPlusMonate.getMonth() + zeitraumMonate);

    if (jetzt > empfehlungPlusMonate) {
        return 0; // Zeitraum abgelaufen
    }

    // Anforderung prüfen: Mind. EH ODER Mind. Tage
    if (mindEh !== null && mindEh !== undefined) {
        if (empfohlenerEh < mindEh) {
            return 0;
        }
    } else if (mindTage !== null && mindTage !== undefined) {
        if (empfohlenerTage === null || empfohlenerTage < mindTage) {
            return 0;
        }
    }

    return Math.round(empfohlenerEh * faktor * 100) / 100;
}

/**
 * Lädt Stornorücklagen-Übersicht für einen Botschafter
 * Nutzt View stornorucklage_uebersicht (berechnet aus provisions_ledger)
 * @param {string} userId - Botschafter UUID
 * @returns {Promise<object>} { gesperrt, auszahlbar, ausgezahlt, details } - Werte in Einheiten (EH)
 */
async function ladeStornorucklagen(userId) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('stornorucklage_uebersicht')
            .select('*')
            .eq('user_id', userId)
            .order('year', { ascending: false })
            .order('halbjahr', { ascending: false });

        if (error) throw error;

        // Nach Status gruppieren (View berechnet Status bereits)
        let gesperrt = 0;
        let auszahlbar = 0;
        let ausgezahlt = 0;

        (data || []).forEach(item => {
            const einheiten = parseFloat(item.netto_einheiten) || 0;

            if (item.status === 'ausgezahlt') {
                ausgezahlt += einheiten;
            } else if (item.status === 'auszahlbar') {
                auszahlbar += einheiten;
            } else {
                gesperrt += einheiten;
            }
        });

        return {
            gesperrt: Math.round(gesperrt * 100) / 100,
            auszahlbar: Math.round(auszahlbar * 100) / 100,
            ausgezahlt: Math.round(ausgezahlt * 100) / 100,
            details: data || []
        };
    } catch (error) {
        console.error('Fehler in ladeStornorucklagen:', error);
        return null;
    }
}

/**
 * Erstellt eine neue Abrechnung
 * @param {object} data - Abrechnungsdaten
 * @returns {Promise<object>} Erstellte Abrechnung
 */
async function erstelleAbrechnung(data) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase Client nicht verfügbar');

    // Provisions-Beträge aus data.provisionen (Ledger) oder Fallback auf Gesamt
    const provisionen = data.provisionen || {
        werben: data.brutto,
        teamleitung: 0,
        quality: 0,
        empfehlung: 0,
        recruiting: 0
    };
    if (!provisionen.recruiting) provisionen.recruiting = 0;

    // Gesamt-Provisionen berechnen
    const gesamtProvision = provisionen.werben + provisionen.teamleitung + provisionen.quality + provisionen.empfehlung + provisionen.recruiting;
    const gesamtVorschuss = gesamtProvision * (data.vorschussAnteil / 100);
    const gesamtStornorucklage = gesamtProvision - gesamtVorschuss;

    // USt-Berechnung
    const isVatLiable = data.isVatLiable || false;
    const vatRate = isVatLiable ? 19 : 0;
    const vatAmount = isVatLiable ? data.netto * 0.19 : 0;
    const totalPayout = data.netto + vatAmount;

    // Input für RPC-Funktion vorbereiten
    const rpcInput = {
        userId: data.userId,
        invoice_type: data.invoice_type,
        zeitraum: data.zeitraum,
        kw_start: getKW(new Date(data.zeitraum.von)),
        kw_end: getKW(new Date(data.zeitraum.bis)),
        year: data.year,
        brutto: gesamtProvision,
        vorschuss: data.vorschuss,
        stornorucklage: data.stornorucklage,
        vorschussAnteil: data.vorschussAnteil,
        abzuegeUnterkunft: data.abzuegeUnterkunft || 0,
        abzuegeSonderposten: data.abzuegeSonderposten || 0,
        netto: data.netto,
        gesamtProvision: gesamtProvision,
        gesamtVorschuss: gesamtVorschuss,
        gesamtStornorucklage: gesamtStornorucklage,
        provisionen: provisionen,
        scheduled_send_at: data.scheduled_send_at || null,
        // USt-Felder
        is_vat_liable: isVatLiable,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_payout: totalPayout,
        calculation_data: {
            name: data.name,
            email: data.email || '',
            telefon: data.telefon || '',
            iban: data.iban || '',
            kontoinhaber: data.kontoinhaber || '',
            adresse: data.adresse || {},
            personalnummer: data.personalnummer || '-',
            taxId: data.taxId || '',
            einheiten: data.einheiten,
            faktor: data.faktor,
            karrierestufe: data.karrierestufe,
            vorschuss_anteil: data.vorschussAnteil,
            provisionen: provisionen,
            einheiten_pro_kategorie: data.einheitenProKategorie || {},
            provision_settings: data.provisionSettings || {},
            abzuege_vorschuss: data.abzuegeVorschuss || { unterkunft: 0, sonderposten: 0, zubuchungUnterkunft: 0, zubuchungSonderposten: 0 },
            // USt-Info
            is_vat_liable: isVatLiable,
            vat_rate: vatRate,
            vat_amount: vatAmount
        }
    };

    // Transaktionssichere RPC-Funktion aufrufen
    const { data: result, error } = await supabase
        .rpc('create_invoice_transaction', { input_data: rpcInput });

    if (error) throw error;
    return result;
}

/**
 * Fügt einen Abzug oder eine Zubuchung hinzu (Euro-Ledger)
 * @param {object} data - { userId, type, beschreibung, betrag, buchungArt }
 * @returns {Promise<object>} Erstellte Buchung
 */
async function fuegeAbzugHinzu(data) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase Client nicht verfügbar');

    const istZubuchung = data.buchungArt === 'zubuchung';
    const buchung = {
        user_id: data.userId,
        kategorie: data.type, // 'unterkunft' | 'sonderposten' | 'sonstiges'
        typ: data.buchungArt || 'abzug', // 'abzug' | 'zubuchung' | 'korrektur'
        quelle: data.von || 'vorschuss', // 'vorschuss' | 'stornorucklage'
        betrag: istZubuchung ? Math.abs(data.betrag) : -Math.abs(data.betrag),
        beschreibung: data.beschreibung,
        referenz_datum: data.gueltig_ab || new Date().toISOString().split('T')[0]
    };

    const { data: created, error } = await supabase
        .from('euro_ledger')
        .insert(buchung)
        .select()
        .single();

    if (error) throw error;
    return created;
}

/**
 * Aktualisiert den Status einer Abrechnung
 * @param {string} invoiceId - Invoice UUID
 * @param {string} status - Neuer Status
 * @param {Date} scheduledAt - Geplanter Versandzeitpunkt (optional)
 * @returns {Promise<object>} Aktualisierte Abrechnung
 */
async function updateAbrechnungStatus(invoiceId, status, scheduledAt = null) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase Client nicht verfügbar');

    const updateData = { status };

    if (status === 'offen') {
        updateData.approved_at = new Date().toISOString();
        // Rechnungsnummer wird automatisch per DB-Trigger vergeben
    }

    if (scheduledAt) {
        updateData.scheduled_send_at = scheduledAt;
        updateData.status = 'geplant';
    }

    const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Lädt Statistiken für alle Werber (zentral für Statistik- und Abrechnungsseite)
 * @param {object} options - { startDate: Date|null, endDate: Date|null }
 * @returns {Promise<Array>} Array mit Werber-Statistiken
 */
async function ladeWerberStatistiken(options = {}) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) {
        console.error('Supabase nicht verfügbar');
        return [];
    }

    const { startDate, endDate } = options;

    try {
        // 1. Alle Werber laden (inkl. created_at für Personalnummer)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, avatar_url, created_at')
            .eq('role', 'werber')
            .order('created_at', { ascending: true });

        if (usersError) throw usersError;

        // 2. User Profiles laden (Profilbilder, Vorschuss-Anteil, Adresse, USt-Pflicht)
        const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, photo_intern_url, advance_rate, reserve_rate, street, house_number, postal_code, city, personalnummer, iban, account_holder, phone, is_vat_liable, vat_valid_from, vat_valid_until, tax_id');

        const profilesMap = {};
        (profilesData || []).forEach(p => {
            profilesMap[p.user_id] = p;
        });

        // 2b. Provision Settings laden
        const { data: provisionSettingsData } = await supabase
            .from('user_provision_settings')
            .select('*');

        const provisionMap = {};
        (provisionSettingsData || []).forEach(p => {
            provisionMap[p.user_id] = p;
        });

        // 3. Karrierestufen laden (alle für Zeitraum-Logik)
        const { data: careerData } = await supabase
            .from('user_roles')
            .select('user_id, role_name, factor, is_active, valid_from, valid_until, assigned_at')
            .eq('role_type', 'career');

        // Einträge pro User gruppieren
        const careerEntriesByUser = {};
        (careerData || []).forEach(r => {
            if (!careerEntriesByUser[r.user_id]) {
                careerEntriesByUser[r.user_id] = [];
            }
            careerEntriesByUser[r.user_id].push(r);
        });

        // Aktuelle Stufe pro User mit Zeitraum-Logik ermitteln
        const careerMap = {};
        Object.keys(careerEntriesByUser).forEach(userId => {
            const career = getAktuelleKarriereStufe(careerEntriesByUser[userId]);
            careerMap[userId] = {
                stufe: career.stufe,
                roleName: career.roleName,
                factor: career.factor,
                isExpired: career.isExpired
            };
        });

        // 4. Records laden (für Statistik: total, aktiv, storno, nettoJE)
        let recordsQuery = supabase
            .from('records')
            .select('werber_id, yearly_amount, record_status, start_date, record_type, old_amount')
            .is('deleted_at', null);

        if (startDate) {
            const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            recordsQuery = recordsQuery.gte('start_date', startStr);
        }
        if (endDate) {
            const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            recordsQuery = recordsQuery.lte('start_date', endStr + 'T23:59:59');
        }

        const { data: records, error: recordsError } = await recordsQuery;
        if (recordsError) throw recordsError;

        // 5a. Record-Statistiken pro Werber (für Anzeige: total, aktiv, storno)
        const recordStatsMap = {};
        (records || []).forEach(r => {
            if (!r.werber_id) return;
            if (!recordStatsMap[r.werber_id]) {
                recordStatsMap[r.werber_id] = { total: 0, aktiv: 0, storno: 0, nettoJE: 0 };
            }
            recordStatsMap[r.werber_id].total++;
            if (r.record_status === 'aktiv') {
                recordStatsMap[r.werber_id].aktiv++;
                const isERH = r.record_type === 'erhoehung';
                const nettoValue = isERH ? ((r.yearly_amount || 0) - (r.old_amount || 0)) : (r.yearly_amount || 0);
                recordStatsMap[r.werber_id].nettoJE += nettoValue;
            } else if (r.record_status === 'storno') {
                recordStatsMap[r.werber_id].storno++;
            }
        });

        // 5b. OFFENE Einheiten aus provisions_ledger laden (invoice_id_vorschuss IS NULL)
        let ledgerQuery = supabase
            .from('provisions_ledger')
            .select('user_id, kategorie, einheiten, referenz_datum')
            .is('invoice_id_vorschuss', null);

        if (startDate) {
            const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            ledgerQuery = ledgerQuery.gte('referenz_datum', startStr);
        }
        if (endDate) {
            const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            ledgerQuery = ledgerQuery.lte('referenz_datum', endStr);
        }

        const { data: ledgerData, error: ledgerError } = await ledgerQuery;
        if (ledgerError) throw ledgerError;

        // EH pro User und Kategorie summieren
        const statsMap = {};
        (ledgerData || []).forEach(entry => {
            if (!entry.user_id) return;
            if (!statsMap[entry.user_id]) {
                statsMap[entry.user_id] = {
                    einheiten: 0,
                    einheitenProKategorie: {
                        werben: 0,
                        teamleitung: 0,
                        quality: 0,
                        empfehlung: 0,
                        recruiting: 0
                    }
                };
            }
            const eh = parseFloat(entry.einheiten) || 0;
            statsMap[entry.user_id].einheiten += eh;
            if (statsMap[entry.user_id].einheitenProKategorie[entry.kategorie] !== undefined) {
                statsMap[entry.user_id].einheitenProKategorie[entry.kategorie] += eh;
            }
        });

        // 6. Euro-Ledger laden (offene Buchungen)
        const { data: euroLedgerData } = await supabase
            .from('euro_ledger')
            .select('user_id, kategorie, quelle, betrag')
            .is('invoice_id_vorschuss', null);

        const abzuegeMap = {};
        (euroLedgerData || []).forEach(e => {
            if (!abzuegeMap[e.user_id]) {
                abzuegeMap[e.user_id] = {
                    // Nach Quelle getrennt
                    vorschuss: { unterkunft: 0, sonderposten: 0, zubuchungUnterkunft: 0, zubuchungSonderposten: 0 },
                    stornorucklage: { unterkunft: 0, sonderposten: 0, zubuchungUnterkunft: 0, zubuchungSonderposten: 0 },
                    // Gesamt (für Abwärtskompatibilität)
                    unterkunft: 0,
                    sonderposten: 0,
                    zubuchungUnterkunft: 0,
                    zubuchungSonderposten: 0
                };
            }
            const betrag = parseFloat(e.betrag) || 0;
            const quelle = e.quelle || 'vorschuss';
            const quelleObj = abzuegeMap[e.user_id][quelle];

            // Im euro_ledger: Negativ = Abzug, Positiv = Zubuchung
            if (e.kategorie === 'unterkunft') {
                if (betrag >= 0) {
                    quelleObj.zubuchungUnterkunft += betrag;
                    abzuegeMap[e.user_id].zubuchungUnterkunft += betrag;
                } else {
                    quelleObj.unterkunft += Math.abs(betrag);
                    abzuegeMap[e.user_id].unterkunft += Math.abs(betrag);
                }
            } else {
                if (betrag >= 0) {
                    quelleObj.zubuchungSonderposten += betrag;
                    abzuegeMap[e.user_id].zubuchungSonderposten += betrag;
                } else {
                    quelleObj.sonderposten += Math.abs(betrag);
                    abzuegeMap[e.user_id].sonderposten += Math.abs(betrag);
                }
            }
        });

        // 7. Letzte Abrechnungen laden
        const { data: invoicesData } = await supabase
            .from('invoices')
            .select('user_id, invoice_number, created_at')
            .order('created_at', { ascending: false });

        const lastInvoiceMap = {};
        (invoicesData || []).forEach(inv => {
            if (!lastInvoiceMap[inv.user_id]) {
                lastInvoiceMap[inv.user_id] = inv;
            }
        });

        // 8. Stornorücklagen laden
        const stornorucklageMap = {};
        for (const user of users || []) {
            const sr = await ladeStornorucklagen(user.id);
            if (sr) {
                stornorucklageMap[user.id] = sr;
            }
        }

        // 9. Einsatztage laden (mit präzisem Zeitraum-Filter)
        // ISO-Woche aus Datum berechnen
        function getIsoWeek(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        // Datum aus KW + dayIndex berechnen (dayIndex: 0=Mo, 6=So)
        function getDateFromKwAndDay(year, kw, dayIndex) {
            // Erster Donnerstag des Jahres finden
            const jan4 = new Date(Date.UTC(year, 0, 4));
            const dayOfWeek = jan4.getUTCDay() || 7; // 1=Mo, 7=So
            const firstMonday = new Date(jan4);
            firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
            // Zum gewünschten Tag navigieren
            const targetDate = new Date(firstMonday);
            targetDate.setUTCDate(firstMonday.getUTCDate() + (kw - 1) * 7 + dayIndex);
            return targetDate;
        }

        // Jahr aus Zeitraum ermitteln (für KW-Berechnung)
        const filterYear = endDate ? endDate.getFullYear() : (startDate ? startDate.getFullYear() : new Date().getFullYear());

        let attendanceQuery = supabase
            .from('campaign_attendance')
            .select('user_id, kw, day_0, day_1, day_2, day_3, day_4, day_5, day_6');

        // Grober KW-Filter wenn Zeitraum angegeben (Performance)
        if (startDate) {
            const startKw = getIsoWeek(startDate);
            attendanceQuery = attendanceQuery.gte('kw', startKw);
        }
        if (endDate) {
            const endKw = getIsoWeek(endDate);
            attendanceQuery = attendanceQuery.lte('kw', endKw);
        }

        const { data: attendance } = await attendanceQuery;

        // Heute für "nicht in der Zukunft" Prüfung
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Zeitraum-Grenzen als Timestamps für Vergleich
        const filterStart = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0).getTime() : null;
        const filterEnd = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime() : null;
        const todayTime = today.getTime();

        const einsatztageMap = {};
        (attendance || []).forEach(row => {
            const days = [row.day_0, row.day_1, row.day_2, row.day_3, row.day_4, row.day_5, row.day_6];

            let countDays = 0;
            days.forEach((isActive, dayIndex) => {
                // Sonntag (day_6) nie zählen
                if (!isActive || dayIndex === 6) return;

                // Konkretes Datum für diesen Tag berechnen
                const dayDate = getDateFromKwAndDay(filterYear, row.kw, dayIndex);
                const dayTime = dayDate.getTime();

                // Prüfen: im Zeitraum UND nicht in der Zukunft
                const inRange = (!filterStart || dayTime >= filterStart) && (!filterEnd || dayTime <= filterEnd);
                const notFuture = dayTime <= todayTime;

                if (inRange && notFuture) {
                    countDays++;
                }
            });

            if (countDays > 0) {
                if (!einsatztageMap[row.user_id]) {
                    einsatztageMap[row.user_id] = 0;
                }
                einsatztageMap[row.user_id] += countDays;
            }
        });

        // 10. TC- und Quality-Zuordnungen laden (campaign_assignments)
        const { data: assignmentsData } = await supabase
            .from('campaign_assignments')
            .select(`
                id,
                campaign_id,
                kw,
                teamchef_id,
                quality_manager_id,
                campaign_assignment_werber(werber_id)
            `);

        // Map: User -> Liste der KWs wo er TC ist + Team-Mitglieder
        const tcMap = {};
        // Map: User -> Liste der KWs wo er Quality ist
        const qualityMap = {};
        // Map: Assignment -> Team-Mitglieder
        const teamMembersMap = {};

        (assignmentsData || []).forEach(a => {
            // Team-Mitglieder sammeln
            const members = (a.campaign_assignment_werber || []).map(w => w.werber_id);
            teamMembersMap[a.id] = members;

            // TC-Zuordnung
            if (a.teamchef_id) {
                if (!tcMap[a.teamchef_id]) {
                    tcMap[a.teamchef_id] = [];
                }
                tcMap[a.teamchef_id].push({
                    assignmentId: a.id,
                    campaignId: a.campaign_id,
                    kw: a.kw,
                    teamMembers: members
                });
            }

            // Quality-Zuordnung
            if (a.quality_manager_id) {
                if (!qualityMap[a.quality_manager_id]) {
                    qualityMap[a.quality_manager_id] = [];
                }
                qualityMap[a.quality_manager_id].push({
                    assignmentId: a.id,
                    campaignId: a.campaign_id,
                    kw: a.kw,
                    teamMembers: members
                });
            }
        });

        // 11. Empfehlungen laden (user_recruitments)
        const { data: recruitmentsData } = await supabase
            .from('user_recruitments')
            .select('user_id, recruited_by_id, recruitment_type, recruitment_date')
            .eq('recruitment_type', 'empfehlung');

        // Map: Empfehler -> Liste der Empfohlenen
        const empfehlungenMap = {};
        (recruitmentsData || []).forEach(r => {
            if (!empfehlungenMap[r.recruited_by_id]) {
                empfehlungenMap[r.recruited_by_id] = [];
            }
            empfehlungenMap[r.recruited_by_id].push({
                oderId: r.user_id,
                recruitmentDate: r.recruitment_date
            });
        });

        // 12. Erster Anwesenheitstag pro User (für Empfehlungs-Zeitraum)
        const { data: firstAttendanceData } = await supabase
            .from('campaign_attendance')
            .select('user_id, kw, campaign_id, campaigns(year)')
            .order('kw', { ascending: true });

        const firstAttendanceMap = {};
        (firstAttendanceData || []).forEach(row => {
            if (!firstAttendanceMap[row.user_id]) {
                // Erster Eintrag = frühester
                const year = row.campaigns?.year || new Date().getFullYear();
                // KW zu Datum konvertieren (Montag der KW)
                const date = new Date(year, 0, 1 + (row.kw - 1) * 7);
                firstAttendanceMap[row.user_id] = date;
            }
        });

        // 13. Werber-Daten zusammenbauen
        return (users || []).map((user, userIndex) => {
            // Record-Statistiken (total, aktiv, storno, nettoJE)
            const recordStats = recordStatsMap[user.id] || { total: 0, aktiv: 0, storno: 0, nettoJE: 0 };
            // Ledger-Statistiken (einheiten pro Kategorie)
            const ledgerStats = statsMap[user.id] || {
                einheiten: 0,
                einheitenProKategorie: { werben: 0, teamleitung: 0, quality: 0, empfehlung: 0, recruiting: 0 }
            };
            const profile = profilesMap[user.id] || {};
            const career = careerMap[user.id] || { stufe: '-', roleName: null, factor: 0, isExpired: false };
            const abzuege = abzuegeMap[user.id] || { unterkunft: 0, sonderposten: 0, zubuchungUnterkunft: 0, zubuchungSonderposten: 0 };
            const lastInvoice = lastInvoiceMap[user.id];
            const stornorucklage = stornorucklageMap[user.id] || { gesperrt: 0, auszahlbar: 0 };
            const provision = provisionMap[user.id] || {};

            const stornoQuote = recordStats.total > 0 ? (recordStats.storno / recordStats.total) * 100 : 0;
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            // Faktor: individuell aus provision_settings, sonst aus Zeitraum-Logik (career.factor)
            const faktor = provision.werben_faktor || career.factor || 5.0;
            const vorschussAnteil = provision.vorschuss_anteil || profile.advance_rate || 75;

            // Provision berechnen (nur Werben-EH × Faktor für Brutto)
            const brutto = berechneBruttoProvision(ledgerStats.einheitenProKategorie.werben, faktor);
            const aufteilung = berechneAufteilung(brutto, vorschussAnteil);
            const nettoAbzuege = abzuege.unterkunft + abzuege.sonderposten;
            const nettoZubuchungen = abzuege.zubuchungUnterkunft + abzuege.zubuchungSonderposten;
            const netto = berechneNetto(aufteilung.vorschuss, nettoAbzuege, 0) + nettoZubuchungen;

            return {
                // Basis
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at,
                userIndex: userIndex + 1, // Fortlaufende Nummer (1-basiert)
                initials: initials,
                color: '#6366f1',
                image: profile.photo_intern_url || '',

                // Adresse (für PDF-Abrechnungen)
                adresse: {
                    street: profile.street || '',
                    houseNumber: profile.house_number || '',
                    postalCode: profile.postal_code || '',
                    city: profile.city || ''
                },

                // Personalnummer (aus DB)
                personalnummer: profile.personalnummer || '',

                // Steuer-ID (aus DB)
                taxId: profile.tax_id || '',

                // Bankdaten (aus DB)
                iban: profile.iban || '',
                kontoinhaber: profile.account_holder || '',

                // Kontaktdaten (aus DB)
                telefon: profile.phone || '',

                // Karriere
                karrierestufe: career.stufe,
                faktor: faktor,
                karriereAbgelaufen: career.isExpired || false, // true wenn Zeitraum abgelaufen aber Faktor weitergilt

                // Statistik (für Statistik-Seite)
                records: recordStats.aktiv,
                nettoJE: recordStats.nettoJE,
                storno: stornoQuote,
                einsatztage: einsatztageMap[user.id] || 0,
                stufe: career.stufe,

                // Abrechnung (für Abrechnungs-Seite) - aus Ledger
                einheiten: Math.round(ledgerStats.einheiten * 100) / 100,
                einheitenProKategorie: {
                    werben: Math.round(ledgerStats.einheitenProKategorie.werben * 100) / 100,
                    teamleitung: Math.round(ledgerStats.einheitenProKategorie.teamleitung * 100) / 100,
                    quality: Math.round(ledgerStats.einheitenProKategorie.quality * 100) / 100,
                    empfehlung: Math.round(ledgerStats.einheitenProKategorie.empfehlung * 100) / 100,
                    recruiting: Math.round(ledgerStats.einheitenProKategorie.recruiting * 100) / 100
                },
                offenerVorschuss: Math.round(aufteilung.vorschuss * 100) / 100,
                offeneStornorucklage: stornorucklage.auszahlbar || 0,
                stornorucklageGesperrt: stornorucklage.gesperrt || 0,
                // Abzüge/Zubuchungen Gesamt
                abzuegeUnterkunft: abzuege.unterkunft,
                abzuegeSonderposten: abzuege.sonderposten,
                zubuchungenUnterkunft: abzuege.zubuchungUnterkunft,
                zubuchungenSonderposten: abzuege.zubuchungSonderposten,
                // Abzüge/Zubuchungen nach Quelle (Vorschuss)
                abzuegeVorschuss: abzuege.vorschuss || { unterkunft: 0, sonderposten: 0, zubuchungUnterkunft: 0, zubuchungSonderposten: 0 },
                // Abzüge/Zubuchungen nach Quelle (Stornorücklage)
                abzuegeStornorucklage: abzuege.stornorucklage || { unterkunft: 0, sonderposten: 0, zubuchungUnterkunft: 0, zubuchungSonderposten: 0 },
                nettoAuszahlung: Math.round(netto * 100) / 100,
                vorschussAnteil: vorschussAnteil,

                // Provisions-Einstellungen (TC, Quality, Empfehlung, Recruiting)
                provisionSettings: {
                    tc_faktor: provision.tc_faktor,
                    tc_mind_eh: provision.tc_mind_eh,
                    empfehlung_faktor: provision.empfehlung_faktor,
                    empfehlung_mind_eh: provision.empfehlung_mind_eh,
                    empfehlung_mind_tage: provision.empfehlung_mind_tage,
                    empfehlung_zeitraum_monate: provision.empfehlung_zeitraum_monate,
                    quality_faktor: provision.quality_faktor,
                    quality_eh_durchschnitt: provision.quality_eh_durchschnitt,
                    recruiting_faktor: provision.recruiting_faktor,
                    recruiting_mind_eh: provision.recruiting_mind_eh,
                    recruiting_mind_tage: provision.recruiting_mind_tage,
                    recruiting_zeitraum_monate: provision.recruiting_zeitraum_monate
                },

                // TC-Zuordnungen (wo ist dieser User Teamchef)
                tcZuordnungen: tcMap[user.id] || [],
                istTeamleiter: (tcMap[user.id] || []).length > 0,

                // Quality-Zuordnungen (wo ist dieser User Quality-Manager)
                qualityZuordnungen: qualityMap[user.id] || [],
                istQualityManager: (qualityMap[user.id] || []).length > 0,

                // Empfehlungen (wen hat dieser User empfohlen)
                empfehlungen: empfehlungenMap[user.id] || [],
                hatEmpfehlungen: (empfehlungenMap[user.id] || []).length > 0,

                // Erster Anwesenheitstag (für Empfehlungs-Zeitraum-Berechnung)
                ersterAnwesenheitstag: firstAttendanceMap[user.id] || null,

                // Letzte Abrechnung
                letzteAbrechnung: lastInvoice?.invoice_number || '-',
                letzteAbrechnungDatum: lastInvoice?.created_at,

                // Umsatzsteuer-Pflicht (aus user_profiles, mit Zeitraum-Prüfung)
                isVatLiable: (() => {
                    if (!profile.is_vat_liable) return false;
                    const checkDate = endDate || new Date().toISOString().split('T')[0];
                    if (profile.vat_valid_from && checkDate < profile.vat_valid_from) return false;
                    if (profile.vat_valid_until && checkDate > profile.vat_valid_until) return false;
                    return true;
                })(),
                vatValidFrom: profile.vat_valid_from || null,
                vatValidUntil: profile.vat_valid_until || null,

                status: 'aktiv'
            };
        });
    } catch (error) {
        console.error('Fehler in ladeWerberStatistiken:', error);
        return [];
    }
}

// Global verfügbar machen
window.berechneEinheiten = berechneEinheiten;
window.berechneBruttoProvision = berechneBruttoProvision;
window.berechneAufteilung = berechneAufteilung;
window.berechneNetto = berechneNetto;
window.berechneAnwesenheitskosten = berechneAnwesenheitskosten;
window.erstelleAnwesenheitsAbzug = erstelleAnwesenheitsAbzug;
window.erstelleAnwesenheitsAbzuegeFuerZeitraum = erstelleAnwesenheitsAbzuegeFuerZeitraum;
window.formatEuro = formatEuro;
window.parseEuro = parseEuro;
window.generateInvoiceNumber = generateInvoiceNumber;
window.getKW = getKW;
window.berechneTcProvision = berechneTcProvision;
window.berechneQualityProvision = berechneQualityProvision;
window.berechneEmpfehlungsProvision = berechneEmpfehlungsProvision;
window.ladeStornorucklagen = ladeStornorucklagen;
window.ladeWerberStatistiken = ladeWerberStatistiken;
window.erstelleAbrechnung = erstelleAbrechnung;
window.fuegeAbzugHinzu = fuegeAbzugHinzu;
window.updateAbrechnungStatus = updateAbrechnungStatus;


// ============================================
// E-MAIL VERSAND
// ============================================

/**
 * Sendet eine einzelne Abrechnung per E-Mail
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<object>} - Ergebnis des Versands
 */
async function sendAbrechnungEmail(invoiceId) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    // Edge Function aufrufen
    const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoice_id: invoiceId }
    });

    if (error) throw error;
    return data;
}

/**
 * Sendet alle fälligen geplanten Abrechnungen
 * (Kann manuell oder via Cron aufgerufen werden)
 * @returns {Promise<object>} - Zusammenfassung des Versands
 */
async function sendScheduledAbrechnungen() {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    // Edge Function für geplante Abrechnungen aufrufen
    const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: { send_scheduled: true }
    });

    if (error) throw error;
    return data;
}

/**
 * Sendet mehrere Abrechnungen mit Fortschrittsanzeige
 * @param {string[]} invoiceIds - Array von Invoice UUIDs
 * @param {function} onProgress - Callback für Fortschritt (current, total, result)
 * @returns {Promise<object>} - Zusammenfassung aller Versendungen
 */
async function sendMultipleAbrechnungen(invoiceIds, onProgress = null) {
    const results = {
        total: invoiceIds.length,
        success: 0,
        failed: 0,
        details: []
    };

    for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];
        let result;

        try {
            const response = await sendAbrechnungEmail(invoiceId);
            result = { id: invoiceId, success: true, ...response };
            results.success++;
        } catch (error) {
            result = { id: invoiceId, success: false, error: error.message };
            results.failed++;
        }

        results.details.push(result);

        // Progress-Callback aufrufen
        if (onProgress) {
            onProgress(i + 1, invoiceIds.length, result);
        }

        // Kleine Pause zwischen E-Mails um SMTP nicht zu überlasten
        if (i < invoiceIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}

/**
 * Prüft ob fällige Abrechnungen zum Versand anstehen
 * @returns {Promise<object[]>} - Liste fälliger Abrechnungen
 */
async function getFaelligeAbrechnungen() {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    const { data, error } = await supabase
        .from('invoices')
        .select(`
            id,
            invoice_number,
            invoice_type,
            netto_auszahlung,
            scheduled_send_at,
            users!inner(name, email)
        `)
        .eq('status', 'freigegeben')
        .not('scheduled_send_at', 'is', null)
        .lte('scheduled_send_at', new Date().toISOString())
        .order('scheduled_send_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Aktualisiert den geplanten Versandzeitpunkt einer Abrechnung
 * @param {string} invoiceId - Invoice UUID
 * @param {Date|string} newDateTime - Neuer Versandzeitpunkt
 * @returns {Promise<object>} - Aktualisierte Invoice
 */
async function updateScheduledSendTime(invoiceId, newDateTime) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    const scheduledAt = newDateTime instanceof Date
        ? newDateTime.toISOString()
        : new Date(newDateTime).toISOString();

    const { data, error } = await supabase
        .from('invoices')
        .update({ scheduled_send_at: scheduledAt })
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Setzt eine freigegebene Abrechnung zurück auf Entwurf
 * (Bricht den geplanten Versand ab)
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<object>} - Aktualisierte Invoice
 */
async function cancelScheduledAbrechnung(invoiceId) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    const { data, error } = await supabase
        .from('invoices')
        .update({
            status: 'entwurf',
            scheduled_send_at: null
        })
        .eq('id', invoiceId)
        .eq('status', 'freigegeben') // Nur wenn noch nicht versendet
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Markiert eine Abrechnung als bezahlt
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<object>} - Aktualisierte Invoice
 */
async function markAsBezahlt(invoiceId) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    const { data, error } = await supabase
        .from('invoices')
        .update({
            status: 'bezahlt',
            updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Löscht eine Abrechnung im Status 'entwurf'
 * Gibt Ledger-Einträge frei (invoice_id_vorschuss/invoice_id_stornorucklage = NULL)
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<boolean>} - Erfolg
 */
async function loescheAbrechnung(invoiceId) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    // 1. Prüfen ob Status = entwurf
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('status, invoice_type')
        .eq('id', invoiceId)
        .single();

    if (fetchError) throw fetchError;
    if (invoice.status !== 'entwurf') {
        throw new Error('Nur Entwürfe können gelöscht werden');
    }

    // 2. Ledger-Einträge freigeben (je nach invoice_type)
    if (invoice.invoice_type === 'stornorucklage') {
        await supabase
            .from('provisions_ledger')
            .update({ invoice_id_stornorucklage: null })
            .eq('invoice_id_stornorucklage', invoiceId);
    } else {
        await supabase
            .from('provisions_ledger')
            .update({ invoice_id_vorschuss: null })
            .eq('invoice_id_vorschuss', invoiceId);

        await supabase
            .from('euro_ledger')
            .update({ invoice_id_vorschuss: null })
            .eq('invoice_id_vorschuss', invoiceId);
    }

    // 3. Invoice Items löschen
    await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

    // 3b. Invoice Positions löschen
    await supabase
        .from('invoice_positions')
        .delete()
        .eq('invoice_id', invoiceId);

    // 4. Invoice löschen
    const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

    if (deleteError) throw deleteError;
    return true;
}

/**
 * Storniert eine Abrechnung (offen oder bezahlt)
 * Gibt Ledger-Einträge frei (invoice_id → NULL)
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<object>} - Aktualisierte Invoice
 */
async function storniereAbrechnung(invoiceId) {
    const supabase = window.parent?.supabaseClient || window.supabaseClient;
    if (!supabase) throw new Error('Supabase nicht verfügbar');

    // 1. Prüfen ob Status = offen oder bezahlt
    const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('status, invoice_type')
        .eq('id', invoiceId)
        .single();

    if (fetchError) throw fetchError;
    if (!['offen', 'bezahlt'].includes(invoice.status)) {
        throw new Error('Nur offene oder bezahlte Abrechnungen können storniert werden');
    }

    const invoiceIdField = invoice.invoice_type === 'stornorucklage'
        ? 'invoice_id_stornorucklage'
        : 'invoice_id_vorschuss';

    // 2. Provisions-Ledger: invoice_id freigeben (keine Gegenbuchungen!)
    await supabase
        .from('provisions_ledger')
        .update({ [invoiceIdField]: null })
        .eq(invoiceIdField, invoiceId);

    // 3. Euro-Ledger: invoice_id freigeben (nur bei Vorschuss)
    if (invoice.invoice_type !== 'stornorucklage') {
        await supabase
            .from('euro_ledger')
            .update({ invoice_id_vorschuss: null })
            .eq('invoice_id_vorschuss', invoiceId);
    }

    // 4. Status → storniert
    const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'storniert' })
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Global verfügbar machen

// E-Mail Funktionen global verfügbar machen
window.sendAbrechnungEmail = sendAbrechnungEmail;
window.sendScheduledAbrechnungen = sendScheduledAbrechnungen;
window.sendMultipleAbrechnungen = sendMultipleAbrechnungen;
window.getFaelligeAbrechnungen = getFaelligeAbrechnungen;
window.updateScheduledSendTime = updateScheduledSendTime;
window.cancelScheduledAbrechnung = cancelScheduledAbrechnung;
window.markAsBezahlt = markAsBezahlt;
window.loescheAbrechnung = loescheAbrechnung;
window.storniereAbrechnung = storniereAbrechnung;

console.log('%c Abrechnungs-Modul geladen ', 'background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px;');
console.log('%c E-Mail-Modul geladen ', 'background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px;');

// ================================================================
// SHELL INTEGRATION
// Zentrale Funktion für Shell-Kommunikation (iFrame <-> Shell)
// ================================================================

/**
 * Initialisiert den Shell-Listener für iFrame-Seiten
 * @param {Object} config - Konfiguration
 * @param {Function} config.onSearch - Callback für Suche (query) => results[]
 * @param {Function} config.onSearchSelect - Callback wenn Suchergebnis ausgewählt (id, name)
 * @param {Function} config.onNavFilter - Callback für Nav-Filter (value)
 * @param {Function} config.onPeriodFilter - Callback für Zeitraum-Filter (value)
 * @param {Object} config.toolbarActions - Map von action => handler Funktion
 * @param {Object} config.toolbarConfig - Toolbar-Buttons die registriert werden sollen
 */
function initShellListener(config = {}) {
    const {
        onSearch,
        onSearchSelect,
        onNavFilter,
        onPeriodFilter,
        toolbarActions = {},
        toolbarConfig = null
    } = config;

    // Toolbar bei Shell registrieren
    if (toolbarConfig && window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'registerToolbar',
            config: toolbarConfig
        }, '*');
    }

    // Message-Listener
    window.addEventListener('message', function(e) {
        if (!e.data || !e.data.type) return;

        switch (e.data.type) {
            // Suche
            case 'searchQuery':
                if (onSearch) {
                    const query = e.data.query || '';
                    if (query.length < 2) {
                        sendSearchResults([], query);
                    } else {
                        const results = onSearch(query);
                        sendSearchResults(results, query);
                    }
                }
                break;

            // Suchergebnis ausgewählt
            case 'searchSelect':
                if (onSearchSelect) {
                    onSearchSelect(e.data.id, e.data.name);
                } else {
                    // Standard: Zur Zeile scrollen und highlighten
                    highlightTableRow(e.data.id);
                }
                break;

            // Nav-Filter (Dropdown in Shell)
            case 'navFilter':
                if (onNavFilter) {
                    onNavFilter(e.data.value);
                }
                break;

            // Zeitraum-Filter
            case 'periodFilter':
                if (onPeriodFilter) {
                    onPeriodFilter(e.data.value);
                }
                break;

            // Toolbar-Action
            case 'toolbarAction':
                const action = e.data.action;
                if (toolbarActions[action]) {
                    toolbarActions[action]();
                }
                break;
        }
    });
}

/**
 * Sendet Suchergebnisse an die Shell
 * @param {Array} results - Array von {id, name, type?, subtitle?}
 * @param {string} query - Suchbegriff
 * @param {string} headerText - Optional: Header-Text für Ergebnisse
 */
function sendSearchResults(results, query, headerText = null) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'searchResults',
            results: results.slice(0, 10), // Max 10 Ergebnisse
            query: query,
            headerText: headerText
        }, '*');
    }
}

/**
 * Scrollt zur Tabellenzeile und hebt sie hervor
 * @param {string} id - ID der Zeile (data-id Attribut)
 */
function highlightTableRow(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('highlight-flash');
        setTimeout(() => row.classList.remove('highlight-flash'), 2000);
    }
}

/**
 * Registriert Toolbar-Buttons bei der Shell
 * @param {Object} config - {actionButtons: [{id, text, icon, action, primary?}]}
 */
function registerShellToolbar(config) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'registerToolbar',
            config: config
        }, '*');
    }
}

// Exports
window.initShellListener = initShellListener;
window.sendSearchResults = sendSearchResults;
window.highlightTableRow = highlightTableRow;
window.registerShellToolbar = registerShellToolbar;
