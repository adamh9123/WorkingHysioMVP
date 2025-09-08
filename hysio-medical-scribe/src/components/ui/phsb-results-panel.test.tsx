/**
 * Tests for enhanced PHSB Results Panel
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PHSBResultsPanel } from './phsb-results-panel';
import { PHSBStructure } from '@/lib/types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Enhanced PHSB Results Panel', () => {
  const mockPHSBData: PHSBStructure = {
    personalFactors: 'Leeftijd: 45 jaar, geslacht: vrouw, beroep: verpleegkundige\nSport: hardlopen 3x per week',
    healthCondition: 'Hoofdklacht: lage rugpijn sinds 2 weken\nVoorgeschiedenis: geen eerdere rugklachten',
    bodyStructure: 'Spierspanning verhoogd in lumbale regio\nBeperkte flexie L4-L5 segment',
    bodyFunction: 'Pijnvrije ADL beperkt\nWerkgerelateerde activiteiten aangepast',
    fullStructuredText: 'Volledige PHSB structuur voor test doeleinden',
  };

  const defaultProps = {
    phsbData: mockPHSBData,
    onNavigateNext: jest.fn(),
    nextButtonLabel: 'Ga naar Onderzoek',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Header and Layout', () => {
    it('should render enhanced header with proper title and description', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.getByText('PHSB Anamnesekaart')).toBeInTheDocument();
      expect(screen.getByText(/Gestructureerde anamnese volgens PHSB-model/)).toBeInTheDocument();
    });

    it('should display action buttons in header', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.getByText('Compact weergave')).toBeInTheDocument();
      expect(screen.getByText('Kopiëer Volledig')).toBeInTheDocument();
    });

    it('should show sources when configured', () => {
      render(
        <PHSBResultsPanel
          {...defaultProps}
          showSources={true}
          audioSource={true}
          manualSource={true}
        />
      );

      expect(screen.getByText('Audio transcriptie gebruikt')).toBeInTheDocument();
      expect(screen.getByText('Handmatige notities gebruikt')).toBeInTheDocument();
    });
  });

  describe('View Toggle Functionality', () => {
    it('should toggle between compact and full view', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      // Initially in compact view
      expect(screen.getByText('Volledige weergave')).toBeInTheDocument();

      // Toggle to full view
      await user.click(screen.getByText('Volledige weergave'));

      expect(screen.getByText('Compact weergave')).toBeInTheDocument();
      expect(screen.getByText('Volledige PHSB Structuur')).toBeInTheDocument();
    });

    it('should display full structured text in full view mode', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      await user.click(screen.getByText('Volledige weergave'));

      expect(screen.getByText(mockPHSBData.fullStructuredText)).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    it('should render all PHSB sections with proper titles', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.getByText('Persoons Factoren (P)')).toBeInTheDocument();
      expect(screen.getByText('Gezondheidsconditie (H)')).toBeInTheDocument();
      expect(screen.getByText('Lichaamstructuur & -functie (S)')).toBeInTheDocument();
      expect(screen.getByText('Lichaamsactiviteiten (B)')).toBeInTheDocument();
    });

    it('should display section descriptions', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.getByText('Demografische gegevens, levensstijl en persoonlijke factoren')).toBeInTheDocument();
      expect(screen.getByText('Medische diagnose, comorbiditeiten en gezondheidsstatus')).toBeInTheDocument();
      expect(screen.getByText('Anatomische structuren en fysiologische functies')).toBeInTheDocument();
      expect(screen.getByText('Bewegings- en functionele activiteiten')).toBeInTheDocument();
    });

    it('should display section content by default', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.getByText(/Leeftijd: 45 jaar/)).toBeInTheDocument();
      expect(screen.getByText(/Hoofdklacht: lage rugpijn/)).toBeInTheDocument();
      expect(screen.getByText(/Spierspanning verhoogd/)).toBeInTheDocument();
      expect(screen.getByText(/Pijnvrije ADL beperkt/)).toBeInTheDocument();
    });

    it('should toggle section collapse/expand', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      // Find and click collapse button for Personal Factors section
      const personalFactorsSection = screen.getByText('Persoons Factoren (P)').closest('div');
      const collapseButton = personalFactorsSection?.querySelector('button[class*="gap"]:last-child');
      
      if (collapseButton) {
        await user.click(collapseButton);

        // Content should be hidden after collapse
        await waitFor(() => {
          expect(screen.queryByText(/Leeftijd: 45 jaar/)).not.toBeInTheDocument();
        });
      }
    });

    it('should handle missing section content gracefully', () => {
      const incompleteData = {
        ...mockPHSBData,
        personalFactors: '',
        healthCondition: undefined as any,
      };

      render(<PHSBResultsPanel {...defaultProps} phsbData={incompleteData} />);

      expect(screen.getByText(/Geen informatie beschikbaar.*persoons factoren/i)).toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard Functionality', () => {
    it('should copy full PHSB when copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      const copyButton = screen.getByText('Kopiëer Volledig');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPHSBData.fullStructuredText);
    });

    it('should copy section content when section copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      // Find copy button for Personal Factors section
      const personalFactorsSection = screen.getByText('Persoons Factoren (P)').closest('div');
      const copyButton = personalFactorsSection?.querySelector('button[class*="gap-1"]');
      
      if (copyButton) {
        await user.click(copyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPHSBData.personalFactors);
      }
    });

    it('should handle clipboard copy errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      const copyButton = screen.getByText('Kopiëer Volledig');
      await user.click(copyButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to copy to clipboard:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Preparation Reference Section', () => {
    it('should display preparation section when content is provided', () => {
      render(
        <PHSBResultsPanel
          {...defaultProps}
          preparationContent="Test voorbereiding content"
        />
      );

      expect(screen.getByText('Intake Voorbereiding (Referentie)')).toBeInTheDocument();
      expect(screen.getByText('Test voorbereiding content')).toBeInTheDocument();
    });

    it('should not display preparation section when no content', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.queryByText('Intake Voorbereiding (Referentie)')).not.toBeInTheDocument();
    });

    it('should make preparation section collapsible', async () => {
      const user = userEvent.setup();
      render(
        <PHSBResultsPanel
          {...defaultProps}
          preparationContent="Test voorbereiding content"
        />
      );

      // Find collapse button for preparation section
      const preparationSection = screen.getByText('Intake Voorbereiding (Referentie)').closest('div');
      const collapseButton = preparationSection?.querySelector('button[class*="text-amber-700"]:last-child');
      
      if (collapseButton) {
        await user.click(collapseButton);

        await waitFor(() => {
          expect(screen.queryByText('Test voorbereiding content')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Enhanced Navigation', () => {
    it('should display enhanced navigation section', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      expect(screen.getByText('Volgende Stap')).toBeInTheDocument();
      expect(screen.getByText('PHSB anamnese voltooid. Ga door naar de onderzoeksfase.')).toBeInTheDocument();
      expect(screen.getByText('Ga naar Onderzoek')).toBeInTheDocument();
    });

    it('should call onNavigateNext when navigation button is clicked', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      const navButton = screen.getByText('Ga naar Onderzoek');
      await user.click(navButton);

      expect(defaultProps.onNavigateNext).toHaveBeenCalled();
    });

    it('should not display navigation when onNavigateNext is not provided', () => {
      render(
        <PHSBResultsPanel
          {...defaultProps}
          onNavigateNext={undefined}
        />
      );

      expect(screen.queryByText('Volgende Stap')).not.toBeInTheDocument();
    });

    it('should disable navigation button when disabled prop is true', () => {
      render(<PHSBResultsPanel {...defaultProps} disabled={true} />);

      const navButton = screen.getByText('Ga naar Onderzoek');
      expect(navButton).toBeDisabled();
    });

    it('should use custom button label when provided', () => {
      render(
        <PHSBResultsPanel
          {...defaultProps}
          nextButtonLabel="Custom Button Text"
        />
      );

      expect(screen.getByText('Custom Button Text')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for copy buttons', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      // Screen reader text should be present
      expect(screen.getByText('Kopiëer P', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PHSBResultsPanel {...defaultProps} />);

      // Tab to first interactive element (view toggle button)
      await user.tab();
      expect(screen.getByText('Volledige weergave')).toHaveFocus();

      // Tab to copy button
      await user.tab();
      expect(screen.getByText('Kopiëer Volledig')).toHaveFocus();
    });
  });

  describe('Color-coded Sections', () => {
    it('should apply correct color schemes to different sections', () => {
      render(<PHSBResultsPanel {...defaultProps} />);

      // Check if sections have their respective color classes
      const personalSection = screen.getByText('Persoons Factoren (P)').closest('.bg-blue-50');
      const healthSection = screen.getByText('Gezondheidsconditie (H)').closest('.bg-red-50');
      const structureSection = screen.getByText('Lichaamstructuur & -functie (S)').closest('.bg-green-50');
      const functionSection = screen.getByText('Lichaamsactiviteiten (B)').closest('.bg-purple-50');

      expect(personalSection).toBeInTheDocument();
      expect(healthSection).toBeInTheDocument();
      expect(structureSection).toBeInTheDocument();
      expect(functionSection).toBeInTheDocument();
    });
  });
});