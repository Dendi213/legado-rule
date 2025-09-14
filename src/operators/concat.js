/**
 * 字段拼接运算符
 * 实现 && 操作符，将多个选择器结果连接
 */

import { isEmpty, RuleParseError } from '../types.js';

/**
 * 字段拼接运算符
 * 执行多个选择器并将结果连接
 * @param {Array} selectors - 选择器函数数组
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function concatOperator(selectors, source, context = {}, options = {}) {
  const { separator = '', ignoreEmpty = true } = options;
  const results = [];
  const errors = [];
  const rules = [];
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    rules.push(selector.rule || 'unknown');
    
    try {
      // 执行选择器
      const result = selector.execute(source, context, options);
      
      if (result.success && !isEmpty(result.data)) {
        // 处理结果数据
        const processedData = processDataForConcat(result.data, result);
        results.push(processedData);
      } else if (!ignoreEmpty) {
        // 不忽略空值，添加空字符串
        results.push('');
        errors.push({
          rule: selector.rule || 'unknown',
          error: 'empty result',
          index: i
        });
      } else {
        // 忽略空值，记录错误但继续
        errors.push({
          rule: selector.rule || 'unknown',
          error: 'empty result (ignored)',
          index: i
        });
      }
      
    } catch (error) {
      errors.push({
        rule: selector.rule || 'unknown',
        error: error.message,
        index: i
      });
      
      if (!ignoreEmpty) {
        results.push('');
      }
    }
  }
  
  // 拼接结果
  const finalResult = results.join(separator);
  
  return {
    success: !isEmpty(finalResult),
    data: finalResult,
    rule: rules.join(' && '),
    selector: 'concat',
    errors: errors.length > 0 ? errors : undefined,
    processedCount: results.length
  };
}

/**
 * 处理数据以便拼接
 * @param {any} data - 原始数据
 * @param {Object} result - 选择器执行结果对象（包含selector类型信息）
 * @returns {string} 处理后的字符串
 */
function processDataForConcat(data, result = {}) {
  if (data === null || data === undefined) {
    return '';
  } else if (typeof data === 'string') {
    // 对于text选择器，保留原始空格，对其他选择器进行trim
    if (result.selector === 'text') {
      return data;
    }
    return data.trim();
  } else if (Array.isArray(data)) {
    // 数组，取第一个元素或拼接所有元素
    if (data.length > 0) {
      const firstElement = String(data[0]);
      return result.selector === 'text' ? firstElement : firstElement.trim();
    }
    return '';
  } else if (typeof data === 'object') {
    // 对象，转换为 JSON 字符串
    return JSON.stringify(data);
  } else {
    const stringData = String(data);
    return result.selector === 'text' ? stringData : stringData.trim();
  }
}

/**
 * 解析拼接规则字符串（拼接符必须是"单个空格 + && + 单个空格"）
 * 规则：
 *  - 分隔：仅在字符串字面量之外的 " && " 处分割
 *  - 合法性校验：
 *      1) 任一侧无空格（如 "a&& b"、"a &&b"、"a&&b"）=> 抛错
 *      2) 两侧均为多个空格（如 "a  &&  b"）=> 抛错
 *      3) 允许仅一侧出现多个空格，它们归属到相邻段落（便于保留 @text: 的尾部空格）
 *  - 字符串字面量：支持单双引号与转义（"([^"\\]|\\.)*"、'([^'\\]|\\.)*'）
 *  - @text: 段落若存在"有意义的尾部空格"，予以保留（仅去前导空格）
 * @param {string} ruleString
 * @returns {string[]}
 */
export function parseConcatRule(ruleString) {
  if (typeof ruleString !== 'string') {
    throw new TypeError('ruleString 必须是字符串');
  }

  // ---------- 第一阶段：合法性校验（忽略字符串内的 &&） ----------
  // 说明：交替匹配【字符串】或【裸 &&】。遇到裸 && 时按上下文空格数量判断合法性。
  const checkRE = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|&&/g;
  let m;
  while ((m = checkRE.exec(ruleString)) !== null) {
    const token = m[0];
    if (token !== '&&') continue; // 跳过字符串匹配结果

    const andIndex = m.index;              // && 的起始位置
    const afterAnd = checkRE.lastIndex;    // && 之后的位置

    // 计算 && 左右连续空格数（仅统计空格字符，不含制表符）
    let leftSpaces = 0;
    for (let i = andIndex - 1; i >= 0 && ruleString[i] === ' '; i--) leftSpaces++;

    let rightSpaces = 0;
    for (let i = afterAnd; i < ruleString.length && ruleString[i] === ' '; i++) rightSpaces++;

    // 判定：
    // 1) 任一侧没有空格 => 非法
    // 2) 两侧均为多个空格（>=2） => 非法（对应你的"多个空格的&&"）
    // 3) 其他情况（如左2右1、左1右2） => 合法，额外空格归属段落
    if (leftSpaces === 0 || rightSpaces === 0 || (leftSpaces >= 2 && rightSpaces >= 2)) {
      throw new SyntaxError('非法操作符 "&&"：必须使用单个空格包裹的 " && "');
    }
  }

  // ---------- 第二阶段：实际分割（忽略字符串内的 " && "） ----------
  const splitRE = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'| && /g;

  const rules = [];
  let hasDelimiter = false;
  let lastIndex = 0;
  let match;

  while ((match = splitRE.exec(ruleString)) !== null) {
    const token = match[0];

    if (token === ' && ') {
      hasDelimiter = true;

      // 取 [lastIndex, 分隔符起点) 作为一个段
      const segment = ruleString.slice(lastIndex, match.index);
      pushSegment(segment);
      lastIndex = splitRE.lastIndex; // 跳过分隔符
    } else {
      // 命中字符串字面量：整体跳过（不分割）
      // 同时将字面量之前的常规文本并入拼接（放到尾部统一处理）
      continue;
    }
  }

  // 收尾段
  const tail = ruleString.slice(lastIndex);
  pushSegment(tail);

  // 空段校验
  if (hasDelimiter && rules.some(seg => seg.length === 0)) {
    throw new SyntaxError('语法错误：拼接符 " && " 两侧不能为空');
  }

  return rules;

  /**
   * 入栈段落：
   * - 默认 trim
   * - 若 trim 后以 @text: 开头，且原段确有"尾部空格"，则仅去前导空格，保留尾部空格
   * @param {string} seg
   */
  function pushSegment(seg) {
    const trimmed = seg.trim();

    // 保留 @text: 的"尾部空格"
    if (/^@text:/.test(trimmed) && seg !== trimmed && /\s+$/.test(seg)) {
      rules.push(seg.replace(/^\s+/, '')); // 去前导空格，保留尾部空格
    } else {
      rules.push(trimmed);
    }
  }
}

/**
 * 智能拼接运算符（支持不同的拼接策略）
 * @param {Array} selectors - 选择器函数数组
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function smartConcatOperator(selectors, source, context = {}, options = {}) {
  const {
    strategy = 'join', // 'join', 'template', 'custom'
    separator = ' ',
    template = null,
    customJoiner = null,
    ignoreEmpty = true,
    trimResults = true
  } = options;
  
  const results = [];
  const errors = [];
  const rules = [];
  
  // 执行所有选择器
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    rules.push(selector.rule || 'unknown');
    
    try {
      const result = selector.execute(source, context, options);
      
      if (result.success && !isEmpty(result.data)) {
        let processedData = processDataForConcat(result.data);
        if (trimResults) {
          processedData = processedData.trim();
        }
        results.push(processedData);
      } else if (!ignoreEmpty) {
        results.push('');
      }
      
    } catch (error) {
      errors.push({ rule: selector.rule, error: error.message, index: i });
      if (!ignoreEmpty) {
        results.push('');
      }
    }
  }
  
  // 根据策略拼接结果
  let finalResult;
  
  switch (strategy) {
    case 'template':
      finalResult = applyTemplate(template, results);
      break;
    case 'custom':
      finalResult = customJoiner ? customJoiner(results) : results.join(separator);
      break;
    case 'join':
    default:
      finalResult = results.join(separator);
      break;
  }
  
  return {
    success: !isEmpty(finalResult),
    data: finalResult,
    rule: rules.join(' && '),
    selector: 'smart-concat',
    strategy: strategy,
    errors: errors.length > 0 ? errors : undefined,
    processedCount: results.length
  };
}

/**
 * 应用模板拼接
 * @param {string} template - 模板字符串，使用 {0}, {1}, {2} 等占位符
 * @param {Array} results - 结果数组
 * @returns {string} 拼接后的字符串
 */
function applyTemplate(template, results) {
  if (!template) {
    return results.join(' ');
  }
  
  let result = template;
  results.forEach((value, index) => {
    const placeholder = `{${index}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  });
  
  return result;
}

/**
 * 条件拼接运算符
 * @param {Array} conditionalSelectors - 条件选择器数组
 * @param {any} source - 数据源
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function conditionalConcatOperator(conditionalSelectors, source, context = {}, options = {}) {
  const { separator = ' ', ignoreEmpty = true } = options;
  const results = [];
  const errors = [];
  const rules = [];
  
  for (let i = 0; i < conditionalSelectors.length; i++) {
    const { condition, selector, prefix = '', suffix = '' } = conditionalSelectors[i];
    rules.push(`${condition ? condition + ' ? ' : ''}${selector.rule || 'unknown'}`);
    
    try {
      // 检查条件
      if (condition) {
        // 简化条件检查，实际实现中需要更复杂的条件评估
        const conditionResult = true; // 假设条件总是为真
        if (!conditionResult) {
          continue;
        }
      }
      
      // 执行选择器
      const result = selector.execute(source, context, options);
      
      if (result.success && !isEmpty(result.data)) {
        const processedData = processDataForConcat(result.data);
        const finalData = `${prefix}${processedData}${suffix}`;
        results.push(finalData);
      } else if (!ignoreEmpty) {
        results.push('');
      }
      
    } catch (error) {
      errors.push({
        rule: selector.rule || 'unknown',
        error: error.message,
        index: i
      });
      
      if (!ignoreEmpty) {
        results.push('');
      }
    }
  }
  
  const finalResult = results.join(separator);
  
  return {
    success: !isEmpty(finalResult),
    data: finalResult,
    rule: rules.join(' && '),
    selector: 'conditional-concat',
    errors: errors.length > 0 ? errors : undefined,
    processedCount: results.length
  };
}