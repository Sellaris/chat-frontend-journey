export interface Agent {
  id: string;
  name: string;
  description?: string;
}

export interface Chat {
  id: string;
  title: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  dbResult?: string; // 新增数据库查询结果字段
}

class ChatService {
  private apiKey: string = '';
  
  setApiKey(key: string) {
    this.apiKey = key;
    // 同时保存到localStorage的choosed_api
    if (key) {
      localStorage.setItem('choosed_api', JSON.stringify({
        key,
        base: 'https://api.moonshot.cn/v1'
      }));
    } else {
      localStorage.removeItem('choosed_api');
    }
    console.log('API key set:', key ? '********' + key.slice(-4) : 'empty');
  }
  
  getApiKey(): string {
    return this.apiKey;
  }

  hasApiKey(): boolean {
    // 优先检查localStorage
    const choosedApiRaw = localStorage.getItem('choosed_api');
    if (choosedApiRaw) {
      try {
        const parsed = JSON.parse(choosedApiRaw);
        return !!parsed.key;
      } catch (e) {
        console.error('Failed to parse choosed_api from localStorage', e);
        return false;
      }
    }
    // 回退到实例属性
    return !!this.apiKey;
  }

  async getAgents(): Promise<Agent[]> {
    return [
      { id: '1', name: 'General Assistant', description: 'A helpful assistant for general questions.' },
      { id: '2', name: 'Code Helper', description: 'Specialized in programming and technical topics.' },
      { id: '3', name: 'Creative Writer', description: 'Helps with creative writing and brainstorming.' },
      { id: '4', name: 'Business Advisor', description: 'Provides strategic business advice and helps with decision-making processes.' }    ];
  }

  async getChats(): Promise<Chat[]> {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        return parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse chats:', e);
        return [];
      }
    }
    return [];
  }

  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const saved = localStorage.getItem(`chat_${chatId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  }

  async createChat(agentId: string, title: string = 'New Chat'): Promise<Chat> {
    const savedChats = localStorage.getItem('chats');
    const currentChats = savedChats ? JSON.parse(savedChats) : [];
    
    const newChat = {
      id: `new-${Date.now()}`,
      title,
      agentId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 将新聊天保存到localStorage
    const updatedChats = [...currentChats, newChat];
    localStorage.setItem('chats', JSON.stringify(updatedChats));
    
    return newChat;
  }

  async sendMessage(chatId: string, content: string): Promise<Message> {
    if (!this.hasApiKey()) {
      throw new Error("API key is required to send a message");
    }
    
    console.log(`Sending message to chat ${chatId}: ${content}`);
    console.log(`Using API key: ${this.apiKey ? '********' + this.apiKey.slice(-4) : 'not set'}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `user-${Date.now()}`,
      chatId,
      content,
      role: 'user',
      createdAt: new Date()
    };
  }

  async saveMessages(chatId: string, messages: Message[]): Promise<void> {
    try {
      if (!messages.length) return;
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages, null, 2));
      
      // 更新标题为最新用户消息
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length > 0) {
        const latestUserMessage = userMessages[userMessages.length - 1];
        await this.updateChatTitle(chatId, latestUserMessage.content);
      }
    } catch (e) {
      console.error('Failed to save messages:', e);
      throw e;
    }
  }

  async updateChatTitle(chatId: string, title: string): Promise<void> {
    try {
      const savedChats = localStorage.getItem('chats');
      if (!savedChats) return;
      
      let chats = JSON.parse(savedChats);
      const chatIndex = chats.findIndex((c: Chat) => c.id === chatId);
      if (chatIndex !== -1) {
        chats[chatIndex] = {
          ...chats[chatIndex],
          title: title,
          updatedAt: new Date()
        };
        localStorage.setItem('chats', JSON.stringify(chats, null, 2));
      }
    } catch (e) {
      console.error('Failed to update chat title:', e);
      throw e;
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      localStorage.removeItem(`chat_${chatId}`);
      // 删除元信息
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        const chats = JSON.parse(savedChats);
        const updatedChats = chats.filter((c: Chat) => c.id !== chatId);
        localStorage.setItem('chats', JSON.stringify(updatedChats, null, 2));
      }
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  }

  async getKimiResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    const choosedApiRaw = localStorage.getItem('choosed_api');
    let apiKey = '';
    let apiBase = 'https://api.moonshot.cn/v1';

    if (choosedApiRaw) {
      try {
        const parsed = JSON.parse(choosedApiRaw);
        if (parsed.key) apiKey = parsed.key;
        if (parsed.base) apiBase = parsed.base;
      } catch (e) {
        console.error('Failed to parse choosed_api from localStorage', e);
      }
    }

    // 如果localStorage没有数据则回退到实例属性
    if (!apiKey) {
      apiKey = this.apiKey;
    }

    if (!apiKey) {
      throw new Error('API key is required');
    }

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-128k',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';
  }
}

// 导出单例时确保包含新方法
const chatServiceInstance = new ChatService();
export default chatServiceInstance;