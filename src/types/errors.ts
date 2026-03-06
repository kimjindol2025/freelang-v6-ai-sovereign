/**
 * Custom Error Types
 * 에러 타입 정의 및 분류
 *
 * - DeploymentError: 배포 관련 에러
 * - ValidationError: 입력값 검증 에러
 * - SecurityError: 보안 위반 에러
 * - ConfigError: 설정 파일 에러
 */

export class DeploymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "DeploymentError";
    Object.setPrototypeOf(this, DeploymentError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string = "VALIDATION_ERROR",
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string = "SECURITY_ERROR",
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "SecurityError";
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string = "CONFIG_ERROR",
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ConfigError";
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

/**
 * 에러 분류 타입
 */
export type AppError =
  | DeploymentError
  | ValidationError
  | SecurityError
  | ConfigError;

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
  };
}
