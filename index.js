/**
 * 书源规则解析器主入口文件
 * Book Source Rule Parser - 支持 CSS、XPath、JSON、正则、JS 选择器和组合运算规则
 */

// 导出核心引擎
export { 
  BookSourceRuleEngine, 
  createRuleEngine, 
  parseRule, 
  parseRules 
} from './src/engine.js';

// 导出类型定义
export { 
  SelectorType, 
  OperatorType, 
  isEmpty, 
  RuleParseError 
} from './src/types.js';

// 导出所有选择器
export * from './src/selectors/index.js';

// 导出所有运算符
export * from './src/operators/index.js';

/**
 * 默认导出：快速使用的工厂函数
 */
export default function createBookSourceParser(options = {}) {
  return createRuleEngine(options);
}