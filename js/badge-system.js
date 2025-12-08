/**
 * Badge System - Zentrale Helper-Funktionen
 * Alle Dateien inkludieren diese Datei für einheitliches Badge-System
 */

// Initialen aus Namen generieren
function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// SVG Symbol für Badge-Typen (Neumitglied, Erhöhung, Bestandsmitglied, Storno)
function getBadgeSymbolSVG(type) {
    const icons = {
        neumitglied: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        erhoehung: '<svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
        bestandsmitglied: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>',
        storno: '<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>'
    };
    return icons[type] || '';
}

// Type-Row mit optionalen TC/Q Badges generieren
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

// Stufen-Badge HTML generieren (für Avatar)
function getStufeBadge(stufe) {
    if (!stufe) return '';
    const s = stufe.toLowerCase();
    return `<span class="user-badge__stufe user-badge__stufe--${s}">${stufe.toUpperCase()}</span>`;
}

// Komplettes Werber-Badge generieren (zentrale Helper-Funktion)
function createWerberBadge(options = {}) {
    const {
        name = 'Unbekannt',
        size = '',           // '', 'small', 'mini', 'large'
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

// Komplettes Badge für beliebigen Typ generieren
function createBadge(options = {}) {
    const {
        type = 'werber',     // 'kunde', 'werbegebiet', 'werber', 'kampagne', 'neumitglied', 'erhoehung', 'bestandsmitglied', 'storno'
        name = 'Unbekannt',
        size = '',           // '', 'small', 'mini', 'large'
        isTC = false,
        isQ = false,
        stufe = '',          // nur für Werber
        style = ''
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

    const avatarContent = useSymbol ? getBadgeSymbolSVG(type) : getInitials(name);
    const stufeBadge = (type === 'werber' && stufe) ? getStufeBadge(stufe) : '';
    const typeRow = type === 'werber' ? getBadgeTypeRow(typeLabels[type], isTC, isQ) : `<span class="user-badge__type">${typeLabels[type]}</span>`;

    return `<div class="user-badge user-badge--${type} ${sizeClass}"${styleAttr}>
        <div class="user-badge__avatar">
            ${avatarContent}
            ${stufeBadge}
        </div>
        <div class="user-badge__info">
            <span class="user-badge__name">${name}</span>
            ${typeRow}
        </div>
    </div>`;
}

// Stufen-Konfiguration (zentral für alle Dateien)
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

// Stufen-Name abrufen
function getStufeName(stufe) {
    return STUFEN_CONFIG[stufe?.toUpperCase()]?.name || stufe || 'Unbekannt';
}
