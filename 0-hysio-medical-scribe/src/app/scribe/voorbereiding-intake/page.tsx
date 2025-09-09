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
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function VoorbereidingIntakePage() {
  const router = useRouter();
  const { state, updatePatientInfo, nextStep } = useIntakeSession();
  
  const [patientData, setPatientData] = React.useState({
    initials: state.patientInfo?.initials || '',
    birthYear: state.patientInfo?.birthYear || '',
    gender: state.patientInfo?.gender || '',
    email: state.patientInfo?.email || '',
    phone: state.patientInfo?.phone || '',
    address: state.patientInfo?.address || '',
    referringPhysician: state.patientInfo?.referringPhysician || '',
    referralReason: state.patientInfo?.referralReason || '',
    previousTreatments: state.patientInfo?.previousTreatments || '',
    medicalHistory: state.patientInfo?.medicalHistory || '',
    currentMedication: state.patientInfo?.currentMedication || '',
    allergies: state.patientInfo?.allergies || '',
    specialNotes: state.patientInfo?.specialNotes || '',
  });

  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // Redirect to main page if no session is active
  useEffect(() => {
    if (!state.sessionId) {
      router.push('/scribe');
    }
  }, [state.sessionId, router]);

  const handleInputChange = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!patientData.initials.trim()) {
      errors.push('Initialen zijn verplicht');
    }
    
    if (!patientData.birthYear.trim()) {
      errors.push('Geboortejaar is verplicht');
    } else if (!/^\d{4}$/.test(patientData.birthYear)) {
      errors.push('Geboortejaar moet 4 cijfers bevatten');
    }
    
    if (!patientData.gender) {
      errors.push('Geslacht is verplicht');
    }
    
    if (patientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientData.email)) {
      errors.push('E-mailadres is niet geldig');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      const updatedPatientInfo = {
        ...state.patientInfo!,
        ...patientData,
      };
      
      updatePatientInfo(updatedPatientInfo);
      nextStep();
    }
  };

  if (!state.sessionId) {
    return null; // Will redirect
  }

  return (
    <IntakeWorkflowLayout
      title="Voorbereiding Intake"
      subtitle="Verzamel en controleer patiëntgegevens"
      canGoPrevious={false}
      onNext={handleNext}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h2 className="text-2xl font-bold text-text-secondary mb-2">
            Patiënt Voorbereiding
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Zorg ervoor dat alle patiëntgegevens compleet en correct zijn voordat u begint met de anamnese. 
            Deze informatie wordt gebruikt voor de gehele intake-procedure.
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <CardTitle className="text-red-800">Controleer de volgende velden:</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Basis Patiëntgegevens */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User size={20} className="text-hysio-deep-green" />
                <CardTitle>Basisgegevens</CardTitle>
              </div>
              <CardDescription>
                Essentiële patiëntinformatie voor identificatie en communicatie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initials" className="required">Initialen</Label>
                  <Input
                    id="initials"
                    placeholder="J.P."
                    value={patientData.initials}
                    onChange={(e) => handleInputChange('initials', e.target.value)}
                    className={validationErrors.some(e => e.includes('Initialen')) ? 'border-red-300' : ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthYear" className="required">Geboortejaar</Label>
                  <Input
                    id="birthYear"
                    placeholder="1990"
                    value={patientData.birthYear}
                    onChange={(e) => handleInputChange('birthYear', e.target.value)}
                    maxLength={4}
                    className={validationErrors.some(e => e.includes('Geboortejaar')) ? 'border-red-300' : ''}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="gender" className="required">Geslacht</Label>
                <select
                  id="gender"
                  value={patientData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full p-2 border rounded-md ${validationErrors.some(e => e.includes('Geslacht')) ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Selecteer geslacht</option>
                  <option value="man">Man</option>
                  <option value="vrouw">Vrouw</option>
                  <option value="anders">Anders</option>
                </select>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail size={14} />
                  E-mailadres
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="patient@voorbeeld.nl"
                  value={patientData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={validationErrors.some(e => e.includes('E-mailadres')) ? 'border-red-300' : ''}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone size={14} />
                  Telefoonnummer
                </Label>
                <Input
                  id="phone"
                  placeholder="06-12345678"
                  value={patientData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin size={14} />
                  Adres
                </Label>
                <Input
                  id="address"
                  placeholder="Straatnaam 123, Stad"
                  value={patientData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medische Voorbereiding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-hysio-assistant" />
                <CardTitle>Medische Voorbereiding</CardTitle>
              </div>
              <CardDescription>
                Relevante medische voorgeschiedenis en verwijsgegevens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="referringPhysician">Verwijzend arts/specialist</Label>
                <Input
                  id="referringPhysician"
                  placeholder="Dr. A. Jansen, Huisarts"
                  value={patientData.referringPhysician}
                  onChange={(e) => handleInputChange('referringPhysician', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="referralReason">Reden van verwijzing</Label>
                <Textarea
                  id="referralReason"
                  placeholder="Beschrijf de reden voor verwijzing..."
                  value={patientData.referralReason}
                  onChange={(e) => handleInputChange('referralReason', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="medicalHistory">Medische voorgeschiedenis</Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="Relevante medische geschiedenis..."
                  value={patientData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="currentMedication">Huidige medicatie</Label>
                <Textarea
                  id="currentMedication"
                  placeholder="Lijst van huidige medicijnen..."
                  value={patientData.currentMedication}
                  onChange={(e) => handleInputChange('currentMedication', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="allergies">Allergieën/intoleranties</Label>
                <Input
                  id="allergies"
                  placeholder="Bekende allergieën of intoleranties"
                  value={patientData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bijzonderheden */}
        <Card>
          <CardHeader>
            <CardTitle>Bijzonderheden en Notities</CardTitle>
            <CardDescription>
              Aanvullende informatie die relevant kan zijn voor de intake
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="previousTreatments">Eerdere fysiotherapie behandelingen</Label>
                <Textarea
                  id="previousTreatments"
                  placeholder="Beschrijf eerdere behandelingen, resultaten, en ervaringen..."
                  value={patientData.previousTreatments}
                  onChange={(e) => handleInputChange('previousTreatments', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="specialNotes">Speciale opmerkingen</Label>
                <Textarea
                  id="specialNotes"
                  placeholder="Communicatievoorkeuren, beperkingen, culturele aspecten, etc..."
                  value={patientData.specialNotes}
                  onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              <CardTitle className="text-green-800">Pre-Intake Checklist</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Patiëntgegevens compleet</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Verwijsgegevens gecontroleerd</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Medische geschiedenis bekend</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Medicatie en allergieën genoteerd</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Contactgegevens actueel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Klaar voor anamnese</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </IntakeWorkflowLayout>
  );
}