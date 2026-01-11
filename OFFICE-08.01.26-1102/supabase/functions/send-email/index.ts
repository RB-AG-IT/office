import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_ADDRESS = "verwaltung@drk-mitgliederwerbungen.de";

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, body, senderName } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Fehlende Parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.hostinger.com",
        port: 465,
        tls: true,
        auth: {
          username: EMAIL_ADDRESS,
          password: "aZemi211!",
        },
      },
    });

    // From als String formatieren: "Name <email@domain.de>"
    const fromString = senderName
      ? `${senderName} <${EMAIL_ADDRESS}>`
      : EMAIL_ADDRESS;

    await client.send({
      from: fromString,
      to: to,
      subject: subject,
      content: body,
      html: body.replace(/\n/g, "<br>"),
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
