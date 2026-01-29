/**
 * DRK Kosten-Ledger Funktionen
 * Automatische Ledger-Aktualisierung bei Attendance/Modal-Änderungen
 */

/**
 * Filtert Attendance tagesgenau nach WG-Zuordnung (Override > Wochen-Zuordnung)
 * Gibt tiefe Kopien zurück, bei denen day_X = false für Tage die nicht zu diesem WG gehören
 */
function filterAttendanceByWgAndDay(attendance, overrides, assignments, campaignAreaId, kw) {
    if (!attendance || attendance.length === 0) return [];

    const assignment = assignments?.find(a => a.kw === kw);
    const result = [];

    attendance.forEach(a => {
        // Wochen-Zuordnung für diesen Werber
        const werber = assignment?.campaign_assignment_werber?.find(w => w.werber_id === a.user_id);
        const wochenWgId = werber?.campaign_area_id;

        // Tiefe Kopie der Attendance
        const copy = { ...a };
        let hatRelevanteTage = false;

        for (let day = 0; day <= 5; day++) {
            if (copy[`day_${day}`] !== true) continue;

            // Override für diesen Werber + Tag?
            const override = (overrides || []).find(
                o => o.werber_id === a.user_id && o.day === day
            );
            const tagesWgId = override ? override.campaign_area_id : wochenWgId;

            if (tagesWgId !== campaignAreaId) {
                copy[`day_${day}`] = false;
            } else {
                hatRelevanteTage = true;
            }
        }

        if (hatRelevanteTage) {
            result.push(copy);
        }
    });

    return result;
}

/**
 * Aktualisiert den DRK-Kosten-Ledger für eine bestimmte KW
 * Wird aufgerufen bei: Attendance-Änderung ODER Kampagnen-Modal speichern
 *
 * @param {string} customerId - Kunden-UUID
 * @param {string} campaignId - Kampagnen-UUID
 * @param {string} campaignAreaId - Werbegebiet-UUID
 * @param {number} kw - Kalenderwoche (1-53)
 * @param {number} year - Jahr
 */
async function aktualisiereDrkKostenLedger(customerId, campaignId, campaignAreaId, kw, year) {
    const supabase = window.supabaseClient || window.parent?.supabaseClient || window.supabase;
    if (!supabase) {
        console.error('supabaseClient nicht verfügbar');
        return;
    }

    // 1. Kosten-Config aus campaign_areas laden (inkl. individuelle_kosten Flag)
    const { data: area, error: areaError } = await supabase
        .from('campaign_areas')
        .select('kosten, sonderposten, individuelle_kosten')
        .eq('id', campaignAreaId)
        .single();

    if (areaError || !area) {
        console.error('Fehler beim Laden des Gebiets:', areaError);
        return;
    }

    // 1b. Fallback auf Kunden-Kosten wenn WG keine individuellen hat
    let effectiveKosten = area.kosten;
    let effectiveSonderposten = area.sonderposten;

    if (!area.individuelle_kosten) {
        // Kampagnenspezifische Kunden-Kosten laden
        const { data: kundeConfig, error: kundeError } = await supabase
            .from('campaign_customer_config')
            .select('kosten, sonderposten')
            .eq('customer_id', customerId)
            .eq('campaign_id', campaignId)
            .maybeSingle();

        if (!kundeError && kundeConfig) {
            effectiveKosten = kundeConfig.kosten;
            effectiveSonderposten = kundeConfig.sonderposten;
        }
    }

    if (!effectiveKosten) return;

    // 2. Attendance für diese KW laden
    const { data: attendance, error: attError } = await supabase
        .from('campaign_attendance')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('kw', kw);

    if (attError) {
        console.error('Fehler beim Laden der Attendance:', attError);
        return;
    }

    // 3. Assignments laden (für Gebiet-Zuordnung)
    const { data: assignments, error: assError } = await supabase
        .from('campaign_assignments')
        .select('kw, campaign_assignment_werber(werber_id, campaign_area_id)')
        .eq('campaign_id', campaignId)
        .eq('kw', kw);

    if (assError) {
        console.error('Fehler beim Laden der Assignments:', assError);
        return;
    }

    // 3b. Overrides für diese KW laden
    const { data: overrides } = await supabase
        .from('campaign_assignment_overrides')
        .select('werber_id, day, campaign_area_id')
        .eq('campaign_id', campaignId)
        .eq('kw', kw);

    // 4. Attendance tagesgenau für dieses Gebiet filtern (mit Overrides)
    const gebietAttendance = filterAttendanceByWgAndDay(
        attendance, overrides, assignments, campaignAreaId, kw
    );

    // 5. Pro Kostenart berechnen und Ledger aktualisieren
    const kostenarten = ['kfz', 'unterkunft', 'verpflegung', 'kleidung', 'ausweise'];

    for (const kostenart of kostenarten) {
        const config = effectiveKosten[kostenart];
        if (!config?.aktiv || !config?.betrag) continue;

        // Pro-Wert normalisieren (Fallback für alte Daten)
        const pro = normalizePro(config.pro, kostenart);
        const zeitraum = normalizeZeitraum(config.zeitraum);

        // Verteilung prüfen (nur bei Kunden-Kosten relevant)
        const verteilung = config.verteilung || 'anteilig';
        const explizitWgId = config.explizit_wg_id;

        let relevantAttendance;
        if (verteilung === 'explizit' && explizitWgId) {
            // Explizit: Nur das ausgewählte WG bekommt ALLE Kosten
            if (campaignAreaId === explizitWgId) {
                // Dieses WG übernimmt alle Kosten → gesamte Kampagnen-Attendance
                relevantAttendance = attendance || [];
            } else {
                // Anderes WG → keine Kosten
                relevantAttendance = [];
            }
        } else {
            // Anteilig: Jedes WG zahlt für seine eigenen Werber (tagesgenau)
            relevantAttendance = gebietAttendance;
        }

        // Einheiten berechnen (async wegen "einmalig + person" Prüfung)
        let { einheiten, neueWerberIds } = await berechneEinheitenFuerKW(
            pro, zeitraum, relevantAttendance, kw,
            customerId, campaignId, campaignAreaId, kostenart
        );

        // Bei "pro: team" und Kunden-Kosten: Anteilige Aufteilung auf WGs
        if (pro === 'team' && zeitraum === 'tag' && !area.individuelle_kosten && verteilung !== 'explizit') {
            const anteil = berechneWgAnteil(attendance, assignments, overrides, campaignAreaId, kw);
            einheiten = einheiten * anteil;
        }

        const sollBetrag = einheiten * parseFloat(config.betrag);

        await aktualisiereLedgerEintrag(
            supabase, customerId, campaignId, campaignAreaId,
            kostenart, pro, zeitraum, config.betrag, config.artFrei || kostenart,
            sollBetrag, einheiten, kw, year, neueWerberIds
        );
    }

    // 6. Sonderposten analog behandeln
    if (effectiveSonderposten && Array.isArray(effectiveSonderposten)) {
        for (const sp of effectiveSonderposten) {
            if (!sp.name || !sp.summe) continue;

            const pro = normalizePro(sp.pro, 'sonderposten');
            const zeitraum = normalizeZeitraum(sp.zeitraum || 'einmalig');

            // Verteilung prüfen
            const verteilung = sp.verteilung || 'anteilig';
            const explizitWgId = sp.explizit_wg_id;

            let relevantAttendance;
            if (verteilung === 'explizit' && explizitWgId) {
                if (campaignAreaId === explizitWgId) {
                    relevantAttendance = attendance || [];
                } else {
                    relevantAttendance = [];
                }
            } else {
                relevantAttendance = gebietAttendance;
            }

            let { einheiten, neueWerberIds } = await berechneEinheitenFuerKW(
                pro, zeitraum, relevantAttendance, kw,
                customerId, campaignId, campaignAreaId, `sonderposten_${sp.name}`
            );

            // Bei "pro: team" und Kunden-Kosten: Anteilige Aufteilung auf WGs
            if (pro === 'team' && zeitraum === 'tag' && !area.individuelle_kosten && verteilung !== 'explizit') {
                const anteil = berechneWgAnteil(attendance, assignments, overrides, campaignAreaId, kw);
                einheiten = einheiten * anteil;
            }

            const sollBetrag = einheiten * parseFloat(sp.summe);

            await aktualisiereLedgerEintrag(
                supabase, customerId, campaignId, campaignAreaId,
                `sonderposten_${sp.name}`, pro, zeitraum, sp.summe, sp.name,
                sollBetrag, einheiten, kw, year, neueWerberIds
            );
        }
    }
}

/**
 * Berechnet den Anteil eines WGs an Team-Kosten (nach Tagen, tagesgenau mit Overrides)
 * Anteil = WG-Tage / Summe aller WG-Tage
 */
function berechneWgAnteil(attendance, assignments, overrides, campaignAreaId, kw) {
    if (!attendance || attendance.length === 0 || !assignments) return 0;

    const assignment = assignments.find(a => a.kw === kw);
    if (!assignment?.campaign_assignment_werber) return 1;

    // Tage pro WG zählen (tagesgenau mit Overrides)
    const tageProWg = {};

    attendance.forEach(a => {
        const werber = assignment.campaign_assignment_werber.find(w => w.werber_id === a.user_id);
        const wochenWgId = werber?.campaign_area_id;

        for (let day = 0; day <= 5; day++) {
            if (a[`day_${day}`] !== true) continue;

            // Override für diesen Werber + Tag?
            const override = (overrides || []).find(
                o => o.werber_id === a.user_id && o.day === day
            );
            const tagesWgId = override ? override.campaign_area_id : wochenWgId;

            if (!tagesWgId) continue;
            if (!tageProWg[tagesWgId]) tageProWg[tagesWgId] = new Set();
            tageProWg[tagesWgId].add(day);
        }
    });

    // Summe aller WG-Tage
    let gesamtWgTage = 0;
    for (const wgId in tageProWg) {
        gesamtWgTage += tageProWg[wgId].size;
    }

    if (gesamtWgTage === 0) return 0;

    // Anteil dieses WGs
    const wgTage = tageProWg[campaignAreaId]?.size || 0;
    return wgTage / gesamtWgTage;
}

/**
 * Normalisiert Pro-Werte (Fallback für alte Daten)
 */
function normalizePro(pro, kostenart) {
    if (pro === 'team' || pro === 'person') return pro;
    // Alte Werte mappen
    if (pro === 'nacht' || pro === 'tag' || pro === 'stueck' || pro === 'pp') return 'person';
    // KFZ ist immer team
    if (kostenart === 'kfz') return 'team';
    return 'team';
}

/**
 * Normalisiert Zeitraum-Werte (Fallback für alte Daten)
 */
function normalizeZeitraum(zeitraum) {
    if (['tag', 'woche', 'abschnitt', 'einmalig'].includes(zeitraum)) return zeitraum;
    if (zeitraum === 'monat') return 'abschnitt';
    return 'tag';
}

/**
 * Aktualisiert oder erstellt einen Ledger-Eintrag
 */
async function aktualisiereLedgerEintrag(
    supabase, customerId, campaignId, campaignAreaId,
    kostenart, pro, zeitraum, einzelbetrag, bezeichnung,
    sollBetrag, einheiten, kw, year, neueWerberIds
) {
    // Bestehenden Ledger-Eintrag prüfen
    const { data: existing } = await supabase
        .from('drk_cost_ledger')
        .select('id, betrag, invoice_id')
        .eq('customer_id', customerId)
        .eq('campaign_id', campaignId)
        .eq('campaign_area_id', campaignAreaId)
        .eq('kostenart', kostenart)
        .eq('kw', kw)
        .eq('year', year)
        .eq('typ', 'buchung')
        .maybeSingle();

    // Prüfen ob WIRKLICH abgerechnet (nicht nur Entwurf)
    let bereitsAbgerechnet = false;
    if (existing?.invoice_id) {
        const { data: invoice } = await supabase
            .from('invoices')
            .select('status')
            .eq('id', existing.invoice_id)
            .maybeSingle();
        // Nur bei echten Rechnungen (offen, bezahlt, etc.) - NICHT bei Entwurf
        bereitsAbgerechnet = invoice && invoice.status !== 'entwurf';
    }

    if (sollBetrag === 0) {
        // Keine Kosten → löschen oder Korrektur
        if (existing && !bereitsAbgerechnet) {
            await supabase.from('drk_cost_ledger').delete().eq('id', existing.id);
        } else if (existing && bereitsAbgerechnet) {
            // Korrektur-Buchung (Gegenbuchung)
            await supabase.from('drk_cost_ledger').insert({
                customer_id: customerId,
                campaign_id: campaignId,
                campaign_area_id: campaignAreaId,
                kostenart: kostenart,
                pro: pro,
                zeitraum: zeitraum,
                typ: 'korrektur',
                betrag: -existing.betrag,
                einheiten: einheiten,
                einzelbetrag: parseFloat(einzelbetrag),
                kw: kw,
                year: year,
                bezeichnung: bezeichnung,
                beschreibung: 'Korrektur: 0 Einheiten'
            });
        }
    } else if (!existing) {
        // Neuer Eintrag
        await supabase.from('drk_cost_ledger').insert({
            customer_id: customerId,
            campaign_id: campaignId,
            campaign_area_id: campaignAreaId,
            kostenart: kostenart,
            pro: pro,
            zeitraum: zeitraum,
            typ: 'buchung',
            betrag: sollBetrag,
            einheiten: einheiten,
            einzelbetrag: parseFloat(einzelbetrag),
            kw: kw,
            year: year,
            bezeichnung: bezeichnung
        });

        // Bei "einmalig + person": Tracking-Einträge für neue Werber erstellen
        if (zeitraum === 'einmalig' && pro === 'person' && neueWerberIds && neueWerberIds.length > 0) {
            const trackingEntries = neueWerberIds.map(userId => ({
                customer_id: customerId,
                campaign_id: campaignId,
                campaign_area_id: campaignAreaId,
                user_id: userId,
                kostenart: kostenart
            }));
            await supabase.from('drk_cost_person_tracking').upsert(trackingEntries, {
                onConflict: 'customer_id,campaign_id,campaign_area_id,user_id,kostenart'
            });
        }
    } else if (Math.abs(existing.betrag - sollBetrag) > 0.001) {
        // Betrag hat sich geändert
        if (!bereitsAbgerechnet) {
            // Update erlaubt
            await supabase.from('drk_cost_ledger')
                .update({ betrag: sollBetrag, einheiten: einheiten })
                .eq('id', existing.id);
        } else {
            // Korrektur-Buchung mit Differenz
            const differenz = sollBetrag - existing.betrag;
            await supabase.from('drk_cost_ledger').insert({
                customer_id: customerId,
                campaign_id: campaignId,
                campaign_area_id: campaignAreaId,
                kostenart: kostenart,
                pro: pro,
                zeitraum: zeitraum,
                typ: 'korrektur',
                betrag: differenz,
                einheiten: einheiten,
                einzelbetrag: parseFloat(einzelbetrag),
                kw: kw,
                year: year,
                bezeichnung: bezeichnung,
                beschreibung: `Korrektur: ${existing.betrag} → ${sollBetrag}`
            });
        }

        // Bei "einmalig + person": Auch bei Update neue Werber tracken
        if (zeitraum === 'einmalig' && pro === 'person' && neueWerberIds && neueWerberIds.length > 0) {
            const trackingEntries = neueWerberIds.map(userId => ({
                customer_id: customerId,
                campaign_id: campaignId,
                campaign_area_id: campaignAreaId,
                user_id: userId,
                kostenart: kostenart
            }));
            await supabase.from('drk_cost_person_tracking').upsert(trackingEntries, {
                onConflict: 'customer_id,campaign_id,campaign_area_id,user_id,kostenart'
            });
        }
    }
}

/**
 * Berechnet Einheiten für eine KW basierend auf pro/zeitraum
 * Bei "einmalig + person": Prüft gegen drk_cost_person_tracking Tabelle
 * Bei "woche"/"abschnitt": >= 3 Tage in diesem WG nötig
 *
 * @returns {Promise<{einheiten: number, neueWerberIds: string[]}>}
 */
async function berechneEinheitenFuerKW(pro, zeitraum, attendance, kw, customerId, campaignId, campaignAreaId, kostenart) {
    if (!attendance || attendance.length === 0) return { einheiten: 0, neueWerberIds: [] };

    // Tage zählen (ohne Sonntag = day_6)
    const tage = new Set();
    let personenTage = 0;
    const werberIds = new Set();
    const tageProPerson = {};

    attendance.forEach(a => {
        for (let day = 0; day <= 5; day++) {
            if (a[`day_${day}`] === true) {
                tage.add(day);
                personenTage++;
                werberIds.add(a.user_id);
                if (!tageProPerson[a.user_id]) tageProPerson[a.user_id] = 0;
                tageProPerson[a.user_id]++;
            }
        }
    });

    const teamTage = tage.size;

    if (zeitraum === 'tag') {
        return { einheiten: pro === 'team' ? teamTage : personenTage, neueWerberIds: [] };
    }
    if (zeitraum === 'woche') {
        if (pro === 'team') {
            // Team zählt nur wenn >= 3 Teamtage in diesem WG
            return { einheiten: teamTage >= 3 ? 1 : 0, neueWerberIds: [] };
        } else {
            // Person zählt nur wenn >= 3 Tage in diesem WG
            let qualifiziertePersonen = 0;
            for (const userId in tageProPerson) {
                if (tageProPerson[userId] >= 3) qualifiziertePersonen++;
            }
            return { einheiten: qualifiziertePersonen, neueWerberIds: [] };
        }
    }
    if (zeitraum === 'abschnitt') {
        if (pro === 'team') {
            // Abschnitt = 3 Wochen, pro KW: >= 3 Teamtage → 1/3, sonst 0
            return { einheiten: teamTage >= 3 ? 1/3 : 0, neueWerberIds: [] };
        } else {
            // Pro KW: Person mit >= 3 Tagen → 1/3 pro Person, sonst 0
            let qualifiziertePersonen = 0;
            for (const userId in tageProPerson) {
                if (tageProPerson[userId] >= 3) qualifiziertePersonen++;
            }
            return { einheiten: qualifiziertePersonen / 3, neueWerberIds: [] };
        }
    }
    if (zeitraum === 'einmalig') {
        const supabase = window.supabaseClient || window.parent?.supabaseClient || window.supabase;
        if (pro === 'team') {
            // Team einmalig: Prüfen ob bereits ein Eintrag existiert (egal welche KW)
            const { data: existing } = await supabase
                .from('drk_cost_ledger')
                .select('id')
                .eq('customer_id', customerId)
                .eq('campaign_id', campaignId)
                .eq('campaign_area_id', campaignAreaId)
                .eq('kostenart', kostenart)
                .eq('zeitraum', 'einmalig')
                .eq('typ', 'buchung')
                .limit(1);

            return { einheiten: (existing && existing.length > 0) ? 0 : 1, neueWerberIds: [] };
        } else {
            // Person einmalig: Prüfen gegen drk_cost_person_tracking Tabelle
            const { data: trackedWerber } = await supabase
                .from('drk_cost_person_tracking')
                .select('user_id')
                .eq('customer_id', customerId)
                .eq('campaign_id', campaignId)
                .eq('campaign_area_id', campaignAreaId)
                .eq('kostenart', kostenart);

            // Bereits getrackte Werber-IDs
            const bereitsGebucht = new Set((trackedWerber || []).map(t => t.user_id));

            // Nur neue Werber zählen
            const neueWerberIds = [];
            werberIds.forEach(id => {
                if (!bereitsGebucht.has(id)) {
                    neueWerberIds.push(id);
                }
            });

            return { einheiten: neueWerberIds.length, neueWerberIds };
        }
    }

    return { einheiten: 0, neueWerberIds: [] };
}

// Export für globale Nutzung
window.aktualisiereDrkKostenLedger = aktualisiereDrkKostenLedger;
window.berechneEinheitenFuerKW = berechneEinheitenFuerKW;
