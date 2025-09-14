/**
 * 运算符模块统一导出
 */

// 回退机制
export { 
  fallbackOperator, 
  parseFallbackRule, 
  validateFallbackRules, 
  createFallbackSelector, 
  conditionalFallbackOperator 
} from './fallback.js';

// 字段拼接
export { 
  concatOperator, 
  parseConcatRule, 
  smartConcatOperator, 
  conditionalConcatOperator 
} from './concat.js';

// 属性提取
export { 
  attributeOperator, 
  multiAttributeOperator, 
  conditionalAttributeOperator 
} from './attribute.js';

// 索引选择
export { 
  indexOperator, 
  rangeOperator, 
  multiIndexOperator, 
  conditionalIndexOperator 
} from './index.js';

// 正则净化
export { 
  regexCleanOperator, 
  parseCleanRule, 
  batchRegexCleanOperator, 
  PRESET_CLEAN_PATTERNS, 
  presetCleanOperator, 
  smartCleanOperator 
} from './regex-clean.js';