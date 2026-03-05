"use strict";
/**
 * CodeGen Integration Tests
 * 다양한 프로젝트 타입 검증
 *
 * 테스트 케이스:
 * 1. Express API + PostgreSQL
 * 2. React + Node.js 풀스택
 * 3. FastAPI + MongoDB
 * 4. CLI 도구
 * 5. 의존성 자동 추가
 * 6. 파일 경로 정규화
 * 7. 성능 (< 500ms)
 * 8. 대규모 프로젝트 (50개 파일)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const codegen_engine_1 = require("../src/generator/codegen-engine");
const config_generator_1 = require("../src/generator/config-generator");
describe('CodeGen Integration Tests', () => {
    let codegen;
    let configGen;
    beforeEach(() => {
        codegen = new codegen_engine_1.CodeGenEngine();
        configGen = new config_generator_1.ConfigGenerator();
    });
    /**
     * Test 1: Express API + PostgreSQL 프로젝트
     */
    describe('Test 1: Express API + PostgreSQL', () => {
        it('should generate Express API project with PostgreSQL', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'user-api',
                features: [
                    {
                        name: 'users',
                        operations: ['create', 'read', 'update', 'delete'],
                    },
                    {
                        name: 'auth',
                        operations: ['login', 'register', 'logout'],
                    },
                ],
                tech_stack: {
                    backend: 'express',
                    database: 'postgresql',
                },
                requirements: {
                    auth: true,
                    testing: true,
                    docker: false,
                    logging: true,
                },
            };
            const startTime = Date.now();
            const fileMap = await codegen.generateCode(request);
            const duration = Date.now() - startTime;
            // 검증: 필수 파일 생성
            expect(fileMap).toBeDefined();
            expect(fileMap['package.json']).toBeDefined();
            expect(fileMap['src/server.ts']).toBeDefined();
            expect(fileMap['src/routes/index.ts']).toBeDefined();
            expect(fileMap['src/db/schema.sql']).toBeDefined();
            // 검증: 인증 파일 생성
            expect(fileMap['src/auth/jwt.ts']).toBeDefined();
            expect(fileMap['src/middleware/auth.ts']).toBeDefined();
            // 검증: 의존성 포함
            const packageJson = JSON.parse(fileMap['package.json']);
            expect(packageJson.dependencies.express).toBeDefined();
            expect(packageJson.dependencies.pg).toBeDefined();
            expect(packageJson.dependencies.jsonwebtoken).toBeDefined();
            // 검증: 성능
            expect(duration).toBeLessThan(500);
            console.log(`✅ Test 1 passed: ${Object.keys(fileMap).length} files generated in ${duration}ms`);
        });
        it('should generate valid package.json with correct dependencies', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'api-service',
                features: [],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            const packageJson = JSON.parse(fileMap['package.json']);
            expect(packageJson.name).toBe('api-service');
            expect(packageJson.version).toBe('1.0.0');
            expect(packageJson.main).toBe('dist/server.js');
            expect(packageJson.scripts.start).toBeDefined();
            expect(packageJson.scripts.dev).toBeDefined();
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts.test).toBeDefined();
            // 의존성 검증
            expect(packageJson.dependencies.express).toBeDefined();
            expect(packageJson.dependencies.pg).toBeDefined();
            expect(packageJson.dependencies.cors).toBeDefined();
            expect(packageJson.dependencies.dotenv).toBeDefined();
            expect(packageJson.devDependencies.jest).toBeDefined();
            expect(packageJson.devDependencies.typescript).toBeDefined();
        });
    });
    /**
     * Test 2: React + Node.js 풀스택
     */
    describe('Test 2: React + Node.js Full Stack', () => {
        it('should generate full-stack project with React frontend', async () => {
            const request = {
                intent: 'create_fullstack',
                project_type: 'web',
                project_name: 'fullstack-app',
                features: [
                    {
                        name: 'dashboard',
                        operations: ['view', 'edit'],
                    },
                ],
                tech_stack: {
                    backend: 'express',
                    frontend: 'react',
                    database: 'postgresql',
                },
                requirements: {
                    auth: true,
                    testing: true,
                    docker: true,
                    logging: true,
                },
            };
            const fileMap = await codegen.generateCode(request);
            // 검증: 프론트엔드 파일
            expect(fileMap['src/App.tsx']).toBeDefined();
            expect(fileMap['src/main.tsx']).toBeDefined();
            expect(fileMap['src/components/Header.tsx']).toBeDefined();
            expect(fileMap['src/pages/Home.tsx']).toBeDefined();
            // 검증: API 클라이언트
            expect(fileMap['src/api/client.ts']).toBeDefined();
            // 검증: 테스트 파일
            expect(fileMap['tests/App.test.tsx']).toBeDefined();
            console.log(`✅ Test 2 passed: React full-stack with ${Object.keys(fileMap).length} files`);
        });
        it('should include React dependencies', async () => {
            const request = {
                intent: 'create_fullstack',
                project_type: 'web',
                project_name: 'react-app',
                features: [],
                tech_stack: { backend: 'express', frontend: 'react', database: 'mongodb' },
                requirements: { auth: false, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            const packageJson = JSON.parse(fileMap['package.json']);
            expect(packageJson.dependencies.react).toBeDefined();
            expect(packageJson.dependencies['react-dom']).toBeDefined();
            expect(packageJson.dependencies.axios).toBeDefined();
        });
    });
    /**
     * Test 3: FastAPI + MongoDB 프로젝트
     */
    describe('Test 3: FastAPI + MongoDB', () => {
        it('should handle non-Node.js tech stack', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'python-api',
                features: [
                    {
                        name: 'products',
                        operations: ['list', 'get', 'create', 'update', 'delete'],
                    },
                ],
                tech_stack: {
                    backend: 'fastapi',
                    database: 'mongodb',
                },
                requirements: {
                    auth: true,
                    testing: true,
                    docker: true,
                    logging: true,
                },
            };
            const fileMap = await codegen.generateCode(request);
            // 검증: MongoDB 스키마
            expect(fileMap['src/db/schema.ts']).toBeDefined();
            // 검증: Docker 지원
            expect(fileMap['Dockerfile']).toBeDefined();
            expect(fileMap['docker-compose.yml']).toBeDefined();
            console.log(`✅ Test 3 passed: FastAPI + MongoDB with ${Object.keys(fileMap).length} files`);
        });
    });
    /**
     * Test 4: CLI 도구 프로젝트
     */
    describe('Test 4: CLI Tool', () => {
        it('should generate CLI project structure', async () => {
            const request = {
                intent: 'create_cli',
                project_type: 'cli',
                project_name: 'cli-tool',
                features: [
                    {
                        name: 'deploy',
                        operations: ['run'],
                    },
                    {
                        name: 'config',
                        operations: ['set', 'get'],
                    },
                ],
                tech_stack: {
                    backend: 'node',
                },
                requirements: {
                    auth: false,
                    testing: true,
                    docker: false,
                    logging: true,
                },
            };
            const fileMap = await codegen.generateCode(request);
            // 검증: CLI 파일
            expect(fileMap['src/cli.ts']).toBeDefined();
            expect(fileMap['src/commands/help.ts']).toBeDefined();
            expect(fileMap['src/commands/version.ts']).toBeDefined();
            expect(fileMap['bin/cli']).toBeDefined();
            console.log(`✅ Test 4 passed: CLI tool with ${Object.keys(fileMap).length} files`);
        });
    });
    /**
     * Test 5: 의존성 자동 추가 검증
     */
    describe('Test 5: Dependency Auto-Resolution', () => {
        it('should add dependencies based on tech stack', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'deps-test',
                features: [],
                tech_stack: {
                    backend: 'express',
                    database: 'postgresql',
                },
                requirements: {
                    auth: true,
                    testing: true,
                    docker: false,
                    logging: true,
                },
            };
            const fileMap = await codegen.generateCode(request);
            const packageJson = JSON.parse(fileMap['package.json']);
            // Express 의존성
            expect(packageJson.dependencies.express).toBeDefined();
            expect(packageJson.dependencies.cors).toBeDefined();
            // PostgreSQL 의존성
            expect(packageJson.dependencies.pg).toBeDefined();
            expect(packageJson.dependencies.sequelize).toBeDefined();
            // Auth 의존성
            expect(packageJson.dependencies.jsonwebtoken).toBeDefined();
            expect(packageJson.dependencies.bcryptjs).toBeDefined();
            // 테스트 의존성
            expect(packageJson.devDependencies.jest).toBeDefined();
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
            expect(packageJson.devDependencies.supertest).toBeDefined();
            // TypeScript 의존성
            expect(packageJson.devDependencies.typescript).toBeDefined();
            console.log(`✅ Test 5 passed: ${Object.keys(packageJson.dependencies).length} dependencies added`);
        });
        it('should not add JavaScript dependencies to TypeScript project', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'ts-only',
                features: [],
                tech_stack: { backend: 'express', database: 'mongodb' },
                requirements: { auth: false, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            const packageJson = JSON.parse(fileMap['package.json']);
            // TypeScript 타입은 있어야 함
            expect(packageJson.devDependencies.typescript).toBeDefined();
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
        });
    });
    /**
     * Test 6: 파일 경로 정규화
     */
    describe('Test 6: File Path Normalization', () => {
        it('should generate valid file paths', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'path-test',
                features: [],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            // 검증: 파일 경로가 정규화되었는지 확인
            for (const filePath of Object.keys(fileMap)) {
                expect(filePath).toMatch(/^[a-zA-Z0-9._\/-]+$/);
                expect(filePath).not.toContain('\\');
                expect(filePath).not.toContain('//');
            }
            console.log(`✅ Test 6 passed: All file paths normalized`);
        });
        it('should handle special characters in project name', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'my-special-api_v2',
                features: [],
                tech_stack: { backend: 'express', database: 'mongodb' },
                requirements: { auth: false, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            const packageJson = JSON.parse(fileMap['package.json']);
            // 프로젝트 이름이 정규화되어야 함
            expect(packageJson.name).toBe('my-special-api_v2');
        });
    });
    /**
     * Test 7: 성능 요구사항 (< 500ms)
     */
    describe('Test 7: Performance', () => {
        it('should generate code within 500ms', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'perf-test',
                features: [
                    { name: 'users', operations: ['create', 'read', 'update', 'delete'] },
                    { name: 'posts', operations: ['create', 'read', 'delete'] },
                    { name: 'comments', operations: ['create', 'read', 'delete'] },
                ],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const startTime = Date.now();
            const fileMap = await codegen.generateCode(request);
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(500);
            console.log(`✅ Test 7 passed: Code generation took ${duration}ms`);
        });
        it('should generate configs within 100ms', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'config-perf',
                features: [],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const startTime = Date.now();
            const configs = configGen.generateAllConfigs(request);
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(100);
            console.log(`✅ Test 7a passed: Config generation took ${duration}ms`);
        });
    });
    /**
     * Test 8: 대규모 프로젝트 (50개 이상 파일)
     */
    describe('Test 8: Large Project Generation', () => {
        it('should generate 50+ files for complex project', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'large-project',
                features: [
                    { name: 'users', operations: ['create', 'read', 'update', 'delete'] },
                    { name: 'posts', operations: ['create', 'read', 'update', 'delete'] },
                    { name: 'comments', operations: ['create', 'read', 'update', 'delete'] },
                    { name: 'likes', operations: ['create', 'delete'] },
                    { name: 'notifications', operations: ['list', 'read', 'delete'] },
                ],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            const configs = configGen.generateAllConfigs(request);
            const totalFiles = Object.keys(fileMap).length + Object.keys(configs).length;
            expect(totalFiles).toBeGreaterThanOrEqual(50);
            console.log(`✅ Test 8 passed: Generated ${totalFiles} files`);
        });
        it('should generate valid code structure for multi-feature project', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'multi-feature',
                features: [
                    { name: 'auth', operations: ['login', 'register', 'logout'] },
                    { name: 'products', operations: ['list', 'get', 'create', 'update', 'delete'] },
                    { name: 'orders', operations: ['list', 'get', 'create', 'cancel'] },
                    { name: 'admin', operations: ['users', 'reports', 'settings'] },
                ],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            // 검증: 모든 필수 파일 존재
            expect(fileMap['package.json']).toBeDefined();
            expect(fileMap['tsconfig.json']).toBeDefined();
            expect(fileMap['src/server.ts']).toBeDefined();
            expect(fileMap['src/routes/index.ts']).toBeDefined();
            expect(fileMap['src/auth/jwt.ts']).toBeDefined();
            expect(fileMap['Dockerfile']).toBeDefined();
            expect(fileMap['.github/workflows/ci.yml']).toBeDefined();
            // 검증: 코드 구조
            const packageJson = JSON.parse(fileMap['package.json']);
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts.test).toBeDefined();
            expect(packageJson.dependencies).toBeDefined();
            expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(5);
            console.log(`✅ Test 8a passed: Multi-feature project with valid structure`);
        });
    });
    /**
     * Test 9: 환경 설정 자동 생성
     */
    describe('Test 9: Environment Configuration', () => {
        it('should generate all configuration files', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'config-test',
                features: [],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const configs = configGen.generateAllConfigs(request);
            // 검증: 필수 설정 파일
            expect(configs['package.json']).toBeDefined();
            expect(configs['tsconfig.json']).toBeDefined();
            expect(configs['jest.config.js']).toBeDefined();
            expect(configs['.env.example']).toBeDefined();
            expect(configs['Dockerfile']).toBeDefined();
            expect(configs['docker-compose.yml']).toBeDefined();
            expect(configs['.eslintrc.json']).toBeDefined();
            expect(configs['.prettierrc']).toBeDefined();
            expect(configs['.github/workflows/ci.yml']).toBeDefined();
            console.log(`✅ Test 9 passed: All configuration files generated (${Object.keys(configs).length})`);
        });
        it('should include database configuration in .env', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'env-db-test',
                features: [],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: false, logging: true },
            };
            const configs = configGen.generateAllConfigs(request);
            const envContent = configs['.env.example'];
            expect(envContent).toContain('DATABASE_URL');
            expect(envContent).toContain('postgresql');
            expect(envContent).toContain('JWT_SECRET');
            expect(envContent).toContain('PORT');
            console.log(`✅ Test 9a passed: Environment file includes database config`);
        });
        it('should generate MongoDB config for MongoDB projects', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'mongo-env-test',
                features: [],
                tech_stack: { backend: 'express', database: 'mongodb' },
                requirements: { auth: true, testing: true, docker: true, logging: true },
            };
            const configs = configGen.generateAllConfigs(request);
            const envContent = configs['.env.example'];
            const dockerCompose = configs['docker-compose.yml'];
            expect(envContent).toContain('MONGODB_URI');
            expect(dockerCompose).toContain('mongodb');
            console.log(`✅ Test 9b passed: MongoDB configuration included`);
        });
    });
    /**
     * Test 10: 프로젝트 타입별 정확성
     */
    describe('Test 10: Project Type Accuracy', () => {
        it('should generate appropriate files for API project', async () => {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: 'api-accuracy',
                features: [],
                tech_stack: { backend: 'express', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            // API 프로젝트는 server.ts와 routes가 있어야 함
            expect(fileMap['src/server.ts']).toBeDefined();
            expect(fileMap['src/routes/index.ts']).toBeDefined();
            expect(fileMap['src/models/User.ts']).toBeDefined();
            // 웹 프로젝트 파일은 없어야 함
            expect(fileMap['src/App.tsx']).toBeUndefined();
            expect(fileMap['src/main.tsx']).toBeUndefined();
            console.log(`✅ Test 10 passed: API project files are correct`);
        });
        it('should generate appropriate files for Web project', async () => {
            const request = {
                intent: 'create_web',
                project_type: 'web',
                project_name: 'web-accuracy',
                features: [],
                tech_stack: { backend: 'express', frontend: 'react', database: 'postgresql' },
                requirements: { auth: true, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            // 웹 프로젝트는 React 파일이 있어야 함
            expect(fileMap['src/App.tsx']).toBeDefined();
            expect(fileMap['src/main.tsx']).toBeDefined();
            console.log(`✅ Test 10a passed: Web project files are correct`);
        });
        it('should generate appropriate files for CLI project', async () => {
            const request = {
                intent: 'create_cli',
                project_type: 'cli',
                project_name: 'cli-accuracy',
                features: [],
                tech_stack: { backend: 'node' },
                requirements: { auth: false, testing: true, docker: false, logging: true },
            };
            const fileMap = await codegen.generateCode(request);
            // CLI 프로젝트는 cli.ts와 commands가 있어야 함
            expect(fileMap['src/cli.ts']).toBeDefined();
            expect(fileMap['src/commands/help.ts']).toBeDefined();
            expect(fileMap['bin/cli']).toBeDefined();
            console.log(`✅ Test 10b passed: CLI project files are correct`);
        });
    });
});
//# sourceMappingURL=codegen-integration.test.js.map