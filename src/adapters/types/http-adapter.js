/**
 * HTTP适配器
 * 用于与HTTP API进行交互的适配器
 */

const BaseAdapter = require('./base-adapter');

class HttpAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    
    // 默认配置
    this.config = {
      baseUrl: '',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 默认超时时间（毫秒）
      ...options
    };
  }

  /**
   * 初始化适配器
   * @returns {Promise<boolean>} - 初始化是否成功
   */
  async initialize() {
    try {
      // 验证配置
      if (!this.config.baseUrl) {
        throw new Error('缺少必要的baseUrl配置');
      }
      
      // 可以在这里添加测试连接的逻辑
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('HTTP适配器初始化失败:', error);
      return false;
    }
  }

  /**
   * 执行HTTP请求
   * @param {string} action - 操作名称（对应HTTP方法或自定义操作）
   * @param {Object} params - 操作参数
   * @returns {Promise<Object>} - 请求响应
   */
  async execute(action, params = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const method = this._getHttpMethod(action);
    const url = this._buildUrl(params.path || '');
    const options = this._buildRequestOptions(method, params);
    
    try {
      // 使用fetch API发送请求
      const response = await fetch(url, options);
      
      // 解析响应
      const result = await this._parseResponse(response);
      
      return result;
    } catch (error) {
      console.error(`HTTP请求失败 [${method} ${url}]:`, error);
      throw new Error(`HTTP请求失败: ${error.message}`);
    }
  }

  /**
   * 发送GET请求
   * @param {string} path - 请求路径
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} - 请求响应
   */
  async get(path, params = {}) {
    return this.execute('GET', { path, ...params });
  }

  /**
   * 发送POST请求
   * @param {string} path - 请求路径
   * @param {Object} data - 请求数据
   * @param {Object} params - 其他参数
   * @returns {Promise<Object>} - 请求响应
   */
  async post(path, data, params = {}) {
    return this.execute('POST', { path, data, ...params });
  }

  /**
   * 发送PUT请求
   * @param {string} path - 请求路径
   * @param {Object} data - 请求数据
   * @param {Object} params - 其他参数
   * @returns {Promise<Object>} - 请求响应
   */
  async put(path, data, params = {}) {
    return this.execute('PUT', { path, data, ...params });
  }

  /**
   * 发送DELETE请求
   * @param {string} path - 请求路径
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} - 请求响应
   */
  async delete(path, params = {}) {
    return this.execute('DELETE', { path, ...params });
  }

  /**
   * 获取HTTP方法
   * @private
   * @param {string} action - 操作名称
   * @returns {string} - HTTP方法
   */
  _getHttpMethod(action) {
    // 标准HTTP方法
    const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    
    // 如果action是标准HTTP方法，直接返回
    if (standardMethods.includes(action.toUpperCase())) {
      return action.toUpperCase();
    }
    
    // 自定义操作映射到HTTP方法
    const methodMap = {
      'fetch': 'GET',
      'create': 'POST',
      'update': 'PUT',
      'remove': 'DELETE',
      'patch': 'PATCH'
    };
    
    return methodMap[action.toLowerCase()] || 'GET';
  }

  /**
   * 构建完整URL
   * @private
   * @param {string} path - 请求路径
   * @returns {string} - 完整URL
   */
  _buildUrl(path) {
    let baseUrl = this.config.baseUrl;
    
    // 确保baseUrl以/结尾，path不以/开头
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    return baseUrl + path;
  }

  /**
   * 构建请求选项
   * @private
   * @param {string} method - HTTP方法
   * @param {Object} params - 请求参数
   * @returns {Object} - 请求选项
   */
  _buildRequestOptions(method, params) {
    const options = {
      method,
      headers: { ...this.config.headers },
      timeout: params.timeout || this.config.timeout
    };
    
    // 添加自定义头部
    if (params.headers) {
      Object.assign(options.headers, params.headers);
    }
    
    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && params.data) {
      if (options.headers['Content-Type'] === 'application/json') {
        options.body = JSON.stringify(params.data);
      } else if (options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        const formData = new URLSearchParams();
        for (const key in params.data) {
          formData.append(key, params.data[key]);
        }
        options.body = formData.toString();
      } else {
        options.body = params.data;
      }
    }
    
    // 添加查询参数
    if (params.query) {
      const url = new URL(this._buildUrl(params.path || ''));
      for (const key in params.query) {
        url.searchParams.append(key, params.query[key]);
      }
      options.url = url.toString();
    }
    
    return options;
  }

  /**
   * 解析响应
   * @private
   * @param {Response} response - Fetch API响应对象
   * @returns {Promise<Object>} - 解析后的响应
   */
  async _parseResponse(response) {
    const contentType = response.headers.get('Content-Type') || '';
    
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
    }
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  }
}

module.exports = HttpAdapter;