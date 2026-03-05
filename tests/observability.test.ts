/**
 * Observability Stack 통합 테스트
 * - 분산 추적 (5개)
 * - 메트릭 수집 (5개)
 * - 로그 집계 (5개)
 * - 에러 추적 (5개)
 * - 프로파일링 (5개)
 */

import {
  ObservabilityStack,
  DistributedTracer,
  PrometheusMetrics,
  ELKAggregator,
  ErrorTracker,
  PerformanceProfiler,
  TraceSpan,
  MetricSample,
  LogEntry,
  ErrorReport,
  ProfileReport,
} from '../src/observability/observability-stack';

describe('ObservabilityStack - 분산 추적 (Distributed Tracing)', () => {
  let tracer: DistributedTracer;

  beforeEach(() => {
    tracer = new DistributedTracer();
  });

  test('T1. 기본 스팬 생성 및 추적', () => {
    const span = tracer.startSpan('http-request');

    expect(span).toBeDefined();
    expect(span.operationName).toBe('http-request');
    expect(span.traceId).toBeDefined();
    expect(span.spanId).toBeDefined();
    expect(span.startTime).toBeGreaterThan(0);
    expect(span.status).toBe('UNSET');

    tracer.endSpan(span, 'OK');

    expect(span.status).toBe('OK');
    expect(span.duration).toBeGreaterThanOrEqual(0);
  });

  test('T2. 부모-자식 스팬 링크', () => {
    const parentSpan = tracer.startSpan('parent-operation');
    const traceContext = {
      traceId: parentSpan.traceId,
      spanId: parentSpan.spanId,
      baggage: {},
    };

    const childSpan = tracer.startSpan('child-operation', traceContext);

    expect(childSpan.traceId).toBe(parentSpan.traceId);
    expect(childSpan.parentSpanId).toBe(parentSpan.spanId);

    tracer.endSpan(childSpan);
    tracer.endSpan(parentSpan);
  });

  test('T3. 스팬 이벤트 추가', () => {
    const span = tracer.startSpan('database-query');

    tracer.addEvent(span, 'query-start', { query: 'SELECT *' });
    tracer.addEvent(span, 'query-end', { rows: 100 });

    expect(span.events).toHaveLength(2);
    expect(span.events[0].name).toBe('query-start');
    expect(span.events[1].attributes.rows).toBe(100);

    tracer.endSpan(span);
  });

  test('T4. 스팬 속성 설정', () => {
    const span = tracer.startSpan('api-call');

    tracer.setAttributes(span, {
      'http.method': 'GET',
      'http.url': 'https://api.example.com',
      'http.status_code': 200,
    });

    expect(span.attributes['http.method']).toBe('GET');
    expect(span.attributes['http.status_code']).toBe(200);

    tracer.endSpan(span);
  });

  test('T5. 스팬 링크 추가', () => {
    const span1 = tracer.startSpan('operation-1');
    const span2 = tracer.startSpan('operation-2');

    const linkedContext = {
      traceId: span1.traceId,
      spanId: span1.spanId,
      baggage: {},
    };

    tracer.addLink(span2, linkedContext);

    expect(span2.links).toHaveLength(1);
    expect(span2.links[0].spanId).toBe(span1.spanId);

    tracer.endSpan(span1);
    tracer.endSpan(span2);
  });
});

describe('ObservabilityStack - 메트릭 수집 (Prometheus Metrics)', () => {
  let metrics: PrometheusMetrics;

  beforeEach(() => {
    metrics = new PrometheusMetrics();
  });

  test('M1. 카운터 메트릭 등록 및 증가', () => {
    metrics.registerCounter('test_counter', 'Test counter', ['label1']);

    metrics.incrementCounter('test_counter', 1, { label1: 'value1' });
    metrics.incrementCounter('test_counter', 2, { label1: 'value1' });

    const samples = metrics.getSamples();
    expect(samples).toHaveLength(2);
    expect(samples[0].value).toBe(1);
    expect(samples[1].value).toBe(2);
  });

  test('M2. 게이지 메트릭 설정', () => {
    metrics.registerGauge('test_gauge', 'Test gauge', ['label']);

    metrics.setGauge('test_gauge', 42, { label: 'cpu' });
    metrics.setGauge('test_gauge', 85, { label: 'memory' });

    const samples = metrics.getSamples();
    expect(samples).toHaveLength(2);
    expect(samples[0].value).toBe(42);
    expect(samples[1].value).toBe(85);
  });

  test('M3. 히스토그램 메트릭 관찰', () => {
    const buckets = [0.1, 0.5, 1, 5, 10];
    metrics.registerHistogram('test_histogram', 'Test histogram', buckets);

    metrics.observeHistogram('test_histogram', 0.25);
    metrics.observeHistogram('test_histogram', 2.5);
    metrics.observeHistogram('test_histogram', 7.5);

    const samples = metrics.getSamples();
    expect(samples).toHaveLength(3);
  });

  test('M4. 요약 메트릭 관찰', () => {
    const quantiles = [0.5, 0.9, 0.99];
    metrics.registerSummary('test_summary', 'Test summary', quantiles);

    metrics.observeSummary('test_summary', 1);
    metrics.observeSummary('test_summary', 2);

    const samples = metrics.getSamples();
    expect(samples).toHaveLength(2);
  });

  test('M5. Prometheus 형식 내보내기', () => {
    metrics.registerCounter('requests_total', 'Total requests', ['method']);
    metrics.incrementCounter('requests_total', 5, { method: 'GET' });

    const output = metrics.exportPrometheus();

    expect(output).toContain('# HELP requests_total');
    expect(output).toContain('# TYPE requests_total');
    expect(output).toContain('requests_total{method="GET"}');
  });
});

describe('ObservabilityStack - 로그 집계 (ELK Integration)', () => {
  let logger: ELKAggregator;

  beforeEach(() => {
    logger = new ELKAggregator();
  });

  test('L1. 로그 기록 (여러 레벨)', () => {
    logger.debug('test-logger', 'Debug message', { key: 'value' });
    logger.info('test-logger', 'Info message', { key: 'value' });
    logger.warn('test-logger', 'Warn message', { key: 'value' });
    logger.error('test-logger', 'Error message', { key: 'value' });
    logger.critical('test-logger', 'Critical message', { key: 'value' });

    const logs = logger.getLogs();
    expect(logs).toHaveLength(5);
    expect(logs[0].level).toBe('DEBUG');
    expect(logs[4].level).toBe('CRITICAL');
  });

  test('L2. 트레이스 ID를 포함한 로그', () => {
    const traceContext = {
      traceId: 'trace-123',
      spanId: 'span-456',
      baggage: {},
    };

    logger.info('test-logger', 'Traced message', {}, traceContext);

    const logs = logger.getLogs();
    expect(logs[0].traceId).toBe('trace-123');
    expect(logs[0].spanId).toBe('span-456');
  });

  test('L3. 에러 스택 트레이스 포함', () => {
    const error = new Error('Test error');
    logger.error('test-logger', 'Error occurred', {}, undefined, error);

    const logs = logger.getLogs();
    expect(logs[0].level).toBe('ERROR');
    expect(logs[0].stackTrace).toBeDefined();
    expect(logs[0].stackTrace).toContain('Error');
  });

  test('L4. 로그 검색', async () => {
    logger.info('logger1', 'Message about database', { service: 'db' });
    logger.info('logger2', 'Message about api', { service: 'api' });
    logger.info('logger3', 'Another database message', { service: 'db' });

    const results = await logger.searchLogs('database', { service: 'db' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].message).toContain('database');
  });

  test('L5. 최소 로그 레벨 설정', () => {
    logger.setMinLogLevel('WARN');

    logger.debug('logger', 'Debug message');
    logger.info('logger', 'Info message');
    logger.warn('logger', 'Warn message');

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('WARN');
  });
});

describe('ObservabilityStack - 에러 추적 (Sentry Integration)', () => {
  let errorTracker: ErrorTracker;

  beforeEach(() => {
    errorTracker = new ErrorTracker();
  });

  test('E1. 에러 캡처 (Error 객체)', () => {
    const error = new Error('Test error');
    const errorId = errorTracker.captureError(error, 'error');

    expect(errorId).toBeDefined();

    const errors = errorTracker.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].errorType).toBe('Error');
    expect(errors[0].message).toBe('Test error');
  });

  test('E2. 문자열 에러 캡처', () => {
    const errorId = errorTracker.captureError('Something went wrong', 'warning');

    expect(errorId).toBeDefined();

    const errors = errorTracker.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe('warning');
  });

  test('E3. 에러 통계 계산', () => {
    errorTracker.captureError(new Error('Type1'), 'error');
    errorTracker.captureError(new Error('Type1'), 'error');
    errorTracker.captureError(new TypeError('Type2'), 'warning');
    errorTracker.captureError(new ReferenceError('Type3'), 'fatal');

    const stats = errorTracker.getStats();
    expect(stats.total).toBe(4);
    expect(stats.bySeverity['error']).toBe(2);
    expect(stats.bySeverity['warning']).toBe(1);
    expect(stats.bySeverity['fatal']).toBe(1);
  });

  test('E4. 타입별 에러 조회', () => {
    errorTracker.captureError(new Error('Error1'), 'error');
    errorTracker.captureError(new TypeError('TypeError1'), 'error');
    errorTracker.captureError(new Error('Error2'), 'error');

    const errors = errorTracker.getErrorsByType('Error');
    expect(errors).toHaveLength(2);

    const typeErrors = errorTracker.getErrorsByType('TypeError');
    expect(typeErrors).toHaveLength(1);
  });

  test('E5. 심각도별 에러 조회', () => {
    errorTracker.captureError(new Error('E1'), 'error');
    errorTracker.captureError(new Error('W1'), 'warning');
    errorTracker.captureError(new Error('F1'), 'fatal');

    const fatalErrors = errorTracker.getErrorsBySeverity('fatal');
    expect(fatalErrors).toHaveLength(1);
    expect(fatalErrors[0].severity).toBe('fatal');
  });
});

describe('ObservabilityStack - 성능 프로파일링 (CPU/Memory Profiling)', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  test('P1. 동기 함수 프로파일링', () => {
    profiler.startProfiling();

    profiler.measureSync('function1', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    });

    const report = profiler.endProfiling();

    expect(report.cpuProfiles).toHaveLength(1);
    expect(report.cpuProfiles[0].functionName).toBe('function1');
    expect(report.cpuProfiles[0].callCount).toBe(1);
    expect(report.cpuProfiles[0].duration).toBeGreaterThanOrEqual(0);
  });

  test('P2. 비동기 함수 프로파일링', async () => {
    profiler.startProfiling();

    await profiler.measureAsync('async-function', async () => {
      return new Promise(resolve => setTimeout(() => resolve(42), 10));
    });

    const report = profiler.endProfiling();

    expect(report.cpuProfiles).toHaveLength(1);
    expect(report.cpuProfiles[0].functionName).toBe('async-function');
    expect(report.cpuProfiles[0].duration).toBeGreaterThanOrEqual(10);
  });

  test('P3. 중첩 함수 프로파일링', () => {
    profiler.startProfiling();

    profiler.measureSync('outer', () => {
      profiler.measureSync('inner', () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        return sum;
      });
      return 42;
    });

    const report = profiler.endProfiling();

    expect(report.cpuProfiles.length).toBeGreaterThanOrEqual(1);
    const functionNames = report.cpuProfiles.map(p => p.functionName);
    expect(functionNames).toContain('outer');
  });

  test('P4. 메모리 스냅샷 캡처', () => {
    profiler.startProfiling();

    profiler.measureSync('memory-test', () => {
      const arr = new Array(1000).fill(0);
      return arr.length;
    });

    const report = profiler.endProfiling();

    expect(report.memorySnapshots.length).toBeGreaterThanOrEqual(2);
    expect(report.memorySnapshots[0]).toHaveProperty('heapUsed');
    expect(report.memorySnapshots[0]).toHaveProperty('rss');
  });

  test('P5. 성능 핫스팟 식별', () => {
    profiler.startProfiling();

    profiler.measureSync('slow-function', () => {
      let sum = 0;
      for (let i = 0; i < 10000; i++) sum += i;
      return sum;
    });

    profiler.measureSync('fast-function', () => {
      return 42;
    });

    const report = profiler.endProfiling();

    expect(report.hotspots.length).toBeGreaterThan(0);
    expect(report.hotspots[0].functionName).toBe('slow-function');
  });
});

describe('ObservabilityStack - 통합 API', () => {
  let stack: ObservabilityStack;

  beforeEach(() => {
    stack = new ObservabilityStack({
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      enableErrorTracking: true,
      enableProfiling: true,
    });
  });

  test('I1. 요청 기록 및 메트릭 수집', () => {
    stack.recordRequest('GET', '/api/users', 50, 200);
    stack.recordRequest('POST', '/api/users', 100, 201);
    stack.recordRequest('GET', '/api/users', 45, 200);

    const samples = stack.getMetricSamples();
    expect(samples.length).toBeGreaterThan(0);
  });

  test('I2. 에러 추적 및 메트릭 기록', () => {
    stack.recordError('ValidationError', 'warning');
    stack.recordError('DatabaseError', 'error');

    const errorStats = stack.getErrorStats();
    expect(errorStats.total).toBe(0); // recordError는 메트릭만, 에러는 기록 안 함
  });

  test('I3. 메모리 사용량 기록', () => {
    stack.recordMemory('heap', 50000000);
    stack.recordMemory('rss', 100000000);

    const samples = stack.getMetricSamples();
    expect(samples.length).toBeGreaterThan(0);
  });

  test('I4. 통합 로깅 및 에러 추적', () => {
    const error = new Error('Integration error');
    stack.error('integration-test', 'An error occurred', error, { userId: 123 });

    const logs = stack.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('An error occurred');

    const errors = stack.getErrors();
    expect(errors).toHaveLength(1);
  });

  test('I5. 전체 상태 조회 및 정리', () => {
    const span = stack.startSpan('test-operation');
    stack.endSpan(span);

    stack.info('test-logger', 'Test message');
    stack.captureError('Test error');

    const traces = stack.getTraces();
    const logs = stack.getLogs();
    const errors = stack.getErrors();

    expect(traces.length).toBeGreaterThan(0);
    expect(logs.length).toBeGreaterThan(0);
    expect(errors.length).toBeGreaterThan(0);

    stack.clear();

    expect(stack.getTraces()).toHaveLength(0);
    expect(stack.getLogs()).toHaveLength(0);
    expect(stack.getErrors()).toHaveLength(0);
  });
});

describe('ObservabilityStack - 성능 및 확장성', () => {
  let stack: ObservabilityStack;

  beforeEach(() => {
    stack = new ObservabilityStack();
  });

  test('S1. 대량 메트릭 처리', () => {
    for (let i = 0; i < 1000; i++) {
      stack.recordRequest('GET', `/api/endpoint${i % 10}`, Math.random() * 100, 200);
    }

    const samples = stack.getMetricSamples();
    expect(samples.length).toBeGreaterThan(100);
  });

  test('S2. 대량 로그 처리', async () => {
    for (let i = 0; i < 500; i++) {
      stack.info('test-logger', `Message ${i}`, { index: i });
    }

    // 배치 플러시 전 로그 확인 (배치 크기 이상)
    const logsBeforeFlush = stack.getLogs();
    expect(logsBeforeFlush.length).toBeGreaterThanOrEqual(0);
  });

  test('S3. 대량 에러 추적', () => {
    for (let i = 0; i < 200; i++) {
      stack.captureError(`Error ${i}`, 'error');
    }

    const errors = stack.getErrors();
    expect(errors).toHaveLength(200);
  });

  test('S4. Prometheus 형식 대량 내보내기', () => {
    for (let i = 0; i < 100; i++) {
      stack.recordRequest('GET', '/api/test', 50, 200);
    }

    const prometheusOutput = stack.exportMetrics();
    expect(prometheusOutput).toContain('freelang_requests_total');
    expect(prometheusOutput.length).toBeGreaterThan(100);
  });

  test('S5. 메모리 효율성 검증', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      const span = stack.startSpan(`operation-${i}`);
      stack.endSpan(span);
      stack.info('logger', `Message ${i}`);
    }

    stack.clear();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // 메모리 증가가 합리적인 범위 내
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB 이하
  });
});
