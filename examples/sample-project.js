/**
 * MCP框架样本项目
 * 展示框架的核心功能和使用方法
 */

// 导入MCP框架
const MCP = require('../src/index');
const HttpAdapter = require('../src/adapters/types/http-adapter');

// 初始化MCP实例
const mcp = new MCP({
  debug: true, // 启用调试模式
  cacheEnabled: true
});

// 1. 注册HTTP适配器
console.log('1. 注册HTTP适配器');
mcp.registerAdapter('weather-api', new HttpAdapter({
  baseUrl: 'https://api.weatherapi.com/v1',
  headers: {
    'Content-Type': 'application/json'
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
    }
  },
  postProcessors: [
    {
      type: 'addField',
      field: 'summary',
      value: (data) => `当前${data.location}天气：${data.condition}，温度${data.temperature}，湿度${data.humidity}，风速${data.windSpeed}`
    }
  ]
});

// 3. 注册Prompt模板
console.log('\n3. 注册Prompt模板');
mcp.promptManager.registerTemplate('weather-report', {
  sections: [
    {
      name: 'system',
      content: '你是一个专业的天气助手，根据提供的天气数据生成友好的天气报告。'
    },
    {
      name: 'user',
      content: '请根据以下天气数据，生成一份简短的天气报告：\n\n地点：{{location}}，{{country}}\n温度：{{temperature}}\n天气状况：{{condition}}\n湿度：{{humidity}}\n风速：{{windSpeed}}'
    }
  ]
});

// 4. 创建上下文
console.log('\n4. 创建上下文');
const context = mcp.createContext({
  metadata: {
    source: 'sample-project'
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
      location: '北京'
    }
  }
});

console.log('创建的上下文：', JSON.stringify(context, null, 2));

// 5. 模拟调用天气API并处理结果
console.log('\n5. 模拟天气API响应处理');

// 模拟API响应数据
const mockWeatherData = {
  location: {
    name: '北京',
    country: '中国'
  },
  current: {
    temp_c: 22,
    condition: {
      text: '晴朗'
    },
    humidity: 65,
    wind_kph: 12
  }
};

// 使用实体映射处理数据
const mappedData = mcp.entityMapper.map(mockWeatherData, 'weather-response');
console.log('映射后的天气数据：', mappedData);

// 6. 使用Prompt模板生成天气报告
console.log('\n6. 使用Prompt模板生成天气报告');
const prompt = mcp.promptManager.render('weather-report', mappedData);
console.log('生成的Prompt：\n', prompt);

// 7. 模拟LLM调用
console.log('\n7. 模拟LLM调用');

// 注册模拟LLM提供商
mcp.llmIntegration.registerProvider('mock-llm', {
  call: async (prompt, options) => {
    console.log('调用LLM，使用Prompt：', prompt);
    // 模拟LLM响应
    return {
      response: `尊敬的${context.user.profile.name}，

北京今日天气晴朗，温度宜人，为22°C。湿度适中，为65%，微风轻拂，风速约为12 km/h。

今天是户外活动的好天气，建议您可以外出享受这美好的一天！

祝您有愉快的一天！`,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: 120,
        totalTokens: prompt.length / 4 + 120
      }
    };
  }
});

// 设置为默认提供商
mcp.llmIntegration.setDefaultProvider('mock-llm');

// 调用LLM
async function callLLM() {
  try {
    const result = await mcp.llmIntegration.call(prompt, {
      temperature: 0.5,
      maxTokens: 200
    });
    
    console.log('LLM响应：', result.response);
    console.log('Token使用情况：', result.usage);
    
    // 更新上下文，添加历史记录
    const updatedContext = mcp.contextManager.addHistory(context, {
      role: 'assistant',
      content: result.response,
      timestamp: Date.now()
    });
    
    console.log('\n8. 更新后的上下文：');
    console.log('历史记录数量：', updatedContext.session.history.length);
  } catch (error) {
    console.error('LLM调用失败：', error);
  }
}

// 执行LLM调用
callLLM().then(() => {
  console.log('\n样本项目执行完成！');
});