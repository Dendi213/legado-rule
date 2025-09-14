/**
 * XPath 选择器解析器
 * 使用 xpath 库和 jsdom 处理 XPath 表达式
 */

import xpath from 'xpath';
import { JSDOM } from 'jsdom';
import { isEmpty, RuleParseError } from '../types.js';

/**
 * XPath 选择器解析器
 * @param {string|Document|Element} source - HTML 字符串或 DOM 元素
 * @param {string} expression - XPath 表达式
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function xpathSelector(source, expression, options = {}) {
  try {
    // 准备 DOM 文档
    const doc = prepareDocument(source);
    
    // 执行 XPath 查询
    const result = xpath.select(expression, doc);
    
    if (isEmpty(result)) {
      return {
        success: false,
        data: null,
        rule: expression,
        selector: 'xpath'
      };
    }
    
    // 处理结果
    const extractedData = extractXPathResult(result);
    
    return {
      success: !isEmpty(extractedData),
      data: extractedData,
      rule: expression,
      selector: 'xpath'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `XPath选择器解析失败: ${error.message}`,
      expression,
      'xpath',
      error
    );
  }
}

/**
 * 准备用于 XPath 查询的 DOM 文档
 * @param {string|Document|Element} source - 数据源
 * @returns {Document} DOM 文档
 */
function prepareDocument(source) {
  if (typeof source === 'string') {
    // HTML 字符串，使用 jsdom 解析
    const dom = new JSDOM(source, {
      contentType: 'text/html',
      includeNodeLocations: false
    });
    return dom.window.document;
  } else if (source.nodeType === 9) {
    // 已经是 Document
    return source;
  } else if (source.nodeType === 1) {
    // Element，获取其所属文档
    return source.ownerDocument;
  } else {
    // 尝试转换为字符串后解析
    const dom = new JSDOM(String(source), {
      contentType: 'text/html',
      includeNodeLocations: false
    });
    return dom.window.document;
  }
}

/**
 * 从 XPath 查询结果中提取数据
 * @param {Array|Node|string|number|boolean} result - XPath 查询结果
 * @returns {string|string[]|null} 提取的数据
 */
function extractXPathResult(result) {
  if (Array.isArray(result)) {
    // 多个节点结果
    const values = result.map(node => {
      if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
        return String(node);
      } else if (node.nodeType === 1) {
        // Element 节点
        return node.textContent.trim();
      } else if (node.nodeType === 2) {
        // Attribute 节点
        return node.value;
      } else if (node.nodeType === 3) {
        // Text 节点
        return node.textContent.trim();
      } else {
        return String(node);
      }
    }).filter(value => !isEmpty(value));
    
    return values.length === 1 ? values[0] : values;
  } else if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
    // 直接返回值
    return String(result);
  } else if (result && result.nodeType) {
    // 单个节点
    if (result.nodeType === 1) {
      // Element 节点
      return result.textContent.trim();
    } else if (result.nodeType === 2) {
      // Attribute 节点
      return result.value;
    } else if (result.nodeType === 3) {
      // Text 节点
      return result.textContent.trim();
    }
  }
  
  return null;
}

/**
 * 获取元素的指定属性值
 * @param {string|Document|Element} source - 数据源
 * @param {string} elementPath - 元素的 XPath
 * @param {string} attribute - 属性名
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function xpathAttributeSelector(source, elementPath, attribute, options = {}) {
  try {
    const doc = prepareDocument(source);
    
    // 构建属性 XPath
    const attributePath = `${elementPath}/@${attribute}`;
    
    // 执行 XPath 查询
    const result = xpath.select(attributePath, doc);
    
    if (isEmpty(result)) {
      return {
        success: false,
        data: null,
        rule: attributePath,
        selector: 'xpath'
      };
    }
    
    const extractedData = extractXPathResult(result);
    
    return {
      success: !isEmpty(extractedData),
      data: extractedData,
      rule: attributePath,
      selector: 'xpath'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `XPath属性选择器解析失败: ${error.message}`,
      `${elementPath}/@${attribute}`,
      'xpath',
      error
    );
  }
}

/**
 * 获取元素的文本内容
 * @param {string|Document|Element} source - 数据源
 * @param {string} elementPath - 元素的 XPath
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function xpathTextSelector(source, elementPath, options = {}) {
  try {
    const doc = prepareDocument(source);
    
    // 构建文本 XPath
    const textPath = `${elementPath}/text()`;
    
    // 执行 XPath 查询
    const result = xpath.select(textPath, doc);
    
    if (isEmpty(result)) {
      // 尝试获取元素的所有文本内容
      const elementResult = xpath.select(elementPath, doc);
      if (!isEmpty(elementResult)) {
        const extractedData = extractXPathResult(elementResult);
        return {
          success: !isEmpty(extractedData),
          data: extractedData,
          rule: elementPath,
          selector: 'xpath'
        };
      }
      
      return {
        success: false,
        data: null,
        rule: textPath,
        selector: 'xpath'
      };
    }
    
    const extractedData = extractXPathResult(result);
    
    return {
      success: !isEmpty(extractedData),
      data: extractedData,
      rule: textPath,
      selector: 'xpath'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `XPath文本选择器解析失败: ${error.message}`,
      `${elementPath}/text()`,
      'xpath',
      error
    );
  }
}