/**
 * 正则净化运算符
 * 实现 ##pattern##replacement 语法，进行内容清理和替换
 */

import { isEmpty, RuleParseError } from '../types.js';

/**
 * 正则净化运算符
 * @param {string} text - 输入文本
 * @param {string} pattern - 正则模式
 * @param {string} replacement - 替换内容
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function regexCleanOperator(text, pattern, replacement = '', options = {}) {
  try {
    const result = cleanText(text, pattern, replacement, options);
    
    return {
      success: !isEmpty(result),
      data: result,
      rule: `##${pattern}##${replacement}`,
      selector: 'regex-clean'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `正则净化失败: ${error.message}`,
      `##${pattern}##${replacement}`,
      'regex-clean',
      error
    );
  }
}

/**
 * 清理文本内容
 * @param {any} input - 输入内容
 * @param {string} pattern - 正则模式
 * @param {string} replacement - 替换内容
 * @param {Object} options - 选项
 * @returns {string} 清理后的文本
 */
function cleanText(input, pattern, replacement, options = {}) {
  // 转换为字符串
  let text = convertToString(input);
  
  if (isEmpty(text)) {
    return text;
  }
  
  // 解析正则模式
  const regex = parseCleanPattern(pattern, options);
  
  // 执行替换
  return text.replace(regex, replacement);
}

/**
 * 将输入转换为字符串
 * @param {any} input - 输入内容
 * @returns {string} 字符串
 */
function convertToString(input) {
  if (typeof input === 'string') {
    return input;
  } else if (Array.isArray(input)) {
    return input.join(' ');
  } else if (input === null || input === undefined) {
    return '';
  } else {
    return String(input);
  }
}

/**
 * 解析清理模式
 * @param {string} pattern - 模式字符串
 * @param {Object} options - 选项
 * @returns {RegExp} 正则表达式对象
 */
function parseCleanPattern(pattern, options = {}) {
  const { 
    flags = 'g',
    caseSensitive = false,
    multiline = false,
    dotAll = false
  } = options;
  
  let finalFlags = flags;
  
  // 添加额外标志
  if (!caseSensitive && !finalFlags.includes('i')) {
    finalFlags += 'i';
  }
  if (multiline && !finalFlags.includes('m')) {
    finalFlags += 'm';
  }
  if (dotAll && !finalFlags.includes('s')) {
    finalFlags += 's';
  }
  
  try {
    return new RegExp(pattern, finalFlags);
  } catch (error) {
    throw new Error(`无效的正则表达式: ${pattern}`);
  }
}

/**
 * 解析净化规则字符串
 * @param {string} ruleString - 净化规则 (如: "##\\s{2,}## " 或 "##[0-9]+##")
 * @returns {Object} 解析结果 { pattern, replacement }
 */
export function parseCleanRule(ruleString) {
  // 匹配 ##pattern##replacement 格式
  const match = ruleString.match(/^##(.+?)##(.*)$/);
  
  if (!match) {
    throw new Error(`无效的净化规则格式: ${ruleString}`);
  }
  
  return {
    pattern: match[1],
    replacement: match[2]
  };
}

/**
 * 批量正则净化运算符
 * @param {string} text - 输入文本
 * @param {Array} cleanRules - 净化规则数组
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function batchRegexCleanOperator(text, cleanRules, options = {}) {
  const { stopOnError = false } = options;
  let result = convertToString(text);
  const appliedRules = [];
  const errors = [];
  
  for (let i = 0; i < cleanRules.length; i++) {
    const rule = cleanRules[i];
    
    try {
      const { pattern, replacement } = typeof rule === 'string' ? 
        parseCleanRule(rule) : rule;
      
      const cleanResult = cleanText(result, pattern, replacement, options);
      result = cleanResult;
      appliedRules.push(`##${pattern}##${replacement}`);
      
    } catch (error) {
      errors.push({
        rule: rule,
        error: error.message,
        index: i
      });
      
      if (stopOnError) {
        break;
      }
    }
  }
  
  return {
    success: true,
    data: result,
    rule: appliedRules.join(' | '),
    selector: 'batch-regex-clean',
    errors: errors.length > 0 ? errors : undefined,
    appliedCount: appliedRules.length
  };
}

/**
 * 预定义净化模式
 */
export const PRESET_CLEAN_PATTERNS = {
  // 空白字符处理
  multipleSpaces: { pattern: '\\s{2,}', replacement: ' ' },
  leadingSpaces: { pattern: '^\\s+', replacement: '' },
  trailingSpaces: { pattern: '\\s+$', replacement: '' },
  allSpaces: { pattern: '\\s+', replacement: ' ' },
  
  // 换行符处理
  multipleNewlines: { pattern: '\\n{2,}', replacement: '\\n' },
  removeNewlines: { pattern: '\\n', replacement: ' ' },
  
  // HTML 标签处理
  htmlTags: { pattern: '<[^>]*>', replacement: '' },
  htmlEntities: { pattern: '&[a-zA-Z0-9#]+;', replacement: '' },
  
  // 标点符号处理
  multiplePunctuation: { pattern: '[。！？，；：]{2,}', replacement: '$1' },
  extraCommas: { pattern: '，{2,}', replacement: '，' },
  
  // 数字处理
  removeNumbers: { pattern: '\\d+', replacement: '' },
  normalizeNumbers: { pattern: '[０-９]+', replacement: '' }, // 全角数字
  
  // 特殊字符处理
  removeSpecialChars: { pattern: '[^\\w\\s\\u4e00-\\u9fa5]', replacement: '' },
  normalizePunctuation: { pattern: '["""\'\'，。！？；：]', replacement: '' },
  
  // 书籍特定清理
  removeChapterNumbers: { pattern: '第[\\d一二三四五六七八九十百千万]+[章节回集部]', replacement: '' },
  removePageNumbers: { pattern: '第?\\s*\\d+\\s*页', replacement: '' },
  removeAuthorInfo: { pattern: '作者[：:].*$', replacement: '' }
};

/**
 * 预设净化运算符
 * @param {string} text - 输入文本
 * @param {string|Array} presetNames - 预设名称或名称数组
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function presetCleanOperator(text, presetNames, options = {}) {
  const presets = Array.isArray(presetNames) ? presetNames : [presetNames];
  const cleanRules = [];
  const errors = [];
  
  for (const presetName of presets) {
    if (presetName in PRESET_CLEAN_PATTERNS) {
      cleanRules.push(PRESET_CLEAN_PATTERNS[presetName]);
    } else {
      errors.push({
        preset: presetName,
        error: 'unknown preset'
      });
    }
  }
  
  if (cleanRules.length === 0) {
    return {
      success: false,
      data: text,
      rule: `preset[${presets.join(', ')}]`,
      selector: 'preset-clean',
      error: `没有找到有效的预设: ${presets.join(', ')}`
    };
  }
  
  const result = batchRegexCleanOperator(text, cleanRules, options);
  return {
    ...result,
    rule: `preset[${presets.join(', ')}]`,
    selector: 'preset-clean',
    presetErrors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 智能净化运算符（自动检测和应用合适的净化规则）
 * @param {string} text - 输入文本
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function smartCleanOperator(text, options = {}) {
  const { 
    aggressive = false,
    preserveStructure = true,
    detectContent = true
  } = options;
  
  let input = convertToString(text);
  const appliedRules = [];
  
  if (isEmpty(input)) {
    return {
      success: true,
      data: input,
      rule: 'smart-clean',
      selector: 'smart-clean'
    };
  }
  
  // 基础清理
  const basicRules = ['leadingSpaces', 'trailingSpaces'];
  if (aggressive) {
    basicRules.push('multipleSpaces', 'multipleNewlines');
  }
  
  // 内容检测
  if (detectContent) {
    if (input.includes('<')) {
      basicRules.push('htmlTags');
      appliedRules.push('HTML tags detected');
    }
    
    if (input.includes('&')) {
      basicRules.push('htmlEntities');
      appliedRules.push('HTML entities detected');
    }
    
    if (/第[\d一二三四五六七八九十]+[章节]/.test(input)) {
      if (aggressive) {
        basicRules.push('removeChapterNumbers');
        appliedRules.push('Chapter numbers detected');
      }
    }
  }
  
  const result = presetCleanOperator(input, basicRules, options);
  
  return {
    ...result,
    rule: 'smart-clean',
    selector: 'smart-clean',
    detectedPatterns: appliedRules
  };
}