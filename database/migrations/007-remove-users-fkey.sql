-- Foreign Key von users-Tabelle entfernen
-- Damit können Botschafter ohne Auth-Account angelegt werden

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
