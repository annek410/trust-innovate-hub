import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ROIEmailRequest {
  calculationId: string;
  userEmail: string;
  userName?: string;
  roiData: {
    hours_per_week: number;
    hourly_rate: number;
    employees: number;
    investment: number;
    annual_savings: number;
    roi_percentage: number;
  };
  diagnosticData: any;
  recommendations: any[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculationId, userEmail, userName, roiData, diagnosticData, recommendations }: ROIEmailRequest = await req.json();

    console.log("Sending ROI email to:", userEmail);

    // Format recommendations for email
    const recommendationsHtml = recommendations.map((rec, index) => `
      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #007bff;">
        <h3 style="color: #007bff; margin: 0 0 10px 0;">${index + 1}. ${rec.title}</h3>
        <p style="margin: 10px 0;"><strong>Description:</strong> ${rec.description}</p>
        <p style="margin: 10px 0;"><strong>ROI Estimé:</strong> ${rec.estimatedROI}</p>
        <p style="margin: 10px 0;"><strong>Délai de mise en œuvre:</strong> ${rec.timeline}</p>
        <p style="margin: 10px 0;"><strong>Impact:</strong> ${rec.impact}</p>
      </div>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "Maia Elange <contact@maiaelange.fr>",
      to: [userEmail],
      subject: `Vos recommandations d'automatisation personnalisées - Maia Elange`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Nouvelle Analyse ROI - Maia Elange
          </h1>
          
          <h2 style="color: #007bff;">Informations Client</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Nom:</strong> ${userName || 'Non renseigné'}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>ID Calcul:</strong> ${calculationId}</p>
          </div>

          <h2 style="color: #007bff;">Résultats du Calcul ROI</h2>
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p><strong>Heures/semaine:</strong> ${roiData.hours_per_week}h</p>
              <p><strong>Taux horaire:</strong> ${roiData.hourly_rate}€</p>
              <p><strong>Nombre d'employés:</strong> ${roiData.employees}</p>
              <p><strong>Investissement:</strong> ${roiData.investment.toLocaleString('fr-FR')}€</p>
              <p><strong>Économies annuelles:</strong> ${roiData.annual_savings.toLocaleString('fr-FR')}€</p>
              <p><strong>ROI:</strong> ${roiData.roi_percentage}%</p>
            </div>
          </div>

          <h2 style="color: #007bff;">Données du Diagnostic</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Taille équipe:</strong> ${diagnosticData.team_size || 'Non renseigné'}</p>
            <p><strong>Type d'entreprise:</strong> ${diagnosticData.business_type || 'Non renseigné'}</p>
            <p><strong>Activités principales:</strong> ${diagnosticData.main_activities?.join(', ') || 'Non renseigné'}</p>
            <p><strong>Tâches répétitives:</strong> ${diagnosticData.repetitive_tasks?.join(', ') || 'Non renseigné'}</p>
            <p><strong>Budget:</strong> ${diagnosticData.budget_range || 'Non renseigné'}</p>
            <p><strong>Niveau technique:</strong> ${diagnosticData.technical_level || 'Non renseigné'}</p>
          </div>

          <h2 style="color: #007bff;">Recommandations IA - Top 3 Chantiers Prioritaires</h2>
          ${recommendationsHtml}

          <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; border-radius: 12px; margin: 40px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; font-size: 24px;">🚀 Prêt à transformer votre entreprise ?</h3>
            <p style="margin: 15px 0; font-size: 16px; opacity: 0.9;">Votre diagnostic révèle un potentiel d'économies de <strong>${roiData.annual_savings.toLocaleString('fr-FR')}€ par an</strong>. Passez à l'étape suivante avec une consultation personnalisée.</p>
            
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('//', '//').split('.')[0]}.lovable.app/calculateur-roi" 
               style="display: inline-block; background: white; color: #007bff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease;">
              📅 Demander un Devis Personnalisé
            </a>
            
            <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.8;">✅ Analyse approfondie de vos processus<br>✅ Plan d'action sur-mesure avec ROI détaillé<br>✅ Devis personnalisé selon vos besoins</p>
          </div>

          <div style="background: #f8f9fa; color: #333; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center; border-left: 4px solid #28a745;">
            <h4 style="margin: 0 0 10px 0; color: #28a745;">📧 Copie pour l'équipe Maia Elange</h4>
            <p style="margin: 10px 0; font-size: 14px;">Ce prospect a complété son diagnostic ROI et va recevoir ses recommandations. Préparez-vous à le recontacter pour programmer un diagnostic approfondi.</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
            Email généré automatiquement par Maia Elange - Système d'Analyse ROI
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-roi-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);