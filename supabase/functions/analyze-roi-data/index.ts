import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface DiagnosticData {
  taille: string;
  secteur: string;
  chiffre_affaires: string;
  processus_prioritaires: string[];
  tache_frustrante: string;
  heures_repetitives: number;
  cout_horaire: number;
  outils: string[];
  autre_outil?: string;
  delai: string;
  budget_annuel: string;
  organisation?: string;
}

interface AnalyzeRequest {
  roiData: {
    hours_per_week: number;
    hourly_rate: number;
    employees: number;
    investment: number;
    annual_savings: number;
    roi_percentage: number;
  };
  diagnosticData: DiagnosticData;
  userEmail: string;
  userName?: string;
  userPhone?: string;
}

const RECOMMENDATIONS = [
  {
    title: "CRM automatisé et personnalisé",
    description: "CRM avec automatisation des relances, segmentation intelligente et campagnes personnalisées basées sur l'IA.",
    estimatedROI: "200% sur 6 mois",
    timeline: "4-6 semaines",
    impact: "Augmentation de 35% du taux de conversion",
    priority: 1
  },
  {
    title: "Automatisation des processus administratifs",
    description: "Digitalisation complète des workflows administratifs avec validation électronique et traçabilité.",
    estimatedROI: "160% sur 4 mois",
    timeline: "3-5 semaines",
    impact: "Réduction de 65% du temps administratif",
    priority: 2
  },
  {
    title: "Dashboard de pilotage intelligent",
    description: "Tableau de bord en temps réel avec analytics prédictives et alertes automatiques sur les KPIs critiques.",
    estimatedROI: "140% sur 3 mois",
    timeline: "2-4 semaines",
    impact: "Amélioration de 50% de la prise de décision",
    priority: 3
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 analyze-roi-data function started");
    
    const requestBody = await req.json();
    const { roiData, diagnosticData, userEmail, userName, userPhone } = requestBody as AnalyzeRequest;

    if (!userEmail || !roiData || !diagnosticData) {
      throw new Error("Missing required fields");
    }

    console.log("✅ Processing for:", userEmail);

    // Sauvegarder dans la base de données
    const { data: calculationData, error: insertError } = await supabase
      .from('roi_calculations')
      .insert({
        user_email: userEmail,
        user_name: userName || null,
        user_phone: userPhone || null,
        hours_per_week: roiData.hours_per_week,
        hourly_rate: roiData.hourly_rate,
        employees: roiData.employees,
        investment: roiData.investment,
        annual_savings: roiData.annual_savings,
        roi_percentage: roiData.roi_percentage,
        team_size: diagnosticData.taille,
        business_type: diagnosticData.secteur,
        main_activities: diagnosticData.processus_prioritaires,
        repetitive_tasks: [diagnosticData.tache_frustrante].filter(Boolean),
        current_tools: diagnosticData.outils,
        pain_points: [diagnosticData.tache_frustrante].filter(Boolean),
        automation_goals: diagnosticData.processus_prioritaires,
        timeline: diagnosticData.delai,
        budget_range: diagnosticData.budget_annuel,
        technical_level: 'standard',
        priority_processes: diagnosticData.processus_prioritaires,
        success_metrics: ['ROI', 'Temps économisé'],
        priority_projects: RECOMMENDATIONS
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Database error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    // Créer le lead
    const { data: leadData, error: leadError } = await supabase
      .rpc('upsert_lead', {
        p_email: userEmail,
        p_name: userName || null,
        p_phone: userPhone || null,
        p_company: diagnosticData.organisation || null,
        p_team_size: diagnosticData.taille || null,
        p_business_type: diagnosticData.secteur || null,
        p_roi_potential: roiData.roi_percentage,
        p_annual_savings: roiData.annual_savings,
        p_status: 'nouveau',
        p_budget_range: diagnosticData.budget_annuel || null
      });

    if (!leadError && leadData) {
      await supabase
        .from('roi_calculations')
        .update({ lead_id: leadData })
        .eq('id', calculationData.id);
    }

    // Envoyer l'email
    try {
      await supabase.functions.invoke('send-roi-email', {
        body: {
          calculationId: calculationData.id,
          userEmail,
          userName,
          roiData,
          diagnosticData,
          recommendations: RECOMMENDATIONS
        }
      });
      console.log("✅ Email sent");
    } catch (emailErr) {
      console.error("❌ Email error:", emailErr);
    }

    return new Response(JSON.stringify({
      success: true,
      calculationId: calculationData.id,
      recommendations: RECOMMENDATIONS
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});