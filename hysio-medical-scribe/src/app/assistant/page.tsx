'use client';

import * as React from 'react';
import { cn } from '@/utils';
import { ChatInterface } from '@/components/assistant/chat-interface';
import { ConversationSidebar } from '@/components/assistant/conversation-sidebar';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import { Navigation } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function AssistantPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const {
    currentConversation,
    conversations,
    isLoading,
    isStreaming,
    error,
    startNewConversation,
    loadConversation,
    sendMessage,
    deleteConversation,
    clearError,
  } = useAssistantChat();

  const messages = currentConversation?.messages || [];

  const handleSendMessage = (message: string) => {
    if (error) clearError();
    sendMessage(message);
  };

  return (
    <div className="flex flex-col h-screen bg-hysio-cream/30">
      {/* Navigation */}
      <Navigation
        title="Hysio Assistant"
        user={{
          name: "Dr. Test User",
          email: "test@hysio.nl"
        }}
        onLogout={() => console.log('Logout')}
        onSettings={() => console.log('Settings')}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="lg:hidden absolute top-20 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-white shadow-md border-hysio-mint/30"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </Button>
        </div>

        {/* Sidebar */}
        <div className={cn(
          'w-80 flex-shrink-0 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative absolute inset-y-0 left-0 z-40'
        )}>
          <ConversationSidebar
            conversations={conversations}
            currentConversation={currentConversation}
            onNewConversation={startNewConversation}
            onSelectConversation={loadConversation}
            onDeleteConversation={deleteConversation}
            isLoading={isLoading}
            className="h-full shadow-lg lg:shadow-none"
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            error={error}
            className="h-full"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-hysio-mint/20 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs text-hysio-deep-green-900/60">
              Hysio Assistant - AI co-piloot voor fysiotherapie
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-xs text-hysio-deep-green-900/60">
              Model: GPT-4o | Provider: OpenAI
            </p>
          </div>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs text-hysio-deep-green-900/50">
            <strong>Belangrijk:</strong> Alle AI-gegenereerde content moet worden geverifieerd door een bevoegd fysiotherapeut.
            Deze tool is bedoeld ter ondersteuning en vervangt geen professioneel medisch oordeel.
          </p>
        </div>
      </div>
    </div>
  );
}