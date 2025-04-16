MCP 框架一体化文档

项目简介
MCP（Model-Context-Prompt）是一个开源框架，旨在降低AI能力落地的门槛，帮助开发者快速将AI模型集成到现有系统中。框架提供标准化的上下文处理、实体映射、Prompt管理和系统适配器，使AI能力接入更简单高效。

核心理念
- 标准化：统一接口和数据结构，降低集成复杂度。
- 模块化：组件松耦合，可独立或组合使用。
- 可扩展性：支持自定义适配器、映射规则和模型集成。
- 易用性：提供直观API和详细文档，降低学习曲线。

目录结构
- docs/  文档目录，包含架构、核心概念、适配器、集成等说明
- src/   核心源码，分模块组织
- examples/ 示例代码和用例

架构概览
核心组件
- 上下文管理器 (ContextManager)：创建和管理标准化上下文对象，包含元数据、用户、会话、业务、环境等结构，便于AI模型获取完整上下文。
- 实体映射器 (EntityMapper)：将源数据映射为统一实体结构，支持字段映射、转换函数、后处理和缓存机制。
- Prompt管理器 (PromptManager)：管理和渲染Prompt模板，支持变量注入、模板分段和组合。
- 适配器注册表 (AdapterRegistry)：统一管理系统适配器，支持注册、获取、移除和接口验证。

集成模块
- LLM集成模块 (LLMIntegration)：统一注册和调用多种大语言模型（如OpenAI、LLaMA等），屏蔽底层差异。
- Agent集成模块 (AgentIntegration)：统一注册和运行多种Agent框架（如LangChain等），支持复杂任务处理。

数据流与扩展
- 输入处理：外部请求 → 适配器 → 上下文创建 → 实体映射 → 业务处理。
- AI调用：业务处理 → Prompt渲染 → LLM/Agent调用 → 响应处理 → 结果返回。
- 上下文更新：响应 → 上下文更新 → 历史记录 → 状态保存。
- 扩展支持：适配器、映射规则、模型集成等多层扩展。

快速开始
安装
```bash
npm install
npm run example
```

基本用法示例
```javascript
const MCP = require('./src/index');
const mcp = new MCP({ debug: true, cacheEnabled: true });

// 创建上下文
const context = mcp.createContext({
  metadata: { source: 'quick-start' },
  user: { id: 'user-123', profile: { name: '张三' } },
  business: { domain: 'customer-service', entities: { query: '产品价格查询' } }
});

// 更新上下文
const updatedContext = mcp.updateContext(context, {
  business: { entities: { productId: 'P12345' } }
});

// 添加历史记录
const contextWithHistory = mcp.addHistory(context, {
  role: 'user',
  content: '我想了解产品价格'
});
```

核心模块说明
### 上下文管理器
- 管理标准化的上下文结构，包括元数据、用户、会话、业务和环境。
- 支持上下文创建、更新和历史记录管理。

### 实体映射器
- 负责将原始数据（如API响应、数据库记录）转换为统一的实体结构。
- 支持字段映射、数据转换、后处理和缓存。
- 典型用法：
```javascript
const { v4: uuidv4 } = require('uuid');
class EntityMapper {
  constructor(options = {}) {
    this.mappings = new Map();
    this.cache = options.cacheEnabled ? new Map() : null;
    this.debug = options.debug || false;
  }
  registerMapping(entityType, mappingConfig) {
    const mappingId = uuidv4();
    this.mappings.set(entityType, {
      id: mappingId,
      rules: mappingConfig.rules || [],
      postProcessors: mappingConfig.postProcessors || []
    });
    if (this.debug) {
      console.log(`已为 ${entityType} 注册映射，ID: ${mappingId}`);
    }
    return mappingId;
  }
  map(entityType, inputData) {
    const cacheKey = this.cache ? `${entityType}:${JSON.stringify(inputData)}` : null;
    if (this.cache && this.cache.has(cacheKey)) {
      if (this.debug) console.log(`缓存命中: ${cacheKey}`);
      return this.cache.get(cacheKey);
    }
    const mapping = this.mappings.get(entityType);
    if (!mapping) {
      throw new Error(`未找到实体类型 ${entityType} 的映射配置`);
    }
    let output = {};
    for (const rule of mapping.rules) {
      try {
        const value = this._getFieldValue(inputData, rule.source);
        output[rule.target] = rule.transform
          ? rule.transform(value)
          : value ?? rule.default;
      } catch (error) {
        if (this.debug) {
          console.error(`映射字段 ${rule.source} 出错: ${error.message}`);
        }
        output[rule.target] = rule.default ?? null;
      }
    }
    for (const processor of mapping.postProcessors) {
      output = processor(output);
    }
    if (this.cache && cacheKey) {
      this.cache.set(cacheKey, output);
    }
    return output;
  }
  _getFieldValue(data, path) {
    return path.split('.').reduce((obj, key) => {
      return obj && typeof obj === 'object' ? obj[key] : undefined;
    }, data);
  }
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }
}
// 示例用法
const mapper = new EntityMapper({ cacheEnabled: true, debug: true });
mapper.registerMapping('customer', {
  rules: [
    { source: 'user.id', target: 'customerId', default: null },
    { source: 'user.profile.name', target: 'fullName', transform: (value) => value?.toUpperCase() || 'UNKNOWN' },
    { source: 'user.email', target: 'email', transform: (value) => value?.toLowerCase(), default: 'no-email@domain.com' }
  ],
  postProcessors: [
    (entity) => {
      entity.isValid = entity.customerId && entity.email !== 'no-email@domain.com';
      return entity;
    }
  ]
});
const rawData = {
  user: { id: '12345', profile: { name: '张三' }, email: 'ZHANGSAN@EXAMPLE.COM' }
};
const mappedCustomer = mapper.map('customer', rawData);
console.log('映射后的客户实体:', mappedCustomer);
```

### Prompt管理器
- 注册和渲染Prompt模板，支持变量注入和分段模板。
- 支持默认变量设置和模板复用。

### 适配器开发
- 通过registerAdapter注册HTTP或自定义适配器。
- 支持适配器获取、检查、移除和枚举。
- 适配器需实现标准接口（如execute方法）。

AI集成指南
#### LLM集成
- 通过llmIntegration.registerProvider注册OpenAI等LLM。
- 统一接口，支持自定义参数和响应处理。

#### Agent集成
- 通过agentIntegration.registerAgent注册LangChain等Agent。
- 支持设置默认Agent和运行指定Agent。

最佳实践
- 按需引入模块，保持松耦合。
- 利用标准接口扩展适配器和模型。
- 启用调试模式和日志，便于排查问题。
- 合理设计Prompt模板和实体映射规则，确保高效和可维护。
- 推荐在`src/`下按功能拆分模块，文档和示例分别放在`docs/`和`examples/`目录。
- 配置建议：
```json
{
  "debug": true,
  "cacheEnabled": true
}
```
- 代码风格建议：遵循ESLint/Prettier规范，统一代码风格。

贡献指南
欢迎参与MCP框架的开发和完善：
- Fork项目并提交PR。
- 遵循代码规范和文档格式。
- 参与问题讨论和反馈。

许可证
MIT