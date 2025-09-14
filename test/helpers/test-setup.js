/**
 * 共享测试工具和数据
 * 为所有测试文件提供通用的设置和数据
 */

import { beforeEach } from 'vitest';
import { RuleEngine } from '../../src/rule-engine.js';

/**
 * 设置通用测试环境
 * @returns {Object} 包含 engine、sampleHtml、sampleJson 的对象
 */
export function setupTestEnvironment() {
  const engine = new RuleEngine();
  
  // 测试用的 HTML 数据
  const sampleHtml = `
    <div class="book-container">
      <h1 class="title">JavaScript权威指南</h1>
      <h2 class="subtitle">第7版</h2>
      <p class="author" data-id="123">David Flanagan</p>
      <img src="/covers/js-guide.jpg" alt="书籍封面" class="cover">
      <a href="https://example.com/book/123" class="download-link">下载链接</a>
      <div class="category">编程 技术书籍</div>
      <div class="status">在售</div>
      <div class="price">￥89.00原价￥128.00</div>
      <div class="content">
        这是一本非常好的    JavaScript    教程
        
        适合初学者    和进阶开发者
      </div>
      <ul class="chapters">
        <li>第1章：JavaScript简介</li>
        <li>第2章：语法基础</li>
        <li>第3章：函数与闭包</li>
        <li class="highlight">第4章：异步编程</li>
      </ul>
      <div class="navigation">
        <a href="/prev">上一页</a>
        <a href="/next">下一页</a>
        <a href="/index">目录</a>
      </div>
    </div>
  `;

  // 测试用的 JSON 数据
  const sampleJson = JSON.stringify({
    book: {
      title: "JavaScript权威指南",
      author: "David Flanagan",
      price: 89.00,
      chapters: [
        { title: "JavaScript简介", page: 1 },
        { title: "语法基础", page: 25 },
        { title: "函数与闭包", page: 67 }
      ]
    }
  });

  return { engine, sampleHtml, sampleJson };
}

/**
 * 获取通用测试数据
 * @returns {Object} 包含各种测试数据的对象
 */
export function getTestData() {
  return {
    // 简单HTML数据
    simpleHtml: '<div class="test">测试内容</div>',
    
    // 复杂HTML数据
    complexHtml: `
      <article class="post">
        <header>
          <h1 class="title">测试文章</h1>
          <p class="meta">
            <span class="author">作者名称</span>
            <time class="date">2024-01-01</time>
          </p>
        </header>
        <div class="content">
          <p>这是第一段内容。</p>
          <p>这是第二段内容。</p>
        </div>
        <footer>
          <div class="tags">
            <span class="tag">JavaScript</span>
            <span class="tag">测试</span>
          </div>
        </footer>
      </article>
    `,
    
    // 测试JSON数据
    testJson: {
      users: [
        { id: 1, name: "张三", email: "zhangsan@example.com" },
        { id: 2, name: "李四", email: "lisi@example.com" }
      ],
      meta: {
        total: 2,
        page: 1
      }
    },
    
    // 大数据集（用于性能测试）
    largeDataset: {
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `项目${i + 1}`,
        value: Math.random() * 100
      }))
    }
  };
}

/**
 * 创建包含中文内容的测试数据
 * @returns {Object} 中文测试数据
 */
export function getChineseTestData() {
  return {
    html: `
      <div class="文章">
        <h1 class="标题">中文测试文章</h1>
        <p class="内容">这是一段中文内容，包含特殊字符：！@#￥%……&*（）</p>
        <div class="标签">
          <span>标签一</span>
          <span>标签二</span>
        </div>
      </div>
    `,
    json: {
      文章: {
        标题: "中文JSON测试",
        内容: "中文内容测试",
        标签: ["中文", "测试", "数据"]
      }
    }
  };
}

/**
 * 创建用于错误测试的数据
 * @returns {Object} 错误测试数据
 */
export function getErrorTestData() {
  return {
    malformedHtml: '<div><p>未闭合的标签',
    malformedJson: '{"invalid": json, missing quotes}',
    emptyData: '',
    nullData: null,
    undefinedData: undefined
  };
}