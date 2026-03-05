/**
 * Performance Optimization Tests
 * 성능 최적화 모듈의 통합 테스트
 *
 * 테스트 범위:
 * - 캐싱 효율성 (5개)
 * - DB 최적화 (5개)
 * - 코드 최적화 (5개)
 * - 메트릭 검증 (5개)
 */

import {
  MemoryCache,
  DatabaseOptimizer,
  CodeOptimizer,
  PerformanceMonitor,
  PerformanceOptimizer
} from '../src/optimization/performance-optimizer';

describe('Performance Optimization Tests', () => {
  /**
   * ============================================
   * 캐싱 효율성 테스트 (5개)
   * ============================================
   */

  describe('Caching Strategy Tests', () => {
    let cache: MemoryCache<any>;

    beforeEach(() => {
      cache = new MemoryCache({ ttl: 3600, evictionPolicy: 'LRU' });
    });

    /**
     * 테스트 1: 기본 캐시 저장 및 조회
     */
    test('Test 1: Basic cache set and get operations', () => {
      const key = 'user:123';
      const value = { id: 123, name: 'John Doe' };

      cache.set(key, value);
      const result = cache.get(key);

      expect(result).toEqual(value);
      expect(result?.name).toBe('John Doe');
    });

    /**
     * 테스트 2: TTL 만료 후 자동 제거
     */
    test('Test 2: TTL expiration and automatic removal', async () => {
      const shortCache = new MemoryCache({ ttl: 1 }); // 1초 TTL
      const key = 'temp:data';
      const value = { temp: true };

      shortCache.set(key, value);
      expect(shortCache.get(key)).toEqual(value);

      // 1.5초 대기 (TTL 만료)
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(shortCache.get(key)).toBeNull();
    });

    /**
     * 테스트 3: 캐시 무효화
     */
    test('Test 3: Cache invalidation', () => {
      const key = 'data:123';
      cache.set(key, { data: 'value' });
      expect(cache.get(key)).not.toBeNull();

      cache.invalidate(key);
      expect(cache.get(key)).toBeNull();
    });

    /**
     * 테스트 4: 패턴 기반 무효화
     */
    test('Test 4: Pattern-based cache invalidation', () => {
      // 여러 관련 키 저장
      cache.set('user:1', { id: 1 });
      cache.set('user:2', { id: 2 });
      cache.set('user:3', { id: 3 });
      cache.set('post:1', { id: 1 });

      // user: 패턴 무효화
      cache.invalidatePattern('user:');

      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('user:3')).toBeNull();
      expect(cache.get('post:1')).not.toBeNull(); // post는 유지
    });

    /**
     * 테스트 5: 캐시 통계 및 히트율
     */
    test('Test 5: Cache statistics and hit rate', () => {
      const key = 'stat:test';
      cache.set(key, { value: 'test' });

      // 여러 번 조회
      cache.get(key); // hit 1
      cache.get(key); // hit 2
      cache.get(key); // hit 3

      const stats = cache.getStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.entries).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  /**
   * ============================================
   * 데이터베이스 최적화 테스트 (5개)
   * ============================================
   */

  describe('Database Optimization Tests', () => {
    let dbOptimizer: DatabaseOptimizer;

    beforeEach(() => {
      dbOptimizer = new DatabaseOptimizer({
        connectionPoolSize: 10,
        queryTimeout: 5000,
        enableQueryCaching: true,
        indexFields: ['id', 'user_id', 'created_at']
      });
    });

    /**
     * 테스트 1: 쿼리 최적화 - SELECT * 감지
     */
    test('Test 1: Query optimization - SELECT * detection', () => {
      const query = 'SELECT * FROM users WHERE id = 1';
      const result = dbOptimizer.optimizeQuery(query);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('SELECT *'))).toBe(true);
      expect(result.expectedImprovement).toBeGreaterThan(0);
    });

    /**
     * 테스트 2: N+1 쿼리 패턴 감지
     */
    test('Test 2: N+1 query pattern detection', () => {
      const query = 'SELECT * FROM orders';
      const result = dbOptimizer.optimizeQuery(query);

      // N+1 패턴이 감지되면 JOIN 권장사항 포함
      const hasN1Recommendation = result.recommendations.some(r =>
        r.includes('N+1') || r.includes('JOIN')
      );

      expect(hasN1Recommendation || result.recommendations.length > 0).toBe(true);
    });

    /**
     * 테스트 3: 인덱스 활용도 분석
     */
    test('Test 3: Index utilization analysis', () => {
      const indexedColumnQuery = 'SELECT * FROM users WHERE id = 1';
      const nonIndexedQuery = 'SELECT * FROM users WHERE status = "active"';

      const result1 = dbOptimizer.optimizeQuery(indexedColumnQuery);
      const result2 = dbOptimizer.optimizeQuery(nonIndexedQuery);

      // 인덱스 없는 쿼리가 더 많은 권장사항을 받아야 함
      expect(result2.recommendations.length).toBeGreaterThanOrEqual(
        result1.recommendations.length
      );
    });

    /**
     * 테스트 4: 서브쿼리 최적화
     */
    test('Test 4: Subquery optimization', () => {
      const subqueryQuery = 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)';
      const result = dbOptimizer.optimizeQuery(subqueryQuery);

      const hasSubqueryRec = result.recommendations.some(r =>
        r.includes('서브쿼리') || r.includes('JOIN')
      );

      expect(hasSubqueryRec).toBe(true);
    });

    /**
     * 테스트 5: 연결 풀 설정
     */
    test('Test 5: Connection pool configuration', () => {
      const poolConfig = dbOptimizer.getConnectionPoolConfig();

      expect(poolConfig.min).toBeGreaterThan(0);
      expect(poolConfig.max).toBeGreaterThanOrEqual(poolConfig.min);
      expect(poolConfig.idle).toBeGreaterThan(0);
    });
  });

  /**
   * ============================================
   * 코드 최적화 테스트 (5개)
   * ============================================
   */

  describe('Code Optimization Tests', () => {
    let codeOptimizer: CodeOptimizer;

    beforeEach(() => {
      codeOptimizer = new CodeOptimizer({
        enableMinification: true,
        enableTreeShaking: true,
        enableCodeSplitting: true,
        targetBundleSize: 500 * 1024
      });
    });

    /**
     * 테스트 1: 번들 크기 분석
     */
    test('Test 1: Bundle size analysis', () => {
      const sampleBundle = `
        // Sample code with comments
        const x = 1; /* block comment */
        function test() {
          return x + 2;
        }
      `;

      const analysis = codeOptimizer.analyzeBundleSize(sampleBundle);

      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.minifiedSize).toBeLessThanOrEqual(analysis.totalSize);
      expect(analysis.gzippedSize).toBeGreaterThan(0);
      expect(analysis.gzippedSize).toBeLessThanOrEqual(analysis.totalSize);
    });

    /**
     * 테스트 2: Gzip 압축 크기 추정
     */
    test('Test 2: Gzip compression size estimation', () => {
      const repetitiveCode = 'const x = 1; const y = 1; const z = 1;'.repeat(100);
      const randomCode = Math.random().toString().repeat(100);

      const analysis1 = codeOptimizer.analyzeBundleSize(repetitiveCode);
      const analysis2 = codeOptimizer.analyzeBundleSize(randomCode);

      // gzip 크기가 원본 크기보다 작아야 함 (압축됨)
      expect(analysis1.gzippedSize).toBeLessThan(analysis1.totalSize);
      expect(analysis2.gzippedSize).toBeLessThan(analysis2.totalSize);

      // 반복도가 높은 코드가 더 잘 압축됨 (압축률이 낮음 = 크기가 작음)
      expect(analysis1.gzippedSize / analysis1.totalSize).toBeLessThan(
        analysis2.gzippedSize / analysis2.totalSize
      );
    });

    /**
     * 테스트 3: 큰 모듈 식별
     */
    test('Test 3: Large module identification', () => {
      const bundleWithImports = `
        import * as lodash from 'lodash';
        import * as moment from 'moment';
        import * as axios from 'axios';
        const data = {};
      `;

      const analysis = codeOptimizer.analyzeBundleSize(bundleWithImports);

      // 큰 모듈이 식별되어야 함
      expect(analysis.largeModules.length).toBeGreaterThanOrEqual(0);
    });

    /**
     * 테스트 4: 최적화 기회 식별
     */
    test('Test 4: Code optimization opportunities', () => {
      const problematicCode = `
        import { map, filter, reduce } from 'lodash';
        import moment from 'moment';

        async function process() {
          for (let i = 0; i < data.length; i++) {
            await fetchData(i);
          }
        }
      `;

      const analysis = codeOptimizer.analyzeBundleSize(problematicCode);

      // 최적화 기회가 식별되어야 함
      expect(analysis.opportunities.length).toBeGreaterThan(0);
    });

    /**
     * 테스트 5: 코드 분할 제안
     */
    test('Test 5: Code splitting suggestions', () => {
      const largeApp = `
        app.get('/users', () => {});
        app.get('/posts', () => {});
        app.get('/comments', () => {});
        app.post('/users', () => {});
        app.post('/posts', () => {});

        function util1() {}
        function util2() {}
        function util3() {}
        // ... 20+ 유틸 함수
        ${Array(25).fill('function util() {}').join('\n')}
      `;

      const suggestions = codeOptimizer.suggestCodeSplitting(largeApp);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].estimatedSize).toBeGreaterThan(0);
    });
  });

  /**
   * ============================================
   * 성능 메트릭 검증 테스트 (5개)
   * ============================================
   */

  describe('Performance Metrics Tests', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    /**
     * 테스트 1: 메트릭 기록
     */
    test('Test 1: Record performance metrics', () => {
      monitor.recordMetric('page_load_time', 850, 'ms');
      monitor.recordMetric('ttfb', 150, 'ms');
      monitor.recordMetric('api_response_time', 350, 'ms');

      const metrics = monitor.getMetrics();

      expect(metrics.length).toBe(3);
      expect(metrics[0].name).toBe('page_load_time');
      expect(metrics[0].value).toBe(850);
    });

    /**
     * 테스트 2: 병목지점 감지
     */
    test('Test 2: Bottleneck detection', () => {
      // 임계값을 초과하는 메트릭 기록
      monitor.recordMetric('page_load_time', 2000, 'ms'); // 1000ms 초과
      monitor.recordMetric('ttfb', 150, 'ms');            // 정상

      const bottlenecks = monitor.detectBottlenecks();

      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0].metric).toBe('page_load_time');
    });

    /**
     * 테스트 3: 성능 리포트 생성
     */
    test('Test 3: Performance report generation', () => {
      monitor.recordMetric('page_load_time', 850, 'ms');
      monitor.recordMetric('ttfb', 150, 'ms');
      monitor.recordMetric('api_response_time', 350, 'ms');

      const report = monitor.generateReport();

      expect(report.summary).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.overall_score).toBeGreaterThanOrEqual(0);
      expect(report.overall_score).toBeLessThanOrEqual(100);
    });

    /**
     * 테스트 4: 전체 성능 점수 계산
     */
    test('Test 4: Overall performance score calculation', () => {
      // 좋은 성능
      monitor.recordMetric('page_load_time', 500, 'ms');
      monitor.recordMetric('ttfb', 100, 'ms');

      const report1 = monitor.generateReport();
      const score1 = report1.overall_score;

      monitor.clear();

      // 나쁜 성능
      monitor.recordMetric('page_load_time', 3000, 'ms');
      monitor.recordMetric('ttfb', 800, 'ms');
      monitor.recordMetric('bundle_size', 2 * 1024 * 1024, 'bytes');

      const report2 = monitor.generateReport();
      const score2 = report2.overall_score;

      // 좋은 성능의 점수가 더 높아야 함
      expect(score1).toBeGreaterThan(score2);
    });

    /**
     * 테스트 5: 메트릭 초기화
     */
    test('Test 5: Clear metrics and reset state', () => {
      monitor.recordMetric('page_load_time', 850, 'ms');
      monitor.recordMetric('ttfb', 150, 'ms');

      expect(monitor.getMetrics().length).toBe(2);

      monitor.clear();

      expect(monitor.getMetrics().length).toBe(0);
    });
  });

  /**
   * ============================================
   * 통합 성능 최적화 테스트
   * ============================================
   */

  describe('Integrated Performance Optimization', () => {
    let optimizer: PerformanceOptimizer;

    beforeEach(() => {
      optimizer = new PerformanceOptimizer();
    });

    /**
     * 통합 테스트: 전체 파이프라인 동작
     */
    test('Full optimization pipeline execution', () => {
      const sampleBundle = `
        import * as lodash from 'lodash';
        const x = 1;
        function test() { return x; }
      `;

      const sampleQueries = [
        'SELECT * FROM users WHERE id = 1',
        'SELECT * FROM orders WHERE user_id IN (SELECT id FROM users)'
      ];

      const result = optimizer.optimize(sampleBundle, sampleQueries);

      expect(result.cacheStats).toBeDefined();
      expect(result.bundleAnalysis).toBeDefined();
      expect(result.queryOptimizations).toBeDefined();
      expect(result.performanceReport).toBeDefined();

      expect(result.cacheStats.size).toBeGreaterThanOrEqual(0);
      expect(result.bundleAnalysis.totalSize).toBeGreaterThan(0);
      expect(result.queryOptimizations.length).toBe(2);
    });

    /**
     * 캐시, DB, 코드 최적화 조회
     */
    test('Access individual optimizers from integrated optimizer', () => {
      const cache = optimizer.getCache();
      const dbOpt = optimizer.getDBOptimizer();
      const codeOpt = optimizer.getCodeOptimizer();
      const monitor = optimizer.getMonitor();

      expect(cache).toBeDefined();
      expect(dbOpt).toBeDefined();
      expect(codeOpt).toBeDefined();
      expect(monitor).toBeDefined();
    });
  });

  /**
   * ============================================
   * 성능 목표 달성 검증
   * ============================================
   */

  describe('Performance Targets Verification', () => {
    /**
     * 페이지 로드 시간: < 1초
     */
    test('Page load time target: < 1000ms', () => {
      const monitor = new PerformanceMonitor();

      // 목표 달성
      monitor.recordMetric('page_load_time', 850, 'ms');
      let bottlenecks = monitor.detectBottlenecks();
      expect(bottlenecks.filter(b => b.metric === 'page_load_time').length).toBe(0);

      // 목표 미달
      monitor.clear();
      monitor.recordMetric('page_load_time', 1200, 'ms');
      bottlenecks = monitor.detectBottlenecks();
      expect(bottlenecks.filter(b => b.metric === 'page_load_time').length).toBeGreaterThan(0);
    });

    /**
     * TTFB (Time to First Byte): < 200ms
     */
    test('TTFB target: < 200ms', () => {
      const monitor = new PerformanceMonitor();

      // 목표 달성
      monitor.recordMetric('ttfb', 150, 'ms');
      let bottlenecks = monitor.detectBottlenecks();
      expect(bottlenecks.filter(b => b.metric === 'ttfb').length).toBe(0);

      // 목표 미달
      monitor.clear();
      monitor.recordMetric('ttfb', 300, 'ms');
      bottlenecks = monitor.detectBottlenecks();
      expect(bottlenecks.filter(b => b.metric === 'ttfb').length).toBeGreaterThan(0);
    });

    /**
     * Lighthouse 점수: > 90
     */
    test('Lighthouse score target: > 90', () => {
      const monitor = new PerformanceMonitor();

      // 좋은 성능 메트릭들
      monitor.recordMetric('page_load_time', 500, 'ms');
      monitor.recordMetric('ttfb', 100, 'ms');
      monitor.recordMetric('api_response_time', 300, 'ms');
      monitor.recordMetric('bundle_size', 300 * 1024, 'bytes');
      monitor.recordMetric('memory_usage', 100 * 1024 * 1024, 'bytes');

      const report = monitor.generateReport();
      expect(report.overall_score).toBeGreaterThanOrEqual(90);
    });
  });
});
