-- Migration 057: Customers erweitern für DRK-Rechnungsnummern

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS empfaenger_typ TEXT CHECK (empfaenger_typ IN ('OV', 'KV', 'LV')),
ADD COLUMN IF NOT EXISTS kunden_nr_ziffern CHAR(3),
ADD COLUMN IF NOT EXISTS rechnungsart TEXT DEFAULT 'zusammen' CHECK (rechnungsart IN ('zusammen', 'getrennt'));

COMMENT ON COLUMN customers.empfaenger_typ IS 'OV=Ortsverein, KV=Kreisverband, LV=Landesverband';
COMMENT ON COLUMN customers.kunden_nr_ziffern IS '3-stellige Nummer aus Kunden-ID für Rechnungsnummer';
COMMENT ON COLUMN customers.rechnungsart IS 'zusammen=alle WG auf einer Rechnung, getrennt=pro WG eine Rechnung';
