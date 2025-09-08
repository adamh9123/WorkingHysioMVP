// API route for Hysio Assistant chat completions

import { NextRequest, NextResponse } from 'next/server';
import { generateContentStreamWithOpenAI } from '@/lib/api/openai';
import { HYSIO_ASSISTANT_SYSTEM_PROMPT, ASSISTANT_MODEL_CONFIG, requiresDisclaimer, CLINICAL_DISCLAIMER } from '@/lib/assistant/system-prompt';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Build conversation context from history
    const messages = [];
    
    // Add conversation history
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('Hysio Assistant request:', {
      messageLength: message.length,
      historyLength: conversationHistory.length,
      model: ASSISTANT_MODEL_CONFIG.model
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          
          const streamResponse = await generateContentStreamWithOpenAI(
            HYSIO_ASSISTANT_SYSTEM_PROMPT,
            messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
            {
              ...ASSISTANT_MODEL_CONFIG,
              onChunk: (chunk: string) => {
                fullContent += chunk;
                // Send chunk to client
                const data = JSON.stringify({ 
                  success: true, 
                  chunk,
                  complete: false 
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              },
              onComplete: (content: string) => {
                fullContent = content;
                
                // Check if response requires clinical disclaimer
                const needsDisclaimer = requiresDisclaimer(content);
                let finalContent = content;
                
                if (needsDisclaimer && !content.includes(CLINICAL_DISCLAIMER)) {
                  finalContent = `${content}\n\n${CLINICAL_DISCLAIMER}`;
                }
                
                // Send completion signal
                const data = JSON.stringify({ 
                  success: true, 
                  complete: true,
                  content: finalContent,
                  requiresDisclaimer: needsDisclaimer
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                controller.close();
              },
              onError: (error: string) => {
                console.error('Assistant streaming error:', error);
                const data = JSON.stringify({ 
                  success: false, 
                  error,
                  complete: true 
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                controller.close();
              }
            }
          );

          if (!streamResponse.success) {
            throw new Error(streamResponse.error || 'Failed to generate response');
          }

        } catch (error) {
          console.error('Assistant API error:', error);
          const data = JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            complete: true 
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Assistant API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during assistant chat',
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
    message: 'Hysio Assistant API is running',
    model: ASSISTANT_MODEL_CONFIG.model,
    provider: 'OpenAI',
    features: ['streaming', 'conversation_history', 'clinical_disclaimer']
  });
}