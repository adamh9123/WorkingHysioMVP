import * as React from 'react';
import { cn } from '@/utils';
import { formatDuration } from '@/lib/utils';
import { Conversation } from '@/lib/types/assistant';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, Trash2, MoreVertical } from 'lucide-react';

export interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  isLoading = false,
  className
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  
  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;
    
    setDeletingId(conversationId);
    try {
      await onDeleteConversation(conversationId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('nl-NL', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  return (
    <div className={cn(
      'flex flex-col h-full bg-white border-r border-hysio-mint/20',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-hysio-mint/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <span className="text-sky-500 font-bold text-xs">H</span>
            </div>
          </div>
          <h1 className="font-semibold text-hysio-deep-green">Assistant</h1>
        </div>
        
        <Button
          onClick={onNewConversation}
          disabled={isLoading}
          className="w-full gap-2 bg-sky-500 hover:bg-sky-600"
        >
          <Plus size={16} />
          Nieuw gesprek
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-hysio-deep-green-900/50">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nog geen gesprekken</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => {
              const isActive = currentConversation?.id === conversation.id;
              const isDeleting = deletingId === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'group relative rounded-lg cursor-pointer transition-colors',
                    'hover:bg-hysio-mint/10',
                    isActive && 'bg-hysio-mint/20'
                  )}
                  onClick={() => !isDeleting && onSelectConversation(conversation)}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          'text-sm font-medium truncate',
                          isActive 
                            ? 'text-hysio-deep-green' 
                            : 'text-hysio-deep-green-900'
                        )}>
                          {conversation.title || 'Nieuw gesprek'}
                        </h3>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-hysio-deep-green-900/50">
                            {conversation.messages.length} {conversation.messages.length === 1 ? 'bericht' : 'berichten'}
                          </p>
                          
                          <p className="text-xs text-hysio-deep-green-900/50">
                            {formatTime(conversation.updatedAt)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(conversation.id, e)}
                        disabled={isDeleting}
                        className={cn(
                          'w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity',
                          'hover:bg-red-100 hover:text-red-600',
                          isDeleting && 'opacity-100'
                        )}
                      >
                        {isDeleting ? (
                          <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </Button>
                    </div>
                    
                    {/* Last Message Preview */}
                    {conversation.messages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-hysio-deep-green-900/60 line-clamp-2">
                          {conversation.messages[conversation.messages.length - 1].role === 'user' ? '• ' : ''}
                          {conversation.messages[conversation.messages.length - 1].content.substring(0, 80)}
                          {conversation.messages[conversation.messages.length - 1].content.length > 80 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-hysio-mint/20">
        <p className="text-xs text-hysio-deep-green-900/50 text-center">
          Hysio Assistant v1.0
        </p>
        <p className="text-xs text-hysio-deep-green-900/50 text-center mt-1">
          <strong>Altijd nazien door een bevoegd fysiotherapeut</strong>
        </p>
      </div>
    </div>
  );
};

export { ConversationSidebar };