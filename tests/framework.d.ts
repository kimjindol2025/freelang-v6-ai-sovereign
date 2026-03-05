/**
 * Test Framework Setup
 * Jest + TypeScript 설정
 */
/**
 * 테스트 헬퍼 함수들
 */
export declare const testHelper: {
    /**
     * 동기 테스트
     */
    testSync: (name: string, fn: () => void) => void;
    /**
     * 비동기 테스트
     */
    testAsync: (name: string, fn: () => Promise<void>) => void;
    /**
     * 성능 테스트
     */
    testPerformance: (name: string, fn: () => Promise<void>, maxMs: number) => void;
    /**
     * 스냅샷 테스트
     */
    expectSnapshot: (value: any, name: string) => void;
};
/**
 * 테스트 관리자
 */
export declare class TestManager {
    private tests;
    private setupFns;
    private teardownFns;
    addSetup(fn: () => void | Promise<void>): void;
    addTeardown(fn: () => void | Promise<void>): void;
    addTest(name: string, fn: () => void | Promise<void>): void;
    runAll(): Promise<number>;
}
export declare const assert: {
    equals: (actual: any, expected: any) => void;
    throws: (fn: () => void) => void;
    isTrue: (value: boolean) => void;
    isFalse: (value: boolean) => void;
    exists: (value: any) => void;
};
//# sourceMappingURL=framework.d.ts.map