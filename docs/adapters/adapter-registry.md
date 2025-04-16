# 适配器注册表 (AdapterRegistry)

## 概述

适配器注册表是MCP框架的核心组件之一，负责管理系统适配器。它提供了统一的接口来注册、获取和管理各种类型的适配器，使框架能够与外部系统和服务进行无缝集成。

## 主要功能

### 注册适配器

```javascript
// 注册HTTP适配器
mcp.registerAdapter('weather-api', new HttpAdapter({
  baseUrl: 'https://api.weatherapi.com/v1',
  headers: {
    'Content-Type': 'application/json'
  }
}));

// 注册自定义适配器
mcp.registerAdapter('knowledge-base', {
  initialize: async function() {
    console.log('知识库适配器初始化');
    this.initialized = true;
    return true;
  },
  execute: async function(action, params) {
    if (action === 'query') {
      // 查询知识库的实现
      return { results: [...] };
    }
    return { error: '不支持的操作' };
  }
});
```

注册适配器时，系统会：
- 验证适配器名称的有效性
- 验证适配器实例或配置
- 如果提供的是配置而非实例，尝试初始化适配器
- 验证适配器接口
- 存储适配器以供后续使用

### 获取适配器

```javascript
// 获取已注册的适配器
const weatherApi = mcp.getAdapter('weather-api');

// 使用适配器执行操作
const weatherData = await weatherApi.execute('getCurrentWeather', {
  location: '北京'
});
```

### 检查适配器是否已注册

```javascript
if (mcp.hasAdapter('weather-api')) {
  // 使用weather-api适配器
} else {
  // 注册或使用替代方案
}
```

### 移除适配器

```javascript
// 移除不再需要的适配器
mcp.unregisterAdapter('legacy-system');
```

### 获取所有适配器名称

```javascript
// 获取所有已注册的适配器名称
const adapterNames = mcp.getAdapterNames();
console.log('已注册的适配器：', adapterNames);
```

## 适配器类型

### 内置适配器

MCP框架提供了以下内置适配器类型：

1. **HTTP适配器**
   - 用于与RESTful API进行交互
   - 支持各种HTTP方法、请求头和认证方式

2. **数据库适配器**
   - 用于与各种数据库系统进行交互
   - 支持SQL和NoSQL数据库

3. **文件系统适配器**
   - 用于读写文件和目录
   - 支持本地和云存储

4. **消息队列适配器**
   - 用于与消息队列系统进行交互
   - 支持发布/订阅模式

### 自定义适配器

开发者可以创建自定义适配器来集成特定的系统或服务。自定义适配器需要实现以下接口：

```javascript
{
  // 初始化适配器（可选）
  initialize: async function() {
    // 初始化逻辑
    return true; // 返回初始化是否成功
  },
  
  // 执行操作（必需）
  execute: async function(action, params) {
    // 根据action和params执行相应的操作
    return result; // 返回操作结果
  },
  
  // 关闭适配器（可选）
  close: async function() {
    // 清理资源
    return true; // 返回关闭是否成功
  }
}
```

## 适配器配置

适配器可以通过配置对象进行初始化和自定义：

```javascript
const httpAdapter = new HttpAdapter({
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  timeout: 5000,
  retries: 3,
  cacheEnabled: true
});
```

## 高级特性

### 适配器链

支持将多个适配器链接在一起，形成处理管道：

```javascript
mcp.createAdapterChain('data-pipeline', [
  'data-source',
  'data-transformer',
  'data-sink'
]);
```

### 适配器池

支持创建适配器池，用于管理连接和负载均衡：

```javascript
mcp.createAdapterPool('db-pool', 'database', {
  minSize: 5,
  maxSize: 20,
  idleTimeout: 30000
});
```

### 适配器事件

支持监听适配器事件：

```javascript
mcp.on('adapter:registered', (name, adapter) => {
  console.log(`适配器已注册: ${name}`);
});

mcp.on('adapter:beforeExecute', (name, action, params) => {
  console.log(`适配器执行前: ${name}.${action}`);
});
```

## 配置选项

适配器注册表支持以下配置选项：

- `autoInitialize`: 是否在注册时自动初始化适配器
- `validateInterfaces`: 是否严格验证适配器接口
- `errorHandling`: 错误处理策略
- `debug`: 是否启用调试模式

## 最佳实践

1. **命名规范**
   - 使用清晰、一致的适配器命名规则
   - 考虑使用命名空间来组织适配器（如`db:mysql`、`api:weather`）

2. **错误处理**
   - 实现适当的错误处理和重试机制
   - 记录适配器操作的详细日志

3. **资源管理**
   - 正确初始化和关闭适配器，避免资源泄漏
   - 考虑使用适配器池来管理连接密集型适配器

4. **安全考量**
   - 避免在适配器配置中硬编码敏感信息
   - 使用适当的认证和授权机制