# MCP框架示例项目

本目录包含MCP框架的示例项目，展示框架的核心功能和使用方法。

## 示例列表

- `sample-project.js` - 基础样本项目，展示MCP框架的核心功能，包括：
  - 上下文管理 (Context Management)
  - 实体映射 (Entity Mapping)
  - Prompt模板管理 (Prompt Template Management)
  - 适配器注册与使用 (Adapter Registration)
  - LLM集成调用 (LLM Integration)

- `advanced-chatbot.js` - 高级对话系统示例，展示如何构建一个支持多轮对话的智能助手，包括：
  - 多轮对话管理
  - 用户意图识别
  - 知识库集成
  - 上下文保持与历史记录管理

- `custom-adapter.js` - 自定义适配器示例，展示如何扩展MCP框架的适配器系统：
  - 创建自定义数据库适配器
  - 实现标准适配器接口
  - 与实体映射系统集成
  - 数据查询与操作

## 运行示例

```bash
# 运行所有示例
npm run example

# 运行基础样本项目
node examples/sample-project.js

# 运行高级对话系统示例
node examples/advanced-chatbot.js

# 运行自定义适配器示例
node examples/custom-adapter.js
```

## 示例项目说明

### 基础样本项目 (sample-project.js)

这个示例展示了MCP框架的基本使用流程：

1. 初始化MCP框架实例
2. 注册HTTP适配器（用于与外部API交互）
3. 注册实体映射配置（用于标准化数据结构）
4. 注册Prompt模板（用于生成标准化的提示词）
5. 创建上下文对象（管理用户会话和业务数据）
6. 处理API响应数据（使用实体映射）
7. 渲染Prompt模板（生成提示词）
8. 调用LLM模型（获取AI响应）
9. 更新上下文（记录交互历史）

### 高级对话系统示例 (advanced-chatbot.js)

这个示例展示了如何使用MCP框架构建一个智能对话系统：

1. 创建知识库适配器（模拟知识库查询）
2. 实现用户意图识别（通过实体映射）
3. 设计对话系统Prompt模板（包含系统指令、上下文、历史记录和用户输入）
4. 管理多轮对话上下文（保持对话历史）
5. 根据用户意图和知识库信息生成回复
6. 模拟完整的对话流程

### 自定义适配器示例 (custom-adapter.js)

这个示例展示了如何扩展MCP框架的适配器系统：

1. 创建自定义数据库适配器类（继承BaseAdapter）
2. 实现标准适配器接口（initialize、execute、close等方法）
3. 提供数据操作功能（查询、插入、更新、删除）
4. 注册自定义适配器到MCP框架
5. 创建实体映射配置（处理数据库结果）
6. 演示完整的数据操作流程

通过这些示例，您可以了解MCP框架的核心功能和工作流程，为进一步开发复杂应用打下基础。