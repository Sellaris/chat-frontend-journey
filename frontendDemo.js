// 前端调用示例
async function queryAI(question) {
    try {
      const response = await fetch('http://YOUR_HTTP/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question
        })
      });
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
  
      while(true) {
        const { done, value } = await reader.read();
        if(done) break;
        
        // 处理流式数据块
        const chunk = decoder.decode(value);
        result += chunk;
        
        // 实时更新到页面
        document.getElementById('response-container').innerHTML = result.replace(/\n/g, '<br>');
      }
      
    } catch (error) {
      console.error('请求失败:', error);
    }
  }
  
  // 调用示例
  queryAI("查询c_nationkey列为3的人");