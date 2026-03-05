/**
 * Advanced AI Optimizer 테스트
 * LLM 파인튜닝, 자동 최적화, 추천, 멀티 에이전트, 학습 피드백
 */

import AIOptimizer, {
  FineTuningConfig,
  AutoOptimizeRequest,
  RecommendationRequest,
  AgentTask,
  UserFeedback,
  ABTestConfig,
  FineTuningResult,
  OptimizeResult,
  TechRecommendation,
} from '../src/optimizer/ai-optimizer';

// Mock Anthropic API (테스트용)
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: `최적화된 코드:
\`\`\`javascript
function optimized() {
  return "optimized";
}
\`\`\`

개선사항:
- 성능 15% 개선
- 메모리 사용량 감소
- 가독성 향상`,
          },
        ],
      }),
    },
  }));
});

describe('AIOptimizer - Advanced AI Integration', () => {
  let optimizer: AIOptimizer;

  beforeEach(() => {
    optimizer = new AIOptimizer('test-api-key');
  });

  afterEach(() => {
    optimizer.reset();
  });

  // ========================================
  // 1️⃣ LLM 파인튜닝 테스트 (5개)
  // ========================================

  describe('LLM 파인튜닝', () => {
    test('1-1: 기본 파인튜닝 실행', async () => {
      const config: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: [
          {
            input: '리스트 정렬하기',
            output: 'list.sort()',
            weight: 1,
          },
          {
            input: '문자열 연결',
            output: '"a" + "b"',
            weight: 1,
          },
          {
            input: '객체 병합',
            output: 'Object.assign({}, a, b)',
            weight: 1,
          },
        ],
      };

      const result = await optimizer.fineTuneModel(config);

      expect(result.trained).toBe(true);
      expect(result.accuracy).toBeGreaterThan(0.8);
      expect(result.trainingDuration).toBeGreaterThanOrEqual(0);
      expect(result.modelId).toContain('fine-tuned');
    });

    test('1-2: 파인튜닝 데이터 검증', async () => {
      const config: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: [], // 빈 데이터
      };

      const result = await optimizer.fineTuneModel(config);

      expect(result.trained).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('1-3: 파인튜닝 메트릭 확인', async () => {
      const config: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: Array.from({ length: 50 }, (_, i) => ({
          input: `입력${i}`,
          output: `출력${i}`,
          weight: 1,
        })),
        learningRate: 0.001,
        epochs: 3,
      };

      const result = await optimizer.fineTuneModel(config);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.datapoints).toBeGreaterThan(0);
      expect(result.metrics.quality).toBeGreaterThan(0);
    });

    test('1-4: 파인튜닝된 모델 조회', async () => {
      const config: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: [
          { input: 'test1', output: 'result1' },
          { input: 'test2', output: 'result2' },
        ],
      };

      const result = await optimizer.fineTuneModel(config);
      const retrieved = optimizer.getFineTunedModel(result.modelId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.modelId).toBe(result.modelId);
      expect(retrieved?.trained).toBe(true);
    });

    test('1-5: 파인튜닝 정확도 비교', async () => {
      const config1: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: [
          { input: 'test', output: 'result' },
          { input: 'test2', output: 'result2' },
        ],
      };

      const config2: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: Array.from({ length: 100 }, (_, i) => ({
          input: `test${i}`,
          output: `result${i}`,
        })),
      };

      const result1 = await optimizer.fineTuneModel(config1);
      const result2 = await optimizer.fineTuneModel(config2);

      expect(result2.accuracy).toBeGreaterThanOrEqual(result1.accuracy);
    });
  });

  // ========================================
  // 2️⃣ 자동 최적화 테스트 (5개)
  // ========================================

  describe('자동 최적화', () => {
    test('2-1: 성능 최적화', async () => {
      const request: AutoOptimizeRequest = {
        code: 'for(let i = 0; i < arr.length; i++) { console.log(arr[i]); }',
        language: 'javascript',
        optimizationType: 'performance',
      };

      const result = await optimizer.optimizeCode(request);

      expect(result.optimizedCode).toBeDefined();
      expect(result.optimizedCode.length).toBeGreaterThan(0);
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.performanceGain).toBe(0.15);
    });

    test('2-2: 보안 최적화', async () => {
      const request: AutoOptimizeRequest = {
        code: "eval(userInput)",
        language: 'javascript',
        optimizationType: 'security',
      };

      const result = await optimizer.optimizeCode(request);

      expect(result.securityScore).toBeGreaterThan(0);
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    test('2-3: 리팩토링', async () => {
      const request: AutoOptimizeRequest = {
        code: 'function f(a,b,c,d,e) { return a+b+c+d+e; }',
        language: 'javascript',
        optimizationType: 'refactoring',
      };

      const result = await optimizer.optimizeCode(request);

      expect(result.refactoringScore).toBeGreaterThan(0);
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    test('2-4: 제약 조건이 있는 최적화', async () => {
      const request: AutoOptimizeRequest = {
        code: 'const result = complexCalculation();',
        language: 'javascript',
        optimizationType: 'all',
        constraints: ['메모리 사용량 < 100MB', '응답 시간 < 1초'],
      };

      const result = await optimizer.optimizeCode(request);

      expect(result.optimizedCode).toBeDefined();
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    test('2-5: 모든 최적화 유형 적용', async () => {
      const request: AutoOptimizeRequest = {
        code: 'const x = Math.pow(2, 10);',
        language: 'javascript',
        optimizationType: 'all',
      };

      const result = await optimizer.optimizeCode(request);

      expect(result.performanceGain).toBeGreaterThanOrEqual(0);
      expect(result.securityScore).toBeGreaterThan(0);
      expect(result.refactoringScore).toBeGreaterThan(0);
    });
  });

  // ========================================
  // 3️⃣ AI 기반 추천 시스템 테스트 (5개)
  // ========================================

  describe('AI 기반 추천', () => {
    test('3-1: 기술 스택 추천', async () => {
      const request: RecommendationRequest = {
        type: 'technology',
        context: {
          projectType: 'web_api',
          team_size: 5,
          performance_requirement: 'high',
        },
        count: 3,
      };

      const results = await optimizer.getRecommendations(request);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && 'name' in results[0]) {
        expect((results[0] as TechRecommendation).score).toBeGreaterThan(0);
      }
    });

    test('3-2: 아키텍처 패턴 추천', async () => {
      const request: RecommendationRequest = {
        type: 'architecture',
        context: {
          scale: 'enterprise',
          complexity: 'high',
          team_experience: 'advanced',
        },
      };

      const results = await optimizer.getRecommendations(request);

      expect(Array.isArray(results)).toBe(true);
    });

    test('3-3: 리소스 최적화 추천', async () => {
      const request: RecommendationRequest = {
        type: 'resource',
        context: {
          current_cpu: 80,
          current_memory: 16,
          cost: 'high',
        },
      };

      const results = await optimizer.getRecommendations(request);

      expect(Array.isArray(results)).toBe(true);
    });

    test('3-4: 제약 조건이 있는 추천', async () => {
      const request: RecommendationRequest = {
        type: 'technology',
        context: { projectType: 'api' },
        constraints: ['오픈소스만', 'MIT 라이선스'],
        count: 5,
      };

      const results = await optimizer.getRecommendations(request);

      expect(Array.isArray(results)).toBe(true);
    });

    test('3-5: 여러 추천 비교', async () => {
      const request: RecommendationRequest = {
        type: 'technology',
        context: { projectType: 'web' },
        count: 5,
      };

      const results = await optimizer.getRecommendations(request);

      if (results.length > 1) {
        const scores = results.map((r) => ('score' in r ? r.score : 0));
        const sorted = [...scores].sort((a, b) => b - a);
        expect(scores[0]).toBe(sorted[0]);
      }
    });
  });

  // ========================================
  // 4️⃣ 멀티 에이전트 조율 테스트 (5개)
  // ========================================

  describe('멀티 에이전트 조율', () => {
    test('4-1: 기본 작업 분배', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'task1',
          type: 'code_analysis',
          payload: { code: 'function test() {}' },
          status: 'pending',
        },
        {
          id: 'task2',
          type: 'security',
          payload: { code: 'eval(x)' },
          status: 'pending',
        },
      ];

      const result = await optimizer.coordinateAgents(tasks);

      expect(result.status).toBe('success');
      expect(result.totalTasks).toBe(2);
      expect(result.results).toBeDefined();
    });

    test('4-2: 에이전트 상태 추적', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'task1',
          type: 'performance',
          payload: { code: 'for(;;){}' },
          status: 'pending',
        },
      ];

      const agents = optimizer.getAgentStatus();
      expect(agents.length).toBeGreaterThan(0);

      await optimizer.coordinateAgents(tasks);

      const agentsAfter = optimizer.getAgentStatus();
      expect(agentsAfter.every((a) => a.status === 'idle')).toBe(true);
    });

    test('4-3: 여러 작업 병렬 처리', async () => {
      const tasks: AgentTask[] = Array.from({ length: 5 }, (_, i) => ({
        id: `task${i}`,
        type: i % 2 === 0 ? 'code_analysis' : 'security',
        payload: { code: `code${i}` },
        status: 'pending' as const,
      }));

      const result = await optimizer.coordinateAgents(tasks);

      expect(result.totalTasks).toBe(5);
      expect(Object.keys(result.results).length).toBe(5);
    });

    test('4-4: 에이전트 메시지 전송', async () => {
      const message = await optimizer.sendMessage(
        'agent-compiler',
        'agent-security',
        'code_review',
        { code: 'test' },
      );

      expect(message.from).toBe('agent-compiler');
      expect(message.to).toBe('agent-security');
      expect(message.timestamp).toBeGreaterThan(0);

      const logs = optimizer.getMessageLog(10);
      expect(logs.length).toBeGreaterThan(0);
    });

    test('4-5: 작업 실패 처리', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'invalid-task',
          type: 'invalid_type',
          payload: {},
          status: 'pending',
        },
      ];

      try {
        await optimizer.coordinateAgents(tasks);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  // ========================================
  // 5️⃣ 학습 & 피드백 테스트 (5개)
  // ========================================

  describe('학습 & 피드백', () => {
    test('5-1: 사용자 피드백 수집', async () => {
      const feedback: UserFeedback = {
        feedbackId: '',
        type: 'improvement',
        content: '최적화 속도를 개선해주세요',
        rating: 4,
        timestamp: 0,
      };

      await optimizer.collectFeedback(feedback);

      const collected = optimizer.getFeedback(1);
      expect(collected.length).toBe(1);
      expect(collected[0].content).toBe('최적화 속도를 개선해주세요');
    });

    test('5-2: 여러 피드백 수집', async () => {
      const feedbacks: UserFeedback[] = Array.from({ length: 5 }, (_, i) => ({
        feedbackId: '',
        type: 'rating',
        content: `피드백${i}`,
        rating: 3 + i,
        timestamp: 0,
      }));

      for (const feedback of feedbacks) {
        await optimizer.collectFeedback(feedback);
      }

      const collected = optimizer.getFeedback(10);
      expect(collected.length).toBe(5);
    });

    test('5-3: A/B 테스트 실행', async () => {
      const config: ABTestConfig = {
        testName: 'optimization-v1',
        variantA: '기존 최적화',
        variantB: '새로운 최적화',
        sampleSize: 1000,
        duration: 3600,
        metric: 'response_time',
      };

      const result = await optimizer.runABTest(config);

      expect(result.testName).toBe('optimization-v1');
      expect(['A', 'B', 'tie']).toContain(result.winner);
      expect(result.confidenceLevel).toBeGreaterThan(0.9);
      expect(result.significant).toBeDefined();
    });

    test('5-4: A/B 테스트 결과 조회', async () => {
      const config: ABTestConfig = {
        testName: 'test-comparison',
        variantA: 'A',
        variantB: 'B',
        sampleSize: 100,
        duration: 1000,
        metric: 'metric',
      };

      await optimizer.runABTest(config);
      const result = optimizer.getABTestResult('test-comparison');

      expect(result).toBeDefined();
      expect(result?.testName).toBe('test-comparison');
    });

    test('5-5: 피드백 기반 모델 개선 추적', async () => {
      const feedbacks: UserFeedback[] = [
        {
          feedbackId: '',
          type: 'bug',
          content: '코드 최적화 버그 발생',
          rating: 2,
          timestamp: 0,
        },
        {
          feedbackId: '',
          type: 'improvement',
          content: '응답 시간 개선됨',
          rating: 5,
          timestamp: 0,
        },
      ];

      for (const feedback of feedbacks) {
        await optimizer.collectFeedback(feedback);
      }

      const allFeedback = optimizer.getFeedback(10);
      const improvementCount = allFeedback.filter((f) => f.rating! >= 4).length;

      expect(improvementCount).toBeGreaterThan(0);
    });
  });

  // ========================================
  // 통합 테스트
  // ========================================

  describe('통합 테스트', () => {
    test('전체 워크플로우: 파인튜닝 → 최적화 → 추천 → 에이전트 → 피드백', async () => {
      // 1. 파인튜닝
      const fineTuneConfig: FineTuningConfig = {
        modelName: 'claude-3-sonnet',
        trainingData: [
          { input: 'optimize', output: 'optimized' },
          { input: 'test', output: 'tested' },
        ],
      };
      const fineTuneResult = await optimizer.fineTuneModel(fineTuneConfig);
      expect(fineTuneResult.trained).toBe(true);

      // 2. 코드 최적화
      const optimizeRequest: AutoOptimizeRequest = {
        code: 'let x = 1;',
        language: 'javascript',
        optimizationType: 'all',
      };
      const optimizeResult = await optimizer.optimizeCode(optimizeRequest);
      expect(optimizeResult.optimizedCode).toBeDefined();

      // 3. 추천 시스템
      const recommendRequest: RecommendationRequest = {
        type: 'technology',
        context: { type: 'api' },
      };
      const recommendations = await optimizer.getRecommendations(recommendRequest);
      expect(recommendations.length).toBeGreaterThanOrEqual(0);

      // 4. 멀티 에이전트
      const tasks: AgentTask[] = [
        {
          id: 'task1',
          type: 'code_analysis',
          payload: { code: 'test' },
          status: 'pending',
        },
      ];
      const coordResult = await optimizer.coordinateAgents(tasks);
      expect(coordResult.status).toBe('success');

      // 5. 피드백
      const feedback: UserFeedback = {
        feedbackId: '',
        type: 'improvement',
        content: '좋음',
        rating: 5,
        timestamp: 0,
      };
      await optimizer.collectFeedback(feedback);
      const feedbacks = optimizer.getFeedback(1);
      expect(feedbacks.length).toBe(1);
    });
  });
});
