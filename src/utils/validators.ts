/**
 * Input Validators
 * 입력값 검증 및 보안 규칙 적용
 *
 * 검증 항목:
 * 1. Project Name: 소문자, 숫자, -, _, . 만 허용
 * 2. Version: Semantic Versioning (v?.?.?) 형식
 * 3. Port: 1-65535 범위
 * 4. URL: 유효한 URL 형식
 * 5. Environment: 안전한 환경변수 이름
 */

export class ValidationError extends Error {
  constructor(
    public field: string,
    public value: any,
    message: string
  ) {
    super(`[${field}] ${message}`);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  /**
   * 프로젝트 이름 검증
   * 규칙: 소문자 알파벳, 숫자, -, _, . 만 허용
   * 첫 글자: 알파벳 또는 숫자
   * 마지막 글자: 알파벳 또는 숫자 (-, _, . 제외)
   * 길이: 1-128 자
   */
  static validateProjectName(name: string): void {
    if (typeof name !== 'string') {
      throw new ValidationError('projectName', name, 'Must be a string');
    }

    if (name.length === 0 || name.length > 128) {
      throw new ValidationError(
        'projectName',
        name,
        'Length must be 1-128 characters'
      );
    }

    if (!/^[a-z0-9]([a-z0-9\-_.]*[a-z0-9])?$/.test(name)) {
      throw new ValidationError(
        'projectName',
        name,
        'Invalid format. Use lowercase letters, numbers, hyphens, underscores, and dots. ' +
          'Must start and end with alphanumeric characters.'
      );
    }
  }

  /**
   * 버전 검증
   * 규칙: Semantic Versioning (v?.?.?)
   * 선택사항: v 접두사, pre-release 태그 (-alpha, -beta, -rc.1)
   */
  static validateVersion(version: string): void {
    if (typeof version !== 'string') {
      throw new ValidationError('version', version, 'Must be a string');
    }

    if (version.length === 0 || version.length > 50) {
      throw new ValidationError(
        'version',
        version,
        'Length must be 1-50 characters'
      );
    }

    if (!/^v?\d+\.\d+\.\d+(-[a-z0-9]+(.[a-z0-9]+)*)?$/i.test(version)) {
      throw new ValidationError(
        'version',
        version,
        'Invalid version format. Use semantic versioning (e.g., 1.0.0 or v1.0.0 or v1.0.0-alpha.1)'
      );
    }
  }

  /**
   * 포트 번호 검증
   * 규칙: 1-65535 범위
   */
  static validatePort(port: number): void {
    if (typeof port !== 'number' || !Number.isInteger(port)) {
      throw new ValidationError('port', port, 'Must be an integer');
    }

    if (port < 1 || port > 65535) {
      throw new ValidationError(
        'port',
        port,
        'Must be between 1 and 65535'
      );
    }
  }

  /**
   * CPU 리소스 검증
   * 규칙: 100m ~ 4000m (밀리코어)
   */
  static validateCpuLimit(cpu: string): void {
    if (typeof cpu !== 'string') {
      throw new ValidationError('cpuLimit', cpu, 'Must be a string');
    }

    if (!/^\d+m$/.test(cpu)) {
      throw new ValidationError(
        'cpuLimit',
        cpu,
        'Invalid format. Use millicores (e.g., "500m")'
      );
    }

    const value = parseInt(cpu);
    if (value < 100 || value > 4000) {
      throw new ValidationError(
        'cpuLimit',
        cpu,
        'Must be between 100m and 4000m'
      );
    }
  }

  /**
   * 메모리 리소스 검증
   * 규칙: 128Mi ~ 2Gi
   */
  static validateMemoryLimit(memory: string): void {
    if (typeof memory !== 'string') {
      throw new ValidationError('memoryLimit', memory, 'Must be a string');
    }

    if (!/^(\d+)(Mi|Gi)$/.test(memory)) {
      throw new ValidationError(
        'memoryLimit',
        memory,
        'Invalid format. Use Mi or Gi (e.g., "512Mi" or "1Gi")'
      );
    }

    const match = memory.match(/^(\d+)(Mi|Gi)$/);
    if (!match) return;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'Mi') {
      if (value < 128 || value > 2048) {
        throw new ValidationError(
          'memoryLimit',
          memory,
          'Must be between 128Mi and 2048Mi'
        );
      }
    } else {
      if (value < 1 || value > 2) {
        throw new ValidationError(
          'memoryLimit',
          memory,
          'Must be between 1Gi and 2Gi'
        );
      }
    }
  }

  /**
   * URL 검증
   * 규칙: http://, https://, 또는 도메인 형식
   */
  static validateUrl(url: string): void {
    if (typeof url !== 'string') {
      throw new ValidationError('url', url, 'Must be a string');
    }

    if (url.length === 0 || url.length > 2048) {
      throw new ValidationError('url', url, 'Length must be 1-2048 characters');
    }

    try {
      new URL(url);
    } catch (error) {
      throw new ValidationError(
        'url',
        url,
        'Invalid URL format'
      );
    }
  }

  /**
   * 환경변수 이름 검증
   * 규칙: 대문자, 숫자, 언더스코어만 허용
   * 첫 글자: 알파벳 또는 언더스코어
   */
  static validateEnvVarName(name: string): void {
    if (typeof name !== 'string') {
      throw new ValidationError('envVarName', name, 'Must be a string');
    }

    if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
      throw new ValidationError(
        'envVarName',
        name,
        'Invalid format. Use uppercase letters, numbers, and underscores. ' +
          'Must start with a letter or underscore.'
      );
    }
  }

  /**
   * 환경변수 값 검증
   * 규칙: 제어 문자 제외, 최대 10KB
   */
  static validateEnvVarValue(value: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError('envVarValue', value, 'Must be a string');
    }

    if (value.length > 10240) {
      throw new ValidationError(
        'envVarValue',
        value,
        'Length must not exceed 10240 characters'
      );
    }

    // 제어 문자 검사
    if (/[\x00-\x1F\x7F]/.test(value)) {
      throw new ValidationError(
        'envVarValue',
        value,
        'Contains invalid control characters'
      );
    }
  }

  /**
   * 환경 이름 검증
   * 규칙: development, staging, production만 허용
   */
  static validateEnvironment(env: string): void {
    if (typeof env !== 'string') {
      throw new ValidationError('environment', env, 'Must be a string');
    }

    if (!['development', 'staging', 'production'].includes(env)) {
      throw new ValidationError(
        'environment',
        env,
        'Must be one of: development, staging, production'
      );
    }
  }

  /**
   * 레플리카 개수 검증
   * 규칙: 1-100
   */
  static validateReplicas(replicas: number): void {
    if (typeof replicas !== 'number' || !Number.isInteger(replicas)) {
      throw new ValidationError('replicas', replicas, 'Must be an integer');
    }

    if (replicas < 1 || replicas > 100) {
      throw new ValidationError(
        'replicas',
        replicas,
        'Must be between 1 and 100'
      );
    }
  }

  /**
   * TTL 검증 (초)
   * 규칙: 0-31536000 (1년)
   */
  static validateTTL(ttl: number): void {
    if (typeof ttl !== 'number' || !Number.isInteger(ttl)) {
      throw new ValidationError('ttl', ttl, 'Must be an integer');
    }

    if (ttl < 0 || ttl > 31536000) {
      throw new ValidationError(
        'ttl',
        ttl,
        'Must be between 0 and 31536000 seconds'
      );
    }
  }

  /**
   * 클라우드 공급자 검증
   */
  static validateCloudProvider(provider: string): void {
    if (typeof provider !== 'string') {
      throw new ValidationError('provider', provider, 'Must be a string');
    }

    if (!['vercel', 'aws', 'gcp'].includes(provider)) {
      throw new ValidationError(
        'provider',
        provider,
        'Must be one of: vercel, aws, gcp'
      );
    }
  }

  /**
   * 배포 타겟 검증
   */
  static validateDeployTarget(target: string): void {
    if (typeof target !== 'string') {
      throw new ValidationError('target', target, 'Must be a string');
    }

    if (!['vercel', 'aws-ec2', 'docker', 'local'].includes(target)) {
      throw new ValidationError(
        'target',
        target,
        'Must be one of: vercel, aws-ec2, docker, local'
      );
    }
  }

  /**
   * 데이터베이스 타입 검증
   */
  static validateDatabaseType(type: string): void {
    if (typeof type !== 'string') {
      throw new ValidationError('databaseType', type, 'Must be a string');
    }

    if (!['postgres', 'mysql', 'mongodb'].includes(type)) {
      throw new ValidationError(
        'databaseType',
        type,
        'Must be one of: postgres, mysql, mongodb'
      );
    }
  }

  /**
   * 입력값이 비어있지 않은지 검증
   */
  static validateNonEmpty(value: any, fieldName: string): void {
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim().length === 0)
    ) {
      throw new ValidationError(fieldName, value, 'Cannot be empty');
    }
  }

  /**
   * 숫자 범위 검증
   */
  static validateRange(value: number, min: number, max: number, fieldName: string): void {
    if (typeof value !== 'number') {
      throw new ValidationError(fieldName, value, 'Must be a number');
    }

    if (value < min || value > max) {
      throw new ValidationError(
        fieldName,
        value,
        `Must be between ${min} and ${max}`
      );
    }
  }

  /**
   * 문자열 길이 검증
   */
  static validateStringLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): void {
    if (typeof value !== 'string') {
      throw new ValidationError(fieldName, value, 'Must be a string');
    }

    if (value.length < minLength || value.length > maxLength) {
      throw new ValidationError(
        fieldName,
        value,
        `Length must be between ${minLength} and ${maxLength}`
      );
    }
  }
}
