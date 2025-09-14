/**
 * 选择器模块统一导出
 */

// CSS 选择器
export { cssSelector, cssContainsSelector } from './css.js';

// XPath 选择器
export { 
  xpathSelector, 
  xpathAttributeSelector, 
  xpathTextSelector 
} from './xpath.js';

// JSON 选择器
export { 
  jsonSelector, 
  jsonArraySelector, 
  jsonMultiPathSelector, 
  jsonFilterSelector 
} from './json.js';

// 正则选择器
export { 
  regexSelector, 
  regexReplaceSelector, 
  regexSplitSelector, 
  regexTestSelector, 
  regexMultiPatternSelector 
} from './regex.js';

// JavaScript 选择器
export { 
  jsSelector, 
  jsConditionalSelector, 
  jsMapSelector, 
  jsFilterSelector, 
  jsReduceSelector 
} from './js.js';

// Text 选择器
export { 
  textSelector, 
  quotedTextSelector, 
  multilineTextSelector, 
  templateTextSelector 
} from './text.js';