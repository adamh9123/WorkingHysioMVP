/**
 * Tests for SOEP export functionality
 */

import { SOEPExporter } from './soep-export';
import { PatientInfo, SOEPStructure } from '@/lib/types';

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and related DOM methods
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};

const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn().mockReturnValue(mockLink),
});

Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: mockRemoveChild,
});

describe('SOEP Exporter', () => {
  const mockPatientInfo: PatientInfo = {
    initials: 'J.D.',
    birthYear: '1985',
    gender: 'man',
    chiefComplaint: 'Rugpijn na tillen',
  };

  const mockSOEPData: SOEPStructure = {
    subjective: 'Patiënt geeft aan sinds 3 dagen rugpijn te hebben na het tillen van een zware doos.',
    objective: 'Palpatie toont verhoogde spierspanning in de lumbale regio. ROM beperkt in flexie.',
    evaluation: 'Acute lumbale spierspanning zonder neurologische uitval.',
    plan: 'Fysiotherapie 2x per week, oefentherapie, en ergonomische adviezen.',
    redFlags: ['Geen rode vlagen geïdentificeerd'],
    fullStructuredText: 'Mock full structured text',
  };

  const mockExportData = {
    patientInfo: mockPatientInfo,
    soepData: mockSOEPData,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Text Export', () => {
    it('should export SOEP as plain text correctly', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'txt');

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/plain');
      expect(result.filename).toMatch(/^SOEP_J_D__\d{4}-\d{2}-\d{2}\.txt$/);
      expect(result.data).toContain('SOEP DOCUMENTATIE');
      expect(result.data).toContain('J.D.');
      expect(result.data).toContain('39 jaar'); // 2024 - 1985
      expect(result.data).toContain('Rugpijn na tillen');
      expect(result.data).toContain(mockSOEPData.subjective);
      expect(result.data).toContain(mockSOEPData.objective);
      expect(result.data).toContain(mockSOEPData.evaluation);
      expect(result.data).toContain(mockSOEPData.plan);
    });

    it('should include red flags in text export when present', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'txt');

      expect(result.data).toContain('🚩 RODE VLAGEN');
      expect(result.data).toContain('Geen rode vlagen geïdentificeerd');
    });

    it('should handle missing SOEP sections gracefully', async () => {
      const incompleteSOEP = {
        ...mockExportData,
        soepData: {
          ...mockSOEPData,
          subjective: '',
          objective: undefined,
        } as any,
      };

      const result = await SOEPExporter.exportSOEP(incompleteSOEP, 'txt');

      expect(result.success).toBe(true);
      expect(result.data).toContain('Geen informatie beschikbaar');
    });
  });

  describe('HTML Export', () => {
    it('should export SOEP as HTML with proper structure', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'html');

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/html');
      expect(result.filename).toMatch(/^SOEP_J_D__\d{4}-\d{2}-\d{2}\.html$/);
      expect(result.data).toContain('<!DOCTYPE html>');
      expect(result.data).toContain('<title>SOEP Documentatie - J.D.</title>');
      expect(result.data).toContain('SOEP DOCUMENTATIE');
      expect(result.data).toContain('<style>'); // Should include CSS
    });

    it('should include red flags section in HTML when present', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'html');

      expect(result.data).toContain('class="red-flags"');
      expect(result.data).toContain('🚩 Rode Vlagen');
    });

    it('should not include red flags section when empty', async () => {
      const noRedFlagsData = {
        ...mockExportData,
        soepData: {
          ...mockSOEPData,
          redFlags: [],
        },
      };

      const result = await SOEPExporter.exportSOEP(noRedFlagsData, 'html');

      expect(result.data).not.toContain('class="red-flags"');
      expect(result.data).not.toContain('🚩 Rode Vlagen');
    });
  });

  describe('PDF Export (Placeholder)', () => {
    it('should return HTML content with PDF-like handling', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'pdf');

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/html'); // Currently returns HTML
      expect(result.filename).toMatch(/\.html$/); // Currently .html extension
      expect(console.warn).toHaveBeenCalledWith('PDF export not fully implemented - returning HTML content');
    });
  });

  describe('DOCX Export (Placeholder)', () => {
    it('should return text content with DOCX-like handling', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'docx');

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/plain'); // Currently returns text
      expect(result.filename).toMatch(/\.txt$/); // Currently .txt extension
      expect(console.warn).toHaveBeenCalledWith('DOCX export not fully implemented - returning text content');
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported export formats', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'unsupported' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format');
    });

    it('should handle export errors gracefully', async () => {
      // Mock an error in the export process
      const invalidData = null as any;

      const result = await SOEPExporter.exportSOEP(invalidData, 'txt');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('File Download', () => {
    it('should download file successfully', () => {
      const mockResult = {
        success: true,
        data: 'test content',
        filename: 'test.txt',
        mimeType: 'text/plain',
      };

      SOEPExporter.downloadFile(mockResult);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle download errors', () => {
      const mockResult = {
        success: false,
        data: undefined,
        filename: 'test.txt',
        mimeType: 'text/plain',
        error: 'Export failed',
      };

      SOEPExporter.downloadFile(mockResult);

      expect(console.error).toHaveBeenCalledWith('Cannot download file:', 'Export failed');
      expect(document.createElement).not.toHaveBeenCalled();
    });

    it('should handle DOM manipulation errors during download', () => {
      const mockResult = {
        success: true,
        data: 'test content',
        filename: 'test.txt',
        mimeType: 'text/plain',
      };

      // Mock DOM error
      mockAppendChild.mockImplementationOnce(() => {
        throw new Error('DOM error');
      });

      SOEPExporter.downloadFile(mockResult);

      expect(console.error).toHaveBeenCalledWith('Download failed:', expect.any(Error));
    });
  });

  describe('Export and Download', () => {
    it('should export and download in one operation', async () => {
      const downloadFileSpy = jest.spyOn(SOEPExporter, 'downloadFile').mockImplementation(() => {});

      await SOEPExporter.exportAndDownload(mockExportData, 'html');

      expect(downloadFileSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          mimeType: 'text/html',
        })
      );

      downloadFileSpy.mockRestore();
    });

    it('should handle export failures in exportAndDownload', async () => {
      // Force an export error
      const invalidData = null as any;

      await expect(SOEPExporter.exportAndDownload(invalidData, 'txt')).rejects.toThrow();
    });
  });

  describe('Filename Generation', () => {
    it('should generate safe filenames', async () => {
      const specialCharsPatient = {
        ...mockPatientInfo,
        initials: 'A.B./C', // Contains special characters
      };

      const testData = {
        ...mockExportData,
        patientInfo: specialCharsPatient,
      };

      const result = await SOEPExporter.exportSOEP(testData, 'txt');

      // Should sanitize special characters
      expect(result.filename).toMatch(/^SOEP_A_B__C_\d{4}-\d{2}-\d{2}\.txt$/);
    });
  });

  describe('Content Generation', () => {
    it('should calculate patient age correctly', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'txt');
      
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - parseInt(mockPatientInfo.birthYear);
      
      expect(result.data).toContain(`${expectedAge} jaar`);
    });

    it('should include proper timestamps', async () => {
      const result = await SOEPExporter.exportSOEP(mockExportData, 'txt');

      expect(result.data).toContain('Gegenereerd:');
      expect(result.data).toContain('Hysio Medical Scribe');
      expect(result.data).toContain('DISCLAIMER:');
    });
  });
});