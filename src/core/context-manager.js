/**
 * 上下文管理器
 * 负责创建、管理和标准化上下文对象
 */

class ContextManager {
  constructor(config = {}) {
    this.config = config;
    this.contextSchema = {
      // 基础信息
      metadata: {
        id: null,          // 上下文唯一标识
        timestamp: null,   // 创建时间戳
        source: null,      // 来源系统
        version: '1.0'     // 上下文版本
      },
      // 用户信息
      user: {
        id: null,          // 用户ID
        profile: {},       // 用户画像数据
        preferences: {}    // 用户偏好设置
      },
      // 会话信息
      session: {
        id: null,          // 会话ID
        history: [],       // 历史交互记录
        state: {}          // 会话状态
      },
      // 业务数据
      business: {
        domain: null,      // 业务领域
        entities: {},      // 业务实体
        constraints: []    // 业务约束条件
      },
      // 环境信息
      environment: {
        locale: 'zh-CN',   // 语言环境
        timezone: 'Asia/Shanghai', // 时区
        device: null,      // 设备信息
        channel: null      // 渠道信息
      }
    };
  }

  /**
   * 创建标准化上下文
   * @param {Object} contextData - 上下文初始数据
   * @returns {Object} - 标准化的上下文对象
   */
  create(contextData = {}) {
    // 生成基础上下文结构
    const context = JSON.parse(JSON.stringify(this.contextSchema));
    
    // 合并用户提供的数据
    this._mergeData(context, contextData);
    
    // 设置默认元数据
    if (!context.metadata.id) {
      context.metadata.id = this._generateId();
    }
    if (!context.metadata.timestamp) {
      context.metadata.timestamp = Date.now();
    }
    
    // 验证上下文结构
    this._validateContext(context);
    
    return context;
  }

  /**
   * 更新现有上下文
   * @param {Object} context - 现有上下文
   * @param {Object} newData - 新数据
   * @returns {Object} - 更新后的上下文
   */
  update(context, newData) {
    // 深拷贝以避免直接修改原始对象
    const updatedContext = JSON.parse(JSON.stringify(context));
    
    // 合并新数据
    this._mergeData(updatedContext, newData);
    
    // 验证更新后的上下文
    this._validateContext(updatedContext);
    
    return updatedContext;
  }

  /**
   * 添加历史记录到上下文
   * @param {Object} context - 上下文对象
   * @param {Object} entry - 历史记录条目
   * @returns {Object} - 更新后的上下文
   */
  addHistory(context, entry) {
    const updatedContext = JSON.parse(JSON.stringify(context));
    
    // 确保entry包含必要字段
    const historyEntry = {
      timestamp: Date.now(),
      type: 'message',
      ...entry
    };
    
    // 添加到历史记录
    updatedContext.session.history.push(historyEntry);
    
    return updatedContext;
  }

  /**
   * 递归合并数据到上下文
   * @private
   * @param {Object} target - 目标对象
   * @param {Object} source - 源数据
   */
  _mergeData(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // 如果是对象且目标也是对象，递归合并
          if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
            this._mergeData(target[key], source[key]);
          } else {
            // 否则直接赋值
            target[key] = source[key];
          }
        } else {
          // 非对象直接赋值
          target[key] = source[key];
        }
      }
    }
  }

  /**
   * 生成唯一ID
   * @private
   * @returns {string} - 生成的ID
   */
  _generateId() {
    return 'ctx_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * 验证上下文结构
   * @private
   * @param {Object} context - 上下文对象
   */
  _validateContext(context) {
    // 基本验证，可根据需要扩展
    if (!context.metadata) {
      throw new Error('上下文缺少metadata字段');
    }
    
    // 在调试模式下进行更详细的验证
    if (this.config.debug) {
      console.log('上下文验证通过:', context.metadata.id);
    }
  }
}

module.exports = ContextManager;