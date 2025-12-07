/**
 * Wiederverwendbares Kalender-Modal
 * Verwendung: CalendarModal.init() aufrufen, dann CalendarModal.open(callback)
 */

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
                            <button class="calendar-modal-close" onclick="CalendarModal.close()">×</button>
                        </div>
                        <div class="calendar-modal-body">
                            <div class="calendar-inputs">
                                <div class="calendar-field">
                                    <label>Von</label>
                                    <input type="text" id="calendarFromInput" placeholder="TT.MM.JJJJ">
                                </div>
                                <div class="calendar-field">
                                    <label>Bis</label>
                                    <input type="text" id="calendarToInput" placeholder="TT.MM.JJJJ">
                                </div>
                            </div>
                            <div class="calendar-container" id="calendarContainer">
                                <div class="calendar-nav">
                                    <button type="button" class="calendar-nav-btn" onclick="CalendarModal.navigate(-3)" title="3 Monate zurück">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
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
                                    <button type="button" class="calendar-nav-btn" onclick="CalendarModal.navigate(3)" title="3 Monate vor">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
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
                        <div class="calendar-modal-footer">
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
                toInput.classList.remove('active');
            });

            fromInput.addEventListener('input', function() {
                const date = parseGermanDate(this.value);
                if (date) {
                    calendarStartDate = date;
                    renderCalendars();
                }
            });
        }

        if (toInput) {
            toInput.addEventListener('focus', () => {
                isSelectingStart = false;
                toInput.classList.add('active');
                fromInput.classList.remove('active');
            });

            toInput.addEventListener('input', function() {
                const date = parseGermanDate(this.value);
                if (date) {
                    calendarEndDate = date;
                    renderCalendars();
                }
            });
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

        document.getElementById('calendarFromInput').value = '';
        document.getElementById('calendarToInput').value = '';
        document.getElementById('calendarFromInput').classList.add('active');
        document.getElementById('calendarToInput').classList.remove('active');

        renderCalendars();
        document.getElementById('calendarModal').classList.add('active');
    }

    function close() {
        document.getElementById('calendarModal').classList.remove('active');
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
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            let classes = 'calendar-day';

            if (date.getTime() === today.getTime()) {
                classes += ' today';
            }

            if (calendarStartDate && calendarEndDate) {
                const start = calendarStartDate.getTime();
                const end = calendarEndDate.getTime();
                const current = date.getTime();

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
                const current = date.getTime();
                const rangeStart = Math.min(start, hover);
                const rangeEnd = Math.max(start, hover);

                if (current === start) {
                    classes += ' selected';
                } else if (current > rangeStart && current < rangeEnd) {
                    classes += ' in-range hover-preview';
                } else if (current === rangeEnd && current !== start) {
                    classes += ' in-range hover-preview';
                }
            } else if (calendarStartDate && date.getTime() === calendarStartDate.getTime()) {
                classes += ' selected';
            }

            html += `<div class="${classes}" data-date="${date.toISOString()}">${day}</div>`;
        }

        // Nächster Monat
        const totalCells = startDay + lastDay.getDate();
        const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    function selectDate(date) {
        date.setHours(0, 0, 0, 0);

        if (isSelectingStart || !calendarStartDate) {
            isSelectingStart = false;
            calendarStartDate = date;
            calendarEndDate = null;
            calendarHoverDate = null;
            document.getElementById('calendarFromInput').classList.remove('active');
            document.getElementById('calendarToInput').classList.add('active');
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

        document.getElementById('calendarFromInput').value = calendarStartDate ? formatGermanDate(calendarStartDate) : '';
        document.getElementById('calendarToInput').value = calendarEndDate ? formatGermanDate(calendarEndDate) : '';

        renderCalendars();
    }

    function formatGermanDate(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function parseGermanDate(str) {
        if (!str) return null;
        const parts = str.split('.');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        const date = new Date(year, month, day);
        if (date.getDate() !== day || date.getMonth() !== month) return null;
        return date;
    }

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

// Auto-Init wenn DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CalendarModal.init());
} else {
    CalendarModal.init();
}
