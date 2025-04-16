const { v4: uuidv4 } = require('uuid');

class EntityMapper {
  constructor(options = {}) {
    this.mappings = new Map();
    this.cache = options.cacheEnabled ? new Map() : null;
    this.debug = options.debug || false;
  }

  // Register a mapping configuration
  registerMapping(entityType, mappingConfig) {
    const mappingId = uuidv4();
    this.mappings.set(entityType, {
      id: mappingId,
      rules: mappingConfig.rules || [],
      postProcessors: mappingConfig.postProcessors || [],
    });
    if (this.debug) {
      console.log(`Registered mapping for ${entityType} with ID ${mappingId}`);
    }
    return mappingId;
  }

  // Apply mapping to input data
  map(entityType, inputData) {
    // Check cache first
    const cacheKey = this.cache ? `${entityType}:${JSON.stringify(inputData)}` : null;
    if (this.cache && this.cache.has(cacheKey)) {
      if (this.debug) console.log(`Cache hit for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    const mapping = this.mappings.get(entityType);
    if (!mapping) {
      throw new Error(`No mapping found for entity type: ${entityType}`);
    }

    // Initialize output entity
    let output = {};

    // Apply mapping rules
    for (const rule of mapping.rules) {
      try {
        const value = this._getFieldValue(inputData, rule.source);
        output[rule.target] = rule.transform
          ? rule.transform(value)
          : value ?? rule.default;
      } catch (error) {
        if (this.debug) {
          console.error(`Error mapping field ${rule.source}: ${error.message}`);
        }
        output[rule.target] = rule.default ?? null;
      }
    }

    // Apply post-processors
    for (const processor of mapping.postProcessors) {
      output = processor(output);
    }

    // Cache result if enabled
    if (this.cache && cacheKey) {
      this.cache.set(cacheKey, output);
    }

    return output;
  }

  // Helper to access nested fields
  _getFieldValue(data, path) {
    return path.split('.').reduce((obj, key) => {
      return obj && typeof obj === 'object' ? obj[key] : undefined;
    }, data);
  }

  // Clear cache
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }
}

// Example usage
const mapper = new EntityMapper({ cacheEnabled: true, debug: true });

// Define a mapping for a customer entity
mapper.registerMapping('customer', {
  rules: [
    {
      source: 'user.id',
      target: 'customerId',
      default: null,
    },
    {
      source: 'user.profile.name',
      target: 'fullName',
      transform: (value) => value?.toUpperCase() || 'UNKNOWN',
    },
    {
      source: 'user.email',
      target: 'email',
      transform: (value) => value?.toLowerCase(),
      default: 'no-email@domain.com',
    },
  ],
  postProcessors: [
    (entity) => {
      // Add a computed field
      entity.isValid = entity.customerId && entity.email !== 'no-email@domain.com';
      return entity;
    },
  ],
});

// Sample input data (e.g., from a third-party API)
const rawData = {
  user: {
    id: '12345',
    profile: {
      name: 'John Doe',
    },
    email: 'JOHN.DOE@EXAMPLE.COM',
  },
};

// Map the data
const mappedCustomer = mapper.map('customer', rawData);
console.log('Mapped Customer:', mappedCustomer);

// Expected output:
// {
//   customerId: '12345',
//   fullName: 'JOHN DOE',
//   email: 'john.doe@example.com',
//   isValid: true
// }