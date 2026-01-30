import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = "https://lgztglycqtiwcmiydxnm.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Records mit queued oder failed Status laden (max 3 Versuche, älter als 2 Minuten)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: records, error } = await supabase
      .from("records")
      .select("id, email, email_status, email_retry_count")
      .in("email_status", ["queued", "failed"])
      .lt("email_retry_count", 3)
      .eq("record_type", "neumitglied")
      .not("email", "is", null)
      .lt("created_at", twoMinutesAgo)
      .limit(20);

    if (error) {
      throw new Error(`DB-Abfrage fehlgeschlagen: ${error.message}`);
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Keine ausstehenden Emails" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`${records.length} ausstehende Emails gefunden`);

    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ record_id: record.id }),
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
          console.log(`Email gesendet: ${record.email}`);
        } else {
          failCount++;
          console.warn(`Email fehlgeschlagen: ${record.email} - ${result.error}`);
        }
      } catch (err) {
        failCount++;
        console.error(`Fehler bei ${record.email}:`, err.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: records.length,
        sent: successCount,
        failed: failCount,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Cron-Fehler:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
