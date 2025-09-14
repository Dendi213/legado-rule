/**
 * 回退机制运算符
 * 实现 || 操作符，提供多级容错保障
 */

import { isEmpty, RuleParseError } from '../types.js';

/**
 * 回退机制运算符
 * 按顺序执行多个选择器，直到获得非空结果
 * @param {Array} selectors - 选择器函数数组
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function fallbackOperator(selectors, source, context = {}, options = {}) {
  const errors = [];
  const rules = [];
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    rules.push(selector.rule || 'unknown');
    
    try {
      // 执行选择器
      const result = selector.execute(source, context, options);
      
      // 检查结果是否有效
      if (result.success && !isEmpty(result.data)) {
        return {
          success: true,
          data: result.data,
          rule: rules.join(' || '),
          selector: 'fallback',
          usedRule: selector.rule || 'unknown',
          fallbackIndex: i
        };
      } else {
        // 记录空结果
        errors.push({
          rule: selector.rule || 'unknown',
          error: 'empty result',
          index: i
        });
      }
      
    } catch (error) {
      // 记录执行错误
      errors.push({
        rule: selector.rule || 'unknown',
        error: error.message,
        index: i
      });
    }
  }
  
  // 所有选择器都失败，返回最后一个选择器的结果作为兜底
  const lastSelector = selectors[selectors.length - 1];
  try {
    const lastResult = lastSelector.execute(source, context, options);
    return {
      success: false,
      data: lastResult.data || null,
      rule: rules.join(' || '),
      selector: 'fallback',
      error: `所有选择器都失败: ${errors.map(e => `[${e.index}] ${e.rule}: ${e.error}`).join('; ')}`,
      usedRule: lastSelector.rule || 'unknown',
      fallbackIndex: selectors.length - 1
    };
  } catch (finalError) {
    return {
      success: false,
      data: null,
      rule: rules.join(' || '),
      selector: 'fallback',
      error: `所有选择器都失败，最后兜底也失败: ${finalError.message}`
    };
  }
}

/**
 * 解析回退规则字符串
 * @param {string} ruleString - 规则字符串 (如: "@css:h1@text || @XPath://title/text() || @js:'未知书名'")
 * @returns {Array} 解析后的规则数组
 */
export function parseFallbackRule(ruleString) {
  // 按 || 分割规则，但要考虑字符串中的 ||
  const rules = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let i = 0;
  
  while (i < ruleString.length) {
    const char = ruleString[i];
    const nextChar = ruleString[i + 1];
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = '';
      current += char;
    } else if (!inString && char === '|' && nextChar === '|') {
      // 找到分隔符
      rules.push(current.trim());
      current = '';
      i++; // 跳过下一个 |
    } else {
      current += char;
    }
    
    i++;
  }
  
  // 添加最后一个规则
  if (current.trim()) {
    rules.push(current.trim());
  }
  
  return rules;
}

/**
 * 验证回退规则的有效性
 * @param {Array} rules - 规则数组
 * @returns {Object} 验证结果
 */
export function validateFallbackRules(rules) {
  const errors = [];
  const warnings = [];
  
  if (rules.length === 0) {
    errors.push('回退规则不能为空');
    return { valid: false, errors, warnings };
  }
  
  if (rules.length === 1) {
    warnings.push('回退规则只有一个选择器，建议至少提供两个选择器以实现容错');
  }
  
  // 检查规则格式
  rules.forEach((rule, index) => {
    if (!rule || typeof rule !== 'string') {
      errors.push(`规则 ${index + 1} 格式无效`);
      return;
    }
    
    // 检查是否包含支持的前缀
    const supportedPrefixes = ['@css:', '@XPath:', '@json:', '@regex:', '@js:'];
    const hasPrefix = supportedPrefixes.some(prefix => rule.startsWith(prefix));
    
    if (!hasPrefix && !rule.match(/^[a-zA-Z0-9_\-\.#\[\]@:]+/)) {
      warnings.push(`规则 ${index + 1} "${rule}" 可能不是有效的选择器`);
    }
  });
  
  // 检查最后一个规则是否为兜底规则
  const lastRule = rules[rules.length - 1];
  if (lastRule.startsWith('@js:') && lastRule.includes("'")) {
    // 可能是字符串兜底，这是好的
  } else {
    warnings.push('建议最后一个规则提供静态兜底值（如 @js:\'默认值\'）');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 创建回退选择器执行器
 * @param {string} rule - 单个规则字符串
 * @returns {Object} 选择器执行器对象
 */
export function createFallbackSelector(rule) {
  return {
    rule: rule,
    execute: async (source, context = {}, options = {}) => {
      // 这里需要根据规则前缀调用相应的选择器
      // 为了简化，这里返回一个模拟的执行器
      // 实际实现中需要导入并调用相应的选择器函数
      
      if (rule.startsWith('@css:')) {
        // 调用 CSS 选择器
        const selector = rule.substring(5);
        return { success: false, data: null, rule, selector: 'css' };
      } else if (rule.startsWith('@XPath:')) {
        // 调用 XPath 选择器
        const selector = rule.substring(7);
        return { success: false, data: null, rule, selector: 'xpath' };
      } else if (rule.startsWith('@json:')) {
        // 调用 JSON 选择器
        const selector = rule.substring(6);
        return { success: false, data: null, rule, selector: 'json' };
      } else if (rule.startsWith('@regex:')) {
        // 调用正则选择器
        const selector = rule.substring(7);
        return { success: false, data: null, rule, selector: 'regex' };
      } else if (rule.startsWith('@js:')) {
        // 调用 JS 选择器
        const selector = rule.substring(4);
        return { success: false, data: null, rule, selector: 'js' };
      } else {
        // 默认为 CSS 选择器
        return { success: false, data: null, rule, selector: 'css' };
      }
    }
  };
}

/**
 * 高级回退机制：支持条件回退
 * @param {Array} conditionalSelectors - 条件选择器数组
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function conditionalFallbackOperator(conditionalSelectors, source, context = {}, options = {}) {
  const errors = [];
  const rules = [];
  
  for (let i = 0; i < conditionalSelectors.length; i++) {
    const { condition, selector } = conditionalSelectors[i];
    rules.push(`${condition ? condition + ' ? ' : ''}${selector.rule || 'unknown'}`);
    
    try {
      // 如果有条件，先检查条件
      if (condition) {
        // 这里需要评估条件表达式
        // 简化实现，假设条件总是为真
        const conditionResult = true;
        if (!conditionResult) {
          continue;
        }
      }
      
      // 执行选择器
      const result = selector.execute(source, context, options);
      
      if (result.success && !isEmpty(result.data)) {
        return {
          success: true,
          data: result.data,
          rule: rules.join(' || '),
          selector: 'conditional-fallback',
          usedRule: selector.rule || 'unknown',
          fallbackIndex: i
        };
      }
      
    } catch (error) {
      errors.push({
        rule: selector.rule || 'unknown',
        error: error.message,
        index: i
      });
    }
  }
  
  return {
    success: false,
    data: null,
    rule: rules.join(' || '),
    selector: 'conditional-fallback',
    error: `所有条件选择器都失败: ${errors.map(e => `[${e.index}] ${e.rule}: ${e.error}`).join('; ')}`
  };
}