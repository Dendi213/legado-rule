/**
 * Text选择器测试
 * 测试@text选择器功能（直接输出指定文本内容）
 */
import { describe, it, expect, beforeEach } from "vitest";
import { setupTestEnvironment } from "../helpers/test-setup.js";

describe("Text选择器测试", () => {
  let engine, sampleHtml, sampleJson;

  beforeEach(() => {
    const testEnv = setupTestEnvironment();
    engine = testEnv.engine;
    sampleHtml = testEnv.sampleHtml;
    sampleJson = testEnv.sampleJson;
  });

  describe("基础文本输出", () => {
    it("应该能输出简单文本", async () => {
      const rule = "@text:默认标题";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("默认标题");
      expect(result.selector).toBe("text");
    });

    it("应该能输出包含空格的文本", async () => {
      const rule = "@text:这是一个 带空格的 标题";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("这是一个 带空格的 标题");
    });

    it("应该能输出数字文本", async () => {
      const rule = "@text:12345";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("12345");
    });

    it("应该能输出包含特殊字符的文本", async () => {
      const rule = "@text:价格：￥99.99（特价）";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("价格：￥99.99（特价）");
    });

    it("应该能输出空字符串", async () => {
      const rule = "@text:";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("");
    });

    it("应该能输出中文文本", async () => {
      const rule = "@text:中文测试内容";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("中文测试内容");
    });
  });

  describe("引号文本处理", () => {
    it("应该能处理双引号包围的文本", async () => {
      const rule = '@text:"带引号的文本"';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("带引号的文本");
    });

    it("应该能处理单引号包围的文本", async () => {
      const rule = "@text:'单引号文本'";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("单引号文本");
    });

    it("应该能处理包含转义字符的文本", async () => {
      const rule = '@text:"包含\\"转义\\"的文本"';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('包含"转义"的文本');
    });

    it("应该能处理包含换行符的文本", async () => {
      const rule = '@text:"第一行\\n第二行"';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("第一行\n第二行");
    });
  });

  describe("与回退机制组合", () => {
    it("应该作为回退默认值使用", async () => {
      const rule = "@css:.nonexistent@text || @text:默认值";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("默认值");
    });

    it("应该支持多级回退到文本选择器", async () => {
      const rule = "@css:.none1@text || @css:.none2@text || @text:最终默认值";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("最终默认值");
    });

    it("应该在前面选择器成功时不执行", async () => {
      const rule = "@css:.title@text || @text:不会使用的默认值";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("JavaScript权威指南");
    });

    it("应该支持与不同类型选择器的回退组合", async () => {
      const rule = "@json:$.nonexistent || @regex:/notfound/g || @text:文本回退值";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("文本回退值");
    });
  });

  describe("与字段拼接组合", () => {
    it("应该支持与其他选择器拼接", async () => {
      //" && "才是操作符 两侧应当有空格
      const rule = "@css:.title@text && @text: -  && @text:默认副标题";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("JavaScript权威指南 - 默认副标题");
    });

    it("应该支持多个文本选择器拼接", async () => {
      const rule = "@text:前缀 && @text:中间 && @text:后缀";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("前缀中间后缀");
    });

    it("应该支持与CSS选择器拼接作为标签", async () => {
      const rule = "@text:[图书] && @css:.title@text";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("[图书]JavaScript权威指南");
    });

    it("应该支持复杂的拼接场景", async () => {
      const rule = "@text:书名： && @css:.title@text && @text: | 作者： && @css:.author@text";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("书名：JavaScript权威指南 | 作者：David Flanagan");
    });
  });

  describe("与正则净化组合", () => {
    it("应该支持对文本内容进行正则净化", async () => {
      const rule = "@text:价格：￥99.99元##￥##$";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("价格：$99.99元");
    });

    it("应该支持复杂的文本净化", async () => {
      const rule = "@text:电话：138-1234-5678##(\\d{3})-(\\d{4})-(\\d{4})##$1****$3";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("电话：138****5678");
    });

    it("应该支持移除特殊字符", async () => {
      const rule = "@text:【热门】JavaScript权威指南【推荐】##【.*?】##";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("JavaScript权威指南");
    });
  });

  describe("实际应用场景", () => {
    it("应该支持电商价格默认值", async () => {
      const rule = "@css:.price@text || @text:价格面议";
      const result = await engine.parse('<div class="product">商品信息</div>', rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("价格面议");
    });

    it("应该支持新闻标题回退", async () => {
      const rule = "@css:.main-title@text || @css:.title@text || @text:无标题";
      const result = await engine.parse('<div class="title">测试标题</div>', rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("测试标题");
    });

    it("应该支持状态标签添加", async () => {
      const rule = "@css:.status@text || @text:状态未知";
      const emptyHtml = '<div class="content">内容</div>';
      const result = await engine.parse(emptyHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("状态未知");
    });

    it("应该支持多语言回退", async () => {
      const rule = "@css:.title-zh@text || @css:.title-en@text || @text:Title Not Available";
      const result = await engine.parse("<div></div>", rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("Title Not Available");
    });

    it("应该支持复杂的书籍信息格式化(暂不修复)", async () => {
      const rule = "@text:《 && @css:.title@text && @text:》 - && @css:.author@text && @text: | 状态： && (@css:.status@text || @text:在售)";
      const bookHtml = `
        <div class="book">
          <h1 class="title">JavaScript高级程序设计</h1>
          <p class="author">Nicholas C. Zakas</p>
        </div>
      `;
      const result = await engine.parse(bookHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("《JavaScript高级程序设计》 - Nicholas C. Zakas | 状态：在售");
    });
  });

  describe("边界情况和错误处理", () => {
    it("应该处理null输入", async () => {
      const rule = "@text:null";
      const result = await engine.parse(null, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("null");
    });

    it("应该处理undefined输入", async () => {
      const rule = "@text:undefined";
      const result = await engine.parse(undefined, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("undefined");
    });

    it("应该处理非常长的文本", async () => {
      const longText = "a".repeat(1000);
      const rule = `@text:${longText}`;
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe(longText);
      expect(result.data.length).toBe(1000);
    });

    it("应该处理包含HTML标签的文本", async () => {
      const rule = "@text:<div>这不是HTML</div>";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("<div>这不是HTML</div>");
    });

    it("应该处理包含JSON格式的文本", async () => {
      const rule = '@text:{"key":"value"}';
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe('{"key":"value"}');
    });
  });

  describe("性能测试", () => {
    it("应该高效处理大量文本选择器", async () => {
      const rule = Array.from({ length: 10 }, (_, i) => `@text:文本${i}`).join(" && ");
      const start = Date.now();
      const result = await engine.parse(sampleHtml, rule);
      const duration = Date.now() - start;

      console.log(rule);
      console.log(result.data);

      expect(result.success).toBe(true);
      expect(result.data).toBe("文本0文本1文本2文本3文本4文本5文本6文本7文本8文本9");
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it("应该支持复杂的组合使用", async () => {
      const rule = "@css:.title@text || (@text:默认标题 && @text: - && @css:.author@text) || @text:最终默认值";
      const result = await engine.parse(sampleHtml, rule);

      expect(result.success).toBe(true);
      expect(result.data).toBe("JavaScript权威指南");
    });
  });
});
