'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardBadge } from '@/components/ui/card';
import Image from 'next/image';
import { 
  Bot, 
  ArrowRight, 
  Stethoscope, 
  Clock, 
  Shield, 
  Sparkles,
  CheckCircle,
  Brain,
  Heart
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="w-full text-center mb-20 flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 mt-4 shadow-brand-lg overflow-hidden bg-white/90">
            <Image
              src="/hysio-logo.png"
              alt="Hysio Logo"
              width={120}
              height={120}
              className="object-contain w-full h-full"
            />
          </div>
          
          <div className="max-w-5xl mx-auto">
            <h1 className="text-h1 font-bold text-text-secondary mb-6 text-center">
              Jij focust op zorg, Hysio doet de rest.
            </h1>
            
            <p className="text-h4 text-text-primary/90 max-w-4xl mx-auto leading-relaxed mb-4 text-center">
              AI-gedreven medische scribe voor fysiotherapeuten. Professioneel, efficiënt en volledig volgens Nederlandse richtlijnen.
            </p>
            
            <p className="text-body text-text-muted max-w-3xl mx-auto mb-12 text-center">
              Bespaar tot 70% van je administratietijd en richt je weer op waar je het beste in bent: je patiënten helpen.
            </p>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => router.push('/scribe')}
              className="group"
            >
              Start Medical Scribe
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-brand" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="group"
            >
              <Bot size={20} className="mr-2" />
              Bekijk Dashboard
            </Button>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card module="scribe" className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-hysio-deep-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope size={28} className="text-text-secondary" />
              </div>
              <CardBadge module="scribe">Medical Scribe</CardBadge>
              <CardTitle level={3}>Gestructureerde Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                5-staps intake workflow met PHSB anamnese, AI-ondersteund onderzoeksplan en klinische conclusies volgens KNGF-richtlijnen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card module="assistant" className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-hysio-assistant/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain size={28} className="text-hysio-assistant" />
              </div>
              <CardBadge module="assistant">AI Assistant</CardBadge>
              <CardTitle level={3}>SOEP Vervolgconsulten</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Snelle SOEP documentatie voor vervolgconsulten met voortgangsevaluatie en slimme behandelplan aanpassingen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-hysio-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-hysio-emerald" />
              </div>
              <CardTitle level={3}>Conform Richtlijnen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Volledig volgens KNGF en DTF richtlijnen met automatische rode vlagen detectie en kwaliteitscontrole.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <Card className="hysio-surface-elevated bg-gradient-to-r from-hysio-deep-green/8 to-hysio-deep-green/12">
          <CardContent className="py-16 px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Sparkles size={48} className="text-hysio-mint-dark mx-auto mb-8" />
              
              <h2 className="text-h2 text-text-secondary mb-6">
                Meer tijd voor je vak
              </h2>
              
              <p className="text-h4 text-text-primary/90 mb-8 leading-relaxed">
                Hysio maakt administratie moeiteloos, zodat jij je kunt richten op wat écht telt: de zorg voor je patiënten.
              </p>

              <div className="grid sm:grid-cols-3 gap-8 mb-12">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="text-hysio-emerald w-6 h-6 shrink-0" />
                  <span className="text-body font-medium text-text-secondary">Tijdwinst tot 70%</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="text-hysio-emerald w-6 h-6 shrink-0" />
                  <span className="text-body font-medium text-text-secondary">KNGF-compliant</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="text-hysio-emerald w-6 h-6 shrink-0" />
                  <span className="text-body font-medium text-text-secondary">Nederlandse taal</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="xl"
                  onClick={() => router.push('/scribe')}
                  className="group shadow-brand-lg"
                >
                  <Heart size={20} className="mr-2" />
                  Start nu gratis
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-brand" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="xl"
                  onClick={() => router.push('/assistant')}
                  className="group"
                >
                  <Bot size={20} className="mr-2 hysio-ai-pulse" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <footer className="mt-20 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-caption text-text-muted mb-3 font-medium">
              Hysio Medical Scribe - Jouw digitale collega voor fysiotherapie documentatie
            </p>
            <p className="text-caption text-text-muted leading-relaxed">
              Conform Nederlandse fysiotherapie richtlijnen (KNGF, DTF) • Alle AI-gegenereerde content dient gecontroleerd te worden door geregistreerde fysiotherapeuten
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}