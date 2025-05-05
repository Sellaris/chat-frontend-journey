import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import ChatSidebar from '@/components/sidebar/ChatSidebar';
import ChatInterface from '@/components/chat/ChatInterface';
import { Bot, Clock, PlusCircle } from 'lucide-react';
import chatService, { Chat } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';
import { getPrompthistory } from '@/components/chat/ChatInterface';

const Index: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('1');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [chats, setChats] = useState<Chat[]>([]);
  const { toast } = useToast();

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    //setMessages([])
    chatService.saveMessages(selectedChatId || '', []);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleNewChat = async () => {
    try {
      const newChat = await chatService.createChat(selectedAgentId);
      // 创建初始消息对
      const userMessage: Message = {
        id: `user-init-${newChat.id}`,
        chatId: newChat.id,
        content: "你是谁？",
        role: 'user',
        createdAt: new Date()
      };
      const aiMessage: Message = {
        id: `assistant-init-${newChat.id}`,
        chatId: newChat.id,
        content: getPrompthistory(selectedAgentId),
        role: 'assistant',
        createdAt: new Date()
      };
      
      await chatService.saveMessages(newChat.id, [userMessage, aiMessage]);
      
      // 重新加载聊天列表以获取更新的标题
      const updatedChats = await chatService.getChats();
      setChats(updatedChats);
      setSelectedChatId(newChat.id);
      
      toast({
        title: "New chat created",
        description: `Started a new conversation with ${selectedAgentId === '1' ? 'General Assistant' : selectedAgentId === '2' ? 'Code Helper' :selectedAgentId === '3' ?'Creative Writer': 'Business Advisor'}`
      });
    } catch (error) {
      console.error('Failed to create new chat:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create new chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChats((prev) => prev.filter(chat => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(undefined);
      }
      toast({
        title: "Chat deleted",
        description: "The conversation has been permanently removed",
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string): Promise<Message> => {
    if (!selectedChatId) {
      // 使用用户发送的内容作为标题创建新聊天
      const newChat = await chatService.createChat(selectedAgentId, content);
      setChats((prev) => [...prev, { ...newChat, title: newChat.title }]);
      setSelectedChatId(newChat.id);
      
      // 创建初始消息对
      const userMessage: Message = {
        id: `user-init-${newChat.id}`,
        chatId: newChat.id,
        content: content,
        role: 'user',
        createdAt: new Date()
      };
      const aiMessage: Message = {
        id: `assistant-init-${newChat.id}`,
        chatId: newChat.id,
        content: getPrompthistory(selectedAgentId),
        role: 'assistant',
        createdAt: new Date()
      };
      
      // 保存初始消息
      await chatService.saveMessages(newChat.id, [userMessage, aiMessage]);
      
      toast({
        title: "New chat created",
        description: `Started a new conversation with ${selectedAgentId === '1' ? 'General Assistant' : selectedAgentId === '2' ? 'Code Helper' :selectedAgentId === '3' ?'Creative Writer': 'Business Advisor'}`
      });
      
      // 添加刷新逻辑
      window.location.reload();
      
      return aiMessage;
    }
    
    // 发送消息
    const aiMessage = await chatService.sendMessage(selectedChatId, content);
    
    // 创建用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      chatId: selectedChatId,
      content,
      role: 'user',
      createdAt: new Date()
    };
    
    // 保存消息
    await chatService.saveMessages(selectedChatId, [userMessage, aiMessage]);
    
    // 添加刷新逻辑
    window.location.reload();
    
    return aiMessage;
  };

  useEffect(() => {
    const apiKey = localStorage.getItem('chat-api-key');
    if (apiKey) {
      chatService.setApiKey(apiKey);
    }
  }, []);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const chats = await chatService.getChats();
        setChats(chats);
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    };
    
    loadChats();
  }, []);

  return (
    <SidebarLayout
      sidebar={
        <ChatSidebar
          onAgentSelect={handleAgentSelect}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          selectedAgentId={selectedAgentId}
          selectedChatId={selectedChatId}
          chats={chats}
          collapsedIcon={
            <>
              <PlusCircle className="h-6 w-6" />
              <Bot className="h-6 w-6 mb-4" />
              <Clock className="h-6 w-6 mb-4" />
            </>
          }
        />
      }
    >
      <div className="h-full">
        <ChatInterface
          agentId={selectedAgentId}
          chatId={selectedChatId}
          onSendMessage={handleSendMessage}
        />
      </div>
    </SidebarLayout>
  );
};

export default Index;