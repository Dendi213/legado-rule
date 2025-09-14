/**
 * 书源规则解析引擎
 * 整合所有选择器和运算符，提供统一的规则解析接口
 */

import { isEmpty, RuleParseError, SelectorType, OperatorType } from './types.js';

// 导入选择器
import { 
  cssSelector, 
  cssContainsSelector 
} from './selectors/css.js';

import { 
  xpathSelector, 
  xpathAttributeSelector, 
  xpathTextSelector 
} from './selectors/xpath.js';

import { 
  jsonSelector, 
  jsonArraySelector, 
  jsonMultiPathSelector, 
  jsonFilterSelector 
} from './selectors/json.js';

import { 
  regexSelector, 
  regexReplaceSelector, 
  regexSplitSelector, 
  regexTestSelector, 
  regexMultiPatternSelector 
} from './selectors/regex.js';

import { 
  jsSelector, 
  jsConditionalSelector, 
  jsMapSelector, 
  jsFilterSelector, 
  jsReduceSelector 
} from './selectors/js.js';

// 导入运算符
import { 
  fallbackOperator, 
  parseFallbackRule, 
  validateFallbackRules 
} from './operators/fallback.js';

import { 
  concatOperator, 
  parseConcatRule, 
  smartConcatOperator 
} from './operators/concat.js';

import { 
  attributeOperator, 
  multiAttributeOperator 
} from './operators/attribute.js';

import { 
  indexOperator, 
  rangeOperator, 
  multiIndexOperator 
} from './operators/index.js';

import { 
  regexCleanOperator, 
  parseCleanRule, 
  batchRegexCleanOperator, 
  presetCleanOperator, 
  smartCleanOperator 
} from './operators/regex-clean.js';

/**
 * 书源规则解析引擎主类
 */
export class BookSourceRuleEngine {
  constructor(options = {}) {
    this.options = {
      // 默认选择器类型
      defaultSelector: SelectorType.CSS,
      
      // 执行超时时间
      timeout: 10000,
      
      // 是否启用严格模式
      strictMode: false,
      
      // 是否启用调试模式
      debug: false,
      
      // 自定义上下文
      context: {},
      
      // 缓存配置
      cache: {
        enabled: false,
        maxSize: 1000,
        ttl: 300000 // 5分钟
      },
      
      ...options
    };
    
    // 初始化缓存
    if (this.options.cache.enabled) {
      this.cache = new Map();
    }
  }

  /**
   * 解析单个规则
   * @param {string} rule - 规则字符串
   * @param {any} source - 数据源
   * @param {Object} context - 执行上下文
   * @returns {Promise<ParseResult>} 解析结果
   */
  async parseRule(rule, source, context = {}) {
    try {
      // 参数验证
      if (!rule || typeof rule !== 'string') {
        throw new Error('规则不能为空');
      }

      // 检查缓存
      const cacheKey = this._generateCacheKey(rule, source, context);
      if (this.options.cache.enabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.options.cache.ttl) {
          return { ...cached.result, fromCache: true };
        }
        this.cache.delete(cacheKey);
      }

      // 解析规则
      const parseResult = await this._executeRule(rule, source, context);
      
      // 缓存结果
      if (this.options.cache.enabled && parseResult.success) {
        this._cacheResult(cacheKey, parseResult);
      }

      return parseResult;

    } catch (error) {
      return {
        success: false,
        data: null,
        rule: rule,
        selector: 'unknown',
        error: error.message,
        stack: this.options.debug ? error.stack : undefined
      };
    }
  }

  /**
   * 执行规则解析
   * @param {string} rule - 规则字符串
   * @param {any} source - 数据源
   * @param {Object} context - 执行上下文
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _executeRule(rule, source, context) {
    // 清理规则字符串
    const cleanRule = rule.trim();
    
    // 检查是否为回退规则
    if (cleanRule.includes('||')) {
      return this._handleFallbackRule(cleanRule, source, context);
    }
    
    // 检查是否为拼接规则
    if (cleanRule.includes('&&')) {
      return this._handleConcatRule(cleanRule, source, context);
    }
    
    // 检查是否包含净化规则
    if (cleanRule.includes('##')) {
      return this._handleCleanRule(cleanRule, source, context);
    }
    
    // 解析单个选择器
    return this._handleSingleSelector(cleanRule, source, context);
  }

  /**
   * 处理回退规则
   * @param {string} rule - 规则字符串
   * @param {any} source - 数据源
   * @param {Object} context - 执行上下文
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _handleFallbackRule(rule, source, context) {
    const rules = parseFallbackRule(rule);
    const selectors = [];
    
    for (const singleRule of rules) {
      selectors.push({
        rule: singleRule,
        execute: async (src, ctx, opts) => this._handleSingleSelector(singleRule, src, ctx)
      });
    }
    
    return fallbackOperator(selectors, source, context, this.options);
  }

  /**
   * 处理拼接规则
   * @param {string} rule - 规则字符串
   * @param {any} source - 数据源
   * @param {Object} context - 执行上下文
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _handleConcatRule(rule, source, context) {
    const rules = parseConcatRule(rule);
    const selectors = [];
    
    for (const singleRule of rules) {
      selectors.push({
        rule: singleRule,
        execute: async (src, ctx, opts) => this._handleSingleSelector(singleRule, src, ctx)
      });
    }
    
    return concatOperator(selectors, source, context, this.options);
  }

  /**
   * 处理净化规则
   * @param {string} rule - 规则字符串
   * @param {any} source - 数据源
   * @param {Object} context - 执行上下文
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _handleCleanRule(rule, source, context) {
    // 先分离净化规则和选择器
    const parts = rule.split('##');
    let selectorPart = parts[0];
    const cleanParts = [];
    
    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        cleanParts.push({
          pattern: parts[i],
          replacement: parts[i + 1]
        });
      }
    }
    
    // 如果没有选择器部分，直接应用净化
    if (!selectorPart) {
      if (cleanParts.length === 1) {
        return regexCleanOperator(source, cleanParts[0].pattern, cleanParts[0].replacement, this.options);
      } else {
        return batchRegexCleanOperator(source, cleanParts, this.options);
      }
    }
    
    // 先执行选择器，再应用净化
    const selectorResult = await this._handleSingleSelector(selectorPart, source, context);
    
    if (!selectorResult.success) {
      return selectorResult;
    }
    
    // 应用净化规则
    if (cleanParts.length === 1) {
      const cleanResult = regexCleanOperator(selectorResult.data, cleanParts[0].pattern, cleanParts[0].replacement, this.options);
      return {
        ...cleanResult,
        rule: rule,
        originalData: selectorResult.data
      };
    } else {
      const cleanResult = batchRegexCleanOperator(selectorResult.data, cleanParts, this.options);
      return {
        ...cleanResult,
        rule: rule,
        originalData: selectorResult.data
      };
    }
  }

  /**
   * 处理单个选择器
   * @param {string} rule - 规则字符串
   * @param {any} source - 数据源
   * @param {Object} context - 执行上下文
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _handleSingleSelector(rule, source, context) {
    const { selectorType, expression, options } = this._parseSelector(rule);
    
    switch (selectorType) {
      case SelectorType.CSS:
        return this._executeCssSelector(expression, source, options);
      case SelectorType.XPATH:
        return this._executeXPathSelector(expression, source, options);
      case SelectorType.JSON:
        return this._executeJsonSelector(expression, source, options);
      case SelectorType.REGEX:
        return this._executeRegexSelector(expression, source, options);
      case SelectorType.JS:
        return this._executeJsSelector(expression, source, context, options);
      default:
        throw new Error(`不支持的选择器类型: ${selectorType}`);
    }
  }

  /**
   * 解析选择器字符串
   * @param {string} rule - 规则字符串
   * @returns {Object} 解析结果
   */
  _parseSelector(rule) {
    let selectorType = this.options.defaultSelector;
    let expression = rule;
    let options = {};
    
    // 检查前缀
    if (rule.startsWith('@css:')) {
      selectorType = SelectorType.CSS;
      expression = rule.substring(5);
    } else if (rule.startsWith('@XPath:')) {
      selectorType = SelectorType.XPATH;
      expression = rule.substring(7);
    } else if (rule.startsWith('@json:')) {
      selectorType = SelectorType.JSON;
      expression = rule.substring(6);
    } else if (rule.startsWith('@regex:')) {
      selectorType = SelectorType.REGEX;
      expression = rule.substring(7);
    } else if (rule.startsWith('@js:')) {
      selectorType = SelectorType.JS;
      expression = rule.substring(4);
    }
    
    // 解析索引选择器
    const indexMatch = expression.match(/^(.+)\[(.+)\](.*)$/);
    if (indexMatch) {
      const baseExpression = indexMatch[1];
      const indexPart = indexMatch[2];
      const afterIndex = indexMatch[3];
      
      options.index = this._parseIndexExpression(indexPart);
      expression = baseExpression + afterIndex;
    }
    
    return { selectorType, expression, options };
  }

  /**
   * 解析索引表达式
   * @param {string} indexExpr - 索引表达式
   * @returns {any} 解析后的索引
   */
  _parseIndexExpression(indexExpr) {
    if (indexExpr.includes(':')) {
      // 范围选择 [start:end]
      const parts = indexExpr.split(':');
      return {
        type: 'range',
        start: this._parseIndexValue(parts[0]),
        end: this._parseIndexValue(parts[1])
      };
    } else if (indexExpr.includes(',')) {
      // 多索引选择 [1,3,5]
      return {
        type: 'multi',
        indices: indexExpr.split(',').map(i => this._parseIndexValue(i.trim()))
      };
    } else {
      // 单索引选择 [0]
      return {
        type: 'single',
        value: this._parseIndexValue(indexExpr)
      };
    }
  }

  /**
   * 解析索引值
   * @param {string} value - 索引值字符串
   * @returns {number|string} 解析后的索引值
   */
  _parseIndexValue(value) {
    const trimmed = value.trim();
    if (trimmed === '') return 0;
    
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? trimmed : num;
  }

  /**
   * 执行 CSS 选择器
   * @param {string} expression - 表达式
   * @param {any} source - 数据源
   * @param {Object} options - 选项
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _executeCssSelector(expression, source, options) {
    if (expression.includes(':contains(')) {
      return cssContainsSelector(source, expression, options);
    } else {
      const result = cssSelector(source, expression, options);
      return this._applyIndexOptions(result, options);
    }
  }

  /**
   * 执行 XPath 选择器
   * @param {string} expression - 表达式
   * @param {any} source - 数据源
   * @param {Object} options - 选项
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _executeXPathSelector(expression, source, options) {
    const result = xpathSelector(source, expression, options);
    return this._applyIndexOptions(result, options);
  }

  /**
   * 执行 JSON 选择器
   * @param {string} expression - 表达式
   * @param {any} source - 数据源
   * @param {Object} options - 选项
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _executeJsonSelector(expression, source, options) {
    const result = jsonSelector(source, expression, options);
    return this._applyIndexOptions(result, options);
  }

  /**
   * 执行正则选择器
   * @param {string} expression - 表达式
   * @param {any} source - 数据源
   * @param {Object} options - 选项
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _executeRegexSelector(expression, source, options) {
    const result = regexSelector(source, expression, options);
    return this._applyIndexOptions(result, options);
  }

  /**
   * 执行 JS 选择器
   * @param {string} expression - 表达式
   * @param {any} source - 数据源
   * @param {Object} context - 上下文
   * @param {Object} options - 选项
   * @returns {Promise<ParseResult>} 解析结果
   */
  async _executeJsSelector(expression, source, context, options) {
    const mergedContext = { ...this.options.context, ...context };
    const result = jsSelector(source, expression, mergedContext, { ...options, timeout: this.options.timeout });
    return this._applyIndexOptions(result, options);
  }

  /**
   * 应用索引选项
   * @param {ParseResult} result - 解析结果
   * @param {Object} options - 选项
   * @returns {ParseResult} 处理后的结果
   */
  _applyIndexOptions(result, options) {
    if (!result.success || !options.index) {
      return result;
    }

    const { type, value, start, end, indices } = options.index;

    switch (type) {
      case 'single':
        const indexResult = indexOperator(result.data, value, options);
        return {
          ...result,
          data: indexResult.data,
          success: indexResult.success
        };
      case 'range':
        const rangeResult = rangeOperator(result.data, start, end, options);
        return {
          ...result,
          data: rangeResult.data,
          success: rangeResult.success
        };
      case 'multi':
        const multiResult = multiIndexOperator(result.data, indices, options);
        return {
          ...result,
          data: multiResult.data,
          success: multiResult.success
        };
      default:
        return result;
    }
  }

  /**
   * 生成缓存键
   * @param {string} rule - 规则
   * @param {any} source - 数据源
   * @param {Object} context - 上下文
   * @returns {string} 缓存键
   */
  _generateCacheKey(rule, source, context) {
    const sourceKey = typeof source === 'string' ? 
      source.substring(0, 100) : 
      JSON.stringify(source).substring(0, 100);
    const contextKey = JSON.stringify(context);
    return `${rule}|${sourceKey}|${contextKey}`;
  }

  /**
   * 缓存结果
   * @param {string} key - 缓存键
   * @param {ParseResult} result - 结果
   */
  _cacheResult(key, result) {
    if (this.cache.size >= this.options.cache.maxSize) {
      // 删除最旧的缓存项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      result: { ...result },
      timestamp: Date.now()
    });
  }

  /**
   * 清理缓存
   */
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    if (!this.cache) {
      return { enabled: false };
    }
    
    return {
      enabled: true,
      size: this.cache.size,
      maxSize: this.options.cache.maxSize,
      ttl: this.options.cache.ttl
    };
  }
}

/**
 * 创建规则引擎实例
 * @param {Object} options - 配置选项
 * @returns {BookSourceRuleEngine} 引擎实例
 */
export function createRuleEngine(options = {}) {
  return new BookSourceRuleEngine(options);
}

/**
 * 快速解析规则（使用默认配置）
 * @param {string} rule - 规则字符串
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @returns {Promise<ParseResult>} 解析结果
 */
export async function parseRule(rule, source, context = {}) {
  const engine = new BookSourceRuleEngine();
  return engine.parseRule(rule, source, context);
}

/**
 * 批量解析规则
 * @param {Array} rules - 规则数组
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 解析结果数组
 */
export async function parseRules(rules, source, context = {}, options = {}) {
  const engine = new BookSourceRuleEngine(options);
  const results = [];
  
  for (const rule of rules) {
    try {
      const result = await engine.parseRule(rule, source, context);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        data: null,
        rule: rule,
        selector: 'unknown',
        error: error.message
      });
    }
  }
  
  return results;
}