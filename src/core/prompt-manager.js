/**
 * Prompt管理器
 * 负责管理和渲染Prompt模板
 */

class PromptManager {
  constructor(config = {}) {
    this.config = config;
    this.templates = {}; // 存储注册的模板
    this.defaultVariables = {}; // 默认变量
  }

  /**
   * 注册Prompt模板
   * @param {string} name - 模板名称
   * @param {Object} template - 模板配置
   */
  registerTemplate(name, template) {
    if (!name || typeof name !== 'string') {
      throw new Error('模板名称必须是非空字符串');
    }
    
    if (!template || typeof template !== 'object') {
      throw new Error('模板配置必须是有效的对象');
    }
    
    // 验证模板结构
    if (!template.content && !template.sections) {
      throw new Error('模板必须包含content或sections字段');
    }
    
    this.templates[name] = template;
    
    if (this.config.debug) {
      console.log(`已注册Prompt模板: ${name}`);
    }
  }

  /**
   * 设置默认变量
   * @param {Object} variables - 默认变量对象
   */
  setDefaultVariables(variables) {
    if (!variables || typeof variables !== 'object') {
      throw new Error('默认变量必须是有效的对象');
    }
    
    this.defaultVariables = { ...this.defaultVariables, ...variables };
  }

  /**
   * 获取已注册的模板
   * @param {string} name - 模板名称
   * @returns {Object} - 模板配置
   */
  getTemplate(name) {
    if (!this.templates[name]) {
      throw new Error(`未找到模板: ${name}`);
    }
    
    return this.templates[name];
  }

  /**
   * 渲染Prompt模板
   * @param {string} templateName - 模板名称
   * @param {Object} variables - 变量数据
   * @returns {string} - 渲染后的Prompt
   */
  render(templateName, variables = {}) {
    // 获取模板
    const template = this.getTemplate(templateName);
    
    // 合并默认变量和用户提供的变量
    const mergedVariables = { ...this.defaultVariables, ...variables };
    
    // 根据模板类型进行渲染
    if (template.content) {
      // 简单模板直接渲染
      return this._renderString(template.content, mergedVariables);
    } else if (template.sections) {
      // 分段模板需要先渲染各段，然后组合
      return this._renderSections(template, mergedVariables);
    }
  }

  /**
   * 渲染字符串模板
   * @private
   * @param {string} template - 模板字符串
   * @param {Object} variables - 变量数据
   * @returns {string} - 渲染后的字符串
   */
  _renderString(template, variables) {
    // 使用简单的变量替换方式，支持{{variable}}语法
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      // 支持嵌套属性，如 user.name
      const value = this._getNestedValue(variables, trimmedKey);
      
      // 如果变量不存在，保留原始模板标记
      return value !== undefined ? value : match;
    });
  }

  /**
   * 渲染分段模板
   * @private
   * @param {Object} template - 模板配置
   * @param {Object} variables - 变量数据
   * @returns {string} - 渲染后的Prompt
   */
  _renderSections(template, variables) {
    const sections = [];
    
    // 处理每个段落
    for (const section of template.sections) {
      // 检查条件
      if (section.condition && !this._evaluateCondition(section.condition, variables)) {
        continue; // 跳过不满足条件的段落
      }
      
      // 渲染段落内容
      let sectionContent = '';
      
      if (section.content) {
        // 静态内容
        sectionContent = this._renderString(section.content, variables);
      } else if (section.template) {
        // 引用其他模板
        sectionContent = this.render(section.template, variables);
      } else if (section.iterator && section.itemTemplate) {
        // 迭代渲染
        sectionContent = this._renderIterator(section, variables);
      }
      
      if (sectionContent) {
        sections.push(sectionContent);
      }
    }
    
    // 使用模板定义的分隔符或默认分隔符连接段落
    const separator = template.separator || '\n\n';
    return sections.join(separator);
  }

  /**
   * 渲染迭代器段落
   * @private
   * @param {Object} section - 段落配置
   * @param {Object} variables - 变量数据
   * @returns {string} - 渲染后的内容
   */
  _renderIterator(section, variables) {
    const items = this._getNestedValue(variables, section.iterator);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ''; // 没有项目可迭代
    }
    
    const renderedItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const itemVariables = {
        ...variables,
        item: items[i],
        index: i,
        isFirst: i === 0,
        isLast: i === items.length - 1
      };
      
      let itemContent = '';
      
      if (typeof section.itemTemplate === 'string') {
        // 字符串模板
        itemContent = this._renderString(section.itemTemplate, itemVariables);
      } else if (typeof section.itemTemplate === 'object') {
        // 引用其他模板
        itemContent = this.render(section.itemTemplate.name, itemVariables);
      }
      
      renderedItems.push(itemContent);
    }
    
    // 使用迭代器定义的分隔符或默认分隔符连接项目
    const separator = section.separator || '\n';
    return renderedItems.join(separator);
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
   * 评估条件表达式
   * @private
   * @param {Object} condition - 条件配置
   * @param {Object} variables - 变量数据
   * @returns {boolean} - 条件评估结果
   */
  _evaluateCondition(condition, variables) {
    // 支持多种条件类型
    if (condition.exists) {
      // 检查变量是否存在
      return this._getNestedValue(variables, condition.exists) !== undefined;
    } else if (condition.notExists) {
      // 检查变量是否不存在
      return this._getNestedValue(variables, condition.notExists) === undefined;
    } else if (condition.equals) {
      // 检查变量是否等于指定值
      const { field, value } = condition.equals;
      return this._getNestedValue(variables, field) === value;
    } else if (condition.notEquals) {
      // 检查变量是否不等于指定值
      const { field, value } = condition.notEquals;
      return this._getNestedValue(variables, field) !== value;
    } else if (condition.and && Array.isArray(condition.and)) {
      // 逻辑与
      return condition.and.every(subCondition => this._evaluateCondition(subCondition, variables));
    } else if (condition.or && Array.isArray(condition.or)) {
      // 逻辑或
      return condition.or.some(subCondition => this._evaluateCondition(subCondition, variables));
    }
    
    // 默认返回true
    return true;
  }
}

module.exports = PromptManager;