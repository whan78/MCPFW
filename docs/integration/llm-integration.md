# LLM集成模块 (LLMIntegration)

## 概述

LLM集成模块是MCP框架的重要组件之一，负责与各种大语言模型进行交互。它提供了统一的接口来注册、管理和调用不同的LLM提供商，使开发者能够轻松地集成和切换各种大语言模型，而无需修改应用程序的核心逻辑。

## 主要功能

### 注册LLM提供商

```javascript
// 注册OpenAI提供商
mcp.llmIntegration.registerProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  models: {
    default: 'gpt-4',
    alternatives: ['gpt-3.5-turbo']
  },
  call: async function(prompt, options) {
    // 调用OpenAI API的实现
    return response;
  }
});

// 注册自定义LLM提供商
mcp.llmIntegration.registerProvider('custom-llm', {
  call: async function(prompt, options) {
    // 自定义LLM调用逻辑
    return {
      text: '生成的文本',
      tokens: {
        prompt: 100,
        completion: 50
      },
      model: 'custom-model'
    };
  }
});
```

注册提供商时，系统会：
- 验证提供商名称的有效性
- 验证提供商实例或配置
- 验证提供商接口（必须包含call方法）
- 存储提供商以供后续使用
- 如果是第一个注册的提供商，设为默认

### 设置默认提供商

```javascript
// 设置默认LLM提供商
mcp.llmIntegration.setDefaultProvider('openai');
```

### 调用LLM模型

```javascript
// 调用LLM模型
const response = await mcp.llmIntegration.call(
  '请生成一个关于人工智能的短文',
  {
    temperature: 0.7,
    maxTokens: 500,
    provider: 'openai' // 可选，不指定则使用默认提供商
  }
);

console.log('生成的文本：', response.text);
```

调用LLM时，系统会：
- 确定要使用的提供商（指定的或默认的）
- 合并默认选项和用户提供的选项
- 对Prompt进行预处理
- 调用提供商的call方法
- 对响应进行后处理
- 返回处理后的响应

## 提供商接口

LLM提供商需要实现以下接口：

```javascript
{
  // 调用LLM模型（必需）
  call: async function(prompt, options) {
    // 调用LLM的逻辑
    return {
      text: '生成的文本',
      tokens: {
        prompt: 100,
        completion: 50
      },
      model: 'model-name',
      raw: {} // 原始响应数据
    };
  },
  
  // 获取可用模型列表（可选）
  listModels: async function() {
    return ['model-1', 'model-2'];
  },
  
  // 获取模型信息（可选）
  getModelInfo: async function(modelName) {
    return {
      name: modelName,
      capabilities: [...],
      limits: {...}
    };
  }
}
```

## 调用选项

LLM调用支持以下常用选项：

- `temperature`: 生成文本的随机性（0-1）
- `maxTokens`: 生成文本的最大长度
- `topP`: 核采样概率阈值
- `frequencyPenalty`: 频率惩罚系数
- `presencePenalty`: 存在惩罚系数
- `stopSequences`: 停止生成的序列
- `model`: 指定使用的模型
- `provider`: 指定使用的提供商

## 高级特性

### 前处理和后处理

LLM集成模块提供了前处理和后处理机制，用于在调用前后对Prompt和响应进行处理：

```javascript
// 前处理示例
const processedPrompt = llmIntegration._preProcess(prompt, options);

// 后处理示例
const processedResponse = llmIntegration._postProcess(response, options);
```

前处理可以用于：
- 添加系统指令
- 格式化Prompt
- 应用模板
- 添加上下文信息

后处理可以用于：
- 解析结果
- 提取特定字段
- 格式转换
- 错误处理

### 批量处理

支持批量处理多个Prompt：

```javascript
const responses = await llmIntegration.batchCall([
  { prompt: '问题1', options: { temperature: 0.5 } },
  { prompt: '问题2', options: { temperature: 0.7 } }
]);
```

### 流式响应

支持流式响应，用于实时获取生成结果：

```javascript
const stream = await llmIntegration.streamCall(
  '请生成一个故事',
  { temperature: 0.8 }
);

for await (const chunk of stream) {
  console.log('收到片段：', chunk.text);
}
```

## 配置选项

LLM集成模块支持以下配置选项：

- `llmDefaults`: 默认的LLM调用选项
- `cacheEnabled`: 是否启用响应缓存
- `cacheOptions`: 缓存配置选项
- `retryOptions`: 重试配置选项
- `debug`: 是否启用调试模式

## 最佳实践

1. **管理API密钥**
   - 使用环境变量或安全存储管理API密钥
   - 避免在代码中硬编码敏感信息

2. **优化Token使用**
   - 合理设置maxTokens参数
   - 优化Prompt结构，减少不必要的Token消耗

3. **错误处理**
   - 实现适当的错误处理和重试机制
   - 处理常见的API错误，如速率限制和超时

4. **模型选择**
   - 根据任务复杂性选择合适的模型
   - 考虑成本和性能的平衡

5. **缓存策略**
   - 对于相同的Prompt，使用缓存减少API调用
   - 设置合理的缓存过期时间