/**
 * MCP框架示例 - 自定义适配器
 * 展示如何创建自定义适配器并集成到MCP框架中
 */

// 导入MCP框架和基础适配器
const MCP = require('../src/index');
const BaseAdapter = require('../src/adapters/types/base-adapter');

// 1. 创建自定义数据库适配器
class DatabaseAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    
    // 默认配置
    this.config = {
      host: 'localhost',
      port: 3306,
      database: 'test',
      user: 'root',
      password: '',
      ...options
    };
    
    // 模拟数据存储
    this.mockData = {
      users: [
        { id: 1, name: '张三', age: 30, email: 'zhangsan@example.com' },
        { id: 2, name: '李四', age: 25, email: 'lisi@example.com' },
        { id: 3, name: '王五', age: 35, email: 'wangwu@example.com' }
      ],
      products: [
        { id: 101, name: '智能手机', price: 4999, category: '电子产品' },
        { id: 102, name: '笔记本电脑', price: 8999, category: '电子产品' },
        { id: 103, name: '智能手表', price: 1999, category: '穿戴设备' }
      ]
    };
  }

  /**
   * 初始化适配器
   * @returns {Promise<boolean>} - 初始化是否成功
   */
  async initialize() {
    try {
      console.log(`数据库适配器初始化: ${this.config.host}:${this.config.port}/${this.config.database}`);
      
      // 在实际应用中，这里会建立数据库连接
      // 这里仅作模拟
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('数据库适配器初始化失败:', error);
      return false;
    }
  }

  /**
   * 关闭适配器连接
   * @returns {Promise<boolean>} - 关闭是否成功
   */
  async close() {
    try {
      console.log('关闭数据库连接');
      
      // 在实际应用中，这里会关闭数据库连接
      
      this.initialized = false;
      return true;
    } catch (error) {
      console.error('关闭数据库连接失败:', error);
      return false;
    }
  }

  /**
   * 执行适配器操作
   * @param {string} action - 操作名称
   * @param {Object} params - 操作参数
   * @returns {Promise<Object>} - 操作结果
   */
  async execute(action, params = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    switch (action) {
      case 'query':
        return this.query(params.table, params.conditions);
      case 'insert':
        return this.insert(params.table, params.data);
      case 'update':
        return this.update(params.table, params.id, params.data);
      case 'delete':
        return this.delete(params.table, params.id);
      default:
        throw new Error(`未支持的操作: ${action}`);
    }
  }

  /**
   * 查询数据
   * @private
   * @param {string} table - 表名
   * @param {Object} conditions - 查询条件
   * @returns {Promise<Object>} - 查询结果
   */
  async query(table, conditions = {}) {
    console.log(`查询表 ${table}，条件:`, conditions);
    
    if (!this.mockData[table]) {
      return { error: `表不存在: ${table}` };
    }
    
    // 简单的条件过滤
    let results = [...this.mockData[table]];
    
    if (conditions) {
      for (const key in conditions) {
        results = results.filter(item => item[key] === conditions[key]);
      }
    }
    
    return { results, count: results.length };
  }

  /**
   * 插入数据
   * @private
   * @param {string} table - 表名
   * @param {Object} data - 插入数据
   * @returns {Promise<Object>} - 插入结果
   */
  async insert(table, data) {
    console.log(`向表 ${table} 插入数据:`, data);
    
    if (!this.mockData[table]) {
      return { error: `表不存在: ${table}` };
    }
    
    // 生成新ID
    const newId = Math.max(...this.mockData[table].map(item => item.id), 0) + 1;
    const newItem = { id: newId, ...data };
    
    this.mockData[table].push(newItem);
    
    return { success: true, id: newId };
  }

  /**
   * 更新数据
   * @private
   * @param {string} table - 表名
   * @param {number} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} - 更新结果
   */
  async update(table, id, data) {
    console.log(`更新表 ${table} ID=${id} 的数据:`, data);
    
    if (!this.mockData[table]) {
      return { error: `表不存在: ${table}` };
    }
    
    const index = this.mockData[table].findIndex(item => item.id === id);
    
    if (index === -1) {
      return { error: `记录不存在: ID=${id}` };
    }
    
    this.mockData[table][index] = { ...this.mockData[table][index], ...data };
    
    return { success: true };
  }

  /**
   * 删除数据
   * @private
   * @param {string} table - 表名
   * @param {number} id - 记录ID
   * @returns {Promise<Object>} - 删除结果
   */
  async delete(table, id) {
    console.log(`从表 ${table} 删除 ID=${id} 的记录`);
    
    if (!this.mockData[table]) {
      return { error: `表不存在: ${table}` };
    }
    
    const index = this.mockData[table].findIndex(item => item.id === id);
    
    if (index === -1) {
      return { error: `记录不存在: ID=${id}` };
    }
    
    this.mockData[table].splice(index, 1);
    
    return { success: true };
  }
}

// 初始化MCP实例
const mcp = new MCP({
  debug: true
});

// 注册自定义适配器
console.log('1. 注册自定义数据库适配器');
mcp.registerAdapter('db', new DatabaseAdapter({
  host: 'localhost',
  database: 'mcp_demo',
  user: 'demo_user'
}));

// 注册实体映射
console.log('\n2. 注册实体映射');
mcp.entityMapper.registerMapping('user-profile', {
  fields: {
    userId: 'id',
    fullName: 'name',
    userAge: 'age',
    contactEmail: 'email',
    displayInfo: {
      type: 'transform',
      source: 'name',
      transform: (name, data) => `${name} (${data.age}岁)`
    }
  }
});

// 创建上下文
console.log('\n3. 创建上下文');
const context = mcp.createContext({
  metadata: {
    source: 'custom-adapter-demo'
  },
  business: {
    domain: 'user-management'
  }
});

// 使用自定义适配器
async function demoCustomAdapter() {
  try {
    // 获取适配器实例
    const dbAdapter = mcp.adapterRegistry.get('db');
    
    // 查询用户
    console.log('\n4. 查询用户数据');
    const queryResult = await dbAdapter.execute('query', {
      table: 'users',
      conditions: { age: 30 }
    });
    
    console.log('查询结果:', queryResult);
    
    // 使用实体映射处理结果
    if (queryResult.results && queryResult.results.length > 0) {
      const user = queryResult.results[0];
      const mappedUser = mcp.entityMapper.map(user, 'user-profile');
      
      console.log('\n5. 映射后的用户数据:');
      console.log(mappedUser);
      
      // 更新上下文
      context.business.entities.user = mappedUser;
    }
    
    // 插入新用户
    console.log('\n6. 插入新用户');
    const insertResult = await dbAdapter.execute('insert', {
      table: 'users',
      data: {
        name: '赵六',
        age: 28,
        email: 'zhaoliu@example.com'
      }
    });
    
    console.log('插入结果:', insertResult);
    
    // 再次查询所有用户
    console.log('\n7. 查询所有用户');
    const allUsers = await dbAdapter.execute('query', {
      table: 'users'
    });
    
    console.log(`共有 ${allUsers.count} 个用户:`);
    allUsers.results.forEach(user => {
      console.log(`- ${user.name} (ID: ${user.id}, 年龄: ${user.age})`);
    });
    
    // 关闭适配器
    await dbAdapter.close();
    
  } catch (error) {
    console.error('演示过程中出错:', error);
  }
}

// 运行演示
demoCustomAdapter().then(() => {
  console.log('\n自定义适配器示例完成！');
});