/**
 * Input Validator
 * 사용자 입력 검증 및 정제
 *
 * 검증 항목:
 * - Project names
 * - Port numbers
 * - File paths
 * - Environment variables
 * - URL formats
 */

import { ValidationError } from "../types/errors";

export class InputValidator {
  /**
   * 프로젝트 이름 검증
   * 규칙: 3-64 자, 알파벳/숫자/하이픈만 허용, 하이픈으로 시작/종료 불가
   */
  static validateProjectName(name: string): void {
    if (!name) {
      throw new ValidationError("Project name is required", "INVALID_PROJECT_NAME");
    }

    if (name.length < 3 || name.length > 64) {
      throw new ValidationError(
        "Project name must be 3-64 characters long",
        "INVALID_PROJECT_NAME",
        { provided: name.length }
      );
    }

    if (!/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/i.test(name)) {
      throw new ValidationError(
        "Project name must contain only alphanumeric characters and hyphens, " +
          "and cannot start or end with hyphen",
        "INVALID_PROJECT_NAME"
      );
    }

    // 예약어 검사
    const reserved = ["admin", "api", "root", "system", "app"];
    if (reserved.includes(name.toLowerCase())) {
      throw new ValidationError(
        `Project name '${name}' is reserved`,
        "RESERVED_PROJECT_NAME"
      );
    }
  }

  /**
   * 포트 번호 검증
   * 규칙: 1024-65535 범위, 예약 포트 제외
   */
  static validatePort(port: number): void {
    if (!Number.isInteger(port)) {
      throw new ValidationError(
        "Port must be an integer",
        "INVALID_PORT",
        { provided: port }
      );
    }

    if (port < 1024 || port > 65535) {
      throw new ValidationError(
        "Port must be between 1024 and 65535",
        "INVALID_PORT",
        { provided: port }
      );
    }

    // 일반적으로 사용하는 포트 제외
    const reserved = [
      3000, 5000, 5432, 27017, 6379, // 개발 포트
      22, 80, 443, 8080, 8443, // 시스템 포트
    ];

    if (reserved.includes(port)) {
      throw new ValidationError(
        `Port ${port} is commonly reserved`,
        "RESERVED_PORT",
        { provided: port }
      );
    }
  }

  /**
   * 파일 경로 검증
   * 규칙: 상대 경로 검사, 절대경로 변환, 경로 순회 방지
   */
  static validateFilePath(filePath: string, baseDir: string): string {
    if (!filePath) {
      throw new ValidationError("File path is required", "INVALID_FILE_PATH");
    }

    // 절대 경로 변환
    const path = require("path");
    const resolvedPath = path.resolve(baseDir, filePath);

    // baseDir 범위 내인지 확인 (Path Traversal 방지)
    if (!resolvedPath.startsWith(path.resolve(baseDir))) {
      throw new ValidationError(
        "Path traversal detected",
        "PATH_TRAVERSAL",
        { attempted: filePath }
      );
    }

    // 위험한 경로 패턴 검사
    const dangerous = ["/etc/", "/sys/", "/proc/", "C:\\Windows\\", "C:\\System32\\"];
    if (dangerous.some((p) => resolvedPath.startsWith(p))) {
      throw new ValidationError(
        "Access to system directories not allowed",
        "FORBIDDEN_PATH",
        { attempted: resolvedPath }
      );
    }

    return resolvedPath;
  }

  /**
   * 환경 변수 이름 검증
   * 규칙: 알파벳, 숫자, 언더스코어만 허용
   */
  static validateEnvVarName(name: string): void {
    if (!name) {
      throw new ValidationError("Environment variable name is required", "INVALID_ENV_VAR_NAME");
    }

    if (!/^[A-Z][A-Z0-9_]*$/i.test(name)) {
      throw new ValidationError(
        "Environment variable name must contain only alphanumeric characters and underscores, " +
          "and start with a letter",
        "INVALID_ENV_VAR_NAME"
      );
    }
  }

  /**
   * URL 검증
   * 규칙: 유효한 http/https URL만 허용
   */
  static validateURL(urlString: string): void {
    if (!urlString) {
      throw new ValidationError("URL is required", "INVALID_URL");
    }

    try {
      const url = new URL(urlString);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new ValidationError(
          "Only HTTP and HTTPS URLs are supported",
          "INVALID_URL_PROTOCOL"
        );
      }

      if (!url.hostname) {
        throw new ValidationError(
          "URL must have a valid hostname",
          "INVALID_URL_HOSTNAME"
        );
      }
    } catch (error) {
      throw new ValidationError(
        `Invalid URL format: ${urlString}`,
        "INVALID_URL"
      );
    }
  }

  /**
   * Docker 이미지명 검증
   * 규칙: registry/repository:tag 형식
   */
  static validateDockerImage(image: string): void {
    if (!image) {
      throw new ValidationError("Docker image name is required", "INVALID_DOCKER_IMAGE");
    }

    // 간단한 검증 (상세: https://docs.docker.com/engine/reference/commandline/tag/)
    const dockerImageRegex =
      /^(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9])(?::[a-zA-Z0-9._-]+)?$/;

    if (!dockerImageRegex.test(image)) {
      throw new ValidationError(
        "Invalid Docker image name format",
        "INVALID_DOCKER_IMAGE",
        { provided: image }
      );
    }
  }

  /**
   * 배포 설정 검증
   */
  static validateDeployConfig(config: any): void {
    if (!config) {
      throw new ValidationError("Deployment config is required", "MISSING_CONFIG");
    }

    if (!config.projectName) {
      throw new ValidationError("projectName is required", "MISSING_PROJECT_NAME");
    }

    if (!config.target) {
      throw new ValidationError("target is required", "MISSING_TARGET");
    }

    this.validateProjectName(config.projectName);

    const validTargets = ["vercel", "aws-ec2", "docker", "local"];
    if (!validTargets.includes(config.target)) {
      throw new ValidationError(
        `target must be one of: ${validTargets.join(", ")}`,
        "INVALID_TARGET",
        { provided: config.target }
      );
    }

    if (config.port) {
      this.validatePort(config.port);
    }

    if (config.dockerImage) {
      this.validateDockerImage(config.dockerImage);
    }

    if (config.environment) {
      if (typeof config.environment !== "object") {
        throw new ValidationError(
          "environment must be an object",
          "INVALID_ENVIRONMENT"
        );
      }

      for (const key of Object.keys(config.environment)) {
        this.validateEnvVarName(key);
      }
    }
  }

  /**
   * 입력값 정제 (최소한의 정제)
   * 주의: 이 함수는 검증 후 사용, 검증 대체 불가
   */
  static sanitizeProjectName(name: string): string {
    // 먼저 검증
    this.validateProjectName(name);

    // 추가 정제: 공백 제거, 소문자 변환
    return name.trim().toLowerCase();
  }

  /**
   * JSON 검증
   */
  static validateJSON(jsonString: string): any {
    if (!jsonString) {
      throw new ValidationError("JSON string is required", "INVALID_JSON");
    }

    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new ValidationError(
        `Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`,
        "INVALID_JSON"
      );
    }
  }

  /**
   * 정수 범위 검증
   */
  static validateIntRange(value: any, min: number, max: number, fieldName: string): number {
    const num = Number(value);

    if (!Number.isInteger(num)) {
      throw new ValidationError(
        `${fieldName} must be an integer`,
        "INVALID_INTEGER",
        { field: fieldName, provided: value }
      );
    }

    if (num < min || num > max) {
      throw new ValidationError(
        `${fieldName} must be between ${min} and ${max}`,
        "OUT_OF_RANGE",
        { field: fieldName, min, max, provided: num }
      );
    }

    return num;
  }

  /**
   * 문자열 길이 검증
   */
  static validateStringLength(
    value: string,
    min: number,
    max: number,
    fieldName: string
  ): string {
    if (!value) {
      throw new ValidationError(
        `${fieldName} is required`,
        "REQUIRED_FIELD",
        { field: fieldName }
      );
    }

    if (value.length < min || value.length > max) {
      throw new ValidationError(
        `${fieldName} must be between ${min} and ${max} characters`,
        "INVALID_LENGTH",
        { field: fieldName, min, max, provided: value.length }
      );
    }

    return value;
  }
}
