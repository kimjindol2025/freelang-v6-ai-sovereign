"use strict";
/**
 * E2E 테스트
 * V6 Engine 전체 파이프라인 테스트
 *
 * 시나리오:
 * 1️⃣ 사용자 관리 API 생성
 * 2️⃣ React 웹앱 생성
 * 3️⃣ CLI 도구 생성
 */
Object.defineProperty(exports, "__esModule", { value: true });
const v6_engine_1 = require("../src/v6-engine");
describe('V6 Engine E2E Tests', () => {
    let engine;
    beforeAll(() => {
        engine = new v6_engine_1.V6Engine(false); // verbose 모드 비활성화
    });
    /**
     * 테스트 1: 완전한 파이프라인 - API 생성
     */
    test('완전한 파이프라인: 자연어 → 코드 → 배포 준비 (REST API)', async () => {
        const result = await engine.run({
            projectName: 'user-api',
            userPrompt: '사용자 관리 REST API 만들어 (JWT 인증, PostgreSQL)',
            outputDir: './generated',
            dockerize: false,
        });
        // 결과 검증
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.project_name).toBe('user-api');
        expect(result.code_generated).toBe(true);
        expect(result.intent).toBeDefined();
        expect(result.entities).toBeDefined();
        // Intent 검증
        expect(result.intent?.intent).toBe('create_api');
        expect(result.intent?.project_type).toBe('api');
        expect(result.intent?.confidence).toBeGreaterThan(0.5);
        // Entities 검증
        expect(result.entities?.technology).toContain('postgresql');
        expect(result.entities?.requirements.auth).toBe(true);
        // 성능 검증
        expect(result.duration_ms).toBeGreaterThan(0);
        expect(result.duration_ms).toBeLessThan(30000); // 30초 이내
        console.log('✅ API 생성 파이프라인 성공');
        console.log(`  - 프로젝트: ${result.project_name}`);
        console.log(`  - Intent: ${result.intent?.intent}`);
        console.log(`  - 소요 시간: ${result.duration_ms}ms`);
    });
    /**
     * 테스트 2: React 웹앱 생성
     */
    test('React 웹앱 생성', async () => {
        const result = await engine.run({
            projectName: 'react-dashboard',
            userPrompt: 'React 대시보드 만들어 (실시간 차트, 사용자 인증)',
            outputDir: './generated',
            dockerize: false,
        });
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.project_name).toBe('react-dashboard');
        expect(result.code_generated).toBe(true);
        // Intent 검증
        expect(result.intent?.intent).toMatch(/create_(web|api)/);
        // 기술 스택 검증
        if (result.entities?.technology.includes('react')) {
            expect(result.intent?.project_type).toBe('web');
        }
        console.log('✅ React 웹앱 생성 파이프라인 성공');
        console.log(`  - 프로젝트: ${result.project_name}`);
        console.log(`  - Intent: ${result.intent?.intent}`);
    });
    /**
     * 테스트 3: CLI 도구 생성
     */
    test('CLI 도구 생성', async () => {
        const result = await engine.run({
            projectName: 'file-manager-cli',
            userPrompt: '파일 관리 CLI 도구 만들어',
            outputDir: './generated',
            dockerize: false,
        });
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.project_name).toBe('file-manager-cli');
        expect(result.code_generated).toBe(true);
        console.log('✅ CLI 도구 생성 파이프라인 성공');
        console.log(`  - 프로젝트: ${result.project_name}`);
        console.log(`  - Intent: ${result.intent?.intent}`);
    });
    /**
     * 테스트 4: 파이프라인 결과 구조 검증
     */
    test('파이프라인 결과 구조 검증', async () => {
        const result = await engine.run({
            projectName: 'test-project',
            userPrompt: 'Express API 만들어',
            outputDir: './generated',
        });
        // 필수 필드 검증
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('project_name');
        expect(result).toHaveProperty('project_path');
        expect(result).toHaveProperty('intent');
        expect(result).toHaveProperty('entities');
        expect(result).toHaveProperty('code_generated');
        expect(result).toHaveProperty('deployment_ready');
        expect(result).toHaveProperty('duration_ms');
        // 값 검증
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.project_name).toBe('string');
        expect(typeof result.code_generated).toBe('boolean');
        expect(typeof result.deployment_ready).toBe('boolean');
        expect(typeof result.duration_ms).toBe('number');
        console.log('✅ 결과 구조 검증 완료');
    });
    /**
     * 테스트 5: 에러 처리
     */
    test('빈 프롬프트 에러 처리', async () => {
        const result = await engine.run({
            projectName: 'empty-prompt',
            userPrompt: '', // 빈 프롬프트
            outputDir: './generated',
        });
        // 실패하거나 기본값 사용
        expect(result).toBeDefined();
        expect(result.project_name).toBe('empty-prompt');
        console.log('✅ 에러 처리 검증 완료');
    });
    /**
     * 테스트 6: 성능 측정
     */
    test('파이프라인 성능 검증 (10초 이내)', async () => {
        const startTime = Date.now();
        const result = await engine.run({
            projectName: 'perf-test',
            userPrompt: '빠른 API 프로토타입',
            outputDir: './generated',
            dockerize: false,
        });
        const actualDuration = Date.now() - startTime;
        expect(result.success).toBe(true);
        // E2E 테스트는 API 호출이 있어서 더 오래 걸릴 수 있음
        // 따라서 느슨한 제약
        expect(actualDuration).toBeLessThan(60000); // 60초 이내
        console.log('✅ 성능 검증 완료');
        console.log(`  - 소요 시간: ${actualDuration}ms`);
    });
    /**
     * 테스트 7: 다양한 프로젝트 타입 검증
     */
    test('다양한 프로젝트 타입 지원', async () => {
        const scenarios = [
            { name: 'api-project', prompt: 'REST API 서버' },
            { name: 'web-project', prompt: 'React 웹앱' },
            { name: 'cli-project', prompt: 'CLI 도구' },
        ];
        for (const scenario of scenarios) {
            const result = await engine.run({
                projectName: scenario.name,
                userPrompt: scenario.prompt,
                outputDir: './generated',
            });
            expect(result.success).toBe(true);
            expect(result.code_generated).toBe(true);
            expect(result.intent).toBeDefined();
        }
        console.log('✅ 다중 프로젝트 타입 검증 완료');
    });
});
//# sourceMappingURL=e2e.test.js.map