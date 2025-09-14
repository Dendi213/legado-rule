/**
 * 书源规则解析器类型定义
 */

/**
 * 选择器类型枚举
 */
export const SelectorType = {
  CSS: 'css',
  XPATH: 'xpath', 
  JSON: 'json',
  REGEX: 'regex',
  JS: 'js'
};

/**
 * 运算符类型枚举
 */
export const OperatorType = {
  FALLBACK: '||',        // 回退机制
  CONCAT: '&&',          // 字段拼接
  ATTR: '@',             // 属性提取
  INDEX: '[]',           // 索引选择
  REGEX_CLEAN: '##',     // 正则净化
  CONTAINS: ':contains(' // 条件过滤
};

/**
 * 解析结果类型
 * @typedef {Object} ParseResult
 * @property {boolean} success - 解析是否成功
 * @property {any} data - 解析结果数据
 * @property {string} [error] - 错误信息
 * @property {string} rule - 使用的规则
 * @property {string} selector - 选择器类型
 */

/**
 * 规则上下文类型
 * @typedef {Object} RuleContext
 * @property {Document|Element|string} source - 数据源（DOM、HTML字符串、JSON字符串等）
 * @property {Object} [variables] - 变量上下文
 * @property {Object} [options] - 解析选项
 */

/**
 * 选择器配置类型
 * @typedef {Object} SelectorConfig
 * @property {string} type - 选择器类型
 * @property {string} expression - 选择器表达式
 * @property {string} [attribute] - 属性名（用于@attr）
 * @property {number|number[]} [index] - 索引（用于数组选择）
 * @property {Object} [regexClean] - 正则清理配置
 * @property {string} regexClean.pattern - 正则模式
 * @property {string} regexClean.replacement - 替换内容
 */

/**
 * 验证是否为空值
 * @param {any} value - 要验证的值
 * @returns {boolean} 是否为空值
 */
export function isEmpty(value) {
  if (value === null || value === undefined || value === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  return false;
}

/**
 * 规则解析错误类
 */
export class RuleParseError extends Error {
  constructor(message, rule, selector, originalError) {
    super(message);
    this.name = 'RuleParseError';
    this.rule = rule;
    this.selector = selector;
    this.originalError = originalError;
  }
}