-- Migration: Neue Willkommensmail-Vorlage mit erweiterten Platzhaltern
-- Datum: 2026-01-13

UPDATE email_vorlagen
SET
    betreff = 'Vielen Dank für Ihre Unterstützung!',
    inhalt = 'Sehr geehrte/r {{anrede}} {{vorname}} {{nachname}},

wir freuen uns, Sie als neues Fördermitglied begrüßen zu dürfen. Mit Ihrem persönlichen Förderbeitrag unterstützen Sie viele Menschen in Not, denen das Deutsche Rote Kreuz zuverlässige Hilfe bietet – in jeder Situation, von Kindesbeinen bis ins hohe Alter.

Sie leisten einen wichtigen Anteil, damit wir unseren Aufgaben hier vor Ort gerecht werden können. Dafür möchten wir Ihnen sehr herzlich danken!

Haben Sie Fragen zu Ihrer Mitgliedschaft oder einen Änderungswunsch? Dann zögern Sie nicht, mit uns Kontakt aufzunehmen.

────────────────────────────

Ihre Daten im Überblick:

Name:                {{vorname}} {{nachname}}
E-Mail:              {{email}}
Telefon:             {{telefon}}
Geburtsdatum:        {{geburtsdatum}}
Adresse:             {{adresse}}

Kontoinhaber:        {{kontoinhaber}}
IBAN:                {{iban_maskiert}}

Beitrag:             {{betrag}} € / {{intervall}}

────────────────────────────

Ansprechpartner:
{{ansprechpartner_name}}
Tel: {{ansprechpartner_telefon}}
E-Mail: {{ansprechpartner_email}}

Mit freundlichen Grüßen
{{werbegebiet_name}}

{{datenschutz_link}} | {{website_link}} | {{anschrift_ov}}',
    updated_at = NOW()
WHERE vorlage_typ = 'willkommen';
