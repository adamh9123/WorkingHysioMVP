import * as React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { PatientInfo } from '@/lib/types';

export interface PatientInfoFormProps {
  onPatientInfoSubmit: (patientInfo: PatientInfo) => void;
  onBack: () => void;
  initialData?: Partial<PatientInfo>;
  sessionType: 'intake' | 'followup';
  disabled?: boolean;
  className?: string;
}

interface FormErrors {
  initials?: string;
  birthYear?: string;
  gender?: string;
  chiefComplaint?: string;
}

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({
  onPatientInfoSubmit,
  onBack,
  initialData = {},
  sessionType,
  disabled = false,
  className,
}) => {
  const [formData, setFormData] = React.useState<PatientInfo>({
    initials: initialData.initials || '',
    birthYear: initialData.birthYear || '',
    gender: initialData.gender || 'man',
    chiefComplaint: initialData.chiefComplaint || '',
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.initials?.trim()) {
      newErrors.initials = 'Voorletters zijn verplicht';
    } else if (formData.initials.length > 10) {
      newErrors.initials = 'Voorletters mogen maximaal 10 karakters bevatten';
    }

    if (!formData.birthYear?.trim()) {
      newErrors.birthYear = 'Geboortejaar is verplicht';
    } else {
      const year = parseInt(formData.birthYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        newErrors.birthYear = `Geboortejaar moet tussen 1900 en ${currentYear} liggen`;
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Geslacht is verplicht';
    }

    if (!formData.chiefComplaint?.trim()) {
      newErrors.chiefComplaint = 'Hoofdklacht is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || disabled) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate age and add it to form data
      const currentYear = new Date().getFullYear();
      const calculatedAge = formData.birthYear ? currentYear - parseInt(formData.birthYear) : undefined;
      
      const patientDataWithAge = {
        ...formData,
        age: calculatedAge,
      };
      
      onPatientInfoSubmit(patientDataWithAge);
    } catch (error) {
      console.error('Error submitting patient info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAge = (birthYear: string): number | null => {
    if (!birthYear) return null;
    const year = parseInt(birthYear);
    if (isNaN(year)) return null;
    return new Date().getFullYear() - year;
  };

  const age = getAge(formData.birthYear);

  return (
    <div className={cn('min-h-screen bg-hysio-cream/30 w-full py-6', className)}>
      <div className="w-full max-w-3xl mx-auto px-6">
        <Card className="border-2 border-hysio-mint/20 bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-hysio-mint/20 rounded-full flex items-center justify-center">
              <User size={24} className="text-hysio-deep-green" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold text-hysio-deep-green">
                Patiëntinformatie
              </CardTitle>
              <CardDescription className="text-hysio-deep-green-900/70">
                {sessionType === 'intake' 
                  ? 'Vul de essentiële gegevens in voor intake voorbereiding'
                  : 'Controleer patiëntgegevens voor vervolgconsult'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-hysio-deep-green flex items-center gap-2">
                <User size={18} />
                Basisgegevens
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initials" className="text-hysio-deep-green">
                    Voorletters *
                  </Label>
                  <Input
                    id="initials"
                    value={formData.initials}
                    onChange={(e) => handleInputChange('initials', e.target.value.toUpperCase())}
                    placeholder="J.P."
                    disabled={disabled || isSubmitting}
                    className={cn(errors.initials && 'border-red-500')}
                    maxLength={10}
                  />
                  <p className="text-xs text-hysio-deep-green-900/60">
                    Bijvoorbeeld: J.P. of M.A.J.
                  </p>
                  {errors.initials && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.initials}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthYear" className="text-hysio-deep-green flex items-center gap-1">
                    <Calendar size={16} />
                    Geboortejaar *
                  </Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={formData.birthYear}
                    onChange={(e) => handleInputChange('birthYear', e.target.value)}
                    placeholder="1985"
                    min="1900"
                    max={new Date().getFullYear()}
                    disabled={disabled || isSubmitting}
                    className={cn(errors.birthYear && 'border-red-500')}
                  />
                  {formData.birthYear && (
                    <p className="text-sm text-hysio-deep-green-900/70">
                      Leeftijd: ca. {new Date().getFullYear() - parseInt(formData.birthYear)} jaar
                    </p>
                  )}
                  {errors.birthYear && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.birthYear}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-hysio-deep-green">
                  Geslacht *
                </Label>
                <div className="flex gap-4">
                  {['man', 'vrouw'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={formData.gender === option}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        disabled={disabled || isSubmitting}
                        className="text-hysio-mint focus:ring-hysio-mint"
                      />
                      <span className="text-sm text-hysio-deep-green capitalize">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-hysio-deep-green flex items-center gap-2">
                <FileText size={18} />
                Medische informatie
              </h3>

              <div className="space-y-2">
                <Label htmlFor="chiefComplaint" className="text-hysio-deep-green">
                  Hoofdklacht *
                </Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                  placeholder="Beschrijf de hoofdklacht van de patiënt..."
                  rows={3}
                  disabled={disabled || isSubmitting}
                  className={cn(errors.chiefComplaint && 'border-red-500')}
                />
                {errors.chiefComplaint && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.chiefComplaint}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                disabled={isSubmitting}
                className="sm:w-auto"
              >
                Terug
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={disabled || isSubmitting}
                className="flex-1 sm:flex-none sm:min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Bezig met opslaan...
                  </>
                ) : (
                  `Ga verder naar ${sessionType === 'intake' ? 'intake workflow' : 'vervolgconsult'}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-hysio-deep-green-900/60">
            Alle gegevens worden veilig opgeslagen en zijn alleen toegankelijk voor bevoegd zorgpersoneel
          </p>
          <p className="text-xs text-hysio-deep-green-900/50 mt-1">
            * = Verplichte velden
          </p>
        </div>
      </div>
    </div>
  );
};

export { PatientInfoForm };