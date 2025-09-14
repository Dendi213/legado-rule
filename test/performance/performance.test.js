/**
 * 性能测试
 * 测试性能和大数据处理、多行规则真实场景
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnvironment, getTestData } from '../helpers/test-setup.js';

describe('性能测试', () => {
  let engine, sampleHtml, sampleJson;

  beforeEach(() => {
    const testEnv = setupTestEnvironment();
    engine = testEnv.engine;
    sampleHtml = testEnv.sampleHtml;
    sampleJson = testEnv.sampleJson;
  });

  describe('性能和大数据测试', () => {
    it('应该处理大量重复元素的选择', async () => {
      const largeHtml = `<div class="container">` + 
        Array.from({length: 1000}, (_, i) => `<p class="item">Item ${i}</p>`).join('') + 
        `</div>`;
      
      const rule = '@css:.item@text';
      const startTime = Date.now();
      const result = await engine.parse(largeHtml, rule);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      
      // 性能断言：处理1000个元素应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
    });

    it('应该处理深层嵌套的DOM结构', async () => {
      const deepHtml = Array.from({length: 50}, (_, i) => 
        '<div class="level' + i + '">').join('') + 
        '<span class="target">深层目标</span>' + 
        Array.from({length: 50}, () => '</div>').join('');
      
      const rule = '@css:.target@text';
      const startTime = Date.now();
      const result = await engine.parse(deepHtml, rule);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('深层目标');
      
      // 深层嵌套不应该显著影响性能
      expect(endTime - startTime).toBeLessThan(1000); // 1秒内完成
    });

    it('应该处理包含特殊字符的内容', async () => {
      const specialHtml = `<div class="special">包含特殊字符：@#$%^&*(){}[]|\\:";'<>?/.,~\`</div>`;
      
      const rule = '@css:.special@text';
      const result = await engine.parse(specialHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('特殊字符');
    });

    it('应该处理Unicode和多语言内容', async () => {
      const multiLangHtml = `
        <div class="chinese">中文：编程指南</div>
        <div class="japanese">日本語：プログラミングガイド</div>
        <div class="korean">한국어：프로그래밍 가이드</div>
        <div class="emoji">📚 Books & 📖 Learning</div>
      `;
      
      const rule = '@css:.emoji@text';
      const result = await engine.parse(multiLangHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('📚');
      expect(result.data).toContain('📖');
    });

    it('应该高效处理大型JSON数据', async () => {
      const largeData = getTestData().largeDataset;
      const jsonString = JSON.stringify(largeData);
      
      const rule = '@js:JSON.parse(source).items.filter(item => item.value > 50).length';
      const startTime = Date.now();
      const result = await engine.parse(jsonString, rule);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('number');
      expect(result.data).toBeGreaterThan(0);
      
      // 大型JSON处理应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(2000); // 2秒内完成
    });

    it('应该处理复杂的正则表达式', async () => {
      const complexText = `
        电话：138-1234-5678，135-8765-4321
        邮箱：user1@example.com，user2@test.org
        时间：2024-01-15 14:30:25，2024-02-20 09:15:10
      `;
      
      const phoneRule = '@regex:/1[3-9]\\d-\\d{4}-\\d{4}/g';
      const emailRule = '@regex:/[\\w.-]+@[\\w.-]+\\.\\w+/g';
      const timeRule = '@regex:/\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}/g';
      
      const phoneResult = await engine.parse(complexText, phoneRule);
      const emailResult = await engine.parse(complexText, emailRule);
      const timeResult = await engine.parse(complexText, timeRule);
      
      expect(phoneResult.success).toBe(true);
      expect(emailResult.success).toBe(true);
      expect(timeResult.success).toBe(true);
      
      expect(Array.isArray(phoneResult.data)).toBe(true);
      expect(phoneResult.data.length).toBe(2);
      expect(emailResult.data).toContain('user1@example.com');
      expect(timeResult.data).toContain('2024-01-15 14:30:25');
    });

    it('应该处理超长字符串的性能', async () => {
      const longText = 'JavaScript'.repeat(10000) + '权威指南';
      const rule = '@js:source.lastIndexOf("权威指南")';
      
      const startTime = Date.now();
      const result = await engine.parse(longText, rule);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThan(0);
      
      // 超长字符串处理应该保持高效
      expect(endTime - startTime).toBeLessThan(500); // 500ms内完成
    });

    it('应该处理高频率的小规模解析', async () => {
      const simpleHtml = '<div class="test">测试数据</div>';
      const rule = '@css:.test@text';
      const iterations = 1000;
      
      const startTime = Date.now();
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const result = await engine.parse(simpleHtml, rule);
        results.push(result);
      }
      
      const endTime = Date.now();
      
      // 验证所有解析都成功
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.data === '测试数据')).toBe(true);
      
      // 高频小规模解析应该保持高效
      const avgTime = (endTime - startTime) / iterations;
      expect(avgTime).toBeLessThan(5); // 平均每次不超过5ms
    });
  });

  describe('多行规则真实场景测试', () => {
    it('应该支持HTML清理到JS后处理的完整流程', async () => {
      // 第一行：提取价格信息
      const firstResult = await engine.parse(sampleHtml, '@css:.price@text');
      expect(firstResult.success).toBe(true);
      
      // 第二行：使用JS直接处理字符串，而不是正则净化
      const secondResult = await engine.parse(firstResult.data, '@js:source.replace(/原价.*$/, "")');
      expect(secondResult.success).toBe(true);
      
      // 第三行：JS后处理格式化
      const finalResult = await engine.parse(secondResult.data, '@js:result.replace("￥", "价格：") + "人民币"');
      expect(finalResult.success).toBe(true);
      expect(finalResult.data).toBe('价格：89.00人民币');
    });

    it('应该支持复杂的数据提取和处理流程', async () => {
      // 第一行：提取所有章节
      const chaptersResult = await engine.parse(sampleHtml, '@css:li@text');
      expect(chaptersResult.success).toBe(true);
      
      // 第二行：JS处理 - 过滤和格式化
      const processedResult = await engine.parse(JSON.stringify(chaptersResult.data), 
        '@js:JSON.parse(source).filter(item => item.includes("JavaScript")).map(item => item.replace(/第\\d+章：/, "")).join(" | ")');
      expect(processedResult.success).toBe(true);
      expect(processedResult.data).toContain('JavaScript简介');
    });

    it('应该支持错误恢复的多行处理', async () => {
      // 第一行：可能失败的选择器
      const firstResult = await engine.parse(sampleHtml, '@css:.nonexistent@text || @css:.title@text');
      expect(firstResult.success).toBe(true);
      
      // 第二行：基于第一行结果的条件处理
      const secondResult = await engine.parse(firstResult.data, 
        '@js:source.includes("JavaScript") ? source + " (技术类)" : source + " (其他类)"');
      expect(secondResult.success).toBe(true);
      expect(secondResult.data).toBe('JavaScript权威指南 (技术类)');
    });

    it('应该支持JSON数据的多行处理流程', async () => {
      // 第一行：提取JSON数据
      const jsonResult = await engine.parse(sampleJson, '@json:$.book');
      expect(jsonResult.success).toBe(true);
      
      // 第二行：JS处理JSON对象
      const processedResult = await engine.parse(JSON.stringify(jsonResult.data), 
        '@js:Object.entries(JSON.parse(source)).map(([key, value]) => `${key}: ${value}`).join(", ")');
      expect(processedResult.success).toBe(true);
      expect(processedResult.data).toContain('title: JavaScript权威指南');
    });

    it('应该支持电商数据的完整提取流程', async () => {
      const productPage = `
        <div class="product-detail">
          <h1 class="product-title">MacBook Pro 16英寸</h1>
          <div class="price-info">
            <span class="current-price">￥16,999</span>
            <span class="original-price">￥18,999</span>
          </div>
          <div class="specs">
            <span class="spec">M3 Pro芯片</span>
            <span class="spec">16GB内存</span>
            <span class="spec">512GB存储</span>
          </div>
          <div class="reviews">
            <span class="rating">4.8</span>
            <span class="review-count">(2,847条评价)</span>
          </div>
        </div>
      `;
      
      // 步骤1：提取产品标题
      const titleResult = await engine.parse(productPage, '@css:.product-title@text');
      expect(titleResult.success).toBe(true);
      
      // 步骤2：提取价格并格式化
      const priceResult = await engine.parse(productPage, '@css:.current-price@text##￥([\\d,]+)##$1');
      expect(priceResult.success).toBe(true);
      
      // 步骤3：提取规格并处理
      const specsResult = await engine.parse(productPage, '@css:.spec@text');
      expect(specsResult.success).toBe(true);
      
      // 步骤4：JavaScript综合处理
      const productInfo = {
        title: titleResult.data,
        price: priceResult.data,
        specs: specsResult.data
      };
      
      const summaryResult = await engine.parse(JSON.stringify(productInfo), 
        '@js:(() => { const data = JSON.parse(source); return `${data.title} - ${data.price}元 [${data.specs.join(", ")}]`; })()');
      
      expect(summaryResult.success).toBe(true);
      expect(summaryResult.data).toContain('MacBook Pro');
      expect(summaryResult.data).toContain('16,999元');
      expect(summaryResult.data).toContain('M3 Pro芯片');
    });

    it('应该支持新闻文章的结构化提取', async () => {
      const newsPage = `
        <article class="news-article">
          <header>
            <h1 class="headline">AI技术发展新突破</h1>
            <div class="meta">
              <time class="publish-time">2024-01-15 14:30</time>
              <span class="author">科技记者</span>
              <span class="source">科技日报</span>
            </div>
          </header>
          <div class="content">
            <p class="lead">人工智能领域再次迎来重大突破...</p>
            <p>详细内容第一段...</p>
            <p>详细内容第二段...</p>
          </div>
          <footer>
            <div class="tags">
              <span class="tag">人工智能</span>
              <span class="tag">科技创新</span>
              <span class="tag">技术突破</span>
            </div>
          </footer>
        </article>
      `;
      
      // 多行处理流程
      const steps = [
        { rule: '@css:.headline@text', desc: '标题' },
        { rule: '@css:.publish-time@text', desc: '发布时间' },
        { rule: '@css:.author@text', desc: '作者' },
        { rule: '@css:.lead@text', desc: '导语' },
        { rule: '@css:.tag@text', desc: '标签' }
      ];
      
      const results = {};
      for (const step of steps) {
        const result = await engine.parse(newsPage, step.rule);
        expect(result.success).toBe(true);
        results[step.desc] = result.data;
      }
      
      // 综合处理
      const finalResult = await engine.parse(JSON.stringify(results), 
        '@js:(() => { const data = JSON.parse(source); return `【${data.标题}】 ${data.发布时间} 作者：${data.作者} 标签：${Array.isArray(data.标签) ? data.标签.join(", ") : data.标签}`; })()');
      
      expect(finalResult.success).toBe(true);
      expect(finalResult.data).toContain('AI技术发展新突破');
      expect(finalResult.data).toContain('2024-01-15');
      expect(finalResult.data).toContain('人工智能');
    });
  });

  describe('极端性能场景测试', () => {
    it('应该处理极大的JSON数据集', async () => {
      const massiveData = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item${i}`,
          value: Math.random() * 1000,
          tags: [`tag${i % 10}`, `category${i % 5}`]
        }))
      };
      
      const rule = '@js:JSON.parse(source).items.filter(item => item.value > 500).slice(0, 10).map(item => item.name)';
      const startTime = Date.now();
      const result = await engine.parse(JSON.stringify(massiveData), rule);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(10);
      
      // 即使是大数据集，也应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(3000); // 3秒内完成
    });

    it('应该处理内存密集型的字符串操作', async () => {
      const hugeText = 'A'.repeat(100000) + 'TARGET' + 'B'.repeat(100000);
      const rule = '@js:source.indexOf("TARGET")';
      
      const startTime = Date.now();
      const result = await engine.parse(hugeText, rule);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(100000);
      
      // 内存密集型操作应该保持高效
      expect(endTime - startTime).toBeLessThan(100); // 100ms内完成
    });
  });
});
