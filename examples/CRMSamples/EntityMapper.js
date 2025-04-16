const { v4: uuidv4 } = require('uuid');

class EntityMapper {
  constructor(options = {}) {
    this.mappings = new Map();
    this.cache = options.cacheEnabled ? new Map() : null;
    this.debug = options.debug || false;
  }

  registerMapping(entityType, mappingConfig) {
    const mappingId = uuidv4();
    this.mappings.set(entityType, {
      id: mappingId,
      rules: mappingConfig.rules || [],
      postProcessors: mappingConfig.postProcessors || [],
    });
    if (this.debug) {
      console.log(`已为 ${entityType} 注册映射，ID ${mappingId}`);
    }
    return mappingId;
  }

  map(entityType, inputData) {
    const cacheKey = this.cache ? `${entityType}:${JSON.stringify(inputData)}` : null;
    if (this.cache && this.cache.has(cacheKey)) {
      if (this.debug) console.log(`缓存命中: ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    const mapping = this.mappings.get(entityType);
    if (!mapping) {
      throw new Error(`未找到实体类型 ${entityType} 的映射配置`);
    }

    let output = {};
    for (const rule of mapping.rules) {
      try {
        const value = this._getFieldValue(inputData, rule.source);
        output[rule.target] = rule.transform
          ? rule.transform(value)
          : value ?? rule.default;
      } catch (error) {
        if (this.debug) {
          console.error(`映射字段 ${rule.source} 出错: ${error.message}`);
        }
        output[rule.target] = rule.default ?? null;
      }
    }

    for (const processor of mapping.postProcessors) {
      output = processor(output);
    }

    if (this.cache && cacheKey) {
      this.cache.set(cacheKey, output);
    }

    return output;
  }

  _getFieldValue(data, path) {
    return path.split('.').reduce((obj, key) => {
      return obj && typeof obj === 'object' ? obj[key] : undefined;
    }, data);
  }

  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }
}

// 配置映射
const mapper = new EntityMapper({ cacheEnabled: true, debug: true });

// 客户实体
mapper.registerMapping('customer', {
  rules: [
    { source: 'user.id', target: 'customerId', default: null },
    { source: 'user.name', target: 'fullName', transform: (v) => v?.trim() || 'UNKNOWN' },
    { source: 'user.email', target: 'email', transform: (v) => v?.toLowerCase(), default: 'no-email@domain.com' },
    { source: 'user.phone', target: 'phone', default: null }
  ],
  postProcessors: [
    (entity) => {
      entity.isValid = entity.customerId && entity.email !== 'no-email@domain.com';
      return entity;
    }
  ]
});

// 商机实体
mapper.registerMapping('opportunity', {
  rules: [
    { source: 'opp.id', target: 'opportunityId', default: null },
    { source: 'opp.amount', target: 'amount', transform: (v) => Number(v) || 0 },
    { source: 'opp.stage', target: 'stage', default: 'unknown' },
    { source: 'opp.probability', target: 'probability', transform: (v) => Math.min(Math.max(Number(v), 0), 1) },
    { source: 'opp.lastContact', target: 'lastContact', transform: (v) => new Date(v).toISOString() }
  ],
  postProcessors: [
    (entity) => {
      entity.priorityScore = entity.amount * entity.probability;
      return entity;
    }
  ]
});