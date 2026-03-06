/**
 * Error Handler
 * 중앙 집중식 에러 처리 및 정제
 *
 * 기능:
 * - 에러 타입 분류
 * - 에러 메시지 정제 (민감 정보 마스킹)
 * - 디버그 모드 지원
 * - 에러 로깅
 */

import {
  DeploymentError,
  ValidationError,
  SecurityError,
  ConfigError,
  AppError,
  ErrorResponse,
} from "../types/errors";

export class ErrorHandler {
  private static DEBUG = process.env.DEBUG === "true";
  private static LOG_ERRORS = process.env.LOG_ERRORS !== "false"; // 기본값: true

  /**
   * 에러 메시지 정제
   * 민감한 정보(경로, 포트, IP, 호스트)를 마스킹
   */
  static sanitizeErrorMessage(error: unknown): string {
    let message = "";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else {
      message = JSON.stringify(error);
    }

    // 디버그 모드가 아닐 때만 정제
    if (!this.DEBUG) {
      // 절대경로 마스킹
      message = message.replace(/\/home\/[^/\s]+/g, "/home/***");
      message = message.replace(/\/root\/[^/\s]+/g, "/root/***");
      message = message.replace(/C:\\Users\\[^\\]+/g, "C:\\Users\\***");

      // 포트 마스킹
      message = message.replace(/:\d{4,5}(?![0-9])/g, ":****");

      // IP 주소 마스킹
      message = message.replace(
        /\b(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)\b/g,
        "***"
      );

      // 도메인 일부 마스킹
      message = message.replace(/([a-z0-9\-]+)\.([a-z]{2,})/g, "***.***");

      // 환경 변수 값 마스킹
      message = message.replace(/(?:password|secret|token|key|auth)=([^\s,]+)/gi, "$1=***");
    }

    return message;
  }

  /**
   * 에러를 적절한 타입으로 변환
   */
  static handleError(error: unknown, context?: string): DeploymentError {
    // 이미 AppError 타입이면 그대로 반환
    if (error instanceof DeploymentError) {
      return error;
    }

    if (error instanceof ValidationError) {
      return new DeploymentError(
        error.message,
        error.code,
        400,
        error.details
      );
    }

    if (error instanceof SecurityError) {
      return new DeploymentError(
        error.message,
        error.code,
        403,
        error.details
      );
    }

    if (error instanceof ConfigError) {
      return new DeploymentError(
        error.message,
        error.code,
        500,
        error.details
      );
    }

    // 표준 Error 타입
    if (error instanceof Error) {
      const message = this.sanitizeErrorMessage(error);
      const code = this.extractErrorCode(error);

      return new DeploymentError(
        message,
        code || "INTERNAL_ERROR",
        500,
        context ? { context } : undefined
      );
    }

    // 그 외 타입
    const message = this.sanitizeErrorMessage(String(error));
    return new DeploymentError(
      message,
      "UNKNOWN_ERROR",
      500,
      context ? { context } : undefined
    );
  }

  /**
   * 에러 코드 추출
   */
  private static extractErrorCode(error: Error): string | null {
    // Error 객체의 code 속성 확인
    if ("code" in error) {
      return String(error.code);
    }

    // 에러 메시지에서 패턴 추출
    const match = error.message.match(/\[(\w+)\]/);
    if (match) {
      return match[1];
    }

    // 에러 이름 기반
    if (error.name === "ValidationError") return "VALIDATION_ERROR";
    if (error.name === "SecurityError") return "SECURITY_ERROR";
    if (error.name === "TimeoutError") return "TIMEOUT_ERROR";
    if (error.name === "NetworkError") return "NETWORK_ERROR";

    return null;
  }

  /**
   * 에러 로깅
   * 디버그 모드에서만 스택 트레이스 출력
   */
  static logError(error: unknown, context?: string): void {
    if (!this.LOG_ERRORS) return;

    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : "";

    if (this.DEBUG && error instanceof Error) {
      console.error(
        `[${timestamp}] ERROR${contextStr}:`,
        error.name,
        "\n",
        error.message,
        "\n",
        error.stack
      );
    } else {
      const message = this.sanitizeErrorMessage(error);
      console.error(`[${timestamp}] ERROR${contextStr}: ${message}`);
    }
  }

  /**
   * 에러 응답 생성
   */
  static createErrorResponse(error: DeploymentError, requestId?: string): ErrorResponse {
    return {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  /**
   * 에러 메타데이터 추출
   */
  static extractErrorMetadata(
    error: unknown
  ): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.DEBUG ? error.stack : undefined,
      };
    }

    return { value: String(error) };
  }

  /**
   * 에러 체인 추적
   */
  static getErrorChain(error: unknown): string[] {
    const chain: string[] = [];

    if (error instanceof Error) {
      chain.push(error.message);

      // cause 속성 추적 (Error.cause)
      if ("cause" in error && error.cause) {
        chain.push(...this.getErrorChain(error.cause));
      }
    } else {
      chain.push(String(error));
    }

    return chain;
  }
}

/**
 * 에러 처리 래퍼 함수
 * async/await 호환
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<[T | null, DeploymentError | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const deploymentError = ErrorHandler.handleError(error, context);
    ErrorHandler.logError(error, context);
    return [null, deploymentError];
  }
}

/**
 * 동기 에러 처리 래퍼 함수
 */
export function handleSync<T>(
  fn: () => T,
  context?: string
): [T | null, DeploymentError | null] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    const deploymentError = ErrorHandler.handleError(error, context);
    ErrorHandler.logError(error, context);
    return [null, deploymentError];
  }
}
