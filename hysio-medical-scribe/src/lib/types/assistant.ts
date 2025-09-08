/**
 * TypeScript type definitions for Hysio Assistant
 */

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  requiresDisclaimer?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface AssistantResponse {
  success: boolean;
  message?: AssistantMessage;
  error?: string;
  requiresDisclaimer?: boolean;
}

export interface ConversationResponse {
  success: boolean;
  conversation?: Conversation;
  conversations?: Conversation[];
  error?: string;
}

export interface AssistantChatState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface AssistantStreamResponse {
  success: boolean;
  chunk?: string;
  complete?: boolean;
  messageId?: string;
  error?: string;
}

export type AssistantAction = 
  | { type: 'START_CONVERSATION'; payload: { title: string } }
  | { type: 'LOAD_CONVERSATION'; payload: { conversation: Conversation } }
  | { type: 'ADD_MESSAGE'; payload: { message: AssistantMessage } }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; content: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_STREAMING'; payload: { isStreaming: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SET_CONVERSATIONS'; payload: { conversations: Conversation[] } }
  | { type: 'DELETE_CONVERSATION'; payload: { conversationId: string } };

export interface AssistantIntegrationProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}