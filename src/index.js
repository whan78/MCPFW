/**
 * MCP 框架主入口文件
 * 集成所有核心模块，提供统一的API接口
 */

const ContextManager = require('./core/context-manager');
const EntityMapper = require('./core/entity-mapper');
const PromptManager = require('./core/prompt-manager');
const AdapterRegistry = require('./adapters/adapter-registry');
const LLMIntegration = require('./integration/llm-integration');
const AgentIntegration = require('./integration/agent-integration');

class MCP {
  constructor(config = {}) {
    this.config = {
      debug: false,
      cacheEnabled: true,
      ...config
    };
    
    // 初始化核心组件
    this.contextManager = new ContextManager(this.config);
    this.entityMapper = new EntityMapper(this.config);
    this.promptManager = new PromptManager(this.config);
    this.adapterRegistry = new AdapterRegistry(this.config);
    this.llmIntegration = new LLMIntegration(this.config);
    this.agentIntegration = new AgentIntegration(this.config);
  }

  /**
   * 创建标准化上下文
   * @param {Object} contextData - 上下文初始数据
   * @returns {Object} - 标准化的上下文对象
   */
  createContext(contextData) {
    return this.contextManager.create(contextData);
  }

  /**
   * 注册系统适配器
   * @param {string} name - 适配器名称
   * @param {Object} adapter - 适配器实例或配置
   */
  registerAdapter(name, adapter) {
    this.adapterRegistry.register(name, adapter);
  }

  /**
   * 获取已注册的适配器
   * @param {string} name - 适配器名称
   * @returns {Object} - 适配器实例
   */
  getAdapter(name) {
    return this.adapterRegistry.get(name);
  }

  /**
   * 创建并管理Prompt
   * @param {string} templateName - 模板名称
   * @param {Object} variables - 变量数据
   * @returns {string} - 渲染后的Prompt
   */
  createPrompt(templateName, variables) {
    return this.promptManager.render(templateName, variables);
  }

  /**
   * 执行实体映射
   * @param {Object} data - 源数据
   * @param {string} mappingName - 映射配置名称
   * @returns {Object} - 映射后的实体数据
   */
  mapEntity(data, mappingName) {
    return this.entityMapper.map(data, mappingName);
  }

  /**
   * 调用LLM模型
   * @param {string} prompt - 处理后的Prompt
   * @param {Object} options - 调用选项
   * @returns {Promise<Object>} - 模型响应
   */
  async callLLM(prompt, options = {}) {
    return this.llmIntegration.call(prompt, options);
  }

  /**
   * 调用Agent系统
   * @param {Object} context - 上下文对象
   * @param {Object} options - 调用选项
   * @returns {Promise<Object>} - Agent响应
   */
  async runAgent(context, options = {}) {
    return this.agentIntegration.run(context, options);
  }
}

module.exports = MCP;