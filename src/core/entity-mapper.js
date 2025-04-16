/**
 * 实体映射器
 * 负责将源数据映射到标准化实体结构
 */

class EntityMapper {
  constructor(config = {}) {
    this.config = config;
    this.mappings = {}; // 存储注册的映射配置
  }

  /**
   * 注册实体映射配置
   * @param {string} name - 映射配置名称
   * @param {Object} mapping - 映射规则配置
   */
  registerMapping(name, mapping) {
    if (!name || typeof name !== 'string') {
      throw new Error('映射名称必须是非空字符串');
    }
    
    if (!mapping || typeof mapping !== 'object') {
      throw new Error('映射配置必须是有效的对象');
    }
    
    this.mappings[name] = mapping;
    
    if (this.config.debug) {
      console.log(`已注册实体映射: ${name}`);
    }
  }

  /**
   * 获取已注册的映射配置
   * @param {string} name - 映射配置名称
   * @returns {Object} - 映射配置
   */
  getMapping(name) {
    if (!this.mappings[name]) {
      throw new Error(`未找到映射配置: ${name}`);
    }
    
    return this.mappings[name];
  }

  /**
   * 执行实体映射
   * @param {Object} data - 源数据
   * @param {string} mappingName - 映射配置名称
   * @returns {Object} - 映射后的实体数据
   */
  map(data, mappingName) {
    // 获取映射配置
    const mapping = this.getMapping(mappingName);
    
    // 执行映射转换
    return this._applyMapping(data, mapping);
  }

  /**
   * 应用映射规则到数据
   * @private
   * @param {Object} data - 源数据
   * @param {Object} mapping - 映射规则
   * @returns {Object} - 映射后的数据
   */
  _applyMapping(data, mapping) {
    const result = {};
    
    // 处理字段映射
    for (const targetField in mapping.fields) {
      const fieldMapping = mapping.fields[targetField];
      
      if (typeof fieldMapping === 'string') {
        // 简单字段映射
        result[targetField] = this._getNestedValue(data, fieldMapping);
      } else if (typeof fieldMapping === 'object') {
        // 复杂字段映射
        if (fieldMapping.type === 'value') {
          // 直接值
          result[targetField] = fieldMapping.value;
        } else if (fieldMapping.type === 'transform') {
          // 转换函数
          const sourceValue = this._getNestedValue(data, fieldMapping.source);
          result[targetField] = this._applyTransform(sourceValue, fieldMapping.transform);
        } else if (fieldMapping.type === 'conditional') {
          // 条件映射
          result[targetField] = this._applyConditional(data, fieldMapping.conditions, fieldMapping.default);
        }
      }
    }
    
    // 应用后处理器
    if (mapping.postProcessors && Array.isArray(mapping.postProcessors)) {
      for (const processor of mapping.postProcessors) {
        this._applyPostProcessor(result, processor);
      }
    }
    
    return result;
  }

  /**
   * 获取嵌套对象中的值
   * @private
   * @param {Object} obj - 源对象
   * @param {string} path - 属性路径 (如 'user.profile.name')
   * @returns {*} - 获取的值
   */
  _getNestedValue(obj, path) {
    if (!path) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * 应用转换函数
   * @private
   * @param {*} value - 源值
   * @param {string} transformName - 转换函数名称
   * @returns {*} - 转换后的值
   */
  _applyTransform(value, transformName) {
    // 内置转换函数
    const transforms = {
      toUpperCase: (v) => typeof v === 'string' ? v.toUpperCase() : v,
      toLowerCase: (v) => typeof v === 'string' ? v.toLowerCase() : v,
      toString: (v) => v !== null && v !== undefined ? String(v) : '',
      toNumber: (v) => Number(v),
      toBoolean: (v) => Boolean(v),
      trim: (v) => typeof v === 'string' ? v.trim() : v,
      // 可以根据需要添加更多转换函数
    };
    
    // 如果transformName是函数，直接使用该函数
    if (typeof transformName === 'function') {
      return transformName(value);
    }
    
    if (!transforms[transformName]) {
      throw new Error(`未知的转换函数: ${transformName}`);
    }
    
    return transforms[transformName](value);
  }

  /**
   * 应用条件映射
   * @private
   * @param {Object} data - 源数据
   * @param {Array} conditions - 条件数组
   * @param {*} defaultValue - 默认值
   * @returns {*} - 条件映射结果
   */
  _applyConditional(data, conditions, defaultValue) {
    for (const condition of conditions) {
      const sourceValue = this._getNestedValue(data, condition.source);
      
      let match = false;
      
      switch (condition.operator) {
        case 'eq':
          match = sourceValue === condition.value;
          break;
        case 'neq':
          match = sourceValue !== condition.value;
          break;
        case 'gt':
          match = sourceValue > condition.value;
          break;
        case 'gte':
          match = sourceValue >= condition.value;
          break;
        case 'lt':
          match = sourceValue < condition.value;
          break;
        case 'lte':
          match = sourceValue <= condition.value;
          break;
        case 'contains':
          match = String(sourceValue).includes(condition.value);
          break;
        case 'startsWith':
          match = String(sourceValue).startsWith(condition.value);
          break;
        case 'endsWith':
          match = String(sourceValue).endsWith(condition.value);
          break;
        default:
          throw new Error(`未知的条件操作符: ${condition.operator}`);
      }
      
      if (match) {
        return condition.result;
      }
    }
    
    return defaultValue;
  }

  /**
   * 应用后处理器
   * @private
   * @param {Object} data - 映射后的数据
   * @param {Array} processors - 后处理器配置数组
   * @returns {Object} - 处理后的数据
   */
  _applyPostProcessor(data, processors) {
    if (!processors || !Array.isArray(processors)) {
      return data;
    }
    
    let result = { ...data };
    
    for (const processor of processors) {
      if (!processor.type) {
        continue;
      }
      
      switch (processor.type) {
        case 'addField':
          if (processor.field && processor.value) {
            if (typeof processor.value === 'function') {
              result[processor.field] = processor.value(result);
            } else {
              result[processor.field] = processor.value;
            }
          }
          break;
        // 可以根据需要添加更多后处理器类型
        default:
          throw new Error(`未知的后处理器类型: ${processor.type}`);
      }
    }
    
    return result;
  }
}

module.exports = EntityMapper;