/**
 * 书源规则解析器使用示例
 * 演示各种选择器和运算符的使用方法
 */

import { createRuleEngine, parseRule } from './index.js';

// 创建规则引擎
const engine = createRuleEngine({
  cache: {
    enabled: true,
    maxSize: 100,
    ttl: 300000 // 5分钟
  }
});

// 示例 HTML 数据
const htmlData = `
<!DOCTYPE html>
<html>
<head>
  <title>书城首页</title>
</head>
<body>
  <div class="book-list">
    <div class="book-item" data-id="1">
      <img class="cover" src="book1.jpg" alt="JavaScript权威指南">
      <h3 class="title">JavaScript权威指南</h3>
      <p class="author">David Flanagan</p>
      <span class="sale-price">￥89.00</span>
      <span class="original-price">￥128.00</span>
      <div class="description">
        这是一本经典的JavaScript教程，适合初学者和进阶开发者。
        <br>包含最新的ES6+特性介绍。
      </div>
      <div class="tags">
        <span class="tag">编程</span>
        <span class="tag">JavaScript</span>
        <span class="tag">前端</span>
      </div>
    </div>
    
    <div class="book-item" data-id="2">
      <img class="cover" src="book2.jpg" alt="Vue.js实战">
      <h3 class="title">Vue.js实战</h3>
      <p class="author">梁灏</p>
      <span class="price">￥79.00</span>
      <div class="description">
        Vue.js框架实战教程，从基础到进阶。
      </div>
      <div class="tags">
        <span class="tag">编程</span>
        <span class="tag">Vue</span>
        <span class="tag">前端</span>
      </div>
    </div>
  </div>
  
  <div class="pagination">
    <a href="?page=1" class="current">1</a>
    <a href="?page=2">2</a>
    <a href="?page=3">3</a>
  </div>
</body>
</html>
`;

// 示例 JSON 数据
const jsonData = {
  success: true,
  data: {
    books: [
      {
        id: 1,
        title: "JavaScript权威指南",
        author: {
          name: "David Flanagan",
          country: "美国"
        },
        price: {
          sale: 89.00,
          original: 128.00,
          currency: "CNY"
        },
        tags: ["编程", "JavaScript", "前端"],
        info: {
          publisher: "机械工业出版社",
          isbn: "978-7-111-50715-1",
          pages: 1096
        }
      },
      {
        id: 2,
        title: "Vue.js实战",
        author: {
          name: "梁灏",
          country: "中国"
        },
        price: {
          sale: 79.00,
          currency: "CNY"
        },
        tags: ["编程", "Vue", "前端"],
        info: {
          publisher: "电子工业出版社",
          isbn: "978-7-121-31028-0",
          pages: 312
        }
      }
    ],
    pagination: {
      current: 1,
      total: 10,
      pageSize: 20
    }
  }
};

/**
 * CSS 选择器示例
 */
async function cssSelectorExamples() {
  console.log('🎯 CSS 选择器示例');
  console.log('='.repeat(50));
  
  // 基础文本提取
  console.log('📖 书名列表:');
  const titles = await parseRule('css:.title', htmlData);
  console.log(titles);
  
  // 属性提取
  console.log('\n🖼️  封面图片:');
  const covers = await parseRule('css:.cover@src', htmlData);
  console.log(covers);
  
  // 包含文本筛选
  console.log('\n🏷️  JavaScript 相关书籍:');
  const jsBooks = await parseRule('css:.book-item:contains("JavaScript") .title', htmlData);
  console.log(jsBooks);
  
  // 索引选择
  console.log('\n📚 第一本书的标题:');
  const firstTitle = await parseRule('css:.title[0]', htmlData);
  console.log(firstTitle);
  
  console.log('\n');
}

/**
 * JSON 选择器示例
 */
async function jsonSelectorExamples() {
  console.log('🎯 JSON 选择器示例');
  console.log('='.repeat(50));
  
  // 基础路径查询
  console.log('📖 所有书名:');
  const titles = await parseRule('json:$.data.books[*].title', jsonData);
  console.log(titles);
  
  // 嵌套属性访问
  console.log('\n👨‍💼 作者信息:');
  const authors = await parseRule('json:$.data.books[*].author.name', jsonData);
  console.log(authors);
  
  // 条件筛选
  console.log('\n💰 价格低于80的书籍:');
  const cheapBooks = await parseRule('json:$.data.books[?(@.price.sale < 80)].title', jsonData);
  console.log(cheapBooks);
  
  // 数组索引
  console.log('\n🏷️  第一本书的标签:');
  const firstBookTags = await parseRule('json:$.data.books[0].tags', jsonData);
  console.log(firstBookTags);
  
  console.log('\n');
}

/**
 * 正则表达式选择器示例
 */
async function regexSelectorExamples() {
  console.log('🎯 正则表达式选择器示例');
  console.log('='.repeat(50));
  
  const text = "书名：《JavaScript权威指南》，价格：￥89.00，原价：￥128.00，ISBN：978-7-111-50715-1";
  
  // 价格提取
  console.log('💰 提取价格:');
  const prices = await parseRule('regex:g:￥([\\d.]+)', text);
  console.log(prices);
  
  // ISBN 提取
  console.log('\n📊 提取 ISBN:');
  const isbn = await parseRule('regex:(\\d{3}-\\d-\\d{3}-\\d{5}-\\d)', text);
  console.log(isbn);
  
  // 文本替换
  console.log('\n🔄 价格格式化:');
  const formatted = await parseRule('regex:￥([\\d.]+):replace:$1元', text);
  console.log(formatted);
  
  // 文本分割
  console.log('\n📝 按逗号分割:');
  const parts = await parseRule('regex:，:split', text);
  console.log(parts);
  
  console.log('\n');
}

/**
 * JavaScript 选择器示例
 */
async function jsSelectorExamples() {
  console.log('🎯 JavaScript 选择器示例');
  console.log('='.repeat(50));
  
  // 字符串处理
  console.log('🔤 字符串转大写:');
  const upper = await parseRule('js:data.toUpperCase()', "javascript guide");
  console.log(upper);
  
  // 数组处理
  console.log('\n📚 提取书名并转大写:');
  const bookTitles = ["JavaScript权威指南", "Vue.js实战", "React进阶"];
  const upperTitles = await parseRule('js:data.map(title => title.toUpperCase())', bookTitles);
  console.log(upperTitles);
  
  // 条件判断
  console.log('\n🔍 价格筛选:');
  const books = [
    { title: "JavaScript权威指南", price: 89 },
    { title: "Vue.js实战", price: 79 },
    { title: "React进阶", price: 99 }
  ];
  const affordableBooks = await parseRule('js:data.filter(book => book.price < 90).map(book => book.title)', books);
  console.log(affordableBooks);
  
  console.log('\n');
}

/**
 * 运算符组合示例
 */
async function operatorExamples() {
  console.log('🎯 运算符组合示例');
  console.log('='.repeat(50));
  
  // 回退机制
  console.log('🔄 价格回退 (促销价 -> 原价):');
  const price = await parseRule('css:.sale-price || css:.price || css:.original-price', htmlData);
  console.log(price);
  
  // 连接运算符
  console.log('\n🔗 书名和作者连接:');
  const titleAuthor = await parseRule('css:.title && " - " && css:.author', htmlData);
  console.log(titleAuthor);
  
  // 属性提取 + 回退
  console.log('\n🖼️  图片链接回退:');
  const imageUrl = await parseRule('css:.cover@src || css:.thumbnail@src || "/default.jpg"', htmlData);
  console.log(imageUrl);
  
  // 索引选择 + 清理
  console.log('\n📝 描述文本清理:');
  const description = await parseRule('css:.description[0]##html##space', htmlData);
  console.log(description);
  
  // 复杂组合：JSON 查询 + 回退 + 格式化
  console.log('\n💰 价格格式化:');
  const formattedPrice = await parseRule('json:$.data.books[0].price.sale || json:$.data.books[0].price.original', jsonData);
  const finalPrice = await parseRule('js:`￥${data.toFixed(2)}`', formattedPrice);
  console.log(finalPrice);
  
  console.log('\n');
}

/**
 * 批量规则解析示例
 */
async function batchParsingExample() {
  console.log('🎯 批量规则解析示例');
  console.log('='.repeat(50));
  
  // 定义书籍信息提取规则
  const bookRules = {
    title: 'css:.title[0]',
    author: 'css:.author[0]',
    price: 'css:.sale-price[0] || css:.price[0] || css:.original-price[0]',
    originalPrice: 'css:.original-price[0]',
    cover: 'css:.cover[0]@src || "/default-cover.jpg"',
    description: 'css:.description[0]##html##space',
    tags: 'css:.tag',
    bookId: 'css:.book-item[0]@data-id'
  };
  
  // 批量解析
  console.log('📚 第一本书的完整信息:');
  const bookInfo = await engine.parseRules(bookRules, htmlData);
  console.log(JSON.stringify(bookInfo, null, 2));
  
  // JSON 数据批量解析
  const jsonRules = {
    titles: 'json:$.data.books[*].title',
    authors: 'json:$.data.books[*].author.name',
    prices: 'json:$.data.books[*].price.sale',
    totalBooks: 'json:$.data.books.length',
    currentPage: 'json:$.data.pagination.current',
    totalPages: 'json:$.data.pagination.total'
  };
  
  console.log('\n📊 JSON 数据统计信息:');
  const stats = await engine.parseRules(jsonRules, jsonData);
  console.log(JSON.stringify(stats, null, 2));
  
  console.log('\n');
}

/**
 * 错误处理示例
 */
async function errorHandlingExample() {
  console.log('🎯 错误处理示例');
  console.log('='.repeat(50));
  
  try {
    // 无效的选择器类型
    await parseRule('invalid:selector', htmlData);
  } catch (error) {
    console.log('❌ 无效选择器错误:');
    console.log(`  错误类型: ${error.name}`);
    console.log(`  错误信息: ${error.message}`);
    console.log(`  规则: ${error.rule}`);
  }
  
  try {
    // CSS 选择器语法错误
    await parseRule('css:[invalid', htmlData);
  } catch (error) {
    console.log('\n❌ CSS 语法错误:');
    console.log(`  错误信息: ${error.message}`);
  }
  
  try {
    // JSON 路径错误
    await parseRule('json:$.invalid..path', jsonData);
  } catch (error) {
    console.log('\n❌ JSON 路径错误:');
    console.log(`  错误信息: ${error.message}`);
  }
  
  // 使用回退机制处理可能的错误
  console.log('\n✅ 回退机制处理错误:');
  const safeResult = await parseRule('css:.nonexistent || "默认值"', htmlData);
  console.log(`  结果: ${safeResult}`);
  
  console.log('\n');
}

/**
 * 性能测试示例
 */
async function performanceExample() {
  console.log('🎯 性能测试示例');
  console.log('='.repeat(50));
  
  const rule = 'css:.title';
  const iterations = 1000;
  
  // 无缓存性能测试
  console.log('⏱️  无缓存性能测试:');
  const engineNoCache = createRuleEngine({ cache: { enabled: false } });
  const startTime1 = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await engineNoCache.parseRule(rule, htmlData);
  }
  
  const time1 = Date.now() - startTime1;
  console.log(`  ${iterations} 次解析耗时: ${time1}ms`);
  console.log(`  平均耗时: ${(time1 / iterations).toFixed(2)}ms/次`);
  
  // 有缓存性能测试
  console.log('\n⚡ 有缓存性能测试:');
  const engineWithCache = createRuleEngine({ cache: { enabled: true } });
  const startTime2 = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await engineWithCache.parseRule(rule, htmlData);
  }
  
  const time2 = Date.now() - startTime2;
  console.log(`  ${iterations} 次解析耗时: ${time2}ms`);
  console.log(`  平均耗时: ${(time2 / iterations).toFixed(2)}ms/次`);
  console.log(`  性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  
  console.log('\n');
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 书源规则解析器使用示例');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    await cssSelectorExamples();
    await jsonSelectorExamples();
    await regexSelectorExamples();
    await jsSelectorExamples();
    await operatorExamples();
    await batchParsingExample();
    await errorHandlingExample();
    await performanceExample();
    
    console.log('✅ 所有示例运行完成！');
    
  } catch (error) {
    console.error('❌ 示例运行出错:', error);
  }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  cssSelectorExamples,
  jsonSelectorExamples,
  regexSelectorExamples,
  jsSelectorExamples,
  operatorExamples,
  batchParsingExample,
  errorHandlingExample,
  performanceExample
};