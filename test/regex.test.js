/**
 * 正则选择器测试 - Vitest 版本
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { regexSelector } from '../src/selectors/regex.js';
import { RuleParseError } from '../src/types.js';

describe('正则选择器', () => {
  let textData;

  beforeEach(() => {
    textData = "书名：《JavaScript权威指南》，价格：￥89.00，原价：￥128.00，ISBN：978-7-111-50715-1";
  });

  describe('基础匹配', () => {
    it('应该能匹配简单模式', async () => {
      const result = await regexSelector(textData, '书名：《(.+?)》');
      expect(result.success).toBe(true);
      expect(result.data).toBe("JavaScript权威指南");
    });

    it('应该能匹配数字', async () => {
      const result = await regexSelector(textData, '￥([\\d.]+)');
      expect(result.success).toBe(true);
      expect(result.data).toBe("89.00");
    });

    it('应该能匹配 ISBN', async () => {
      const result = await regexSelector(textData, 'ISBN：([\\d-]+)');
      expect(result.success).toBe(true);
      expect(result.data).toBe("978-7-111-50715-1");
    });
  });

  describe('全局匹配', () => {
    it('应该能进行全局匹配', async () => {
      const result = await regexSelector(textData, 'g:￥([\\d.]+)');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["89.00", "128.00"]);
    });

    it('应该能匹配所有中文字符', async () => {
      const result = await regexSelector("测试ABC测试123测试", 'g:[\\u4e00-\\u9fa5]+');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["测试", "测试", "测试"]);
    });
  });

  describe('替换操作', () => {
    it('应该能进行文本替换', async () => {
      const result = await regexSelector(textData, '￥([\\d.]+):replace:$1元');
      expect(result.success).toBe(true);
      expect(result.data).toBe("书名：《JavaScript权威指南》，价格：89.00元，原价：￥128.00，ISBN：978-7-111-50715-1");
    });

    it('应该能进行全局替换', async () => {
      const result = await regexSelector(textData, 'g:￥([\\d.]+):replace:$1元');
      expect(result.success).toBe(true);
      expect(result.data).toBe("书名：《JavaScript权威指南》，价格：89.00元，原价：128.00元，ISBN：978-7-111-50715-1");
    });
  });

  describe('分割操作', () => {
    it('应该能按模式分割文本', async () => {
      const result = await regexSelector(textData, '，:split');
      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        "书名：《JavaScript权威指南》",
        "价格：￥89.00",
        "原价：￥128.00",
        "ISBN：978-7-111-50715-1"
      ]);
    });

    it('应该能按数字分割', async () => {
      const result = await regexSelector("abc123def456ghi", '\\d+:split');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["abc", "def", "ghi"]);
    });
  });

  describe('测试操作', () => {
    it('应该能测试模式匹配', async () => {
      const result = await regexSelector(textData, 'JavaScript:test');
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('应该在不匹配时返回 false', async () => {
      const result = await regexSelector(textData, 'Python:test');
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理无匹配的模式', async () => {
      const result = await regexSelector(textData, 'xyz123');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('应该处理无效的正则表达式', async () => {
      try {
        await regexSelector(textData, '[invalid');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(RuleParseError);
        expect(error.message).toContain('正则选择器解析失败');
      }
    });

    it('应该处理空字符串', async () => {
      const result = await regexSelector('', 'test');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('应该处理 null 输入', async () => {
      const result = await regexSelector(null, 'test');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('复杂模式', () => {
    it('应该能处理多个捕获组', async () => {
      const result = await regexSelector("姓名：张三，年龄：25", '姓名：(.+?)，年龄：(\\d+)');
      expect(result.success).toBe(true);
      expect(result.data).toBe("张三");
    });

    it('应该能处理 Unicode 字符', async () => {
      const result = await regexSelector("价格：💰100元", '💰(\\d+)');
      expect(result.success).toBe(true);
      expect(result.data).toBe("100");
    });
  });
});