
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ChatMessage, { ChatMessageProps } from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ApiKeySettings from '../settings/ApiKeySettings';
import chatService from '@/services/chatService';
import { useToast } from "@/hooks/use-toast";
import { get } from 'http';
import { Loader2 } from 'lucide-react'

interface Message {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  dbResult?: string;
  isStreamingDbResult?: boolean;
}

interface ChatInterfaceProps {
  agentId: string;
  chatId?: string;
  onSendMessage: (content: string) => Promise<any>;
}
const agentNameMap = {
  '1': 'General Assistant: 一个通用型的私人数据助手',
  '2': 'Code Helper: 一个专注于技术问题的代码专家',
  '3': 'Creative Writer: 一个富有创造力的写作助手',
  '4': 'Business Advisor: 一个提供商业建议和策略的专家顾问',
};
// 在组件内部定义agentPrompts常量
const agentPrompts = {
  '1': '你是一个数据库通用助手，你将获得数据库的查询回答，请根据数据库数据提供全面且准确的回答：',
  '2': '你是一个数据库代码助手，请专注于编程和技术问题，提供清晰的代码示例和解释：',
  '3': '你是一个数据库创意作家，请发挥创造力，提供富有想象力的回答：',
  '4': '你是一个数据库商业顾问，请提供专业的商业建议和策略：',
};
const agentPromptshistory = {
  '1': '您好！我是一个私人AI通用助手，我将根据数据库数据为您提供全面且准确的回答！',
  '2': '您好！我是一个AI代码助手，专注于编程和技术问题，我将根据数据库数据为您提供清晰的代码示例和解释！',
  '3': '您好！我是一个AI创意作家，我会发挥创造力，我将根据数据库数据为您提供富有想象力的回答！',
  '4': '您好！我是一个AI商业顾问，我将根据数据库数据为您提供专业的商业建议和策略！',
};

const getAgentName = (agentId: string): string => {
  return agentNameMap[agentId] || 'AI Assistant';
};

const getPrompt = (agentId: string): string => {
  return agentPrompts[agentId] || 'AI Assistant Prompt';
};


export const getPrompthistory = (agentId: string): string => {
  return agentPromptshistory[agentId] || 'AI Assistant Prompt';
};
const ChatInterface: React.FC<Omit<ChatInterfaceProps, 'onSendMessage'>> = ({ 
  agentId, 
  chatId 
}) => {

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isquerying, setisquerying] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const browserSupportsSpeechRecognition = typeof (window as any).webkitSpeechRecognition !== 'undefined';

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'zh-CN';

    recognitionInstance.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      toast({
        title: "Speech Recognition Error",
        description: event.error,
        variant: "destructive"
      });
      setIsRecognizing(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  // 修改加载API密钥的useEffect
  useEffect(() => {
    // 优先从localStorage的choosed_api读取
    const choosedApiRaw = localStorage.getItem('choosed_api');
    if (choosedApiRaw) {
      try {
        const parsed = JSON.parse(choosedApiRaw);
        if (parsed.key) {
          setApiKey(parsed.key);
          chatService.setApiKey(parsed.key);
        }
      } catch (e) {
        console.error('Failed to parse choosed_api', e);
        // 清理异常数据
        localStorage.removeItem('choosed_api');
      }
    } else {
      // 回退到旧的chat-api-key（兼容历史数据）
      const savedApiKey = localStorage.getItem('chat-api-key') || '';
      setApiKey(savedApiKey);
      if (savedApiKey) {
        chatService.setApiKey(savedApiKey);
      }
    }
  }, []);

  // 修改hasApiKey的判断逻辑
  useEffect(() => {
    if (!chatService.hasApiKey()) {
      toast({
        title: "API Key Required",
        description: "Please set your API key in settings before sending messages",
        variant: "destructive",
      });
    }
  }, []);

  // Load messages when chatId changes
  useEffect(() => {
    if (!chatId) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const initialMessages = await chatService.getMessages(chatId);
        // 如果是空聊天，添加初始消息
        if (initialMessages.length === 0) {
          const initMessage: Message = {
            id: `ai-init-${Date.now()}`,
            chatId,
            content: getPrompthistory(agentId),
            role: 'assistant' as const,
            createdAt: new Date()
          };
          setMessages([initMessage]);
          await chatService.saveMessages(chatId, [initMessage]);
        } else {
          setMessages(initialMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // 在handleSubmit函数前新增语音处理逻辑
  const handleVoiceInput = () => {
    if (!browserSupportsSpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    if (isRecognizing) {
      // 停止识别并保存结果
      recognition.stop();
      setInputValue(prev => `${prev} ${transcript}`.trim());
      setTranscript('');
    } else {
      // 开始识别
      recognition.start();
    }
    
    setIsRecognizing(!isRecognizing);
  };

  // 修改queryAI函数
  async function queryAI(question: string, onDataChunk: (chunk: string) => void): Promise<string> {
    try {
      const response = await fetch('http://YOUR_HTTP/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question
        }),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }
      
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) break;
        
          const chunk = decoder.decode(value);
          result += chunk;
          onDataChunk(chunk);
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          reader.cancel();
          throw streamError;
        }
      }
    
      return result;
    } catch (error) {
      console.error('数据库查询失败:', error);
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        toast({
          title: "网络中断",
          description: "与服务器的连接已断开，请检查网络或重试",
          variant: "destructive"
        });
      } else if (error.message.includes('Cursor is not connected')) {
        toast({
          title: "数据库连接异常",
          description: "请刷新页面重试或联系技术支持",
          variant: "destructive"
        });
      }
      return '';
    }
  }

  // 修改handleSubmit中的发送逻辑
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    setisquerying(true);

    if (!chatService.hasApiKey()) {
      toast({
        title: "API Key Required",
        description: "Please set your API key in settings before sending messages",
        variant: "destructive",
      });
      return;
    }

    try {
      // 创建用户消息
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        chatId,
        content: inputValue.trim(),
        role: 'user',
        createdAt: new Date()
      };

      // 创建初始AI消息
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        chatId,
        content: '正在查询数据库... ',
        role: 'assistant',
        createdAt: new Date(),
        dbResult: '',
        isStreamingDbResult: true // 仅设置当前消息的流式状态
      };

      // 更新messages状态
      const updatedMessages = [...messages, newUserMessage, aiMessage];
      setMessages(updatedMessages);
      await chatService.saveMessages(chatId!, updatedMessages);
      setInputValue('');

      // 流式查询dbResult
      let dbResult = '';
      try {
        dbResult = await queryAI(newUserMessage.content, (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const currentAiMessage = newMessages.find(m => m.id === aiMessage.id);
            if (currentAiMessage) {
              currentAiMessage.dbResult += chunk;
            }
            return newMessages;
          });
        });
      } catch (error) {
        console.error('数据库查询失败:', error);
      }

      // 验证dbResult
      if (dbResult.includes('2055: Cursor is not connected')) {
        toast({
          title: "数据库连接异常",
          description: "请刷新页面重试或联系技术支持",
          variant: "destructive"
        });
        return;
      }

      // 构造prompt
      const promptPrefix = agentPrompts[agentId] || '未知助手类型，请根据以下内容提供回答：';
      const historyContent = messages
        .filter(msg => msg.id !== newUserMessage.id)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const newPromptContent = `${promptPrefix} 
以下是数据库查询内容 <${dbResult}>，
历史对话记录：
<${historyContent}>
请根据数据库内容和历史对话回答：
<${newUserMessage.content}>`;

      const modifiedMessagesForKimi = updatedMessages.map(msg => 
        msg.role === 'user' 
          ? { ...msg, content: newPromptContent } 
          : msg
      );

      setIsLoading(true);
      setisquerying(false);
      // 获取AI响应
      const aiResponse = await chatService.getKimiResponse(
        modifiedMessagesForKimi.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      );

      // 创建最终的AI消息
      const finalAiMessage: Message = {
        ...aiMessage,
        content: aiResponse,
        dbResult: dbResult,
        isStreamingDbResult: false // 仅关闭当前消息的流式状态
      };

      // 更新messages
      const finalMessages = [...messages, newUserMessage, finalAiMessage];
      setMessages(finalMessages);
      await chatService.saveMessages(chatId!, finalMessages);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    chatService.setApiKey(newKey);
  };

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">
          {agentId ? getAgentName(agentId) : 'AI Assistant'}
        </h2>
        <ApiKeySettings
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
        />
      </div>

      <ScrollArea className="flex-1 p-4 max-h-[65vh]">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[70vh]">
              <div className="text-center text-muted-foreground">
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="max-w-sm">
                  {chatService.hasApiKey() 
                    ? "Send a message to begin chatting with the AI assistant" 
                    : "Please set your API key in settings to begin chatting"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                agentId={agentId} // 传递当前chat的agentId
                dbResult={message.dbResult} // 新增：传递数据库查询结果
                isStreamingDbResult={message.isStreamingDbResult} // 使用消息自身状态
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center text-muted-foreground animate-pulse-slow">
              <Bot className="mr-2 h-5 w-5" />
              <span>AI is typing...</span>
            </div>
          )}
          {isquerying && (
            <div className="flex items-center text-muted-foreground animate-pulse-slow">
              <Bot className="mr-2 h-5 w-5" />
              <span>AI is querying...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end border rounded-lg bg-background overflow-hidden">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={chatService.hasApiKey() ? "Send a message..." : "Please set API key first..."}
              className="min-h-[70px] border-none flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              rows={1}
              disabled={!chatService.hasApiKey()}
            />
            <div className="p-2 flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9 mr-1">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Attachments</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload files to include in your message
                      </p>
                      <div className="border-2 border-dashed rounded-lg p-4">
                        <div className="text-center">
                          <Paperclip className="mx-auto h-8 w-8 text-muted-foreground" />
                          <div className="mt-2">
                            <Button variant="outline" size="sm">Upload a file</Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, PDF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                onClick={handleVoiceInput}
                disabled={isLoading || !browserSupportsSpeechRecognition}
              >
                {isRecognizing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputValue.trim() || isLoading || !chatService.hasApiKey()} 
                className="h-9 w-9"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
