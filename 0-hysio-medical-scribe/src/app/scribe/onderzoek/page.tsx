'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeWorkflowLayout } from '@/components/intake/IntakeWorkflowLayout';
import { useIntakeSession } from '@/context/IntakeSessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/ui/audio-recorder';
import { 
  Eye, 
  RotateCcw, 
  Activity, 
  Zap, 
  Hand, 
  TestTube,
  Plus,
  Trash2,
  Target
} from 'lucide-react';

interface Meting {
  test: string;
  resultaat: string;
  referentiewaarde: string;
  interpretatie: string;
}

export default function OnderzoekPage() {
  const router = useRouter();
  const { state, updateOnderzoek, nextStep, previousStep } = useIntakeSession();
  
  const [onderzoekData, setOnderzoekData] = React.useState({
    observatie: state.onderzoekData?.observatie || '',
    bewegingsonderzoek: state.onderzoekData?.bewegingsonderzoek || '',
    functieonderzoek: state.onderzoekData?.functieonderzoek || '',
    provocatietesten: state.onderzoekData?.provocatietesten || '',
    palpatie: state.onderzoekData?.palpatie || '',
    aanvullende_testen: state.onderzoekData?.aanvullende_testen || '',
    metingen: state.onderzoekData?.metingen || [],
  });

  const [activeRecording, setActiveRecording] = React.useState<string | null>(null);

  // Redirect to main page if no session is active
  useEffect(() => {
    if (!state.sessionId) {
      router.push('/scribe');
    }
  }, [state.sessionId, router]);

  // Auto-save onderzoek data when it changes
  useEffect(() => {
    if (state.sessionId) {
      const timer = setTimeout(() => {
        updateOnderzoek(onderzoekData);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [onderzoekData, updateOnderzoek, state.sessionId]);

  const handleInputChange = (field: string, value: string) => {
    setOnderzoekData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetingChange = (index: number, field: keyof Meting, value: string) => {
    setOnderzoekData(prev => ({
      ...prev,
      metingen: prev.metingen.map((meting, i) => 
        i === index ? { ...meting, [field]: value } : meting
      )
    }));
  };

  const addMeting = () => {
    setOnderzoekData(prev => ({
      ...prev,
      metingen: [...prev.metingen, {
        test: '',
        resultaat: '',
        referentiewaarde: '',
        interpretatie: ''
      }]
    }));
  };

  const removeMeting = (index: number) => {
    setOnderzoekData(prev => ({
      ...prev,
      metingen: prev.metingen.filter((_, i) => i !== index)
    }));
  };

  const handleAudioSave = (field: string, audioBlob: Blob) => {
    console.log(`Audio saved for field: ${field}`, audioBlob);
    const timestamp = new Date().toLocaleTimeString();
    const currentValue = onderzoekData[field as keyof typeof onderzoekData] as string || '';
    const audioNote = `[Audio opname ${timestamp}]\n`;
    
    handleInputChange(field, audioNote + currentValue);
  };

  const handleNext = () => {
    updateOnderzoek(onderzoekData);
    nextStep();
  };

  if (!state.sessionId) {
    return null;
  }

  const onderzoekSections = [
    {
      key: 'observatie',
      title: 'Observatie',
      subtitle: 'Visuele inspectie en houding',
      icon: <Eye size={20} className="text-blue-500" />,
      placeholder: 'Houding, stand, asymmetrieën, zwelling, roodheid, bewegingspatronen, compensaties...',
    },
    {
      key: 'bewegingsonderzoek',
      title: 'Bewegingsonderzoek',
      subtitle: 'Actief en passief bewegingsonderzoek',
      icon: <RotateCcw size={20} className="text-green-500" />,
      placeholder: 'ROM metingen, eindgevoel, pijn tijdens beweging, bewegingsrestricties, compensaties...',
    },
    {
      key: 'functieonderzoek',
      title: 'Functieonderzoek',
      subtitle: 'Kracht, stabiliteit, coördinatie',
      icon: <Activity size={20} className="text-purple-500" />,
      placeholder: 'Spiersterkte, stabiliteitstest, coördinatie, balans, functionele testen...',
    },
    {
      key: 'provocatietesten',
      title: 'Provocatie Testen',
      subtitle: 'Specifieke orthopedische testen',
      icon: <Zap size={20} className="text-red-500" />,
      placeholder: 'Provocatieve testen, orthopedische testen, neurodynamische testen, uitkomsten...',
    },
    {
      key: 'palpatie',
      title: 'Palpatie',
      subtitle: 'Handmatig onderzoek weefsels',
      icon: <Hand size={20} className="text-orange-500" />,
      placeholder: 'Temperatuur, zwelling, spanning, trigger points, gevoeligheid, textuur...',
    },
    {
      key: 'aanvullende_testen',
      title: 'Aanvullende Testen',
      subtitle: 'Overige onderzoeksbevindingen',
      icon: <TestTube size={20} className="text-indigo-500" />,
      placeholder: 'Neurologisch onderzoek, vasculair onderzoek, ademhalingsonderzoek, overige bevindingen...',
    },
  ];

  return (
    <IntakeWorkflowLayout
      title="Lichamelijk Onderzoek"
      subtitle="Systematisch bewegingsapparaat onderzoek"
      onNext={handleNext}
      onPrevious={previousStep}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h2 className="text-2xl font-bold text-text-secondary mb-2">
            Onderzoek - {state.patientInfo?.initials} ({state.patientInfo?.birthYear})
          </h2>
          <p className="text-text-muted max-w-3xl mx-auto">
            Voer een systematisch lichamelijk onderzoek uit. Documenteer alle bevindingen zorgvuldig 
            en gebruik objectieve meetwaarden waar mogelijk.
          </p>
        </div>

        {/* Onderzoek Sections */}
        <div className="space-y-6">
          {onderzoekSections.map((section) => (
            <Card key={section.key} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.subtitle}</CardDescription>
                    </div>
                  </div>
                  
                  <AudioRecorder
                    onAudioSave={(audioBlob) => handleAudioSave(section.key, audioBlob)}
                    className="w-10 h-10"
                    isActive={activeRecording === section.key}
                    onActiveChange={(active) => setActiveRecording(active ? section.key : null)}
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                <Textarea
                  placeholder={section.placeholder}
                  value={onderzoekData[section.key as keyof typeof onderzoekData] as string}
                  onChange={(e) => handleInputChange(section.key, e.target.value)}
                  rows={4}
                  className="min-h-[120px] resize-none"
                />
                
                <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <span>
                      {((onderzoekData[section.key as keyof typeof onderzoekData] as string) || '').length} karakters
                    </span>
                    {((onderzoekData[section.key as keyof typeof onderzoekData] as string) || '').length > 0 && (
                      <span className="text-green-600">✓ Ingevuld</span>
                    )}
                  </div>
                  <span className="italic">
                    Audio-opname beschikbaar
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Metingen & Testresultaten */}
        <Card className="border-hysio-assistant/30 bg-hysio-assistant/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-hysio-assistant" />
                <div>
                  <CardTitle className="text-hysio-assistant">Metingen & Testresultaten</CardTitle>
                  <CardDescription>Objectieve meetwaarden en testuitkomsten</CardDescription>
                </div>
              </div>
              
              <Button
                onClick={addMeting}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus size={16} />
                Meting toevoegen
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {onderzoekData.metingen.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Target size={48} className="mx-auto mb-4 opacity-50" />
                <p>Geen metingen toegevoegd</p>
                <p className="text-sm">Klik op "Meting toevoegen" om objectieve testresultaten te documenteren</p>
              </div>
            ) : (
              onderzoekData.metingen.map((meting, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Meting {index + 1}</CardTitle>
                      <Button
                        onClick={() => removeMeting(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`test-${index}`}>Test/Meting</Label>
                        <Input
                          id={`test-${index}`}
                          placeholder="bijv. Flexie heup rechts"
                          value={meting.test}
                          onChange={(e) => handleMetingChange(index, 'test', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`resultaat-${index}`}>Resultaat</Label>
                        <Input
                          id={`resultaat-${index}`}
                          placeholder="bijv. 90°"
                          value={meting.resultaat}
                          onChange={(e) => handleMetingChange(index, 'resultaat', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`referentie-${index}`}>Referentiewaarde</Label>
                        <Input
                          id={`referentie-${index}`}
                          placeholder="bijv. 110-120°"
                          value={meting.referentiewaarde}
                          onChange={(e) => handleMetingChange(index, 'referentiewaarde', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`interpretatie-${index}`}>Interpretatie</Label>
                        <Textarea
                          id={`interpretatie-${index}`}
                          placeholder="Klinische interpretatie van het resultaat..."
                          value={meting.interpretatie}
                          onChange={(e) => handleMetingChange(index, 'interpretatie', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Onderzoek Samenvatting */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Onderzoek Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {onderzoekSections.map((section) => {
                const isCompleted = ((onderzoekData[section.key as keyof typeof onderzoekData] as string) || '').length > 10;
                return (
                  <div key={section.key} className={`
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
                    <span className="text-xs truncate">{section.title}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-text-muted">
                <strong>Metingen toegevoegd:</strong> {onderzoekData.metingen.length}
              </div>
              
              <div className="text-text-muted">
                Een grondig onderzoek vormt de basis voor een betrouwbare diagnose
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </IntakeWorkflowLayout>
  );
}