# 🚀 SUPABASE SETUP - Schritt-für-Schritt Anleitung

## 📋 Übersicht

Diese Anleitung führt dich durch das komplette Supabase-Setup für Base Portal.

**Benötigte Zeit:** ~10 Minuten
**Dateien:**
- ✅ `supabase-schema.sql` - Tabellen + RLS Policies
- ✅ `supabase-test-data.sql` - Test-Daten

---

## 🎯 SCHRITT 1: Supabase Dashboard öffnen

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt aus: `lgztglycqtiwcmiydxnm`
3. Öffne den **SQL Editor** (linkes Menü → SQL Editor)

---

## 🗄️ SCHRITT 2: Datenbank-Schema erstellen

1. Im SQL Editor: Klicke auf **"New query"**
2. Öffne die Datei `supabase-schema.sql` in deinem Editor
3. **Copy-Paste den kompletten Inhalt** in den SQL Editor
4. Klicke auf **"Run"** (oder CTRL/CMD + Enter)

### ✅ Erwartetes Ergebnis:
```
Success! No rows returned
```

### ✨ Was wurde erstellt?
- ✅ 6 Tabellen (users, user_profiles, campaigns, werbegebiete, records, rankings)
- ✅ RLS aktiviert auf allen Tabellen
- ✅ 20+ Security Policies
- ✅ Indizes für Performance
- ✅ Auto-Trigger für updated_at
- ✅ Auto-Create User beim ersten Login

---

## 👥 SCHRITT 3: Email Auth aktivieren

1. Gehe zu **Authentication** → **Providers** (linkes Menü)
2. Stelle sicher, dass **Email** aktiviert ist ✅
3. Optional: **Confirm Email** deaktivieren für Testing (später wieder aktivieren!)

### Settings:
- ✅ Email Provider: **Enabled**
- ⚠️ Confirm email: **Disabled** (nur für Development!)
- ✅ Secure email change: **Enabled**

---

## 🧪 SCHRITT 4: Test-User registrieren

**Option A: Via Supabase Dashboard**

1. Gehe zu **Authentication** → **Users**
2. Klicke auf **"Add user"** → **"Create new user"**
3. Eingeben:
   - Email: `test@example.com`
   - Password: `test123456`
   - Auto Confirm User: ✅ (Häkchen setzen!)
4. Klicke **"Create user"**

**Option B: Später über deine App**
(Wenn Login-View fertig ist)

---

## 📊 SCHRITT 5: Test-Daten einfügen

1. Im SQL Editor: **"New query"**
2. Öffne `supabase-test-data.sql`
3. **Copy-Paste Teil 1** (Kampagnen + Werbegebiete)
4. Klicke **"Run"**

### ✅ Erwartetes Ergebnis:
```
Success! Inserted 3 campaigns, 9 werbegebiete
```

---

## 🔍 SCHRITT 6: User-ID ermitteln

Jetzt musst du die ID deines Test-Users rausfinden:

1. Im SQL Editor: **"New query"**
2. Führe diese Query aus:

```sql
SELECT
  u.id,
  u.email,
  users.name,
  users.role
FROM auth.users u
LEFT JOIN public.users ON users.id = u.id
ORDER BY u.created_at DESC;
```

3. **Kopiere die User-ID** (UUID, sieht aus wie: `a1b2c3d4-...`)

---

## 📝 SCHRITT 7: Records + Rankings einfügen (Optional)

1. Öffne `supabase-test-data.sql`
2. Scrolle zu den auskommentieren Bereichen (/* ... */)
3. Ersetze **`USER_ID_HIER_EINFÜGEN`** mit deiner kopierten User-ID
4. Entferne die Kommentare (`/*` und `*/`)
5. Copy-Paste in SQL Editor und **"Run"**

### Beispiel:
```sql
-- Vorher:
/*
INSERT INTO public.records (werber_id, ...) VALUES
  ('USER_ID_HIER_EINFÜGEN', ...);
*/

-- Nachher:
INSERT INTO public.records (werber_id, ...) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', ...);
```

---

## ✅ SCHRITT 8: Verification

Überprüfe, ob alles funktioniert:

### Query 1: Tabellen zählen
```sql
SELECT
  'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'campaigns', COUNT(*) FROM public.campaigns
UNION ALL
SELECT 'werbegebiete', COUNT(*) FROM public.werbegebiete
UNION ALL
SELECT 'records', COUNT(*) FROM public.records;
```

### Erwartetes Ergebnis:
```
users:         1
campaigns:     3
werbegebiete:  9
records:       3 (wenn eingefügt)
```

### Query 2: RLS testen
```sql
-- Zeige alle aktiven Policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Sollte ~20+ Policies anzeigen! ✅

---

## 🔑 SCHRITT 9: API Keys notieren

Du brauchst gleich 2 Keys für deine App:

1. Gehe zu **Project Settings** → **API**
2. Notiere:
   - **Project URL:** `https://lgztglycqtiwcmiydxnm.supabase.co`
   - **anon/public key:** (langer String, startet mit `eyJ...`)

⚠️ **WICHTIG:** Der `anon` Key ist **SICHER** im Frontend zu verwenden!
RLS schützt alle Daten. NIEMALS den `service_role` Key im Frontend nutzen!

---

## 📱 SCHRITT 10: Frontend vorbereiten

Jetzt zurück zum Code! Als nächstes:

1. ✅ Supabase Client installieren
2. ✅ Login/Register View erstellen
3. ✅ Auth State Management
4. ✅ API-Calls einbauen

→ Siehe nächste Anleitung: `FRONTEND-INTEGRATION.md`

---

## 🐛 Troubleshooting

### Problem: "relation does not exist"
**Lösung:** Schema-Script nochmal ausführen

### Problem: "permission denied for table"
**Lösung:** RLS Policies prüfen:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Problem: "duplicate key value violates unique constraint"
**Lösung:** IDs in Test-Daten anpassen oder `ON CONFLICT DO NOTHING` hinzufügen

### Problem: User wird nicht in public.users angelegt
**Lösung:** Trigger prüfen:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## ✨ Fertig!

**Deine Datenbank ist jetzt bereit! 🎉**

Nächste Schritte:
- [ ] Frontend: Supabase Client einbinden
- [ ] Frontend: Login/Register View
- [ ] Frontend: Auth State Management
- [ ] Frontend: API-Calls implementieren

---

## 📚 Nützliche Queries

### Alle Users anzeigen
```sql
SELECT
  u.id,
  u.email,
  users.name,
  users.role,
  u.created_at
FROM auth.users u
JOIN public.users ON users.id = u.id;
```

### Alle Kampagnen mit Werbegebieten
```sql
SELECT
  c.name as kampagne,
  COUNT(w.id) as gebiete,
  SUM(w.records_done) as erfassungen
FROM campaigns c
LEFT JOIN werbegebiete w ON w.campaign_id = c.id
GROUP BY c.id, c.name;
```

### Top 10 Werber
```sql
SELECT
  u.name,
  u.email,
  COUNT(r.id) as erfassungen
FROM users u
LEFT JOIN records r ON r.werber_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY erfassungen DESC
LIMIT 10;
```

---

**Bei Fragen:** Check Supabase Docs oder frag mich! 🚀
