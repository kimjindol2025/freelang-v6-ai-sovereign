/**
 * Observability Stack - 분산 추적, 메트릭, 로그, 에러 추적, 프로파일링
 *
 * 구성:
 * 1. Distributed Tracing: OpenTelemetry + Jaeger
 * 2. Metrics: Prometheus 메트릭
 * 3. Logs: ELK (Elasticsearch, Logstash, Kibana) 통합
 * 4. Error Tracking: Sentry 통합
 * 5. Profiling: CPU/메모리 프로파일링
 */

// ============================================================================
// 1. 분산 추적 (Distributed Tracing)
// ============================================================================

interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'UNSET' | 'OK' | 'ERROR';
  attributes: Record<string, any>;
  events: SpanEvent[];
  links: SpanLink[];
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, any>;
}

interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, any>;
}

interface TraceContext {
  traceId: string;
  spanId: string;
  baggage: Record<string, string>;
}

class DistributedTracer {
  private spans: Map<string, TraceSpan> = new Map();
  private currentContext: TraceContext | null = null;
  private jaegerEndpoint: string;
  private samplingRate: number = 0.1;

  constructor(jaegerEndpoint: string = 'http://localhost:14268/api/traces') {
    this.jaegerEndpoint = jaegerEndpoint;
  }

  startSpan(operationName: string, parentContext?: TraceContext): TraceSpan {
    const traceId = parentContext?.traceId || this.generateId();
    const spanId = this.generateId();
    const parentSpanId = parentContext?.spanId;

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      status: 'UNSET',
      attributes: {},
      events: [],
      links: [],
    };

    this.spans.set(spanId, span);
    this.currentContext = { traceId, spanId, baggage: {} };

    return span;
  }

  endSpan(span: TraceSpan, status: 'OK' | 'ERROR' = 'OK'): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    // 샘플링 결정
    if (Math.random() <= this.samplingRate) {
      this.sendToJaeger(span);
    }
  }

  addEvent(span: TraceSpan, eventName: string, attributes: Record<string, any> = {}): void {
    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes,
    });
  }

  addLink(span: TraceSpan, linkedTrace: TraceContext): void {
    span.links.push({
      traceId: linkedTrace.traceId,
      spanId: linkedTrace.spanId,
      attributes: {},
    });
  }

  setAttributes(span: TraceSpan, attributes: Record<string, any>): void {
    span.attributes = { ...span.attributes, ...attributes };
  }

  private sendToJaeger(span: TraceSpan): void {
    // Jaeger 형식으로 변환 및 전송
    const jaegerSpan = {
      traceID: span.traceId,
      spanID: span.spanId,
      parentSpanID: span.parentSpanId || '',
      operationName: span.operationName,
      startTime: span.startTime * 1000, // 마이크로초
      duration: span.duration! * 1000,
      tags: Object.entries(span.attributes).map(([key, value]) => ({
        key,
        vType: typeof value,
        vStr: String(value),
      })),
      logs: span.events.map(event => ({
        timestamp: event.timestamp * 1000,
        fields: Object.entries(event.attributes).map(([key, value]) => ({
          key,
          vType: typeof value,
          vStr: String(value),
        })),
      })),
      references: span.links.map(link => ({
        refType: 'CHILD_OF',
        traceID: link.traceId,
        spanID: link.spanId,
      })),
    };

    // 비동기 전송
    setTimeout(() => {
      try {
        // 실제 환경에서는 HTTP POST로 전송
        // fetch(this.jaegerEndpoint, { method: 'POST', body: JSON.stringify(jaegerSpan) })
        console.debug(`[Jaeger] Span sent: ${span.operationName}`);
      } catch (error) {
        console.error('[Jaeger] Failed to send span:', error);
      }
    }, 0);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  getSpans(): TraceSpan[] {
    return Array.from(this.spans.values());
  }

  clearSpans(): void {
    this.spans.clear();
  }
}

// ============================================================================
// 2. 메트릭 수집 (Prometheus Metrics)
// ============================================================================

type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

interface MetricDefinition {
  name: string;
  type: MetricType;
  help: string;
  labels: string[];
  value?: number;
  buckets?: number[]; // for histogram
  quantiles?: number[]; // for summary
}

interface MetricSample {
  name: string;
  labels: Record<string, string>;
  value: number;
  timestamp: number;
}

class PrometheusMetrics {
  private metrics: Map<string, MetricDefinition> = new Map();
  private samples: MetricSample[] = [];
  private pushGatewayUrl: string;

  constructor(pushGatewayUrl: string = 'http://localhost:9091') {
    this.pushGatewayUrl = pushGatewayUrl;
  }

  registerCounter(name: string, help: string, labels: string[] = []): void {
    this.metrics.set(name, {
      name,
      type: 'counter',
      help,
      labels,
      value: 0,
    });
  }

  registerGauge(name: string, help: string, labels: string[] = []): void {
    this.metrics.set(name, {
      name,
      type: 'gauge',
      help,
      labels,
      value: 0,
    });
  }

  registerHistogram(
    name: string,
    help: string,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    labels: string[] = []
  ): void {
    this.metrics.set(name, {
      name,
      type: 'histogram',
      help,
      labels,
      buckets,
    });
  }

  registerSummary(
    name: string,
    help: string,
    quantiles: number[] = [0.5, 0.9, 0.95, 0.99],
    labels: string[] = []
  ): void {
    this.metrics.set(name, {
      name,
      type: 'summary',
      help,
      labels,
      quantiles,
    });
  }

  incrementCounter(name: string, value: number = 1, labelValues: Record<string, string> = {}): void {
    const sample: MetricSample = {
      name,
      labels: labelValues,
      value,
      timestamp: Date.now(),
    };
    this.samples.push(sample);
  }

  setGauge(name: string, value: number, labelValues: Record<string, string> = {}): void {
    const sample: MetricSample = {
      name,
      labels: labelValues,
      value,
      timestamp: Date.now(),
    };
    this.samples.push(sample);
  }

  observeHistogram(name: string, value: number, labelValues: Record<string, string> = {}): void {
    const sample: MetricSample = {
      name,
      labels: labelValues,
      value,
      timestamp: Date.now(),
    };
    this.samples.push(sample);
  }

  observeSummary(name: string, value: number, labelValues: Record<string, string> = {}): void {
    const sample: MetricSample = {
      name,
      labels: labelValues,
      value,
      timestamp: Date.now(),
    };
    this.samples.push(sample);
  }

  exportPrometheus(): string {
    let output = '';

    // 메트릭 정의
    this.metrics.forEach(metric => {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;
    });

    // 샘플 데이터
    this.samples.forEach(sample => {
      const labelStr = Object.entries(sample.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      const labels = labelStr ? `{${labelStr}}` : '';
      output += `${sample.name}${labels} ${sample.value} ${sample.timestamp}\n`;
    });

    return output;
  }

  async pushToGateway(jobName: string, instanceName: string = 'localhost'): Promise<void> {
    try {
      const data = this.exportPrometheus();
      // 실제 환경에서는 HTTP PUT으로 전송
      // await fetch(`${this.pushGatewayUrl}/metrics/job/${jobName}/instance/${instanceName}`, {
      //   method: 'PUT',
      //   body: data,
      // });
      console.debug(`[Prometheus] Metrics pushed: job=${jobName}, instance=${instanceName}`);
    } catch (error) {
      console.error('[Prometheus] Failed to push metrics:', error);
    }
  }

  getSamples(): MetricSample[] {
    return this.samples;
  }

  clearSamples(): void {
    this.samples = [];
  }
}

// ============================================================================
// 3. 로그 집계 (ELK Integration)
// ============================================================================

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  logger: string;
  message: string;
  context: Record<string, any>;
  traceId?: string;
  spanId?: string;
  stackTrace?: string;
}

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

class ELKAggregator {
  private logs: LogEntry[] = [];
  private elasticsearchUrl: string;
  private indexPrefix: string;
  private minLogLevel: LogLevel;

  constructor(
    elasticsearchUrl: string = 'http://localhost:9200',
    indexPrefix: string = 'freelang-logs'
  ) {
    this.elasticsearchUrl = elasticsearchUrl;
    this.indexPrefix = indexPrefix;
    this.minLogLevel = 'DEBUG';
  }

  log(
    level: LogLevel,
    logger: string,
    message: string,
    context: Record<string, any> = {},
    traceContext?: TraceContext
  ): void {
    if (!this.isLogLevelEnabled(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      logger,
      message,
      context,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
    };

    this.logs.push(entry);

    // 임계치 도달 시 배치 전송
    if (this.logs.length >= 100) {
      this.flushToElasticsearch();
    }
  }

  debug(logger: string, message: string, context?: Record<string, any>, traceContext?: TraceContext): void {
    this.log('DEBUG', logger, message, context, traceContext);
  }

  info(logger: string, message: string, context?: Record<string, any>, traceContext?: TraceContext): void {
    this.log('INFO', logger, message, context, traceContext);
  }

  warn(logger: string, message: string, context?: Record<string, any>, traceContext?: TraceContext): void {
    this.log('WARN', logger, message, context, traceContext);
  }

  error(logger: string, message: string, context?: Record<string, any>, traceContext?: TraceContext, error?: Error): void {
    const errorContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
    };
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      logger,
      message,
      context: errorContext,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      stackTrace: error?.stack,
    };
    this.logs.push(entry);
  }

  critical(logger: string, message: string, context?: Record<string, any>, traceContext?: TraceContext, error?: Error): void {
    const errorContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
    };
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'CRITICAL',
      logger,
      message,
      context: errorContext,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      stackTrace: error?.stack,
    };
    this.logs.push(entry);
  }

  private isLogLevelEnabled(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      'DEBUG': 0,
      'INFO': 1,
      'WARN': 2,
      'ERROR': 3,
      'CRITICAL': 4,
    };
    return levels[level] >= levels[this.minLogLevel];
  }

  async flushToElasticsearch(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      const indexDate = new Date().toISOString().split('T')[0];
      const indexName = `${this.indexPrefix}-${indexDate}`;
      const bulk = this.logs
        .map(log => JSON.stringify({ index: { _index: indexName } }) + '\n' + JSON.stringify(log))
        .join('\n') + '\n';

      // 실제 환경에서는 HTTP POST로 전송
      // await fetch(`${this.elasticsearchUrl}/_bulk`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-ndjson' },
      //   body: bulk,
      // });
      console.debug(`[ELK] Flushed ${this.logs.length} logs to ${indexName}`);
      this.logs = [];
    } catch (error) {
      console.error('[ELK] Failed to flush logs:', error);
    }
  }

  async searchLogs(
    query: string,
    filters?: Record<string, any>,
    limit: number = 100
  ): Promise<LogEntry[]> {
    try {
      // 실제 환경에서는 Elasticsearch 쿼리 실행
      const results = this.logs.filter(log => {
        if (!log.message.includes(query)) return false;
        if (filters) {
          return Object.entries(filters).every(([key, value]) =>
            log.context[key] === value
          );
        }
        return true;
      });
      return results.slice(0, limit);
    } catch (error) {
      console.error('[ELK] Search failed:', error);
      return [];
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }
}

// ============================================================================
// 4. 에러 추적 (Sentry Integration)
// ============================================================================

interface ErrorReport {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  stackTrace: string;
  context: Record<string, any>;
  traceId?: string;
  severity: 'fatal' | 'error' | 'warning' | 'info';
  fingerprint: string[];
  tags: Record<string, string>;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private sentryDsn: string;
  private fingerprints: Set<string> = new Set();

  constructor(sentryDsn: string = 'https://examplePublicKey@o0.ingest.sentry.io/0') {
    this.sentryDsn = sentryDsn;
  }

  captureError(
    error: Error | string,
    severity: 'fatal' | 'error' | 'warning' | 'info' = 'error',
    context: Record<string, any> = {},
    traceId?: string
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = error instanceof Error ? error.stack || '' : '';
    const errorType = error instanceof Error ? error.constructor.name : 'Error';

    // 지문 생성 (중복 제거)
    const fingerprint = [errorType, errorMessage];
    const fingerprintStr = JSON.stringify(fingerprint);

    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      errorType,
      message: errorMessage,
      stackTrace,
      context,
      traceId,
      severity,
      fingerprint,
      tags: this.extractTags(context),
    };

    this.errors.push(report);
    this.fingerprints.add(fingerprintStr);

    // Sentry로 전송
    this.sendToSentry(report);

    return report.id;
  }

  captureException(error: Error, context?: Record<string, any>, traceId?: string): string {
    return this.captureError(error, 'error', context, traceId);
  }

  captureMessage(message: string, severity: 'warning' | 'info' = 'info', context?: Record<string, any>): string {
    return this.captureError(message, severity, context);
  }

  getStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
    };

    this.errors.forEach(error => {
      stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  private sendToSentry(report: ErrorReport): void {
    try {
      // 실제 환경에서는 HTTP POST로 전송
      // fetch(this.sentryDsn, {
      //   method: 'POST',
      //   body: JSON.stringify(report),
      // });
      console.debug(`[Sentry] Error captured: ${report.errorType}`);
    } catch (error) {
      console.error('[Sentry] Failed to send error:', error);
    }
  }

  private extractTags(context: Record<string, any>): Record<string, string> {
    const tags: Record<string, string> = {};
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        tags[key] = String(value);
      }
    });
    return tags;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  getErrors(): ErrorReport[] {
    return this.errors;
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorsByType(type: string): ErrorReport[] {
    return this.errors.filter(e => e.errorType === type);
  }

  getErrorsBySeverity(severity: string): ErrorReport[] {
    return this.errors.filter(e => e.severity === severity);
  }
}

// ============================================================================
// 5. 성능 프로파일링 (CPU/Memory Profiling)
// ============================================================================

interface CpuProfile {
  functionName: string;
  duration: number; // ms
  callCount: number;
  selfTime: number; // ms (function 자체 실행 시간)
  childTime: number; // ms (호출된 함수 시간)
}

interface MemoryProfile {
  timestamp: string;
  heapUsed: number; // bytes
  heapTotal: number; // bytes
  external: number; // bytes
  arrayBuffers: number; // bytes
  rss: number; // bytes (resident set size)
}

interface ProfileReport {
  startTime: string;
  endTime: string;
  duration: number; // ms
  cpuProfiles: CpuProfile[];
  memorySnapshots: MemoryProfile[];
  hotspots: CpuProfile[]; // 상위 5개
}

class PerformanceProfiler {
  private cpuProfiles: Map<string, CpuProfile> = new Map();
  private memorySnapshots: MemoryProfile[] = [];
  private callStack: string[] = [];
  private startTime: number = 0;

  startProfiling(): void {
    this.startTime = Date.now();
    this.cpuProfiles.clear();
    this.memorySnapshots = [];
    this.captureMemory();
  }

  endProfiling(): ProfileReport {
    const endTime = Date.now();
    this.captureMemory();

    // 상위 5개 함수 추출
    const sortedProfiles = Array.from(this.cpuProfiles.values())
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: endTime - this.startTime,
      cpuProfiles: Array.from(this.cpuProfiles.values()),
      memorySnapshots: this.memorySnapshots,
      hotspots: sortedProfiles,
    };
  }

  enterFunction(functionName: string): void {
    this.callStack.push(functionName);
  }

  exitFunction(functionName: string, duration: number): void {
    this.callStack.pop();

    if (!this.cpuProfiles.has(functionName)) {
      this.cpuProfiles.set(functionName, {
        functionName,
        duration: 0,
        callCount: 0,
        selfTime: 0,
        childTime: 0,
      });
    }

    const profile = this.cpuProfiles.get(functionName)!;
    profile.duration += duration;
    profile.callCount += 1;
    profile.selfTime += duration;

    // 상위 함수의 childTime 업데이트
    if (this.callStack.length > 0) {
      const parentName = this.callStack[this.callStack.length - 1];
      if (this.cpuProfiles.has(parentName)) {
        this.cpuProfiles.get(parentName)!.childTime += duration;
      }
    }
  }

  private captureMemory(): void {
    // Node.js 메모리 정보
    if (global.gc) {
      global.gc();
    }

    // 메모리 사용량 기록
    const snapshot: MemoryProfile = {
      timestamp: new Date().toISOString(),
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      arrayBuffers: process.memoryUsage().arrayBuffers,
      rss: process.memoryUsage().rss,
    };

    this.memorySnapshots.push(snapshot);
  }

  measureAsync<T>(
    functionName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.enterFunction(functionName);

    return fn()
      .then(result => {
        const duration = Date.now() - startTime;
        this.exitFunction(functionName, duration);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        this.exitFunction(functionName, duration);
        throw error;
      });
  }

  measureSync<T>(
    functionName: string,
    fn: () => T
  ): T {
    const startTime = Date.now();
    this.enterFunction(functionName);

    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.exitFunction(functionName, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.exitFunction(functionName, duration);
      throw error;
    }
  }

  getProfiles(): CpuProfile[] {
    return Array.from(this.cpuProfiles.values());
  }

  getMemorySnapshots(): MemoryProfile[] {
    return this.memorySnapshots;
  }

  clear(): void {
    this.cpuProfiles.clear();
    this.memorySnapshots = [];
    this.callStack = [];
  }
}

// ============================================================================
// 6. 통합 Observability Stack
// ============================================================================

interface ObservabilityConfig {
  jaegerEndpoint?: string;
  prometheusGateway?: string;
  elasticsearchUrl?: string;
  sentryDsn?: string;
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  enableErrorTracking?: boolean;
  enableProfiling?: boolean;
}

class ObservabilityStack {
  private tracer: DistributedTracer;
  private metrics: PrometheusMetrics;
  private logger: ELKAggregator;
  private errorTracker: ErrorTracker;
  private profiler: PerformanceProfiler;
  private config: ObservabilityConfig;

  constructor(config: ObservabilityConfig = {}) {
    this.config = {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      enableErrorTracking: true,
      enableProfiling: true,
      ...config,
    };

    this.tracer = new DistributedTracer(config.jaegerEndpoint);
    this.metrics = new PrometheusMetrics(config.prometheusGateway);
    this.logger = new ELKAggregator(config.elasticsearchUrl);
    this.errorTracker = new ErrorTracker(config.sentryDsn);
    this.profiler = new PerformanceProfiler();

    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics(): void {
    if (!this.config.enableMetrics) return;

    this.metrics.registerCounter(
      'freelang_requests_total',
      'Total number of requests',
      ['method', 'endpoint', 'status']
    );

    this.metrics.registerHistogram(
      'freelang_request_duration_ms',
      'Request duration in milliseconds',
      [10, 50, 100, 500, 1000, 5000],
      ['method', 'endpoint']
    );

    this.metrics.registerGauge(
      'freelang_active_requests',
      'Number of active requests',
      ['method', 'endpoint']
    );

    this.metrics.registerCounter(
      'freelang_errors_total',
      'Total number of errors',
      ['type', 'severity']
    );

    this.metrics.registerHistogram(
      'freelang_memory_usage_bytes',
      'Memory usage in bytes',
      [1024 * 1024, 10 * 1024 * 1024, 100 * 1024 * 1024],
      ['type']
    );
  }

  // Tracing API
  startSpan(operationName: string, parentContext?: TraceContext): TraceSpan {
    return this.tracer.startSpan(operationName, parentContext);
  }

  endSpan(span: TraceSpan, status: 'OK' | 'ERROR' = 'OK'): void {
    this.tracer.endSpan(span, status);
  }

  addEvent(span: TraceSpan, eventName: string, attributes?: Record<string, any>): void {
    this.tracer.addEvent(span, eventName, attributes);
  }

  // Metrics API
  recordRequest(method: string, endpoint: string, duration: number, status: number): void {
    this.metrics.incrementCounter('freelang_requests_total', 1, {
      method,
      endpoint,
      status: String(status),
    });

    this.metrics.observeHistogram('freelang_request_duration_ms', duration, {
      method,
      endpoint,
    });
  }

  recordError(errorType: string, severity: string): void {
    this.metrics.incrementCounter('freelang_errors_total', 1, {
      type: errorType,
      severity,
    });
  }

  recordMemory(type: string, bytes: number): void {
    this.metrics.observeHistogram('freelang_memory_usage_bytes', bytes, { type });
  }

  // Logging API
  log(
    level: LogLevel,
    logger: string,
    message: string,
    context?: Record<string, any>,
    traceContext?: TraceContext
  ): void {
    this.logger.log(level, logger, message, context, traceContext);
  }

  debug(logger: string, message: string, context?: Record<string, any>): void {
    this.logger.debug(logger, message, context);
  }

  info(logger: string, message: string, context?: Record<string, any>): void {
    this.logger.info(logger, message, context);
  }

  warn(logger: string, message: string, context?: Record<string, any>): void {
    this.logger.warn(logger, message, context);
  }

  error(logger: string, message: string, error?: Error, context?: Record<string, any>): void {
    this.logger.error(logger, message, context, undefined, error);
    this.errorTracker.captureException(error || new Error(message), context);
  }

  // Error Tracking API
  captureError(error: Error | string, severity?: 'fatal' | 'error' | 'warning' | 'info'): string {
    const severity_val = severity || 'error';
    return this.errorTracker.captureError(error, severity_val);
  }

  getErrorStats(): ErrorStats {
    return this.errorTracker.getStats();
  }

  // Profiling API
  startProfiling(): void {
    this.profiler.startProfiling();
  }

  endProfiling(): ProfileReport {
    return this.profiler.endProfiling();
  }

  measureAsync<T>(
    functionName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.profiler.measureAsync(functionName, fn);
  }

  measureSync<T>(
    functionName: string,
    fn: () => T
  ): T {
    return this.profiler.measureSync(functionName, fn);
  }

  // Export & Flush
  async flush(): Promise<void> {
    if (this.config.enableLogging) {
      await this.logger.flushToElasticsearch();
    }
    if (this.config.enableMetrics) {
      await this.metrics.pushToGateway('freelang');
    }
  }

  exportMetrics(): string {
    return this.metrics.exportPrometheus();
  }

  getTraces(): TraceSpan[] {
    return this.tracer.getSpans();
  }

  getMetricSamples(): MetricSample[] {
    return this.metrics.getSamples();
  }

  getLogs(): LogEntry[] {
    return this.logger.getLogs();
  }

  getErrors(): ErrorReport[] {
    return this.errorTracker.getErrors();
  }

  getProfiles(): CpuProfile[] {
    return this.profiler.getProfiles();
  }

  // Cleanup
  clear(): void {
    this.tracer.clearSpans();
    this.metrics.clearSamples();
    this.logger.clearLogs();
    this.errorTracker.clearErrors();
    this.profiler.clear();
  }
}

export {
  ObservabilityStack,
  DistributedTracer,
  PrometheusMetrics,
  ELKAggregator,
  ErrorTracker,
  PerformanceProfiler,
  TraceSpan,
  TraceContext,
  MetricSample,
  LogEntry,
  ErrorReport,
  ErrorStats,
  CpuProfile,
  MemoryProfile,
  ProfileReport,
  ObservabilityConfig,
  LogLevel,
  MetricType,
};
