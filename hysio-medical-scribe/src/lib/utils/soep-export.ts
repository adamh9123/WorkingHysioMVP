/**
 * SOEP Export Utility
 * Provides specialized export functionality for SOEP documentation
 */

import { PatientInfo, SOEPStructure } from '@/lib/types';
import { ExportFormat, ExportOptions, ExportResult } from './session-export';

export interface SOEPExportData {
  patientInfo: PatientInfo;
  soepData: SOEPStructure;
  createdAt?: string;
  updatedAt?: string;
}

export class SOEPExporter {
  /**
   * Export SOEP documentation to various formats
   */
  static async exportSOEP(
    data: SOEPExportData,
    format: ExportFormat = 'pdf'
  ): Promise<ExportResult> {
    try {
      const content = this.generateSOEPContent(data);
      
      const filename = this.generateFilename(data.patientInfo, format);
      
      switch (format) {
        case 'txt':
          return this.exportAsText(content, filename);
        case 'html':
          return this.exportAsHTML(content, filename, data);
        case 'pdf':
          return await this.exportAsPDF(content, filename, data);
        case 'docx':
          return await this.exportAsDocx(content, filename, data);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('SOEP Export Error:', error);
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Generate structured SOEP content
   */
  private static generateSOEPContent(data: SOEPExportData): string {
    const { patientInfo, soepData } = data;
    
    const getAge = (birthYear: string): number => {
      return new Date().getFullYear() - parseInt(birthYear);
    };

    const age = getAge(patientInfo.birthYear);
    const timestamp = data.createdAt || new Date().toLocaleString('nl-NL');
    
    return `SOEP DOCUMENTATIE

═══════════════════════════════════════
PATIËNTGEGEVENS
═══════════════════════════════════════

Initialen: ${patientInfo.initials}
Leeftijd: ${age} jaar
Geslacht: ${patientInfo.gender}
Hoofdklacht: ${patientInfo.chiefComplaint}

═══════════════════════════════════════
SOEP STRUCTUUR
═══════════════════════════════════════

SUBJECTIEF (S)
${soepData.subjective || 'Geen informatie beschikbaar'}

───────────────────────────────────────

OBJECTIEF (O)
${soepData.objective || 'Geen informatie beschikbaar'}

───────────────────────────────────────

EVALUATIE (E)
${soepData.evaluation || 'Geen informatie beschikbaar'}

───────────────────────────────────────

PLAN (P)
${soepData.plan || 'Geen informatie beschikbaar'}

${soepData.redFlags && soepData.redFlags.length > 0 ? `
═══════════════════════════════════════
🚩 RODE VLAGEN
═══════════════════════════════════════

${soepData.redFlags.map(flag => `• ${flag}`).join('\\n')}
` : ''}

═══════════════════════════════════════
DOCUMENTATIE INFORMATIE
═══════════════════════════════════════

Gegenereerd: ${timestamp}
Door: Hysio Medical Scribe
Versie: SOEP Vervolgconsult

DISCLAIMER:
Deze documentatie is gegenereerd door AI en moet worden geverifieerd
door een bevoegd fysiotherapeut voordat deze wordt gebruikt voor
patiëntenzorg of administratieve doeleinden.`;
  }

  /**
   * Generate filename based on patient info and format
   */
  private static generateFilename(patientInfo: PatientInfo, format: ExportFormat): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const initials = patientInfo.initials.replace(/[^a-zA-Z0-9]/g, '_');
    return `SOEP_${initials}_${date}.${format}`;
  }

  /**
   * Export as plain text
   */
  private static exportAsText(content: string, filename: string): ExportResult {
    return {
      success: true,
      data: content,
      filename,
      mimeType: 'text/plain'
    };
  }

  /**
   * Export as HTML with styling
   */
  private static exportAsHTML(content: string, filename: string, data: SOEPExportData): ExportResult {
    const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOEP Documentatie - ${data.patientInfo.initials}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2c7a5b;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c7a5b;
            margin-bottom: 5px;
        }
        .patient-info {
            background-color: #f7f5f0;
            padding: 20px;
            border-left: 4px solid #84cc9e;
            margin-bottom: 30px;
        }
        .soep-section {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .soep-section h3 {
            color: #2c7a5b;
            margin-top: 0;
            border-bottom: 2px solid #84cc9e;
            padding-bottom: 10px;
        }
        .red-flags {
            background-color: #fef2f2;
            border: 2px solid #fca5a5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .red-flags h3 {
            color: #dc2626;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        pre {
            white-space: pre-wrap;
            font-family: inherit;
            margin: 0;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SOEP DOCUMENTATIE</h1>
        <p>Fysiotherapie Vervolgconsult</p>
    </div>
    
    <div class="patient-info">
        <h3>Patiëntgegevens</h3>
        <p><strong>Initialen:</strong> ${data.patientInfo.initials}</p>
        <p><strong>Leeftijd:</strong> ${new Date().getFullYear() - parseInt(data.patientInfo.birthYear)} jaar</p>
        <p><strong>Geslacht:</strong> ${data.patientInfo.gender}</p>
        <p><strong>Hoofdklacht:</strong> ${data.patientInfo.chiefComplaint}</p>
    </div>

    ${data.soepData.redFlags && data.soepData.redFlags.length > 0 ? `
    <div class="red-flags">
        <h3>🚩 Rode Vlagen</h3>
        <ul>
            ${data.soepData.redFlags.map(flag => `<li>${flag}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="soep-section">
        <h3>Subjectief (S)</h3>
        <pre>${data.soepData.subjective || 'Geen informatie beschikbaar'}</pre>
    </div>

    <div class="soep-section">
        <h3>Objectief (O)</h3>
        <pre>${data.soepData.objective || 'Geen informatie beschikbaar'}</pre>
    </div>

    <div class="soep-section">
        <h3>Evaluatie (E)</h3>
        <pre>${data.soepData.evaluation || 'Geen informatie beschikbaar'}</pre>
    </div>

    <div class="soep-section">
        <h3>Plan (P)</h3>
        <pre>${data.soepData.plan || 'Geen informatie beschikbaar'}</pre>
    </div>

    <div class="footer">
        <p><strong>Gegenereerd:</strong> ${data.createdAt || new Date().toLocaleString('nl-NL')}</p>
        <p><strong>Door:</strong> Hysio Medical Scribe</p>
        <p><em>Deze documentatie is gegenereerd door AI en moet worden geverifieerd door een bevoegd fysiotherapeut.</em></p>
    </div>
</body>
</html>`;

    return {
      success: true,
      data: htmlContent,
      filename: filename.replace('.html', '.html'),
      mimeType: 'text/html'
    };
  }

  /**
   * Export as PDF (placeholder - requires proper PDF library)
   */
  private static async exportAsPDF(content: string, filename: string, data: SOEPExportData): Promise<ExportResult> {
    // For now, return HTML version with PDF mime type
    // In production, you would use a library like jsPDF or Puppeteer
    console.warn('PDF export not fully implemented - returning HTML content');
    
    const htmlResult = this.exportAsHTML(content, filename, data);
    
    return {
      ...htmlResult,
      filename: filename.replace('.pdf', '.html'),
      mimeType: 'text/html' // Should be 'application/pdf' when properly implemented
    };
  }

  /**
   * Export as DOCX (placeholder - requires proper DOCX library)
   */
  private static async exportAsDocx(content: string, filename: string, data: SOEPExportData): Promise<ExportResult> {
    // For now, return text version
    // In production, you would use a library like docx or officegen
    console.warn('DOCX export not fully implemented - returning text content');
    
    return {
      success: true,
      data: content,
      filename: filename.replace('.docx', '.txt'),
      mimeType: 'text/plain' // Should be 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  }

  /**
   * Download the exported file
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Cannot download file:', result.error);
      return;
    }

    try {
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
      
      console.log(`File downloaded: ${result.filename}`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  /**
   * Quick export and download
   */
  static async exportAndDownload(
    data: SOEPExportData,
    format: ExportFormat = 'html'
  ): Promise<void> {
    try {
      const result = await this.exportSOEP(data, format);
      
      if (result.success) {
        this.downloadFile(result);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export and download failed:', error);
      throw error;
    }
  }
}