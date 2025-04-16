/**
 * LLM集成模块
 * 负责与各种大语言模型进行交互
 */

class LLMIntegration {
  constructor(config = {}) {
    this.config = config;
    this.providers = {}; // 存储注册的LLM提供商
    this.defaultProvider = null; // 默认LLM提供商
  }

  /**
   * 注册LLM提供商
   * @param {string} name - 提供商名称
   * @param {Object} provider - 提供商实例或配置
   */
  registerProvider(name, provider) {
    if (!name || typeof name !== 'string') {
      throw new Error('提供商名称必须是非空字符串');
    }
    
    if (!provider) {
      throw new Error('提供商不能为空');
    }
    
    // 验证提供商接口
    this._validateProvider(provider);
    
    this.providers[name] = provider;
    
    // 如果是第一个注册的提供商，设为默认
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
    
    if (this.config.debug) {
      console.log(`已注册LLM提供商: ${name}`);
    }
  }

  /**
   * 设置默认LLM提供商
   * @param {string} name - 提供商名称
   */
  setDefaultProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`未找到LLM提供商: ${name}`);
    }
    
    this.defaultProvider = name;
  }

  /**
   * 获取LLM提供商
   * @param {string} name - 提供商名称
   * @returns {Object} - 提供商实例
   */
  getProvider(name) {
    if (!name) {
      // 如果未指定名称，返回默认提供商
      if (!this.defaultProvider) {
        throw new Error('未设置默认LLM提供商');
      }
      return this.providers[this.defaultProvider];
    }
    
    if (!this.providers[name]) {
      throw new Error(`未找到LLM提供商: ${name}`);
    }
    
    return this.providers[name];
  }

  /**
   * 调用LLM模型
   * @param {string} prompt - 处理后的Prompt
   * @param {Object} options - 调用选项
   * @returns {Promise<Object>} - 模型响应
   */
  async call(prompt, options = {}) {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.getProvider(providerName);
    
    // 合并默认选项和用户提供的选项
    const callOptions = {
      temperature: 0.7,
      maxTokens: 1000,
      ...this.config.llmDefaults,
      ...options
    };
    
    // 移除provider字段，避免传递给实际的提供商
    delete callOptions.provider;
    
    try {
      // 调用前处理
      const processedPrompt = this._preProcess(prompt, callOptions);
      
      // 记录请求（如果启用了调试）
      if (this.config.debug) {
        console.log(`LLM请求 [${providerName}]:`, {
          prompt: processedPrompt.substring(0, 100) + '...',
          options: callOptions
        });
      }
      
      // 执行调用
      const startTime = Date.now();
      const response = await provider.call(processedPrompt, callOptions);
      const endTime = Date.now();
      
      // 调用后处理
      const processedResponse = this._postProcess(response, callOptions);
      
      // 记录响应（如果启用了调试）
      if (this.config.debug) {
        console.log(`LLM响应 [${providerName}]:`, {
          duration: `${endTime - startTime}ms`,
          response: typeof processedResponse === 'string' 
            ? processedResponse.substring(0, 100) + '...' 
            : '(非文本响应)'
        });
      }
      
      return processedResponse;
    } catch (error) {
      // 错误处理
      console.error(`LLM调用错误 [${providerName}]:`, error);
      throw new Error(`LLM调用失败: ${error.message}`);
    }
  }

  /**
   * 调用前处理
   * @private
   * @param {string} prompt - 原始Prompt
   * @param {Object} options - 调用选项
   * @returns {string} - 处理后的Prompt
   */
  _preProcess(prompt, options) {
    // 可以在这里添加通用的预处理逻辑
    // 例如添加系统指令、格式化等
    return prompt;
  }

  /**
   * 调用后处理
   * @private
   * @param {Object} response - 原始响应
   * @param {Object} options - 调用选项
   * @returns {Object} - 处理后的响应
   */
  _postProcess(response, options) {
    // 可以在这里添加通用的后处理逻辑
    // 例如解析JSON、提取特定字段等
    return response;
  }

  /**
   * 验证提供商接口
   * @private
   * @param {Object} provider - 提供商实例
   */
  _validateProvider(provider) {
    // 检查必要的方法
    if (typeof provider.call !== 'function') {
      throw new Error('LLM提供商缺少必要的call方法');
    }
  }
}

module.exports = LLMIntegration;