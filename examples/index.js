/**
 * MCP框架示例入口文件
 */

console.log('MCP框架示例项目');
console.log('====================\n');

// 获取命令行参数
const args = process.argv.slice(2);
const example = args[0];

// 根据参数运行不同的示例
if (example === 'advanced-chatbot') {
  console.log('运行高级对话系统示例...');
  require('./advanced-chatbot');
} else if (example === 'custom-adapter') {
  console.log('运行自定义适配器示例...');
  require('./custom-adapter');
} else {
  // 默认运行基础样本项目
  console.log('运行基础样本项目...');
  require('./sample-project');
}