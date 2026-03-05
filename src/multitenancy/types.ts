/**
 * Multi-Tenancy Type Definitions
 *
 * 멀티테넌트 시스템의 핵심 타입 정의:
 * - 테넌트 격리, 리소스 공유, 청구, 커스터마이제이션, SLA
 */

/**
 * 테넌트 기본 정보
 */
export interface Tenant {
  id: string;                     // 고유 테넌트 ID
  name: string;                   // 테넌트 이름
  tier: 'free' | 'pro' | 'enterprise';  // 서비스 티어
  createdAt: Date;
  metadata: Record<string, any>;
  status: 'active' | 'suspended' | 'deleted';
  customDomain?: string;          // 커스텀 도메인
  branding?: TenantBranding;      // 브랜딩 정보
}

/**
 * 테넌트 브랜딩 설정
 */
export interface TenantBranding {
  logo?: string;                  // 로고 URL
  primaryColor?: string;          // 주색상
  secondaryColor?: string;        // 보조색상
  favicon?: string;               // 파비콘
  customCss?: string;             // 커스텀 CSS
  footerText?: string;            // 푸터 텍스트
}

/**
 * 테넌트 리소스 정보
 */
export interface TenantResources {
  tenantId: string;
  database: {
    name: string;                 // 데이터베이스 이름
    schema?: string;              // 스키마 이름 (선택)
    maxConnections: number;       // 최대 연결 수
    storage: number;              // 저장소 크기 (MB)
  };
  compute: {
    maxInstances: number;         // 최대 인스턴스 수
    maxCpuCores: number;          // 최대 CPU 코어
    maxMemoryMB: number;          // 최대 메모리 (MB)
    maxExecutionTime: number;     // 최대 실행 시간 (초)
  };
  storage: {
    maxBuckets: number;           // 최대 버킷 수
    maxSizeGB: number;            // 최대 용량 (GB)
    publicAccess: boolean;        // 공개 접근 허용
  };
}

/**
 * 테넌트 격리 정책
 */
export interface IsolationPolicy {
  tenantId: string;
  dataIsolation: {
    rowLevel?: boolean;           // Row-Level Security
    columnLevel?: boolean;        // Column-Level Security
    encryptionAtRest?: boolean;   // 저장소 암호화
    encryptionInTransit?: boolean; // 전송 중 암호화
  };
  networkIsolation: {
    vpnRequired?: boolean;        // VPN 필수
    ipWhitelist?: string[];       // IP 화이트리스트
    allowedRegions?: string[];    // 허용 지역
  };
  computeIsolation: {
    containerLevel: boolean;      // 컨테이너 격리
    dedicatedResources?: boolean; // 전용 리소스
  };
}

/**
 * 청구 정보
 */
export interface BillingInfo {
  tenantId: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  invoices: Invoice[];
  usage: UsageMetrics;
}

/**
 * 결제 수단
 */
export interface PaymentMethod {
  type: 'credit_card' | 'bank_transfer' | 'invoice';
  id: string;
  lastFour?: string;             // 카드 마지막 4자리
  expiryDate?: string;           // 만료 날짜
  isDefault: boolean;
}

/**
 * 청구서
 */
export interface Invoice {
  id: string;
  tenantId: string;
  date: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdfUrl?: string;
}

/**
 * 청구서 항목
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * 사용량 메트릭
 */
export interface UsageMetrics {
  tenantId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  compute: {
    cpuHours: number;
    memoryGBHours: number;
    executionCount: number;
  };
  storage: {
    dataGB: number;
    backupGB: number;
    transferGB: number;
  };
  api: {
    requestCount: number;
    errorCount: number;
  };
  cost: number;                   // 예상 비용
}

/**
 * SLA 정의
 */
export interface SLA {
  tenantId: string;
  uptime: {
    target: number;               // 목표 가동률 (%)
    current: number;              // 현재 가동률
    penaltyPercentage: number;    // 미달 시 할인율 (%)
  };
  performance: {
    apiLatencyTarget: number;     // API 응답 시간 (ms)
    dbQueryLatencyTarget: number; // DB 쿼리 시간 (ms)
  };
  support: {
    responseTimeTarget: number;   // 지원 응답 시간 (시간)
    ticketPriority: 'low' | 'medium' | 'high' | 'critical';
  };
  incident: {
    maxDowntimePerMonth: number;  // 월 최대 다운타임 (시간)
    RTO: number;                  // Recovery Time Objective (분)
    RPO: number;                  // Recovery Point Objective (분)
  };
}

/**
 * 모니터링 메트릭
 */
export interface MonitoringMetrics {
  tenantId: string;
  timestamp: Date;
  uptime: number;                 // 가동률 (%)
  apiLatency: number;             // API 응답 시간 (ms)
  errorRate: number;              // 에러율 (%)
  activeConnections: number;      // 활성 연결 수
  cpuUsage: number;               // CPU 사용률 (%)
  memoryUsage: number;            // 메모리 사용률 (%)
  diskUsage: number;              // 디스크 사용률 (%)
  networkBandwidth: {
    inbound: number;              // 인바운드 (Mbps)
    outbound: number;             // 아웃바운드 (Mbps)
  };
}

/**
 * 자동 스케일링 정책
 */
export interface AutoScalingPolicy {
  tenantId: string;
  enabled: boolean;
  scaleUp: {
    cpuThreshold: number;         // CPU 임계값 (%)
    memoryThreshold: number;      // 메모리 임계값 (%)
    scalingFactor: number;        // 스케일링 배수
    cooldownPeriod: number;       // 쿨다운 (초)
  };
  scaleDown: {
    cpuThreshold: number;         // CPU 임계값 (%)
    memoryThreshold: number;      // 메모리 임계값 (%)
    scalingFactor: number;        // 스케일링 배수
    cooldownPeriod: number;       // 쿨다운 (초)
  };
  minInstances: number;
  maxInstances: number;
}

/**
 * 워크플로우 커스터마이제이션
 */
export interface WorkflowCustomization {
  tenantId: string;
  id: string;
  name: string;
  description?: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 워크플로우 트리거
 */
export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'webhook';
  eventType?: string;
  schedule?: string;              // Cron 표현식
  webhookUrl?: string;
}

/**
 * 워크플로우 액션
 */
export interface WorkflowAction {
  type: 'notification' | 'http' | 'database' | 'computation';
  target: string;
  payload?: Record<string, any>;
}

/**
 * 워크플로우 조건
 */
export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

/**
 * API 커스터마이제이션
 */
export interface APICustomization {
  tenantId: string;
  id: string;
  name: string;
  endpoints: CustomAPIEndpoint[];
  rateLimit?: RateLimit;
  authentication?: AuthenticationConfig;
  enabled: boolean;
}

/**
 * 커스텀 API 엔드포인트
 */
export interface CustomAPIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;              // 핸들러 코드 또는 참조
  responseFormat: 'json' | 'xml' | 'csv';
  caching?: CacheConfig;
}

/**
 * 캐시 설정
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;                   // TTL (초)
  strategy: 'lru' | 'lfu' | 'ttl';
}

/**
 * 비율 제한
 */
export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstSize: number;             // 버스트 크기
}

/**
 * 인증 설정
 */
export interface AuthenticationConfig {
  type: 'api_key' | 'oauth2' | 'jwt' | 'mTLS';
  provider?: string;             // OAuth2 프로바이더
  jwtSecret?: string;
  mTLSCertPath?: string;
}

/**
 * 테넌트 컨텍스트
 */
export interface TenantContext {
  tenantId: string;
  userId?: string;
  sessionId?: string;
  permissions: string[];
  metadata?: Record<string, any>;
}
