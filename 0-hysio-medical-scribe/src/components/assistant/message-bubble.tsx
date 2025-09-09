import * as React from 'react';
import { cn } from '@/utils';
import { AssistantMessage } from '@/lib/types/assistant';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MessageBubbleProps {
  message: AssistantMessage;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatContent = (content: string) => {
    // Basic markdown-like formatting
    let formatted = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text  
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Lists
      .replace(/^\- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>');
    
    return `<p class="mb-2">${formatted}</p>`;
  };

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser ? 'flex-row-reverse' : 'flex-row',
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
        isUser 
          ? 'bg-hysio-mint text-hysio-deep-green' 
          : 'bg-sky-500 text-white'
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-[75%]',
        isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
      )}>
        <div className={cn(
          'rounded-2xl px-4 py-3 shadow-sm relative group',
          isUser 
            ? 'bg-hysio-mint text-hysio-deep-green-900 rounded-tr-md'
            : 'bg-white border border-gray-200 text-hysio-deep-green-900 rounded-tl-md',
          message.isStreaming && 'animate-pulse'
        )}>
          {/* Content */}
          <div className={cn(
            'prose prose-sm max-w-none',
            isUser ? 'text-hysio-deep-green-900' : 'text-hysio-deep-green-900'
          )}>
            {message.content ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(message.content) 
                }} 
              />
            ) : (
              message.isStreaming && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-hysio-deep-green-900/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-hysio-deep-green-900/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-hysio-deep-green-900/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              )
            )}
          </div>
          
          {/* Copy Button */}
          {!message.isStreaming && message.content && (
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className={cn(
                'absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-black/5'
              )}
            >
              {copied ? (
                <Check size={12} className="text-green-600" />
              ) : (
                <Copy size={12} />
              )}
            </Button>
          )}
        </div>
        
        {/* Clinical Disclaimer */}
        {message.requiresDisclaimer && (
          <div className="mt-2 text-xs text-hysio-deep-green-900/70 italic max-w-[75%]">
            <strong>Altijd nazien door een bevoegd fysiotherapeut.</strong>
          </div>
        )}
        
        {/* Timestamp */}
        <div className={cn(
          'text-xs text-hysio-deep-green-900/50 mt-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.timestamp).toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export { MessageBubble };