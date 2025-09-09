import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { PatientInfoForm } from './patient-info-form';
import { PatientInfo } from '@/lib/types';

export interface PatientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientInfoSubmit: (patientInfo: PatientInfo) => void;
  initialData?: Partial<PatientInfo>;
  sessionType: 'intake' | 'followup';
  disabled?: boolean;
}

const PatientInfoModal: React.FC<PatientInfoModalProps> = ({
  isOpen,
  onClose,
  onPatientInfoSubmit,
  initialData = {},
  sessionType,
  disabled = false,
}) => {
  const handlePatientInfoSubmit = (patientInfo: PatientInfo) => {
    onPatientInfoSubmit(patientInfo);
    // Modal will be closed by parent component after successful submission
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Patiënt Voorbereiding"
      size="lg"
      closeOnOverlayClick={!disabled}
      showCloseButton={!disabled}
    >
      <div className="p-0"> {/* Remove default modal padding since form has its own */}
        <PatientInfoForm
          onPatientInfoSubmit={handlePatientInfoSubmit}
          onBack={onClose}
          initialData={initialData}
          sessionType={sessionType}
          disabled={disabled}
          className="p-0 max-w-none" // Remove form padding and width constraints
        />
      </div>
    </Modal>
  );
};

export { PatientInfoModal };