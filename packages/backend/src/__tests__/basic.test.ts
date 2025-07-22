import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic arithmetic test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string operations', () => {
    const result = 'Hello' + ' ' + 'World';
    expect(result).toBe('Hello World');
  });

  it('should work with objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });

  it('should validate TypeScript types', () => {
    const testFunction = (input: string): string => {
      return `processed: ${input}`;
    };

    expect(testFunction('hello')).toBe('processed: hello');
  });
});

describe('Cloudflare Workers Environment Tests', () => {
  it('should have access to basic Web APIs', () => {
    // Cloudflare Workers環境で利用可能なAPIの基本テスト
    expect(typeof fetch).toBe('function');
    expect(typeof Request).toBe('function');
    expect(typeof Response).toBe('function');
    expect(typeof Headers).toBe('function');
    expect(typeof URL).toBe('function');
  });

  it('should not have browser-only APIs', () => {
    // ブラウザ専用APIは利用不可であることを確認
    // Note: These globals are restricted by ESLint for Cloudflare Workers
    const global = globalThis as Record<string, unknown>;
    expect(typeof global.window).toBe('undefined');
    expect(typeof global.document).toBe('undefined');
    expect(typeof global.localStorage).toBe('undefined');
  });
});
