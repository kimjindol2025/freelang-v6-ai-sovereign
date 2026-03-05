/**
 * Requirement Parser
 * 자연어 요구사항 → 구조화된 요구사항 객체
 *
 * 지원 요구사항 타입 (16가지):
 * - auth_type: JWT, OAuth2, SAML, 2FA, Session, Basic Auth
 * - database: PostgreSQL, MySQL, MongoDB, Redis, SQLite, Firebase
 * - cache: Redis, Memcached, Cache Strategy
 * - queue: RabbitMQ, Kafka, Bull Queue, SQS
 * - monitoring: Prometheus, ELK, Datadog, New Relic
 * - logging: Winston, Bunyan, ELK Stack
 * - api_version: API Versioning (v1, v2)
 * - payment: Stripe, PayPal, Square
 * - sso: SAML, OAuth2, OIDC
 * - two_fa: 2FA, MFA, TOTP
 * - realtime: WebSocket, WebRTC, SignalR
 * - audit: Audit Logging, Change History
 * - cron: Scheduled Jobs, Cron Tasks
 * - cdn: CloudFront, Cloudflare, CDN Strategy
 * - load_balancing: Load Balancer, Round-Robin, Health Checks
 * - versioning: API Versioning, Database Migrations
 */

import { EntityExtractor } from './entity-extractor';

export interface Requirement {
  type: string;
  enabled: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  details?: any;
}

export interface RequirementParserResult {
  auth_type?: Requirement;
  database?: Requirement;
  cache?: Requirement;
  queue?: Requirement;
  monitoring?: Requirement;
  logging?: Requirement;
  api_version?: Requirement;
  payment?: Requirement;
  sso?: Requirement;
  two_fa?: Requirement;
  realtime?: Requirement;
  audit?: Requirement;
  cron?: Requirement;
  cdn?: Requirement;
  load_balancing?: Requirement;
  versioning?: Requirement;
  confidence: number; // 0-1
  warnings?: string[];
}

/**
 * 요구사항 키워드 맵핑
 */
const REQUIREMENT_PATTERNS: {
  [key: string]: { keywords: string[]; priority: 'critical' | 'high' | 'medium' | 'low' }
} = {
  auth_type: {
    keywords: ['jwt', 'oauth', 'oauth2', 'saml', '2fa', 'mfa', 'basic auth', 'session', 'bearer', 'api key', 'apikey', 'ldap', 'kerberos', 'openid', '인증', '인증시스템'],
    priority: 'high'
  },
  database: {
    keywords: ['postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'firebase', 'dynamodb', 'elasticsearch', 'cassandra', 'mariadb', 'cockroach', 'couch', 'neo4j', '데이터베이스', 'db', '디비'],
    priority: 'critical'
  },
  cache: {
    keywords: ['캐싱', 'caching', 'cache', 'redis', 'memcached', 'memcache', '캐시'],
    priority: 'high'
  },
  queue: {
    keywords: ['queue', 'rabbitmq', 'kafka', 'bull', 'sqs', 'job queue', 'message queue', '큐', '메시지큐'],
    priority: 'high'
  },
  monitoring: {
    keywords: ['모니터링', 'monitoring', 'monitor', 'prometheus', 'grafana', 'datadog', 'new relic', 'elastic', 'elk', '감시', '메트릭'],
    priority: 'medium'
  },
  logging: {
    keywords: ['로깅', 'logging', 'log', 'winston', 'bunyan', 'pino', 'morgan', '로그'],
    priority: 'medium'
  },
  api_version: {
    keywords: ['api versioning', '버전관리', 'versioning', 'v1', 'v2', 'v3', '버전'],
    priority: 'medium'
  },
  payment: {
    keywords: ['결제', 'payment', 'stripe', 'paypal', 'square', '결제시스템', '결제처리'],
    priority: 'critical'
  },
  sso: {
    keywords: ['sso', 'single sign-on', 'saml', 'oauth2', 'openid', 'oidc', '싱글사인온'],
    priority: 'high'
  },
  two_fa: {
    keywords: ['2fa', 'mfa', 'two factor', '2단계인증', '멀티팩터', 'totp', 'authenticator'],
    priority: 'high'
  },
  realtime: {
    keywords: ['실시간', 'real-time', 'realtime', 'websocket', 'ws', 'webrtc', 'signalr', '라이브', '실시간업데이트'],
    priority: 'high'
  },
  audit: {
    keywords: ['audit', 'audit log', 'change history', '감사로그', '변경이력', '감사'],
    priority: 'medium'
  },
  cron: {
    keywords: ['cron', 'scheduled', 'schedule', 'job', '스케줄', '정기', '주기적'],
    priority: 'medium'
  },
  cdn: {
    keywords: ['cdn', 'cloudfront', 'cloudflare', 'static', '콘텐츠', '배포'],
    priority: 'medium'
  },
  load_balancing: {
    keywords: ['load balancing', 'load balancer', '로드밸런싱', 'round-robin', 'health check', '분산'],
    priority: 'medium'
  },
  versioning: {
    keywords: ['versioning', 'migration', '마이그레이션', 'schema evolution', '버전관리'],
    priority: 'medium'
  }
};

export class RequirementParser {
  private entityExtractor: EntityExtractor;

  constructor() {
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * 자연어 요구사항 파싱
   * @param text 자연어 텍스트
   * @param entities EntityExtractor 결과 (선택사항)
   * @returns 구조화된 요구사항
   */
  parse(text: string, entities?: any): RequirementParserResult {
    const lowerText = text.toLowerCase();
    const result: RequirementParserResult = {
      confidence: 0.7
    };

    // Entity Extractor 결과가 없으면 재추출
    if (!entities) {
      entities = this.entityExtractor.extract(text);
    }

    // 각 요구사항 타입 처리
    for (const [key, config] of Object.entries(REQUIREMENT_PATTERNS)) {
      const requirement = this.parseRequirementType(key, lowerText, config.keywords, config.priority);
      if (requirement.enabled) {
        result[key as keyof RequirementParserResult] = requirement as any;
      }
    }

    // Entity 기반 자동 추론
    this.inferFromEntities(result, entities);

    // 신뢰도 계산
    result.confidence = this.calculateConfidence(result, lowerText);

    // 경고 생성
    result.warnings = this.generateWarnings(result, lowerText);

    return result;
  }

  /**
   * 특정 요구사항 타입 파싱
   */
  private parseRequirementType(
    type: string,
    text: string,
    keywords: string[],
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): Requirement {
    // 키워드 매칭
    let matched = false;
    let matchedKeyword = '';

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matched = true;
        matchedKeyword = keyword;
        break;
      }
    }

    if (!matched) {
      return { type, enabled: false, priority: 'low' };
    }

    const requirement: Requirement = {
      type,
      enabled: true,
      priority
    };

    // 각 요구사항 타입별 상세 정보 추출
    if (type === 'auth_type') {
      requirement.details = this.parseAuthType(text, matchedKeyword);
    } else if (type === 'database') {
      requirement.details = this.parseDatabase(text, matchedKeyword);
    } else if (type === 'cache') {
      requirement.details = this.parseCache(text, matchedKeyword);
    } else if (type === 'queue') {
      requirement.details = this.parseQueue(text, matchedKeyword);
    } else if (type === 'monitoring') {
      requirement.details = this.parseMonitoring(text, matchedKeyword);
    } else if (type === 'payment') {
      requirement.details = this.parsePayment(text, matchedKeyword);
    } else if (type === 'realtime') {
      requirement.details = this.parseRealtime(text, matchedKeyword);
    } else if (type === 'two_fa') {
      requirement.details = this.parseTwoFA(text, matchedKeyword);
    }

    return requirement;
  }

  /**
   * 인증 타입 상세 분석
   */
  private parseAuthType(text: string, matched: string): any {
    const authTypes: { [key: string]: string } = {
      jwt: 'JWT',
      oauth: 'OAuth',
      oauth2: 'OAuth2',
      saml: 'SAML',
      '2fa': '2FA',
      mfa: 'MFA',
      'basic auth': 'Basic Auth',
      bearer: 'Bearer',
      'api key': 'API Key',
      apikey: 'API Key',
      session: 'Session',
      ldap: 'LDAP',
      kerberos: 'Kerberos',
      openid: 'OpenID'
    };

    return {
      type: authTypes[matched] || 'Custom Auth',
      requires_secret: true,
      token_based: !['session', 'basic auth'].includes(matched)
    };
  }

  /**
   * 데이터베이스 상세 분석
   */
  private parseDatabase(text: string, matched: string): any {
    const dbTypes: { [key: string]: string } = {
      postgresql: 'PostgreSQL',
      postgres: 'PostgreSQL',
      mysql: 'MySQL',
      mongodb: 'MongoDB',
      redis: 'Redis',
      sqlite: 'SQLite',
      firebase: 'Firebase',
      dynamodb: 'DynamoDB',
      elasticsearch: 'Elasticsearch',
      cassandra: 'Cassandra',
      mariadb: 'MariaDB',
      cockroach: 'CockroachDB',
      couch: 'CouchDB',
      neo4j: 'Neo4j'
    };

    const type = dbTypes[matched] || 'PostgreSQL';
    const isNoSQL = ['mongodb', 'firebase', 'dynamodb', 'cassandra', 'couchdb', 'neo4j'].includes(matched);

    return {
      type,
      is_nosql: isNoSQL,
      requires_schema: !isNoSQL,
      requires_migrations: !isNoSQL
    };
  }

  /**
   * 캐시 상세 분석
   */
  private parseCache(text: string, matched: string): any {
    return {
      type: matched.includes('redis') ? 'Redis' : 'Memcached',
      requires_config: true
    };
  }

  /**
   * 큐 상세 분석
   */
  private parseQueue(text: string, matched: string): any {
    const queueTypes: { [key: string]: string } = {
      rabbitmq: 'RabbitMQ',
      kafka: 'Kafka',
      bull: 'Bull',
      sqs: 'SQS'
    };

    return {
      type: queueTypes[matched] || 'Bull',
      persistence: matched !== 'bull'
    };
  }

  /**
   * 모니터링 상세 분석
   */
  private parseMonitoring(text: string, matched: string): any {
    const monitoringTypes: { [key: string]: string } = {
      prometheus: 'Prometheus',
      grafana: 'Grafana',
      datadog: 'Datadog',
      'new relic': 'New Relic',
      elastic: 'Elasticsearch',
      elk: 'ELK Stack'
    };

    return {
      type: monitoringTypes[matched] || 'Prometheus',
      requires_config: true
    };
  }

  /**
   * 결제 상세 분석
   */
  private parsePayment(text: string, matched: string): any {
    const paymentTypes: { [key: string]: string } = {
      stripe: 'Stripe',
      paypal: 'PayPal',
      square: 'Square'
    };

    return {
      type: paymentTypes[matched] || 'Stripe',
      requires_api_key: true,
      requires_webhook: true
    };
  }

  /**
   * 실시간 상세 분석
   */
  private parseRealtime(text: string, matched: string): any {
    return {
      type: matched.includes('websocket') || matched.includes('ws') ? 'WebSocket' : 'WebRTC',
      requires_infrastructure: true
    };
  }

  /**
   * 2FA 상세 분석
   */
  private parseTwoFA(text: string, matched: string): any {
    return {
      type: 'TOTP',
      supported_methods: ['TOTP', 'SMS', 'Email']
    };
  }

  /**
   * Entity 기반 자동 추론
   */
  private inferFromEntities(result: RequirementParserResult, entities: any): void {
    // 데이터베이스가 요구사항에 명시되지 않았지만 extract에서 발견된 경우
    if (!result.database && entities.databases && entities.databases.length > 0) {
      const dbName = entities.databases[0].toLowerCase();
      result.database = {
        type: 'database',
        enabled: true,
        priority: 'critical',
        details: {
          type: entities.databases[0],
          inferred: true
        }
      };
    }

    // 인증이 요구사항에 명시되지 않았지만 extract에서 발견된 경우
    if (!result.auth_type && entities.auth_types && entities.auth_types.length > 0) {
      result.auth_type = {
        type: 'auth_type',
        enabled: true,
        priority: 'high',
        details: {
          type: entities.auth_types[0],
          inferred: true
        }
      };
    }

    // 기능에서 자동 추론
    if (entities.features && entities.features.length > 0) {
      // 사용자 관리가 있으면 권한 관리 필요
      if (entities.features.some((f: string) => f.includes('User') || f.includes('사용자'))) {
        if (!result.two_fa) {
          result.two_fa = {
            type: 'two_fa',
            enabled: false,
            priority: 'medium'
          };
        }
      }

      // 결제가 있으면 보안 필요
      if (entities.features.some((f: string) => f.includes('Payment') || f.includes('결제'))) {
        if (!result.payment) {
          result.payment = {
            type: 'payment',
            enabled: true,
            priority: 'critical',
            details: {
              inferred: true
            }
          };
        }
      }

      // 실시간 알림이 있으면 WebSocket 필요
      if (entities.features.some((f: string) => f.includes('Messaging') || f.includes('Notifications'))) {
        if (!result.realtime) {
          result.realtime = {
            type: 'realtime',
            enabled: true,
            priority: 'high',
            details: {
              type: 'WebSocket',
              inferred: true
            }
          };
        }
      }
    }
  }

  /**
   * 신뢰도 점수 계산
   */
  private calculateConfidence(result: RequirementParserResult, text: string): number {
    let score = 0.5;

    // 활성화된 요구사항 수에 따른 가산
    const enabledCount = Object.values(result)
      .filter(v => typeof v === 'object' && v !== null && (v as Requirement).enabled)
      .length;

    score += Math.min(0.3, enabledCount * 0.05);

    // 텍스트 길이에 따른 가산 (더 상세한 요구사항)
    if (text.length > 100) score += 0.1;
    if (text.length > 200) score += 0.05;

    // 우선순위 높은 요구사항 있는 경우
    const hasCritical = Object.values(result)
      .some(v => typeof v === 'object' && v !== null && (v as Requirement).priority === 'critical');
    if (hasCritical) score += 0.05;

    return Math.min(1, score);
  }

  /**
   * 경고 메시지 생성
   */
  private generateWarnings(result: RequirementParserResult, text: string): string[] | undefined {
    const warnings: string[] = [];

    // 데이터베이스 없이 인증 있는 경우
    if (result.auth_type?.enabled && !result.database?.enabled) {
      warnings.push('인증 시스템을 위해 데이터베이스가 필요합니다');
    }

    // 결제 없이 주문이 있는 경우
    if (!result.payment?.enabled && text.includes('주문')) {
      warnings.push('주문 시스템은 결제 기능이 필요합니다');
    }

    // 실시간이 있지만 캐시가 없는 경우
    if (result.realtime?.enabled && !result.cache?.enabled) {
      warnings.push('실시간 기능의 성능을 위해 캐시가 권장됩니다');
    }

    // 모니터링 없는 경우 (권장)
    const enabledRequirements = Object.values(result)
      .filter(v => typeof v === 'object' && v !== null && (v as Requirement).enabled)
      .length;
    if (enabledRequirements > 3 && !result.monitoring?.enabled) {
      warnings.push('복잡한 시스템은 모니터링 기능이 권장됩니다');
    }

    return warnings.length > 0 ? warnings : undefined;
  }

  /**
   * 요구사항 우선순위 점수 계산 (낮을수록 높은 우선순위)
   */
  calculatePriority(result: RequirementParserResult): { [key: string]: number } {
    const priorities: { [key: string]: number } = {};
    const priorityScore = { critical: 0, high: 1, medium: 2, low: 3 };

    for (const [key, req] of Object.entries(result)) {
      if (key !== 'confidence' && key !== 'warnings' && typeof req === 'object' && req !== null) {
        const requirement = req as Requirement;
        if (requirement.enabled) {
          priorities[requirement.type] = priorityScore[requirement.priority];
        }
      }
    }

    return priorities;
  }
}
