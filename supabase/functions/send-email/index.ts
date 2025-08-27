import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}

serve(async (req) => {
  // Handle CORS preflight requests  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📧 Edge Function send-email démarrée')
    const { email, subject, message } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "Email manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    // API Key Resend depuis ton Supabase Project Settings (Environment Variables)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY manquante" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Maïa Elange <contact@maiaelange.fr>",
        to: email,
        subject: subject || "Votre rapport personnalisé",
        html: `<p>${message || "Voici votre diagnostic généré automatiquement 🚀"}</p>`,
      }),
    })

    const data = await resp.json()
    
    if (!resp.ok) {
      console.error("Resend API error:", data)
      return new Response(JSON.stringify({ error: "Erreur envoi email", details: data }), {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    console.log("Email envoyé avec succès:", data)
    return new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    })
  } catch (err) {
    console.error("Erreur fonction send-email:", err)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    })
  }
})