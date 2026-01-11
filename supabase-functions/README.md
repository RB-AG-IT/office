# Supabase Edge Functions

## send-email

SMTP E-Mail-Versand für Bestätigungsmails.

### Deployment

1. Supabase CLI installieren:
```bash
npm install -g supabase
```

2. Login:
```bash
supabase login
```

3. Projekt verknüpfen:
```bash
supabase link --project-ref lgztglycqtiwcmiydxnm
```

4. Function deployen:
```bash
supabase functions deploy send-email
```

### API Aufruf

```javascript
const response = await fetch(
  'https://lgztglycqtiwcmiydxnm.supabase.co/functions/v1/send-email',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ANON_KEY'
    },
    body: JSON.stringify({
      to: 'empfaenger@email.de',
      subject: 'Betreff',
      body: 'Inhalt der E-Mail',
      senderName: 'DRK Kreisverband XY'
    })
  }
);
```

### Platzhalter in Vorlagen

- `{{anrede}}` - Herr/Frau
- `{{vorname}}` - Vorname
- `{{nachname}}` - Nachname
- `{{betrag}}` - Betrag in Euro
- `{{intervall}}` - monatlich/vierteljährlich/halbjährlich/jährlich
