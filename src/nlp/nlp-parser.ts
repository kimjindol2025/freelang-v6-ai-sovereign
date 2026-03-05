/**
 * NLP Parser - 통합 자연어 처리 엔진
 * 자연어 → 구조화된 코드 생성 요청
 *
 * 역할:
 * 1. 고급 NLP 분석 (Claude API 활용)
 * 2. 다국어 지원 (한글/영문 동시 처리)
 * 3. 컨텍스트 학습 (이전 요청 기억)
 * 4. 결과 정규화 (일관된 출력 형식)
 *
 * Example:
 * Input: "사용자 관리 REST API 만들어 (JWT 인증, PostgreSQL, 관리자 권한)"
 * Output: {
 *   intent: "create_api",
 *   project_type: "api",
 *   features: [{name: "user_management", type: "core", operations: ["create", "read", "update", "delete"]}],
 *   tech_stack: {backend: "express", database: "postgresql", auth: "jwt", admin_required: true},
 *   requirements: {auth_type: "jwt", role_based_access: true, database_required: true},
 *   confidence: 0.95,
 *   warnings: []
 * }
 */

const Anthropic = require("@anthropic-ai/sdk").default;
import { IntentClassifier, IntentResult } from './intent-classifier';
import { EntityExtractor, ExtractedEntity } from './entity-extractor';
import { RequirementParserResult } from './requirement-parser';

// ============================================================================
// 타입 정의
// ============================================================================

export interface Feature {
  name: string;
  type: 'core' | 'secondary' | 'optional';
  operations?: string[];
  description?: string;
}

export interface TechStack {
  backend?: string;
  frontend?: string;
  database?: string;
  cache?: string;
  queue?: string;
  auth?: string;
  monitoring?: string;
  logging?: string;
  payment?: string;
  api_version?: string;
  [key: string]: any;
}

export interface Requirements {
  auth_type?: string;
  role_based_access?: boolean;
  database_required?: boolean;
  cache_required?: boolean;
  realtime?: boolean;
  monitoring?: boolean;
  logging?: boolean;
  audit?: boolean;
  cron?: boolean;
  load_balancing?: boolean;
  i18n?: boolean;
  [key: string]: any;
}

export interface CodeGenRequest {
  intent: string;
  project_type: 'api' | 'web' | 'cli' | 'service';
  features: Feature[];
  tech_stack: TechStack;
  requirements: Requirements;
  confidence: number;
  warnings?: string[];
  language_detected?: 'ko' | 'en' | 'mixed';
  ambiguities?: AmbiguityInfo[];
  implicit_requirements?: string[];
  raw_entities?: ExtractedEntity;
  normalized_output?: NormalizedOutput;
}

export interface AmbiguityInfo {
  type: string;
  description: string;
  suggestions: string[];
}

export interface NormalizedOutput {
  original_intent: string;
  corrected_intent: string;
  auto_corrections: string[];
  feature_aliases: { [key: string]: string };
  tech_stack_normalization: { [key: string]: string };
}

export interface ParsingContext {
  previous_requests?: CodeGenRequest[];
  project_history?: string[];
  user_preferences?: { [key: string]: any };
  domain?: string;
}

// ============================================================================
// NLP Parser 메인 클래스
// ============================================================================

export class NLPParser {
  private client: any;
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;
  private context: ParsingContext;

  // 특징명 정규화 맵
  private featureAliasMap: { [key: string]: string } = {
    'user': 'user_management',
    'users': 'user_management',
    '사용자': 'user_management',
    '유저': 'user_management',
    'product': 'product_management',
    'products': 'product_management',
    '상품': 'product_management',
    'order': 'order_management',
    'orders': 'order_management',
    '주문': 'order_management',
    'payment': 'payment_system',
    'payments': 'payment_system',
    '결제': 'payment_system',
    'report': 'reporting',
    'reports': 'reporting',
    '보고서': 'reporting',
    'chat': 'chat_system',
    'messaging': 'chat_system',
    '채팅': 'chat_system',
    'notification': 'notification_system',
    'notifications': 'notification_system',
    '알림': 'notification_system',
    'search': 'search_system',
    '검색': 'search_system',
    'dashboard': 'dashboard',
    '대시보드': 'dashboard',
    'analytics': 'analytics',
    '분석': 'analytics',
    'review': 'review_system',
    'reviews': 'review_system',
    '리뷰': 'review_system',
  };

  // 기술 스택 정규화 맵
  private techStackNormalizationMap: { [key: string]: string } = {
    'express': 'express',
    'expressjs': 'express',
    'express.js': 'express',
    'fastapi': 'fastapi',
    'django': 'django',
    'go': 'go',
    'golang': 'go',
    'rust': 'rust',
    'react': 'react',
    'reactjs': 'react',
    'react.js': 'react',
    'vue': 'vue',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'nextjs': 'nextjs',
    'next.js': 'nextjs',
    'next': 'nextjs',
    'angular': 'angular',
    'angularjs': 'angular',
    'postgresql': 'postgresql',
    'postgres': 'postgresql',
    'mysql': 'mysql',
    'mongodb': 'mongodb',
    'mongo': 'mongodb',
    'redis': 'redis',
    'sqlite': 'sqlite',
    'firebase': 'firebase',
    'dynamodb': 'dynamodb',
    'jwt': 'jwt',
    'oauth': 'oauth2',
    'oauth2': 'oauth2',
    'saml': 'saml',
    'basic': 'basic_auth',
    '기본': 'basic_auth',
  };

  constructor(context?: ParsingContext) {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.context = context || {
      previous_requests: [],
      project_history: [],
      user_preferences: {},
    };
  }

  /**
   * 메인 파싱 메서드
   * 자연어 → 구조화된 요청
   */
  async parse(prompt: string, customContext?: ParsingContext): Promise<CodeGenRequest> {
    try {
      // 0. 언어 감지
      const language = this.detectLanguage(prompt);

      // 1. 기본 NLP 분석 (병렬 실행)
      const [intentResult, entities] = await Promise.all([
        this.intentClassifier.classify(prompt),
        Promise.resolve(this.entityExtractor.extract(prompt)),
      ]);

      // 2. 모호성 감지
      const ambiguities = await this.detectAmbiguity(prompt, intentResult, entities);

      // 3. 암시된 요구사항 추론
      const implicitRequirements = this.inferImplicitRequirements(prompt, intentResult, entities);

      // 4. 특징 추출
      const features = this.extractFeatures(prompt, entities, intentResult);

      // 5. 기술 스택 구성
      const techStack = this.buildTechStack(entities, intentResult, features);

      // 6. 요구사항 생성
      const requirements = this.extractRequirements(entities, implicitRequirements);

      // 7. 결과 정규화
      const normalized = this.normalizeOutput({
        intent: intentResult.intent,
        features,
        tech_stack: techStack,
        requirements,
      });

      // 최종 요청 객체 구성
      const request: CodeGenRequest = {
        intent: intentResult.intent,
        project_type: (intentResult.project_type as any) || 'api',
        features: normalized.features || features,
        tech_stack: normalized.tech_stack || techStack,
        requirements: normalized.requirements || requirements,
        confidence: intentResult.confidence,
        warnings: this.generateWarnings(ambiguities, implicitRequirements),
        language_detected: language,
        ambiguities,
        implicit_requirements: implicitRequirements,
        raw_entities: entities,
        normalized_output: {
          original_intent: intentResult.intent,
          corrected_intent: normalized.intent || intentResult.intent,
          auto_corrections: normalized.corrections || [],
          feature_aliases: this.featureAliasMap,
          tech_stack_normalization: this.techStackNormalizationMap,
        },
      };

      // 컨텍스트에 저장
      if (!this.context.previous_requests) {
        this.context.previous_requests = [];
      }
      this.context.previous_requests.push(request);

      return request;
    } catch (error) {
      console.error('NLP parsing error:', error);
      // 기본값 반환
      return this.getDefaultRequest(prompt);
    }
  }

  /**
   * 언어 감지
   */
  private detectLanguage(text: string): 'ko' | 'en' | 'mixed' {
    const koreanRegex = /[\uAC00-\uD7AF]/g;
    const englishRegex = /[a-zA-Z]/g;

    const koreanCount = (text.match(koreanRegex) || []).length;
    const englishCount = (text.match(englishRegex) || []).length;

    if (koreanCount === 0) return 'en';
    if (englishCount === 0) return 'ko';
    return 'mixed';
  }

  /**
   * 모호성 감지
   */
  private async detectAmbiguity(
    prompt: string,
    intentResult: IntentResult,
    entities: ExtractedEntity
  ): Promise<AmbiguityInfo[]> {
    const ambiguities: AmbiguityInfo[] = [];

    // 1. 명확하지 않은 프로젝트 타입
    if (intentResult.confidence < 0.7) {
      ambiguities.push({
        type: 'low_confidence_intent',
        description: `의도 분류 신뢰도가 낮음 (${(intentResult.confidence * 100).toFixed(1)}%)`,
        suggestions: ['요청을 더 명확하게 하세요', '예: "REST API 서버 만들어"'],
      });
    }

    // 2. 기술 스택 중복/충돌
    if (entities.frameworks.length > 3) {
      ambiguities.push({
        type: 'too_many_frameworks',
        description: `너무 많은 프레임워크가 지정됨 (${entities.frameworks.join(', ')})`,
        suggestions: ['메인 프레임워크만 선택하세요', `예: "${entities.frameworks[0]}"만 사용`],
      });
    }

    // 3. 데이터베이스 중복
    if (entities.databases.length > 2) {
      ambiguities.push({
        type: 'multiple_databases',
        description: `여러 데이터베이스가 지정됨 (${entities.databases.join(', ')})`,
        suggestions: ['주요 데이터베이스만 선택하세요', '다른 것은 캐시/큐로 사용'],
      });
    }

    // 4. 특징 이름 해석 불명확
    if (!this.isFeatureNameClear(prompt)) {
      ambiguities.push({
        type: 'unclear_feature_names',
        description: '특징명이 모호합니다',
        suggestions: [
          '표준 특징명을 사용하세요',
          '예: user_management, product_management, payment_system',
        ],
      });
    }

    return ambiguities;
  }

  /**
   * 특징명이 명확한지 확인
   */
  private isFeatureNameClear(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    // 중복되는 단어나 "뭔가"같은 모호한 표현 확인
    const ambiguousKeywords = [
      '뭔가',
      '어떤',
      '특정',
      'some',
      'something',
      'various',
      'different',
    ];
    return !ambiguousKeywords.some((keyword) => lowerPrompt.includes(keyword));
  }

  /**
   * 암시된 요구사항 추론
   */
  private inferImplicitRequirements(
    prompt: string,
    intentResult: IntentResult,
    entities: ExtractedEntity
  ): string[] {
    const implicit: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // 1. API 요청 시 버전 관리 자동 추론
    if (intentResult.intent === 'create_api' && !lowerPrompt.includes('version')) {
      implicit.push('api_versioning');
    }

    // 2. 결제 관련 요청 시 보안 추론
    if (
      lowerPrompt.includes('payment') ||
      lowerPrompt.includes('결제') ||
      entities.requirements.includes('payment')
    ) {
      implicit.push('security_encryption');
      implicit.push('pci_compliance');
    }

    // 3. 실시간 채팅/알림 시 WebSocket 추론
    if (
      lowerPrompt.includes('chat') ||
      lowerPrompt.includes('채팅') ||
      lowerPrompt.includes('real-time') ||
      lowerPrompt.includes('실시간') ||
      entities.requirements.includes('realtime')
    ) {
      implicit.push('websocket');
      implicit.push('connection_pooling');
    }

    // 4. 데이터베이스 있으면 마이그레이션 자동 추론
    if (entities.databases.length > 0) {
      implicit.push('database_migrations');
    }

    // 5. 다국어 요청 시 i18n 자동 추론
    if (
      lowerPrompt.includes('multilingual') ||
      lowerPrompt.includes('다국어') ||
      entities.requirements.includes('다국어')
    ) {
      implicit.push('i18n_support');
    }

    // 6. 관리자 역할 시 감사 로깅 추론
    if (
      lowerPrompt.includes('admin') ||
      lowerPrompt.includes('관리자') ||
      entities.requirements.includes('관리자')
    ) {
      implicit.push('audit_logging');
    }

    // 7. 성능 최적화 요청 시
    if (lowerPrompt.includes('performance') || lowerPrompt.includes('최적화')) {
      implicit.push('caching');
      implicit.push('load_balancing');
    }

    return implicit;
  }

  /**
   * 특징 추출
   */
  private extractFeatures(
    prompt: string,
    entities: ExtractedEntity,
    intentResult: IntentResult
  ): Feature[] {
    const features: Feature[] = [];

    // entities.features에서 특징명 추출
    entities.features.forEach((featureName) => {
      const normalized = this.normalizeFeatureName(featureName);

      // 핵심 특징 판단
      const isCoreFeature = this.isCoreFeature(prompt, featureName);
      const type = isCoreFeature ? 'core' : 'secondary';

      // 작업 추론
      const operations = this.inferOperations(featureName, prompt);

      features.push({
        name: normalized,
        type,
        operations,
        description: this.generateFeatureDescription(normalized),
      });
    });

    // 특징이 없으면 기본값
    if (features.length === 0) {
      features.push({
        name: 'basic_api',
        type: 'core',
        operations: ['create', 'read'],
      });
    }

    return features;
  }

  /**
   * 특징명 정규화
   */
  private normalizeFeatureName(name: string): string {
    const lowerName = name.toLowerCase();
    return this.featureAliasMap[lowerName] || name.replace(/\s+/g, '_').toLowerCase();
  }

  /**
   * 핵심 특징인지 판단
   */
  private isCoreFeature(prompt: string, featureName: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    const lowerFeature = featureName.toLowerCase();

    // 반복 언급 = 핵심
    const mentionCount = (lowerPrompt.match(new RegExp(lowerFeature, 'g')) || []).length;
    if (mentionCount >= 2) return true;

    // "주요", "핵심", "main" 같은 키워드 = 핵심
    const coreKeywords = ['주요', 'main', 'primary', '핵심', 'core', '필수'];
    const hasCoreKeyword = coreKeywords.some((kw) => {
      const pattern = new RegExp(`${kw}.*${lowerFeature}|${lowerFeature}.*${kw}`, 'i');
      return pattern.test(prompt);
    });

    return hasCoreKeyword;
  }

  /**
   * 작업 추론
   */
  private inferOperations(featureName: string, prompt: string): string[] {
    const operations = new Set<string>();
    const lowerPrompt = prompt.toLowerCase();
    const lowerFeature = featureName.toLowerCase();

    // 기본값: CRUD
    operations.add('create');
    operations.add('read');

    // 명시적 키워드 확인
    if (
      lowerPrompt.includes('edit') ||
      lowerPrompt.includes('update') ||
      lowerPrompt.includes('수정') ||
      lowerPrompt.includes('변경')
    ) {
      operations.add('update');
    }

    if (
      lowerPrompt.includes('delete') ||
      lowerPrompt.includes('remove') ||
      lowerPrompt.includes('삭제')
    ) {
      operations.add('delete');
    }

    if (
      lowerPrompt.includes('search') ||
      lowerPrompt.includes('검색') ||
      lowerPrompt.includes('filter') ||
      lowerPrompt.includes('필터')
    ) {
      operations.add('search');
    }

    if (lowerPrompt.includes('export') || lowerPrompt.includes('내보내기')) {
      operations.add('export');
    }

    return Array.from(operations);
  }

  /**
   * 특징 설명 생성
   */
  private generateFeatureDescription(featureName: string): string {
    const descriptions: { [key: string]: string } = {
      user_management: 'Create, read, update, delete user accounts',
      product_management: 'Manage product catalog with CRUD operations',
      order_management: 'Track and manage customer orders',
      payment_system: 'Process payments and manage transactions',
      reporting: 'Generate and export reports',
      chat_system: 'Real-time messaging between users',
      notification_system: 'Send notifications to users',
      search_system: 'Full-text search functionality',
      dashboard: 'Analytics and monitoring dashboard',
      analytics: 'Data analysis and visualization',
      review_system: 'User reviews and ratings',
    };

    return descriptions[featureName] || `${featureName} functionality`;
  }

  /**
   * 기술 스택 구성
   */
  private buildTechStack(
    entities: ExtractedEntity,
    intentResult: IntentResult,
    features: Feature[]
  ): TechStack {
    const stack: TechStack = {};

    // 백엔드
    if (intentResult.project_type === 'api' || intentResult.project_type === 'service') {
      stack.backend = entities.frameworks[0] || 'express';
    }

    // 프론트엔드
    if (intentResult.project_type === 'web') {
      stack.frontend = entities.frameworks[0] || 'react';
    }

    // 데이터베이스
    if (entities.databases.length > 0) {
      stack.database = entities.databases[0];
    } else if (intentResult.project_type === 'api' || intentResult.project_type === 'service') {
      stack.database = 'postgresql'; // 기본값
    }

    // 캐시 (결제/검색/실시간 기능이면 Redis)
    const hasExpensiveOperations = features.some((f) =>
      ['payment_system', 'search_system', 'chat_system'].includes(f.name)
    );
    if (hasExpensiveOperations || entities.requirements.includes('caching')) {
      stack.cache = 'redis';
    }

    // 인증
    if (entities.auth_types.length > 0) {
      stack.auth = entities.auth_types[0];
    }

    return stack;
  }

  /**
   * 요구사항 추출
   */
  private extractRequirements(
    entities: ExtractedEntity,
    implicit: string[]
  ): Requirements {
    const requirements: Requirements = {};

    // 명시적 요구사항
    if (entities.auth_types.length > 0) {
      requirements.auth_type = entities.auth_types[0];
      requirements.role_based_access = entities.requirements.includes('관리자');
    }

    if (entities.databases.length > 0) {
      requirements.database_required = true;
    }

    if (entities.requirements.includes('caching')) {
      requirements.cache_required = true;
    }

    if (
      entities.requirements.includes('realtime') ||
      entities.requirements.includes('websocket') ||
      entities.requirements.includes('실시간')
    ) {
      requirements.realtime = true;
    }

    // 암시적 요구사항
    implicit.forEach((req) => {
      if (req === 'audit_logging') requirements.audit = true;
      if (req === 'websocket') requirements.realtime = true;
      if (req === 'caching') requirements.cache_required = true;
      if (req === 'load_balancing') requirements.load_balancing = true;
      if (req === 'i18n_support') requirements.i18n = true;
    });

    return requirements;
  }

  /**
   * 결과 정규화
   */
  private normalizeOutput(data: {
    intent: string;
    features: Feature[];
    tech_stack: TechStack;
    requirements: Requirements;
  }): {
    intent?: string;
    features?: Feature[];
    tech_stack?: TechStack;
    requirements?: Requirements;
    corrections?: string[];
  } {
    const corrections: string[] = [];

    // 1. 의도 정규화
    let intent = data.intent;
    if (intent.includes('create') && !intent.startsWith('create_')) {
      intent = 'create_api';
      corrections.push('Intent normalized to create_api');
    }

    // 2. 기술 스택 정규화
    const normalized_tech_stack: TechStack = {};
    Object.entries(data.tech_stack).forEach(([key, value]) => {
      const normalized =
        this.techStackNormalizationMap[(value as string)?.toLowerCase()] || value;
      normalized_tech_stack[key] = normalized;
    });

    // 3. 특징명 정규화
    const normalized_features = data.features.map((f) => ({
      ...f,
      name: this.normalizeFeatureName(f.name),
    }));

    // 4. 중복 제거
    const uniqueFeatures = Array.from(
      new Map(normalized_features.map((f) => [f.name, f])).values()
    );

    return {
      intent,
      features: uniqueFeatures,
      tech_stack: normalized_tech_stack,
      requirements: data.requirements,
      corrections,
    };
  }

  /**
   * 경고 생성
   */
  private generateWarnings(
    ambiguities: AmbiguityInfo[],
    implicit: string[]
  ): string[] {
    const warnings: string[] = [];

    if (ambiguities.length > 0) {
      warnings.push(`${ambiguities.length}개의 모호성 감지됨`);
    }

    if (implicit.length > 3) {
      warnings.push(`${implicit.length}개의 암시적 요구사항 추가됨`);
    }

    return warnings;
  }

  /**
   * 기본 요청 반환
   */
  private getDefaultRequest(prompt: string): CodeGenRequest {
    return {
      intent: 'create_api',
      project_type: 'api',
      features: [{ name: 'basic_api', type: 'core', operations: ['create', 'read'] }],
      tech_stack: { backend: 'express', database: 'postgresql', auth: 'jwt' },
      requirements: { database_required: true },
      confidence: 0.3,
      warnings: ['파싱 실패 - 기본값 사용'],
    };
  }

  /**
   * 컨텍스트 업데이트
   */
  setContext(context: ParsingContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 컨텍스트 조회
   */
  getContext(): ParsingContext {
    return this.context;
  }

  /**
   * 이전 요청 조회
   */
  getPreviousRequests(limit: number = 5): CodeGenRequest[] {
    if (!this.context.previous_requests) {
      return [];
    }
    return this.context.previous_requests.slice(-limit);
  }
}

// ============================================================================
// 테스트 코드
// ============================================================================

if (require.main === module) {
  (async () => {
    const parser = new NLPParser();

    // 테스트 케이스
    const testPrompts = [
      '사용자 관리 REST API 만들어 (JWT 인증, PostgreSQL, 관리자 권한)',
      'React 대시보드 (실시간 채트, 다크모드)',
      'Express + MongoDB 채팅 앱',
    ];

    for (const prompt of testPrompts) {
      console.log(`\n📝 Input: ${prompt}`);
      const result = await parser.parse(prompt);
      console.log('✅ Result:', JSON.stringify(result, null, 2));
    }
  })();
}
