/**
 * CodeGen Engine
 * CodeGenRequest → 실제 코드 생성
 *
 * 3단계 프로세스:
 * 1. 템플릿 선택 (tech_stack 기반)
 * 2. 데이터 준비 (context, dependencies, config)
 * 3. 템플릿 렌더링 (Handlebars)
 *
 * 출력: FileMap {[filepath]: content}
 */

import * as path from 'path';
import { TemplateLoader } from '../templates/template-loader';
import { CodeGenRequest, ProjectStructure } from './structure-generator';
import Handlebars from 'handlebars';

export interface FileMap {
  [filepath: string]: string;
}

export interface CodeGenContext {
  projectName: string;
  projectType: string;
  features: Array<{ name: string; operations: string[] }>;
  techStack: Record<string, string>;
  requirements: Record<string, boolean>;
  port?: number;
  description?: string;
}

/**
 * 의존성 관리
 */
export interface DependencyMap {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

/**
 * CodeGen 엔진
 */
export class CodeGenEngine {
  private templateLoader: TemplateLoader;
  private dependencyRegistry: Record<string, Record<string, string>>;

  constructor(templatesDir?: string) {
    this.templateLoader = new TemplateLoader(templatesDir);
    this.dependencyRegistry = this.initializeDependencies();
    this.registerCustomHelpers();
  }

  /**
   * 의존성 레지스트리 초기화
   */
  private initializeDependencies(): Record<string, Record<string, string>> {
    return {
      // Frameworks
      express: {
        'express': '^4.18.2',
        'cors': '^2.8.5',
        'dotenv': '^16.0.3',
      },
      fastapi: {
        'fastapi': '0.104.1',
        'pydantic': '2.4.2',
        'uvicorn': '0.24.0',
      },
      react: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'axios': '^1.6.0',
      },
      vue: {
        'vue': '^3.3.4',
        'axios': '^1.6.0',
      },

      // Databases
      postgresql: {
        'pg': '^8.11.0',
        'sequelize': '^6.34.0',
      },
      mongodb: {
        'mongoose': '^7.5.0',
        'mongodb': '^6.2.0',
      },
      redis: {
        'redis': '^4.6.11',
        'ioredis': '^5.3.2',
      },

      // Auth
      jwt: {
        'jsonwebtoken': '^9.1.0',
        'bcryptjs': '^2.4.3',
      },
      oauth2: {
        'passport': '^0.7.0',
        'passport-oauth2': '^1.7.0',
      },

      // Utilities
      testing: {
        'jest': '^29.7.0',
        '@types/jest': '^29.5.7',
        'ts-jest': '^29.1.1',
        'supertest': '^6.3.3',
      },
      linting: {
        'eslint': '^8.50.0',
        'prettier': '^3.0.3',
        '@typescript-eslint/parser': '^6.7.5',
        '@typescript-eslint/eslint-plugin': '^6.7.5',
      },
      typescript: {
        'typescript': '^5.2.2',
        '@types/node': '^20.8.0',
        'ts-node': '^10.9.1',
      },
    };
  }

  /**
   * 커스텀 Handlebars 헬퍼 등록
   */
  private registerCustomHelpers(): void {
    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    });

    Handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = this.pascalCase(str);
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    Handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    });

    Handlebars.registerHelper('joinComma', function (this: any, array: any[]) {
      return array ? array.join(', ') : '';
    });

    Handlebars.registerHelper('indent', (str: string, spaces: number = 2) => {
      const indent = ' '.repeat(spaces);
      return str
        .split('\n')
        .map((line) => indent + line)
        .join('\n');
    });
  }

  /**
   * 의존성 자동 추가
   */
  private resolveDependencies(request: CodeGenRequest): DependencyMap {
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {
      start: 'node dist/server.js',
      dev: 'ts-node src/server.ts',
      build: 'tsc',
      test: 'jest',
    };

    // Framework 기반 의존성
    const backend = request.tech_stack.backend?.toLowerCase();
    if (backend) {
      const frameworkDeps = this.dependencyRegistry[backend];
      if (frameworkDeps) {
        Object.assign(dependencies, frameworkDeps);
      }
    }

    // Database 기반 의존성
    const database = request.tech_stack.database?.toLowerCase();
    if (database) {
      const dbDeps = this.dependencyRegistry[database];
      if (dbDeps) {
        Object.assign(dependencies, dbDeps);
      }
    }

    // Auth 기반 의존성
    if (request.requirements.auth) {
      const authDeps = this.dependencyRegistry.jwt;
      if (authDeps) {
        Object.assign(dependencies, authDeps);
      }
    }

    // Frontend 기반 의존성
    const frontend = request.tech_stack.frontend?.toLowerCase();
    if (frontend) {
      const frontendDeps = this.dependencyRegistry[frontend];
      if (frontendDeps) {
        Object.assign(dependencies, frontendDeps);
      }
    }

    // 테스트, 린팅 등 기본 devDependencies
    Object.assign(devDependencies, this.dependencyRegistry.testing);
    Object.assign(devDependencies, this.dependencyRegistry.linting);
    Object.assign(devDependencies, this.dependencyRegistry.typescript);

    return { dependencies, devDependencies, scripts };
  }

  /**
   * 코드 생성 컨텍스트 준비
   */
  private prepareContext(request: CodeGenRequest): CodeGenContext {
    return {
      projectName: request.project_name,
      projectType: request.project_type,
      features: request.features,
      techStack: request.tech_stack,
      requirements: request.requirements,
      port: 3000,
      description: `Generated ${request.project_type} project`,
    };
  }

  /**
   * 템플릿 선택 (기술 스택 기반)
   */
  private selectTemplates(request: CodeGenRequest): Record<string, string> {
    const templates: Record<string, string> = {};

    // 프로젝트 타입에 따른 기본 템플릿
    if (request.project_type === 'api') {
      const backend = request.tech_stack.backend || 'express';
      templates.server = `api/${backend}/server.ts.hbs`;
      templates.routes = `api/${backend}/routes.ts.hbs`;
      templates.models = `api/models.ts.hbs`;

      if (request.requirements.auth) {
        templates.auth = `api/${backend}/auth.ts.hbs`;
      }
    } else if (request.project_type === 'web') {
      const frontend = request.tech_stack.frontend || 'react';
      templates.app = `web/${frontend}/App.tsx.hbs`;
      templates.main = `web/${frontend}/main.tsx.hbs`;
    } else if (request.project_type === 'cli') {
      templates.cli = 'cli/main.ts.hbs';
      templates.commands = 'cli/commands.ts.hbs';
    }

    // 공통 템플릿
    templates.packageJson = 'config/package.json.hbs';
    templates.tsconfig = 'config/tsconfig.json.hbs';
    templates.env = 'config/.env.hbs';

    // 데이터베이스 스키마
    if (request.tech_stack.database) {
      const dbType = request.tech_stack.database.toLowerCase().includes('mongo')
        ? 'mongodb'
        : 'sql';
      templates.schema = `database/${dbType}/schema.hbs`;
    }

    // Docker
    if (request.requirements.docker) {
      templates.dockerfile = 'docker/Dockerfile.hbs';
      templates.dockerCompose = 'docker/docker-compose.yml.hbs';
    }

    return templates;
  }

  /**
   * 템플릿 렌더링 및 코드 생성
   */
  async generateCode(request: CodeGenRequest): Promise<FileMap> {
    const fileMap: FileMap = {};

    try {
      // 1단계: 컨텍스트 준비
      const context = this.prepareContext(request);
      const dependencies = this.resolveDependencies(request);
      const templates = this.selectTemplates(request);

      // 2단계: 기본 파일 생성
      fileMap['package.json'] = this.generatePackageJson(context, dependencies);
      fileMap['tsconfig.json'] = this.generateTsconfig(context);
      fileMap['.env.example'] = this.generateEnv(context, request);
      fileMap['.gitignore'] = this.generateGitignore();
      fileMap['README.md'] = this.generateReadme(context);

      // 3단계: 프로젝트 타입별 코드 생성
      if (request.project_type === 'api') {
        await this.generateApiProject(request, context, fileMap);
      } else if (request.project_type === 'web') {
        await this.generateWebProject(request, context, fileMap);
      } else if (request.project_type === 'cli') {
        await this.generateCliProject(request, context, fileMap);
      }

      // 4단계: Docker 파일 생성
      if (request.requirements.docker) {
        fileMap['Dockerfile'] = this.generateDockerfile(context);
        fileMap['docker-compose.yml'] = this.generateDockerCompose(context, request);
      }

      // 5단계: CI/CD 설정
      fileMap['.github/workflows/ci.yml'] = this.generateGithubCI(context, request);
      fileMap['.eslintrc.json'] = this.generateEslintConfig();
      fileMap['.prettierrc'] = this.generatePrettierConfig();

      return fileMap;
    } catch (error) {
      throw new Error(`Code generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * API 프로젝트 생성
   */
  private async generateApiProject(
    request: CodeGenRequest,
    context: CodeGenContext,
    fileMap: FileMap
  ): Promise<void> {
    const backend = request.tech_stack.backend || 'express';

    // 서버 진입점
    fileMap['src/server.ts'] = this.generateApiServer(context, request);

    // 라우트
    fileMap['src/routes/index.ts'] = this.generateApiRoutes(context, request);

    // 미들웨어
    fileMap['src/middleware/errorHandler.ts'] = this.generateErrorHandler(context);
    fileMap['src/middleware/auth.ts'] = this.generateAuthMiddleware(context, request);

    // 모델
    fileMap['src/models/User.ts'] = this.generateUserModel(context, request);

    // 인증 (JWT)
    if (request.requirements.auth) {
      fileMap['src/auth/jwt.ts'] = this.generateJwtAuth(context);
      fileMap['src/auth/types.ts'] = this.generateAuthTypes();
    }

    // 데이터베이스 설정
    const dbType = request.tech_stack.database?.toLowerCase() || '';
    if (dbType.includes('postgres') || dbType.includes('sql')) {
      fileMap['src/db/schema.sql'] = this.generateSqlSchema(context, request);
      fileMap['src/db/connection.ts'] = this.generateDbConnection(context, request);
    } else if (dbType.includes('mongo')) {
      fileMap['src/db/schema.ts'] = this.generateMongoSchema(context, request);
      fileMap['src/db/connection.ts'] = this.generateMongoConnection(context);
    }

    // 테스트
    fileMap['tests/server.test.ts'] = this.generateApiTests(context, request);
  }

  /**
   * Web 프로젝트 생성
   */
  private async generateWebProject(
    request: CodeGenRequest,
    context: CodeGenContext,
    fileMap: FileMap
  ): Promise<void> {
    const frontend = request.tech_stack.frontend || 'react';

    if (frontend.toLowerCase() === 'react') {
      fileMap['src/App.tsx'] = this.generateReactApp(context);
      fileMap['src/main.tsx'] = this.generateReactMain(context);
      fileMap['src/components/Header.tsx'] = this.generateReactComponent('Header');
      fileMap['src/pages/Home.tsx'] = this.generateReactPage('Home');
      fileMap['vite.config.ts'] = this.generateViteConfig(context);
      fileMap['index.html'] = this.generateHtmlTemplate(context);
    }

    fileMap['src/api/client.ts'] = this.generateApiClient(context);
    fileMap['tests/App.test.tsx'] = this.generateWebTests(context);
  }

  /**
   * CLI 프로젝트 생성
   */
  private async generateCliProject(
    request: CodeGenRequest,
    context: CodeGenContext,
    fileMap: FileMap
  ): Promise<void> {
    fileMap['src/cli.ts'] = this.generateCliMain(context);
    fileMap['src/commands/help.ts'] = this.generateCliCommand('help');
    fileMap['src/commands/version.ts'] = this.generateCliCommand('version');
    fileMap['bin/cli'] = this.generateCliBin(context);
    fileMap['tests/cli.test.ts'] = this.generateCliTests(context);
  }

  // ============= 설정 파일 생성 =============

  private generatePackageJson(context: CodeGenContext, deps: DependencyMap): string {
    return JSON.stringify(
      {
        name: context.projectName,
        version: '1.0.0',
        description: context.description,
        main: 'dist/server.js',
        scripts: deps.scripts,
        dependencies: deps.dependencies,
        devDependencies: deps.devDependencies,
        keywords: [context.projectType, 'nodejs', 'typescript'],
        author: '',
        license: 'MIT',
      },
      null,
      2
    );
  }

  private generateTsconfig(context: CodeGenContext): string {
    return JSON.stringify(
      {
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
          declarationMap: true,
          sourceMap: true,
          moduleResolution: 'node',
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests'],
      },
      null,
      2
    );
  }

  private generateEnv(context: CodeGenContext, request: CodeGenRequest): string {
    let content = `# Environment Variables\n`;
    content += `NODE_ENV=development\n`;
    content += `PORT=${context.port}\n`;

    if (request.requirements.auth) {
      content += `JWT_SECRET=your-secret-key-here\n`;
      content += `JWT_EXPIRY=24h\n`;
    }

    const dbType = request.tech_stack.database?.toLowerCase() || '';
    if (dbType.includes('postgres') || dbType.includes('sql')) {
      content += `DATABASE_URL=postgresql://user:password@localhost:5432/${context.projectName}\n`;
    } else if (dbType.includes('mongo')) {
      content += `MONGODB_URI=mongodb://localhost:27017/${context.projectName}\n`;
    }

    if (dbType.includes('redis')) {
      content += `REDIS_URL=redis://localhost:6379\n`;
    }

    return content;
  }

  private generateGitignore(): string {
    return `node_modules/
dist/
.env
.env.local
.DS_Store
*.log
coverage/
.vscode/
.idea/
*.swp
*.swo
`;
  }

  private generateReadme(context: CodeGenContext): string {
    return `# ${this.pascalCase(context.projectName)}

Generated ${context.projectType} project

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm test\` - Run tests
\`\`\`

## Tech Stack

- Node.js with TypeScript
- Testing: Jest
- Linting: ESLint + Prettier
`;
  }

  // ============= API 프로젝트 파일 =============

  private generateApiServer(context: CodeGenContext, request: CodeGenRequest): string {
    const backend = request.tech_stack.backend || 'express';

    if (backend.toLowerCase() === 'express') {
      return `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import router from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});

export default app;
`;
    }

    return '';
  }

  private generateApiRoutes(context: CodeGenContext, request: CodeGenRequest): string {
    const features = request.features.map((f) => f.name).join(', ');

    return `import express from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Features: ${features}

${
  request.features
    .map(
      (feature) => `
// ${feature.name}
${feature.operations
  .map((op) => {
    const method = this.operationToHttpMethod(op);
    const path = `/${feature.name}${['get', 'delete'].includes(op.toLowerCase()) ? '/:id' : ''}`;
    return `router.${method}('${path}', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement ${op} for ${feature.name}
    res.json({ message: '${op} not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});`;
  })
  .join('\n')}
`
    )
    .join('\n')
}

export default router;
`;
  }

  private generateErrorHandler(context: CodeGenContext): string {
    return `import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      status,
      message,
      timestamp: new Date().toISOString(),
    },
  });
};
`;
  }

  private generateAuthMiddleware(context: CodeGenContext, request: CodeGenRequest): string {
    return `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`;
  }

  private generateUserModel(context: CodeGenContext, request: CodeGenRequest): string {
    return `/**
 * User Model
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: string;
}
`;
  }

  private generateJwtAuth(context: CodeGenContext): string {
    return `import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EXPIRY = process.env.JWT_EXPIRY || '24h';

export const generateToken = (payload: any) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
`;
  }

  private generateAuthTypes(): string {
    return `export interface AuthPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
`;
  }

  private generateSqlSchema(context: CodeGenContext, request: CodeGenRequest): string {
    return `-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

-- Session table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_id (user_id)
);
`;
  }

  private generateDbConnection(context: CodeGenContext, request: CodeGenRequest): string {
    return `import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (error) => {
  console.error('Unexpected error on idle client', error);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const connect = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
`;
  }

  private generateMongoSchema(context: CodeGenContext, request: CodeGenRequest): string {
    return `import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
`;
  }

  private generateMongoConnection(context: CodeGenContext): string {
    return `import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/${context.projectName}';
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
`;
  }

  private generateApiTests(context: CodeGenContext, request: CodeGenRequest): string {
    return `import request from 'supertest';
import app from '../server';

describe('API Tests', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return 401 for unauthorized request', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});
`;
  }

  // ============= Web 프로젝트 파일 =============

  private generateReactApp(context: CodeGenContext): string {
    return `import React from 'react';
import './App.css';
import Header from './components/Header';
import Home from './pages/Home';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <Home />
      </main>
    </div>
  );
}

export default App;
`;
  }

  private generateReactMain(context: CodeGenContext): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  }

  private generateReactComponent(name: string): string {
    return `import React from 'react';

interface ${name}Props {
  // Add props here
}

const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="${this.snakeCase(name)}">
      <h1>${name}</h1>
    </div>
  );
};

export default ${name};
`;
  }

  private generateReactPage(name: string): string {
    return `import React from 'react';

const ${name}: React.FC = () => {
  return (
    <div className="page-${this.snakeCase(name)}">
      <h1>${name}</h1>
    </div>
  );
};

export default ${name};
`;
  }

  private generateViteConfig(context: CodeGenContext): string {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
`;
  }

  private generateHtmlTemplate(context: CodeGenContext): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${context.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private generateApiClient(context: CodeGenContext): string {
    return `import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
`;
  }

  private generateWebTests(context: CodeGenContext): string {
    return `import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the app', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
`;
  }

  // ============= CLI 프로젝트 파일 =============

  private generateCliMain(context: CodeGenContext): string {
    return `#!/usr/bin/env node

import { program } from 'commander';
import { help } from './commands/help';
import { version } from './commands/version';

program
  .name('${context.projectName}')
  .description('CLI tool')
  .version('1.0.0');

program
  .command('help')
  .description('Show help')
  .action(help);

program
  .command('version')
  .description('Show version')
  .action(version);

program.parse(process.argv);
`;
  }

  private generateCliCommand(name: string): string {
    return `export const ${name} = () => {
  console.log('${name} command');
};
`;
  }

  private generateCliBin(context: CodeGenContext): string {
    return `#!/usr/bin/env node
require('../dist/cli.js');
`;
  }

  private generateCliTests(context: CodeGenContext): string {
    return `import { execSync } from 'child_process';

describe('CLI', () => {
  it('should show version', () => {
    const output = execSync('npm run cli -- version').toString();
    expect(output).toContain('1.0.0');
  });
});
`;
  }

  // ============= Docker 파일 =============

  private generateDockerfile(context: CodeGenContext): string {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
`;
  }

  private generateDockerCompose(context: CodeGenContext, request: CodeGenRequest): string {
    let services = `
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
`;

    const dbType = request.tech_stack.database?.toLowerCase() || '';
    if (dbType.includes('postgres')) {
      services += `
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${context.projectName}
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
`;
    } else if (dbType.includes('mongo')) {
      services += `
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
`;
    }

    return `version: '3.8'
services:${services}
`;
  }

  // ============= CI/CD & Config =============

  private generateGithubCI(context: CodeGenContext, request: CodeGenRequest): string {
    return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Test
        run: npm test
      - name: Lint
        run: npm run lint
`;
  }

  private generateEslintConfig(): string {
    return JSON.stringify(
      {
        parser: '@typescript-eslint/parser',
        extends: [
          'eslint:recommended',
          'plugin:@typescript-eslint/recommended',
          'prettier',
        ],
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
        arrowParens: 'always',
      },
      null,
      2
    );
  }

  // ============= Helper Methods =============

  private pascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private snakeCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  }

  private camelCase(str: string): string {
    const pascal = this.pascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private operationToHttpMethod(operation: string): string {
    const op = operation.toLowerCase();
    switch (op) {
      case 'create':
      case 'post':
        return 'post';
      case 'read':
      case 'get':
        return 'get';
      case 'update':
      case 'put':
      case 'patch':
        return 'put';
      case 'delete':
        return 'delete';
      default:
        return 'get';
    }
  }
}

/**
 * 테스트 (CLI)
 */
if (require.main === module) {
  (async () => {
    const engine = new CodeGenEngine();

    const request = {
      intent: 'create_api',
      project_type: 'api' as const,
      project_name: 'test-api',
      features: [
        { name: 'users', operations: ['create', 'read', 'update', 'delete'] },
      ],
      tech_stack: { backend: 'express', database: 'postgresql' },
      requirements: { auth: true, docker: false },
    };

    const fileMap = await engine.generateCode(request as any);
    console.log('Generated files:', Object.keys(fileMap).length);
    console.log('Files:', Object.keys(fileMap).slice(0, 10));
  })();
}
