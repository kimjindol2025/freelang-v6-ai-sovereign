import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

type TemplateDelegate = (context: any) => string;

/**
 * Template Loader
 * Handles loading and rendering Handlebars templates
 */
export class TemplateLoader {
  private templatesDir: string;
  private compiledTemplates: Map<string, TemplateDelegate> = new Map();

  constructor(templatesDir: string = path.join(__dirname, 'templates')) {
    this.templatesDir = templatesDir;
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Add custom helpers if needed
    Handlebars.registerHelper('ifEqual', function (this: any, a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    Handlebars.registerHelper('increment', function (value: number) {
      return value + 1;
    });

    Handlebars.registerHelper('toLowerCase', function (value: string) {
      return value.toLowerCase();
    });

    Handlebars.registerHelper('toUpperCase', function (value: string) {
      return value.toUpperCase();
    });
  }

  /**
   * Load a template file and return its content
   */
  async loadTemplate(templatePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.templatesDir, templatePath);

      // Verify the path is within templates directory (security)
      if (!fullPath.startsWith(this.templatesDir)) {
        throw new Error('Invalid template path');
      }

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compile a template and cache it
   */
  private compileTemplate(templateContent: string): TemplateDelegate {
    return Handlebars.compile(templateContent) as unknown as TemplateDelegate;
  }

  /**
   * Render a template with data
   */
  async renderTemplate(templatePath: string, data: any): Promise<string> {
    try {
      const templateContent = await this.loadTemplate(templatePath);
      const compiled = this.compileTemplate(templateContent);
      return compiled(data);
    } catch (error) {
      throw new Error(`Failed to render template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Render template from string content
   */
  async renderTemplateString(templateContent: string, data: any): Promise<string> {
    try {
      const compiled = this.compileTemplate(templateContent);
      return compiled(data);
    } catch (error) {
      throw new Error(`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of available templates by type
   */
  async getAvailableTemplates(type?: string): Promise<string[]> {
    try {
      let searchDir = this.templatesDir;

      if (type) {
        searchDir = path.join(this.templatesDir, type);
      }

      if (!fs.existsSync(searchDir)) {
        return [];
      }

      const templates: string[] = [];

      const walkDir = (dir: string, prefix: string = '') => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = prefix ? `${prefix}/${item}` : item;

          if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, relativePath);
          } else if (item.endsWith('.hbs')) {
            templates.push(relativePath);
          }
        }
      };

      walkDir(searchDir);
      return templates.sort();
    } catch (error) {
      throw new Error(`Failed to get available templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get template structure (available by type)
   */
  async getTemplateStructure(): Promise<Record<string, string[]>> {
    try {
      const structure: Record<string, string[]> = {};
      const items = fs.readdirSync(this.templatesDir);

      for (const item of items) {
        const fullPath = path.join(this.templatesDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          structure[item] = await this.getAvailableTemplates(item);
        }
      }

      return structure;
    } catch (error) {
      throw new Error(`Failed to get template structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cache compiled template for reuse
   */
  cacheTemplate(templatePath: string, compiled: TemplateDelegate): void {
    this.compiledTemplates.set(templatePath, compiled);
  }

  /**
   * Get cached template
   */
  getCachedTemplate(templatePath: string): TemplateDelegate | undefined {
    return this.compiledTemplates.get(templatePath);
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
  }

  /**
   * Set templates directory
   */
  setTemplatesDir(dir: string): void {
    this.templatesDir = dir;
    this.clearCache();
  }

  /**
   * Get current templates directory
   */
  getTemplatesDir(): string {
    return this.templatesDir;
  }
}

/**
 * Export singleton instance
 */
export const templateLoader = new TemplateLoader(
  path.join(__dirname, '../../templates')
);
