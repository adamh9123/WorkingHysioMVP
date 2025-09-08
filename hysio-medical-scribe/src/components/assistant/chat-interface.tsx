import * as React from 'react';
import { cn } from '@/utils';
import { MessageBubble } from './message-bubble';
import { AssistantMessage } from '@/lib/types/assistant';
import { EXAMPLE_QUESTIONS } from '@/lib/assistant/system-prompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

export interface ChatInterfaceProps {
  messages: AssistantMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  error?: string | null;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isStreaming = false,
  error,
  className
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = inputValue.trim();
    if (message && !isLoading && !isStreaming) {
      onSendMessage(message);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleQuestion = (question: string) => {
    if (!isLoading && !isStreaming) {
      onSendMessage(question);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={cn('flex flex-col h-full bg-hysio-cream/30', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center mb-6">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-sky-500 font-bold text-lg">H</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-hysio-deep-green mb-2">
              Welkom bij Hysio Assistant
            </h2>
            
            <p className="text-hysio-deep-green-900/70 mb-8 max-w-md">
              Uw AI co-piloot voor fysiotherapie. Stel vragen over klinisch redeneren, 
              richtlijnen, diagnoses en behandelingen.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              {EXAMPLE_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleExampleQuestion(question)}
                  disabled={isLoading || isStreaming}
                  className={cn(
                    'text-left p-4 h-auto whitespace-normal justify-start',
                    'hover:bg-hysio-mint/20 hover:border-hysio-mint transition-colors',
                    'border-hysio-mint/30'
                  )}
                >
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </div>
            
            <p className="text-xs text-hysio-deep-green-900/50 mt-8">
              <strong>Altijd nazien door een bevoegd fysiotherapeut.</strong>
            </p>
          </div>
        ) : (
          /* Messages */
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))}
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="text-sm">
                  <strong>Er is een fout opgetreden:</strong> {error}
                </p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-hysio-mint/20 bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stel je vraag aan Hysio Assistant..."
              disabled={isLoading || isStreaming}
              className={cn(
                'min-h-[44px] max-h-[120px] resize-none',
                'border-hysio-mint/30 focus:border-sky-500 focus:ring-sky-500/20',
                'bg-white'
              )}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isStreaming}
            className={cn(
              'bg-sky-500 hover:bg-sky-600 self-end',
              'min-w-[44px] h-[44px] p-0'
            )}
          >
            {isLoading || isStreaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-hysio-deep-green-900/50">
            Druk Enter om te verzenden, Shift + Enter voor nieuwe regel
          </p>
          
          {(isLoading || isStreaming) && (
            <p className="text-xs text-sky-600 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              {isStreaming ? 'Assistant is aan het typen...' : 'Bericht wordt verstuurd...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export { ChatInterface };