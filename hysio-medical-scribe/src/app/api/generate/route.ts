// API route for AI content generation using OpenAI GPT-4o

import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithOpenAI, generateContentStreamWithOpenAI, type OpenAICompletionOptions } from '@/lib/api/openai';

export const runtime = 'nodejs';

interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  stream?: boolean;
  options?: OpenAICompletionOptions;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateRequest = await request.json();
    
    const { systemPrompt, userPrompt, stream = false, options = {} } = body;

    // Validate required fields
    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'systemPrompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (!userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'userPrompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate prompt lengths (rough token limit check)
    const maxPromptLength = 50000; // Approximate character limit
    if (systemPrompt.length > maxPromptLength || userPrompt.length > maxPromptLength) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Prompt too long. Maximum length is approximately 50,000 characters.' 
        },
        { status: 400 }
      );
    }

    // Set default options
    const completionOptions: OpenAICompletionOptions = {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      ...options,
    };

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        start(controller) {
          generateContentStreamWithOpenAI(
            systemPrompt,
            userPrompt,
            {
              ...completionOptions,
              onChunk: (chunk) => {
                const data = `data: ${JSON.stringify({ chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
              },
              onComplete: (fullContent) => {
                const data = `data: ${JSON.stringify({ 
                  complete: true, 
                  content: fullContent 
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
                controller.close();
              },
              onError: (error) => {
                const data = `data: ${JSON.stringify({ 
                  error: true, 
                  message: error 
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
                controller.close();
              },
            }
          );
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle regular response
      const result = await generateContentWithOpenAI(
        systemPrompt,
        userPrompt,
        completionOptions
      );

      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Generate API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during content generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Content generation API is running',
    model: 'gpt-4o',
    provider: 'OpenAI',
    capabilities: ['text-generation', 'streaming', 'dutch-language-support'],
    maxPromptLength: '~50,000 characters',
  });
}