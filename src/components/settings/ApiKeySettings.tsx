import { useState, useEffect } from 'react';

interface ApiKeyEntry {
  aiName: string;
  apiKey: string;
  apiBase: string;
}

export default function ApiKeySettings() {
  // 新增：模态框开关状态
  const [isOpen, setIsOpen] = useState(false);
  
  // 新增：选中项索引状态
  const [selectedApiIndex, setSelectedApiIndex] = useState<number | null>(null);
  
  // 初始化输入框状态
  const [aiName, setAiName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');
  
  // 存储所有API配置
  const [savedApis, setSavedApis] = useState<ApiKeyEntry[]>([]);

  // 从localStorage加载数据
  useEffect(() => {
    const savedData = localStorage.getItem('savedApis');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSavedApis(parsed);
        
        // 新增：加载已选中API
        const choosedData = localStorage.getItem('choosed_api');
        if (choosedData) {
          const choosedEntry = JSON.parse(choosedData);
          const index = parsed.findIndex(
            entry => entry.aiName === choosedEntry.aiName && 
                     entry.apiKey === choosedEntry.apiKey && 
                     entry.apiBase === choosedEntry.apiBase
          );
          setSelectedApiIndex(index);
        }
      } catch (e) {
        console.error('Failed to parse saved APIs', e);
      }
    }
  }, []);

  // 保存数据到localStorage
  const saveToLocalStorage = (data: ApiKeyEntry[]) => {
    localStorage.setItem('savedApis', JSON.stringify(data));
  };

  // 新增：选中API处理函数
  const handleSelect = (index: number) => {
    const selectedEntry = savedApis[index];
    // 统一保存为 { key, base } 结构以匹配 chatService 期望
    localStorage.setItem('choosed_api', JSON.stringify({
      key: selectedEntry.apiKey,
      base: selectedEntry.apiBase
    }));
    setSelectedApiIndex(index);
    // 同步更新 chatService 的 apiKey（注意这里已移除条件判断）
    chatService.setApiKey(selectedEntry.apiKey);
  };
  const handleAdd = () => {
    if (!aiName.trim() || !apiKey.trim() || !apiBase.trim()) return;
    
    const newEntry = { aiName, apiKey, apiBase };
    const updatedList = [...savedApis, newEntry];
    
    setSavedApis(updatedList);
    saveToLocalStorage(updatedList);
    
    // 清空输入框
    setAiName('');
    setApiKey('');
    setApiBase('');
  };

  // 修改：删除API时清理选中状态
  const handleDelete = (index: number) => {
    const updatedList = savedApis.filter((_, i) => i !== index);
    setSavedApis(updatedList);
    saveToLocalStorage(updatedList);

    // 如果删除的是选中项，清理choosed_api
    if (selectedApiIndex === index) {
      localStorage.removeItem('choosed_api');
      setSelectedApiIndex(null);
      chatService.setApiKey('');
    }
  };

  return (
    <>
      {/* 新增：设置图标触发按钮 */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-gray-200"
        aria-label="API设置"
      >
        ⚙️{/* 示例图标 */}
      </button>

      {/* 新增：模态框结构 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto relative">
            {/* 新增：关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              aria-label="关闭"
            >
              ✕
            </button>
            
            {/* 原有内容包裹进模态框 */}
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">API管理</h2>
              
              {/* API输入表单 */}
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="AI名称"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="password"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="url"
                  placeholder="API Base URL"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleAdd}
                  disabled={!aiName.trim() || !apiKey.trim() || !apiBase.trim()}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  添加API
                </button>
              </div>

              {/* 已保存的API列表 */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">已保存的API：</h3>
                {savedApis.length === 0 ? (
                  <p className="text-gray-500 italic">暂无保存的API配置</p>
                ) : (
                  <ul className="space-y-3">
                    {savedApis.map((entry, index) => (
                      <li
                        key={`${entry.aiName}-${index}`}
                        // 新增：选中样式及点击事件
                        onClick={() => handleSelect(index)}
                        className={`border p-3 rounded relative cursor-pointer ${
                          selectedApiIndex === index ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                        } transition-colors duration-150`}
                      >
                        <div className="font-medium">{entry.aiName}</div>
                        <div className="text-sm text-gray-600 truncate">{entry.apiKey}</div>
                        <div className="text-sm text-gray-600">{entry.apiBase}</div>
                        
                        <button
                          // 修改：阻止事件冒泡
                          onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}