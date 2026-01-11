/**
 * Ledger-System Trigger Tests
 * Testet: INSERT, UPDATE (Storno, yearly_amount, werber_id), DELETE
 */

const SUPABASE_URL = 'https://lgztglycqtiwcmiydxnm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRnbHljcXRpd2NtaXlkeG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwNzYxNSwiZXhwIjoyMDc5MzgzNjE1fQ.54kSk9ZSUdQt6LKYWkblqgR6Sjev80W80qkNHYEbPgk';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function supabaseRequest(endpoint, method = 'GET', body = null) {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`${response.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

// Hilfsfunktionen
async function getUser(role = 'werber') {
    const data = await supabaseRequest(`users?role=eq.${role}&limit=1`);
    return data[0];
}

async function getCustomer() {
    const data = await supabaseRequest('customers?limit=1');
    return data[0];
}

async function getLedgerEntries(recordId) {
    const provisions = await supabaseRequest(`provisions_ledger?record_id=eq.${recordId}&order=created_at.asc`);
    const billing = await supabaseRequest(`customer_billing_ledger?record_id=eq.${recordId}&order=created_at.asc`);
    return { provisions, billing };
}

// Test-Ergebnisse
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.log(`  ❌ ${message}`);
        failed++;
    }
}

// ===================
// TESTS
// ===================

async function test1_insertRecord() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Record INSERT - Ledger-Einträge erstellt?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Werber und Kunde holen
    const werber = await getUser('werber');
    const customer = await getCustomer();

    if (!werber || !customer) {
        console.log('  ⚠️  Kein Werber oder Kunde gefunden - Test übersprungen');
        return null;
    }

    console.log(`  Werber: ${werber.name} (${werber.id})`);
    console.log(`  Kunde: ${customer.name} (${customer.id})`);

    // Test-Record erstellen
    const testRecord = {
        member_first_name: 'Test',
        member_last_name: 'Ledger',
        yearly_amount: 120, // = 10 EH
        record_type: 'neumitglied',
        record_status: 'aktiv',
        customer_id: customer.id,
        werber_id: werber.id,
        kw: 2,
        year: 2026,
        start_date: '2026-01-11'
    };

    console.log(`  Erstelle Test-Record: ${testRecord.yearly_amount} EUR/Jahr = ${testRecord.yearly_amount / 12} EH`);

    const created = await supabaseRequest('records', 'POST', testRecord);
    const recordId = created[0].id;
    console.log(`  Record erstellt: ${recordId}`);

    // Kurz warten damit Trigger ausgeführt wird
    await new Promise(r => setTimeout(r, 500));

    // Ledger-Einträge prüfen
    const { provisions, billing } = await getLedgerEntries(recordId);

    console.log('\n  Provisions-Ledger Einträge:');
    provisions.forEach(p => {
        console.log(`    - ${p.kategorie}: ${p.einheiten} EH (${p.typ})`);
    });

    console.log('\n  Customer-Billing-Ledger Einträge:');
    billing.forEach(b => {
        console.log(`    - ${b.jahreseuros} EUR (${b.typ})`);
    });

    // Assertions
    assert(provisions.length >= 1, 'Mindestens 1 Eintrag im provisions_ledger');

    const werbenEntry = provisions.find(p => p.kategorie === 'werben');
    assert(werbenEntry !== undefined, 'Werben-Eintrag vorhanden');
    assert(werbenEntry && parseFloat(werbenEntry.einheiten) === 10, 'Einheiten korrekt (10 EH für 120 EUR)');
    assert(werbenEntry && werbenEntry.typ === 'provision', 'Typ ist "provision"');

    assert(billing.length >= 1, 'Mindestens 1 Eintrag im customer_billing_ledger');
    const billingEntry = billing[0];
    assert(billingEntry && parseFloat(billingEntry.jahreseuros) === 120, 'Jahreseuros korrekt (120)');

    return recordId;
}

async function test2_stornoRecord(recordId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Record STORNO - Gegenbuchungen erstellt?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!recordId) {
        console.log('  ⚠️  Kein Record-ID - Test übersprungen');
        return null;
    }

    // Record stornieren
    console.log(`  Storniere Record: ${recordId}`);
    await supabaseRequest(`records?id=eq.${recordId}`, 'PATCH', { record_status: 'storno' });

    await new Promise(r => setTimeout(r, 500));

    // Ledger-Einträge prüfen
    const { provisions, billing } = await getLedgerEntries(recordId);

    console.log('\n  Provisions-Ledger Einträge nach Storno:');
    provisions.forEach(p => {
        console.log(`    - ${p.kategorie}: ${p.einheiten} EH (${p.typ})`);
    });

    console.log('\n  Customer-Billing-Ledger nach Storno:');
    billing.forEach(b => {
        console.log(`    - ${b.jahreseuros} EUR (${b.typ})`);
    });

    // Assertions
    const stornoEntries = provisions.filter(p => p.typ === 'storno');
    assert(stornoEntries.length >= 1, 'Storno-Gegenbuchung im provisions_ledger');

    const stornoWerben = stornoEntries.find(s => s.kategorie === 'werben');
    assert(stornoWerben && parseFloat(stornoWerben.einheiten) === -10, 'Storno-EH korrekt (-10)');

    // Summe sollte 0 sein
    const totalEH = provisions.reduce((sum, p) => sum + parseFloat(p.einheiten), 0);
    assert(totalEH === 0, `EH-Saldo ist 0 nach Storno (aktuell: ${totalEH})`);

    const billingStorno = billing.filter(b => b.typ === 'storno');
    assert(billingStorno.length >= 1, 'Storno-Gegenbuchung im customer_billing_ledger');

    const totalJE = billing.reduce((sum, b) => sum + parseFloat(b.jahreseuros), 0);
    assert(totalJE === 0, `Jahreseuros-Saldo ist 0 nach Storno (aktuell: ${totalJE})`);

    return recordId;
}

async function test3_reaktivierenRecord(recordId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Record REAKTIVIEREN - Neue Buchungen erstellt?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!recordId) {
        console.log('  ⚠️  Kein Record-ID - Test übersprungen');
        return null;
    }

    // Record reaktivieren
    console.log(`  Reaktiviere Record: ${recordId}`);
    await supabaseRequest(`records?id=eq.${recordId}`, 'PATCH', { record_status: 'aktiv' });

    await new Promise(r => setTimeout(r, 500));

    // Ledger-Einträge prüfen
    const { provisions, billing } = await getLedgerEntries(recordId);

    console.log('\n  Provisions-Ledger nach Reaktivierung:');
    const summary = {};
    provisions.forEach(p => {
        if (!summary[p.kategorie]) summary[p.kategorie] = { provision: 0, storno: 0 };
        summary[p.kategorie][p.typ] = (summary[p.kategorie][p.typ] || 0) + parseFloat(p.einheiten);
    });
    Object.entries(summary).forEach(([kat, vals]) => {
        console.log(`    - ${kat}: ${vals.provision || 0} EH (provision), ${vals.storno || 0} EH (storno)`);
    });

    // Assertions
    const totalEH = provisions.reduce((sum, p) => sum + parseFloat(p.einheiten), 0);
    assert(totalEH === 10, `EH-Saldo ist wieder 10 nach Reaktivierung (aktuell: ${totalEH})`);

    const totalJE = billing.reduce((sum, b) => sum + parseFloat(b.jahreseuros), 0);
    assert(totalJE === 120, `Jahreseuros-Saldo ist wieder 120 (aktuell: ${totalJE})`);

    return recordId;
}

async function test4_aenderungYearlyAmount(recordId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: yearly_amount ÄNDERN - Korrektur-Buchung erstellt?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!recordId) {
        console.log('  ⚠️  Kein Record-ID - Test übersprungen');
        return null;
    }

    // yearly_amount ändern: 120 -> 240 (Differenz: +120 = +10 EH)
    console.log('  Ändere yearly_amount: 120 -> 240 EUR (Differenz: +10 EH)');
    await supabaseRequest(`records?id=eq.${recordId}`, 'PATCH', { yearly_amount: 240 });

    await new Promise(r => setTimeout(r, 500));

    // Ledger-Einträge prüfen
    const { provisions, billing } = await getLedgerEntries(recordId);

    console.log('\n  Provisions-Ledger nach Änderung:');
    provisions.forEach(p => {
        console.log(`    - ${p.kategorie}: ${p.einheiten} EH (${p.typ}) ${p.beschreibung || ''}`);
    });

    // Korrektur-Buchungen prüfen
    const korrekturen = provisions.filter(p => p.typ === 'korrektur');
    assert(korrekturen.length >= 1, 'Korrektur-Buchung im provisions_ledger vorhanden');

    const totalEH = provisions.reduce((sum, p) => sum + parseFloat(p.einheiten), 0);
    assert(totalEH === 20, `EH-Saldo ist 20 nach Erhöhung (aktuell: ${totalEH})`);

    const totalJE = billing.reduce((sum, b) => sum + parseFloat(b.jahreseuros), 0);
    assert(totalJE === 240, `Jahreseuros-Saldo ist 240 (aktuell: ${totalJE})`);

    return recordId;
}

async function test5_aenderungWerberId(recordId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 5: werber_id ÄNDERN - Storno alt + Buchung neu?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!recordId) {
        console.log('  ⚠️  Kein Record-ID - Test übersprungen');
        return recordId;
    }

    // Aktuellen Werber holen
    const record = await supabaseRequest(`records?id=eq.${recordId}`);
    const currentWerberId = record[0].werber_id;

    // Anderen Werber finden
    const otherWerber = await supabaseRequest(`users?role=eq.werber&id=neq.${currentWerberId}&limit=1`);

    if (otherWerber.length === 0) {
        console.log('  ⚠️  Kein zweiter Werber gefunden - Test übersprungen');
        return recordId;
    }

    const newWerberId = otherWerber[0].id;
    console.log(`  Ändere Werber: ${currentWerberId} -> ${newWerberId}`);

    // Vorher: Ledger-Einträge zählen
    const { provisions: beforeProv } = await getLedgerEntries(recordId);
    const beforeCount = beforeProv.filter(p => p.kategorie === 'werben').length;

    // Werber ändern
    await supabaseRequest(`records?id=eq.${recordId}`, 'PATCH', { werber_id: newWerberId });

    await new Promise(r => setTimeout(r, 500));

    // Ledger-Einträge prüfen
    const { provisions } = await getLedgerEntries(recordId);

    console.log('\n  Provisions-Ledger Werben-Einträge:');
    const werbenEntries = provisions.filter(p => p.kategorie === 'werben');
    werbenEntries.forEach(p => {
        console.log(`    - ${p.user_id.substring(0, 8)}...: ${p.einheiten} EH (${p.typ}) ${p.beschreibung || ''}`);
    });

    // Sollte mehr Einträge haben (Storno alter + Buchung neuer)
    assert(werbenEntries.length > beforeCount, 'Neue Einträge für Werber-Wechsel vorhanden');

    // Neuer Werber sollte positive EH haben
    const newWerberEntries = provisions.filter(p => p.kategorie === 'werben' && p.user_id === newWerberId);
    const newWerberEH = newWerberEntries.reduce((sum, p) => sum + parseFloat(p.einheiten), 0);
    assert(newWerberEH === 20, `Neuer Werber hat 20 EH (aktuell: ${newWerberEH})`);

    return recordId;
}

async function test6_deleteRecord(recordId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 6: Record DELETE - Gegenbuchungen erstellt?');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!recordId) {
        console.log('  ⚠️  Kein Record-ID - Test übersprungen');
        return;
    }

    // Record löschen
    console.log(`  Lösche Record: ${recordId}`);
    await supabaseRequest(`records?id=eq.${recordId}`, 'DELETE');

    await new Promise(r => setTimeout(r, 500));

    // Ledger-Einträge prüfen (sollten noch existieren wegen ON DELETE SET NULL)
    const { provisions, billing } = await getLedgerEntries(recordId);

    console.log('\n  Provisions-Ledger nach Löschung:');
    const totalEH = provisions.reduce((sum, p) => sum + parseFloat(p.einheiten), 0);
    console.log(`    Total EH: ${totalEH}`);

    console.log('\n  Customer-Billing-Ledger nach Löschung:');
    const totalJE = billing.reduce((sum, b) => sum + parseFloat(b.jahreseuros), 0);
    console.log(`    Total Jahreseuros: ${totalJE}`);

    // Nach DELETE-Trigger sollte Saldo 0 sein
    assert(totalEH === 0, `EH-Saldo ist 0 nach Löschung (aktuell: ${totalEH})`);
    assert(totalJE === 0, `Jahreseuros-Saldo ist 0 nach Löschung (aktuell: ${totalJE})`);
}

// ===================
// MAIN
// ===================

async function runTests() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     LEDGER-SYSTEM TRIGGER TESTS                          ║');
    console.log('║     Testet: INSERT, UPDATE (Storno, Betrag), DELETE      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    try {
        let recordId = await test1_insertRecord();
        recordId = await test2_stornoRecord(recordId);
        recordId = await test3_reaktivierenRecord(recordId);
        recordId = await test4_aenderungYearlyAmount(recordId);
        recordId = await test5_aenderungWerberId(recordId);
        await test6_deleteRecord(recordId);

        console.log('\n══════════════════════════════════════════════════════════');
        console.log(`ERGEBNIS: ${passed} bestanden, ${failed} fehlgeschlagen`);
        console.log('══════════════════════════════════════════════════════════');

        if (failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ FEHLER:', error.message);
        process.exit(1);
    }
}

runTests();
