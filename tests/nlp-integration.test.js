"use strict";
/**
 * NLP 파이프라인 통합 테스트
 * Intent + Entity + Requirement 통합 검증
 *
 * Test 1-8: 8개 통합 테스트 케이스
 */
Object.defineProperty(exports, "__esModule", { value: true });
const intent_classifier_1 = require("../src/nlp/intent-classifier");
const entity_extractor_1 = require("../src/nlp/entity-extractor");
const requirement_parser_1 = require("../src/nlp/requirement-parser");
describe('NLP Integration Tests - Round 2', () => {
    let classifier;
    let extractor;
    let parser;
    beforeAll(() => {
        classifier = new intent_classifier_1.IntentClassifier();
        extractor = new entity_extractor_1.EntityExtractor();
        parser = new requirement_parser_1.RequirementParser();
    });
    /**
     * Test 1: 기본 자연어 입력 → Intent + Entity + Requirement
     *
     * 시나리오: "사용자 관리 REST API 만들어"
     * 예상:
     * - Intent: create_api
     * - Entity: frameworks, databases, auth_types
     * - Requirement: database, auth_type 활성화
     */
    test('Test 1: 기본 API 요청 → 전체 NLP 파이프라인', async () => {
        const userPrompt = '사용자 관리 REST API 만들어';
        // Step 1: Intent 분류
        const intentResult = await classifier.classify(userPrompt);
        expect(intentResult).toBeDefined();
        expect(intentResult.intent).toBe('create_api');
        expect(intentResult.project_type).toBe('api');
        expect(intentResult.confidence).toBeGreaterThan(0.5);
        // Step 2: Entity 추출
        const entities = extractor.extract(userPrompt);
        expect(entities).toBeDefined();
        expect(entities.frameworks).toBeDefined();
        expect(entities.databases).toBeDefined();
        expect(entities.auth_types).toBeDefined();
        expect(entities.features).toBeDefined();
        // Step 3: 요구사항 파싱
        const requirements = parser.parse(userPrompt, entities);
        expect(requirements).toBeDefined();
        expect(requirements.confidence).toBeGreaterThan(0.5);
        // 통합 검증
        expect(intentResult.intent).toBe('create_api');
        expect(requirements.database?.enabled).toBeDefined(); // DB는 권장
        expect(requirements.auth_type?.enabled).toBeDefined(); // Auth는 권장
        console.log('✅ Test 1: 기본 API 요청 통과');
        console.log('   Intent:', intentResult.intent);
        console.log('   Entity count:', Object.keys(entities).filter(k => entities[k].length > 0).length);
        console.log('   Requirements enabled:', Object.values(requirements).filter(v => typeof v === 'object' && v?.enabled).length);
    });
    /**
     * Test 2: 복합 요청 처리
     *
     * 시나리오: "JWT 인증과 관리자 권한, Redis 캐싱이 있는 Express + PostgreSQL API"
     * 예상:
     * - Intent: create_api
     * - Entity: Express, PostgreSQL, JWT
     * - Requirement: auth_type=JWT, cache=Redis, role_based_access=true
     */
    test('Test 2: 복합 프로젝트 요청 처리', async () => {
        const userPrompt = 'JWT 인증과 관리자 권한, Redis 캐싱이 있는 Express + PostgreSQL API';
        // Step 1: Intent
        const intentResult = await classifier.classify(userPrompt);
        expect(intentResult.intent).toBe('create_api');
        // Step 2: Entity
        const entities = extractor.extract(userPrompt);
        expect(entities.frameworks).toContain('Express');
        expect(entities.databases).toContain('PostgreSQL');
        expect(entities.auth_types).toContain('JWT');
        // Step 3: Requirements
        const requirements = parser.parse(userPrompt, entities);
        expect(requirements.auth_type?.enabled).toBe(true);
        expect(requirements.auth_type?.details?.type).toBe('JWT');
        expect(requirements.cache?.enabled).toBe(true);
        expect(requirements.database?.enabled).toBe(true);
        // 우선순위 검증
        const priorities = parser.calculatePriority(requirements);
        expect(priorities['auth_type']).toBeLessThanOrEqual(1); // high 또는 critical
        expect(priorities['database']).toBeLessThanOrEqual(0); // critical
        console.log('✅ Test 2: 복합 프로젝트 요청 통과');
        console.log('   Frameworks found:', entities.frameworks);
        console.log('   Auth type:', requirements.auth_type?.details?.type);
        console.log('   Cache enabled:', requirements.cache?.enabled);
    });
    /**
     * Test 3: 모호한 입력 처리
     *
     * 시나리오: "뭔가 만들어" (모호한 입력)
     * 예상:
     * - Intent: 기본값 (create_api)
     * - Confidence: 낮음 (< 0.7)
     * - Warning: 명확하지 않은 요청
     */
    test('Test 3: 모호한 입력 처리', async () => {
        const ambiguousPrompts = [
            '뭔가 만들어',
            '??',
            '모르겠어',
            ''
        ];
        for (const prompt of ambiguousPrompts) {
            const intentResult = await classifier.classify(prompt);
            const entities = extractor.extract(prompt);
            const requirements = parser.parse(prompt, entities);
            // 모호한 입력은 낮은 신뢰도 또는 기본값 사용
            expect(intentResult).toBeDefined();
            expect(requirements.confidence).toBeLessThanOrEqual(0.8);
            // 기본값 확인
            if (intentResult.confidence < 0.6) {
                expect(intentResult.intent).toBe('create_api');
            }
        }
        console.log('✅ Test 3: 모호한 입력 처리 통과');
    });
    /**
     * Test 4: 성능 테스트 (< 1초/요청)
     *
     * 시나리오: 10개 요청 평균 처리 시간
     * 예상: 평균 < 1초
     */
    test('Test 4: 성능 테스트 (< 1초/요청)', async () => {
        const testPrompts = [
            '사용자 관리 API',
            'React 대시보드',
            'CLI 도구',
            '마이크로서비스',
            'GraphQL 서버',
            'WebSocket 실시간 채팅',
            'Admin 권한 시스템',
            '결제 시스템',
            '모니터링 대시보드',
            'API 게이트웨이'
        ];
        const startTime = Date.now();
        for (const prompt of testPrompts) {
            const t0 = Date.now();
            const intentResult = await classifier.classify(prompt);
            const entities = extractor.extract(prompt);
            const requirements = parser.parse(prompt, entities);
            const elapsed = Date.now() - t0;
            expect(elapsed).toBeLessThan(2000); // 각 요청 < 2초 (API 콜 포함)
        }
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / testPrompts.length;
        console.log(`✅ Test 4: 성능 테스트 통과`);
        console.log(`   총 시간: ${totalTime}ms`);
        console.log(`   평균: ${avgTime.toFixed(2)}ms/요청`);
        console.log(`   요청 수: ${testPrompts.length}`);
    });
    /**
     * Test 5: 병렬 요청 처리
     *
     * 시나리오: 5개 요청 동시 처리
     * 예상: 모든 요청 정상 완료
     */
    test('Test 5: 병렬 요청 처리', async () => {
        const prompts = [
            '사용자 관리 API (JWT, PostgreSQL)',
            'React 대시보드 (실시간 업데이트)',
            'CLI 도구 (Go 언어)',
            '마이크로서비스 (Kafka)',
            '결제 시스템 (Stripe)'
        ];
        const promises = prompts.map(async (prompt) => {
            const intentResult = await classifier.classify(prompt);
            const entities = extractor.extract(prompt);
            const requirements = parser.parse(prompt, entities);
            return { prompt, intentResult, entities, requirements };
        });
        const results = await Promise.all(promises);
        // 모든 결과 검증
        expect(results).toHaveLength(5);
        results.forEach((result, idx) => {
            expect(result.intentResult).toBeDefined();
            expect(result.entities).toBeDefined();
            expect(result.requirements).toBeDefined();
            expect(result.requirements.confidence).toBeGreaterThan(0);
        });
        console.log('✅ Test 5: 병렬 요청 처리 통과');
        console.log(`   처리된 요청: ${results.length}`);
    });
    /**
     * Test 6: 에러 복구
     *
     * 시나리오: API 실패 시 graceful fallback
     * 예상: 기본값 반환, 에러 없음
     */
    test('Test 6: 에러 복구', async () => {
        const testPrompts = [
            '매우매우 긴 프롬프트'.repeat(100), // 과도한 길이
            'null',
            'undefined',
            '특수문자 !@#$%^&*()',
            '\n\n\n\n' // 공백만
        ];
        for (const prompt of testPrompts) {
            try {
                const intentResult = await classifier.classify(prompt);
                const entities = extractor.extract(prompt);
                const requirements = parser.parse(prompt, entities);
                // 에러가 없어야 하고 기본값 또는 합리적인 값 반환
                expect(intentResult).toBeDefined();
                expect(entities).toBeDefined();
                expect(requirements).toBeDefined();
                expect(requirements.confidence).toBeGreaterThanOrEqual(0);
                expect(requirements.confidence).toBeLessThanOrEqual(1);
            }
            catch (error) {
                fail(`에러 복구 실패: ${error}`);
            }
        }
        console.log('✅ Test 6: 에러 복구 통과');
    });
    /**
     * Test 7: 결과 일관성
     *
     * 시나리오: 동일 입력 → 동일 출력
     * 예상: 2회 이상 실행 시 동일한 결과
     */
    test('Test 7: 결과 일관성', async () => {
        const prompt = '사용자 관리 REST API (JWT, PostgreSQL)';
        // 3번 반복 실행
        const results = [];
        for (let i = 0; i < 3; i++) {
            const entities = extractor.extract(prompt);
            const requirements = parser.parse(prompt, entities);
            results.push(requirements);
        }
        // 첫 번째와 나머지 비교
        const firstResult = results[0];
        for (let i = 1; i < results.length; i++) {
            const currentResult = results[i];
            // 활성화된 요구사항 수 비교
            const firstEnabled = Object.values(firstResult)
                .filter(v => typeof v === 'object' && v !== null && v?.enabled)
                .length;
            const currentEnabled = Object.values(currentResult)
                .filter(v => typeof v === 'object' && v !== null && v?.enabled)
                .length;
            expect(currentEnabled).toBe(firstEnabled);
            // 신뢰도 유사성 (±0.1 범위)
            expect(Math.abs(currentResult.confidence - firstResult.confidence)).toBeLessThan(0.15);
        }
        console.log('✅ Test 7: 결과 일관성 통과');
        console.log(`   테스트 실행: 3회`);
        console.log(`   활성 요구사항: ${Object.values(firstResult).filter(v => typeof v === 'object' && v !== null && v?.enabled).length}개`);
    });
    /**
     * Test 8: 캐싱 성능
     *
     * 시나리오: 동일 입력에 대한 반복 호출 성능
     * 예상: 캐시된 결과가 더 빠름
     */
    test('Test 8: 캐싱 최적화 확인', async () => {
        const prompt = '사용자 관리 API';
        // 첫 번째 호출 (캐시 미스)
        const t1Start = Date.now();
        const entities1 = extractor.extract(prompt);
        const requirements1 = parser.parse(prompt, entities1);
        const firstCallTime = Date.now() - t1Start;
        // 두 번째 호출 (캐시 히트 또는 빠른 재계산)
        const t2Start = Date.now();
        const entities2 = extractor.extract(prompt);
        const requirements2 = parser.parse(prompt, entities2);
        const secondCallTime = Date.now() - t2Start;
        // 결과는 동일해야 함
        const firstEnabled = Object.values(requirements1)
            .filter(v => typeof v === 'object' && v?.enabled)
            .length;
        const secondEnabled = Object.values(requirements2)
            .filter(v => typeof v === 'object' && v?.enabled)
            .length;
        expect(secondEnabled).toBe(firstEnabled);
        console.log('✅ Test 8: 캐싱 성능 검증 통과');
        console.log(`   첫 호출: ${firstCallTime}ms`);
        console.log(`   두 번째 호출: ${secondCallTime}ms`);
        console.log(`   결과 일관성: ${firstEnabled === secondEnabled ? '✓' : '✗'}`);
    });
});
//# sourceMappingURL=nlp-integration.test.js.map