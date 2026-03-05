/**
 * Dockerfile Generator
 * Docker 자동화
 *
 * 역할:
 * 1. Express API용 Dockerfile 생성
 * 2. React 웹앱용 Dockerfile 생성
 * 3. docker-compose.yml 생성
 */

import * as fs from "fs";
import * as path from "path";

export interface DockerServiceConfig {
  name: string;
  port: number;
  environment?: Record<string, string>;
  volumes?: Record<string, string>;
  depends_on?: string[];
}

export interface DockerComposeConfig {
  version?: string;
  services: DockerServiceConfig[];
  networks?: Record<string, { driver: string }>;
  volumes?: Record<string, any>;
}

const DOCKERFILE_API = `# Node.js API Server
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY dist ./dist
COPY database ./database

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "dist/server.js"]
`;

const DOCKERFILE_WEB = `# React Web App
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build app
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Start server
CMD ["serve", "-s", "build", "-l", "3000"]
`;

const DOCKERFILE_WEB_NGINX = `# React Web App with Nginx
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build app
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;

const NGINX_CONF = `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(?:css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
`;

export class DockerfileGenerator {
  /**
   * Express API용 Dockerfile 생성
   */
  generateApiDockerfile(projectRoot: string): void {
    try {
      const dockerfilePath = path.join(projectRoot, "Dockerfile");

      fs.writeFileSync(dockerfilePath, DOCKERFILE_API, { encoding: "utf-8" });
      console.log(`✅ Generated Dockerfile for API: ${dockerfilePath}`);
    } catch (error) {
      console.error(`❌ Failed to generate API Dockerfile: ${error}`);
      throw error;
    }
  }

  /**
   * React 웹앱용 Dockerfile 생성
   */
  generateWebDockerfile(projectRoot: string, useNginx: boolean = false): void {
    try {
      const dockerfilePath = path.join(projectRoot, "Dockerfile");
      const content = useNginx ? DOCKERFILE_WEB_NGINX : DOCKERFILE_WEB;

      fs.writeFileSync(dockerfilePath, content, { encoding: "utf-8" });
      console.log(`✅ Generated Dockerfile for Web App (${useNginx ? "Nginx" : "Serve"}): ${dockerfilePath}`);

      // Generate nginx.conf if using Nginx
      if (useNginx) {
        const nginxPath = path.join(projectRoot, "nginx.conf");
        fs.writeFileSync(nginxPath, NGINX_CONF, { encoding: "utf-8" });
        console.log(`✅ Generated nginx.conf: ${nginxPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate Web Dockerfile: ${error}`);
      throw error;
    }
  }

  /**
   * docker-compose.yml 생성
   */
  generateDockerCompose(config: DockerComposeConfig, outputPath: string): void {
    try {
      const compose: Record<string, any> = {
        version: config.version || "3.8",
        services: {},
      };

      // Generate services
      for (const service of config.services) {
        compose.services[service.name] = {
          build: ".",
          ports: [`${service.port}:${service.port}`],
          environment: service.environment || {},
        };

        if (service.volumes) {
          compose.services[service.name].volumes = Object.entries(service.volumes).map(
            ([host, container]) => `${host}:${container}`
          );
        }

        if (service.depends_on) {
          compose.services[service.name].depends_on = service.depends_on;
        }
      }

      // Add networks if specified
      if (config.networks) {
        compose.networks = config.networks;
      }

      // Add volumes if specified
      if (config.volumes) {
        compose.volumes = config.volumes;
      }

      // Convert to YAML format
      const yaml = this.toYaml(compose);

      // Create directory if not exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, yaml, { encoding: "utf-8" });
      console.log(`✅ Generated docker-compose.yml: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate docker-compose.yml: ${error}`);
      throw error;
    }
  }

  /**
   * .dockerignore 파일 생성
   */
  generateDockerignore(projectRoot: string): void {
    try {
      const content = `node_modules
npm-debug.log
dist
build
.git
.gitignore
README.md
.env
.env.local
.DS_Store
.vscode
.idea
*.log
coverage
.nyc_output
`;

      const dockerignorePath = path.join(projectRoot, ".dockerignore");
      fs.writeFileSync(dockerignorePath, content, { encoding: "utf-8" });
      console.log(`✅ Generated .dockerignore: ${dockerignorePath}`);
    } catch (error) {
      console.error(`❌ Failed to generate .dockerignore: ${error}`);
      throw error;
    }
  }

  /**
   * Simple YAML generator (no dependencies required)
   */
  private toYaml(obj: any, indent: number = 0): string {
    const spaces = " ".repeat(indent);
    let yaml = "";

    if (Array.isArray(obj)) {
      for (const item of obj) {
        yaml += `${spaces}- ${typeof item === "object" ? "\n" : ""}`;
        if (typeof item === "object") {
          yaml += this.toYaml(item, indent + 2);
        } else {
          yaml += `${item}\n`;
        }
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && !Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          yaml += this.toYaml(value, indent + 2);
        } else if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          for (const item of value) {
            if (typeof item === "object") {
              yaml += `${spaces}  - `;
              yaml += this.toYaml(item, indent + 4);
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          }
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      }
    } else {
      yaml += `${spaces}${obj}\n`;
    }

    return yaml;
  }
}

// Test
if (require.main === module) {
  const generator = new DockerfileGenerator();

  console.log("\n🐳 Test 1: Generate API Dockerfile");
  generator.generateApiDockerfile("/tmp/api-project");

  console.log("\n🐳 Test 2: Generate Web Dockerfile (Serve)");
  generator.generateWebDockerfile("/tmp/web-project", false);

  console.log("\n🐳 Test 3: Generate Web Dockerfile (Nginx)");
  generator.generateWebDockerfile("/tmp/web-nginx", true);

  console.log("\n🐳 Test 4: Generate docker-compose.yml");
  const composeConfig: DockerComposeConfig = {
    version: "3.8",
    services: [
      {
        name: "api",
        port: 3000,
        environment: {
          NODE_ENV: "production",
          DATABASE_URL: "postgresql://user:pass@db:5432/app",
        },
        depends_on: ["db"],
      },
      {
        name: "db",
        port: 5432,
        environment: {
          POSTGRES_PASSWORD: "password",
          POSTGRES_DB: "app",
        },
      },
    ],
  };
  generator.generateDockerCompose(composeConfig, "/tmp/docker-compose.yml");

  console.log("\n🐳 Test 5: Generate .dockerignore");
  generator.generateDockerignore("/tmp/project");
}
