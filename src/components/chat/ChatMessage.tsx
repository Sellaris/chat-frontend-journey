import React, { useState, useEffect } from 'react';
import { Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
  agentId?: string;
  dbResult?: string;
  isStreamingDbResult?: boolean; // 重命名属性
}

const agentNameMap = {
  '1': 'General Assistant',
  '2': 'Code Helper',
  '3': 'Creative Writer',
  '4': 'Business Advisor',
};

const getAgentName = (agentId: string): string => {
  return agentNameMap[agentId] || 'AI Assistant';
};

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  content, 
  role, 
  timestamp, 
  agentId, 
  dbResult, 
  isStreamingDbResult = false // 默认值
}) => {
  const isUser = role === 'user';
  const title = isUser ? 'You' : (agentId ? getAgentName(agentId) : 'AI Assistant');
  
  // 初始状态改为基于本条消息的状态
  const [isExpanded, setIsExpanded] = useState(!!isStreamingDbResult || !!dbResult);

  // 当本条消息的流式状态变化时自动展开/收起
  useEffect(() => {
    if (isStreamingDbResult) {
      setIsExpanded(true); // 流式期间强制展开
    } else {
      setIsExpanded(false); // 结束后自动收起
    }
  }, [isStreamingDbResult]);

  // 判断是否需要显示展开区域 - 优化条件
  const shouldShowToggle = !isUser && (dbResult !== undefined || isStreamingDbResult);

  return (
    <div className={cn(
      "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[80%] md:max-w-[70%] rounded-lg p-4",
        isUser 
          ? "bg-chat-user text-primary rounded-br-none" 
          : "bg-chat-ai text-primary rounded-bl-none"
      )}>
        <div className={cn(
          "rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3",
          isUser ? "bg-blue-100" : "bg-slate-100"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        <div className="flex flex-col flex-1">
          <div className="text-xs font-medium mb-1">
            {title}
            {timestamp && (
              <span className="text-muted-foreground ml-2">
                {new Intl.DateTimeFormat('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }).format(timestamp)}
              </span>
            )}
          </div>

          {isUser ? (
            <div className="whitespace-pre-wrap text-sm">{content}</div>
          ) : (
            <div className="space-y-2">
              {/* 显示完整AI回复内容 */}
              <div className="whitespace-pre-wrap text-sm">
                {content}
              </div>

              {/* 数据库查询结果展开区域 */}
              {shouldShowToggle && (
                <div
                  className={cn(
                    "whitespace-pre-wrap overflow-hidden transition-all duration-300 ease-in-out text-sm text-muted-foreground relative",
                    isExpanded ? "max-h-full opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {dbResult || ''}
                  {isStreamingDbResult && (
                    <span className="animate-pulse-slow">▌</span>
                  )}
                </div>
              )}

              {shouldShowToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="self-start mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      <span>Collapse (Database Querying & Thinking)</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      <span>Expand (Database Querying & Thinking)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
