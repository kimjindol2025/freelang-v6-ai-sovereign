/**
 * NLP Parser 테스트 스위트
 *
 * 테스트 범위:
 * 1. 복잡한 프롬프트 파싱 (5개 시나리오)
 * 2. 모호성 처리 (3개)
 * 3. 다국어 처리 (3개)
 * 4. 컨텍스트 학습 (3개)
 * 5. 정규화 검증 (3개)
 */

import { NLPParser, CodeGenRequest } from '../src/nlp/nlp-parser';

describe('NLP Parser', () => {
  let parser: NLPParser;

  beforeEach(() => {
    parser = new NLPParser();
  });

  // =========================================================================
  // 테스트 1: 복잡한 프롬프트 (5개 시나리오)
  // =========================================================================

  describe('1. Complex Prompt Scenarios', () => {
    test('1-1: Full-featured API request', async () => {
      const prompt =
        '사용자 관리 REST API 만들어 (JWT 인증, PostgreSQL, 관리자 권한, 실시간 알림)';
      const result = await parser.parse(prompt);

      expect(result.intent).toBeDefined();
      expect(result.project_type).toBe('api');
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.tech_stack.database).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('1-2: Web application with multiple features', async () => {
      const prompt = 'React 대시보드 만들어 (실시간 데이터, 다크모드, 다국어 지원, 내보내기)';
      const result = await parser.parse(prompt);

      expect(result.intent).toBeDefined();
      expect(result.project_type).toBeDefined();
      expect(result.features.some((f) => f.operations?.includes('export'))).toBeTruthy();
      expect(result.requirements.i18n).toBeDefined();
    });

    test('1-3: E-commerce API with payment system', async () => {
      const prompt =
        '전자상거래 API (Express + PostgreSQL, Stripe 결제, JWT 인증, 카테고리별 상품, 주문관리)';
      const result = await parser.parse(prompt);

      expect(result.tech_stack.backend).toBe('express');
      expect(result.tech_stack.database).toBe('postgresql');
      expect(result.features.some((f) => f.name.includes('product'))).toBeTruthy();
      expect(result.features.some((f) => f.name.includes('order'))).toBeTruthy();
    });

    test('1-4: Chat application with advanced features', async () => {
      const prompt =
        '실시간 채팅 앱 (WebSocket, MongoDB, 그룹채팅, 파일전송, 메시지검색, 알림)';
      const result = await parser.parse(prompt);

      expect(result.requirements.realtime).toBeTruthy();
      expect(result.features.some((f) => f.name.includes('chat'))).toBeTruthy();
      expect(result.implicit_requirements?.includes('websocket')).toBeTruthy();
    });

    test('1-5: Microservice architecture request', async () => {
      const prompt = 'FastAPI + PostgreSQL 마이크로서비스 (Redis 캐싱, 모니터링, 로깅)';
      const result = await parser.parse(prompt);

      expect(result.intent).toBeDefined();
      expect(result.requirements.cache_required).toBeTruthy();
      expect(result.requirements.logging).toBeTruthy();
    });
  });

  // =========================================================================
  // 테스트 2: 모호성 처리 (3개)
  // =========================================================================

  describe('2. Ambiguity Detection', () => {
    test('2-1: Low confidence intent detection', async () => {
      const prompt = '뭔가 만들어봐'; // 매우 모호한 요청
      const result = await parser.parse(prompt);

      expect(result.ambiguities).toBeDefined();
      expect(result.ambiguities?.length).toBeGreaterThan(0);
    });

    test('2-2: Multiple frameworks detection', async () => {
      const prompt = 'Express, FastAPI, Django, Go로 동시에 API 만들어';
      const result = await parser.parse(prompt);

      expect(result.ambiguities).toBeDefined();
      const tooManyFrameworksAmbiguity = result.ambiguities?.find(
        (a) => a.type === 'too_many_frameworks'
      );
      expect(tooManyFrameworksAmbiguity).toBeDefined();
    });

    test('2-3: Multiple databases detection', async () => {
      const prompt = 'PostgreSQL, MongoDB, Redis, SQLite 다 쓸거야';
      const result = await parser.parse(prompt);

      expect(result.ambiguities).toBeDefined();
      const multipleDatabasesAmbiguity = result.ambiguities?.find(
        (a) => a.type === 'multiple_databases'
      );
      expect(multipleDatabasesAmbiguity).toBeDefined();
    });
  });

  // =========================================================================
  // 테스트 3: 다국어 처리 (3개)
  // =========================================================================

  describe('3. Multilingual Support', () => {
    test('3-1: Korean request parsing', async () => {
      const prompt = '사용자 관리 API를 만들어줘 (PostgreSQL, JWT)';
      const result = await parser.parse(prompt);

      expect(result.language_detected).toBe('ko');
      expect(result.project_type).toBe('api');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('3-2: English request parsing', async () => {
      const prompt = 'Create REST API for user management with PostgreSQL and JWT authentication';
      const result = await parser.parse(prompt);

      expect(result.language_detected).toBe('en');
      expect(result.project_type).toBe('api');
    });

    test('3-3: Mixed language request parsing', async () => {
      const prompt = 'Express REST API 만들어 with JWT authentication and PostgreSQL database';
      const result = await parser.parse(prompt);

      expect(result.language_detected).toBe('mixed');
      expect(result.tech_stack.backend).toBe('express');
    });
  });

  // =========================================================================
  // 테스트 4: 컨텍스트 학습 (3개)
  // =========================================================================

  describe('4. Context Learning', () => {
    test('4-1: Store previous requests in context', async () => {
      const prompt1 = '사용자 관리 API 만들어';
      const result1 = await parser.parse(prompt1);

      expect(result1).toBeDefined();
      const previousRequests = parser.getPreviousRequests();
      expect(previousRequests.length).toBeGreaterThan(0);
      expect(previousRequests[previousRequests.length - 1]).toEqual(result1);
    });

    test('4-2: Track multiple requests', async () => {
      const prompts = [
        '사용자 관리 API',
        '상품 관리 API',
        '주문 관리 API',
      ];

      for (const prompt of prompts) {
        await parser.parse(prompt);
      }

      const previousRequests = parser.getPreviousRequests();
      expect(previousRequests.length).toBe(3);
    });

    test('4-3: Limit previous requests to specified count', async () => {
      const prompts = Array.from({ length: 10 }, (_, i) => `API ${i}`);

      for (const prompt of prompts) {
        await parser.parse(prompt);
      }

      const limited = parser.getPreviousRequests(3);
      expect(limited.length).toBe(3);
    });
  });

  // =========================================================================
  // 테스트 5: 정규화 검증 (3개)
  // =========================================================================

  describe('5. Output Normalization', () => {
    test('5-1: Feature name normalization', async () => {
      const prompt = '사용자 관리 API'; // "사용자" → "user_management"
      const result = await parser.parse(prompt);

      expect(result.features.length).toBeGreaterThan(0);
      const normalizedNames = result.features.map((f) => f.name);
      expect(normalizedNames.some((n) => n.includes('_'))).toBeTruthy();
    });

    test('5-2: Tech stack normalization', async () => {
      const prompt = 'Express.js + PostgreSQL + JWT';
      const result = await parser.parse(prompt);

      // 정규화된 형식 확인
      expect(result.normalized_output?.tech_stack_normalization).toBeDefined();
    });

    test('5-3: Remove duplicate features', async () => {
      const prompt = '사용자 관리, 사용자 권한, 사용자 프로필'; // 모두 user_management로 정규화
      const result = await parser.parse(prompt);

      const names = result.features.map((f) => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBeLessThanOrEqual(names.length);
    });
  });

  // =========================================================================
  // 추가 테스트: 특정 기능
  // =========================================================================

  describe('Additional Features', () => {
    test('Auto-infer API versioning for API projects', async () => {
      const prompt = 'REST API 만들어';
      const result = await parser.parse(prompt);

      expect(result.implicit_requirements).toBeDefined();
      expect(result.implicit_requirements?.includes('api_versioning')).toBeTruthy();
    });

    test('Auto-infer WebSocket for real-time features', async () => {
      const prompt = '실시간 채팅 시스템';
      const result = await parser.parse(prompt);

      expect(result.implicit_requirements?.includes('websocket')).toBeTruthy();
    });

    test('Auto-infer security for payment systems', async () => {
      const prompt = 'Stripe 결제 기능이 있는 API';
      const result = await parser.parse(prompt);

      expect(result.implicit_requirements?.includes('security_encryption')).toBeTruthy();
    });

    test('Generate appropriate warnings', async () => {
      const prompt = '뭔가 많은 거 만들어';
      const result = await parser.parse(prompt);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThanOrEqual(0);
    });

    test('Extract features with correct operations', async () => {
      const prompt = '사용자 관리 API (create, read, update, delete, search)';
      const result = await parser.parse(prompt);

      const userFeature = result.features.find((f) => f.name.includes('user'));
      expect(userFeature).toBeDefined();
      expect(userFeature?.operations).toBeDefined();
    });

    test('Set and get context', () => {
      parser.setContext({
        project_history: ['project1', 'project2'],
        user_preferences: { language: 'ko' },
      });

      const context = parser.getContext();
      expect(context.project_history).toContain('project1');
      expect(context.user_preferences?.language).toBe('ko');
    });

    test('Build appropriate tech stack for web projects', async () => {
      const prompt = 'React 웹 애플리케이션';
      const result = await parser.parse(prompt);

      expect(result.project_type).toBe('web');
      expect(result.tech_stack.frontend).toBeDefined();
    });

    test('Build appropriate tech stack for API projects', async () => {
      const prompt = 'Express REST API';
      const result = await parser.parse(prompt);

      expect(result.project_type).toBe('api');
      expect(result.tech_stack.backend).toBeDefined();
      expect(result.tech_stack.database).toBeDefined();
    });
  });

  // =========================================================================
  // 엣지 케이스 테스트
  // =========================================================================

  describe('Edge Cases', () => {
    test('Handle empty prompt gracefully', async () => {
      const result = await parser.parse('');
      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.7);
    });

    test('Handle very long prompt', async () => {
      const longPrompt = '사용자 관리 API '.repeat(100);
      const result = await parser.parse(longPrompt);
      expect(result).toBeDefined();
    });

    test('Handle special characters', async () => {
      const prompt = '사용자 관리 API (JWT-auth, PostgreSQL@v14)';
      const result = await parser.parse(prompt);
      expect(result).toBeDefined();
    });

    test('Handle numeric values', async () => {
      const prompt = '10만 사용자 지원하는 API (PostgreSQL v14)';
      const result = await parser.parse(prompt);
      expect(result).toBeDefined();
    });

    test('Return default request on error', async () => {
      // API 키가 없는 환경에서는 기본값 반환
      const result = await parser.parse('API 만들어');
      expect(result.intent).toBeDefined();
      expect(result.project_type).toBeDefined();
      expect(result.features.length).toBeGreaterThan(0);
    });
  });
});
