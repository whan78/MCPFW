/**
 * MCP框架高级示例 - 智能对话系统
 * 展示如何使用MCP框架构建一个支持多轮对话的智能助手
 */

// 导入MCP框架
const MCP = require('../src/index');
const HttpAdapter = require('../src/adapters/types/http-adapter');

// 初始化MCP实例
const mcp = new MCP({
  debug: true,
  cacheEnabled: true
});

// 1. 注册适配器
console.log('1. 注册系统适配器');

// 注册知识库适配器（模拟）
mcp.registerAdapter('knowledge-base', {
  initialize: async function() {
    console.log('知识库适配器初始化');
    this.initialized = true;
    return true;
  },
  execute: async function(action, params) {
    if (action === 'query') {
      // 模拟知识库查询
      console.log(`查询知识库: ${params.query}`);
      if (params.query.includes('产品')) {
        return {
          results: [
            { title: '产品介绍', content: 'MCP框架是一个用于AI应用开发的开源框架，提供上下文管理、实体映射、Prompt管理等功能。' },
            { title: '核心功能', content: 'MCP框架的核心功能包括上下文标准化、实体映射、Prompt框架、适配器系统和AI模型集成。' }
          ]
        };
      } else if (params.query.includes('价格')) {
        return {
          results: [
            { title: '价格方案', content: 'MCP框架是开源免费的，遵循MIT许可证。' }
          ]
        };
      } else {
        return { results: [] };
      }
    }
    return { error: '不支持的操作' };
  }
});

// 2. 注册实体映射
console.log('\n2. 注册实体映射');

// 用户意图映射
mcp.entityMapper.registerMapping('user-intent', {
  fields: {
    intent: {
      type: 'conditional',
      conditions: [
        { when: 'input.includes("产品")', then: 'product_inquiry' },
        { when: 'input.includes("价格")', then: 'pricing_inquiry' },
        { when: 'input.includes("谢谢")', then: 'gratitude' },
        { when: 'input.includes("再见")', then: 'farewell' }
      ],
      default: 'general_inquiry'
    },
    entities: {
      type: 'transform',
      source: 'input',
      transform: (input) => {
        const entities = {};
        if (input.includes('产品')) entities.product = true;
        if (input.includes('价格')) entities.pricing = true;
        return entities;
      }
    }
  }
});

// 3. 注册Prompt模板
console.log('\n3. 注册Prompt模板');

// 对话系统Prompt模板
mcp.promptManager.registerTemplate('chatbot', {
  sections: [
    {
      name: 'system',
      content: '你是MCP框架的智能助手，可以回答关于MCP框架的问题。请根据用户的意图和提供的知识库信息，生成简洁、准确的回答。'
    },
    {
      name: 'context',
      content: '用户意图: {{intent}}\n\n知识库信息: {{knowledge}}'
    },
    {
      name: 'history',
      content: '{{#each chatHistory}}\n{{role}}: {{content}}\n{{/each}}'
    },
    {
      name: 'user',
      content: '{{userInput}}'
    }
  ]
});

// 4. 创建上下文
console.log('\n4. 创建对话上下文');
const chatContext = mcp.createContext({
  metadata: {
    source: 'advanced-chatbot'
  },
  user: {
    id: 'user-456',
    profile: {
      name: '李四'
    }
  },
  session: {
    id: 'session-123',
    history: []
  },
  business: {
    domain: 'customer-service',
    entities: {}
  }
});

// 5. 模拟对话系统
console.log('\n5. 模拟对话系统');

// 注册模拟LLM提供商
mcp.llmIntegration.registerProvider('chatbot-llm', {
  call: async (prompt, options) => {
    console.log('调用LLM，使用Prompt：\n', prompt);
    
    // 根据意图生成不同的回复
    let response;
    if (prompt.includes('product_inquiry')) {
      response = `MCP框架是一个用于AI应用开发的开源框架，提供上下文管理、实体映射、Prompt管理等功能。它的核心功能包括上下文标准化、实体映射、Prompt框架、适配器系统和AI模型集成。`;
    } else if (prompt.includes('pricing_inquiry')) {
      response = `MCP框架是完全开源免费的，遵循MIT许可证。您可以免费使用它来构建您的AI应用。`;
    } else if (prompt.includes('gratitude')) {
      response = `不客气！如果您有任何其他问题，随时可以询问。`;
    } else if (prompt.includes('farewell')) {
      response = `再见！祝您使用愉快，期待下次与您交流。`;
    } else {
      response = `您好！我是MCP框架的智能助手，可以回答关于MCP框架的问题。请问有什么可以帮助您的？`;
    }
    
    return {
      response,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: response.length / 4,
        totalTokens: (prompt.length + response.length) / 4
      }
    };
  }
});

// 设置为默认提供商
mcp.llmIntegration.setDefaultProvider('chatbot-llm');

// 处理用户输入函数
async function processUserInput(userInput) {
  console.log(`\n用户: ${userInput}`);
  
  // 1. 分析用户意图
  const intentData = mcp.entityMapper.map({ input: userInput }, 'user-intent');
  console.log('识别的意图:', intentData.intent);
  
  // 2. 查询知识库
  const knowledgeAdapter = mcp.adapterRegistry.get('knowledge-base');
  const knowledgeResults = await knowledgeAdapter.execute('query', { query: userInput });
  
  // 提取知识库内容
  let knowledgeText = '';
  if (knowledgeResults.results && knowledgeResults.results.length > 0) {
    knowledgeText = knowledgeResults.results.map(item => item.content).join('\n');
  }
  
  // 3. 准备Prompt变量
  const promptVariables = {
    intent: intentData.intent,
    knowledge: knowledgeText,
    userInput: userInput,
    chatHistory: chatContext.session.history
  };
  
  // 4. 渲染Prompt
  const prompt = mcp.promptManager.render('chatbot', promptVariables);
  
  // 5. 调用LLM
  const result = await mcp.llmIntegration.call(prompt, {
    temperature: 0.7,
    maxTokens: 300
  });
  
  console.log(`助手: ${result.response}`);
  
  // 6. 更新上下文历史
  chatContext.session.history.push({ role: 'user', content: userInput });
  chatContext.session.history.push({ role: 'assistant', content: result.response });
  
  return result.response;
}

// 模拟多轮对话
async function simulateConversation() {
  const conversations = [
    '你好，请介绍一下MCP框架的产品特点',
    '这个框架的价格是多少？',
    '谢谢你的解答',
    '再见'
  ];
  
  for (const message of conversations) {
    await processUserInput(message);
    // 模拟对话间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n对话历史:');
  console.log(JSON.stringify(chatContext.session.history, null, 2));
  console.log('\n高级对话系统示例完成！');
}

// 执行模拟对话
simulateConversation();