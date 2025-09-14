/**
 * JSON 选择器解析器
 * 使用 JSONPath 语法处理 JSON 数据提取
 */

import JSONPath from 'jsonpath';
import { isEmpty, RuleParseError } from '../types.js';

/**
 * JSON 选择器解析器
 * @param {string|Object} source - JSON 字符串或对象
 * @param {string} path - JSONPath 表达式
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function jsonSelector(source, path, options = {}) {
  try {
    // 准备 JSON 数据
    const jsonData = prepareJsonData(source);
    
    // 执行 JSONPath 查询
    const result = JSONPath.query(jsonData, path);
    
    if (isEmpty(result)) {
      return {
        success: false,
        data: null,
        rule: path,
        selector: 'json'
      };
    }
    
    // 处理结果
    const extractedData = extractJsonResult(result);
    
    return {
      success: !isEmpty(extractedData),
      data: extractedData,
      rule: path,
      selector: 'json'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `JSON选择器解析失败: ${error.message}`,
      path,
      'json',
      error
    );
  }
}

/**
 * 准备用于 JSONPath 查询的 JSON 数据
 * @param {string|Object} source - 数据源
 * @returns {Object} JSON 对象
 */
function prepareJsonData(source) {
  if (typeof source === 'string') {
    try {
      return JSON.parse(source);
    } catch (parseError) {
      throw new Error(`JSON 解析失败: ${parseError.message}`);
    }
  } else if (typeof source === 'object' && source !== null) {
    return source;
  } else {
    throw new Error(`不支持的数据类型: ${typeof source}`);
  }
}

/**
 * 从 JSON 查询结果中提取数据
 * @param {Array} result - JSONPath 查询结果
 * @returns {any} 提取的数据
 */
function extractJsonResult(result) {
  if (result.length === 0) {
    return null;
  } else if (result.length === 1) {
    return result[0];
  } else {
    return result;
  }
}

/**
 * JSON 数组元素选择器
 * @param {string|Object} source - JSON 数据源
 * @param {string} arrayPath - 数组的 JSONPath
 * @param {number|string} index - 索引（数字或 'first'/'last'）
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function jsonArraySelector(source, arrayPath, index, options = {}) {
  try {
    const jsonData = prepareJsonData(source);
    
    // 首先获取数组
    const arrayResult = JSONPath.query(jsonData, arrayPath);
    
    if (isEmpty(arrayResult)) {
      return {
        success: false,
        data: null,
        rule: `${arrayPath}[${index}]`,
        selector: 'json'
      };
    }
    
    const array = arrayResult[0];
    if (!Array.isArray(array)) {
      throw new Error(`路径 ${arrayPath} 不是数组`);
    }
    
    // 处理索引
    let targetIndex;
    if (index === 'first' || index === 0) {
      targetIndex = 0;
    } else if (index === 'last' || index === -1) {
      targetIndex = array.length - 1;
    } else if (typeof index === 'number') {
      targetIndex = index < 0 ? array.length + index : index;
    } else {
      throw new Error(`不支持的索引类型: ${index}`);
    }
    
    // 检查索引是否有效
    if (targetIndex < 0 || targetIndex >= array.length) {
      return {
        success: false,
        data: null,
        rule: `${arrayPath}[${index}]`,
        selector: 'json'
      };
    }
    
    const result = array[targetIndex];
    
    return {
      success: !isEmpty(result),
      data: result,
      rule: `${arrayPath}[${index}]`,
      selector: 'json'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `JSON数组选择器解析失败: ${error.message}`,
      `${arrayPath}[${index}]`,
      'json',
      error
    );
  }
}

/**
 * JSON 多路径选择器（支持回退）
 * @param {string|Object} source - JSON 数据源
 * @param {string[]} paths - JSONPath 表达式数组
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function jsonMultiPathSelector(source, paths, options = {}) {
  const jsonData = prepareJsonData(source);
  const errors = [];
  
  for (const path of paths) {
    try {
      const result = jsonSelector(jsonData, path, options);
      if (result.success) {
        return result;
      }
    } catch (error) {
      errors.push({ path, error: error.message });
    }
  }
  
  // 所有路径都失败
  return {
    success: false,
    data: null,
    rule: paths.join(' || '),
    selector: 'json',
    error: `所有路径都失败: ${errors.map(e => `${e.path}: ${e.error}`).join('; ')}`
  };
}

/**
 * JSON 对象属性过滤器
 * @param {string|Object} source - JSON 数据源
 * @param {string} path - JSONPath 表达式
 * @param {string} filterKey - 过滤键
 * @param {any} filterValue - 过滤值
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function jsonFilterSelector(source, path, filterKey, filterValue, options = {}) {
  try {
    const jsonData = prepareJsonData(source);
    
    // 获取数组或对象
    const result = JSONPath.query(jsonData, path);
    
    if (isEmpty(result)) {
      return {
        success: false,
        data: null,
        rule: `${path}[?(@.${filterKey} == '${filterValue}')]`,
        selector: 'json'
      };
    }
    
    // 过滤结果
    const filtered = result.filter(item => {
      if (typeof item === 'object' && item !== null) {
        return item[filterKey] === filterValue;
      }
      return false;
    });
    
    const extractedData = extractJsonResult(filtered);
    
    return {
      success: !isEmpty(extractedData),
      data: extractedData,
      rule: `${path}[?(@.${filterKey} == '${filterValue}')]`,
      selector: 'json'
    };
    
  } catch (error) {
    throw new RuleParseError(
      `JSON过滤选择器解析失败: ${error.message}`,
      `${path}[?(@.${filterKey} == '${filterValue}')]`,
      'json',
      error
    );
  }
}