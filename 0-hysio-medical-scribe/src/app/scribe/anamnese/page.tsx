'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeWorkflowLayout } from '@/components/intake/IntakeWorkflowLayout';
import { useIntakeSession } from '@/context/IntakeSessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { 
  MessageCircle, 
  Clock, 
  TrendingDown, 
  Users, 
  HelpCircle,
  Target,
  History,
  Pill,
  Activity,
  Briefcase,
  Info
} from 'lucide-react';

export default function AnamnesePage() {
  const router = useRouter();
  const { state, updateAnamnese, nextStep, previousStep } = useIntakeSession();
  
  const [anamneseData, setAnamneseData] = React.useState({
    klacht: state.anamneseData?.klacht || '',
    ontstaanswijze: state.anamneseData?.ontstaanswijze || '',
    beloop: state.anamneseData?.beloop || '',
    beperkingen: state.anamneseData?.beperkingen || '',
    hulpvraag: state.anamneseData?.hulpvraag || '',
    verwachtingen: state.anamneseData?.verwachtingen || '',
    voorgaande_behandelingen: state.anamneseData?.voorgaande_behandelingen || '',
    medicatie: state.anamneseData?.medicatie || '',
    comorbiditeit: state.anamneseData?.comorbiditeit || '',
    werk_sport: state.anamneseData?.werk_sport || '',
    aanvullende_info: state.anamneseData?.aanvullende_info || '',
  });

  const [activeRecording, setActiveRecording] = React.useState<string | null>(null);

  // Redirect to main page if no session is active
  useEffect(() => {
    if (!state.sessionId) {
      router.push('/scribe');
    }
  }, [state.sessionId, router]);

  // Auto-save anamnese data when it changes
  useEffect(() => {
    if (state.sessionId) {
      const timer = setTimeout(() => {
        updateAnamnese(anamneseData);
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timer);
    }
  }, [anamneseData, updateAnamnese, state.sessionId]);

  const handleInputChange = (field: string, value: string) => {
    setAnamneseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAudioSave = (field: string, audioBlob: Blob) => {
    // In a real implementation, you would upload this to your backend
    // and then get transcription via your AI service
    console.log(`Audio saved for field: ${field}`, audioBlob);
    
    // For now, we'll just add a placeholder text indicating audio was recorded
    const timestamp = new Date().toLocaleTimeString();
    const currentValue = anamneseData[field as keyof typeof anamneseData] || '';
    const audioNote = `[Audio opname ${timestamp}]\n`;
    
    handleInputChange(field, audioNote + currentValue);
  };

  const handleNext = () => {
    // Save final anamnese data
    updateAnamnese(anamneseData);
    nextStep();
  };

  if (!state.sessionId) {
    return null; // Will redirect
  }

  const anamneseFields = [
    {
      key: 'klacht',
      title: 'Hoofdklacht',
      subtitle: 'Primaire reden voor bezoek',
      icon: <MessageCircle size={20} className="text-red-500" />,
      placeholder: 'Beschrijf de hoofdklacht van de patiënt. Wat is het primaire probleem waarvoor de patiënt komt?',
    },
    {
      key: 'ontstaanswijze',
      title: 'Ontstaanswijze',
      subtitle: 'Hoe en wanneer begonnen',
      icon: <Clock size={20} className="text-orange-500" />,
      placeholder: 'Hoe is de klacht ontstaan? Plotseling, geleidelijk? Specifieke trigger of activiteit?',
    },
    {
      key: 'beloop',
      title: 'Beloop',
      subtitle: 'Verloop sinds ontstaan',
      icon: <TrendingDown size={20} className="text-blue-500" />,
      placeholder: 'Hoe heeft de klacht zich ontwikkeld? Verbeterd, verslechterd, stabiel? Wisselend beloop?',
    },
    {
      key: 'beperkingen',
      title: 'Beperkingen',
      subtitle: 'Functionele impact',
      icon: <Users size={20} className="text-purple-500" />,
      placeholder: 'Welke dagelijkse activiteiten zijn beïnvloed? ADL, werk, sport, sociale activiteiten?',
    },
    {
      key: 'hulpvraag',
      title: 'Hulpvraag',
      subtitle: 'Wat wil patiënt bereiken',
      icon: <HelpCircle size={20} className="text-green-500" />,
      placeholder: 'Wat verwacht de patiënt van de behandeling? Specifieke doelen of wensen?',
    },
    {
      key: 'verwachtingen',
      title: 'Verwachtingen',
      subtitle: 'Behandeldoelen patiënt',
      icon: <Target size={20} className="text-indigo-500" />,
      placeholder: 'Wat zijn de verwachtingen van de patiënt? Realistische doelen? Tijdshorizon?',
    },
    {
      key: 'voorgaande_behandelingen',
      title: 'Voorgaande Behandelingen',
      subtitle: 'Eerdere zorgverlening',
      icon: <History size={20} className="text-gray-500" />,
      placeholder: 'Welke behandelingen heeft patiënt al gehad? Effect? Bij welke zorgverleners?',
    },
    {
      key: 'medicatie',
      title: 'Medicatie & Pijnstilling',
      subtitle: 'Huidige medicijn gebruik',
      icon: <Pill size={20} className="text-pink-500" />,
      placeholder: 'Welke medicijnen gebruikt de patiënt? Pijnstillers, ontstekingsremmers, andere medicatie?',
    },
    {
      key: 'comorbiditeit',
      title: 'Comorbiditeit',
      subtitle: 'Andere aandoeningen',
      icon: <Activity size={20} className="text-red-400" />,
      placeholder: 'Andere relevante aandoeningen? Chronische ziektes? Operaties? Blessures?',
    },
    {
      key: 'werk_sport',
      title: 'Werk & Sport',
      subtitle: 'Activiteitenniveau',
      icon: <Briefcase size={20} className="text-yellow-500" />,
      placeholder: 'Werk: fysiek belastend? Sport: welke sporten, niveau, frequentie? Hobby\'s?',
    },
    {
      key: 'aanvullende_info',
      title: 'Aanvullende Informatie',
      subtitle: 'Overige relevante details',
      icon: <Info size={20} className="text-teal-500" />,
      placeholder: 'Andere relevante informatie die niet eerder besproken is?',
    },
  ];

  return (
    <IntakeWorkflowLayout
      title="Anamnese"
      subtitle="Systematische klachtonderzoek en voorgeschiedenis"
      onNext={handleNext}
      onPrevious={previousStep}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h2 className="text-2xl font-bold text-text-secondary mb-2">
            Anamnese - {state.patientInfo?.initials} ({state.patientInfo?.birthYear})
          </h2>
          <p className="text-text-muted max-w-3xl mx-auto">
            Verzamel systematisch alle relevante informatie over de klacht, voorgeschiedenis en context. 
            Gebruik de audio-opname functie voor efficiënte registratie tijdens het gesprek.
          </p>
        </div>

        {/* Anamnese Fields */}
        <div className="space-y-6">
          {anamneseFields.map((field) => (
            <Card key={field.key} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {field.icon}
                    <div>
                      <CardTitle className="text-lg">{field.title}</CardTitle>
                      <CardDescription>{field.subtitle}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <AudioRecorder
                      onAudioSave={(audioBlob) => handleAudioSave(field.key, audioBlob)}
                      className="w-10 h-10"
                      isActive={activeRecording === field.key}
                      onActiveChange={(active) => setActiveRecording(active ? field.key : null)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Textarea
                  placeholder={field.placeholder}
                  value={anamneseData[field.key as keyof typeof anamneseData]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  rows={4}
                  className="min-h-[120px] resize-none"
                />
                
                {/* Character count and helpful hints */}
                <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <span>
                      {(anamneseData[field.key as keyof typeof anamneseData] || '').length} karakters
                    </span>
                    {(anamneseData[field.key as keyof typeof anamneseData] || '').length > 0 && (
                      <span className="text-green-600">✓ Ingevuld</span>
                    )}
                  </div>
                  
                  <span className="italic">
                    Gebruik audio-opname voor snellere registratie
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Summary */}
        <Card className="border-hysio-deep-green/30 bg-hysio-deep-green/5">
          <CardHeader>
            <CardTitle className="text-hysio-deep-green">Anamnese Voortgang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {anamneseFields.slice(0, 8).map((field) => {
                const isCompleted = (anamneseData[field.key as keyof typeof anamneseData] || '').length > 10;
                return (
                  <div key={field.key} className={`
                    flex items-center gap-2 p-2 rounded
                    ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {isCompleted ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                    )}
                    <span className="text-xs truncate">{field.title}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-sm text-text-muted">
              <strong>Tip:</strong> Een complete anamnese vormt de basis voor een goede diagnose. 
              Neem de tijd voor elk onderdeel en gebruik de audio-opname voor efficiëntie.
            </div>
          </CardContent>
        </Card>
      </div>
    </IntakeWorkflowLayout>
  );
}