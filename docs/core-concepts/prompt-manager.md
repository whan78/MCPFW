# Prompt管理器 (PromptManager)

## 概述

Prompt管理器是MCP框架的核心组件之一，负责管理和渲染Prompt模板。它提供了灵活的模板结构和变量注入机制，使开发者能够创建、管理和复用各种Prompt模板，从而提高AI模型调用的一致性和效率。

## 主要功能

### 注册Prompt模板

```javascript
promptManager.registerTemplate('weather-report', {
  sections: [
    {
      name: 'system',
      content: '你是一个专业的天气助手，根据提供的天气数据生成友好的天气报告。'
    },
    {
      name: 'user',
      content: '请根据以下天气数据，生成一份简短的天气报告：\n\n地点：{{location}}，{{country}}\n温度：{{temperature}}\n天气状况：{{condition}}\n湿度：{{humidity}}\n风速：{{windSpeed}}'
    }
  ]
});
```

注册模板时，系统会：
- 验证模板名称的有效性
- 验证模板结构（必须包含content或sections字段）
- 存储模板以供后续使用

### 设置默认变量

```javascript
promptManager.setDefaultVariables({
  language: 'zh-CN',
  modelVersion: 'gpt-4',
  systemName: 'AI助手'
});
```

设置默认变量后，这些变量将在所有模板渲染中可用，除非被特定的渲染变量覆盖。

### 渲染Prompt模板

```javascript
const prompt = promptManager.render('weather-report', {
  location: '北京',
  country: '中国',
  temperature: '25°C',
  condition: '晴天',
  humidity: '40%',
  windSpeed: '5 km/h'
});
```

渲染模板时，系统会：
- 获取指定的模板
- 合并默认变量和用户提供的变量
- 根据模板类型进行渲染（简单模板或分段模板）
- 返回渲染后的Prompt字符串

## 模板类型

### 简单模板

简单模板直接包含一个content字段，内容会被一次性渲染：

```javascript
promptManager.registerTemplate('simple-greeting', {
  content: '你好，{{name}}！欢迎使用{{serviceName}}。'
});
```

### 分段模板

分段模板包含多个命名段落，每个段落可以单独渲染和组合：

```javascript
promptManager.registerTemplate('complex-task', {
  sections: [
    {
      name: 'system',
      content: '你是一个{{role}}，专长于{{expertise}}。'
    },
    {
      name: 'context',
      content: '背景信息：{{context}}'
    },
    {
      name: 'task',
      content: '请完成以下任务：{{task}}'
    },
    {
      name: 'format',
      content: '请按照以下格式回答：{{format}}'
    }
  ]
});
```

## 变量注入

### 基本变量

使用双大括号语法注入变量：

```
你好，{{name}}！
```

### 嵌套属性

支持访问对象的嵌套属性：

```
用户ID：{{user.id}}，用户名：{{user.profile.name}}
```

### 条件渲染

支持基于条件的内容渲染：

```
{{#if premium}}
感谢您使用高级版！
{{else}}
考虑升级到高级版获取更多功能。
{{/if}}
```

### 循环渲染

支持对数组数据进行循环渲染：

```
{{#each items}}
- {{name}}: {{description}}
{{/each}}
```

## 高级特性

### 模板继承

支持模板继承，允许创建基于现有模板的新模板：

```javascript
promptManager.extendTemplate('weather-report-detailed', 'weather-report', {
  sections: [
    {
      name: 'additional',
      content: '请同时提供未来24小时的天气预报。'
    }
  ]
});
```

### 模板版本管理

支持对同一模板维护多个版本：

```javascript
promptManager.registerTemplateVersion('chatbot', 'gpt-3.5', {
  // GPT-3.5专用模板配置
});

promptManager.registerTemplateVersion('chatbot', 'gpt-4', {
  // GPT-4专用模板配置
});
```

### 模板组合

支持将多个模板组合成一个新模板：

```javascript
promptManager.combineTemplates('full-assistant', [
  'system-instructions',
  'user-preferences',
  'task-description'
]);
```

## 配置选项

Prompt管理器支持以下配置选项：

- `variablePattern`: 变量匹配模式（默认为`{{variable}}`）
- `missingVariableHandler`: 处理缺失变量的函数
- `escapeHtml`: 是否转义HTML字符
- `debug`: 是否启用调试模式

## 最佳实践

1. **模块化设计Prompt**
   - 将Prompt拆分为可重用的组件
   - 使用分段模板组织复杂的Prompt结构

2. **维护模板版本**
   - 为不同的模型维护专用的模板版本
   - 记录模板的变更历史和效果

3. **优化变量使用**
   - 提供清晰的变量名和注释
   - 设置合理的默认值和错误处理

4. **测试和迭代**
   - 定期测试模板的效果
   - 根据模型响应调整和优化模板