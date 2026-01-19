-- Neues Feld für "Keine Unterkunftskosten" in campaign_attendance
ALTER TABLE public.campaign_attendance
ADD COLUMN IF NOT EXISTS keine_unterkunft BOOLEAN DEFAULT false;

COMMENT ON COLUMN campaign_attendance.keine_unterkunft IS
'Wenn true, werden keine Unterkunftskosten berechnet (Person wohnt selbst/trägt Kosten selbst)';
