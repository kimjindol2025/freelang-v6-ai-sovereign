"use strict";
/**
 * CodeGen 모듈 테스트
 * StructureGenerator 단위 테스트
 */
Object.defineProperty(exports, "__esModule", { value: true });
const structure_generator_1 = require("../src/generator/structure-generator");
describe('CodeGen Module Tests', () => {
    let generator;
    beforeAll(() => {
        generator = new structure_generator_1.StructureGenerator();
    });
    /**
     * 테스트 1: API 프로젝트 구조 생성
     */
    test('API 프로젝트 구조 생성', async () => {
        const request = {
            intent: 'create_api',
            project_type: 'api',
            project_name: 'user-api',
            features: [{ name: 'user_management', operations: ['create', 'read', 'update', 'delete'] }],
            tech_stack: { backend: 'express', database: 'postgresql' },
            requirements: { auth: true, testing: true },
        };
        const structure = await generator.generate(request);
        expect(structure).toBeDefined();
        expect(structure.name).toBe('user-api');
        expect(structure.root).toContain('user-api');
        expect(structure.folders).toContain('src');
        expect(structure.folders).toContain('src/routes');
        expect(structure.folders).toContain('src/models');
        expect(structure.folders).toContain('src/middleware');
        expect(structure.folders).toContain('src/auth');
        console.log('✅ API 프로젝트 구조 생성 완료');
    });
    /**
     * 테스트 2: Web 프로젝트 구조 생성
     */
    test('Web 프로젝트 구조 생성', async () => {
        const request = {
            intent: 'create_web',
            project_type: 'web',
            project_name: 'react-dashboard',
            features: [{ name: 'dashboard', operations: ['display', 'update'] }],
            tech_stack: { frontend: 'react' },
            requirements: { testing: true },
        };
        const structure = await generator.generate(request);
        expect(structure).toBeDefined();
        expect(structure.name).toBe('react-dashboard');
        expect(structure.folders).toContain('src/components');
        expect(structure.folders).toContain('src/pages');
        expect(structure.folders).toContain('src/hooks');
        expect(structure.folders).toContain('src/styles');
        console.log('✅ Web 프로젝트 구조 생성 완료');
    });
    /**
     * 테스트 3: CLI 프로젝트 구조 생성
     */
    test('CLI 프로젝트 구조 생성', async () => {
        const request = {
            intent: 'create_cli',
            project_type: 'cli',
            project_name: 'file-manager-cli',
            features: [{ name: 'file_operations', operations: ['list', 'copy', 'delete'] }],
            tech_stack: {},
            requirements: { testing: true },
        };
        const structure = await generator.generate(request);
        expect(structure).toBeDefined();
        expect(structure.name).toBe('file-manager-cli');
        expect(structure.folders).toContain('src/commands');
        expect(structure.folders).toContain('src/lib');
        expect(structure.folders).toContain('bin');
        console.log('✅ CLI 프로젝트 구조 생성 완료');
    });
    /**
     * 테스트 4: 기본 폴더 포함 검증
     */
    test('기본 폴더 포함 검증', async () => {
        const request = {
            intent: 'create_api',
            project_type: 'api',
            project_name: 'test-project',
            features: [],
            tech_stack: {},
            requirements: {},
        };
        const structure = await generator.generate(request);
        // 모든 프로젝트 타입에 포함되어야 할 기본 폴더
        expect(structure.folders).toContain('src');
        expect(structure.folders).toContain('tests');
        expect(structure.folders).toContain('docs');
        expect(structure.folders).toContain('database');
        expect(structure.folders).toContain('.github/workflows');
        console.log('✅ 기본 폴더 포함 검증 완료');
    });
    /**
     * 테스트 5: 프로젝트 이름 검증
     */
    test('프로젝트 이름 반영', async () => {
        const projectNames = ['my-api', 'awesome-web', 'super-cli'];
        for (const name of projectNames) {
            const request = {
                intent: 'create_api',
                project_type: 'api',
                project_name: name,
                features: [],
                tech_stack: {},
                requirements: {},
            };
            const structure = await generator.generate(request);
            expect(structure.name).toBe(name);
            expect(structure.root).toContain(name);
        }
        console.log('✅ 프로젝트 이름 검증 완료');
    });
    /**
     * 테스트 6: 파일 맵 초기화
     */
    test('파일 맵 초기화', async () => {
        const request = {
            intent: 'create_api',
            project_type: 'api',
            project_name: 'test-api',
            features: [],
            tech_stack: {},
            requirements: {},
        };
        const structure = await generator.generate(request);
        expect(structure.files).toBeDefined();
        expect(structure.files instanceof Map).toBe(true);
        console.log('✅ 파일 맵 초기화 완료');
    });
    /**
     * 테스트 7: 결과 구조 검증
     */
    test('ProjectStructure 결과 구조 검증', async () => {
        const request = {
            intent: 'create_api',
            project_type: 'api',
            project_name: 'struct-test',
            features: [{ name: 'test', operations: [] }],
            tech_stack: { db: 'postgres' },
            requirements: { auth: true },
        };
        const structure = await generator.generate(request);
        // 필수 필드 검증
        expect(structure).toHaveProperty('name');
        expect(structure).toHaveProperty('root');
        expect(structure).toHaveProperty('folders');
        expect(structure).toHaveProperty('files');
        // 값 타입 검증
        expect(typeof structure.name).toBe('string');
        expect(typeof structure.root).toBe('string');
        expect(Array.isArray(structure.folders)).toBe(true);
        expect(structure.files instanceof Map).toBe(true);
        console.log('✅ 결과 구조 검증 완료');
    });
    /**
     * 테스트 8: 폴더 중복 없음
     */
    test('폴더 목록에 중복 없음', async () => {
        const request = {
            intent: 'create_api',
            project_type: 'api',
            project_name: 'test-api',
            features: [],
            tech_stack: {},
            requirements: {},
        };
        const structure = await generator.generate(request);
        const folderSet = new Set(structure.folders);
        expect(folderSet.size).toBe(structure.folders.length);
        console.log('✅ 폴더 중복 확인 완료');
    });
    /**
     * 테스트 9: 다양한 프로젝트 타입 모두 지원
     */
    test('모든 프로젝트 타입 지원', async () => {
        const types = ['api', 'web', 'cli', 'service'];
        for (const type of types) {
            const request = {
                intent: 'create_api',
                project_type: type,
                project_name: `project-${type}`,
                features: [],
                tech_stack: {},
                requirements: {},
            };
            const structure = await generator.generate(request);
            expect(structure).toBeDefined();
            expect(structure.folders.length).toBeGreaterThan(0);
        }
        console.log('✅ 모든 프로젝트 타입 지원 확인 완료');
    });
});
//# sourceMappingURL=codegen.test.js.map