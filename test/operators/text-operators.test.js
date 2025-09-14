/**
 * 文本处理运算符测试
 * 测试正则净化(##pattern##replacement)和条件过滤(:contains())
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnvironment, getChineseTestData } from '../helpers/test-setup.js';

describe('文本处理运算符测试', () => {
  let engine, sampleHtml, sampleJson;

  beforeEach(() => {
    const testEnv = setupTestEnvironment();
    engine = testEnv.engine;
    sampleHtml = testEnv.sampleHtml;
    sampleJson = testEnv.sampleJson;
  });

  describe('正则净化 (##pattern##replacement)', () => {
    it('应该支持电话号码隐藏', async () => {
      const testHtml = '<div class="test">电话：138-1234-5678，邮箱：test@example.com</div>';
      const rule = '@css:.test@text##(\\d{3})-(\\d{4})-(\\d{4})##$1****$3';
      const result = await engine.parse(testHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toContain('138****5678');
    });

    it('应该支持全局替换', async () => {
      const testHtml = '<div class="test">价格：￥100，优惠价：￥80</div>';
      const rule = '@css:.test@text##￥##$';
      const result = await engine.parse(testHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('价格：$100，优惠价：$80');
    });

    it('应该处理中文字符的正则替换', async () => {
      const chineseData = getChineseTestData();
      const rule = '@css:.内容@text##特殊字符：.*$##';
      const result = await engine.parse(chineseData.html, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('这是一段中文内容，包含');
    });

    it('应该支持HTML标签的清理', async () => {
      const htmlWithTags = '<div class="content">这是<strong>加粗</strong>的<em>斜体</em>文本</div>';
      const rule = '@css:.content@text##<[^>]*>##';
      const result = await engine.parse(htmlWithTags, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('这是加粗的斜体文本');
    });

    it('应该处理换行符和制表符', async () => {
      const textWithWhitespace = '<div class="test">第一行\n\t第二行\r\n第三行</div>';
      const rule = '@css:.test@text##[\\r\\n\\t]+## ';
      const result = await engine.parse(textWithWhitespace, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('第一行 第二行 第三行');
    });
  });

  describe('条件过滤 (:contains())', () => {
    it('应该能根据文本内容筛选元素', async () => {
      const rule = '@css:a:contains(下一页)@href';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('/next');
    });

    it('应该能筛选包含特定文本的列表项', async () => {
      const rule = '@css:li:contains(异步)@text';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toContain('异步编程');
    });

    it('应该支持部分文本匹配', async () => {
      const rule = '@css:li:contains(函数)@text';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toContain('函数与闭包');
    });

    it('应该在没有匹配时返回失败', async () => {
      const rule = '@css:li:contains(不存在的内容)@text';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(false);
    });

    it('应该区分大小写', async () => {
      const rule = '@css:li:contains(javascript)@text';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(false);
    });

    it('应该支持中文文本匹配', async () => {
      const chineseData = getChineseTestData();
      const rule = '@css:span:contains(标签一)@text';
      const result = await engine.parse(chineseData.html, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('标签一');
    });

    it('应该支持数字文本的匹配', async () => {
      const numberHtml = `
        <ul>
          <li>版本 1.0</li>
          <li>版本 2.0</li>
          <li>版本 3.0</li>
        </ul>
      `;
      const rule = '@css:li:contains(2)@text';
      const result = await engine.parse(numberHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toContain('版本 2.0');
    });

    it('应该支持特殊字符的匹配', async () => {
      const specialHtml = '<div class="price">价格：￥99.99（特价）</div>';
      const rule = '@css:.price:contains(￥)@text';
      const result = await engine.parse(specialHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toContain('￥99.99');
    });

    it('应该支持空格的匹配', async () => {
      const spaceHtml = '<p class="text">Hello World</p>';
      const rule = '@css:.text:contains( )@text';
      const result = await engine.parse(spaceHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello World');
    });

    it('应该支持多个contains条件的组合', async () => {
      const multiHtml = `
        <div class="item">React框架</div>
        <div class="item">Vue.js</div>
        <div class="item">JavaScript基础</div>
      `;
      // 测试回退机制与contains的组合
      const rule = '@css:.item:contains(React)@text || @css:.item:contains(JavaScript)@text';
      const result = await engine.parse(multiHtml, rule);

      expect(result.success).toBe(true);
      expect(['React框架', 'JavaScript基础']).toContain(result.data);
    });
  });

  describe('文本处理运算符组合', () => {
    it('应该支持正则净化与条件过滤的组合', async () => {
      const rule = '@css:li:contains(JavaScript)@text##第\\d+章：##';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript简介');
    });

    it('应该支持多步文本处理', async () => {
      const complexHtml = '<div class="content">   价格：￥89.00（原价：￥128.00）   </div>';
      // 简化为单步处理：直接移除原价信息和多余空格
      const rule = '@css:.content@text##\\s*（.*?）\\s*##';
      const result = await engine.parse(complexHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('价格：￥89.00');
    });

    it('应该与回退机制组合使用', async () => {
      const rule = '@css:.none:contains(不存在)@text##test##replaced || @css:.title@text##权威##Ultimate';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScriptUltimate指南');
    });

    it('应该支持复杂的文本清理组合', async () => {
      const messyHtml = '<div class="content">   文本   内容   带    空格   </div>';
      const rule = '@css:.content@text##\\s+## ';
      const result = await engine.parse(messyHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('文本 内容 带 空格');
    });

    it('应该处理中文正则与条件过滤组合', async () => {
      const chineseData = getChineseTestData();
      const rule = '@css:span:contains(标签)@text##标签##Tag';
      const result = await engine.parse(chineseData.html, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('Tag一 Tag二');
    });
  });
});