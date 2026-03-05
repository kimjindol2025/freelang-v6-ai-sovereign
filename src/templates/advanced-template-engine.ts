/**
 * Advanced Template Engine
 * Handlebars 템플릿 엔진 완전 자동화
 *
 * 주요 기능:
 * 1. Dynamic Template Selection - 요구사항 기반 자동 선택
 * 2. Template Composition - 여러 템플릿 조합
 * 3. Custom Code Generation - 사용자 정의 함수/클래스 생성
 * 4. Template Versioning - 버전 관리 및 하위호환성
 */

import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

/**
 * 템플릿 메타데이터 인터페이스
 */
export interface TemplateMetadata {
  name: string;
  version: string;
  type: 'component' | 'module' | 'service' | 'utility' | 'configuration';
  category: string;
  requirements: string[];
  tags: string[];
  priority: number;
  dependencies: string[];
  compatibility: string[];
}

/**
 * 템플릿 정보 인터페이스
 */
export interface TemplateInfo {
  metadata: TemplateMetadata;
  content: string;
  path: string;
  matchScore?: number;
}

/**
 * 컴포지션 규칙 인터페이스
 */
export interface CompositionRule {
  template1: string;
  template2: string;
  mergeStrategy: 'concat' | 'overlay' | 'inject' | 'replace';
  injectionPoint?: string;
  condition?: (context: any) => boolean;
}

/**
 * 커스텀 코드 스펙 인터페이스
 */
export interface CustomCodeSpec {
  type: 'function' | 'class' | 'interface' | 'enum' | 'constant';
  name: string;
  description: string;
  parameters?: Array<{ name: string; type: string; description: string }>;
  returnType?: string;
  properties?: Array<{ name: string; type: string; description: string }>;
  methods?: Array<{ name: string; signature: string; description: string }>;
  body?: string;
  examples?: string[];
}

/**
 * 템플릿 렌더링 결과 인터페이스
 */
export interface RenderResult {
  success: boolean;
  content: string;
  metadata: TemplateMetadata;
  warnings: string[];
  timestamp: number;
}

/**
 * 템플릿 버전 정보 인터페이스
 */
export interface TemplateVersion {
  version: string;
  releaseDate: string;
  deprecated: boolean;
  breaking: boolean;
  changes: string[];
  previousVersion?: string;
}

/**
 * Advanced Template Engine
 */
export class AdvancedTemplateEngine {
  private templatesDir: string;
  private templateRegistry: Map<string, TemplateInfo> = new Map();
  private versionRegistry: Map<string, TemplateVersion[]> = new Map();
  private compositionRules: CompositionRule[] = [];
  private renderCache: Map<string, RenderResult> = new Map();
  private customCodeTemplates: Map<string, string> = new Map();

  constructor(templatesDir: string = path.join(__dirname, '../../templates')) {
    this.templatesDir = templatesDir;
    this.registerAdvancedHelpers();
    this.loadTemplateRegistry();
  }

  /**
   * 고급 Handlebars 헬퍼 등록
   */
  private registerAdvancedHelpers(): void {
    // 문자열 조작 헬퍼
    Handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/[-_\s](.)/g, (_, c) => c.toUpperCase());
    });

    Handlebars.registerHelper('pascalCase', (str: string) => {
      const camelCased = str.replace(/[-_\s](.)/g, (_, c) => c.toUpperCase());
      return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
    });

    Handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    });

    Handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    });

    // 배열 헬퍼
    Handlebars.registerHelper('join', function (array: any[], separator: string) {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    });

    Handlebars.registerHelper('first', function (array: any[]) {
      return Array.isArray(array) ? array[0] : null;
    });

    Handlebars.registerHelper('last', function (array: any[]) {
      return Array.isArray(array) ? array[array.length - 1] : null;
    });

    Handlebars.registerHelper('slice', function (array: any[], start: number, end: number) {
      return Array.isArray(array) ? array.slice(start, end) : [];
    });

    // 객체 헬퍼
    Handlebars.registerHelper('keys', (obj: Record<string, any>) => {
      return Object.keys(obj);
    });

    Handlebars.registerHelper('values', (obj: Record<string, any>) => {
      return Object.values(obj);
    });

    Handlebars.registerHelper('entries', (obj: Record<string, any>) => {
      return Object.entries(obj).map(([key, value]) => ({ key, value }));
    });

    // 조건 헬퍼
    Handlebars.registerHelper('ifAny', function (this: any, ...args: any[]) {
      const options = args[args.length - 1];
      const values = args.slice(0, -1);
      return values.some(v => v) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifAll', function (this: any, ...args: any[]) {
      const options = args[args.length - 1];
      const values = args.slice(0, -1);
      return values.every(v => v) ? options.fn(this) : options.inverse(this);
    });

    // 수치 연산 헬퍼
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    Handlebars.registerHelper('divide', (a: number, b: number) => (b !== 0 ? a / b : 0));

    // 코드 생성 헬퍼
    Handlebars.registerHelper('indent', (str: string, spaces: number = 2) => {
      const indent = ' '.repeat(spaces);
      return str.split('\n').map(line => (line ? indent + line : line)).join('\n');
    });

    Handlebars.registerHelper('comment', function (this: any, lang: string, text: string, options: any) {
      const commentMarks: Record<string, { start: string; end: string; line: string }> = {
        js: { start: '/*', end: '*/', line: '//' },
        py: { start: '"""', end: '"""', line: '#' },
        java: { start: '/*', end: '*/', line: '//' },
        go: { start: '/*', end: '*/', line: '//' },
        sql: { start: '/*', end: '*/', line: '--' },
      };

      const marks = commentMarks[lang] || { start: '/*', end: '*/', line: '//' };
      return `${marks.line} ${text}`;
    });

    Handlebars.registerHelper('docstring', function (this: any, lang: string, description: string, options: any) {
      if (lang === 'py') {
        return `"""${description}"""`;
      } else if (lang === 'js' || lang === 'java') {
        return `/**\n * ${description}\n */`;
      }
      return description;
    });
  }

  /**
   * 템플릿 레지스트리 로드
   */
  private loadTemplateRegistry(): void {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        return;
      }

      const walkDir = (dir: string, prefix: string = '') => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walkDir(fullPath, prefix ? `${prefix}/${item}` : item);
          } else if (item.endsWith('.hbs')) {
            const templateName = path.basename(item, '.hbs');
            const templateKey = prefix ? `${prefix}/${templateName}` : templateName;

            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const metadata = this.extractMetadata(content, templateKey);

              this.templateRegistry.set(templateKey, {
                metadata,
                content,
                path: fullPath,
              });
            } catch (error) {
              console.warn(`Failed to load template ${templateKey}:`, error);
            }
          }
        }
      };

      walkDir(this.templatesDir);
    } catch (error) {
      console.warn('Failed to load template registry:', error);
    }
  }

  /**
   * 템플릿 메타데이터 추출
   */
  private extractMetadata(content: string, templateKey: string): TemplateMetadata {
    const metadataMatch = content.match(/^<!--\s*METADATA\s*([\s\S]*?)\s*-->/);

    if (metadataMatch) {
      try {
        return JSON.parse(metadataMatch[1]);
      } catch (error) {
        console.warn(`Failed to parse metadata for ${templateKey}`);
      }
    }

    // 기본 메타데이터
    return {
      name: templateKey,
      version: '1.0.0',
      type: 'module',
      category: 'general',
      requirements: [],
      tags: [],
      priority: 0,
      dependencies: [],
      compatibility: [],
    };
  }

  /**
   * 1. 동적 템플릿 선택 - 요구사항 기반
   */
  async selectTemplate(requirements: Record<string, boolean>): Promise<TemplateInfo | null> {
    let bestMatch: TemplateInfo | null = null;
    let highestScore = 0;

    for (const [, templateInfo] of this.templateRegistry) {
      const score = this.calculateMatchScore(templateInfo.metadata, requirements);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = templateInfo;
      }
    }

    if (bestMatch) {
      bestMatch.matchScore = highestScore;
    }

    return bestMatch;
  }

  /**
   * 요구사항 매칭 점수 계산
   */
  private calculateMatchScore(metadata: TemplateMetadata, requirements: Record<string, boolean>): number {
    let score = 0;
    const requirementKeys = Object.keys(requirements).filter(k => requirements[k]);

    for (const requirement of requirementKeys) {
      if (metadata.tags.includes(requirement)) {
        score += 2;
      }
      if (metadata.requirements.includes(requirement)) {
        score += 3;
      }
      if (metadata.category === requirement) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * 최적 템플릿 추천
   */
  async recommendTemplate(requirements: Record<string, boolean>, limit: number = 5): Promise<TemplateInfo[]> {
    const candidates: Array<{ template: TemplateInfo; score: number }> = [];

    for (const [, templateInfo] of this.templateRegistry) {
      const score = this.calculateMatchScore(templateInfo.metadata, requirements);
      if (score > 0) {
        candidates.push({ template: templateInfo, score });
      }
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(c => {
        c.template.matchScore = c.score;
        return c.template;
      });
  }

  /**
   * 2. 템플릿 조합 - 의존성 자동 해결
   */
  async composeTemplates(templateKeys: string[], context: Record<string, any> = {}): Promise<string> {
    const templateInfos: TemplateInfo[] = [];

    for (const key of templateKeys) {
      const template = this.templateRegistry.get(key);
      if (template) {
        templateInfos.push(template);
      }
    }

    // 의존성 순서로 정렬
    const sorted = this.resolveDependencies(templateInfos);

    // 템플릿 조합
    let composed = '';

    for (const template of sorted) {
      const compiled = Handlebars.compile(template.content);
      const rendered = compiled(context);

      if (composed) {
        composed += '\n\n';
      }
      composed += rendered;
    }

    return composed;
  }

  /**
   * 의존성 해결 및 정렬
   */
  private resolveDependencies(templates: TemplateInfo[]): TemplateInfo[] {
    const sorted: TemplateInfo[] = [];
    const resolved = new Set<string>();

    const resolve = (template: TemplateInfo) => {
      if (resolved.has(template.metadata.name)) {
        return;
      }

      for (const dep of template.metadata.dependencies) {
        const depTemplate = templates.find(t => t.metadata.name === dep);
        if (depTemplate) {
          resolve(depTemplate);
        }
      }

      sorted.push(template);
      resolved.add(template.metadata.name);
    };

    for (const template of templates) {
      resolve(template);
    }

    return sorted;
  }

  /**
   * 3. 커스텀 코드 생성
   */
  async generateCustomCode(spec: CustomCodeSpec): Promise<string> {
    const generator = this.selectCodeGenerator(spec.type);
    return generator(spec);
  }

  /**
   * 코드 생성기 선택
   */
  private selectCodeGenerator(type: string): (spec: CustomCodeSpec) => string {
    const generators: Record<string, (spec: CustomCodeSpec) => string> = {
      function: (spec) => this.generateFunction(spec),
      class: (spec) => this.generateClass(spec),
      interface: (spec) => this.generateInterface(spec),
      enum: (spec) => this.generateEnum(spec),
      constant: (spec) => this.generateConstant(spec),
    };

    return generators[type] || generators.function;
  }

  /**
   * 함수 코드 생성
   */
  private generateFunction(spec: CustomCodeSpec): string {
    const params = (spec.parameters || [])
      .map(p => `${p.name}: ${p.type}`)
      .join(', ');

    const returnType = spec.returnType || 'void';
    const body = spec.body || '// TODO: Implement';

    return `/**
 * ${spec.description}
 */
function ${spec.name}(${params}): ${returnType} {
  ${body}
}`;
  }

  /**
   * 클래스 코드 생성
   */
  private generateClass(spec: CustomCodeSpec): string {
    let code = `/**
 * ${spec.description}
 */
class ${spec.name} {
`;

    // 속성
    if (spec.properties && spec.properties.length > 0) {
      code += '  // Properties\n';
      for (const prop of spec.properties) {
        code += `  ${prop.name}: ${prop.type};\n`;
      }
      code += '\n';
    }

    // 생성자
    code += `  constructor() {
    // TODO: Initialize
  }

`;

    // 메서드
    if (spec.methods && spec.methods.length > 0) {
      code += '  // Methods\n';
      for (const method of spec.methods) {
        code += `  ${method.signature} {
    // ${method.description}
  }

`;
      }
    }

    code += '}';

    return code;
  }

  /**
   * 인터페이스 코드 생성
   */
  private generateInterface(spec: CustomCodeSpec): string {
    let code = `/**
 * ${spec.description}
 */
interface ${spec.name} {
`;

    if (spec.properties && spec.properties.length > 0) {
      for (const prop of spec.properties) {
        code += `  ${prop.name}: ${prop.type};\n`;
      }
    }

    code += '}';

    return code;
  }

  /**
   * 열거형 코드 생성
   */
  private generateEnum(spec: CustomCodeSpec): string {
    const values = (spec.body || '').split(',').map(v => v.trim()).filter(v => v);

    let code = `/**
 * ${spec.description}
 */
enum ${spec.name} {
`;

    for (let i = 0; i < values.length; i++) {
      code += `  ${values[i]}${i < values.length - 1 ? ',' : ''}
`;
    }

    code += '}';

    return code;
  }

  /**
   * 상수 코드 생성
   */
  private generateConstant(spec: CustomCodeSpec): string {
    const value = spec.body || 'null';

    return `/**
 * ${spec.description}
 */
const ${spec.name} = ${value};`;
  }

  /**
   * 4. 템플릿 버전 관리
   */
  async registerVersion(templateName: string, version: TemplateVersion): Promise<void> {
    if (!this.versionRegistry.has(templateName)) {
      this.versionRegistry.set(templateName, []);
    }

    const versions = this.versionRegistry.get(templateName)!;
    versions.push(version);

    // 버전순으로 정렬
    versions.sort((a, b) => {
      const aVersion = this.parseVersion(a.version);
      const bVersion = this.parseVersion(b.version);

      if (aVersion[0] !== bVersion[0]) return bVersion[0] - aVersion[0];
      if (aVersion[1] !== bVersion[1]) return bVersion[1] - aVersion[1];
      return bVersion[2] - aVersion[2];
    });
  }

  /**
   * 버전 문자열 파싱
   */
  private parseVersion(version: string): number[] {
    return version.split('.').map(Number);
  }

  /**
   * 버전에 맞는 템플릿 렌더링
   */
  async renderTemplateWithVersion(templateName: string, version: string, context: Record<string, any>): Promise<RenderResult> {
    const cacheKey = `${templateName}@${version}`;

    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey)!;
    }

    const template = this.templateRegistry.get(templateName);
    if (!template) {
      return {
        success: false,
        content: '',
        metadata: {} as TemplateMetadata,
        warnings: [`Template ${templateName} not found`],
        timestamp: Date.now(),
      };
    }

    const versions = this.versionRegistry.get(templateName) || [];
    const versionInfo = versions.find(v => v.version === version);

    if (!versionInfo) {
      return {
        success: false,
        content: '',
        metadata: template.metadata,
        warnings: [`Version ${version} not found for template ${templateName}`],
        timestamp: Date.now(),
      };
    }

    const warnings: string[] = [];

    if (versionInfo.deprecated) {
      warnings.push(`Template version ${version} is deprecated. ${versionInfo.previousVersion ? `Use ${versionInfo.previousVersion} instead.` : ''}`);
    }

    try {
      const compiled = Handlebars.compile(template.content);
      const content = compiled(context);

      const result: RenderResult = {
        success: true,
        content,
        metadata: template.metadata,
        warnings,
        timestamp: Date.now(),
      };

      this.renderCache.set(cacheKey, result);

      return result;
    } catch (error) {
      return {
        success: false,
        content: '',
        metadata: template.metadata,
        warnings: [`Rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 하위호환성 확인
   */
  isBackwardCompatible(fromVersion: string, toVersion: string): boolean {
    const from = this.parseVersion(fromVersion);
    const to = this.parseVersion(toVersion);

    // Major 버전이 같으면 호환
    return from[0] === to[0];
  }

  /**
   * 완전한 프로젝트 렌더링
   */
  async renderComplete(
    projectName: string,
    templateKeys: string[],
    customCodes: CustomCodeSpec[],
    context: Record<string, any>
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    // 1. 템플릿 조합
    const composed = await this.composeTemplates(templateKeys, context);
    result['project-template.ts'] = composed;

    // 2. 커스텀 코드 생성
    for (let i = 0; i < customCodes.length; i++) {
      const code = await this.generateCustomCode(customCodes[i]);
      result[`generated-${customCodes[i].name}.ts`] = code;
    }

    // 3. 메인 인덱스 파일 생성
    const indexContent = this.generateIndex(templateKeys, customCodes);
    result['index.ts'] = indexContent;

    return result;
  }

  /**
   * 인덱스 파일 생성
   */
  private generateIndex(templateKeys: string[], customCodes: CustomCodeSpec[]): string {
    let content = '/**\n * Auto-generated Project Index\n */\n\n';

    content += '// Template imports\n';
    for (const key of templateKeys) {
      const fileName = key.replace(/\//g, '-');
      content += `import { ${fileName} } from './${fileName}';\n`;
    }

    content += '\n// Custom code imports\n';
    for (const spec of customCodes) {
      content += `import { ${spec.name} } from './generated-${spec.name}';\n`;
    }

    content += '\n// Re-exports\n';
    content += 'export { ';
    const exports = [...templateKeys, ...customCodes.map(s => s.name)];
    content += exports.join(', ');
    content += ' };';

    return content;
  }

  /**
   * 템플릿 캐시 조회
   */
  getTemplateInfo(templateKey: string): TemplateInfo | undefined {
    return this.templateRegistry.get(templateKey);
  }

  /**
   * 모든 템플릿 목록
   */
  getAllTemplates(): TemplateInfo[] {
    return Array.from(this.templateRegistry.values());
  }

  /**
   * 템플릿 필터링
   */
  filterTemplates(predicate: (template: TemplateInfo) => boolean): TemplateInfo[] {
    return Array.from(this.templateRegistry.values()).filter(predicate);
  }

  /**
   * 렌더 캐시 비우기
   */
  clearRenderCache(): void {
    this.renderCache.clear();
  }

  /**
   * 전체 캐시 비우기
   */
  clearAllCache(): void {
    this.renderCache.clear();
    this.templateRegistry.clear();
    this.loadTemplateRegistry();
  }
}

/**
 * Export singleton instance
 */
export const advancedTemplateEngine = new AdvancedTemplateEngine(
  path.join(__dirname, '../../templates')
);
