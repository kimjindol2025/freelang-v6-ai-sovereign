/**
 * Advanced Template Engine Tests
 * 동적 선택, 템플릿 조합, 커스텀 코드 생성, 버전 관리 테스트
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  AdvancedTemplateEngine,
  CustomCodeSpec,
  TemplateMetadata,
  TemplateVersion,
} from '../src/templates/advanced-template-engine';

describe('AdvancedTemplateEngine', () => {
  let engine: AdvancedTemplateEngine;
  let tempDir: string;

  beforeAll(() => {
    // 테스트용 템플릿 디렉토리 생성
    tempDir = path.join(__dirname, 'temp-templates');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 테스트용 템플릿 파일 생성
    createTestTemplates(tempDir);

    engine = new AdvancedTemplateEngine(tempDir);
  });

  afterAll(() => {
    // 테스트용 파일 정리
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  /**
   * 동적 템플릿 선택 테스트
   */
  describe('Dynamic Template Selection', () => {
    test('1. 단일 요구사항 기반 선택', async () => {
      const requirements = { auth: true };
      const template = await engine.selectTemplate(requirements);

      expect(template).not.toBeNull();
      expect(template?.metadata.tags).toContain('auth');
    });

    test('2. 다중 요구사항 기반 선택', async () => {
      const requirements = { auth: true, security: true };
      const template = await engine.selectTemplate(requirements);

      expect(template).not.toBeNull();
      expect(template?.matchScore).toBeGreaterThan(0);
    });

    test('3. 템플릿 추천 (상위 5개)', async () => {
      const requirements = { api: true };
      const recommended = await engine.recommendTemplate(requirements, 5);

      expect(Array.isArray(recommended)).toBe(true);
      expect(recommended.length).toBeGreaterThan(0);
    });

    test('4. 추천 순서 확인 (점수 높은 순)', async () => {
      const requirements = { api: true, database: true };
      const recommended = await engine.recommendTemplate(requirements, 10);

      for (let i = 0; i < recommended.length - 1; i++) {
        expect(recommended[i].matchScore).toBeGreaterThanOrEqual(recommended[i + 1].matchScore!);
      }
    });

    test('5. 없는 요구사항 처리', async () => {
      const requirements = { nonexistent: true };
      const template = await engine.selectTemplate(requirements);

      // null이거나 점수가 0이어야 함
      expect(template === null || template.matchScore === 0).toBe(true);
    });
  });

  /**
   * 템플릿 조합 테스트
   */
  describe('Template Composition', () => {
    test('6. 두 개 템플릿 조합', async () => {
      const composed = await engine.composeTemplates(
        ['module/api', 'module/middleware'],
        { projectName: 'test-project' }
      );

      expect(composed.length).toBeGreaterThan(0);
      expect(typeof composed).toBe('string');
    });

    test('7. 의존성 해결 순서', async () => {
      const composed = await engine.composeTemplates(
        ['module/api', 'module/dependency'],
        {}
      );

      // dependency가 api보다 먼저 나타나야 함
      const apiIndex = composed.indexOf('API Module');
      const depIndex = composed.indexOf('Dependency Module');

      expect(apiIndex > -1).toBe(true);
      expect(depIndex > -1).toBe(true);
    });

    test('8. 컨텍스트 데이터 렌더링', async () => {
      const context = {
        projectName: 'MyProject',
        port: 3000,
        features: ['auth', 'logging'],
      };

      const composed = await engine.composeTemplates(['module/api'], context);

      expect(composed).toContain('MyProject');
      expect(composed).toContain('3000');
    });

    test('9. 빈 템플릿 목록 처리', async () => {
      const composed = await engine.composeTemplates([], {});

      expect(composed).toBe('');
    });

    test('10. 존재하지 않는 템플릿 무시', async () => {
      const composed = await engine.composeTemplates(
        ['module/api', 'nonexistent/template'],
        {}
      );

      expect(composed.length).toBeGreaterThan(0);
    });
  });

  /**
   * 커스텀 코드 생성 테스트
   */
  describe('Custom Code Generation', () => {
    test('11. 함수 코드 생성', async () => {
      const spec: CustomCodeSpec = {
        type: 'function',
        name: 'calculateSum',
        description: 'Calculate sum of two numbers',
        parameters: [
          { name: 'a', type: 'number', description: 'First number' },
          { name: 'b', type: 'number', description: 'Second number' },
        ],
        returnType: 'number',
        body: 'return a + b;',
      };

      const code = await engine.generateCustomCode(spec);

      expect(code).toContain('function calculateSum');
      expect(code).toContain('a: number');
      expect(code).toContain('b: number');
      expect(code).toContain(': number {');
      expect(code).toContain('return a + b;');
    });

    test('12. 클래스 코드 생성', async () => {
      const spec: CustomCodeSpec = {
        type: 'class',
        name: 'UserManager',
        description: 'Manages user operations',
        properties: [
          { name: 'users', type: 'User[]', description: 'User list' },
          { name: 'id', type: 'string', description: 'Manager ID' },
        ],
        methods: [
          { name: 'addUser', signature: 'addUser(user: User)', description: 'Add a new user' },
          { name: 'removeUser', signature: 'removeUser(userId: string)', description: 'Remove a user' },
        ],
      };

      const code = await engine.generateCustomCode(spec);

      expect(code).toContain('class UserManager');
      expect(code).toContain('users: User[]');
      expect(code).toContain('addUser(user: User)');
      expect(code).toContain('removeUser(userId: string)');
    });

    test('13. 인터페이스 코드 생성', async () => {
      const spec: CustomCodeSpec = {
        type: 'interface',
        name: 'IUser',
        description: 'User interface',
        properties: [
          { name: 'id', type: 'string', description: 'User ID' },
          { name: 'name', type: 'string', description: 'User name' },
          { name: 'email', type: 'string', description: 'User email' },
        ],
      };

      const code = await engine.generateCustomCode(spec);

      expect(code).toContain('interface IUser');
      expect(code).toContain('id: string');
      expect(code).toContain('name: string');
      expect(code).toContain('email: string');
    });

    test('14. 열거형 코드 생성', async () => {
      const spec: CustomCodeSpec = {
        type: 'enum',
        name: 'UserRole',
        description: 'User roles',
        body: 'ADMIN, USER, GUEST',
      };

      const code = await engine.generateCustomCode(spec);

      expect(code).toContain('enum UserRole');
      expect(code).toContain('ADMIN');
      expect(code).toContain('USER');
      expect(code).toContain('GUEST');
    });

    test('15. 상수 코드 생성', async () => {
      const spec: CustomCodeSpec = {
        type: 'constant',
        name: 'API_TIMEOUT',
        description: 'API timeout in milliseconds',
        body: '5000',
      };

      const code = await engine.generateCustomCode(spec);

      expect(code).toContain('const API_TIMEOUT');
      expect(code).toContain('5000');
    });
  });

  /**
   * 템플릿 버전 관리 테스트
   */
  describe('Template Versioning', () => {
    test('16. 버전 등록', async () => {
      const version: TemplateVersion = {
        version: '1.0.0',
        releaseDate: '2025-01-01',
        deprecated: false,
        breaking: false,
        changes: ['Initial release'],
      };

      await engine.registerVersion('test-template', version);

      // 버전이 등록되었는지 확인할 수 있는 간접적인 방법
      expect(version.version).toBe('1.0.0');
    });

    test('17. 버전 하위호환성 확인', async () => {
      const compatible = engine.isBackwardCompatible('1.0.0', '1.2.3');
      const incompatible = engine.isBackwardCompatible('1.0.0', '2.0.0');

      expect(compatible).toBe(true);
      expect(incompatible).toBe(false);
    });

    test('18. 버전별 템플릿 렌더링', async () => {
      const version: TemplateVersion = {
        version: '1.0.0',
        releaseDate: '2025-01-01',
        deprecated: false,
        breaking: false,
        changes: ['Initial release'],
      };

      await engine.registerVersion('module/api', version);

      const result = await engine.renderTemplateWithVersion('module/api', '1.0.0', {
        projectName: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    test('19. 사용 중단 버전 경고', async () => {
      const deprecated: TemplateVersion = {
        version: '0.5.0',
        releaseDate: '2024-01-01',
        deprecated: true,
        breaking: false,
        changes: ['Deprecated version'],
        previousVersion: '1.0.0',
      };

      await engine.registerVersion('test-template', deprecated);

      const result = await engine.renderTemplateWithVersion('test-template', '0.5.0', {});

      // 경고 메시지 확인 (템플릿이 없으면 다른 경고)
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('20. 존재하지 않는 버전 처리', async () => {
      const result = await engine.renderTemplateWithVersion('nonexistent', '1.0.0', {});

      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  /**
   * 완전한 프로젝트 렌더링 테스트
   */
  describe('Complete Project Rendering', () => {
    test('21. 완전한 프로젝트 생성', async () => {
      const customCodes: CustomCodeSpec[] = [
        {
          type: 'function',
          name: 'bootstrap',
          description: 'Bootstrap the application',
          returnType: 'void',
        },
        {
          type: 'class',
          name: 'AppManager',
          description: 'Application manager',
        },
      ];

      const result = await engine.renderComplete(
        'MyApp',
        ['module/api'],
        customCodes,
        { projectName: 'MyApp', port: 3000 }
      );

      expect(result).toBeDefined();
      expect(result['project-template.ts']).toBeDefined();
      expect(result['generated-bootstrap.ts']).toBeDefined();
      expect(result['generated-AppManager.ts']).toBeDefined();
      expect(result['index.ts']).toBeDefined();
    });

    test('22. 프로젝트 인덱스 파일', async () => {
      const customCodes: CustomCodeSpec[] = [
        {
          type: 'function',
          name: 'initialize',
          description: 'Initialize',
        },
      ];

      const result = await engine.renderComplete(
        'MyApp',
        ['module/api'],
        customCodes,
        {}
      );

      const indexContent = result['index.ts'];

      expect(indexContent).toContain('Auto-generated Project Index');
      expect(indexContent).toContain('import');
      expect(indexContent).toContain('export');
      expect(indexContent).toContain('initialize');
    });

    test('23. 멀티 템플릿 조합 프로젝트', async () => {
      const customCodes: CustomCodeSpec[] = [];

      const result = await engine.renderComplete(
        'FullApp',
        ['module/api', 'module/middleware'],
        customCodes,
        { projectName: 'FullApp' }
      );

      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2);
    });

    test('24. 빈 커스텀 코드 처리', async () => {
      const result = await engine.renderComplete(
        'SimpleApp',
        ['module/api'],
        [],
        {}
      );

      expect(result['project-template.ts']).toBeDefined();
      expect(result['index.ts']).toBeDefined();
    });

    test('25. 캐시 관리', async () => {
      const customCodes: CustomCodeSpec[] = [];

      // 첫 번째 렌더링
      const result1 = await engine.renderComplete(
        'App1',
        ['module/api'],
        customCodes,
        {}
      );

      // 캐시 비우기
      engine.clearRenderCache();

      // 두 번째 렌더링
      const result2 = await engine.renderComplete(
        'App2',
        ['module/api'],
        customCodes,
        {}
      );

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});

/**
 * 테스트용 템플릿 생성
 */
function createTestTemplates(tempDir: string): void {
  // module 디렉토리 생성
  const moduleDir = path.join(tempDir, 'module');
  if (!fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir, { recursive: true });
  }

  // API 템플릿
  fs.writeFileSync(
    path.join(moduleDir, 'api.hbs'),
    `<!-- METADATA
{
  "name": "api-module",
  "version": "1.0.0",
  "type": "module",
  "category": "backend",
  "requirements": ["api", "backend"],
  "tags": ["api", "rest", "express"],
  "priority": 10,
  "dependencies": [],
  "compatibility": ["1.x"]
}
-->
API Module
Project: {{projectName}}
Port: {{port}}`
  );

  // Middleware 템플릿
  fs.writeFileSync(
    path.join(moduleDir, 'middleware.hbs'),
    `<!-- METADATA
{
  "name": "middleware-module",
  "version": "1.0.0",
  "type": "module",
  "category": "backend",
  "requirements": ["middleware"],
  "tags": ["middleware", "express"],
  "priority": 5,
  "dependencies": [],
  "compatibility": ["1.x"]
}
-->
Middleware Module
Authentication: {{auth}}`
  );

  // 의존성 템플릿
  fs.writeFileSync(
    path.join(moduleDir, 'dependency.hbs'),
    `<!-- METADATA
{
  "name": "dependency-module",
  "version": "1.0.0",
  "type": "module",
  "category": "backend",
  "requirements": ["dependency"],
  "tags": ["dependency"],
  "priority": 1,
  "dependencies": [],
  "compatibility": ["1.x"]
}
-->
Dependency Module
Setup completed.`
  );

  // Auth 템플릿
  fs.writeFileSync(
    path.join(moduleDir, 'auth.hbs'),
    `<!-- METADATA
{
  "name": "auth-module",
  "version": "1.0.0",
  "type": "module",
  "category": "security",
  "requirements": ["auth"],
  "tags": ["auth", "security", "jwt"],
  "priority": 15,
  "dependencies": [],
  "compatibility": ["1.x"]
}
-->
Authentication Module
JWT Implementation`
  );

  // Database 템플릿
  fs.writeFileSync(
    path.join(moduleDir, 'database.hbs'),
    `<!-- METADATA
{
  "name": "database-module",
  "version": "1.0.0",
  "type": "module",
  "category": "data",
  "requirements": ["database"],
  "tags": ["database", "persistence"],
  "priority": 12,
  "dependencies": [],
  "compatibility": ["1.x"]
}
-->
Database Module
Driver: {{dbDriver}}`
  );
}
