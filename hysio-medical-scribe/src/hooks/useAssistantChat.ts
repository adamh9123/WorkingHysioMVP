// Custom React hook for managing Hysio Assistant chat functionality

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { AssistantChatState, AssistantAction, Conversation, AssistantMessage } from '@/lib/types/assistant';

const initialState: AssistantChatState = {
  currentConversation: null,
  conversations: [],
  isLoading: false,
  isStreaming: false,
  error: null,
};

function chatReducer(state: AssistantChatState, action: AssistantAction): AssistantChatState {
  switch (action.type) {
    case 'START_CONVERSATION':
      return {
        ...state,
        currentConversation: {
          id: Date.now().toString(),
          title: action.payload.title,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        error: null,
      };
      
    case 'LOAD_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload.conversation,
        error: null,
      };
      
    case 'ADD_MESSAGE':
      if (!state.currentConversation) return state;
      return {
        ...state,
        currentConversation: {
          ...state.currentConversation,
          messages: [...state.currentConversation.messages, action.payload.message],
          updatedAt: new Date().toISOString(),
        },
      };
      
    case 'UPDATE_MESSAGE':
      if (!state.currentConversation) return state;
      return {
        ...state,
        currentConversation: {
          ...state.currentConversation,
          messages: state.currentConversation.messages.map(msg =>
            msg.id === action.payload.messageId
              ? { ...msg, content: action.payload.content, isStreaming: false }
              : msg
          ),
        },
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
      
    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload.isStreaming,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
        isStreaming: false,
      };
      
    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload.conversations,
      };
      
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload.conversationId),
        currentConversation: state.currentConversation?.id === action.payload.conversationId 
          ? null 
          : state.currentConversation,
      };
      
    default:
      return state;
  }
}

export interface UseAssistantChatOptions {
  userId?: string;
  autoLoadConversations?: boolean;
}

export function useAssistantChat(options: UseAssistantChatOptions = {}) {
  const { userId = 'default-user', autoLoadConversations = true } = options;
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });
      
      const response = await fetch(`/api/assistant/conversations?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: { conversations: data.conversations } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { error: data.error } });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to load conversations' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [userId]);

  // Create new conversation
  const startNewConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'LOAD_CONVERSATION', payload: { conversation: data.conversation } });
        dispatch({ 
          type: 'SET_CONVERSATIONS', 
          payload: { conversations: [data.conversation, ...state.conversations] } 
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { error: data.error } });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to create conversation' } });
    }
  }, [userId, state.conversations]);

  // Load specific conversation
  const loadConversation = useCallback((conversation: Conversation) => {
    dispatch({ type: 'LOAD_CONVERSATION', payload: { conversation } });
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (message: string) => {
    if (!state.currentConversation) {
      await startNewConversation();
      // Wait for conversation to be created
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const conversation = state.currentConversation;
    if (!conversation) return;

    // Add user message
    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: { message: userMessage } });

    // Add empty assistant message for streaming
    const assistantMessage: AssistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: { message: assistantMessage } });
    dispatch({ type: 'SET_STREAMING', payload: { isStreaming: true } });

    try {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Save user message to conversation
      await fetch('/api/assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_message',
          conversationId: conversation.id,
          message: userMessage,
          userId,
        }),
      });

      // Stream assistant response
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: conversation.messages,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.success) {
              if (data.chunk) {
                fullContent += data.chunk;
                dispatch({ 
                  type: 'UPDATE_MESSAGE', 
                  payload: { messageId: assistantMessage.id, content: fullContent } 
                });
              }
              
              if (data.complete) {
                const finalMessage: AssistantMessage = {
                  ...assistantMessage,
                  content: data.content || fullContent,
                  isStreaming: false,
                  requiresDisclaimer: data.requiresDisclaimer,
                };
                
                // Save assistant response to conversation
                await fetch('/api/assistant/conversations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'add_message',
                    conversationId: conversation.id,
                    message: finalMessage,
                    userId,
                  }),
                });
                
                break;
              }
            } else {
              throw new Error(data.error || 'Streaming failed');
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { error: error instanceof Error ? error.message : 'Failed to send message' } 
      });
      
      // Remove the failed assistant message
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { messageId: assistantMessage.id, content: 'Fout bij versturen bericht.' } 
      });
    } finally {
      dispatch({ type: 'SET_STREAMING', payload: { isStreaming: false } });
    }
  }, [state.currentConversation, userId, startNewConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/assistant/conversations?id=${conversationId}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch({ type: 'DELETE_CONVERSATION', payload: { conversationId } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { error: data.error } });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to delete conversation' } });
    }
  }, [userId]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: { error: null } });
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (autoLoadConversations) {
      loadConversations();
    }
  }, [autoLoadConversations, loadConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    currentConversation: state.currentConversation,
    conversations: state.conversations,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    
    // Actions
    startNewConversation,
    loadConversation,
    sendMessage,
    deleteConversation,
    loadConversations,
    clearError,
  };
}