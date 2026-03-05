/**
 * Config Generator
 * 다양한 설정 파일 자동 생성
 */

import { CodeGenRequest } from './structure-generator';

export interface ConfigOptions {
  projectName: string;
  projectType: string;
  techStack: Record<string, string>;
  requirements: Record<string, boolean>;
  port?: number;
}

export class ConfigGenerator {
  generateAllConfigs(request: CodeGenRequest): Record<string, string> {
    const configs: Record<string, string> = {};
    const options: ConfigOptions = {
      projectName: request.project_name,
      projectType: request.project_type,
      techStack: request.tech_stack,
      requirements: request.requirements,
      port: 3000,
    };

    // 기본 설정 파일
    configs['package.json'] = this.generatePackageJson(options);
    configs['tsconfig.json'] = this.generateTsconfig(options);
    configs['jest.config.js'] = this.generateJestConfig(options);
    configs['.env.example'] = this.generateEnvExample(options);
    configs['.gitignore'] = this.generateGitignore();
    configs['.npmrc'] = this.generateNpmrc();
    configs['.eslintrc.json'] = this.generateEslintConfig();
    configs['.prettierrc'] = this.generatePrettierConfig();
    configs['.editorconfig'] = this.generateEditorconfig();
    configs['Dockerfile'] = this.generateDockerfile(options);
    configs['docker-compose.yml'] = this.generateDockerCompose(options, request);
    configs['.dockerignore'] = this.generateDockerignore();
    configs['.github/workflows/ci.yml'] = this.generateGithubCI(options);
    configs['.github/workflows/cd.yml'] = this.generateGithubCD(options);
    configs['Makefile'] = this.generateMakefile(options);
    configs['.vscode/settings.json'] = this.generateVscodeSettings();
    configs['.vscode/launch.json'] = this.generateVscodeLaunch(options);

    return configs;
  }

  private generatePackageJson(options: ConfigOptions): string {
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {
      'typescript': '^5.2.2',
      '@types/node': '^20.8.0',
      'ts-node': '^10.9.1',
      'eslint': '^8.50.0',
      'prettier': '^3.0.3',
      '@typescript-eslint/parser': '^6.7.5',
      '@typescript-eslint/eslint-plugin': '^6.7.5',
      'jest': '^29.7.0',
      '@types/jest': '^29.5.7',
      'ts-jest': '^29.1.1',
    };

    const scripts: Record<string, string> = {
      'build': 'tsc',
      'dev': 'ts-node src/server.ts',
      'start': 'node dist/server.js',
      'test': 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'lint': 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',
      'format': 'prettier --write "src/**/*.ts"',
      'type-check': 'tsc --noEmit',
      'clean': 'rm -rf dist coverage',
    };

    const backend = options.techStack.backend?.toLowerCase();
    if (backend === 'express') {
      dependencies['express'] = '^4.18.2';
      dependencies['cors'] = '^2.8.5';
      dependencies['helmet'] = '^7.1.0';
      dependencies['compression'] = '^1.7.4';
      devDependencies['supertest'] = '^6.3.3';
      devDependencies['@types/express'] = '^4.17.21';
    }

    const database = options.techStack.database?.toLowerCase();
    if (database?.includes('postgres')) {
      dependencies['pg'] = '^8.11.0';
      dependencies['sequelize'] = '^6.34.0';
      devDependencies['@types/pg'] = '^8.10.7';
    } else if (database?.includes('mongo')) {
      dependencies['mongoose'] = '^7.5.0';
      dependencies['mongodb'] = '^6.2.0';
    }

    if (options.requirements.auth) {
      dependencies['jsonwebtoken'] = '^9.1.0';
      dependencies['bcryptjs'] = '^2.4.3';
      devDependencies['@types/jsonwebtoken'] = '^9.0.4';
      devDependencies['@types/bcryptjs'] = '^2.4.2';
    }

    dependencies['dotenv'] = '^16.0.3';
    dependencies['axios'] = '^1.6.0';

    const packageJson = {
      name: options.projectName,
      version: '1.0.0',
      description: `Generated ${options.projectType} project`,
      main: 'dist/server.js',
      types: 'dist/server.d.ts',
      scripts,
      dependencies,
      devDependencies,
      engines: {
        node: '>=18.0.0',
        npm: '>=9.0.0',
      },
      keywords: [options.projectType, 'nodejs', 'typescript'],
      author: '',
      license: 'MIT',
    };

    return JSON.stringify(packageJson, null, 2);
  }

  private generateTsconfig(options: ConfigOptions): string {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        sourceMap: true,
        moduleResolution: 'node',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests'],
    };

    return JSON.stringify(tsconfig, null, 2);
  }

  private generateJestConfig(options: ConfigOptions): string {
    return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
`;
  }

  private generateEnvExample(options: ConfigOptions): string {
    let env = `NODE_ENV=development\nPORT=${options.port}\n`;
    env += `DEBUG=true\nLOG_LEVEL=info\n`;

    const database = options.techStack.database?.toLowerCase();
    if (database?.includes('postgres')) {
      env += `DATABASE_URL=postgresql://user:password@localhost:5432/${options.projectName}\n`;
    } else if (database?.includes('mongo')) {
      env += `MONGODB_URI=mongodb://localhost:27017/${options.projectName}\n`;
    }

    if (options.requirements.auth) {
      env += `JWT_SECRET=your-secret-key\nJWT_EXPIRY=24h\n`;
    }

    return env;
  }

  private generateGitignore(): string {
    return `node_modules/\ndist/\n.env\n.env.local\ncoverage/\n.vscode/\n.idea/\n*.log\n`;
  }

  private generateNpmrc(): string {
    return `legacy-peer-deps=false\naudit=true\n`;
  }

  private generateEslintConfig(): string {
    return JSON.stringify(
      {
        root: true,
        parser: '@typescript-eslint/parser',
        extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
        plugins: ['@typescript-eslint'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'warn',
          '@typescript-eslint/no-unused-vars': 'warn',
        },
      },
      null,
      2
    );
  }

  private generatePrettierConfig(): string {
    return JSON.stringify(
      {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
        tabWidth: 2,
      },
      null,
      2
    );
  }

  private generateEditorconfig(): string {
    return `root = true\n[*]\ncharset = utf-8\nend_of_line = lf\ninsert_final_newline = true\n`;
  }

  private generateDockerfile(options: ConfigOptions): string {
    return `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY src ./src\nCOPY tsconfig.json ./\nRUN npm run build\nEXPOSE ${options.port}\nCMD ["node", "dist/server.js"]\n`;
  }

  private generateDockerCompose(
    options: ConfigOptions,
    request: CodeGenRequest
  ): string {
    let compose = `version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - "${options.port}:${options.port}"\n`;

    const database = request.tech_stack.database?.toLowerCase() || '';
    if (database.includes('postgres')) {
      compose += `  postgres:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_DB: ${options.projectName}\n      POSTGRES_PASSWORD: postgres\n    ports:\n      - "5432:5432"\n`;
    } else if (database.includes('mongo')) {
      compose += `  mongodb:\n    image: mongo:6\n    ports:\n      - "27017:27017"\n`;
    }

    return compose;
  }

  private generateDockerignore(): string {
    return `node_modules\nnpm-debug.log\ndist\ncoverage\n.git\n.env\n`;
  }

  private generateGithubCI(options: ConfigOptions): string {
    return `name: CI\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: '18'\n      - run: npm ci\n      - run: npm run build\n      - run: npm test\n`;
  }

  private generateGithubCD(options: ConfigOptions): string {
    return `name: CD\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: '18'\n      - run: npm ci\n      - run: npm run build\n`;
  }

  private generateMakefile(options: ConfigOptions): string {
    return `.PHONY: help install dev build test\nhelp:\n\t@echo "Targets: install, dev, build, test"\ninstall:\n\tnpm install\ndev:\n\tnpm run dev\nbuild:\n\tnpm run build\ntest:\n\tnpm test\n`;
  }

  private generateVscodeSettings(): string {
    return JSON.stringify(
      {
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        '[typescript]': {
          'editor.defaultFormatter': 'esbenp.prettier-vscode',
          'editor.formatOnSave': true,
        },
      },
      null,
      2
    );
  }

  private generateVscodeLaunch(options: ConfigOptions): string {
    return JSON.stringify(
      {
        version: '0.2.0',
        configurations: [
          {
            type: 'node',
            request: 'launch',
            name: 'Launch Program',
            program: '\${workspaceFolder}/dist/server.js',
            preLaunchTask: 'npm: build',
          },
        ],
      },
      null,
      2
    );
  }
}
