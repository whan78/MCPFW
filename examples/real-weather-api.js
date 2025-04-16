/**
 * MCP框架实际API交互示例
 * 展示如何使用MCP框架与真实API交互，包含错误处理、缓存和重试机制
 */

// 导入MCP框架
const MCP = require('../src/index');
const HttpAdapter = require('../src/adapters/types/http-adapter');

// 初始化MCP实例，启用缓存
const mcp = new MCP({
  debug: true,
  cacheEnabled: true
});

// 1. 注册HTTP适配器（配置真实的Weather API）
console.log('1. 注册HTTP适配器（Weather API）');
mcp.registerAdapter('weather-api', new HttpAdapter({
  baseUrl: 'https://api.weatherapi.com/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10秒超时
  // 添加重试配置
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryStatusCodes: [429, 500, 502, 503, 504]
  }
}));

// 2. 注册实体映射
console.log('\n2. 注册实体映射');
mcp.entityMapper.registerMapping('weather-response', {
  fields: {
    location: 'location.name',
    country: 'location.country',
    temperature: {
      type: 'transform',
      source: 'current.temp_c',
      transform: (value) => `${value}°C`
    },
    condition: 'current.condition.text',
    humidity: {
      type: 'transform',
      source: 'current.humidity',
      transform: (value) => `${value}%`
    },
    windSpeed: {
      type: 'transform',
      source: 'current.wind_kph',
      transform: (value) => `${value} km/h`
    },
    // 添加更多字段
    feelsLike: {
      type: 'transform',
      source: 'current.feelslike_c',
      transform: (value) => `${value}°C`
    },
    uv: 'current.uv',
    lastUpdated: 'current.last_updated'
  },
  postProcessors: [
    {
      type: 'addField',
      field: 'summary',
      value: (data) => `当前${data.location}天气：${data.condition}，温度${data.temperature}，体感温度${data.feelsLike}，湿度${data.humidity}，风速${data.windSpeed}`
    },
    {
      type: 'addField',
      field: 'recommendation',
      value: (data) => {
        const temp = parseFloat(data.temperature);
        if (temp > 30) return '天气炎热，请注意防暑降温，多补充水分。';
        if (temp > 20) return '天气温暖，适合户外活动。';
        if (temp > 10) return '天气凉爽，建议适当添加衣物。';
        return '天气较冷，请注意保暖。';
      }
    }
  ]
});

// 3. 注册错误处理映射
console.log('\n3. 注册错误处理映射');
mcp.entityMapper.registerMapping('error-response', {
  fields: {
    errorCode: 'error.code',
    errorMessage: 'error.message',
    errorType: {
      type: 'conditional',
      conditions: [
        { when: 'error.code === 1002', then: '无效API密钥' },
        { when: 'error.code === 1003', then: '无效地点' },
        { when: 'error.code === 1005', then: 'API请求URL无效' },
        { when: 'error.code === 1006', then: '地点不存在' },
        { when: 'error.code === 2006', then: 'API密钥超出调用限制' },
        { when: 'error.code === 2007', then: 'API密钥超出调用频率限制' },
        { when: 'error.code === 2008', then: 'API密钥已禁用' },
        { when: 'error.code >= 9000', then: '内部应用错误' }
      ],
      default: '未知错误'
    },
    userMessage: {
      type: 'transform',
      source: 'error',
      transform: (error) => {
        if (error.code === 1003 || error.code === 1006) {
          return '您输入的地点无效或不存在，请尝试其他地点。';
        } else if (error.code >= 2006 && error.code <= 2008) {
          return '服务暂时不可用，请稍后再试。';
        } else if (error.code >= 9000) {
          return '系统遇到了问题，请稍后再试。';
        }
        return '获取天气信息失败，请稍后再试。';
      }
    }
  }
});

// 4. 注册Prompt模板
console.log('\n4. 注册Prompt模板');
mcp.promptManager.registerTemplate('weather-report', {
  sections: [
    {
      name: 'system',
      content: '你是一个专业的天气助手，根据提供的天气数据生成友好的天气报告。'
    },
    {
      name: 'user',
      content: '请根据以下天气数据，生成一份详细的天气报告：\n\n地点：{{location}}，{{country}}\n温度：{{temperature}} (体感温度：{{feelsLike}})\n天气状况：{{condition}}\n湿度：{{humidity}}\n风速：{{windSpeed}}\nUV指数：{{uv}}\n最后更新时间：{{lastUpdated}}\n\n请同时提供以下建议：{{recommendation}}'
    }
  ]
});

// 5. 创建上下文
console.log('\n5. 创建上下文');
const context = mcp.createContext({
  metadata: {
    source: 'real-weather-api-example'
  },
  user: {
    id: 'user-123',
    profile: {
      name: '张三',
      preferences: {
        temperatureUnit: 'celsius'
      }
    }
  },
  business: {
    domain: 'weather-service',
    entities: {
      location: '上海'
    }
  }
});

// 6. 实际调用天气API
async function getWeatherData(location) {
  console.log(`\n6. 获取${location}的天气数据`);
  
  try {
    // 获取适配器
    const weatherAdapter = mcp.getAdapter('weather-api');
    
    // 检查缓存（模拟实现）
    const cacheKey = `weather_${location}`;
    const cachedData = checkCache(cacheKey);
    
    if (cachedData) {
      console.log('使用缓存的天气数据');
      return cachedData;
    }
    
    // 构建API请求参数
    const params = {
      path: '/current.json',
      queryParams: {
        key: 'YOUR_API_KEY', // 实际使用时替换为真实的API密钥
        q: location,
        aqi: 'no'
      }
    };
    
    // 发送请求
    console.log('发送API请求...');
    const response = await weatherAdapter.get(params.path, params);
    
    // 缓存结果（模拟实现）
    saveToCache(cacheKey, response, 30 * 60 * 1000); // 缓存30分钟
    
    return response;
  } catch (error) {
    console.error('获取天气数据失败:', error);
    
    // 解析错误
    let errorData = {
      error: {
        code: error.status || 9999,
        message: error.message || '未知错误'
      }
    };
    
    // 如果是API返回的错误，尝试解析响应体
    if (error.response && error.response.json) {
      try {
        const errorBody = await error.response.json();
        errorData = errorBody;
      } catch (e) {
        // 解析响应体失败，使用默认错误
      }
    }
    
    // 映射错误
    return mcp.entityMapper.map(errorData, 'error-response');
  }
}

// 7. 处理天气数据并生成报告
async function generateWeatherReport(location) {
  try {
    // 获取天气数据
    const weatherData = await getWeatherData(location);
    
    // 检查是否有错误
    if (weatherData.errorType) {
      console.error('天气API错误:', weatherData.errorType);
      return {
        success: false,
        message: weatherData.userMessage
      };
    }
    
    // 映射数据
    console.log('\n7. 处理天气API响应');
    const mappedData = mcp.entityMapper.map(weatherData, 'weather-response');
    console.log('映射后的天气数据：', mappedData);
    
    // 生成Prompt
    console.log('\n8. 使用Prompt模板生成天气报告');
    const prompt = mcp.promptManager.render('weather-report', mappedData);
    
    // 调用LLM
    console.log('\n9. 调用LLM生成天气报告');
    const result = await mcp.llmIntegration.call(prompt, {
      temperature: 0.7,
      maxTokens: 300
    });
    
    // 更新上下文
    const updatedContext = mcp.contextManager.addHistory(context, {
      role: 'assistant',
      content: result.response,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      weatherData: mappedData,
      report: result.response,
      context: updatedContext
    };
  } catch (error) {
    console.error('生成天气报告失败:', error);
    return {
      success: false,
      message: '生成天气报告时发生错误，请稍后再试。'
    };
  }
}

// 模拟缓存功能
const cache = new Map();

function checkCache(key) {
  if (!cache.has(key)) return null;
  
  const { data, expiry } = cache.get(key);
  if (Date.now() > expiry) {
    cache.delete(key);
    return null;
  }
  
  return data;
}

function saveToCache(key, data, ttl) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

// 注册模拟LLM提供商
mcp.llmIntegration.registerProvider('mock-llm', {
  call: async (prompt, options) => {
    console.log('调用LLM，使用Prompt：', prompt);
    // 模拟LLM响应
    return {
      response: `尊敬的${context.user.profile.name}，

上海今日天气数据更新：

当前温度为24°C，体感温度为26°C。天气状况为多云，湿度为78%，风速为15 km/h。UV指数为4（中等）。

根据当前天气状况，天气温暖，适合户外活动。不过由于湿度较高，可能会感到闷热，建议穿着轻便透气的衣物。

如果您计划外出，建议携带一把伞，以防突然降雨。

祝您有愉快的一天！`,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: 150,
        totalTokens: prompt.length / 4 + 150
      }
    };
  }
});

// 设置为默认提供商
mcp.llmIntegration.setDefaultProvider('mock-llm');

// 执行示例
async function runExample() {
  console.log('开始执行实际API交互示例...');
  
  // 使用上海作为示例地点
  const location = '上海';
  
  // 生成天气报告
  const result = await generateWeatherReport(location);
  
  if (result.success) {
    console.log('\n天气报告生成成功：');
    console.log(result.report);
  } else {
    console.error('\n天气报告生成失败：', result.message);
  }
  
  console.log('\n示例执行完成！');
}

// 运行示例
runExample().catch(error => {
  console.error('示例执行失败:', error);
});