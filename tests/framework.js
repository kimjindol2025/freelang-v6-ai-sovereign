"use strict";
/**
 * Test Framework Setup
 * Jest + TypeScript 설정
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.TestManager = exports.testHelper = void 0;
const globals_1 = require("@jest/globals");
/**
 * 테스트 헬퍼 함수들
 */
exports.testHelper = {
    /**
     * 동기 테스트
     */
    testSync: (name, fn) => {
        (0, globals_1.it)(name, fn);
    },
    /**
     * 비동기 테스트
     */
    testAsync: (name, fn) => {
        (0, globals_1.it)(name, async () => {
            await fn();
        });
    },
    /**
     * 성능 테스트
     */
    testPerformance: (name, fn, maxMs) => {
        (0, globals_1.it)(`${name} (should complete within ${maxMs}ms)`, async () => {
            const start = Date.now();
            await fn();
            const duration = Date.now() - start;
            (0, globals_1.expect)(duration).toBeLessThan(maxMs);
        });
    },
    /**
     * 스냅샷 테스트
     */
    expectSnapshot: (value, name) => {
        (0, globals_1.expect)(value).toMatchSnapshot(name);
    },
};
/**
 * 테스트 관리자
 */
class TestManager {
    constructor() {
        this.tests = new Map();
        this.setupFns = [];
        this.teardownFns = [];
    }
    addSetup(fn) {
        this.setupFns.push(fn);
    }
    addTeardown(fn) {
        this.teardownFns.push(fn);
    }
    addTest(name, fn) {
        this.tests.set(name, fn);
    }
    async runAll() {
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
            }
            catch (error) {
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
exports.TestManager = TestManager;
// Export common assertions
exports.assert = {
    equals: (actual, expected) => {
        (0, globals_1.expect)(actual).toEqual(expected);
    },
    throws: (fn) => {
        (0, globals_1.expect)(fn).toThrow();
    },
    isTrue: (value) => {
        (0, globals_1.expect)(value).toBe(true);
    },
    isFalse: (value) => {
        (0, globals_1.expect)(value).toBe(false);
    },
    exists: (value) => {
        (0, globals_1.expect)(value).toBeDefined();
    },
};
//# sourceMappingURL=framework.js.map