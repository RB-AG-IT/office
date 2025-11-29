/**
 * ========================================
 * EINHEITLICHES MODAL-DIALOG-SYSTEM
 * ========================================
 *
 * Dieses System ersetzt ALLE nativen Browser-Dialoge (alert, confirm, prompt)
 * durch schöne, einheitliche Modals in der Mitte des Bildschirms.
 *
 * VERWENDUNG:
 * -----------
 *
 * 1. ALERT (Nur Hinweis anzeigen):
 *    await showAlert('Erfolg', 'Daten wurden gespeichert!', 'success');
 *
 *    Typen: 'info', 'success', 'warning', 'error'
 *
 * 2. CONFIRM (Ja/Nein Bestätigung):
 *    const result = await showConfirm('Löschen?', 'Wirklich löschen?', 'warning');
 *    if (result) {
 *        // Benutzer hat bestätigt
 *    }
 *
 * 3. PROMPT (Eingabe vom Benutzer):
 *    const input = await showPrompt('Eingabe', 'Name eingeben:', 'Standardwert');
 *    if (input !== null) {
 *        // Benutzer hat etwas eingegeben
 *    }
 *
 * NIEMALS mehr verwenden:
 * - alert()       -> showAlert()
 * - confirm()     -> showConfirm()
 * - prompt()      -> showPrompt()
 *
 * Die Styles sind in /office/styles.css definiert (suche nach "MODAL-DIALOG-SYSTEM")
 *
 * ========================================
 */

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
                    <input type="text" class="custom-modal-input"
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
        const input = overlay.querySelector('.custom-modal-input');

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

// Hinweis in Konsole
console.log('%c Modal-System geladen ', 'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px;');
console.log('Verfügbare Funktionen: showAlert(), showConfirm(), showPrompt()');
