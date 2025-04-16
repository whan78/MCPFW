# MCP框架快速开始

## 安装

```bash
# 安装依赖
npm install
```

## 基本使用

### 初始化MCP实例

```javascript
// 导入MCP框架
const MCP = require('./src/index');

// 初始化MCP实例
const mcp = new MCP({
  debug: true, // 启用调试模式
  cacheEnabled: true // 启用缓存
});
```

### 使用上下文管理器

```javascript
// 创建上下文
const context = mcp.createContext({
  metadata: {
    source: 'quick-start'
  },
  user: {
    id: 'user-123',
    profile: {
      name: '张三'
    }
  },
  business: {
    domain: 'customer-service',
    entities: {
      query: '产品价格查询'
    }
  }
});

// 更新上下文
const updatedContext = mcp.updateContext(context, {
  business: {
    entities: {
      productId: 'P12345'
    }
  }
});

// 添加历史记录
const contextWithHistory = mcp.addHistory(context, {
  role: 'user',
  content: '我想了解产品价格'
});
```

### 使用实体映射器

```javascript
// 注册实体映射
mcp.entityMapper.registerMapping('product-query', {
  fields: {
    intent: {
      type: 'conditional',
      conditions: [
        { when: 'input.includes("价格")', then: 'pricing_inquiry' },
        { when: 'input.includes("功能")', then: 'feature_inquiry' }
      ],
      default: 'general_inquiry'
    },
    productId: {
      type: 'transform',
      source: 'input',
      transform: (input) => {
        // 从输入中提取产品ID的逻辑
        const match = input.match(/P\d+/);
        return match ? match[0] : null;
      }
    }
  }
});

// 执行实体映射
const userInput = '我想了解P12345的价格';
const mappedEntity = mcp.entityMapper.map({ input: userInput }, 'product-query');
console.log('映射结果：', mappedEntity);
// 输出: { intent: 'pricing_inquiry', productId: 'P12345' }
```

### 使用Prompt管理器

```javascript
// 注册Prompt模板
mcp.promptManager.registerTemplate('product-inquiry', {
  sections: [
    {
      name: 'system',
      content: '你是一个产品顾问，负责回答关于产品的问题。'
    },
    {
      name: 'context',
      content: '用户查询的产品ID: {{productId}}\n用户意图: {{intent}}'
    },
    {
      name: 'user',
      content: '{{query}}'
    }
  ]
});

// 渲染Prompt
const prompt = mcp.promptManager.render('product-inquiry', {
  productId: 'P12345',
  intent: 'pricing_inquiry',
  query: '我想了解这个产品的价格'
});

console.log('渲染后的Prompt：', prompt);
```

### 使用适配器

```javascript
// 注册HTTP适配器
mcp.registerAdapter('product-api', new HttpAdapter({
  baseUrl: 'https://api.example.com/products',
  headers: {
    'Content-Type': 'application/json'
  }
}));

// 使用适配器
const productApi = mcp.getAdapter('product-api');
const productData = await productApi.execute('getProduct', {
  productId: 'P12345'
});

console.log('产品数据：', productData);
```

### 使用LLM集成

```javascript
// 注册LLM提供商
mcp.llmIntegration.registerProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  models: {
    default: 'gpt-4'
  },
  call: async function(prompt, options) {
    // 调用OpenAI API的实现
    // ...
    return response;
  }
});

// 调用LLM
const llmResponse = await mcp.llmIntegration.call(
  prompt,
  {
    temperature: 0.7,
    maxTokens: 500
  }
);

console.log('LLM响应：', llmResponse.text);
```

### 使用Agent集成

```javascript
// 注册Agent
mcp.agentIntegration.registerAgent('langchain', {
  // Agent配置
  tools: [
    // Agent可用工具列表
  ],
  run: async function(context, options) {
    // 运行Agent的实现
    // ...
    return response;
  }
});

// 运行Agent
const agentResponse = await mcp.agentIntegration.run(context, {
  maxSteps: 5,
  timeout: 10000
});

console.log('Agent响应：', agentResponse.result);
```

## 完整示例

以下是一个完整的示例，展示了如何使用MCP框架构建一个简单的产品查询应用：

```javascript
const MCP = require('./src/index');
const HttpAdapter = require('./src/adapters/types/http-adapter');

// 初始化MCP实例
const mcp = new MCP({
  debug: true
});

// 注册适配器
mcp.registerAdapter('product-api', new HttpAdapter({
  baseUrl: 'https://api.example.com/products'
}));

// 注册实体映射
mcp.entityMapper.registerMapping('product-query', {
  fields: {
    intent: {
      type: 'conditional',
      conditions: [
        { when: 'query.includes("价格")', then: 'pricing_inquiry' },
        { when: 'query.includes("功能")', then: 'feature_inquiry' }
      ],
      default: 'general_inquiry'
    },
    productId: {
      type: 'transform',
      source: 'query',
      transform: (query) => {
        const match = query.match(/P\d+/);
        return match ? match[0] : null;
      }
    }
  }
});

// 注册Prompt模板
mcp.promptManager.registerTemplate('product-assistant', {
  sections: [
    {
      name: 'system',
      content: '你是一个产品顾问，负责回答关于产品的问题。'
    },
    {
      name: 'context',
      content: '产品信息：\n{{productInfo}}\n\n用户意图：{{intent}}'
    },
    {
      name: 'user',
      content: '{{query}}'
    }
  ]
});

// 注册LLM提供商
mcp.llmIntegration.registerProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  call: async function(prompt, options) {
    // 调用OpenAI API的实现
    // ...
    return {
      text: '这是模拟的LLM响应',
      tokens: { prompt: 100, completion: 50 }
    };
  }
});

// 主函数
async function handleProductQuery(query) {
  try {
    // 创建上下文
    const context = mcp.createContext({
      metadata: { source: 'product-demo' },
      business: { domain: 'product-service', entities: { query } }
    });
    
    // 映射实体
    const mappedEntity = mcp.entityMapper.map({ query }, 'product-query');
    
    // 获取产品信息
    const productApi = mcp.getAdapter('product-api');
    let productInfo = '未找到产品信息';
    
    if (mappedEntity.productId) {
      try {
        const productData = await productApi.execute('getProduct', {
          productId: mappedEntity.productId
        });
        productInfo = JSON.stringify(productData, null, 2);
      } catch (error) {
        console.error('获取产品信息失败：', error.message);
      }
    }
    
    // 渲染Prompt
    const prompt = mcp.promptManager.render('product-assistant', {
      productInfo,
      intent: mappedEntity.intent,
      query
    });
    
    // 调用LLM
    const response = await mcp.llmIntegration.call(prompt, {
      temperature: 0.7,
      maxTokens: 500
    });
    
    // 更新上下文并添加历史记录
    const updatedContext = mcp.addHistory(context, {
      role: 'user',
      content: query
    });
    
    mcp.addHistory(updatedContext, {
      role: 'assistant',
      content: response.text
    });
    
    return response.text;
  } catch (error) {
    console.error('处理查询失败：', error);
    return '抱歉，处理您的请求时出现了错误。';
  }
}

// 使用示例
handleProductQuery('我想了解P12345的价格').then(response => {
  console.log('回复：', response);
});
```

## 下一步

- 查看[架构概览](./architecture-overview.md)了解MCP框架的整体设计
- 深入了解[核心概念](./core-concepts/)中的各个组件
- 学习如何[开发自定义适配器](./adapters/)
- 探索[AI集成指南](./integration/)，了解如何集成不同的AI模型和框架