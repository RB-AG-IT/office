/**
 * ========================================
 * EMPLOYEE CARD COMPONENT
 * ========================================
 * Einheitliches Mitarbeiter-Mini-Menü für das gesamte System
 *
 * Verwendung:
 * 1. Script einbinden: <script src="components/employee-card.js"></script>
 * 2. Container mit data-attribute:
 *    <div class="employee-card-trigger"
 *         data-employee-id="uuid"
 *         data-employee-name="Max Mustermann"
 *         data-employee-role="EMA"
 *         data-employee-avatar="url/to/photo.jpg">
 *    </div>
 *
 * Oder programmatisch:
 *    EmployeeCard.create(container, { id, name, role, avatar, ... })
 */

const EmployeeCard = {
    // Aktives Popup (nur eins gleichzeitig)
    activePopup: null,

    // Karrierestufen-Daten
    careerLevels: {
        'SMA': { name: 'Standard Marketing Agent', level: 1, color: '#6b7280' },
        'EMA': { name: 'Experienced Marketing Agent', level: 2, color: '#3b82f6' },
        'JMM': { name: 'Junior Marketing Manager', level: 3, color: '#8b5cf6' },
        'EMM': { name: 'Experienced Marketing Manager', level: 4, color: '#f59e0b' },
        'CEMM': { name: 'Chief Experienced Marketing Manager', level: 5, color: '#f97316' },
        'SPB': { name: 'Senior Partner Bronze', level: 6, color: '#cd7f32' },
        'KAD': { name: 'Kader', level: 7, color: '#c0c0c0' },
        'FUE': { name: 'Führungskraft', level: 8, color: '#ffd700' }
    },

    // Initialisierung - alle Trigger-Elemente finden und aktivieren
    init() {
        document.querySelectorAll('.employee-card-trigger:not([data-ec-initialized])').forEach(trigger => {
            this.attachTrigger(trigger);
            trigger.setAttribute('data-ec-initialized', 'true');
        });

        // Click-Outside Handler
        document.addEventListener('click', (e) => {
            if (this.activePopup && !this.activePopup.contains(e.target) &&
                !e.target.closest('.employee-card-trigger')) {
                this.closePopup();
            }
        });

        // Escape Handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activePopup) {
                this.closePopup();
            }
        });
    },

    // Trigger-Element erstellen und Event-Handler anhängen
    attachTrigger(element) {
        const data = {
            id: element.dataset.employeeId,
            name: element.dataset.employeeName || 'Unbekannt',
            role: element.dataset.employeeRole || 'SMA',
            avatar: element.dataset.employeeAvatar,
            badges: element.dataset.employeeBadges ? JSON.parse(element.dataset.employeeBadges) : [],
            vorschuss: parseFloat(element.dataset.employeeVorschuss) || 0,
            ruecklage: parseFloat(element.dataset.employeeRuecklage) || 0,
            isNew: element.dataset.employeeNew === 'true',
            isTC: element.dataset.employeeTc === 'true',
            isQM: element.dataset.employeeQm === 'true',
            anreise: element.dataset.employeeAnreise
        };

        // Mini-Card rendern
        element.innerHTML = this.renderMiniCard(data);

        // Click Handler für Popup
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPopup(element, data);
        });
    },

    // Programmatische Erstellung
    create(container, data) {
        container.classList.add('employee-card-trigger');
        container.dataset.employeeId = data.id || '';
        container.dataset.employeeName = data.name || 'Unbekannt';
        container.dataset.employeeRole = data.role || 'SMA';
        if (data.avatar) container.dataset.employeeAvatar = data.avatar;
        if (data.badges) container.dataset.employeeBadges = JSON.stringify(data.badges);
        if (data.vorschuss) container.dataset.employeeVorschuss = data.vorschuss;
        if (data.ruecklage) container.dataset.employeeRuecklage = data.ruecklage;
        if (data.isNew) container.dataset.employeeNew = 'true';
        if (data.isTC) container.dataset.employeeTc = 'true';
        if (data.isQM) container.dataset.employeeQm = 'true';
        if (data.anreise) container.dataset.employeeAnreise = data.anreise;

        this.attachTrigger(container);
        return container;
    },

    // Mini-Card HTML
    renderMiniCard(data) {
        const level = this.careerLevels[data.role] || this.careerLevels['SMA'];
        const initials = this.getInitials(data.name);

        let badges = '';
        if (data.isTC) {
            badges += '<span class="ec-mini-badge ec-tc">TC</span>';
        }
        if (data.isQM) {
            badges += '<span class="ec-mini-badge ec-qm">QM</span>';
        }
        if (data.isNew) {
            badges += '<span class="ec-mini-badge ec-new">NEU</span>';
        }
        if (data.anreise) {
            badges += `<span class="ec-mini-badge ec-anreise" title="Anreise: ${data.anreise}">✈</span>`;
        }

        return `
            <div class="ec-mini">
                <div class="ec-mini-avatar" style="background: ${this.getAvatarGradient(data.role)}">
                    ${data.avatar ? `<img src="${data.avatar}" alt="${data.name}">` : initials}
                </div>
                <div class="ec-mini-info">
                    <span class="ec-mini-name">${data.name}</span>
                    <span class="ec-mini-role" style="color: ${level.color}">${data.role}</span>
                </div>
                <div class="ec-mini-badges">${badges}</div>
            </div>
        `;
    },

    // Popup anzeigen
    showPopup(trigger, data) {
        // Altes Popup schließen
        this.closePopup();

        const level = this.careerLevels[data.role] || this.careerLevels['SMA'];
        const initials = this.getInitials(data.name);

        // Popup erstellen
        const popup = document.createElement('div');
        popup.className = 'ec-popup';

        // Badges HTML
        let badgesHtml = '';
        if (data.badges && data.badges.length > 0) {
            badgesHtml = `
                <div class="ec-popup-section">
                    <div class="ec-popup-section-title">Badges & Achievements</div>
                    <div class="ec-popup-badges">
                        ${data.badges.map(b => `<span class="ec-badge" title="${b.title || b}">${b.icon || '🏆'} ${b.name || b}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Finanzen HTML
        let financesHtml = '';
        if (data.vorschuss > 0 || data.ruecklage > 0) {
            financesHtml = `
                <div class="ec-popup-section">
                    <div class="ec-popup-section-title">Finanzen</div>
                    <div class="ec-popup-finances">
                        ${data.vorschuss > 0 ? `
                            <div class="ec-finance-item">
                                <span class="ec-finance-label">Offener Vorschuss</span>
                                <span class="ec-finance-value ec-warning">${this.formatCurrency(data.vorschuss)}</span>
                            </div>
                        ` : ''}
                        ${data.ruecklage > 0 ? `
                            <div class="ec-finance-item">
                                <span class="ec-finance-label">Stornorücklage</span>
                                <span class="ec-finance-value">${this.formatCurrency(data.ruecklage)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // Rollen-Tags
        let roleTagsHtml = '';
        if (data.isTC || data.isQM || data.isNew) {
            roleTagsHtml = '<div class="ec-popup-role-tags">';
            if (data.isTC) roleTagsHtml += '<span class="ec-role-tag ec-tc">Teamchef</span>';
            if (data.isQM) roleTagsHtml += '<span class="ec-role-tag ec-qm">Quality Manager</span>';
            if (data.isNew) roleTagsHtml += '<span class="ec-role-tag ec-new">Neuer Mitarbeiter</span>';
            roleTagsHtml += '</div>';
        }

        popup.innerHTML = `
            <div class="ec-popup-header">
                <div class="ec-popup-avatar" style="background: ${this.getAvatarGradient(data.role)}">
                    ${data.avatar ? `<img src="${data.avatar}" alt="${data.name}">` : initials}
                </div>
                <div class="ec-popup-info">
                    <h3 class="ec-popup-name">${data.name}</h3>
                    <div class="ec-popup-role">
                        <span class="ec-role-badge" style="background: ${level.color}">${data.role}</span>
                        <span class="ec-role-name">${level.name}</span>
                    </div>
                    ${roleTagsHtml}
                </div>
                <button class="ec-popup-close" onclick="EmployeeCard.closePopup()">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            ${badgesHtml}
            ${financesHtml}

            <div class="ec-popup-actions">
                <button class="ec-action-btn ec-primary" onclick="EmployeeCard.openProfile('${data.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Profil öffnen
                </button>
                <button class="ec-action-btn" onclick="EmployeeCard.openAbrechnung('${data.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    Abrechnung
                </button>
            </div>
        `;

        document.body.appendChild(popup);
        this.activePopup = popup;

        // Position berechnen
        this.positionPopup(trigger, popup);

        // Animation
        requestAnimationFrame(() => {
            popup.classList.add('ec-popup-visible');
        });
    },

    // Popup positionieren
    positionPopup(trigger, popup) {
        const triggerRect = trigger.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();

        let top = triggerRect.bottom + 8;
        let left = triggerRect.left;

        // Rechts rausragen verhindern
        if (left + popupRect.width > window.innerWidth - 16) {
            left = window.innerWidth - popupRect.width - 16;
        }

        // Unten rausragen verhindern - dann oben anzeigen
        if (top + popupRect.height > window.innerHeight - 16) {
            top = triggerRect.top - popupRect.height - 8;
        }

        // Links nicht negativ
        if (left < 16) left = 16;

        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    },

    // Popup schließen
    closePopup() {
        if (this.activePopup) {
            this.activePopup.classList.remove('ec-popup-visible');
            setTimeout(() => {
                if (this.activePopup) {
                    this.activePopup.remove();
                    this.activePopup = null;
                }
            }, 200);
        }
    },

    // Profil öffnen
    openProfile(employeeId) {
        this.closePopup();
        if (window.parent && window.parent.location) {
            window.parent.location.hash = 'employees';
            // Dann zum Profil navigieren
            setTimeout(() => {
                const iframe = window.parent.document.querySelector('#content-frame');
                if (iframe) {
                    iframe.src = `mitarbeiter/profil.html?id=${employeeId}`;
                }
            }, 100);
        }
    },

    // Abrechnung öffnen
    openAbrechnung(employeeId) {
        this.closePopup();
        if (window.parent && window.parent.location) {
            window.parent.location.hash = 'billing';
            setTimeout(() => {
                const iframe = window.parent.document.querySelector('#content-frame');
                if (iframe) {
                    iframe.src = `abrechnungen/werber.html?id=${employeeId}`;
                }
            }, 100);
        }
    },

    // Hilfsfunktionen
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    getAvatarGradient(role) {
        const gradients = {
            'SMA': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            'EMA': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            'JMM': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            'EMM': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'CEMM': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            'SPB': 'linear-gradient(135deg, #cd7f32 0%, #b8860b 100%)',
            'KAD': 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)',
            'FUE': 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)'
        };
        return gradients[role] || gradients['SMA'];
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    }
};

// Auto-Init bei DOM-Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EmployeeCard.init());
} else {
    EmployeeCard.init();
}

// Re-Init bei dynamischen Inhalten
const employeeCardObserver = new MutationObserver(() => {
    EmployeeCard.init();
});

employeeCardObserver.observe(document.body, {
    childList: true,
    subtree: true
});
