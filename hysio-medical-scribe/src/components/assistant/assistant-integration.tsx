import * as React from 'react';
import { cn } from '@/utils';
import { ChatInterface } from './chat-interface';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import { AssistantIntegrationProps } from '@/lib/types/assistant';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageCircle, Bot } from 'lucide-react';

const AssistantIntegration: React.FC<AssistantIntegrationProps> = ({
  isCollapsed = false,
  onToggle,
  className
}) => {
  const [localCollapsed, setLocalCollapsed] = React.useState(isCollapsed);
  const {
    currentConversation,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    startNewConversation,
    clearError,
  } = useAssistantChat({ autoLoadConversations: false });

  const collapsed = onToggle ? isCollapsed : localCollapsed;
  const handleToggle = onToggle || (() => setLocalCollapsed(!localCollapsed));

  const messages = currentConversation?.messages || [];

  const handleSendMessage = async (message: string) => {
    if (error) clearError();
    
    // Start conversation if none exists
    if (!currentConversation) {
      await startNewConversation();
    }
    
    sendMessage(message);
  };

  React.useEffect(() => {
    setLocalCollapsed(isCollapsed);
  }, [isCollapsed]);

  return (
    <div className={cn(
      'border border-hysio-mint/20 rounded-lg bg-white shadow-sm overflow-hidden transition-all duration-300',
      collapsed ? 'h-auto' : 'h-96',
      className
    )}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-3 bg-gradient-to-r from-sky-50 to-sky-100/50',
          'border-b border-sky-200 cursor-pointer hover:from-sky-100 hover:to-sky-200/50 transition-colors'
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          
          <div>
            <h3 className="font-semibold text-hysio-deep-green text-sm">
              Hysio Assistant
            </h3>
            <p className="text-xs text-hysio-deep-green-900/60">
              {collapsed 
                ? 'Klik om uit te klappen' 
                : messages.length > 0 
                  ? `${messages.length} ${messages.length === 1 ? 'bericht' : 'berichten'}`
                  : 'AI co-piloot voor fysiotherapie'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicators */}
          {(isLoading || isStreaming) && (
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
          )}
          
          {error && (
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          )}
          
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 hover:bg-sky-200"
          >
            {collapsed ? (
              <ChevronDown size={14} className="text-hysio-deep-green" />
            ) : (
              <ChevronUp size={14} className="text-hysio-deep-green" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'transition-all duration-300 overflow-hidden',
        collapsed ? 'max-h-0' : 'max-h-96'
      )}>
        {collapsed ? null : (
          <div className="h-80">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isStreaming={isStreaming}
              error={error}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Collapsed State Preview */}
      {collapsed && messages.length > 0 && (
        <div className="p-3 border-t border-hysio-mint/10">
          <div className="flex items-center gap-2 text-xs text-hysio-deep-green-900/60">
            <MessageCircle size={12} />
            <span>
              Laatste: {messages[messages.length - 1].role === 'user' ? 'Jij' : 'Assistant'}
            </span>
            <span className="truncate max-w-32">
              {messages[messages.length - 1].content.substring(0, 30)}
              {messages[messages.length - 1].content.length > 30 ? '...' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Footer Disclaimer (when expanded) */}
      {!collapsed && (
        <div className="px-3 py-2 bg-gray-50 border-t border-hysio-mint/10">
          <p className="text-xs text-hysio-deep-green-900/50 text-center">
            <strong>Let op:</strong> Dit is gescheiden van je medische verslaglegging
          </p>
        </div>
      )}
    </div>
  );
};

export { AssistantIntegration };