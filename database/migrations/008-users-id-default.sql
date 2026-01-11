-- Default UUID für users.id setzen
-- Damit können Botschafter ohne explizite ID angelegt werden

ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
