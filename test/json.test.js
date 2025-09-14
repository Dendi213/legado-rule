/**
 * JSON 选择器测试 - Vitest 版本
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { jsonSelector } from '../src/selectors/json.js';
import { RuleParseError } from '../src/types.js';

describe('JSON 选择器', () => {
  let jsonData;

  beforeEach(() => {
    jsonData = {
      book: {
        title: "JavaScript 权威指南",
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
      books: [
        {
          id: 1,
          title: "JavaScript 权威指南",
          price: 89
        },
        {
          id: 2,
          title: "Vue.js 实战",
          price: 79
        }
      ]
    };
  });

  describe('基础路径查询', () => {
    it('应该能查询简单属性', async () => {
      const result = await jsonSelector(jsonData, '$.book.title');
      expect(result.success).toBe(true);
      expect(result.data).toBe("JavaScript 权威指南");
    });

    it('应该能查询嵌套属性', async () => {
      const result = await jsonSelector(jsonData, '$.book.author.name');
      expect(result.success).toBe(true);
      expect(result.data).toBe("David Flanagan");
    });

    it('应该能查询数组元素', async () => {
      const result = await jsonSelector(jsonData, '$.book.tags[0]');
      expect(result.success).toBe(true);
      expect(result.data).toBe("编程");
    });

    it('应该能查询整个数组', async () => {
      const result = await jsonSelector(jsonData, '$.book.tags');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["编程", "JavaScript", "前端"]);
    });
  });

  describe('数组查询', () => {
    it('应该能查询数组中的所有元素', async () => {
      const result = await jsonSelector(jsonData, '$.books[*].title');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["JavaScript 权威指南", "Vue.js 实战"]);
    });

    it('应该能查询数组中的特定索引', async () => {
      const result = await jsonSelector(jsonData, '$.books[1].title');
      expect(result.success).toBe(true);
      expect(result.data).toBe("Vue.js 实战");
    });

    it('应该能处理数组越界', async () => {
      const result = await jsonSelector(jsonData, '$.books[10].title');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('条件查询', () => {
    it('应该能根据条件筛选', async () => {
      const result = await jsonSelector(jsonData, '$.books[?(@.price < 85)].title');
      expect(result.success).toBe(true);
      expect(result.data).toBe("Vue.js 实战");
    });

    it('应该能处理不匹配的条件', async () => {
      const result = await jsonSelector(jsonData, '$.books[?(@.price > 100)].title');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('边界情况', () => {
    it('应该处理不存在的路径', async () => {
      const result = await jsonSelector(jsonData, '$.nonexistent.path');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('应该处理无效的 JSON 路径', async () => {
      const result = await jsonSelector(jsonData, '$..invalid..path');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('应该处理非对象输入', async () => {
      try {
        await jsonSelector("string", '$.property');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(RuleParseError);
        expect(error.message).toContain('JSON选择器解析失败');
      }
    });

    it('应该处理 null 输入', async () => {
      try {
        await jsonSelector(null, '$.property');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(RuleParseError);
        expect(error.message).toContain('JSON选择器解析失败');
      }
    });
  });
});