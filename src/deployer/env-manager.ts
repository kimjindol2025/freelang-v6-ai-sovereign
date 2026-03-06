/**
 * Environment Manager
 * 환경 변수 설정 자동화
 *
 * 역할:
 * 1. 환경 변수 강화 검증 (타입, 길이, 형식, 경로 순환 방지)
 * 2. .env 파일 생성 (보안 검증 포함)
 * 3. 기본값 제공
 * 4. 민감한 정보 마스킹
 */

import * as fs from "fs";
import * as path from "path";

export interface EnvConfig {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  API_PORT?: number;
  NODE_ENV?: "development" | "production" | "test";
  LOG_LEVEL?: "debug" | "info" | "warn" | "error";
  API_KEY?: string;
  [key: string]: any;
}

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// 환경별 필수 변수 정의 (Production: 강화)
const REQUIRED_VARS = {
  production: ["DATABASE_URL", "JWT_SECRET", "API_KEY"],
  development: ["DATABASE_URL"],
  test: [],
};

const REQUIRED_VARS_API = [
  "DATABASE_URL",
  "JWT_SECRET",
  "API_PORT",
];

const REQUIRED_VARS_WEB = [
  "REACT_APP_API_URL",
  "REACT_APP_ENV",
];

const DEFAULT_VALUES: Record<string, any> = {
  API_PORT: 3000,
  NODE_ENV: "development",
  LOG_LEVEL: "info",
  REACT_APP_ENV: "development",
};

// 민감한 정보 필드 (로그에서 마스킹)
const SENSITIVE_FIELDS = [
  "JWT_SECRET",
  "DATABASE_URL",
  "API_KEY",
  "PASSWORD",
  "SECRET",
  "TOKEN",
  "PRIVATE_KEY",
];

const ENV_TEMPLATES = {
  api: `# API Server Environment
# ⚠️  SECURITY: Required environment variables (NO DEFAULT VALUES PROVIDED)
# DATABASE_URL=postgresql://user:password@host:port/dbname
# JWT_SECRET=<min 32 characters - generate with: openssl rand -base64 32>

API_PORT=3000
NODE_ENV=development
LOG_LEVEL=info
`,

  web: `# React Web App Environment
# ⚠️  REQUIRED: Set API URL for your environment
# REACT_APP_API_URL=https://api.example.com

REACT_APP_ENV=development
`,

  fullstack: `# Full Stack Environment

# ⚠️  SECURITY: Database configuration (REQUIRED - NO DEFAULT VALUES)
# DATABASE_URL=postgresql://user:password@host:port/dbname

# ⚠️  SECURITY: Secrets must be strong (min 32 characters each)
# JWT_SECRET=<generate with: openssl rand -base64 32>
# REFRESH_SECRET=<generate with: openssl rand -base64 32>

# API Server
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Web App
# REACT_APP_API_URL=https://api.example.com
REACT_APP_ENV=development
`,
};

export class EnvManager {
  /**
   * 환경 변수 검증
   */
  validate(envVars: EnvConfig, projectType: "api" | "web" | "fullstack" = "api"): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredVars = projectType === "web" ? REQUIRED_VARS_WEB : REQUIRED_VARS_API;

    // Check required variables
    for (const varName of requiredVars) {
      if (!(varName in envVars) || envVars[varName] === undefined || envVars[varName] === "") {
        errors.push(`Missing required variable: ${varName}`);
      }
    }

    // Validate specific variable formats
    if (envVars.DATABASE_URL && !envVars.DATABASE_URL.startsWith("postgresql://")) {
      warnings.push("DATABASE_URL should use postgresql:// protocol");
    }

    if (envVars.JWT_SECRET && envVars.JWT_SECRET.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters for security");
    }

    if (envVars.API_PORT && (envVars.API_PORT < 1000 || envVars.API_PORT > 65535)) {
      errors.push("API_PORT must be between 1000 and 65535");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 경로 순환 공격 방지 (Path Traversal Prevention)
   */
  private validatePath(basePath: string, targetPath: string): string {
    try {
      const normalizedBase = path.resolve(basePath);
      const normalizedTarget = path.resolve(normalizedBase, targetPath);

      // 목표 경로가 기본 경로 내에 있는지 확인
      if (!normalizedTarget.startsWith(normalizedBase)) {
        throw new Error(`Path traversal attempt detected: ${targetPath}`);
      }

      return normalizedTarget;
    } catch (error) {
      throw new Error(`Invalid path: ${error}`);
    }
  }

  /**
   * .env 파일 생성 (경로 검증 + 보안 체크)
   */
  generateEnvFile(envVars: EnvConfig, outputPath: string, projectRoot: string = process.cwd()): void {
    try {
      // 경로 안전성 검증
      const safePath = this.validatePath(projectRoot, outputPath);

      // 환경 변수 검증 (생성 전)
      const validation = this.validate(envVars, "api");
      if (!validation.valid) {
        throw new Error(`Environment validation failed:\n${validation.errors.join("\n")}`);
      }

      // Merge with defaults
      const merged = { ...DEFAULT_VALUES, ...envVars };

      // Create content
      let content = "# Environment variables\n";
      content += "# ⚠️  Keep sensitive values secure - never commit to version control\n\n";

      for (const [key, value] of Object.entries(merged)) {
        if (value !== undefined && value !== null) {
          // 민감한 값은 마스킹 처리
          const isSensitive = SENSITIVE_FIELDS.some((field) => key.toUpperCase().includes(field));
          if (isSensitive) {
            content += `# ${key}=***REDACTED***\n`;
          } else {
            content += `${key}=${value}\n`;
          }
        }
      }

      // Create directory if not exists
      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file with restricted permissions (0600)
      fs.writeFileSync(safePath, content, { encoding: "utf-8", mode: 0o600 });
      console.log(`✅ Generated .env file: ${safePath}`);
      console.log(`📝 File permissions set to 0600 (owner read/write only)`);
    } catch (error) {
      console.error(`❌ Failed to generate .env file: ${error}`);
      throw error;
    }
  }

  /**
   * 기본값으로 .env 파일 생성 (경로 검증 포함)
   */
  generateDefaultEnv(
    projectType: "api" | "web" | "fullstack",
    outputPath: string,
    projectRoot: string = process.cwd()
  ): void {
    try {
      // 경로 안전성 검증
      const safePath = this.validatePath(projectRoot, outputPath);

      const template = ENV_TEMPLATES[projectType];
      if (!template) {
        throw new Error(`Unknown project type: ${projectType}`);
      }

      // Create directory if not exists
      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write template with restricted permissions (0600)
      fs.writeFileSync(safePath, template, { encoding: "utf-8", mode: 0o600 });
      console.log(`✅ Generated default .env file (${projectType}): ${safePath}`);
      console.log(`📝 File permissions set to 0600 (owner read/write only)`);
    } catch (error) {
      console.error(`❌ Failed to generate default .env file: ${error}`);
      throw error;
    }
  }

  /**
   * Docker 환경 파일 생성 (경로 검증 + 보안)
   */
  generateDockerEnv(envVars: EnvConfig, outputPath: string, projectRoot: string = process.cwd()): void {
    try {
      // 경로 안전성 검증
      const safePath = this.validatePath(projectRoot, outputPath);

      // 환경 변수 검증 (생성 전)
      const validation = this.validate(envVars, "api");
      if (!validation.valid) {
        throw new Error(`Environment validation failed:\n${validation.errors.join("\n")}`);
      }

      // Docker uses .env.docker format
      let content = "# Docker environment variables\n";
      content += "# ⚠️  Keep sensitive values secure\n";
      content += "DOCKER=true\n\n";

      for (const [key, value] of Object.entries(envVars)) {
        if (value !== undefined && value !== null) {
          // 민감한 값 마스킹 (Docker에서 실제 값 필요하면 별도 처리)
          const isSensitive = SENSITIVE_FIELDS.some((field) => key.toUpperCase().includes(field));

          if (isSensitive) {
            content += `# ${key}=***REDACTED***\n`;
          } else {
            // Escape special characters for Docker
            const escapedValue = String(value).replace(/"/g, '\\"');
            content += `${key}="${escapedValue}"\n`;
          }
        }
      }

      // Create directory if not exists
      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file with restricted permissions (0600)
      fs.writeFileSync(safePath, content, { encoding: "utf-8", mode: 0o600 });
      console.log(`✅ Generated Docker .env file: ${safePath}`);
      console.log(`📝 File permissions set to 0600 (owner read/write only)`);
    } catch (error) {
      console.error(`❌ Failed to generate Docker .env file: ${error}`);
      throw error;
    }
  }

  /**
   * .env 파일 읽기 (경로 검증 + 보안 체크)
   */
  readEnvFile(envPath: string, projectRoot: string = process.cwd()): EnvConfig {
    try {
      // 경로 안전성 검증
      const safePath = this.validatePath(projectRoot, envPath);

      if (!fs.existsSync(safePath)) {
        console.warn(`⚠️  .env file not found: ${safePath}`);
        return {};
      }

      const content = fs.readFileSync(safePath, { encoding: "utf-8" });
      const config: EnvConfig = {};

      const lines = content.split("\n");
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith("#") || !line.trim()) {
          continue;
        }

        // Parse key=value
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value: any = match[2].trim();

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          // Convert to number if applicable
          if (!isNaN(value) && value !== "") {
            value = Number(value);
          }

          config[key] = value;
        }
      }

      return config;
    } catch (error) {
      console.error(`❌ Failed to read .env file: ${error}`);
      throw error;
    }
  }

  /**
   * 환경 변수 병합
   */
  mergeEnv(...configs: EnvConfig[]): EnvConfig {
    const merged: EnvConfig = {};

    for (const config of configs) {
      Object.assign(merged, config);
    }

    return merged;
  }
}

// Test
if (require.main === module) {
  const manager = new EnvManager();

  console.log("\n📋 Test 1: Generate default API .env");
  manager.generateDefaultEnv("api", "/tmp/test-api.env");

  console.log("\n📋 Test 2: Validate environment variables");
  const testConfig: EnvConfig = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
    JWT_SECRET: "this-is-a-very-long-secret-key",
    API_PORT: 3000,
  };
  const validation = manager.validate(testConfig, "api");
  console.log("Validation result:", {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
  });

  console.log("\n📋 Test 3: Generate .env file");
  manager.generateEnvFile(testConfig, "/tmp/test.env");

  console.log("\n📋 Test 4: Generate Docker .env");
  manager.generateDockerEnv(testConfig, "/tmp/test.docker.env");

  console.log("\n📋 Test 5: Read .env file");
  const read = manager.readEnvFile("/tmp/test.env");
  console.log("Read config:", read);
}
