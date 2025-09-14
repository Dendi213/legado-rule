/**
 * 测试用户提供的新 parseConcatRule 函数
 */

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
function parseConcatRule(ruleString) {
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

console.log('🧪 开始测试用户提供的新 parseConcatRule 函数\n');

// 测试用例
const testCases = [
  {
    name: '正常的拼接规则',
    input: '@css:.title@text && @text:默认副标题',
    expected: ['@css:.title@text', '@text:默认副标题']
  },
  {
    name: '保留@text选择器中的有意义空格',
    input: '@css:.title@text && @text: -  && @text:默认副标题',
    expected: ['@css:.title@text', '@text: - ', '@text:默认副标题']
  },
  {
    name: '多个文本选择器（无空格拼接）',
    input: '@text:文本0 && @text:文本1 && @text:文本2',
    expected: ['@text:文本0', '@text:文本1', '@text:文本2']
  },
  {
    name: '复杂的拼接场景',
    input: '@text:书名： && @css:.title@text && @text: | 作者：  && @css:.author@text',
    expected: ['@text:书名：', '@css:.title@text', '@text: | 作者： ', '@css:.author@text']
  },
  {
    name: '错误操作符：无空格的&&',
    input: '@text:前缀&&@text:后缀',
    expectError: '非法操作符 "&&"：必须使用单个空格包裹的 " && "'
  },
  {
    name: '错误操作符：多个空格的&&',
    input: '@text:前缀  &&  @text:后缀',
    expectError: '非法操作符 "&&"：必须使用单个空格包裹的 " && "'
  },
  {
    name: '字符串中包含&&不应被解析',
    input: '@text:"包含&&的文本" && @text:其他内容',
    expected: ['@text:"包含&&的文本"', '@text:其他内容']
  },
  {
    name: '空段落检测',
    input: '@text:内容 &&  && @text:其他',
    expectError: '语法错误：拼接符 " && " 两侧不能为空'
  },
  {
    name: '允许一侧多个空格（左侧多空格）',
    input: '@text:内容   && @text:其他',
    expected: ['@text:内容  ', '@text:其他']
  },
  {
    name: '允许一侧多个空格（右侧多空格）',
    input: '@text:内容 &&   @text:其他',
    expected: ['@text:内容', '@text:其他']
  }
];

// 执行测试
let passedTests = 0;
const totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: "${testCase.input}"`);
  
  try {
    const result = parseConcatRule(testCase.input);
    
    if (testCase.expectError) {
      console.log(`❌ 失败 - 应该抛出错误: ${testCase.expectError}`);
    } else if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
      console.log(`✅ 通过 - 结果: ${JSON.stringify(result)}`);
      passedTests++;
    } else {
      console.log(`❌ 失败 - 期待: ${JSON.stringify(testCase.expected)}, 实际: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    if (testCase.expectError && error.message === testCase.expectError) {
      console.log(`✅ 通过 - 正确抛出错误: ${error.message}`);
      passedTests++;
    } else {
      console.log(`❌ 失败 - 意外错误: ${error.message}`);
    }
  }
  
  console.log('');
});

console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
if (passedTests < totalTests) {
  console.log('⚠️  存在失败的测试，需要修复后再替换。');
} else {
  console.log('🎉 所有测试通过！可以替换到原文件中。');
}