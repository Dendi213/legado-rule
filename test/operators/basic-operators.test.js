/**
 * 基础运算符测试
 * 测试回退机制(||)、字段拼接(&&)、属性提取(@attr)、索引选择([n])
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../helpers/test-setup.js';
import { RuleParseError } from '../../src/types.js';

describe('基础运算符测试', () => {
  let engine, sampleHtml, sampleJson;

  beforeEach(() => {
    const testEnv = setupTestEnvironment();
    engine = testEnv.engine;
    sampleHtml = testEnv.sampleHtml;
    sampleJson = testEnv.sampleJson;
  });

  describe('回退机制 (||)', () => {
    it('应该在第一个选择器成功时返回结果', async () => {
      const rule = '@css:.title@text || @css:.backup@text || @js:"默认标题"';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南');
    });

    it('应该在第一个选择器失败时回退到第二个', async () => {
      const rule = '@css:.nonexistent@text || @css:.subtitle@text || @js:"默认标题"';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('第7版');
    });

    it('应该在所有选择器失败时回退到JS默认值', async () => {
      const rule = '@css:.none1@text || @css:.none2@text || @js:"默认标题"';
      const result = await engine.parse(sampleHtml, rule);
      
      // JS选择器现已完全实现，应该成功回退到默认值
      expect(result.success).toBe(true);
      expect(result.data).toBe('默认标题');
    });

    it('应该支持多级回退', async () => {
      const rule = '@css:.none@text || @json:$.book.title || @css:.title@text';
      const result = await engine.parse(sampleJson, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南');
    });

    it('应该在所有选择器都失败时返回失败', async () => {
      const rule = '@css:.none1@text || @css:.none2@text || @css:.none3@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('应该处理复杂的回退链', async () => {
      const rule = '@json:$.book.nonexistent || @css:.nonexistent@text || @regex:/不存在/g || @js:"最终回退值"';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('最终回退值');
    });

    it('应该支持不同类型选择器的混合回退', async () => {
      const rule = '@xpath://nonexistent || @css:.title@text || @json:$.fallback';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南');
    });
  });

  describe('字段拼接 (&&)', () => {
    it('应该能连接两个选择器的结果', async () => {
      const rule = '@css:.category@text && @css:.status@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('编程 技术书籍在售');
    });

    it('应该能连接多个选择器的结果', async () => {
      const rule = '@css:.title@text && @css:.subtitle@text && @css:.author@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南第7版David Flanagan');
    });

    it('应该能连接两个选择器的结果（无分隔符直接拼接）', async () => {
      // 字段拼接应该无任何分隔符，直接将结果连接在一起
      const rule = '@css:.title@text && @css:.author@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南David Flanagan');
    });

    it('应该在任一选择器失败时返回成功但处理较少项目', async () => {
      // 注意：当前实现会忽略失败的选择器，只拼接成功的部分
      const rule = '@css:.title@text && @css:.nonexistent@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南');
    });

    it('应该处理空字符串结果', async () => {
      // 当前实现会忽略空值
      const rule = '@css:.empty@text && @css:.title@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南');
    });

    it('应该支持不同类型选择器的拼接', async () => {
      const rule = '@css:.title@text && @js:"版本号:" && @css:.subtitle@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南版本号:第7版');
    });

    it('应该在所有选择器都失败时返回失败', async () => {
      const rule = '@css:.none1@text && @css:.none2@text && @css:.none3@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(false);
    });
  });

  describe('属性提取 (@attr)', () => {
    it('应该能提取 src 属性', async () => {
      const rule = '@css:img@src';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('/covers/js-guide.jpg');
    });

    it('应该能提取 href 属性', async () => {
      const rule = '@css:.download-link@href';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('https://example.com/book/123');
    });

    it('应该能提取 data 属性', async () => {
      const rule = '@css:.author@data-id';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('123');
    });

    it('应该能提取 alt 属性', async () => {
      const rule = '@css:img@alt';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('书籍封面');
    });

    it('应该在属性不存在时返回空数组', async () => {
      const rule = '@css:.title@href';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('应该能提取自定义属性', async () => {
      const customHtml = '<div class="test" data-custom="自定义值" title="提示信息">内容</div>';
      
      const rule1 = '@css:.test@data-custom';
      const result1 = await engine.parse(customHtml, rule1);
      expect(result1.success).toBe(true);
      expect(result1.data).toBe('自定义值');

      const rule2 = '@css:.test@title';
      const result2 = await engine.parse(customHtml, rule2);
      expect(result2.success).toBe(true);
      expect(result2.data).toBe('提示信息');
    });

    it('应该处理多个元素的属性提取', async () => {
      const multiHtml = `
        <ul>
          <li><a href="/page1">链接1</a></li>
          <li><a href="/page2">链接2</a></li>
          <li><a href="/page3">链接3</a></li>
        </ul>
      `;
      
      const rule = '@css:a@href';
      const result = await engine.parse(multiHtml, rule);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toContain('/page1');
      expect(result.data).toContain('/page2');
      expect(result.data).toContain('/page3');
    });
  });

  describe('索引选择 ([n]) - 当前不支持', () => {
    it.skip('索引选择语法当前不被引擎支持 [0]', async () => {
      // TODO: 实现索引选择功能
      const rule = '@css:li[0]@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('第1章：JavaScript简介');
    });

    it.skip('索引选择语法当前不被引擎支持 [1]', async () => {
      // TODO: 实现索引选择功能
      const rule = '@css:li[1]@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('第2章：词法结构');
    });

    it.skip('负数索引选择语法当前不被引擎支持 [-1]', async () => {
      // TODO: 实现负数索引选择功能
      const rule = '@css:li[-1]@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('最后一章');
    });

    it.skip('负数索引选择语法当前不被引擎支持 [-2]', async () => {
      // TODO: 实现负数索引选择功能
      const rule = '@css:li[-2]@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('倒数第二章');
    });

    it.skip('应该在索引越界时返回失败', async () => {
      // TODO: 实现索引选择功能后测试越界处理
      const rule = '@css:li[10]@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it.skip('应该在负索引越界时返回失败', async () => {
      // TODO: 实现负数索引选择功能后测试越界处理
      const rule = '@css:li[-10]@text';
      const result = await engine.parse(sampleHtml, rule);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });

    it('索引选择与其他运算符组合（当前不支持）', async () => {
      const rule = '@css:li[0]@text || @css:.title@text';
      const result = await engine.parse(sampleHtml, rule);
      
      // 由于索引选择失败，应该回退到第二个选择器
      expect(result.success).toBe(true);
      expect(result.data).toBe('JavaScript权威指南');
    });
  });
});