/**
 * DRK Kosten-Ledger Funktionen
 * Automatische Ledger-Aktualisierung bei Attendance/Modal-Änderungen
 */

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
        // Kunden-Kosten laden
        const { data: kunde, error: kundeError } = await supabase
            .from('customers')
            .select('kosten, sonderposten')
            .eq('id', customerId)
            .single();

        if (!kundeError && kunde) {
            effectiveKosten = kunde.kosten;
            effectiveSonderposten = kunde.sonderposten;
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

    // 4. Nur Attendance für dieses Gebiet filtern
    const gebietAttendance = (attendance || []).filter(a => {
        const assignment = assignments?.find(ass => ass.kw === kw);
        const werber = assignment?.campaign_assignment_werber?.find(w => w.werber_id === a.user_id);
        return werber?.campaign_area_id === campaignAreaId;
    });

    // 5. Pro Kostenart berechnen und Ledger aktualisieren
    const kostenarten = ['kfz', 'unterkunft', 'verpflegung', 'kleidung', 'ausweise'];

    for (const kostenart of kostenarten) {
        const config = effectiveKosten[kostenart];
        if (!config?.aktiv || !config?.betrag) continue;

        // Pro-Wert normalisieren (Fallback für alte Daten)
        const pro = normalizePro(config.pro, kostenart);
        const zeitraum = normalizeZeitraum(config.zeitraum);

        // Einheiten berechnen (async wegen "einmalig + person" Prüfung)
        const { einheiten, neueWerberIds } = await berechneEinheitenFuerKW(
            pro, zeitraum, gebietAttendance, kw,
            customerId, campaignId, campaignAreaId, kostenart
        );
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

            const { einheiten, neueWerberIds } = await berechneEinheitenFuerKW(
                pro, zeitraum, gebietAttendance, kw,
                customerId, campaignId, campaignAreaId, `sonderposten_${sp.name}`
            );
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

    const bereitsAbgerechnet = existing?.invoice_id != null;

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
 *
 * @returns {Promise<{einheiten: number, neueWerberIds: string[]}>}
 */
async function berechneEinheitenFuerKW(pro, zeitraum, attendance, kw, customerId, campaignId, campaignAreaId, kostenart) {
    if (!attendance || attendance.length === 0) return { einheiten: 0, neueWerberIds: [] };

    // Tage zählen (ohne Sonntag = day_6)
    const tage = new Set();
    let personenTage = 0;
    const werberIds = new Set();

    attendance.forEach(a => {
        for (let day = 0; day <= 5; day++) {
            if (a[`day_${day}`] === true) {
                tage.add(day);
                personenTage++;
                werberIds.add(a.user_id);
            }
        }
    });

    const teamTage = tage.size;
    const personen = werberIds.size;

    if (zeitraum === 'tag') {
        return { einheiten: pro === 'team' ? teamTage : personenTage, neueWerberIds: [] };
    }
    if (zeitraum === 'woche') {
        // 1 Woche wenn mind. 1 Tag aktiv
        return { einheiten: teamTage > 0 ? (pro === 'team' ? 1 : personen) : 0, neueWerberIds: [] };
    }
    if (zeitraum === 'abschnitt') {
        // Abschnitt = 3 Wochen, pro KW anteilig 1/3
        return { einheiten: teamTage > 0 ? (pro === 'team' ? 1/3 : personen/3) : 0, neueWerberIds: [] };
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
