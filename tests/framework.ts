/**
 * Test Framework Setup
 * Jest + TypeScript 설정
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

/**
 * 테스트 헬퍼 함수들
 */
export const testHelper = {
  /**
   * 동기 테스트
   */
  testSync: (name: string, fn: () => void) => {
    it(name, fn);
  },

  /**
   * 비동기 테스트
   */
  testAsync: (name: string, fn: () => Promise<void>) => {
    it(name, async () => {
      await fn();
    });
  },

  /**
   * 성능 테스트
   */
  testPerformance: (
    name: string,
    fn: () => Promise<void>,
    maxMs: number
  ) => {
    it(`${name} (should complete within ${maxMs}ms)`, async () => {
      const start = Date.now();
      await fn();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(maxMs);
    });
  },

  /**
   * 스냅샷 테스트
   */
  expectSnapshot: (value: any, name: string) => {
    expect(value).toMatchSnapshot(name);
  },
};

/**
 * 테스트 관리자
 */
export class TestManager {
  private tests: Map<string, () => void | Promise<void>> = new Map();
  private setupFns: Array<() => void | Promise<void>> = [];
  private teardownFns: Array<() => void | Promise<void>> = [];

  addSetup(fn: () => void | Promise<void>) {
    this.setupFns.push(fn);
  }

  addTeardown(fn: () => void | Promise<void>) {
    this.teardownFns.push(fn);
  }

  addTest(name: string, fn: () => void | Promise<void>) {
    this.tests.set(name, fn);
  }

  async runAll(): Promise<number> {
    let passed = 0;
    let failed = 0;

    // Run setup
    for (const fn of this.setupFns) {
      await Promise.resolve(fn());
    }

    // Run tests
    for (const [name, fn] of this.tests) {
      try {
        await Promise.resolve(fn());
        console.log(`✅ ${name}`);
        passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        failed++;
      }
    }

    // Run teardown
    for (const fn of this.teardownFns) {
      await Promise.resolve(fn());
    }

    console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
    return failed === 0 ? 0 : 1;
  }
}

// Export common assertions
export const assert = {
  equals: (actual: any, expected: any) => {
    expect(actual).toEqual(expected);
  },
  throws: (fn: () => void) => {
    expect(fn).toThrow();
  },
  isTrue: (value: boolean) => {
    expect(value).toBe(true);
  },
  isFalse: (value: boolean) => {
    expect(value).toBe(false);
  },
  exists: (value: any) => {
    expect(value).toBeDefined();
  },
};
