/**
 * CSS 选择器解析器
 * 使用 cheerio 库处理 DOM 元素选择和属性提取
 */

import * as cheerio from 'cheerio';
import { isEmpty, RuleParseError } from '../types.js';

/**
 * CSS 选择器解析器
 * @param {string|Document|Element} source - HTML 字符串或 DOM 元素
 * @param {string} selector - CSS 选择器表达式
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function cssSelector(source, selector, options = {}) {
  try {
    // 加载 HTML 内容
    const $ = typeof source === 'string' ? cheerio.load(source) : cheerio.load(source.outerHTML || source);
    
    // 解析选择器（可能包含属性提取）
    const { expression, attribute } = parseCssExpression(selector);
    
    // 执行选择器
    const elements = $(expression);
    
    if (elements.length === 0) {
      return {
        success: false,
        data: null,
        rule: selector,
        selector: 'css'
      };
    }
    
    // 提取结果
    let result = extractCssResult(elements, attribute, $);
    
    return {
      success: !isEmpty(result),
      data: result,
      rule: selector,
      selector: 'css'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `CSS选择器解析失败: ${error.message}`,
      selector,
      'css',
      error
    );
  }
}

/**
 * 解析 CSS 表达式，分离选择器和属性
 * @param {string} expression - CSS 表达式 (如: "img@src", ".title@text")
 * @returns {Object} { expression, attribute }
 */
function parseCssExpression(expression) {
  const atIndex = expression.lastIndexOf('@');
  
  if (atIndex === -1) {
    // 没有属性，默认返回元素本身
    return {
      expression: expression,
      attribute: null
    };
  }
  
  return {
    expression: expression.substring(0, atIndex),
    attribute: expression.substring(atIndex + 1)
  };
}

/**
 * 从 CSS 选择器结果中提取数据
 * @param {Object} elements - cheerio 元素集合
 * @param {string} attribute - 属性名
 * @param {Object} $ - cheerio 实例
 * @returns {string|string[]} 提取的结果
 */
function extractCssResult(elements, attribute, $) {
  const results = [];
  
  elements.each((index, element) => {
    const $el = $(element);
    let value = null;
    
    if (!attribute) {
      // 没有指定属性，返回元素的 HTML
      value = $el.html();
    } else if (attribute === 'text') {
      // 提取文本内容
      value = $el.text().trim();
    } else if (attribute === 'html') {
      // 提取 HTML 内容
      value = $el.html();
    } else if (attribute === 'outerHTML') {
      // 提取外部 HTML
      value = $.html($el);
    } else {
      // 提取指定属性
      value = $el.attr(attribute);
    }
    
    if (!isEmpty(value)) {
      results.push(value);
    }
  });
  
  // 如果只有一个结果，返回字符串；多个结果返回数组
  return results.length === 1 ? results[0] : results;
}

/**
 * 处理 CSS 选择器的条件过滤（:contains）
 * @param {string|Document|Element} source - 数据源
 * @param {string} selector - 包含 :contains 的选择器
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function cssContainsSelector(source, selector, options = {}) {
  try {
    // 匹配 :contains() 语法
    const containsMatch = selector.match(/^(.+):contains\((.+?)\)(.*)$/);
    
    if (!containsMatch) {
      // 不包含 :contains，使用普通 CSS 选择器
      return cssSelector(source, selector, options);
    }
    
    const [, baseSelector, containsText, afterContains] = containsMatch;
    const $ = typeof source === 'string' ? cheerio.load(source) : cheerio.load(source.outerHTML || source);
    
    // 首先选择基础元素
    const baseElements = $(baseSelector);
    const filteredElements = baseElements.filter((index, element) => {
      const $el = $(element);
      return $el.text().includes(containsText.replace(/['"]/g, ''));
    });
    
    if (filteredElements.length === 0) {
      return {
        success: false,
        data: null,
        rule: selector,
        selector: 'css'
      };
    }
    
    // 如果有后续选择器，继续处理
    if (afterContains) {
      const { expression, attribute } = parseCssExpression(afterContains);
      if (expression) {
        // 在过滤后的元素中继续选择
        const finalElements = filteredElements.find(expression);
        return {
          success: finalElements.length > 0,
          data: extractCssResult(finalElements, attribute, $),
          rule: selector,
          selector: 'css'
        };
      } else if (attribute) {
        // 直接提取属性
        return {
          success: true,
          data: extractCssResult(filteredElements, attribute, $),
          rule: selector,
          selector: 'css'
        };
      }
    }
    
    // 默认返回过滤后的元素
    return {
      success: true,
      data: extractCssResult(filteredElements, null, $),
      rule: selector,
      selector: 'css'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `CSS :contains 选择器解析失败: ${error.message}`,
      selector,
      'css',
      error
    );
  }
}