import React from 'react';
import { MessageSquare, Clock, PlusCircle, Bot, Settings, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Chat {
  id: string;
  title: string; // 这个字段将显示最新用户消息
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatSidebarProps {
  onAgentSelect: (agentId: string) => void;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  selectedAgentId?: string;
  selectedChatId?: string;
  chats: Chat[];
  collapsedIcon?: React.ReactNode;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onAgentSelect,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  selectedAgentId,
  selectedChatId,
  chats,
  collapsedIcon
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button
          variant="default"
          className="w-full justify-start mb-4"
          onClick={onNewChat}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        <h2 className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center">
          <Bot className="h-4 w-4 mr-2" />
          Agents
        </h2>

        <div className="space-y-1 mb-4">
          {[
            { id: '1', name: 'General Assistant', icon: <Bot className="h-4 w-4 mr-2" /> },
            { id: '2', name: 'Code Helper', icon: <Bot className="h-4 w-4 mr-2" /> },
            { id: '3', name: 'Creative Writer', icon: <Bot className="h-4 w-4 mr-2" /> },
            { id: '4', name: 'Business Advisor', icon: <Bot className="h-4 w-4 mr-2" /> },
          ].map((agent) => (
            <Button
              key={agent.id}
              variant={selectedAgentId === agent.id ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => onAgentSelect(agent.id)}
            >
              {agent.icon}
              {agent.name}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <h2 className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Chat History
        </h2>
      </div>

      <ScrollArea className="flex-1 px-4 max-h-[calc(100vh-200px)]">
        {chats.length === 0 ? (
          <p className="text-muted-foreground italic">No chat history</p>
        ) : (
          <div className="space-y-1">
            {chats.map((chat, index) => (
              <Button
                key={chat.id}
                variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                className="w-full justify-start text-sm mb-1 relative"
                onClick={() => onChatSelect(chat.id)}
              >
                <span className="mr-2 bg-muted px-2 rounded">{index + 1}</span>
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="truncate text-left">
                  <div className="truncate">{chat.title || "New Chat"}</div> 
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span className="ml-1">{formatDate(chat.updatedAt)}</span>
                  </div>
                </div>
                <button
                  className="absolute right-2 top-2 text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                    localStorage.removeItem(`chat_${chat.id}`);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 mt-auto">
        <Separator className="my-2" />
        <Button variant="ghost" className="w-full justify-start text-sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;