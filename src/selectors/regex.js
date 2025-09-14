/**
 * 正则选择器解析器
 * 使用正则表达式进行模式匹配和内容提取
 */

import { isEmpty, RuleParseError } from '../types.js';

/**
 * 正则选择器解析器
 * @param {string} source - 输入字符串
 * @param {string} pattern - 正则表达式模式
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function regexSelector(source, pattern, options = {}) {
  try {
    // 准备输入字符串
    const text = prepareTextSource(source);
    
    // 解析操作类型和模式
    const operation = parseRegexOperation(pattern);
    
    // 根据操作类型执行相应功能
    switch (operation.type) {
      case 'replace':
        return regexReplaceSelector(text, operation.pattern, operation.replacement, 
          { ...options, global: operation.global });
      case 'split':
        return regexSplitSelector(text, operation.pattern, options);
      case 'test':
        return regexTestSelector(text, operation.pattern, options);
      case 'match':
      default:
        // 执行正则匹配
        const { regex, flags } = parseRegexPattern(operation.pattern, operation.global);
        const result = executeRegexMatch(text, regex, flags, options);
        
        if (isEmpty(result)) {
          return {
            success: false,
            data: null,
            rule: pattern,
            selector: 'regex'
          };
        }
        
        return {
          success: true,
          data: result,
          rule: pattern,
          selector: 'regex'
        };
    }
    
  } catch (error) {
    throw new RuleParseError(
      `正则选择器解析失败: ${error.message}`,
      pattern,
      'regex',
      error
    );
  }
}

/**
 * 准备用于正则匹配的文本源
 * @param {any} source - 数据源
 * @returns {string} 文本字符串
 */
function prepareTextSource(source) {
  if (typeof source === 'string') {
    return source;
  } else if (source && typeof source.toString === 'function') {
    return source.toString();
  } else {
    return String(source);
  }
}

/**
 * 解析正则表达式操作
 * @param {string} pattern - 操作模式字符串
 * @returns {Object} { type, pattern, global, replacement }
 */
function parseRegexOperation(pattern) {
  // 测试操作: pattern:test
  if (pattern.includes(':test')) {
    const [regexPattern] = pattern.split(':test');
    return {
      type: 'test',
      pattern: regexPattern,
      global: false
    };
  }
  
  // 分割操作: pattern:split
  if (pattern.includes(':split')) {
    const [regexPattern] = pattern.split(':split');
    return {
      type: 'split',
      pattern: regexPattern,
      global: false
    };
  }
  
  // 替换操作: pattern:replace:replacement 或 g:pattern:replace:replacement
  if (pattern.includes(':replace:')) {
    const parts = pattern.split(':replace:');
    if (parts.length >= 2) {
      const regexPart = parts[0];
      const replacement = parts[1];
      
      // 检查是否包含全局标志
      if (regexPart.startsWith('g:')) {
        return {
          type: 'replace',
          pattern: regexPart.substring(2),
          replacement: replacement,
          global: true
        };
      } else {
        return {
          type: 'replace',
          pattern: regexPart,
          replacement: replacement,
          global: false
        };
      }
    }
  }
  
  // 全局匹配: g:pattern
  if (pattern.startsWith('g:')) {
    return {
      type: 'match',
      pattern: pattern.substring(2),
      global: true
    };
  }
  
  // 默认匹配操作
  return {
    type: 'match',
    pattern: pattern,
    global: false
  };
}

/**
 * 解析正则表达式模式
 * @param {string} pattern - 正则模式字符串
 * @param {boolean} forceGlobal - 是否强制全局匹配
 * @returns {Object} { regex: string, flags: string }
 */
function parseRegexPattern(pattern, forceGlobal = false) {
  // 检查是否包含标志位 (如: /pattern/flags)
  const flagsMatch = pattern.match(/^\/(.+)\/([gimsy]*)$/);
  
  if (flagsMatch) {
    let flags = flagsMatch[2] || '';
    if (forceGlobal && !flags.includes('g')) {
      flags += 'g';
    }
    return {
      regex: flagsMatch[1],
      flags: flags
    };
  } else {
    // 没有包装的正则表达式
    const flags = forceGlobal ? 'g' : '';
    return {
      regex: pattern,
      flags: flags
    };
  }
}

/**
 * 执行正则匹配
 * @param {string} text - 文本内容
 * @param {string} regexStr - 正则表达式字符串
 * @param {string} flags - 正则标志位
 * @param {Object} options - 选项
 * @returns {string|string[]|null} 匹配结果
 */
function executeRegexMatch(text, regexStr, flags, options = {}) {
  const regex = new RegExp(regexStr, flags);
  const isGlobal = flags.includes('g');
  
  if (isGlobal) {
    // 全局匹配，返回所有匹配结果
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(extractMatchGroups(match, options));
    }
    
    return matches.length === 0 ? null : matches;
  } else {
    // 单次匹配
    const match = regex.exec(text);
    return match ? extractMatchGroups(match, options) : null;
  }
}

/**
 * 提取匹配分组
 * @param {RegExpExecArray} match - 正则匹配结果
 * @param {Object} options - 选项
 * @returns {string|string[]} 提取的内容
 */
function extractMatchGroups(match, options = {}) {
  const { groupIndex = null, allGroups = false } = options;
  
  if (allGroups) {
    // 返回所有捕获组（不包括第0个完整匹配）
    return match.slice(1);
  } else if (groupIndex !== null && groupIndex >= 0 && groupIndex < match.length) {
    // 返回指定索引的捕获组
    return match[groupIndex];
  } else if (match.length > 1) {
    // 有捕获组，返回第一个捕获组
    return match[1];
  } else {
    // 没有捕获组，返回完整匹配
    return match[0];
  }
}

/**
 * 正则替换选择器
 * @param {string} source - 输入字符串
 * @param {string} pattern - 正则表达式模式
 * @param {string} replacement - 替换字符串
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function regexReplaceSelector(source, pattern, replacement, options = {}) {
  try {
    const text = prepareTextSource(source);
    
    // 检查是否为全局替换（来自调用者）
    const isGlobal = options.global || false;
    const { regex, flags } = parseRegexPattern(pattern, isGlobal);
    
    const regexObj = new RegExp(regex, flags);
    const result = text.replace(regexObj, replacement);
    
    return {
      success: true,
      data: result,
      rule: `${pattern} -> ${replacement}`,
      selector: 'regex'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `正则替换选择器解析失败: ${error.message}`,
      `${pattern} -> ${replacement}`,
      'regex',
      error
    );
  }
}

/**
 * 正则分割选择器
 * @param {string} source - 输入字符串
 * @param {string} pattern - 分割正则表达式
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function regexSplitSelector(source, pattern, options = {}) {
  try {
    const text = prepareTextSource(source);
    const { regex, flags } = parseRegexPattern(pattern);
    
    const regexObj = new RegExp(regex, flags);
    const result = text.split(regexObj).filter(part => !isEmpty(part.trim()));
    
    return {
      success: result.length > 0,
      data: result.length === 1 ? result[0] : result,
      rule: `split(${pattern})`,
      selector: 'regex'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `正则分割选择器解析失败: ${error.message}`,
      `split(${pattern})`,
      'regex',
      error
    );
  }
}

/**
 * 正则验证选择器
 * @param {string} source - 输入字符串
 * @param {string} pattern - 验证正则表达式
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function regexTestSelector(source, pattern, options = {}) {
  try {
    const text = prepareTextSource(source);
    const { regex, flags } = parseRegexPattern(pattern);
    
    const regexObj = new RegExp(regex, flags);
    const isValid = regexObj.test(text);
    
    return {
      success: true,
      data: isValid,
      rule: `test(${pattern})`,
      selector: 'regex'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `正则验证选择器解析失败: ${error.message}`,
      `test(${pattern})`,
      'regex',
      error
    );
  }
}

/**
 * 正则多模式选择器（支持多个正则表达式）
 * @param {string} source - 输入字符串
 * @param {string[]} patterns - 正则表达式模式数组
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function regexMultiPatternSelector(source, patterns, options = {}) {
  const text = prepareTextSource(source);
  const errors = [];
  
  for (const pattern of patterns) {
    try {
      const result = regexSelector(text, pattern, options);
      if (result.success && !isEmpty(result.data)) {
        return result;
      }
    } catch (error) {
      errors.push({ pattern, error: error.message });
    }
  }
  
  // 所有模式都失败
  return {
    success: false,
    data: null,
    rule: patterns.join(' || '),
    selector: 'regex',
    error: `所有模式都失败: ${errors.map(e => `${e.pattern}: ${e.error}`).join('; ')}`
  };
}