/**
 * Deployer Tests
 * Builder, EnvManager, DockerfileGenerator 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import { Builder, BuildConfig } from "../src/deployer/builder";
import { EnvManager, EnvConfig } from "../src/deployer/env-manager";
import { DockerfileGenerator, DockerComposeConfig } from "../src/deployer/dockerfile-generator";

// Temporary directory for tests
const TEST_DIR = path.join(__dirname, "../.test-tmp");

describe("Builder", () => {
  let builder: Builder;

  beforeEach(() => {
    builder = new Builder();
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it("should validate project successfully when all required files exist", async () => {
    // Setup test project
    const testProjectDir = path.join(TEST_DIR, "valid-project");
    fs.mkdirSync(testProjectDir, { recursive: true });
    fs.mkdirSync(path.join(testProjectDir, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(testProjectDir, "package.json"),
      JSON.stringify({ name: "test-app", version: "1.0.0" })
    );
    fs.writeFileSync(
      path.join(testProjectDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2020" } })
    );

    // Test
    const config: BuildConfig = {
      projectRoot: testProjectDir,
      outputDir: "dist",
      dockerize: false,
      sourceMap: true,
    };

    const result = await builder.build(config);

    // Assertions
    expect(result.steps.has("validate")).toBe(true);
    expect(result.steps.get("validate")?.status).toBe("success");
  });

  it("should fail validation when package.json is missing", async () => {
    // Setup test project (without package.json)
    const testProjectDir = path.join(TEST_DIR, "invalid-project");
    fs.mkdirSync(testProjectDir, { recursive: true });
    fs.mkdirSync(path.join(testProjectDir, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(testProjectDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2020" } })
    );

    // Test
    const config: BuildConfig = {
      projectRoot: testProjectDir,
      outputDir: "dist",
      dockerize: false,
      sourceMap: true,
    };

    const result = await builder.build(config);

    // Assertions
    expect(result.success).toBe(false);
    expect(result.steps.get("validate")?.status).toBe("failed");
  });

  it("should skip Docker build when dockerize is false", async () => {
    // Setup
    const testProjectDir = path.join(TEST_DIR, "no-docker-project");
    fs.mkdirSync(testProjectDir, { recursive: true });
    fs.mkdirSync(path.join(testProjectDir, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(testProjectDir, "package.json"),
      JSON.stringify({ name: "test-app", version: "1.0.0" })
    );
    fs.writeFileSync(
      path.join(testProjectDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2020" } })
    );

    // Test with dockerize=false
    const config: BuildConfig = {
      projectRoot: testProjectDir,
      outputDir: "dist",
      dockerize: false,
      sourceMap: true,
    };

    const result = await builder.build(config);

    // Assertions
    expect(result.steps.get("docker")?.status).toBe("skipped");
  });
});

describe("EnvManager", () => {
  let envManager: EnvManager;

  beforeEach(() => {
    envManager = new EnvManager();
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it("should validate required environment variables", () => {
    const validConfig: EnvConfig = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      JWT_SECRET: "this-is-a-very-long-secret-key-12345",
      API_PORT: 3000,
    };

    const result = envManager.validate(validConfig, "api");

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should reject missing required variables", () => {
    const invalidConfig: EnvConfig = {
      // Missing DATABASE_URL and JWT_SECRET
      API_PORT: 3000,
    };

    const result = envManager.validate(invalidConfig, "api");

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should generate .env file correctly", () => {
    const envPath = path.join(TEST_DIR, ".env");
    const config: EnvConfig = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      JWT_SECRET: "secret-key",
      API_PORT: 3000,
    };

    envManager.generateEnvFile(config, envPath);

    expect(fs.existsSync(envPath)).toBe(true);
    const content = fs.readFileSync(envPath, { encoding: "utf-8" });
    expect(content).toContain("DATABASE_URL=");
  });

  it("should read .env file correctly", () => {
    const envPath = path.join(TEST_DIR, ".env.read");
    const originalContent = `DATABASE_URL=postgresql://user:pass@localhost:5432/app
JWT_SECRET=test-secret
API_PORT=3000
`;
    fs.writeFileSync(envPath, originalContent, { encoding: "utf-8" });

    const config = envManager.readEnvFile(envPath);

    expect(config.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/app");
    expect(config.JWT_SECRET).toBe("test-secret");
    expect(config.API_PORT).toBe(3000);
  });
});

describe("DockerfileGenerator", () => {
  let generator: DockerfileGenerator;

  beforeEach(() => {
    generator = new DockerfileGenerator();
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it("should generate API Dockerfile", () => {
    const projectDir = path.join(TEST_DIR, "api-project");
    fs.mkdirSync(projectDir, { recursive: true });

    generator.generateApiDockerfile(projectDir);

    const dockerfilePath = path.join(projectDir, "Dockerfile");
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    const content = fs.readFileSync(dockerfilePath, { encoding: "utf-8" });
    expect(content).toContain("FROM node:18-alpine");
  });

  it("should generate .dockerignore", () => {
    const projectDir = path.join(TEST_DIR, "dockerignore-project");
    fs.mkdirSync(projectDir, { recursive: true });

    generator.generateDockerignore(projectDir);

    const dockerignorePath = path.join(projectDir, ".dockerignore");
    expect(fs.existsSync(dockerignorePath)).toBe(true);
    const content = fs.readFileSync(dockerignorePath, { encoding: "utf-8" });
    expect(content).toContain("node_modules");
  });
});
