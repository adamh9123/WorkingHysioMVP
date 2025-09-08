'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowRight, Stethoscope, Clock, Shield } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-hysio-cream/30 via-white to-hysio-mint/10">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-hysio-mint/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-hysio-deep-green" />
          </div>
          <h1 className="text-5xl font-bold text-hysio-deep-green mb-4">
            Hysio Medical Scribe
          </h1>
          <p className="text-xl text-hysio-deep-green-900/80 max-w-2xl mx-auto leading-relaxed">
            AI-ondersteunde documentatie voor fysiotherapeuten. 
            Professioneel, efficiënt en conform Nederlandse richtlijnen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="border-hysio-mint/20 hover:border-hysio-mint/50 transition-colors">
            <CardHeader className="text-center">
              <Stethoscope size={32} className="text-hysio-deep-green mx-auto mb-3" />
              <CardTitle className="text-hysio-deep-green">Gestructureerde Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                5-staps intake workflow met PHSB anamnese, AI-ondersteund onderzoeksplan en klinische conclusies.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-hysio-mint/20 hover:border-hysio-mint/50 transition-colors">
            <CardHeader className="text-center">
              <Clock size={32} className="text-hysio-deep-green mx-auto mb-3" />
              <CardTitle className="text-hysio-deep-green">SOEP Vervolgconsulten</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Snelle SOEP documentatie voor vervolgconsulten met voortgangsevaluatie en behandelplan aanpassingen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-hysio-mint/20 hover:border-hysio-mint/50 transition-colors">
            <CardHeader className="text-center">
              <Shield size={32} className="text-hysio-deep-green mx-auto mb-3" />
              <CardTitle className="text-hysio-deep-green">Conform Richtlijnen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Volledig volgens KNGF en DTF richtlijnen met automatische rode vlagen detectie.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border-2 border-hysio-mint/30 bg-hysio-mint/5">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-semibold text-hysio-deep-green mb-4">
              Klaar om te beginnen?
            </h2>
            <p className="text-hysio-deep-green-900/70 mb-8 max-w-md mx-auto">
              Start direct met het documenteren van uw patiënten met AI-ondersteuning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => router.push('/scribe')}
                className="text-lg px-8 py-3"
              >
                Start Medical Scribe
                <ArrowRight size={20} className="ml-2" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="text-lg px-8 py-3"
              >
                Dashboard
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-hysio-deep-green-900/60 mb-2">
            Hysio Medical Scribe - Professional AI Assistant for Physiotherapy Documentation
          </p>
          <p className="text-xs text-hysio-deep-green-900/50">
            Compliant with Dutch physiotherapy guidelines (KNGF, DTF) • All AI-generated content must be verified by licensed physiotherapists
          </p>
        </div>
      </div>
    </div>
  );
}
