/**
 * Environment Manager
 * 환경 변수 설정 자동화
 *
 * 역할:
 * 1. 환경 변수 검증
 * 2. .env 파일 생성
 * 3. 기본값 제공
 */

import * as fs from "fs";
import * as path from "path";

export interface EnvConfig {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  API_PORT?: number;
  NODE_ENV?: "development" | "production" | "test";
  LOG_LEVEL?: "debug" | "info" | "warn" | "error";
  [key: string]: any;
}

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

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

const ENV_TEMPLATES = {
  api: `# API Server Environment
DATABASE_URL=postgresql://user:pass@localhost:5432/app
JWT_SECRET=your-secret-key-change-this
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=info
`,

  web: `# React Web App Environment
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
`,

  fullstack: `# Full Stack Environment
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/app

# API Server
API_PORT=3000
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
LOG_LEVEL=info

# Web App
REACT_APP_API_URL=http://localhost:3000/api
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

    if (envVars.JWT_SECRET && envVars.JWT_SECRET.length < 16) {
      warnings.push("JWT_SECRET should be at least 16 characters long");
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
   * .env 파일 생성
   */
  generateEnvFile(envVars: EnvConfig, outputPath: string): void {
    try {
      // Merge with defaults
      const merged = { ...DEFAULT_VALUES, ...envVars };

      // Create content
      let content = "";
      for (const [key, value] of Object.entries(merged)) {
        if (value !== undefined && value !== null) {
          content += `${key}=${value}\n`;
        }
      }

      // Create directory if not exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, content, { encoding: "utf-8" });
      console.log(`✅ Generated .env file: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate .env file: ${error}`);
      throw error;
    }
  }

  /**
   * 기본값으로 .env 파일 생성
   */
  generateDefaultEnv(projectType: "api" | "web" | "fullstack", outputPath: string): void {
    try {
      const template = ENV_TEMPLATES[projectType];
      if (!template) {
        throw new Error(`Unknown project type: ${projectType}`);
      }

      // Create directory if not exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write template
      fs.writeFileSync(outputPath, template, { encoding: "utf-8" });
      console.log(`✅ Generated default .env file (${projectType}): ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate default .env file: ${error}`);
      throw error;
    }
  }

  /**
   * Docker 환경 파일 생성
   */
  generateDockerEnv(envVars: EnvConfig, outputPath: string): void {
    try {
      // Docker uses .env.docker format
      let content = "# Docker environment variables\n";
      content += "DOCKER=true\n\n";

      for (const [key, value] of Object.entries(envVars)) {
        if (value !== undefined && value !== null) {
          // Escape special characters for Docker
          const escapedValue = String(value).replace(/"/g, '\\"');
          content += `${key}="${escapedValue}"\n`;
        }
      }

      // Create directory if not exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, content, { encoding: "utf-8" });
      console.log(`✅ Generated Docker .env file: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate Docker .env file: ${error}`);
      throw error;
    }
  }

  /**
   * .env 파일 읽기
   */
  readEnvFile(envPath: string): EnvConfig {
    try {
      if (!fs.existsSync(envPath)) {
        console.warn(`⚠️  .env file not found: ${envPath}`);
        return {};
      }

      const content = fs.readFileSync(envPath, { encoding: "utf-8" });
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
