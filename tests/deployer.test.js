"use strict";
/**
 * Deployer Tests
 * Builder, EnvManager, DockerfileGenerator 테스트
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const builder_1 = require("../src/deployer/builder");
const env_manager_1 = require("../src/deployer/env-manager");
const dockerfile_generator_1 = require("../src/deployer/dockerfile-generator");
// Temporary directory for tests
const TEST_DIR = path.join(__dirname, "../.test-tmp");
(0, globals_1.describe)("Builder", () => {
    let builder;
    (0, globals_1.beforeEach)(() => {
        builder = new builder_1.Builder();
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, { recursive: true });
        }
    });
    (0, globals_1.afterEach)(() => {
        // Cleanup
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true });
        }
    });
    (0, globals_1.it)("should validate project successfully when all required files exist", async () => {
        // Setup test project
        const testProjectDir = path.join(TEST_DIR, "valid-project");
        fs.mkdirSync(testProjectDir, { recursive: true });
        fs.mkdirSync(path.join(testProjectDir, "src"), { recursive: true });
        fs.writeFileSync(path.join(testProjectDir, "package.json"), JSON.stringify({ name: "test-app", version: "1.0.0" }));
        fs.writeFileSync(path.join(testProjectDir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2020" } }));
        // Test
        const config = {
            projectRoot: testProjectDir,
            outputDir: "dist",
            dockerize: false,
            sourceMap: true,
        };
        const result = await builder.build(config);
        // Assertions
        (0, globals_1.expect)(result.steps.has("validate")).toBe(true);
        (0, globals_1.expect)(result.steps.get("validate")?.status).toBe("success");
    });
    (0, globals_1.it)("should fail validation when package.json is missing", async () => {
        // Setup test project (without package.json)
        const testProjectDir = path.join(TEST_DIR, "invalid-project");
        fs.mkdirSync(testProjectDir, { recursive: true });
        fs.mkdirSync(path.join(testProjectDir, "src"), { recursive: true });
        fs.writeFileSync(path.join(testProjectDir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2020" } }));
        // Test
        const config = {
            projectRoot: testProjectDir,
            outputDir: "dist",
            dockerize: false,
            sourceMap: true,
        };
        const result = await builder.build(config);
        // Assertions
        (0, globals_1.expect)(result.success).toBe(false);
        (0, globals_1.expect)(result.steps.get("validate")?.status).toBe("failed");
    });
    (0, globals_1.it)("should skip Docker build when dockerize is false", async () => {
        // Setup
        const testProjectDir = path.join(TEST_DIR, "no-docker-project");
        fs.mkdirSync(testProjectDir, { recursive: true });
        fs.mkdirSync(path.join(testProjectDir, "src"), { recursive: true });
        fs.writeFileSync(path.join(testProjectDir, "package.json"), JSON.stringify({ name: "test-app", version: "1.0.0" }));
        fs.writeFileSync(path.join(testProjectDir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2020" } }));
        // Test with dockerize=false
        const config = {
            projectRoot: testProjectDir,
            outputDir: "dist",
            dockerize: false,
            sourceMap: true,
        };
        const result = await builder.build(config);
        // Assertions
        (0, globals_1.expect)(result.steps.get("docker")?.status).toBe("skipped");
    });
});
(0, globals_1.describe)("EnvManager", () => {
    let envManager;
    (0, globals_1.beforeEach)(() => {
        envManager = new env_manager_1.EnvManager();
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, { recursive: true });
        }
    });
    (0, globals_1.afterEach)(() => {
        // Cleanup
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true });
        }
    });
    (0, globals_1.it)("should validate required environment variables", () => {
        const validConfig = {
            DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
            JWT_SECRET: "this-is-a-very-long-secret-key-12345",
            API_PORT: 3000,
        };
        const result = envManager.validate(validConfig, "api");
        (0, globals_1.expect)(result.valid).toBe(true);
        (0, globals_1.expect)(result.errors.length).toBe(0);
    });
    (0, globals_1.it)("should reject missing required variables", () => {
        const invalidConfig = {
            // Missing DATABASE_URL and JWT_SECRET
            API_PORT: 3000,
        };
        const result = envManager.validate(invalidConfig, "api");
        (0, globals_1.expect)(result.valid).toBe(false);
        (0, globals_1.expect)(result.errors.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)("should generate .env file correctly", () => {
        const envPath = path.join(TEST_DIR, ".env");
        const config = {
            DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
            JWT_SECRET: "secret-key",
            API_PORT: 3000,
        };
        envManager.generateEnvFile(config, envPath);
        (0, globals_1.expect)(fs.existsSync(envPath)).toBe(true);
        const content = fs.readFileSync(envPath, { encoding: "utf-8" });
        (0, globals_1.expect)(content).toContain("DATABASE_URL=");
    });
    (0, globals_1.it)("should read .env file correctly", () => {
        const envPath = path.join(TEST_DIR, ".env.read");
        const originalContent = `DATABASE_URL=postgresql://user:pass@localhost:5432/app
JWT_SECRET=test-secret
API_PORT=3000
`;
        fs.writeFileSync(envPath, originalContent, { encoding: "utf-8" });
        const config = envManager.readEnvFile(envPath);
        (0, globals_1.expect)(config.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/app");
        (0, globals_1.expect)(config.JWT_SECRET).toBe("test-secret");
        (0, globals_1.expect)(config.API_PORT).toBe(3000);
    });
});
(0, globals_1.describe)("DockerfileGenerator", () => {
    let generator;
    (0, globals_1.beforeEach)(() => {
        generator = new dockerfile_generator_1.DockerfileGenerator();
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, { recursive: true });
        }
    });
    (0, globals_1.afterEach)(() => {
        // Cleanup
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true });
        }
    });
    (0, globals_1.it)("should generate API Dockerfile", () => {
        const projectDir = path.join(TEST_DIR, "api-project");
        fs.mkdirSync(projectDir, { recursive: true });
        generator.generateApiDockerfile(projectDir);
        const dockerfilePath = path.join(projectDir, "Dockerfile");
        (0, globals_1.expect)(fs.existsSync(dockerfilePath)).toBe(true);
        const content = fs.readFileSync(dockerfilePath, { encoding: "utf-8" });
        (0, globals_1.expect)(content).toContain("FROM node:18-alpine");
    });
    (0, globals_1.it)("should generate .dockerignore", () => {
        const projectDir = path.join(TEST_DIR, "dockerignore-project");
        fs.mkdirSync(projectDir, { recursive: true });
        generator.generateDockerignore(projectDir);
        const dockerignorePath = path.join(projectDir, ".dockerignore");
        (0, globals_1.expect)(fs.existsSync(dockerignorePath)).toBe(true);
        const content = fs.readFileSync(dockerignorePath, { encoding: "utf-8" });
        (0, globals_1.expect)(content).toContain("node_modules");
    });
});
//# sourceMappingURL=deployer.test.js.map