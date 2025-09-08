import { SessionState, IntakeData, FollowupData } from '@/lib/types';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includePatientInfo: boolean;
  includeAudioTranscripts: boolean;
  includeTimestamps: boolean;
  anonymize: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string | ArrayBuffer;
  filename: string;
  mimeType: string;
  error?: string;
}

class SessionExporter {
  private static readonly DEFAULT_OPTIONS: ExportOptions = {
    format: 'pdf',
    includePatientInfo: true,
    includeAudioTranscripts: true,
    includeTimestamps: true,
    anonymize: false,
  };

  static async exportSession(
    session: SessionState,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const exportOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      const content = this.generateContent(session, exportOptions);
      
      switch (exportOptions.format) {
        case 'txt':
          return this.exportAsText(content, session);
        case 'html':
          return this.exportAsHTML(content, session);
        case 'pdf':
          return await this.exportAsPDF(content, session);
        case 'docx':
          return await this.exportAsDocx(content, session);
        default:
          throw new Error(`Unsupported export format: ${exportOptions.format}`);
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Unknown export error',
      };
    }
  }

  private static generateContent(session: SessionState, options: ExportOptions): string {
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(session, options));

    // Patient Information
    if (options.includePatientInfo && session.patientInfo) {
      sections.push(this.generatePatientInfo(session, options));
    }

    // Session Content
    if (session.type === 'intake' && session.intakeData) {
      sections.push(this.generateIntakeContent(session.intakeData, options));
    } else if (session.type === 'followup' && session.followupData) {
      sections.push(this.generateFollowupContent(session.followupData, options));
    }

    // Session Metadata
    sections.push(this.generateSessionMetadata(session, options));

    return sections.join('\n\n');
  }

  private static generateHeader(session: SessionState, options: ExportOptions): string {
    const sessionType = session.type === 'intake' ? 'Intake Consult' : 'Vervolgconsult';
    const patientName = options.anonymize 
      ? 'PATIENT_XXXXX' 
      : session.patientInfo 
        ? `${session.patientInfo.initials} (${session.patientInfo.birthYear})`
        : 'Onbekende Patiënt';

    return `HYSIO MEDICAL SCRIBE - ${sessionType.toUpperCase()}

Patiënt: ${patientName}
Datum: ${this.formatDate(session.startedAt || '')}
Sessie ID: ${options.anonymize ? 'XXXXX-XXXXX-XXXXX' : session.id}

═══════════════════════════════════════════════════════════════`;
  }

  private static generatePatientInfo(session: SessionState, options: ExportOptions): string {
    if (!session.patientInfo) return '';

    const patient = session.patientInfo;
    
    if (options.anonymize) {
      const currentYear = new Date().getFullYear();
      const approximateAge = patient.birthYear ? currentYear - parseInt(patient.birthYear) : 'Onbekend';
      
      return `PATIËNTGEGEVENS

Initialen: [GEANONIMISEERD]
Geboortejaar: [GEANONIMISEERD]
Leeftijd: ca. ${approximateAge} jaar
Geslacht: ${patient.gender}

Hoofdklacht: ${patient.chiefComplaint}

═══════════════════════════════════════════════════════════════`;
    }

    const currentYear = new Date().getFullYear();
    const age = patient.birthYear ? currentYear - parseInt(patient.birthYear) : null;
    
    return `PATIËNTGEGEVENS

Initialen: ${patient.initials}
Geboortejaar: ${patient.birthYear}${age ? ` (ca. ${age} jaar)` : ''}
Geslacht: ${patient.gender}

Hoofdklacht: ${patient.chiefComplaint}

═══════════════════════════════════════════════════════════════`;
  }

  private static generateIntakeContent(intakeData: IntakeData, options: ExportOptions): string {
    const sections: string[] = [];

    // Intake Preparation
    if (intakeData.preparation) {
      sections.push(`INTAKE VOORBEREIDING

${intakeData.preparation}

───────────────────────────────────────────────────────────────`);
    }

    // Anamnesis (PHSB)
    if (intakeData.phsbStructure) {
      sections.push(`ANAMNESE (PHSB STRUCTUUR)

${intakeData.phsbStructure.fullStructuredText}

${options.includeAudioTranscripts && !options.anonymize && intakeData.anamnesisTranscript ? 
  `Oorspronkelijke transcriptie:
${intakeData.anamnesisTranscript}

` : ''}───────────────────────────────────────────────────────────────`);
    }

    // Examination Plan
    if (intakeData.examinationPlan) {
      sections.push(`ONDERZOEKSPLAN

${intakeData.examinationPlan}

───────────────────────────────────────────────────────────────`);
    }

    // Examination Findings
    if (intakeData.examinationFindings) {
      sections.push(`ONDERZOEKSBEVINDINGEN

${intakeData.examinationFindings}

───────────────────────────────────────────────────────────────`);
    }

    // Clinical Conclusion
    if (intakeData.clinicalConclusion) {
      sections.push(`KLINISCHE CONCLUSIE

${intakeData.clinicalConclusion}

───────────────────────────────────────────────────────────────`);
    }

    // Red Flags
    if (intakeData.redFlags.length > 0) {
      sections.push(`RODE VLAGEN

${intakeData.redFlags.map(flag => `• ${flag}`).join('\n')}

───────────────────────────────────────────────────────────────`);
    }

    // Additional Notes
    if (intakeData.notes) {
      sections.push(`AANVULLENDE NOTITIES

${intakeData.notes}

───────────────────────────────────────────────────────────────`);
    }

    return sections.join('\n');
  }

  private static generateFollowupContent(followupData: FollowupData, options: ExportOptions): string {
    const sections: string[] = [];

    // Session Preparation
    if (followupData.sessionPreparation) {
      sections.push(`VERVOLGCONSULT VOORBEREIDING

${followupData.sessionPreparation}

───────────────────────────────────────────────────────────────`);
    }

    // SOEP Documentation
    if (followupData.soepStructure) {
      sections.push(`SOEP DOCUMENTATIE

${followupData.soepStructure.fullStructuredText}

${options.includeAudioTranscripts && followupData.soepTranscript ? 
  `Oorspronkelijke transcriptie:
${followupData.soepTranscript}

` : ''}───────────────────────────────────────────────────────────────`);
    }

    // Progress Evaluation
    if (followupData.progressEvaluation) {
      sections.push(`VOORTGANGSEVALUATIE

${followupData.progressEvaluation}

───────────────────────────────────────────────────────────────`);
    }

    // Treatment Adjustments
    if (followupData.treatmentAdjustments) {
      sections.push(`BEHANDELPLAN AANPASSINGEN

${followupData.treatmentAdjustments}

───────────────────────────────────────────────────────────────`);
    }

    // Home Exercises
    if (followupData.homeExercises) {
      sections.push(`HUISOEFENINGEN

${followupData.homeExercises}

───────────────────────────────────────────────────────────────`);
    }

    // Patient Education
    if (followupData.patientEducation) {
      sections.push(`PATIËNT EDUCATIE

${followupData.patientEducation}

───────────────────────────────────────────────────────────────`);
    }

    // Red Flags
    if (followupData.redFlags.length > 0) {
      sections.push(`RODE VLAGEN

${followupData.redFlags.map(flag => `• ${flag}`).join('\n')}

───────────────────────────────────────────────────────────────`);
    }

    // Additional Notes
    if (followupData.notes) {
      sections.push(`AANVULLENDE NOTITIES

${followupData.notes}

───────────────────────────────────────────────────────────────`);
    }

    return sections.join('\n');
  }

  private static generateSessionMetadata(session: SessionState, options: ExportOptions): string {
    const duration = this.calculateSessionDuration(session);
    
    return `SESSIE METADATA

Status: ${this.getStatusLabel(session.status)}
Gestart: ${this.formatDateTime(session.startedAt || '')}
${session.completedAt ? `Voltooid: ${this.formatDateTime(session.completedAt)}` : ''}
${session.pausedAt ? `Gepauzeerd: ${this.formatDateTime(session.pausedAt)}` : ''}
Duur: ${duration}
Laatste wijziging: ${this.formatDateTime(session.lastSavedAt || session.updatedAt || '')}

═══════════════════════════════════════════════════════════════

Gegenereerd door Hysio Medical Scribe
${options.includeTimestamps ? `Export datum: ${this.formatDateTime(new Date().toISOString())}` : ''}

BELANGRIJK: Dit document is gegenereerd met AI-ondersteuning en moet 
worden geverifieerd door een bevoegd fysiotherapeut voordat het wordt 
gebruikt voor medische besluitvorming.

Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF)`;
  }

  private static exportAsText(content: string, session: SessionState): ExportResult {
    const filename = this.generateFilename(session, 'txt');
    
    return {
      success: true,
      data: content,
      filename,
      mimeType: 'text/plain',
    };
  }

  private static exportAsHTML(content: string, session: SessionState): ExportResult {
    const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hysio Medical Scribe - ${session.type === 'intake' ? 'Intake' : 'Vervolgconsult'}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #004B3A;
            background-color: #F8F8F5;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #A5E1C5, #004B3A);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #A5E1C5;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: inherit;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #F0F0F0;
            border-radius: 8px;
            font-size: 0.9em;
            color: #666;
        }
        @media print {
            body { background: white; }
            .header { background: #004B3A !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Hysio Medical Scribe</h1>
        <p>${session.type === 'intake' ? 'Intake Consult' : 'Vervolgconsult'}</p>
    </div>
    <div class="section">
        <pre>${content}</pre>
    </div>
    <div class="footer">
        <p>Gegenereerd door Hysio Medical Scribe</p>
        <p>Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF)</p>
    </div>
</body>
</html>`;

    const filename = this.generateFilename(session, 'html');
    
    return {
      success: true,
      data: htmlContent,
      filename,
      mimeType: 'text/html',
    };
  }

  private static async exportAsPDF(content: string, session: SessionState): Promise<ExportResult> {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Add header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HYSIO MEDICAL SCRIBE', margin, 30);
      
      const sessionType = session.type === 'intake' ? 'INTAKE CONSULT' : 'VERVOLGCONSULT';
      doc.text(sessionType, margin, 40);
      
      // Add patient info header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const patientName = session.patientInfo 
        ? `${session.patientInfo.initials} (${session.patientInfo.birthYear})`
        : 'Onbekende Patiënt';
      
      doc.text(`Patiënt: ${patientName}`, margin, 55);
      doc.text(`Datum: ${this.formatDate(session.startedAt || '')}`, margin, 65);
      
      // Add line separator
      doc.setLineWidth(0.5);
      doc.line(margin, 75, pageWidth - margin, 75);
      
      // Add content
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const lines = content.split('\n');
      let yPosition = 90;
      const lineHeight = 6;
      
      for (let line of lines) {
        if (yPosition > 280) { // Near bottom of page
          doc.addPage();
          yPosition = 30;
        }
        
        if (line.trim()) {
          const wrappedLines = doc.splitTextToSize(line, maxWidth);
          for (let wrappedLine of wrappedLines) {
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 30;
            }
            doc.text(wrappedLine, margin, yPosition);
            yPosition += lineHeight;
          }
        } else {
          yPosition += lineHeight / 2; // Smaller space for empty lines
        }
      }
      
      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Pagina ${i} van ${totalPages}`, pageWidth - margin - 30, 290);
        doc.text('Gegenereerd door Hysio Medical Scribe', margin, 290);
      }

      const pdfArrayBuffer = doc.output('arraybuffer');
      const filename = this.generateFilename(session, 'pdf');
      
      return {
        success: true,
        data: pdfArrayBuffer,
        filename,
        mimeType: 'application/pdf',
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: 'PDF generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  private static async exportAsDocx(content: string, session: SessionState): Promise<ExportResult> {
    try {
      const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = await import('docx');
      
      const sessionType = session.type === 'intake' ? 'Intake Consult' : 'Vervolgconsult';
      const patientName = session.patientInfo 
        ? `${session.patientInfo.initials} (${session.patientInfo.birthYear})`
        : 'Onbekende Patiënt';
      
      const children = [];
      
      // Header
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'HYSIO MEDICAL SCRIBE',
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: sessionType.toUpperCase(),
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Patiënt: ${patientName}`,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Datum: ${this.formatDate(session.startedAt || '')}`,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Sessie ID: ${session.id}`,
              size: 16,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '═══════════════════════════════════════════════════════════════',
              size: 16,
            }),
          ],
        }),
        new Paragraph({ text: '' }) // Empty line
      );
      
      // Content sections
      const sections = content.split('\n\n');
      
      for (let section of sections) {
        if (!section.trim()) continue;
        
        const lines = section.split('\n');
        let isHeader = false;
        
        // Check if this is a section header (all caps or contains special characters)
        if (lines[0] && (lines[0] === lines[0].toUpperCase() || lines[0].includes('═') || lines[0].includes('─'))) {
          isHeader = true;
        }
        
        if (isHeader && !lines[0].includes('═') && !lines[0].includes('─')) {
          // Section header
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: lines[0],
                  bold: true,
                  size: 22,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
            })
          );
          
          // Add remaining lines as regular content
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: lines[i],
                      size: 20,
                    }),
                  ],
                })
              );
            } else {
              children.push(new Paragraph({ text: '' }));
            }
          }
        } else if (lines[0].includes('═') || lines[0].includes('─')) {
          // Separator line - add some space
          children.push(new Paragraph({ text: '' }));
        } else {
          // Regular content
          for (let line of lines) {
            if (line.trim()) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      size: 20,
                    }),
                  ],
                })
              );
            } else {
              children.push(new Paragraph({ text: '' }));
            }
          }
        }
        
        // Add space after section
        children.push(new Paragraph({ text: '' }));
      }
      
      // Footer
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '═══════════════════════════════════════════════════════════════',
              size: 16,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Gegenereerd door Hysio Medical Scribe',
              italics: true,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Export datum: ${this.formatDateTime(new Date().toISOString())}`,
              italics: true,
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'BELANGRIJK: Dit document is gegenereerd met AI-ondersteuning en moet worden geverifieerd door een bevoegd fysiotherapeut voordat het wordt gebruikt voor medische besluitvorming.',
              bold: true,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Voldoet aan Nederlandse fysiotherapie richtlijnen (KNGF, DTF)',
              italics: true,
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );

      const doc = new Document({
        sections: [
          {
            children: children,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = this.generateFilename(session, 'docx');
      
      return {
        success: true,
        data: buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: 'DOCX generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  private static generateFilename(session: SessionState, extension: string): string {
    const sessionType = session.type === 'intake' ? 'intake' : 'vervolgconsult';
    const patientIdentifier = session.patientInfo 
      ? `${session.patientInfo.initials}_${session.patientInfo.birthYear}`
      : 'onbekend';
    const date = session.startedAt 
      ? new Date(session.startedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    // Sanitize filename
    const sanitizedName = patientIdentifier.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return `hysio_${sessionType}_${sanitizedName}_${date}.${extension}`;
  }

  private static formatDate(dateString: string): string {
    if (!dateString) return 'Niet opgegeven';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private static formatDateTime(dateString: string): string {
    if (!dateString) return 'Niet opgegeven';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private static calculateAge(dateOfBirth: string): number | null {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }

  private static calculateSessionDuration(session: SessionState): string {
    if (!session.startedAt) return 'Onbekend';
    
    const startTime = new Date(session.startedAt).getTime();
    const endTime = session.completedAt 
      ? new Date(session.completedAt).getTime()
      : Date.now();
    
    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}u ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  private static getStatusLabel(status: string): string {
    const labels = {
      'completed': 'Voltooid',
      'in-progress': 'Bezig',
      'paused': 'Gepauzeerd',
      'error': 'Fout',
      'idle': 'Niet gestart',
    };
    
    return labels[status as keyof typeof labels] || status;
  }

  // Utility method to trigger download in browser
  static downloadExportedFile(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Cannot download file:', result.error);
      return;
    }

    let blob: Blob;
    
    // Handle different data types
    if (result.data instanceof ArrayBuffer) {
      blob = new Blob([result.data], { type: result.mimeType });
    } else if (typeof result.data === 'string') {
      blob = new Blob([result.data], { type: result.mimeType });
    } else {
      blob = new Blob([result.data], { type: result.mimeType });
    }
    
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export { SessionExporter };