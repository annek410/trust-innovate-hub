import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Home, ArrowRight, CheckCircle, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DiagnosticPersonnalise = () => {
  const navigate = useNavigate();

  // États pour le formulaire de diagnostic
  const [diagnosticData, setDiagnosticData] = useState({
    // Étape 1
    nom: "",
    email: "",
    organisation: "",
    taille: "1",
    // Étape 2
    secteur: "",
    secteur_autre: "",
    chiffre_affaires: "",
    // Étape 3
    processus_prioritaires: [] as string[],
    tache_frustrante: "",
    // Étape 4
    heures_repetitives: "",
    cout_horaire: "",
    // Étape 5
    outils: [] as string[],
    autre_outil: "",
    // Étape 6
    consentement: false,
    delai: "",
    budget_annuel: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Diagnostic Personnalisé | Maia Elange";
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Obtenez un diagnostic personnalisé et des recommandations IA sur-mesure pour votre organisation. Identifiez vos 3 chantiers prioritaires d\'automatisation.');
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', 'Obtenez un diagnostic personnalisé et des recommandations IA sur-mesure pour votre organisation. Identifiez vos 3 chantiers prioritaires d\'automatisation.');
      document.head.appendChild(metaDescription);
    }
  }, []);

  // Options pour les formulaires
  const secteurOptions = [
    "Santé & Médical",
    "Services B2B",
    "E-commerce & Retail",
    "Finance & Assurance",
    "Tech & Digital",
    "Industrie & Manufacturing",
    "Éducation & Formation",
    "Immobilier & Construction",
    "Restauration & Hôtellerie",
    "Associations & ONG",
    "Administration & Secteur Public",
    "Autre"
  ];

  const processusPrioritaires = [
    "Gestion des emails et communication",
    "Administration et paperasse",
    "Saisie et traitement de données",
    "Facturation et comptabilité",
    "Support client et SAV",
    "Gestion des stocks et commandes",
    "RH et gestion du personnel",
    "Marketing et réseaux sociaux",
    "Veille et recherche d'informations",
    "Reporting et analyses"
  ];

  const outilsOptions = [
    "Excel/Google Sheets",
    "Email (Outlook/Gmail)",
    "CRM (Salesforce, HubSpot...)",
    "ERP/Gestion (SAP, Odoo...)",
    "Outils comptables (Sage, Ciel...)",
    "Plateformes e-commerce",
    "Réseaux sociaux",
    "Outils de communication (Teams, Slack...)",
    "Logiciels métier spécifiques",
    "Aucun outil particulier"
  ];

  // Validation des étapes
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!diagnosticData.nom.trim()) errors.push("nom");
        if (!diagnosticData.email.trim()) errors.push("email");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (diagnosticData.email.trim() && !emailRegex.test(diagnosticData.email)) errors.push("email");
        if (!diagnosticData.organisation.trim()) errors.push("organisation");
        break;

      case 2:
        if (!diagnosticData.secteur) errors.push("secteur");
        if (diagnosticData.secteur === "Autre" && !diagnosticData.secteur_autre.trim()) errors.push("secteur_autre");
        if (!diagnosticData.chiffre_affaires) errors.push("chiffre_affaires");
        break;

      case 3:
        if (diagnosticData.processus_prioritaires.length === 0) errors.push("processus_prioritaires");
        break;

      case 4:
        if (!diagnosticData.heures_repetitives) errors.push("heures_repetitives");
        if (!diagnosticData.cout_horaire) errors.push("cout_horaire");
        break;

      case 5:
        if (diagnosticData.outils.length === 0) errors.push("outils");
        break;

      case 6:
        if (!diagnosticData.consentement) errors.push("consentement");
        if (!diagnosticData.delai) errors.push("delai");
        if (!diagnosticData.budget_annuel) errors.push("budget_annuel");
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(6, prev + 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setValidationErrors([]);
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    try {
      // Calculer le nombre d'employés à partir de la taille d'équipe
      const getEmployeeCount = (taille: string): number => {
        switch (taille) {
          case "1": return 1;
          case "2-5": return 3;
          case "6-20": return 13;
          case "21-50": return 35;
          case "51+": return 75;
          default: return 1;
        }
      };

      // Construire les données ROI à partir du diagnostic
      const hours_per_week = parseFloat(diagnosticData.heures_repetitives) || 0;
      const hourly_rate = parseFloat(diagnosticData.cout_horaire) || 0;
      const employees = getEmployeeCount(diagnosticData.taille);
      const annual_hours = hours_per_week * 52 * employees;
      const annual_cost = annual_hours * hourly_rate;
      
      // Estimation de l'investissement basé sur le budget
      const getInvestment = (budget: string): number => {
        switch (budget) {
          case "0-1000": return 500;
          case "1000-5000": return 3000;
          case "5000-15000": return 10000;
          case "15000+": return 20000;
          default: return 5000;
        }
      };

      const investment = getInvestment(diagnosticData.budget_annuel);
      const annual_savings = Math.max(0, annual_cost * 0.4); // Estimation 40% d'économies
      const roi_percentage = investment > 0 ? ((annual_savings - investment) / investment) * 100 : 0;

      const roiData = {
        hours_per_week,
        hourly_rate,
        employees,
        investment,
        annual_savings,
        roi_percentage
      };

      console.log('📊 Envoi des données:', { roiData, diagnosticData, userEmail: diagnosticData.email, userName: diagnosticData.nom });
      
      const { data, error } = await supabase.functions.invoke('analyze-roi-data', {
        body: {
          heures: roiData.hours_per_week,
          taux: roiData.hourly_rate,
          employes: roiData.employees,
          budget: roiData.investment,
          userEmail: diagnosticData.email,
          userName: diagnosticData.nom
        }
      });

      console.log('📨 Réponse reçue:', { data, error });

      if (error) {
        console.error('Erreur lors de l\'envoi:', error);
        throw new Error(error.message || 'Erreur lors de la communication avec le serveur');
      }

      toast.success("Diagnostic envoyé ! Vous recevrez vos recommandations par email dans quelques instants.");
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      
      // Message d'erreur plus spécifique selon le type d'erreur
      let errorMessage = "Erreur lors de l'envoi du diagnostic.";
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('FunctionsFetchError')) {
          errorMessage = "Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "La requête a pris trop de temps. Veuillez réessayer.";
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setDiagnosticData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => prev.filter(error => error !== field));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-heading mb-2">Informations de contact</h2>
              <p className="text-text-secondary">Dites-nous qui vous êtes</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom et Prénom *</Label>
                <Input
                  id="nom"
                  value={diagnosticData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className={validationErrors.includes('nom') ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="email">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  value={diagnosticData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={validationErrors.includes('email') ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="organisation">Organisation *</Label>
                <Input
                  id="organisation"
                  value={diagnosticData.organisation}
                  onChange={(e) => handleInputChange('organisation', e.target.value)}
                  className={validationErrors.includes('organisation') ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="taille">Taille de l'équipe</Label>
                <Select value={diagnosticData.taille} onValueChange={(value) => handleInputChange('taille', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Moi uniquement (solo)</SelectItem>
                    <SelectItem value="2-5">2-5 personnes</SelectItem>
                    <SelectItem value="6-20">6-20 personnes</SelectItem>
                    <SelectItem value="21-50">21-50 personnes</SelectItem>
                    <SelectItem value="51+">51+ personnes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-heading mb-2">Votre organisation</h2>
              <p className="text-text-secondary">Aidez-nous à mieux comprendre votre contexte</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="secteur">Secteur d'activité *</Label>
                <Select value={diagnosticData.secteur} onValueChange={(value) => handleInputChange('secteur', value)}>
                  <SelectTrigger className={validationErrors.includes('secteur') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner votre secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {secteurOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {diagnosticData.secteur === "Autre" && (
                  <Input
                    placeholder="Précisez votre secteur"
                    value={diagnosticData.secteur_autre}
                    onChange={(e) => handleInputChange('secteur_autre', e.target.value)}
                    className={`mt-2 ${validationErrors.includes('secteur_autre') ? 'border-red-500' : ''}`}
                  />
                )}
              </div>

              <div>
                <Label htmlFor="chiffre_affaires">Chiffre d'affaires annuel *</Label>
                <Select value={diagnosticData.chiffre_affaires} onValueChange={(value) => handleInputChange('chiffre_affaires', value)}>
                  <SelectTrigger className={validationErrors.includes('chiffre_affaires') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner une tranche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-50k">0 - 50k €</SelectItem>
                    <SelectItem value="50-200k">50k - 200k €</SelectItem>
                    <SelectItem value="200-500k">200k - 500k €</SelectItem>
                    <SelectItem value="500k-2M">500k - 2M €</SelectItem>
                    <SelectItem value="2M+">2M+ €</SelectItem>
                    <SelectItem value="non-applicable">Non applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-heading mb-2">Processus prioritaires</h2>
              <p className="text-text-secondary">Quels processus vous font perdre le plus de temps ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Sélectionnez vos processus prioritaires (plusieurs choix possibles) *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {processusPrioritaires.map((processus) => (
                    <div key={processus} className="flex items-center space-x-2">
                      <Checkbox
                        id={processus}
                        checked={diagnosticData.processus_prioritaires.includes(processus)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleInputChange('processus_prioritaires', [...diagnosticData.processus_prioritaires, processus]);
                          } else {
                            handleInputChange('processus_prioritaires', diagnosticData.processus_prioritaires.filter(p => p !== processus));
                          }
                        }}
                      />
                      <Label htmlFor={processus} className="text-sm">{processus}</Label>
                    </div>
                  ))}
                </div>
                {validationErrors.includes('processus_prioritaires') && (
                  <p className="text-red-500 text-sm mt-2">Veuillez sélectionner au moins un processus</p>
                )}
              </div>

              <div>
                <Label htmlFor="tache_frustrante">Quelle tâche vous frustre le plus au quotidien ? (optionnel)</Label>
                <Textarea
                  id="tache_frustrante"
                  value={diagnosticData.tache_frustrante}
                  onChange={(e) => handleInputChange('tache_frustrante', e.target.value)}
                  placeholder="Décrivez brièvement la tâche qui vous fait perdre le plus de temps..."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-heading mb-2">Temps et coûts</h2>
              <p className="text-text-secondary">Évaluons l'impact financier potentiel</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="heures_repetitives">Heures/semaine sur tâches répétitives *</Label>
                <Input
                  id="heures_repetitives"
                  type="number"
                  value={diagnosticData.heures_repetitives}
                  onChange={(e) => handleInputChange('heures_repetitives', e.target.value)}
                  className={validationErrors.includes('heures_repetitives') ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="cout_horaire">Coût horaire moyen chargé (€) *</Label>
                <Input
                  id="cout_horaire"
                  type="number"
                  value={diagnosticData.cout_horaire}
                  onChange={(e) => handleInputChange('cout_horaire', e.target.value)}
                  className={validationErrors.includes('cout_horaire') ? 'border-red-500' : ''}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-heading mb-2">Outils actuels</h2>
              <p className="text-text-secondary">Quels outils utilisez-vous actuellement ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Sélectionnez vos outils actuels (plusieurs choix possibles) *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {outilsOptions.map((outil) => (
                    <div key={outil} className="flex items-center space-x-2">
                      <Checkbox
                        id={outil}
                        checked={diagnosticData.outils.includes(outil)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleInputChange('outils', [...diagnosticData.outils, outil]);
                          } else {
                            handleInputChange('outils', diagnosticData.outils.filter(o => o !== outil));
                          }
                        }}
                      />
                      <Label htmlFor={outil} className="text-sm">{outil}</Label>
                    </div>
                  ))}
                </div>
                {validationErrors.includes('outils') && (
                  <p className="text-red-500 text-sm mt-2">Veuillez sélectionner au moins un outil</p>
                )}
              </div>

              <div>
                <Label htmlFor="autre_outil">Autre outil important (optionnel)</Label>
                <Input
                  id="autre_outil"
                  value={diagnosticData.autre_outil}
                  onChange={(e) => handleInputChange('autre_outil', e.target.value)}
                  placeholder="Nom de l'outil..."
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-heading mb-2">Finalisation</h2>
              <p className="text-text-secondary">Dernières informations pour personnaliser vos recommandations</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="delai">Dans quels délais souhaitez-vous agir ? *</Label>
                <Select value={diagnosticData.delai} onValueChange={(value) => handleInputChange('delai', value)}>
                  <SelectTrigger className={validationErrors.includes('delai') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un délai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediatement">Immédiatement (&lt; 1 mois)</SelectItem>
                    <SelectItem value="3-mois">Dans les 3 mois</SelectItem>
                    <SelectItem value="6-mois">Dans les 6 mois</SelectItem>
                    <SelectItem value="1-an">Dans l'année</SelectItem>
                    <SelectItem value="pas-defini">Pas encore défini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget_annuel">Budget annuel envisagé *</Label>
                <Select value={diagnosticData.budget_annuel} onValueChange={(value) => handleInputChange('budget_annuel', value)}>
                  <SelectTrigger className={validationErrors.includes('budget_annuel') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-5k">0 - 5k €</SelectItem>
                    <SelectItem value="5-15k">5k - 15k €</SelectItem>
                    <SelectItem value="15-50k">15k - 50k €</SelectItem>
                    <SelectItem value="50k+">50k+ €</SelectItem>
                    <SelectItem value="pas-defini">Pas encore défini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-2 pt-4">
                <Checkbox
                  id="consentement"
                  checked={diagnosticData.consentement}
                  onCheckedChange={(checked) => handleInputChange('consentement', checked)}
                />
                <Label htmlFor="consentement" className="text-sm leading-5">
                  J'accepte que mes données soient utilisées pour établir un diagnostic personnalisé et recevoir les recommandations par email. 
                  Ces données ne seront ni vendues ni partagées avec des tiers. *
                </Label>
              </div>
              {validationErrors.includes('consentement') && (
                <p className="text-red-500 text-sm">Vous devez accepter l'utilisation de vos données</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-text-secondary hover:text-heading"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-text-secondary hover:text-heading"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Button>
          </div>

          {/* En-tête */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Target className="h-4 w-4 mr-2" />
              DIAGNOSTIC PERSONNALISÉ
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold text-heading mb-4">
              Identifiez vos 3 chantiers prioritaires
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              6 étapes pour obtenir des recommandations IA sur-mesure et un plan d'action personnalisé
            </p>
          </div>

          {/* Barre de progression */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">Étape {currentStep} sur 6</span>
              <span className="text-sm text-text-secondary">{Math.round((currentStep / 6) * 100)}% terminé</span>
            </div>
            <Progress value={(currentStep / 6) * 100} className="h-2" />
          </div>

          {/* Formulaire */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              {renderStep()}

              {/* Boutons de navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Précédent
                </Button>

                {currentStep < 6 ? (
                  <Button onClick={handleNext}>
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-cta-primary hover:bg-cta-primary/90 text-cta-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>Envoi en cours...</>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Obtenir mes recommandations
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Avantages du diagnostic */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center p-6">
                <div className="text-primary text-3xl mb-4">🎯</div>
                <h3 className="font-semibold text-heading mb-2">3 recommandations ciblées</h3>
                <p className="text-text-secondary text-sm">Identifiez vos chantiers les plus rentables</p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="text-primary text-3xl mb-4">🚀</div>
                <h3 className="font-semibold text-heading mb-2">Plan d'action personnalisé</h3>
                <p className="text-text-secondary text-sm">Roadmap détaillée avec timeline et ROI</p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="text-primary text-3xl mb-4">💡</div>
                <h3 className="font-semibold text-heading mb-2">Analyse IA avancée</h3>
                <p className="text-text-secondary text-sm">Recommendations basées sur votre contexte unique</p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiagnosticPersonnalise;