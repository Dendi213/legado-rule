/**
 * CSS 选择器测试 - Vitest 版本
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { cssSelector } from '../src/selectors/css.js';
import { RuleParseError } from '../src/types.js';

describe('CSS 选择器', () => {
  let htmlData;

  beforeEach(() => {
    htmlData = `
      <div class="container">
        <h1 class="title" data-id="123">JavaScript 权威指南</h1>
        <p class="author">David Flanagan</p>
        <img src="cover.jpg" alt="书籍封面" class="cover">
        <div class="description">
          这是一本经典的 JavaScript 教程
        </div>
        <ul class="tags">
          <li class="tag">编程</li>
          <li class="tag">JavaScript</li>
          <li class="tag">前端</li>
        </ul>
        <div class="price">
          <span class="sale-price">￥89.00</span>
          <span class="original-price">￥128.00</span>
        </div>
      </div>
    `;
  });

  describe('基础文本提取', () => {
    it('应该能提取单个元素的文本', async () => {
      const result = await cssSelector(htmlData, '.title');
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript 权威指南');
    });

    it('应该能提取多个元素的文本', async () => {
      const result = await cssSelector(htmlData, '.tag');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['编程', 'JavaScript', '前端']);
    });

    it('应该在没有找到元素时返回失败', async () => {
      const result = await cssSelector(htmlData, '.nonexistent');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('属性提取', () => {
    it('应该能提取 src 属性', async () => {
      const result = await cssSelector(htmlData, 'img@src');
      expect(result.success).toBe(true);
      expect(result.data).toBe('cover.jpg');
    });

    it('应该能提取 data 属性', async () => {
      const result = await cssSelector(htmlData, '.title@data-id');
      expect(result.success).toBe(true);
      expect(result.data).toBe('123');
    });
  });

  describe('包含文本筛选', () => {
    it('应该能筛选包含特定文本的元素', async () => {
      const result = await cssSelector(htmlData, '.tag:contains("JavaScript")');
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript');
    });
  });

  describe('边界情况', () => {
    it('应该处理空 HTML', async () => {
      const result = await cssSelector('', '.title');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('应该处理 null 输入并抛出错误', async () => {
      try {
        await cssSelector(null, '.title');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.name).toBe('RuleParseError');
      }
    });
  });
});