# 实体映射器 (EntityMapper)

## 概述

实体映射器是MCP框架的核心组件之一，负责将源数据映射到标准化实体结构。它提供了灵活的映射规则和转换机制，使开发者能够轻松地将不同来源和格式的数据转换为统一的实体模型，便于后续处理和使用。

## 主要功能

### 注册映射配置

```javascript
entityMapper.registerMapping('weather-response', {
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
    }
  },
  postProcessors: [
    {
      type: 'addField',
      field: 'summary',
      value: (data) => `当前${data.location}天气：${data.condition}，温度${data.temperature}`
    }
  ]
});
```

注册映射配置时，系统会：
- 验证映射名称的有效性
- 验证映射配置的结构
- 存储映射配置以供后续使用

### 执行实体映射

```javascript
const weatherData = {
  location: {
    name: '北京',
    country: '中国'
  },
  current: {
    temp_c: 25,
    condition: {
      text: '晴天'
    },
    humidity: 40
  }
};

const mappedEntity = entityMapper.map(weatherData, 'weather-response');
```

执行映射时，系统会：
- 获取指定的映射配置
- 应用映射规则到源数据
- 执行后处理器
- 返回映射后的实体数据

## 映射规则类型

### 简单字段映射

直接指定源数据中的字段路径：

```javascript
location: 'location.name' // 将源数据中的location.name映射到目标的location字段
```

### 转换函数映射

通过转换函数处理源数据：

```javascript
temperature: {
  type: 'transform',
  source: 'current.temp_c',
  transform: (value) => `${value}°C`
}
```

### 条件映射

根据条件选择不同的映射结果：

```javascript
status: {
  type: 'conditional',
  conditions: [
    { when: 'current.temp_c > 30', then: '炎热' },
    { when: 'current.temp_c > 20', then: '温暖' },
    { when: 'current.temp_c > 10', then: '凉爽' }
  ],
  default: '寒冷'
}
```

### 直接值映射

设置固定值：

```javascript
unit: {
  type: 'value',
  value: '摄氏度'
}
```

## 后处理器

后处理器用于在基本映射完成后对数据进行进一步处理：

### 添加字段

```javascript
{
  type: 'addField',
  field: 'summary',
  value: (data) => `当前${data.location}天气：${data.condition}，温度${data.temperature}`
}
```

### 删除字段

```javascript
{
  type: 'removeField',
  field: 'rawData'
}
```

### 转换字段

```javascript
{
  type: 'transformField',
  field: 'temperature',
  transform: (value) => parseFloat(value)
}
```

### 条件处理

```javascript
{
  type: 'conditional',
  condition: (data) => data.temperature > 30,
  trueProcessor: {
    type: 'addField',
    field: 'warning',
    value: '高温警告'
  }
}
```

## 高级特性

### 嵌套映射

支持对复杂对象进行嵌套映射：

```javascript
forecast: {
  type: 'nestedMapping',
  source: 'forecast.forecastday',
  mapping: 'daily-forecast'
}
```

### 数组映射

支持对数组数据进行映射：

```javascript
dailyForecasts: {
  type: 'arrayMapping',
  source: 'forecast.forecastday',
  itemMapping: {
    date: 'date',
    maxTemp: 'day.maxtemp_c',
    minTemp: 'day.mintemp_c'
  }
}
```

### 自定义映射函数

支持完全自定义的映射逻辑：

```javascript
customField: {
  type: 'custom',
  mapper: (sourceData, context) => {
    // 自定义映射逻辑
    return computedValue;
  }
}
```

## 配置选项

实体映射器支持以下配置选项：

- `strictMode`: 是否在映射过程中严格检查字段存在性
- `defaultValue`: 当字段不存在时的默认值
- `preserveNulls`: 是否保留null值
- `debug`: 是否启用调试模式

## 最佳实践

1. **设计清晰的实体模型**
   - 定义明确的实体结构和字段
   - 保持实体模型的一致性和稳定性

2. **合理使用转换函数**
   - 使用转换函数处理数据格式和单位转换
   - 避免在转换函数中执行复杂的业务逻辑

3. **利用后处理器优化结果**
   - 使用后处理器添加计算字段和摘要信息
   - 通过后处理器移除不必要的中间数据

4. **注意性能考量**
   - 对于大型数据集，优化映射规则以提高性能
   - 考虑使用缓存机制减少重复映射操作