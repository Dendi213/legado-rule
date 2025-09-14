/**
 * Text 选择器解析器
 * 直接输出指定的文本内容，用作默认值或固定文本输出
 */

import { isEmpty, RuleParseError } from "../types.js";

/**
 * Text 选择器解析器
 * @param {any} source - 数据源（此选择器忽略数据源）
 * @param {string} text - 要输出的文本内容
 * @param {Object} context - 执行上下文（可选）
 * @param {Object} options - 解析选项（可选）
 * @returns {ParseResult} 解析结果
 */
export function textSelector(source, text, context = {}, options = {}) {
  try {
    // 处理空字符串或null的情况
    if (text === null || text === undefined) {
      return {
        success: false,
        data: null,
        rule: String(text),
        selector: "text",
      };
    }

    // 将文本转换为字符串
    const outputText = String(text);

    return {
      success: true,
      data: outputText,
      rule: outputText,
      selector: "text",
    };
  } catch (error) {
    throw new RuleParseError(`Text选择器执行失败: ${error.message}`, String(text), "text", error);
  }
}

/**
 * 带引号的文本选择器解析器
 * 支持解析带引号的文本内容，自动去除引号
 * @param {any} source - 数据源
 * @param {string} quotedText - 带引号的文本
 * @param {Object} context - 执行上下文
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function quotedTextSelector(source, quotedText, context = {}, options = {}) {
  try {
    let text = String(quotedText);

    // 去除首尾的引号（单引号或双引号）
    if ((text.startsWith('"') && text.endsWith('"')) || 
        (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1);
    }

    // 处理转义字符
    text = text.replace(/\\"/g, '"')
               .replace(/\\'/g, "'")
               .replace(/\\\\/g, '\\')
               .replace(/\\n/g, '\n')
               .replace(/\\t/g, '\t')
               .replace(/\\r/g, '\r');

    return {
      success: true,
      data: text,
      rule: quotedText,
      selector: "text",
    };
  } catch (error) {
    throw new RuleParseError(`引用文本选择器执行失败: ${error.message}`, String(quotedText), "text", error);
  }
}

/**
 * 多行文本选择器解析器
 * 支持输出多行文本，保持格式
 * @param {any} source - 数据源
 * @param {string} multilineText - 多行文本
 * @param {Object} context - 执行上下文
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function multilineTextSelector(source, multilineText, context = {}, options = {}) {
  try {
    const text = String(multilineText);

    // 处理多行文本的格式化
    const { preserveWhitespace = true, trimLines = false } = options;

    let processedText = text;

    if (trimLines) {
      // 去除每行的首尾空白
      processedText = text.split('\n').map(line => line.trim()).join('\n');
    }

    if (!preserveWhitespace) {
      // 压缩多余的空白字符
      processedText = processedText.replace(/\s+/g, ' ').trim();
    }

    return {
      success: true,
      data: processedText,
      rule: multilineText,
      selector: "text",
    };
  } catch (error) {
    throw new RuleParseError(`多行文本选择器执行失败: ${error.message}`, String(multilineText), "text", error);
  }
}

/**
 * 模板文本选择器解析器
 * 支持简单的变量替换功能
 * @param {any} source - 数据源
 * @param {string} template - 模板文本
 * @param {Object} context - 执行上下文（包含变量）
 * @param {Object} options - 解析选项
 * @returns {ParseResult} 解析结果
 */
export function templateTextSelector(source, template, context = {}, options = {}) {
  try {
    let text = String(template);

    // 简单的变量替换 {变量名}
    const variables = { ...context, source };

    text = text.replace(/\{([^}]+)\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      if (variables.hasOwnProperty(trimmedName)) {
        return String(variables[trimmedName]);
      }
      // 如果变量不存在，保留原始占位符
      return match;
    });

    return {
      success: true,
      data: text,
      rule: template,
      selector: "text",
    };
  } catch (error) {
    throw new RuleParseError(`模板文本选择器执行失败: ${error.message}`, String(template), "text", error);
  }
}