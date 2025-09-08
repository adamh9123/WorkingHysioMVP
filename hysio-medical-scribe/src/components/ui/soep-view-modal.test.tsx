/**
 * Tests for SOEP View Modal component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SOEPViewModal } from './soep-view-modal';
import { PatientInfo, SOEPStructure } from '@/lib/types';

// Mock the modal component
jest.mock('./modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) => (
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('SOEPViewModal', () => {
  const mockPatientInfo: PatientInfo = {
    initials: 'J.D.',
    birthYear: '1985',
    gender: 'vrouw',
    chiefComplaint: 'Nekpijn na whiplash',
  };

  const mockSOEPData: SOEPStructure = {
    subjective: 'Patiënt geeft aan sinds 2 weken nekpijn te hebben na een auto-ongeluk.',
    objective: 'Beperkte ROM cervicale wervelkolom, palpabel verhoogde spierspanning.',
    evaluation: 'Whiplash-geassocieerde stoornis graad II.',
    plan: 'Manuele therapie, oefentherapie, en geleidelijke activiteitenopbouw.',
    redFlags: ['Geen neurologische uitval'],
    fullStructuredText: 'Full SOEP structure text',
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    patientInfo: mockPatientInfo,
    soepData: mockSOEPData,
    onSave: jest.fn(),
    onExport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render modal when open', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Volledige SOEP Documentatie');
    });

    it('should not render modal when closed', () => {
      render(<SOEPViewModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should display patient information correctly', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText(/J\.D\./)).toBeInTheDocument();
      expect(screen.getByText(/vrouw/)).toBeInTheDocument();
      expect(screen.getByText(/Nekpijn na whiplash/)).toBeInTheDocument();
    });

    it('should calculate and display patient age correctly', () => {
      render(<SOEPViewModal {...defaultProps} />);

      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1985;
      expect(screen.getByText(new RegExp(`${expectedAge} jaar`))).toBeInTheDocument();
    });
  });

  describe('SOEP Content Display', () => {
    it('should display all SOEP sections', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText('Subjectief (S)')).toBeInTheDocument();
      expect(screen.getByText('Objectief (O)')).toBeInTheDocument();
      expect(screen.getByText('Evaluatie (E)')).toBeInTheDocument();
      expect(screen.getByText('Plan (P)')).toBeInTheDocument();
    });

    it('should display SOEP content correctly', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText(mockSOEPData.subjective!)).toBeInTheDocument();
      expect(screen.getByText(mockSOEPData.objective!)).toBeInTheDocument();
      expect(screen.getByText(mockSOEPData.evaluation!)).toBeInTheDocument();
      expect(screen.getByText(mockSOEPData.plan!)).toBeInTheDocument();
    });

    it('should display red flags when present', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText('🚩 Rode Vlagen')).toBeInTheDocument();
      expect(screen.getByText('Geen neurologische uitval')).toBeInTheDocument();
    });

    it('should not display red flags section when empty', () => {
      const propsWithoutRedFlags = {
        ...defaultProps,
        soepData: {
          ...mockSOEPData,
          redFlags: [],
        },
      };

      render(<SOEPViewModal {...propsWithoutRedFlags} />);

      expect(screen.queryByText('🚩 Rode Vlagen')).not.toBeInTheDocument();
    });

    it('should handle missing SOEP content gracefully', () => {
      const incompleteSOEP = {
        ...defaultProps,
        soepData: {
          ...mockSOEPData,
          subjective: '',
          objective: undefined as any,
        },
      };

      render(<SOEPViewModal {...incompleteSOEP} />);

      expect(screen.getByText(/Geen informatie beschikbaar.*subjectief/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render copy button', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText('Kopiëren')).toBeInTheDocument();
    });

    it('should render export button when onExport is provided', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText('Exporteren')).toBeInTheDocument();
    });

    it('should not render export button when onExport is not provided', () => {
      const propsWithoutExport = {
        ...defaultProps,
        onExport: undefined,
      };

      render(<SOEPViewModal {...propsWithoutExport} />);

      expect(screen.queryByText('Exporteren')).not.toBeInTheDocument();
    });

    it('should render edit button when not readonly', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText('Bewerken')).toBeInTheDocument();
    });

    it('should not render edit button when readonly', () => {
      render(<SOEPViewModal {...defaultProps} readonly />);

      expect(screen.queryByText('Bewerken')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy text to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      const copyButton = screen.getByText('Kopiëren');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('SOEP DOCUMENTATIE')
      );
    });

    it('should handle clipboard copy errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      const copyButton = screen.getByText('Kopiëren');
      await user.click(copyButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to copy to clipboard:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Export Functionality', () => {
    it('should call onExport when export button is clicked', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      const exportButton = screen.getByText('Exporteren');
      await user.click(exportButton);

      expect(defaultProps.onExport).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      const editButton = screen.getByText('Bewerken');
      await user.click(editButton);

      expect(screen.getByText('Opslaan')).toBeInTheDocument();
      expect(screen.getByText('Annuleren')).toBeInTheDocument();
    });

    it('should display textareas in edit mode', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      await user.click(screen.getByText('Bewerken'));

      expect(screen.getByDisplayValue(mockSOEPData.subjective!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockSOEPData.objective!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockSOEPData.evaluation!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockSOEPData.plan!)).toBeInTheDocument();
    });

    it('should track changes when editing', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      await user.click(screen.getByText('Bewerken'));

      const subjectiveTextarea = screen.getByDisplayValue(mockSOEPData.subjective!);
      await user.type(subjectiveTextarea, ' Extra tekst');

      expect(screen.getByText(/wijzigingen.*niet.*opgeslagen/i)).toBeInTheDocument();
    });

    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      await user.click(screen.getByText('Bewerken'));

      const subjectiveTextarea = screen.getByDisplayValue(mockSOEPData.subjective!);
      await user.type(subjectiveTextarea, ' Modified');

      await user.click(screen.getByText('Opslaan'));

      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          subjective: expect.stringContaining('Modified'),
        })
      );
    });

    it('should discard changes when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      await user.click(screen.getByText('Bewerken'));

      const subjectiveTextarea = screen.getByDisplayValue(mockSOEPData.subjective!);
      await user.type(subjectiveTextarea, ' Modified');

      await user.click(screen.getByText('Annuleren'));

      expect(screen.queryByText(/wijzigingen.*niet.*opgeslagen/i)).not.toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should disable save button when no changes made', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      await user.click(screen.getByText('Bewerken'));

      const saveButton = screen.getByText('Opslaan');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Modal Lifecycle', () => {
    it('should reset state when modal opens', () => {
      const { rerender } = render(<SOEPViewModal {...defaultProps} isOpen={false} />);

      rerender(<SOEPViewModal {...defaultProps} isOpen={true} />);

      // Should not be in edit mode when reopened
      expect(screen.queryByText('Opslaan')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<SOEPViewModal {...defaultProps} />);

      await user.click(screen.getByTestId('modal-close'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Timestamps', () => {
    it('should display timestamp in footer', () => {
      render(<SOEPViewModal {...defaultProps} />);

      expect(screen.getByText(/Laatst bijgewerkt:/)).toBeInTheDocument();
    });
  });
});