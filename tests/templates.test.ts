import { TemplateLoader } from '../src/templates/template-loader';
import * as path from 'path';
import * as fs from 'fs';

describe('TemplateLoader', () => {
  let loader: TemplateLoader;
  const testTemplatesDir = path.join(__dirname, '../src/templates');

  beforeAll(() => {
    loader = new TemplateLoader(testTemplatesDir);
  });

  describe('Template Loading', () => {
    test('should load Express server template', async () => {
      const template = await loader.loadTemplate('api/express/server.hbs');
      expect(template).toBeDefined();
      expect(template).toContain('import express');
      expect(template).toContain('const app = express()');
    });

    test('should load React App template', async () => {
      const template = await loader.loadTemplate('web/react/App.hbs');
      expect(template).toBeDefined();
      expect(template).toContain('React');
      expect(template).toContain('Router');
    });

    test('should load database schema template', async () => {
      const template = await loader.loadTemplate('database/schema.sql.hbs');
      expect(template).toBeDefined();
      expect(template).toContain('CREATE TABLE');
    });

    test('should throw error for non-existent template', async () => {
      await expect(loader.loadTemplate('non-existent.hbs')).rejects.toThrow();
    });

    test('should throw error for path traversal attempts', async () => {
      await expect(loader.loadTemplate('../../../etc/passwd')).rejects.toThrow();
    });
  });

  describe('Template Rendering', () => {
    test('should render Express server template with data', async () => {
      const data = {
        appName: 'My API Server',
        port: 3000,
        requirements: {
          auth: true,
          rate_limiting: true
        },
        features: [
          { path: 'users' },
          { path: 'posts' }
        ]
      };

      const rendered = await loader.renderTemplate('api/express/server.hbs', data);

      expect(rendered).toContain('My API Server');
      expect(rendered).toContain('3000');
      expect(rendered).toContain('authMiddleware');
      expect(rendered).toContain('rate_limiting');
      expect(rendered).toContain('/api/users');
      expect(rendered).toContain('/api/posts');
    });

    test('should render React App template with data', async () => {
      const data = {
        appName: 'My React App',
        year: 2026,
        navItems: [
          { path: '/about', label: 'About' },
          { path: '/contact', label: 'Contact' }
        ],
        routes: [
          { path: '/', component: 'Home' },
          { path: '/about', component: 'About' }
        ],
        components: [
          { name: 'Home', file: 'Home' },
          { name: 'About', file: 'About' }
        ]
      };

      const rendered = await loader.renderTemplate('web/react/App.hbs', data);

      expect(rendered).toContain('My React App');
      expect(rendered).toContain('2026');
      expect(rendered).toContain('/about');
      expect(rendered).toContain('Contact');
      expect(rendered).toContain('Home');
    });

    test('should render database schema template with custom tables', async () => {
      const data = {
        appName: 'Test App',
        tables: [
          {
            name: 'products',
            columns: [
              { name: 'name', type: 'VARCHAR(255)', nullable: false },
              { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
              { name: 'description', type: 'TEXT', nullable: true }
            ],
            indexes: ['name', 'price']
          }
        ]
      };

      const rendered = await loader.renderTemplate('database/schema.sql.hbs', data);

      expect(rendered).toContain('products');
      expect(rendered).toContain('VARCHAR(255)');
      expect(rendered).toContain('DECIMAL(10,2)');
      expect(rendered).toContain('idx_products_name');
      expect(rendered).toContain('idx_products_price');
    });

    test('should render template string', async () => {
      const template = 'Hello {{name}}, you are {{age}} years old';
      const data = { name: 'John', age: 30 };

      const rendered = await loader.renderTemplateString(template, data);

      expect(rendered).toBe('Hello John, you are 30 years old');
    });

    test('should render template with custom helpers', async () => {
      const template = '{{#ifEqual status "active"}}Active{{else}}Inactive{{/ifEqual}}';
      const data = { status: 'active' };

      const rendered = await loader.renderTemplateString(template, data);

      expect(rendered).toContain('Active');
    });
  });

  describe('Template Discovery', () => {
    test('should get available templates', async () => {
      const templates = await loader.getAvailableTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.includes('express'))).toBe(true);
      expect(templates.some(t => t.includes('React'))).toBe(true);
    });

    test('should get templates by type', async () => {
      const apiTemplates = await loader.getAvailableTemplates('api');

      expect(apiTemplates.length).toBeGreaterThan(0);
      expect(apiTemplates.some(t => t.includes('express'))).toBe(true);
    });

    test('should get template structure', async () => {
      const structure = await loader.getTemplateStructure();

      expect(structure.api).toBeDefined();
      expect(structure.web).toBeDefined();
      expect(structure.database).toBeDefined();
      expect(structure.config).toBeDefined();
      expect(structure.auth).toBeDefined();
    });

    test('should return empty array for non-existent type', async () => {
      const templates = await loader.getAvailableTemplates('non-existent');

      expect(templates).toEqual([]);
    });
  });

  describe('Template Caching', () => {
    test('should cache and retrieve compiled templates', async () => {
      const templatePath = 'api/express/server.hbs';
      const content = await loader.loadTemplate(templatePath);
      const compiled = loader['compileTemplate'](content);

      loader.cacheTemplate(templatePath, compiled);
      const cached = loader.getCachedTemplate(templatePath);

      expect(cached).toBeDefined();
      expect(cached).toBe(compiled);
    });

    test('should clear cache', async () => {
      const templatePath = 'api/express/server.hbs';
      const content = await loader.loadTemplate(templatePath);
      const compiled = loader['compileTemplate'](content);

      loader.cacheTemplate(templatePath, compiled);
      expect(loader.getCachedTemplate(templatePath)).toBeDefined();

      loader.clearCache();
      expect(loader.getCachedTemplate(templatePath)).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    test('should get and set templates directory', () => {
      const originalDir = loader.getTemplatesDir();
      const newDir = '/tmp/templates';

      loader.setTemplatesDir(newDir);
      expect(loader.getTemplatesDir()).toBe(newDir);

      // Restore original
      loader.setTemplatesDir(originalDir);
    });

    test('should clear cache when setting new directory', () => {
      const templatePath = 'api/express/server.hbs';
      const content = await loader.loadTemplate(templatePath);
      const compiled = loader['compileTemplate'](content);

      loader.cacheTemplate(templatePath, compiled);
      expect(loader.getCachedTemplate(templatePath)).toBeDefined();

      loader.setTemplatesDir('/tmp');
      expect(loader.getCachedTemplate(templatePath)).toBeUndefined();

      // Restore original
      loader.setTemplatesDir(path.join(__dirname, '../src/templates'));
    });
  });

  describe('Integration Tests', () => {
    test('should render complete Express API project', async () => {
      const projectData = {
        appName: 'E-Commerce API',
        port: 3000,
        projectName: 'ecommerce-api',
        description: 'Full-featured e-commerce API',
        mainFile: 'server',
        requirements: {
          auth: true,
          database: true,
          rate_limiting: true,
          validation: true
        },
        features: [
          { path: 'users', auth: true },
          { path: 'products', auth: true },
          { path: 'orders', auth: true }
        ]
      };

      const serverTemplate = await loader.renderTemplate('api/express/server.hbs', projectData);
      const packageTemplate = await loader.renderTemplate('config/package.json.hbs', projectData);
      const envTemplate = await loader.renderTemplate('config/.env.hbs', {
        ...projectData,
        environment: 'development',
        dbHost: 'localhost',
        dbPort: 5432,
        dbUser: 'postgres',
        dbPassword: 'password',
        dbName: 'ecommerce',
        jwtSecret: 'secret-key-123',
        sessionSecret: 'session-secret-456',
        corsOrigin: 'http://localhost:3000'
      });

      expect(serverTemplate).toContain('E-Commerce API');
      expect(serverTemplate).toContain('3000');
      expect(serverTemplate).toContain('/api/users');
      expect(packageTemplate).toContain('ecommerce-api');
      expect(packageTemplate).toContain('express');
      expect(envTemplate).toContain('development');
      expect(envTemplate).toContain('localhost');
    });

    test('should render complete React frontend', async () => {
      const appData = {
        appName: 'E-Commerce Frontend',
        year: 2026,
        components: [
          { name: 'Home', file: 'Home' },
          { name: 'Products', file: 'Products' },
          { name: 'Cart', file: 'Cart' }
        ],
        navItems: [
          { path: '/products', label: 'Products' },
          { path: '/cart', label: 'Cart' },
          { path: '/account', label: 'Account' }
        ],
        routes: [
          { path: '/', component: 'Home' },
          { path: '/products', component: 'Products' },
          { path: '/cart', component: 'Cart' }
        ],
        features: [
          { title: 'Product Catalog', description: 'Browse thousands of products' },
          { title: 'Shopping Cart', description: 'Easy checkout process' }
        ]
      };

      const appTemplate = await loader.renderTemplate('web/react/App.hbs', appData);
      const homeTemplate = await loader.renderTemplate('web/react/components/Home.hbs', appData);

      expect(appTemplate).toContain('E-Commerce Frontend');
      expect(appTemplate).toContain('/products');
      expect(appTemplate).toContain('2026');
      expect(homeTemplate).toContain('E-Commerce Frontend');
      expect(homeTemplate).toContain('Product Catalog');
    });
  });
});
