/**
 * 属性提取运算符
 * 实现 @attr 语法，从元素中提取指定属性
 */

import { isEmpty, RuleParseError } from '../types.js';

/**
 * 属性提取运算符
 * @param {any} element - DOM 元素或数据对象
 * @param {string} attribute - 属性名
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function attributeOperator(element, attribute, options = {}) {
  try {
    const result = extractAttribute(element, attribute, options);
    
    return {
      success: !isEmpty(result),
      data: result,
      rule: `@${attribute}`,
      selector: 'attribute'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `属性提取失败: ${error.message}`,
      `@${attribute}`,
      'attribute',
      error
    );
  }
}

/**
 * 从元素中提取属性
 * @param {any} element - 元素或数据
 * @param {string} attribute - 属性名
 * @param {Object} options - 选项
 * @returns {any} 属性值
 */
function extractAttribute(element, attribute, options = {}) {
  if (!element) {
    return null;
  }
  
  // 处理数组情况
  if (Array.isArray(element)) {
    const results = element.map(item => extractAttribute(item, attribute, options))
                           .filter(value => !isEmpty(value));
    return results.length === 1 ? results[0] : results;
  }
  
  // 特殊属性处理
  switch (attribute) {
    case 'text':
      return extractText(element);
    case 'html':
      return extractHtml(element);
    case 'outerHTML':
      return extractOuterHtml(element);
    case 'innerText':
      return extractInnerText(element);
    case 'length':
      return extractLength(element);
    case 'size':
      return extractSize(element);
    default:
      return extractElementAttribute(element, attribute, options);
  }
}

/**
 * 提取文本内容
 * @param {any} element - 元素
 * @returns {string} 文本内容
 */
function extractText(element) {
  if (typeof element === 'string') {
    return element.trim();
  } else if (element && typeof element.textContent === 'string') {
    return element.textContent.trim();
  } else if (element && typeof element.innerText === 'string') {
    return element.innerText.trim();
  } else if (element && typeof element.text === 'function') {
    return element.text().trim();
  } else if (element && element.nodeType === 3) { // Text node
    return element.nodeValue.trim();
  } else {
    return String(element).trim();
  }
}

/**
 * 提取 HTML 内容
 * @param {any} element - 元素
 * @returns {string} HTML 内容
 */
function extractHtml(element) {
  if (typeof element === 'string') {
    return element;
  } else if (element && typeof element.innerHTML === 'string') {
    return element.innerHTML;
  } else if (element && typeof element.html === 'function') {
    return element.html();
  } else {
    return String(element);
  }
}

/**
 * 提取外部 HTML
 * @param {any} element - 元素
 * @returns {string} 外部 HTML
 */
function extractOuterHtml(element) {
  if (typeof element === 'string') {
    return element;
  } else if (element && typeof element.outerHTML === 'string') {
    return element.outerHTML;
  } else if (element && typeof element.parent === 'function') {
    // cheerio 元素
    return element.parent().html();
  } else {
    return String(element);
  }
}

/**
 * 提取纯文本内容
 * @param {any} element - 元素
 * @returns {string} 纯文本内容
 */
function extractInnerText(element) {
  const text = extractText(element);
  // 移除多余的空白字符
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 提取长度信息
 * @param {any} element - 元素
 * @returns {number} 长度
 */
function extractLength(element) {
  if (Array.isArray(element)) {
    return element.length;
  } else if (typeof element === 'string') {
    return element.length;
  } else if (element && typeof element.length === 'number') {
    return element.length;
  } else {
    return 0;
  }
}

/**
 * 提取大小信息
 * @param {any} element - 元素
 * @returns {number} 大小
 */
function extractSize(element) {
  if (Array.isArray(element)) {
    return element.length;
  } else if (element && typeof element.size === 'number') {
    return element.size;
  } else if (element && typeof element.length === 'number') {
    return element.length;
  } else {
    return 1;
  }
}

/**
 * 提取元素的指定属性
 * @param {any} element - 元素
 * @param {string} attribute - 属性名
 * @param {Object} options - 选项
 * @returns {any} 属性值
 */
function extractElementAttribute(element, attribute, options = {}) {
  if (!element) {
    return null;
  }
  
  // DOM 元素属性
  if (element.nodeType === 1) { // Element node
    const attrValue = element.getAttribute(attribute);
    if (attrValue !== null) {
      return attrValue;
    }
    
    // 尝试直接属性访问
    if (attribute in element) {
      return element[attribute];
    }
  }
  
  // cheerio 元素
  if (element && typeof element.attr === 'function') {
    const attrValue = element.attr(attribute);
    if (attrValue !== undefined) {
      return attrValue;
    }
  }
  
  // 对象属性访问
  if (typeof element === 'object' && element !== null) {
    if (attribute in element) {
      return element[attribute];
    }
    
    // 尝试嵌套属性访问（如 'data.title'）
    if (attribute.includes('.')) {
      return getNestedProperty(element, attribute);
    }
  }
  
  return null;
}

/**
 * 获取嵌套属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径 (如 'data.title.name')
 * @returns {any} 属性值
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return (current && typeof current === 'object') ? current[key] : undefined;
  }, obj);
}

/**
 * 批量属性提取运算符
 * @param {any} element - 元素或数据
 * @param {Array} attributes - 属性名数组
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function multiAttributeOperator(element, attributes, options = {}) {
  const { returnObject = false, ignoreEmpty = true } = options;
  const results = returnObject ? {} : [];
  const errors = [];
  
  for (const attribute of attributes) {
    try {
      const result = extractAttribute(element, attribute, options);
      
      if (!isEmpty(result) || !ignoreEmpty) {
        if (returnObject) {
          results[attribute] = result;
        } else {
          results.push(result);
        }
      }
      
    } catch (error) {
      errors.push({
        attribute: attribute,
        error: error.message
      });
    }
  }
  
  return {
    success: (returnObject ? Object.keys(results).length > 0 : results.length > 0),
    data: results,
    rule: `@[${attributes.join(', ')}]`,
    selector: 'multi-attribute',
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 条件属性提取运算符
 * @param {any} element - 元素或数据
 * @param {Array} conditionalAttributes - 条件属性数组
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function conditionalAttributeOperator(element, conditionalAttributes, options = {}) {
  const errors = [];
  
  for (let i = 0; i < conditionalAttributes.length; i++) {
    const { condition, attribute, defaultValue } = conditionalAttributes[i];
    
    try {
      // 检查条件
      if (condition) {
        // 简化条件检查
        const conditionResult = evaluateAttributeCondition(element, condition);
        if (!conditionResult) {
          continue;
        }
      }
      
      // 提取属性
      const result = extractAttribute(element, attribute, options);
      
      if (!isEmpty(result)) {
        return {
          success: true,
          data: result,
          rule: `@${attribute}`,
          selector: 'conditional-attribute',
          usedAttribute: attribute,
          conditionIndex: i
        };
      }
      
    } catch (error) {
      errors.push({
        attribute: attribute,
        error: error.message,
        index: i
      });
    }
  }
  
  // 所有条件都失败，返回默认值
  const lastCondition = conditionalAttributes[conditionalAttributes.length - 1];
  const defaultValue = lastCondition ? lastCondition.defaultValue : null;
  
  return {
    success: !isEmpty(defaultValue),
    data: defaultValue,
    rule: `conditional attributes`,
    selector: 'conditional-attribute',
    error: `所有条件属性都失败: ${errors.map(e => `[${e.index}] ${e.attribute}: ${e.error}`).join('; ')}`
  };
}

/**
 * 评估属性条件
 * @param {any} element - 元素
 * @param {string} condition - 条件表达式
 * @returns {boolean} 条件结果
 */
function evaluateAttributeCondition(element, condition) {
  // 简化实现，实际中需要更复杂的条件评估
  if (condition === 'exists') {
    return element !== null && element !== undefined;
  } else if (condition === 'hasText') {
    const text = extractText(element);
    return !isEmpty(text);
  } else if (condition === 'hasHtml') {
    const html = extractHtml(element);
    return !isEmpty(html);
  } else {
    return true; // 默认为真
  }
}