/**
 * 基础适配器
 * 所有适配器的基类，定义了标准接口
 */

class BaseAdapter {
  constructor(options = {}) {
    this.options = options;
    this.initialized = false;
  }

  /**
   * 初始化适配器
   * @returns {Promise<boolean>} - 初始化是否成功
   */
  async initialize() {
    // 基类实现，子类应该重写此方法
    this.initialized = true;
    return true;
  }

  /**
   * 检查适配器是否已初始化
   * @returns {boolean} - 是否已初始化
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * 关闭适配器连接
   * @returns {Promise<boolean>} - 关闭是否成功
   */
  async close() {
    // 基类实现，子类应该重写此方法
    this.initialized = false;
    return true;
  }

  /**
   * 执行适配器操作
   * @param {string} action - 操作名称
   * @param {Object} params - 操作参数
   * @returns {Promise<Object>} - 操作结果
   */
  async execute(action, params = {}) {
    if (!this.initialized) {
      throw new Error('适配器未初始化');
    }
    
    // 基类实现，子类应该重写此方法
    throw new Error(`未实现的操作: ${action}`);
  }
}

module.exports = BaseAdapter;