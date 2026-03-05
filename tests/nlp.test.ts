/**
 * NLP 모듈 테스트
 * Intent Classifier 단위 테스트
 */

import { IntentClassifier } from '../src/nlp/intent-classifier';

describe('NLP Module Tests', () => {
  let classifier: IntentClassifier;

  beforeAll(() => {
    classifier = new IntentClassifier();
  });

  /**
   * 테스트 1: API 의도 분류
   */
  test('API 생성 의도 분류', async () => {
    const prompts = [
      '사용자 관리 REST API 만들어',
      'Express API 서버 구축',
      'REST 엔드포인트 추가',
    ];

    for (const prompt of prompts) {
      const result = await classifier.classify(prompt);

      expect(result).toBeDefined();
      expect(result.intent).toMatch(/create_api|add_feature/);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }

    console.log('✅ API 의도 분류 테스트 완료');
  });

  /**
   * 테스트 2: 웹 애플리케이션 의도 분류
   */
  test('웹앱 생성 의도 분류', async () => {
    const prompts = [
      'React 대시보드 만들어',
      'Vue.js 웹앱 구축',
      '웹 인터페이스 만들기',
    ];

    for (const prompt of prompts) {
      const result = await classifier.classify(prompt);

      expect(result).toBeDefined();
      expect(result.intent).toMatch(/create_(web|api)/);
      expect(result.confidence).toBeGreaterThan(0.5);
    }

    console.log('✅ 웹앱 의도 분류 테스트 완료');
  });

  /**
   * 테스트 3: CLI 도구 의도 분류
   */
  test('CLI 도구 생성 의도 분류', async () => {
    const prompts = [
      '파일 관리 CLI 도구',
      'Node.js CLI 앱',
      'CLI 유틸리티 만들어',
    ];

    for (const prompt of prompts) {
      const result = await classifier.classify(prompt);

      expect(result).toBeDefined();
      expect(result.intent).toMatch(/create_(cli|api|service)/);
    }

    console.log('✅ CLI 의도 분류 테스트 완료');
  });

  /**
   * 테스트 4: 프로젝트 타입 감지
   */
  test('프로젝트 타입 감지', async () => {
    const result = await classifier.classify(
      'Express로 REST API 만들어'
    );

    expect(result).toBeDefined();
    expect(result.project_type).toBeDefined();
    expect(['api', 'web', 'cli', 'service']).toContain(result.project_type);

    console.log('✅ 프로젝트 타입 감지 완료');
  });

  /**
   * 테스트 5: 결과 구조 검증
   */
  test('Intent 분류 결과 구조 검증', async () => {
    const result = await classifier.classify('API 만들어');

    // 필수 필드 검증
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');

    // 값 타입 검증
    expect(typeof result.intent).toBe('string');
    expect(typeof result.confidence).toBe('number');

    // 유효한 값 검증
    expect(result.intent).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);

    console.log('✅ 결과 구조 검증 완료');
  });

  /**
   * 테스트 6: 신뢰도 점수 검증
   */
  test('신뢰도 점수가 유효한 범위 내', async () => {
    const prompts = [
      '뭔가 만들어',
      '명확한 REST API 요청',
      '??',
      '완전히 모호한 프롬프트 문장',
    ];

    for (const prompt of prompts) {
      const result = await classifier.classify(prompt);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }

    console.log('✅ 신뢰도 점수 범위 검증 완료');
  });

  /**
   * 테스트 7: 기본값 폴백
   */
  test('분류 실패 시 기본값 반환', async () => {
    // 분류 실패 시 기본값 반환 테스트
    const result = await classifier.classify('');

    expect(result).toBeDefined();
    expect(result.intent).toBe('create_api'); // 기본값
    expect(result.project_type).toBe('api'); // 기본값

    console.log('✅ 기본값 폴백 테스트 완료');
  });
});
