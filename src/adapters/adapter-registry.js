/**
 * 适配器注册表
 * 负责管理系统适配器
 */

class AdapterRegistry {
  constructor(config = {}) {
    this.config = config;
    this.adapters = {}; // 存储注册的适配器
  }

  /**
   * 注册适配器
   * @param {string} name - 适配器名称
   * @param {Object} adapter - 适配器实例或配置
   */
  register(name, adapter) {
    if (!name || typeof name !== 'string') {
      throw new Error('适配器名称必须是非空字符串');
    }
    
    if (!adapter) {
      throw new Error('适配器不能为空');
    }
    
    // 如果提供的是配置而非实例，尝试初始化适配器
    if (typeof adapter === 'object' && adapter.type && !adapter.initialize) {
      adapter = this._initializeAdapter(adapter);
    }
    
    // 验证适配器接口
    this._validateAdapter(adapter);
    
    this.adapters[name] = adapter;
    
    if (this.config.debug) {
      console.log(`已注册适配器: ${name}`);
    }
  }

  /**
   * 获取已注册的适配器
   * @param {string} name - 适配器名称
   * @returns {Object} - 适配器实例
   */
  get(name) {
    if (!this.adapters[name]) {
      throw new Error(`未找到适配器: ${name}`);
    }
    
    return this.adapters[name];
  }

  /**
   * 检查适配器是否已注册
   * @param {string} name - 适配器名称
   * @returns {boolean} - 是否已注册
   */
  has(name) {
    return !!this.adapters[name];
  }

  /**
   * 移除已注册的适配器
   * @param {string} name - 适配器名称
   * @returns {boolean} - 是否成功移除
   */
  unregister(name) {
    if (!this.adapters[name]) {
      return false;
    }
    
    delete this.adapters[name];
    return true;
  }

  /**
   * 获取所有已注册的适配器名称
   * @returns {Array<string>} - 适配器名称列表
   */
  getAdapterNames() {
    return Object.keys(this.adapters);
  }

  /**
   * 初始化适配器
   * @private
   * @param {Object} config - 适配器配置
   * @returns {Object} - 适配器实例
   */
  _initializeAdapter(config) {
    // 根据适配器类型加载对应的适配器类
    let AdapterClass;
    
    try {
      // 尝试从内置适配器中加载
      AdapterClass = require(`./types/${config.type}-adapter`);
    } catch (error) {
      // 如果内置适配器不存在，尝试从配置的路径加载
      if (config.path) {
        try {
          AdapterClass = require(config.path);
        } catch (pathError) {
          throw new Error(`无法加载适配器: ${config.type}, 错误: ${pathError.message}`);
        }
      } else {
        throw new Error(`未知的适配器类型: ${config.type}`);
      }
    }
    
    // 创建适配器实例
    return new AdapterClass(config.options || {});
  }

  /**
   * 验证适配器接口
   * @private
   * @param {Object} adapter - 适配器实例
   */
  _validateAdapter(adapter) {
    // 检查必要的方法
    const requiredMethods = ['initialize'];
    
    for (const method of requiredMethods) {
      if (typeof adapter[method] !== 'function') {
        throw new Error(`适配器缺少必要的方法: ${method}`);
      }
    }
  }
}

module.exports = AdapterRegistry;