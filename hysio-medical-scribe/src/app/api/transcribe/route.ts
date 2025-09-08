// API route for audio transcription using Groq Whisper Large v3 Turbo
// Supports automatic splitting for files >25MB

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioWithGroq, isSupportedAudioFormat, type GroqTranscriptionOptions } from '@/lib/api/groq';
import { 
  isFileSizeExceeded, 
  splitAudioFile, 
  processAudioSegments, 
  formatFileSize,
  MAX_FILE_SIZE 
} from '@/lib/utils/audio-splitter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check if request has form data
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'nl';
    const prompt = formData.get('prompt') as string || undefined;
    const temperature = formData.get('temperature') ? parseFloat(formData.get('temperature') as string) : 0.0;

    // Validate audio file
    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      lastModified: audioFile.lastModified
    });

    // Convert File to Blob first for processing
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    
    // Check if file needs splitting (>25MB)
    const needsSplitting = isFileSizeExceeded(audioBlob);
    
    console.log(`Audio file: ${formatFileSize(audioBlob.size)} - ${needsSplitting ? 'needs splitting' : 'processing directly'}`);
    
    if (needsSplitting) {
      console.log('File exceeds 25MB limit, initiating automatic splitting...');
    }

    // Check if audio format is supported (more lenient checking)
    if (!isSupportedAudioFormat(audioFile.type)) {
      console.log('Unsupported format detected:', audioFile.type);
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported audio format: ${audioFile.type}. Supported formats: WAV, MP3, MP4, WebM, OGG, FLAC, M4A` 
        },
        { status: 400 }
      );
    }

    // Set up transcription options
    const options: GroqTranscriptionOptions = {
      language,
      ...(prompt && { prompt }),
      temperature,
      response_format: 'verbose_json',
      model: 'whisper-large-v3-turbo',
    };

    let finalTranscript = '';
    let totalDuration = 0;
    let confidence = 1.0;
    let isSegmented = false;

    if (needsSplitting) {
      // Handle large file with automatic splitting
      try {
        console.log('Splitting large audio file...');
        
        const splitResult = await splitAudioFile(audioBlob);
        
        if (splitResult.error) {
          return NextResponse.json({
            success: false,
            error: `Audio splitting failed: ${splitResult.error}`
          }, { status: 400 });
        }

        console.log(`Split into ${splitResult.segments.length} segments, total duration: ${splitResult.totalDuration.toFixed(1)}s`);
        
        // Process each segment
        const processSegment = async (segmentBlob: Blob, index: number): Promise<string> => {
          console.log(`Processing segment ${index + 1}/${splitResult.segments.length}`);
          
          const segmentResult = await transcribeAudioWithGroq(segmentBlob, options);
          
          if (!segmentResult.success) {
            throw new Error(segmentResult.error || 'Segment transcription failed');
          }
          
          return segmentResult.data?.text || '';
        };

        const processingResult = await processAudioSegments(splitResult.segments, processSegment);
        
        if (processingResult.errors.length > 0) {
          console.warn('Some segments failed to process:', processingResult.errors);
        }
        
        finalTranscript = processingResult.combinedTranscript;
        totalDuration = processingResult.totalDuration;
        isSegmented = true;
        
        console.log(`Successfully processed ${processingResult.segments.length} segments`);
        
      } catch (error) {
        console.error('Error during audio splitting/processing:', error);
        
        return NextResponse.json({
          success: false,
          error: `Failed to process large audio file: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
      }
      
    } else {
      // Handle normal file (≤25MB) - direct processing
      console.log('Starting direct transcription with Groq...', {
        size: audioBlob.size,
        type: audioBlob.type,
        language,
        model: options.model
      });
      
      const result = await transcribeAudioWithGroq(audioBlob, options);
      
      console.log('Transcription result:', { 
        success: result.success, 
        error: result.success ? undefined : result.error,
        textLength: result.success && result.data?.text ? result.data.text.length : 0 
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Transcription failed'
        }, { status: 400 });
      }
      
      finalTranscript = result.data?.text || '';
      totalDuration = result.data?.duration || 0;
      confidence = result.data?.confidence || 1.0;
    }

    // Return unified result format
    return NextResponse.json({
      success: true,
      transcript: finalTranscript,
      duration: totalDuration,
      confidence: confidence,
      segmented: isSegmented,
      fileSize: formatFileSize(audioBlob.size)
    });

  } catch (error) {
    console.error('Transcription API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during transcription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  try {
    // Check if Groq API key is available
    const groqApiKey = process.env.GROQ_API_KEY;
    const hasGroqKey = Boolean(groqApiKey);
    
    return NextResponse.json({
      success: true,
      message: 'Transcription API is running with automatic splitting',
      model: 'whisper-large-v3-turbo',
      provider: 'Groq',
      supportedFormats: ['audio/m4a', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/flac'],
      maxFileSize: '25MB per segment (automatic splitting for larger files)',
      splittingEnabled: true,
      maxRecordingTime: '30 minutes',
      hasGroqKey,
      groqKeyLength: groqApiKey ? groqApiKey.length : 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check API status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}