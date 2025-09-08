// API routes for Hysio Assistant conversation management

import { NextRequest, NextResponse } from 'next/server';
import { Conversation, AssistantMessage } from '@/lib/types/assistant';

export const runtime = 'nodejs';

// In-memory storage for MVP (replace with database in production)
const conversationsStore = new Map<string, Conversation>();
const userConversationsStore = new Map<string, string[]>(); // userId -> conversationIds

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateConversationTitle(firstMessage: string): string {
  // Extract first few words or use first sentence
  const words = firstMessage.trim().split(' ').slice(0, 6).join(' ');
  return words.length > 50 ? words.substring(0, 50) + '...' : words;
}

// GET /api/assistant/conversations - Get all conversations for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    
    const userConversationIds = userConversationsStore.get(userId) || [];
    const conversations = userConversationIds
      .map(id => conversationsStore.get(id))
      .filter(Boolean) as Conversation[];
    
    // Sort by updated date, most recent first
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return NextResponse.json({
      success: true,
      conversations
    });
    
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve conversations' 
      },
      { status: 500 }
    );
  }
}

// POST /api/assistant/conversations - Create new conversation or add message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, conversationId, message, userId = 'default-user' } = body;
    
    if (action === 'create') {
      // Create new conversation
      const newConversation: Conversation = {
        id: generateId(),
        title: 'Nieuw gesprek',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId
      };
      
      conversationsStore.set(newConversation.id, newConversation);
      
      // Add to user's conversation list
      const userConversations = userConversationsStore.get(userId) || [];
      userConversations.unshift(newConversation.id); // Add to beginning
      userConversationsStore.set(userId, userConversations);
      
      return NextResponse.json({
        success: true,
        conversation: newConversation
      });
      
    } else if (action === 'add_message') {
      // Add message to existing conversation
      if (!conversationId || !message) {
        return NextResponse.json(
          { success: false, error: 'Conversation ID and message are required' },
          { status: 400 }
        );
      }
      
      const conversation = conversationsStore.get(conversationId);
      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      const newMessage: AssistantMessage = {
        id: generateId(),
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString(),
        requiresDisclaimer: message.requiresDisclaimer
      };
      
      conversation.messages.push(newMessage);
      conversation.updatedAt = new Date().toISOString();
      
      // Update title if this is the first user message
      if (conversation.messages.length === 1 && message.role === 'user') {
        conversation.title = generateConversationTitle(message.content);
      }
      
      conversationsStore.set(conversationId, conversation);
      
      return NextResponse.json({
        success: true,
        conversation,
        message: newMessage
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "create" or "add_message"' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Conversation management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to manage conversation' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/assistant/conversations - Update conversation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, title, userId = 'default-user' } = body;
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    const conversation = conversationsStore.get(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    if (title) {
      conversation.title = title;
    }
    
    conversation.updatedAt = new Date().toISOString();
    conversationsStore.set(conversationId, conversation);
    
    return NextResponse.json({
      success: true,
      conversation
    });
    
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update conversation' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assistant/conversations?id=conversationId - Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    const userId = searchParams.get('userId') || 'default-user';
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    const conversation = conversationsStore.get(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Remove from storage
    conversationsStore.delete(conversationId);
    
    // Remove from user's conversation list
    const userConversations = userConversationsStore.get(userId) || [];
    const updatedConversations = userConversations.filter(id => id !== conversationId);
    userConversationsStore.set(userId, updatedConversations);
    
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete conversation' 
      },
      { status: 500 }
    );
  }
}