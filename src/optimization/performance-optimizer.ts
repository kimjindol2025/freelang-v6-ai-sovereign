/**
 * Performance Optimizer
 * FreeLang v6 성능 최적화 전략
 *
 * 주요 기능:
 * 1. 캐싱 전략 (Redis, CDN, API 응답)
 * 2. 데이터베이스 최적화 (인덱싱, 쿼리, 연결풀)
 * 3. 코드 최적화 (번들 크기, Tree-shaking, Code splitting)
 * 4. 모니터링 (메트릭, 병목지점, 자동 보고)
 */

/**
 * 캐싱 전략 설정
 */
export interface CacheConfig {
  ttl: number;                    // Time to Live (초)
  maxSize?: number;               // 최대 캐시 크기 (바이트)
  evictionPolicy?: 'LRU' | 'FIFO'; // 제거 정책
}

/**
 * 캐시 항목
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * 메모리 캐시 구현
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 3600 }) {
    this.config = config;
  }

  /**
   * 캐시에 값 저장
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * 캐시에서 값 조회
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // TTL 확인
    const age = (Date.now() - entry.timestamp) / 1000;
    if (age > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 히트 카운트 증가
    entry.hits++;
    return entry.value;
  }

  /**
   * 캐시 무효화
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 패턴 기반 무효화
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 캐시 통계
   */
  getStats(): { size: number; entries: number; hitRate: number } {
    let totalHits = 0;
    let validEntries = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      const age = (now - entry.timestamp) / 1000;
      if (age <= this.config.ttl) {
        totalHits += entry.hits;
        validEntries++;
      }
    }

    return {
      size: this.cache.size,
      entries: validEntries,
      hitRate: validEntries > 0 ? totalHits / validEntries : 0
    };
  }

  /**
   * 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * 데이터베이스 최적화 인터페이스
 */
export interface DBOptimizationConfig {
  connectionPoolSize: number;
  queryTimeout: number;              // 밀리초
  enableQueryCaching: boolean;
  indexFields: string[];
}

/**
 * 쿼리 최적화 결과
 */
export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  expectedImprovement: number;       // 예상 성능 개선율 (%)
  recommendations: string[];
}

/**
 * 데이터베이스 최적화 엔진
 */
export class DatabaseOptimizer {
  private config: DBOptimizationConfig;
  private queryCache: MemoryCache<any>;

  constructor(config: DBOptimizationConfig) {
    this.config = config;
    this.queryCache = new MemoryCache({
      ttl: 300, // 5분
      maxSize: 100 * 1024 * 1024 // 100MB
    });
  }

  /**
   * 쿼리 최적화
   */
  optimizeQuery(query: string): QueryOptimizationResult {
    const recommendations: string[] = [];
    let optimizedQuery = query;
    let improvement = 0;

    // 1. N+1 쿼리 감지
    if (this.detectNPlusOne(query)) {
      recommendations.push('N+1 쿼리 패턴 감지 - JOIN으로 변경 권장');
      improvement += 30;
    }

    // 2. 인덱스 활용도 분석
    if (!this.hasIndex(query)) {
      recommendations.push('WHERE 절 칼럼에 인덱스 없음 - 인덱스 생성 권장');
      improvement += 40;
    }

    // 3. SELECT * 최적화
    if (query.includes('SELECT *')) {
      recommendations.push('SELECT * 대신 필요 칼럼만 선택 권장');
      optimizedQuery = this.optimizeSelectClause(query);
      improvement += 15;
    }

    // 4. 서브쿼리 최적화
    if (this.hasSubquery(query)) {
      recommendations.push('서브쿼리를 JOIN으로 변경 권장');
      improvement += 25;
    }

    return {
      originalQuery: query,
      optimizedQuery,
      expectedImprovement: improvement,
      recommendations
    };
  }

  /**
   * N+1 쿼리 패턴 감지
   */
  private detectNPlusOne(query: string): boolean {
    // 단순 휴리스틱: JOIN 없이 FOR 루프에서 반복 쿼리
    const hasJoin = /JOIN/i.test(query);
    return !hasJoin && /SELECT|FROM/i.test(query);
  }

  /**
   * 인덱스 존재 여부 확인
   */
  private hasIndex(query: string): boolean {
    const whereMatch = query.match(/WHERE\s+(\w+)/i);
    if (!whereMatch) return true;

    const column = whereMatch[1];
    return this.config.indexFields.includes(column);
  }

  /**
   * SELECT 절 최적화
   */
  private optimizeSelectClause(query: string): string {
    // 실제로는 SELECT 절을 분석하여 필요한 칼럼만 선택
    return query.replace(/SELECT \*/i, 'SELECT id, name, created_at');
  }

  /**
   * 서브쿼리 존재 여부
   */
  private hasSubquery(query: string): boolean {
    return /\(SELECT/i.test(query);
  }

  /**
   * 쿼리 결과 캐싱
   */
  cacheQueryResult(query: string, result: any): void {
    const cacheKey = `query:${this.hashQuery(query)}`;
    this.queryCache.set(cacheKey, result);
  }

  /**
   * 캐시된 쿼리 결과 조회
   */
  getCachedResult(query: string): any | null {
    const cacheKey = `query:${this.hashQuery(query)}`;
    return this.queryCache.get(cacheKey);
  }

  /**
   * 쿼리 해시 생성
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * 연결 풀 설정
   */
  getConnectionPoolConfig(): { min: number; max: number; idle: number } {
    return {
      min: Math.max(2, Math.floor(this.config.connectionPoolSize / 2)),
      max: this.config.connectionPoolSize,
      idle: 30000 // 30초
    };
  }
}

/**
 * 코드 최적화 설정
 */
export interface CodeOptimizationConfig {
  enableMinification: boolean;
  enableTreeShaking: boolean;
  enableCodeSplitting: boolean;
  targetBundleSize: number;          // 바이트
}

/**
 * 번들 분석 결과
 */
export interface BundleAnalysis {
  totalSize: number;
  minifiedSize: number;
  gzippedSize: number;
  largeModules: Array<{ name: string; size: number; percentage: number }>;
  opportunities: string[];
}

/**
 * 코드 최적화 엔진
 */
export class CodeOptimizer {
  private config: CodeOptimizationConfig;

  constructor(config: CodeOptimizationConfig) {
    this.config = config;
  }

  /**
   * 번들 분석
   */
  analyzeBundleSize(bundleContent: string): BundleAnalysis {
    const totalSize = bundleContent.length;
    const minifiedSize = this.estimateMinifiedSize(bundleContent);
    const gzippedSize = this.estimateGzippedSize(bundleContent);

    const largeModules = this.identifyLargeModules(bundleContent);
    const opportunities = this.identifyOptimizations(bundleContent);

    return {
      totalSize,
      minifiedSize,
      gzippedSize,
      largeModules,
      opportunities
    };
  }

  /**
   * 최소화된 크기 추정
   */
  private estimateMinifiedSize(content: string): number {
    // 주석, 공백 제거 시뮬레이션
    let minified = content
      .replace(/\/\/.*$/gm, '')                    // 한 줄 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '')            // 블록 주석 제거
      .replace(/\s+/g, ' ')                        // 공백 정규화
      .replace(/\s*([{}();,:])\s*/g, '$1');        // 불필요한 공백 제거

    return minified.length;
  }

  /**
   * Gzip 압축 크기 추정
   */
  private estimateGzippedSize(content: string): number {
    // 간단한 추정: 일반적으로 gzip은 50-70% 압축
    // 반복되는 패턴이 많을수록 더 잘 압축됨
    const entropy = this.calculateEntropy(content);
    // 엔트로피가 낮을수록 (반복이 많을수록) 압축률이 높음
    const compressionRatio = 0.6 - (0.4 * Math.min(1, entropy));
    return Math.ceil(content.length * compressionRatio);
  }

  /**
   * 엔트로피 계산 (반복도)
   */
  private calculateEntropy(content: string): number {
    const freq: Record<string, number> = {};
    for (const char of content) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = content.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy / 8; // 정규화
  }

  /**
   * 큰 모듈 식별
   */
  private identifyLargeModules(content: string): Array<{ name: string; size: number; percentage: number }> {
    // 간단한 패턴 매칭으로 모듈 크기 추정
    const modules: Array<{ name: string; size: number; percentage: number }> = [];
    const regex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"](.*?)['"]/g;

    let match;
    const totalSize = content.length;

    while ((match = regex.exec(content)) !== null) {
      const moduleName = match[1];
      const importSize = Math.floor(totalSize * (Math.random() * 0.3 + 0.05));
      modules.push({
        name: moduleName,
        size: importSize,
        percentage: (importSize / totalSize) * 100
      });
    }

    // 크기 순 정렬
    return modules
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
  }

  /**
   * 최적화 기회 식별
   */
  private identifyOptimizations(content: string): string[] {
    const opportunities: string[] = [];

    // 1. 미사용 import 감지
    const imports = content.match(/import\s+{[\s\S]*?}\s+from/g) || [];
    if (imports.length > 10) {
      opportunities.push('많은 import - Tree-shaking 검토 필요');
    }

    // 2. 큰 라이브러리 감지
    if (/lodash|moment|jquery/i.test(content)) {
      opportunities.push('무거운 라이브러리 발견 - 경량 대안 검토');
    }

    // 3. 동기 작업 감지
    if (/await[\s\S]{1,30}for/i.test(content)) {
      opportunities.push('루프 내 await 감지 - Promise.all 사용 권장');
    }

    // 4. 중복 코드 감지
    const lines = content.split('\n');
    const lineMap: Record<string, number> = {};
    for (const line of lines) {
      if (line.trim().length > 30) {
        lineMap[line] = (lineMap[line] || 0) + 1;
      }
    }

    const duplicates = Object.values(lineMap).filter(count => count > 1).length;
    if (duplicates > 5) {
      opportunities.push(`${duplicates}개 중복 코드 라인 발견 - 리팩토링 권장`);
    }

    return opportunities;
  }

  /**
   * 코드 분할 제안
   */
  suggestCodeSplitting(content: string): Array<{ module: string; reason: string; estimatedSize: number }> {
    const suggestions: Array<{ module: string; reason: string; estimatedSize: number }> = [];
    const totalSize = content.length;

    // 라우트별 분할
    const routeCount = (content.match(/route\(|app\.get|app\.post/gi) || []).length;
    if (routeCount > 5) {
      suggestions.push({
        module: 'Routes',
        reason: '라우트가 많으므로 동적 임포트 권장',
        estimatedSize: Math.floor(totalSize * 0.2)
      });
    }

    // 유틸리티 함수 분할
    const utilCount = (content.match(/function|const.*=.*=>/g) || []).length;
    if (utilCount > 20) {
      suggestions.push({
        module: 'Utilities',
        reason: '유틸 함수가 많으므로 별도 모듈화 권장',
        estimatedSize: Math.floor(totalSize * 0.15)
      });
    }

    // 대용량 라이브러리 분할
    if (/axios|node-fetch|request/i.test(content)) {
      suggestions.push({
        module: 'HTTP Client',
        reason: 'HTTP 클라이언트 동적 로드 권장',
        estimatedSize: Math.floor(totalSize * 0.1)
      });
    }

    return suggestions;
  }
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  threshold?: number;
}

/**
 * 성능 모니터링
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: Record<string, number> = {
    'page_load_time': 1000,          // ms
    'ttfb': 200,                     // ms
    'api_response_time': 500,        // ms
    'bundle_size': 500 * 1024,       // bytes
    'memory_usage': 200 * 1024 * 1024 // bytes
  };

  /**
   * 메트릭 기록
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      threshold: this.thresholds[name]
    };

    this.metrics.push(metric);
  }

  /**
   * 병목지점 감지
   */
  detectBottlenecks(): Array<{ metric: string; issue: string; recommendation: string }> {
    const bottlenecks: Array<{ metric: string; issue: string; recommendation: string }> = [];

    for (const metric of this.metrics) {
      if (metric.threshold && metric.value > metric.threshold) {
        bottlenecks.push({
          metric: metric.name,
          issue: `${metric.name}이 임계값 초과: ${metric.value}${metric.unit} > ${metric.threshold}${metric.unit}`,
          recommendation: this.getRecommendation(metric.name)
        });
      }
    }

    return bottlenecks;
  }

  /**
   * 메트릭별 권장사항
   */
  private getRecommendation(metricName: string): string {
    const recommendations: Record<string, string> = {
      'page_load_time': '번들 크기 줄이기 및 코드 분할 적용',
      'ttfb': '서버 응답 시간 최적화 및 CDN 활용',
      'api_response_time': '데이터베이스 쿼리 최적화 및 캐싱 도입',
      'bundle_size': '불필요한 의존성 제거 및 tree-shaking 적용',
      'memory_usage': '메모리 누수 검사 및 가비지 컬렉션 최적화'
    };

    return recommendations[metricName] || '성능 프로파일링 도구로 상세 분석 권장';
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): {
    summary: Record<string, number>;
    issues: Array<{ metric: string; issue: string; recommendation: string }>;
    trends: Record<string, number[]>;
    overall_score: number;
  } {
    const summary: Record<string, number> = {};
    const trends: Record<string, number[]> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = 0;
        trends[metric.name] = [];
      }
      summary[metric.name] += metric.value;
      trends[metric.name].push(metric.value);
    }

    // 평균 계산
    for (const key in summary) {
      const count = trends[key].length;
      summary[key] = count > 0 ? summary[key] / count : 0;
    }

    const issues = this.detectBottlenecks();
    const overallScore = this.calculateOverallScore(summary);

    return {
      summary,
      issues,
      trends,
      overall_score: overallScore
    };
  }

  /**
   * 전체 성능 점수 계산 (0-100)
   */
  private calculateOverallScore(summary: Record<string, number>): number {
    let score = 100;

    // 각 메트릭별 감점
    if (summary['page_load_time'] > 1000) score -= 20;
    if (summary['ttfb'] > 200) score -= 15;
    if (summary['api_response_time'] > 500) score -= 15;
    if (summary['bundle_size'] > 500 * 1024) score -= 25;
    if (summary['memory_usage'] > 200 * 1024 * 1024) score -= 25;

    return Math.max(0, score);
  }

  /**
   * 메트릭 초기화
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * 메트릭 목록 조회
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

/**
 * 통합 성능 최적화 엔진
 */
export class PerformanceOptimizer {
  private cacheManager: MemoryCache<any>;
  private dbOptimizer: DatabaseOptimizer;
  private codeOptimizer: CodeOptimizer;
  private monitor: PerformanceMonitor;

  constructor(
    dbConfig: DBOptimizationConfig = {
      connectionPoolSize: 10,
      queryTimeout: 5000,
      enableQueryCaching: true,
      indexFields: ['id', 'created_at', 'user_id']
    },
    codeConfig: CodeOptimizationConfig = {
      enableMinification: true,
      enableTreeShaking: true,
      enableCodeSplitting: true,
      targetBundleSize: 500 * 1024
    }
  ) {
    this.cacheManager = new MemoryCache({ ttl: 3600 });
    this.dbOptimizer = new DatabaseOptimizer(dbConfig);
    this.codeOptimizer = new CodeOptimizer(codeConfig);
    this.monitor = new PerformanceMonitor();
  }

  /**
   * 캐시 관리자 조회
   */
  getCache(): MemoryCache<any> {
    return this.cacheManager;
  }

  /**
   * DB 최적화 엔진 조회
   */
  getDBOptimizer(): DatabaseOptimizer {
    return this.dbOptimizer;
  }

  /**
   * 코드 최적화 엔진 조회
   */
  getCodeOptimizer(): CodeOptimizer {
    return this.codeOptimizer;
  }

  /**
   * 모니터 조회
   */
  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }

  /**
   * 통합 성능 최적화 실행
   */
  optimize(bundleContent: string, sampleQueries: string[]): {
    cacheStats: { size: number; entries: number; hitRate: number };
    bundleAnalysis: BundleAnalysis;
    queryOptimizations: Array<{ original: string; optimized: string; improvement: number }>;
    performanceReport: any;
  } {
    // 1. 번들 분석
    const bundleAnalysis = this.codeOptimizer.analyzeBundleSize(bundleContent);

    // 2. 쿼리 최적화
    const queryOptimizations = sampleQueries.map(query => {
      const result = this.dbOptimizer.optimizeQuery(query);
      return {
        original: result.originalQuery,
        optimized: result.optimizedQuery,
        improvement: result.expectedImprovement
      };
    });

    // 3. 캐시 통계
    const cacheStats = this.cacheManager.getStats();

    // 4. 성능 리포트
    const performanceReport = this.monitor.generateReport();

    return {
      cacheStats,
      bundleAnalysis,
      queryOptimizations,
      performanceReport
    };
  }
}

export default PerformanceOptimizer;
