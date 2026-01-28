import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = "https://lgztglycqtiwcmiydxnm.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Transparentes 1x1 GIF
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

serve(async (req) => {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get("id");

  if (trackingId) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Nur beim ersten Öffnen speichern
      const { data: record } = await supabase
        .from("records")
        .select("id, email_opened_at")
        .eq("email_tracking_id", trackingId)
        .single();

      if (record && !record.email_opened_at) {
        await supabase
          .from("records")
          .update({ email_opened_at: new Date().toISOString() })
          .eq("id", record.id);

        await supabase
          .from("email_log")
          .insert({
            record_id: record.id,
            event_type: "opened",
          });

        console.log(`Email geöffnet: ${record.id}`);
      }
    } catch (error) {
      console.error("Tracking-Fehler:", error.message);
    }
  }

  // Immer das Pixel zurückgeben
  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
});
