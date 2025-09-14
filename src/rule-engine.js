/**
 * 书源规则解析引擎
 * 整合所有选择器和运算符，提供统一的解析接口
 */

import { cssSelector, cssContainsSelector } from './selectors/css.js';
import { jsonSelector } from './selectors/json.js';
import { regexSelector } from './selectors/regex.js';
import { jsSelector } from './selectors/js.js';
import { textSelector, quotedTextSelector } from './selectors/text.js';
import { fallbackOperator, parseFallbackRule } from './operators/fallback.js';
import { concatOperator, parseConcatRule } from './operators/concat.js';
import { regexCleanOperator, parseCleanRule } from './operators/regex-clean.js';
import { isEmpty, RuleParseError } from './types.js';

/**
 * 书源规则解析引擎
 */
export class RuleEngine {
  constructor(options = {}) {
    this.options = {
      enableJS: true,
      enableXPath: true,
      timeout: 5000,
      maxDepth: 10,
      ...options
    };
  }

  /**
   * 解析规则
   * @param {any} source - 数据源
   * @param {string} rule - 规则字符串
   * @param {Object} context - 上下文
   * @returns {ParseResult} 解析结果
   */
  parse(source, rule, context = {}) {
    try {
      return this.parseRule(source, rule, context);
    } catch (error) {
      throw new RuleParseError(
        `规则解析失败: ${error.message}`,
        rule,
        'engine',
        error
      );
    }
  }

  /**
   * 内部规则解析方法
   * @param {any} source - 数据源
   * @param {string} rule - 规则字符串
   * @param {Object} context - 上下文
   * @returns {ParseResult} 解析结果
   */
  parseRule(source, rule, context = {}) {
    if (!rule || typeof rule !== 'string') {
      throw new Error('规则不能为空');
    }

    // 检查是否为回退规则
    if (rule.includes('||')) {
      return this.parseFallbackRule(source, rule, context);
    }

    // 检查是否为拼接规则
    if (rule.includes('&&')) {
      return this.parseConcatRule(source, rule, context);
    }

    // 检查是否为正则净化规则
    if (rule.includes('##')) {
      return this.parseCleanRule(source, rule, context);
    }

    // 解析单个选择器
    return this.parseSingleSelector(source, rule, context);
  }

  /**
   * 解析单个选择器
   * @param {any} source - 数据源
   * @param {string} rule - 规则字符串
   * @param {Object} context - 上下文
   * @returns {ParseResult} 解析结果
   */
  parseSingleSelector(source, rule, context = {}) {
    // 首先检查是否是@text:选择器，如果是则不trim整个规则
    const isTextSelector = rule.trim().startsWith('@text:');
    const workingRule = isTextSelector ? rule : rule.trim();
    
    // 对于非@text选择器，继续使用trimmed规则进行后续判断
    const trimmedRule = workingRule.trim();

    // CSS 选择器
    if (trimmedRule.startsWith('@css:')) {
      const selector = trimmedRule.substring(5);
      if (selector.includes(':contains(')) {
        return cssContainsSelector(source, selector, context);
      } else {
        return cssSelector(source, selector, context);
      }
    }

    // XPath 选择器
    if (trimmedRule.startsWith('@XPath:')) {
      const selector = trimmedRule.substring(7);
      // 这里需要导入 XPath 选择器，暂时返回模拟结果
      return {
        success: false,
        data: null,
        rule: trimmedRule,
        selector: 'xpath',
        error: 'XPath selector not implemented in this test'
      };
    }

    // JSON 选择器
    if (trimmedRule.startsWith('@json:')) {
      const selector = trimmedRule.substring(6);
      return jsonSelector(source, selector, context);
    }

    // 正则选择器
    if (trimmedRule.startsWith('@regex:')) {
      const selector = trimmedRule.substring(7);
      return regexSelector(source, selector, context);
    }

    // JavaScript 选择器
    if (trimmedRule.startsWith('@js:')) {
      if (!this.options.enableJS) {
        throw new Error('JavaScript 选择器已禁用');
      }
      const selector = trimmedRule.substring(4);
      return jsSelector(source, selector, context, this.options);
    }

    // Text 选择器
    if (trimmedRule.startsWith('@text:')) {
      const text = workingRule.substring(6);
      // 检查是否有引号包围
      if ((text.startsWith('"') && text.endsWith('"')) || 
          (text.startsWith("'") && text.endsWith("'"))) {
        return quotedTextSelector(source, text, context, this.options);
      } else {
        return textSelector(source, text, context, this.options);
      }
    }

    // 默认为 CSS 选择器
    if (trimmedRule.includes(':contains(')) {
      return cssContainsSelector(source, trimmedRule, context);
    } else {
      return cssSelector(source, trimmedRule, context);
    }
  }

  /**
   * 解析回退规则
   * @param {any} source - 数据源
   * @param {string} rule - 规则字符串
   * @param {Object} context - 上下文
   * @returns {ParseResult} 解析结果
   */
  parseFallbackRule(source, rule, context = {}) {
    const rules = parseFallbackRule(rule);
    const selectors = rules.map(r => ({
      rule: r,
      execute: (src, ctx, opts) => this.parseRule(src, r, ctx)
    }));

    return fallbackOperator(selectors, source, context, this.options);
  }

  /**
   * 解析拼接规则
   * @param {any} source - 数据源
   * @param {string} rule - 规则字符串
   * @param {Object} context - 上下文
   * @returns {ParseResult} 解析结果
   */
  parseConcatRule(source, rule, context = {}) {
    const rules = parseConcatRule(rule);
    const selectors = rules.map(r => ({
      rule: r,
      execute: (src, ctx, opts) => this.parseRule(src, r, ctx)
    }));

    return concatOperator(selectors, source, context, this.options);
  }

  /**
   * 解析正则净化规则
   * @param {any} source - 数据源
   * @param {string} rule - 规则字符串
   * @param {Object} context - 上下文
   * @returns {ParseResult} 解析结果
   */
  parseCleanRule(source, rule, context = {}) {
    // 分离选择器和净化规则
    const parts = rule.split('##');
    if (parts.length < 3) {
      throw new Error('无效的净化规则格式');
    }

    const selectorPart = parts[0];
    const cleanRule = `##${parts[1]}##${parts.slice(2).join('##')}`;

    // 先执行选择器
    const selectorResult = this.parseSingleSelector(source, selectorPart, context);
    
    if (!selectorResult.success || isEmpty(selectorResult.data)) {
      return selectorResult;
    }

    // 然后执行净化
    const { pattern, replacement } = parseCleanRule(cleanRule);
    return regexCleanOperator(selectorResult.data, pattern, replacement, this.options);
  }

  /**
   * 批量解析多个规则
   * @param {any} source - 数据源
   * @param {Object} rules - 规则对象 { key: rule, ... }
   * @param {Object} context - 上下文
   * @returns {Object} 解析结果对象
   */
  parseBatch(source, rules, context = {}) {
    const results = {};
    const errors = [];

    for (const [key, rule] of Object.entries(rules)) {
      try {
        results[key] = this.parse(source, rule, context);
      } catch (error) {
        errors.push({
          key: key,
          rule: rule,
          error: error.message
        });
        results[key] = {
          success: false,
          data: null,
          rule: rule,
          selector: 'unknown',
          error: error.message
        };
      }
    }

    return {
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: Object.values(results).filter(r => r.success).length,
      totalCount: Object.keys(rules).length
    };
  }

  /**
   * 验证规则语法
   * @param {string} rule - 规则字符串
   * @returns {Object} 验证结果
   */
  validateRule(rule) {
    const errors = [];
    const warnings = [];

    if (!rule || typeof rule !== 'string') {
      errors.push('规则不能为空');
      return { valid: false, errors, warnings };
    }

    try {
      // 尝试解析规则
      this.parse('<div>test</div>', rule);
      return { valid: true, errors, warnings };
    } catch (error) {
      errors.push(error.message);
      return { valid: false, errors, warnings };
    }
  }
}