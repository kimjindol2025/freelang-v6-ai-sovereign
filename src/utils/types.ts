/**
 * Type Definitions
 * 전체 시스템에서 사용되는 타입 정의
 *
 * 목표: any 타입 제거 및 타입 안전성 강화
 */

// ============== HTTP 응답 타입 ==============

/**
 * HTTP 응답 객체
 */
export interface HttpResponse {
  statusCode: number;
  data: Buffer | string;
  headers: Record<string, string | string[]>;
}

/**
 * JSON HTTP 응답
 */
export interface JsonResponse<T = any> {
  statusCode: number;
  body: T;
  headers: Record<string, string>;
}

// ============== 헬스 체크 타입 ==============

/**
 * 헬스 체크 결과
 */
export interface HealthCheckResult {
  timestamp: number;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

/**
 * 헬스 체크 설정
 */
export interface HealthCheckConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  maxRetries: number;
  endpoint: string;
}

// ============== NLP 타입 ==============

/**
 * Intent 분류 결과
 */
export interface IntentResult {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

/**
 * NLP 분석 결과
 */
export interface NLPResult {
  intent: IntentResult;
  entities: ExtractedEntities;
}

/**
 * 추출된 엔티티
 */
export interface ExtractedEntities {
  technology: string[];
  features: Array<{
    name: string;
    operations: string[];
  }>;
  requirements: Record<string, boolean>;
  [key: string]: any;
}

// ============== 배포 타입 ==============

/**
 * 배포 설정
 */
export interface DeployConfig {
  target: 'vercel' | 'aws-ec2' | 'docker' | 'local';
  projectRoot: string;
  projectName: string;
  version: string;
  port: number;
  environment?: Record<string, string>;
  healthCheckConfig?: HealthCheckConfig;
}

/**
 * 클라우드 배포 설정
 */
export interface CloudDeployConfig {
  provider: 'vercel' | 'aws' | 'gcp';
  environment: 'development' | 'staging' | 'production';
  projectRoot: string;
  projectName: string;
  version: string;
  minInstances?: number;
  maxInstances?: number;
  cpuLimit?: string; // e.g., "1000m"
  memoryLimit?: string; // e.g., "512Mi"
  enableCDN?: boolean;
  databaseConfig?: DatabaseConfig;
  customDomain?: string;
}

/**
 * 데이터베이스 설정
 */
export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  name: string;
  username: string;
  // password should be loaded from secrets management
}

/**
 * 빌드 결과
 */
export interface BuildResult {
  success: boolean;
  duration: number;
  artifacts: string[];
  errors?: string[];
}

/**
 * 프로젝트 구조
 */
export interface ProjectStructure {
  name: string;
  type: 'api' | 'web' | 'fullstack';
  hasDatabase: boolean;
  frameworks: string[];
}

/**
 * 배포 결과
 */
export interface DeploymentResult {
  id: string;
  status: 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'rolled_back';
  target: 'vercel' | 'aws-ec2' | 'docker' | 'local';
  startTime: number;
  endTime?: number;
  duration?: number;
  url?: string;
  version: string;
  previousVersion?: string;
  healthChecks: HealthCheckResult[];
  errors: string[];
}

/**
 * 클라우드 배포 결과
 */
export interface CloudDeploymentResult {
  id: string;
  provider: 'vercel' | 'aws' | 'gcp';
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  version: string;
  scalingMetrics?: ScalingMetrics;
  healthCheckResults: HealthCheckResult[];
  cdnEnabled: boolean;
  cdnUrl?: string;
  errors: string[];
}

// ============== 스케일링 타입 ==============

/**
 * 스케일링 정책
 */
export interface ScalingPolicy {
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization?: number; // 0-100
  targetMemoryUtilization?: number; // 0-100
  scaleDownThreshold?: number; // seconds
  scaleUpThreshold?: number; // seconds
}

/**
 * 스케일링 메트릭
 */
export interface ScalingMetrics {
  currentReplicas: number;
  desiredReplicas: number;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
}

// ============== CDN 타입 ==============

/**
 * CDN 설정
 */
export interface CDNConfig {
  enabled: boolean;
  ttl: number; // seconds
  gzip: boolean;
  minify: boolean;
  customHeaders?: Record<string, string>;
}

// ============== 환경 변수 타입 ==============

/**
 * 환경 변수 항목
 */
export interface EnvVar {
  name: string;
  value: string;
  isSecret?: boolean;
}

/**
 * 환경 변수 그룹
 */
export interface EnvVarGroup {
  environment: 'development' | 'staging' | 'production';
  variables: EnvVar[];
}

// ============== 코드 생성 타입 ==============

/**
 * 코드 생성 요청
 */
export interface CodeGenRequest {
  projectName: string;
  description: string;
  frameworks: string[];
  features: string[];
  outputDir: string;
}

/**
 * 코드 생성 결과
 */
export interface CodeGenResult {
  success: boolean;
  projectPath: string;
  files: string[];
  duration: number;
  errors?: string[];
}

// ============== 빌드 설정 타입 ==============

/**
 * 빌드 설정
 */
export interface BuildConfig {
  projectRoot: string;
  outputDir?: string;
  nodeVersion?: string;
  environment?: Record<string, string>;
  skipTests?: boolean;
}

// ============== V6 Engine 타입 ==============

/**
 * V6 Engine 설정
 */
export interface V6EngineConfig {
  projectName: string;
  userPrompt: string;
  outputDir: string;
  dockerize?: boolean;
  verbose?: boolean;
}

/**
 * V6 파이프라인 결과
 */
export interface V6PipelineResult {
  success: boolean;
  project_name: string;
  project_path: string;
  intent: IntentResult | null;
  entities: ExtractedEntities | null;
  code_generated: boolean;
  deployment_ready: boolean;
  duration_ms: number;
  errors?: string[];
}

// ============== 에러 타입 ==============

/**
 * 구조화된 에러
 */
export interface StructuredError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  context?: string;
}

// ============== 메트릭 타입 ==============

/**
 * 배포 메트릭
 */
export interface DeploymentMetric {
  deploymentId: string;
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  requestCount: number;
  errorCount: number;
  responseTime: number; // ms
}

/**
 * 시스템 메트릭
 */
export interface SystemMetric {
  timestamp: number;
  totalDeployments: number;
  activeDeployments: number;
  successRate: number; // 0-100
  averageDeploymentTime: number; // ms
  uptime: number; // ms
}

// ============== 프로젝트 타입 ==============

/**
 * 프로젝트 정보
 */
export interface ProjectInfo {
  id: string;
  name: string;
  type: 'api' | 'web' | 'fullstack';
  description: string;
  createdAt: number;
  updatedAt: number;
  owner: string;
  repository?: string;
  currentVersion: string;
  latestDeployment?: DeploymentResult;
}

// ============== 페이지네이션 타입 ==============

/**
 * 페이지네이션 요청
 */
export interface PaginationQuery {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
