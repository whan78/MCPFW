/**
 * Agent集成模块
 * 负责与各种Agent框架进行交互
 */

class AgentIntegration {
  constructor(config = {}) {
    this.config = config;
    this.agents = {}; // 存储注册的Agent
    this.defaultAgent = null; // 默认Agent
  }

  /**
   * 注册Agent
   * @param {string} name - Agent名称
   * @param {Object} agent - Agent实例或配置
   */
  registerAgent(name, agent) {
    if (!name || typeof name !== 'string') {
      throw new Error('Agent名称必须是非空字符串');
    }
    
    if (!agent) {
      throw new Error('Agent不能为空');
    }
    
    // 验证Agent接口
    this._validateAgent(agent);
    
    this.agents[name] = agent;
    
    // 如果是第一个注册的Agent，设为默认
    if (!this.defaultAgent) {
      this.defaultAgent = name;
    }
    
    if (this.config.debug) {
      console.log(`已注册Agent: ${name}`);
    }
  }

  /**
   * 设置默认Agent
   * @param {string} name - Agent名称
   */
  setDefaultAgent(name) {
    if (!this.agents[name]) {
      throw new Error(`未找到Agent: ${name}`);
    }
    
    this.defaultAgent = name;
  }

  /**
   * 获取Agent
   * @param {string} name - Agent名称
   * @returns {Object} - Agent实例
   */
  getAgent(name) {
    if (!name) {
      // 如果未指定名称，返回默认Agent
      if (!this.defaultAgent) {
        throw new Error('未设置默认Agent');
      }
      return this.agents[this.defaultAgent];
    }
    
    if (!this.agents[name]) {
      throw new Error(`未找到Agent: ${name}`);
    }
    
    return this.agents[name];
  }

  /**
   * 运行Agent
   * @param {Object} context - 上下文对象
   * @param {Object} options - 运行选项
   * @returns {Promise<Object>} - Agent响应
   */
  async run(context, options = {}) {
    const agentName = options.agent || this.defaultAgent;
    const agent = this.getAgent(agentName);
    
    // 合并默认选项和用户提供的选项
    const runOptions = {
      maxSteps: 10, // 最大执行步骤数
      timeout: 30000, // 超时时间（毫秒）
      ...this.config.agentDefaults,
      ...options
    };
    
    // 移除agent字段，避免传递给实际的Agent
    delete runOptions.agent;
    
    try {
      // 运行前处理
      const processedContext = this._preProcess(context, runOptions);
      
      // 记录请求（如果启用了调试）
      if (this.config.debug) {
        console.log(`Agent运行 [${agentName}]:`, {
          contextId: processedContext.metadata?.id || 'unknown',
          options: runOptions
        });
      }
      
      // 执行运行
      const startTime = Date.now();
      const response = await agent.run(processedContext, runOptions);
      const endTime = Date.now();
      
      // 运行后处理
      const processedResponse = this._postProcess(response, runOptions);
      
      // 记录响应（如果启用了调试）
      if (this.config.debug) {
        console.log(`Agent响应 [${agentName}]:`, {
          duration: `${endTime - startTime}ms`,
          steps: response.steps?.length || 0
        });
      }
      
      return processedResponse;
    } catch (error) {
      // 错误处理
      console.error(`Agent运行错误 [${agentName}]:`, error);
      throw new Error(`Agent运行失败: ${error.message}`);
    }
  }

  /**
   * 运行前处理
   * @private
   * @param {Object} context - 原始上下文
   * @param {Object} options - 运行选项
   * @returns {Object} - 处理后的上下文
   */
  _preProcess(context, options) {
    // 可以在这里添加通用的预处理逻辑
    // 例如添加系统指令、格式化等
    return context;
  }

  /**
   * 运行后处理
   * @private
   * @param {Object} response - 原始响应
   * @param {Object} options - 运行选项
   * @returns {Object} - 处理后的响应
   */
  _postProcess(response, options) {
    // 可以在这里添加通用的后处理逻辑
    // 例如解析结果、提取特定字段等
    return response;
  }

  /**
   * 验证Agent接口
   * @private
   * @param {Object} agent - Agent实例
   */
  _validateAgent(agent) {
    // 检查必要的方法
    if (typeof agent.run !== 'function') {
      throw new Error('Agent缺少必要的run方法');
    }
  }
}

module.exports = AgentIntegration;