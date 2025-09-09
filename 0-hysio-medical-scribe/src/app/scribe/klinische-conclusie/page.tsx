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
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
  ArrowRight,
  FileText,
  Calendar
} from 'lucide-react';

interface Hypothese {
  hypothese: string;
  onderbouwing: string;
  waarschijnlijkheid: 'hoog' | 'middel' | 'laag';
}

interface Doel {
  doel: string;
  termijn: 'kort' | 'middel' | 'lang';
  meetbaar: boolean;
}

export default function KlinischeConclusie() {
  const router = useRouter();
  const { state, updateKlinischeConclusie, resetSession, saveSession } = useIntakeSession();
  
  const [conclusieData, setConclusieData] = React.useState({
    hypotheses: state.klinischeConclusieData?.hypotheses || [],
    diagnose: state.klinischeConclusieData?.diagnose || '',
    prognose: state.klinischeConclusieData?.prognose || '',
    behandelplan: state.klinischeConclusieData?.behandelplan || '',
    doelen: state.klinischeConclusieData?.doelen || [],
    rode_vlagen: state.klinischeConclusieData?.rode_vlagen || [],
    vervolgstappen: state.klinischeConclusieData?.vervolgstappen || '',
  });

  const [newHypothese, setNewHypothese] = React.useState<Hypothese>({
    hypothese: '',
    onderbouwing: '',
    waarschijnlijkheid: 'middel'
  });

  const [newDoel, setNewDoel] = React.useState<Doel>({
    doel: '',
    termijn: 'kort',
    meetbaar: false
  });

  const [newRodeVlag, setNewRodeVlag] = React.useState('');

  // Redirect if no session
  useEffect(() => {
    if (!state.sessionId) {
      router.push('/scribe');
    }
  }, [state.sessionId, router]);

  // Auto-save
  useEffect(() => {
    if (state.sessionId) {
      const timer = setTimeout(() => {
        updateKlinischeConclusie(conclusieData);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [conclusieData, updateKlinischeConclusie, state.sessionId]);

  const handleInputChange = (field: string, value: string) => {
    setConclusieData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addHypothese = () => {
    if (newHypothese.hypothese.trim()) {
      setConclusieData(prev => ({
        ...prev,
        hypotheses: [...prev.hypotheses, { ...newHypothese }]
      }));
      setNewHypothese({
        hypothese: '',
        onderbouwing: '',
        waarschijnlijkheid: 'middel'
      });
    }
  };

  const removeHypothese = (index: number) => {
    setConclusieData(prev => ({
      ...prev,
      hypotheses: prev.hypotheses.filter((_, i) => i !== index)
    }));
  };

  const addDoel = () => {
    if (newDoel.doel.trim()) {
      setConclusieData(prev => ({
        ...prev,
        doelen: [...prev.doelen, { ...newDoel }]
      }));
      setNewDoel({
        doel: '',
        termijn: 'kort',
        meetbaar: false
      });
    }
  };

  const removeDoel = (index: number) => {
    setConclusieData(prev => ({
      ...prev,
      doelen: prev.doelen.filter((_, i) => i !== index)
    }));
  };

  const addRodeVlag = () => {
    if (newRodeVlag.trim()) {
      setConclusieData(prev => ({
        ...prev,
        rode_vlagen: [...prev.rode_vlagen, newRodeVlag]
      }));
      setNewRodeVlag('');
    }
  };

  const removeRodeVlag = (index: number) => {
    setConclusieData(prev => ({
      ...prev,
      rode_vlagen: prev.rode_vlagen.filter((_, i) => i !== index)
    }));
  };

  const handleCompleteIntake = async () => {
    // Save final data
    updateKlinischeConclusie(conclusieData);
    await saveSession();
    
    // Navigate to completion page or dashboard
    router.push('/dashboard');
  };

  const getWaarschijnlijkheidColor = (waarschijnlijkheid: string) => {
    switch (waarschijnlijkheid) {
      case 'hoog': return 'bg-green-100 text-green-800 border-green-300';
      case 'middel': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'laag': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTermijnColor = (termijn: string) => {
    switch (termijn) {
      case 'kort': return 'bg-blue-100 text-blue-800';
      case 'middel': return 'bg-purple-100 text-purple-800';
      case 'lang': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!state.sessionId) {
    return null;
  }

  return (
    <IntakeWorkflowLayout
      title="Klinische Conclusie"
      subtitle="Diagnose, prognose en behandelplan"
      canGoNext={false}
      showProgressBar={false}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h2 className="text-2xl font-bold text-text-secondary mb-2">
            Klinische Conclusie - {state.patientInfo?.initials} ({state.patientInfo?.birthYear})
          </h2>
          <p className="text-text-muted max-w-3xl mx-auto">
            Formuleer hypotheses, definitieve diagnose, prognose en behandelplan op basis van 
            de verzamelde anamnese en onderzoeksbevindingen.
          </p>
        </div>

        {/* Hypotheses */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Brain size={24} className="text-purple-600" />
              <div>
                <CardTitle className="text-purple-800">Diagnostische Hypotheses</CardTitle>
                <CardDescription className="text-purple-600">
                  Mogelijke diagnoses gerangschikt naar waarschijnlijkheid
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Hypotheses */}
            {conclusieData.hypotheses.map((hypothese, index) => (
              <Card key={index} className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-secondary mb-1">
                        {hypothese.hypothese}
                      </h4>
                      <Badge className={getWaarschijnlijkheidColor(hypothese.waarschijnlijkheid)}>
                        {hypothese.waarschijnlijkheid} waarschijnlijkheid
                      </Badge>
                    </div>
                    <Button
                      onClick={() => removeHypothese(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-text-muted">{hypothese.onderbouwing}</p>
                </CardContent>
              </Card>
            ))}

            {/* Add New Hypothese */}
            <Card className="border-dashed border-2 border-purple-300">
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Nieuwe hypothese (bijv. 'Laterale epicondylitis rechts')"
                  value={newHypothese.hypothese}
                  onChange={(e) => setNewHypothese(prev => ({ ...prev, hypothese: e.target.value }))}
                />
                
                <Textarea
                  placeholder="Onderbouwing van de hypothese..."
                  value={newHypothese.onderbouwing}
                  onChange={(e) => setNewHypothese(prev => ({ ...prev, onderbouwing: e.target.value }))}
                  rows={2}
                />
                
                <div className="flex items-center gap-3">
                  <Label>Waarschijnlijkheid:</Label>
                  <select
                    value={newHypothese.waarschijnlijkheid}
                    onChange={(e) => setNewHypothese(prev => ({ ...prev, waarschijnlijkheid: e.target.value as 'hoog' | 'middel' | 'laag' }))}
                    className="p-1 border rounded"
                  >
                    <option value="hoog">Hoog</option>
                    <option value="middel">Middel</option>
                    <option value="laag">Laag</option>
                  </select>
                  
                  <Button
                    onClick={addHypothese}
                    size="sm"
                    className="ml-auto"
                    disabled={!newHypothese.hypothese.trim()}
                  >
                    <Plus size={16} className="mr-1" />
                    Toevoegen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Diagnose & Prognose */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <CardTitle>Definitieve Diagnose</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Formuleer de definitieve diagnose op basis van anamnese en onderzoek..."
                value={conclusieData.diagnose}
                onChange={(e) => handleInputChange('diagnose', e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                <CardTitle>Prognose</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Verwachte herstel, tijdslijn, prognostische factoren..."
                value={conclusieData.prognose}
                onChange={(e) => handleInputChange('prognose', e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Behandelplan */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-hysio-deep-green" />
              <CardTitle>Behandelplan</CardTitle>
            </div>
            <CardDescription>
              Gedetailleerde behandelstrategie en interventies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Beschrijf de behandelstrategie, interventies, frequentie, duur..."
              value={conclusieData.behandelplan}
              onChange={(e) => handleInputChange('behandelplan', e.target.value)}
              rows={6}
              className="min-h-[150px]"
            />
          </CardContent>
        </Card>

        {/* Behandeldoelen */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={24} className="text-blue-600" />
                <div>
                  <CardTitle className="text-blue-800">Behandeldoelen</CardTitle>
                  <CardDescription className="text-blue-600">
                    SMART geformuleerde behandeldoelen
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {conclusieData.doelen.map((doel, index) => (
              <Card key={index} className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-text-secondary mb-2">{doel.doel}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getTermijnColor(doel.termijn)}>
                          {doel.termijn} termijn
                        </Badge>
                        {doel.meetbaar && (
                          <Badge className="bg-green-100 text-green-800">
                            Meetbaar
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => removeDoel(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Doel */}
            <Card className="border-dashed border-2 border-blue-300">
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Behandeldoel (bijv. 'Pijnreductie tot VAS ≤ 3')"
                  value={newDoel.doel}
                  onChange={(e) => setNewDoel(prev => ({ ...prev, doel: e.target.value }))}
                />
                
                <div className="flex items-center gap-3">
                  <Label>Termijn:</Label>
                  <select
                    value={newDoel.termijn}
                    onChange={(e) => setNewDoel(prev => ({ ...prev, termijn: e.target.value as 'kort' | 'middel' | 'lang' }))}
                    className="p-1 border rounded"
                  >
                    <option value="kort">Kort (1-4 weken)</option>
                    <option value="middel">Middel (1-3 maanden)</option>
                    <option value="lang">Lang (3+ maanden)</option>
                  </select>
                  
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={newDoel.meetbaar}
                      onChange={(e) => setNewDoel(prev => ({ ...prev, meetbaar: e.target.checked }))}
                    />
                    Meetbaar
                  </label>
                  
                  <Button
                    onClick={addDoel}
                    size="sm"
                    className="ml-auto"
                    disabled={!newDoel.doel.trim()}
                  >
                    <Plus size={16} className="mr-1" />
                    Toevoegen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Rode Vlagen */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <CardTitle className="text-red-800">Rode Vlagen</CardTitle>
                <CardDescription className="text-red-600">
                  Waarschuwingssignalen die doorverwijzing vereisen
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {conclusieData.rode_vlagen.map((vlag, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-text-secondary">{vlag}</span>
                <Button
                  onClick={() => removeRodeVlag(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                placeholder="Nieuwe rode vlag..."
                value={newRodeVlag}
                onChange={(e) => setNewRodeVlag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRodeVlag()}
              />
              <Button
                onClick={addRodeVlag}
                size="sm"
                disabled={!newRodeVlag.trim()}
              >
                <Plus size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vervolgstappen */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-hysio-assistant" />
              <CardTitle>Vervolgstappen</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Vervolgafspraken, doorverwijzing, huiswerk, controle momenten..."
              value={conclusieData.vervolgstappen}
              onChange={(e) => handleInputChange('vervolgstappen', e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Completion Actions */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <CardTitle className="text-green-800">Intake Afronden</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-green-700">
              <p className="mb-2">
                <strong>Intake compleet!</strong> Controleer alle onderdelen voordat u afrondt:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Hypotheses geformuleerd ({conclusieData.hypotheses.length} stuks)</li>
                <li>Definitieve diagnose gesteld</li>
                <li>Prognose bepaald</li>
                <li>Behandelplan opgesteld</li>
                <li>Behandeldoelen vastgesteld ({conclusieData.doelen.length} stuks)</li>
                <li>Vervolgstappen gedefinieerd</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push('/scribe/anamnese')}
                variant="outline"
                className="gap-2"
              >
                Terug naar Anamnese
              </Button>
              
              <Button
                onClick={handleCompleteIntake}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Intake Afronden
                <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </IntakeWorkflowLayout>
  );
}