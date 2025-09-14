/**
 * JavaScript 选择器解析器
 * 执行 JavaScript 代码进行复杂逻辑处理
 * 注意：此功能需要谨慎使用，确保代码安全性
 */

import { isEmpty, RuleParseError } from "../types.js";

/**
 * JavaScript 选择器解析器
 * @param {any} source - 数据源
 * @param {string} code - JavaScript 代码
 * @param {Object} context - 执行上下文
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function jsSelector(source, code, context = {}, options = {}) {
  try {
    // 准备执行环境
    const execContext = prepareExecutionContext(source, context, options);

    // 执行 JavaScript 代码
    const result = executeJavaScript(code, execContext, options);

    return {
      success: !isEmpty(result),
      data: result,
      rule: code,
      selector: "js",
    };
  } catch (error) {
    throw new RuleParseError(`JavaScript选择器执行失败: ${error.message}`, code, "js", error);
  }
}

/**
 * 准备 JavaScript 执行上下文
 * @param {any} source - 数据源
 * @param {Object} context - 外部上下文
 * @param {Object} options - 选项
 * @returns {Object} 执行上下文
 */
function prepareExecutionContext(source, context, options) {
  const execContext = {
    // 数据源
    source: source,
    result: source, // 兼容性别名

    // 工具函数
    isEmpty: isEmpty,

    // 字符串处理工具
    trim: (str) => String(str).trim(),
    replace: (str, search, replace) => String(str).replace(search, replace),
    replaceAll: (str, search, replace) => String(str).replaceAll(search, replace),

    // 数组处理工具
    join: (arr, separator = "") => (Array.isArray(arr) ? arr.join(separator) : String(arr)),
    split: (str, separator) => String(str).split(separator),
    slice: (arr, start, end) => (Array.isArray(arr) ? arr.slice(start, end) : [arr].slice(start, end)),

    // 对象处理工具
    keys: (obj) => (typeof obj === "object" && obj !== null ? Object.keys(obj) : []),
    values: (obj) => (typeof obj === "object" && obj !== null ? Object.values(obj) : []),

    // 类型检查工具
    isString: (val) => typeof val === "string",
    isNumber: (val) => typeof val === "number",
    isArray: Array.isArray,
    isObject: (val) => typeof val === "object" && val !== null && !Array.isArray(val),

    // 数学工具
    parseInt: parseInt,
    parseFloat: parseFloat,
    Math: Math,

    // 正则工具
    RegExp: RegExp,

    // JSON 工具
    JSON: JSON,

    // 扩展上下文
    ...context,
  };

  return execContext;
}

/**
 * 执行 JavaScript 代码
 * @param {string} code - JavaScript 代码
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {any} 执行结果
 */
function executeJavaScript(code, context, options = {}) {
  const { timeout = 5000, allowAsync = false } = options;
  try {
    // 创建函数包装器
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // 构建函数代码
    const functionCode = `
      "use strict";
      return (function(${contextKeys.join(", ")}) {
        return ${code};
      }).apply(this, arguments);
    `;

    // 执行代码
    const func = new Function(functionCode);
    let result = func.apply(null, contextValues);

    // 处理 Promise（如果允许异步）
    if (allowAsync && result && typeof result.then === "function") {
      // 这里简化处理，实际应用中可能需要更复杂的异步处理
      throw new Error("异步代码执行需要特殊处理，当前不支持");
    }

    return result;
  } catch (error) {
    throw new Error(`代码执行失败: ${error.message}`);
  }
}

/**
 * 条件选择器（三元运算符模拟）
 * @param {any} source - 数据源
 * @param {string} condition - 条件表达式
 * @param {any} trueValue - 条件为真时的值
 * @param {any} falseValue - 条件为假时的值
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function jsConditionalSelector(source, condition, trueValue, falseValue, context = {}, options = {}) {
  try {
    const execContext = prepareExecutionContext(source, context, options);

    // 执行条件判断
    const conditionResult = executeJavaScript(condition, execContext, options);

    // 根据条件返回相应值
    const result = conditionResult ? trueValue : falseValue;

    return {
      success: true,
      data: result,
      rule: `${condition} ? ${trueValue} : ${falseValue}`,
      selector: "js",
    };
  } catch (error) {
    throw new RuleParseError(`JavaScript条件选择器执行失败: ${error.message}`, `${condition} ? ${trueValue} : ${falseValue}`, "js", error);
  }
}

/**
 * 映射选择器（数组处理）
 * @param {any} source - 数据源（应该是数组）
 * @param {string} mapCode - 映射函数代码
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function jsMapSelector(source, mapCode, context = {}, options = {}) {
  try {
    if (!Array.isArray(source)) {
      throw new Error("映射选择器的数据源必须是数组");
    }

    const results = source.map((item, index) => {
      const execContext = prepareExecutionContext(
        item,
        {
          ...context,
          index: index,
          item: item,
          array: source,
        },
        options
      );

      return executeJavaScript(mapCode, execContext, options);
    });

    return {
      success: true,
      data: results,
      rule: `map(${mapCode})`,
      selector: "js",
    };
  } catch (error) {
    throw new RuleParseError(`JavaScript映射选择器执行失败: ${error.message}`, `map(${mapCode})`, "js", error);
  }
}

/**
 * 过滤选择器（数组筛选）
 * @param {any} source - 数据源（应该是数组）
 * @param {string} filterCode - 过滤函数代码
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function jsFilterSelector(source, filterCode, context = {}, options = {}) {
  try {
    if (!Array.isArray(source)) {
      throw new Error("过滤选择器的数据源必须是数组");
    }

    const results = source.filter((item, index) => {
      const execContext = prepareExecutionContext(
        item,
        {
          ...context,
          index: index,
          item: item,
          array: source,
        },
        options
      );

      return executeJavaScript(filterCode, execContext, options);
    });

    return {
      success: true,
      data: results,
      rule: `filter(${filterCode})`,
      selector: "js",
    };
  } catch (error) {
    throw new RuleParseError(`JavaScript过滤选择器执行失败: ${error.message}`, `filter(${filterCode})`, "js", error);
  }
}

/**
 * 聚合选择器（数组归约）
 * @param {any} source - 数据源（应该是数组）
 * @param {string} reduceCode - 归约函数代码
 * @param {any} initialValue - 初始值
 * @param {Object} context - 执行上下文
 * @param {Object} options - 选项
 * @returns {ParseResult} 解析结果
 */
export function jsReduceSelector(source, reduceCode, initialValue, context = {}, options = {}) {
  try {
    if (!Array.isArray(source)) {
      throw new Error("聚合选择器的数据源必须是数组");
    }

    const result = source.reduce((accumulator, currentValue, index) => {
      const execContext = prepareExecutionContext(
        currentValue,
        {
          ...context,
          accumulator: accumulator,
          currentValue: currentValue,
          index: index,
          array: source,
        },
        options
      );

      return executeJavaScript(reduceCode, execContext, options);
    }, initialValue);

    return {
      success: true,
      data: result,
      rule: `reduce(${reduceCode}, ${initialValue})`,
      selector: "js",
    };
  } catch (error) {
    throw new RuleParseError(`JavaScript聚合选择器执行失败: ${error.message}`, `reduce(${reduceCode}, ${initialValue})`, "js", error);
  }
}
