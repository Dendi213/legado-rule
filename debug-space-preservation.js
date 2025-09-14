// 调试空格问题
const { parseConcatRule } = await import('./src/operators/concat.js');

const rule = "@css:.title@text && @text: -  && @text:默认副标题";
console.log("输入规则:", rule);

try {
  const parsed = parseConcatRule(rule);
  console.log("解析结果:", parsed);
  
  parsed.forEach((part, index) => {
    console.log(`部分 ${index}: "${part}" (长度: ${part.length})`);
    for (let i = 0; i < part.length; i++) {
      console.log(`  位置 ${i}: "${part[i]}" (${part.charCodeAt(i)})`);
    }
  });
} catch (error) {
  console.error("解析错误:", error.message);
}