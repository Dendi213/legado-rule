import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',
    
    // 测试文件匹配模式
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // 全局设置
    globals: true,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // 超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 并发设置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // 监听模式配置
    watch: true,
    
    // 报告器
    reporter: ['verbose'],
    
    // 失败时继续运行其他测试
    bail: 0,
    
    // 测试结果输出
    outputFile: {
      json: './coverage/test-results.json'
    }
  }
});