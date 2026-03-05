/**
 * Project Structure Generator
 * CodeGenRequest → 폴더 구조 생성
 * 
 * Example:
 * {intent: "create_api", project_type: "api", ...}
 * → /generated/my-api/src/, /generated/my-api/tests/, ...
 */

import * as fs from "fs";
import * as path from "path";

export interface CodeGenRequest {
  intent: string;
  project_type: "api" | "web" | "cli" | "service";
  project_name: string;
  features: Array<{ name: string; operations: string[] }>;
  tech_stack: Record<string, string>;
  requirements: Record<string, boolean>;
}

export interface ProjectStructure {
  name: string;
  root: string;
  folders: string[];
  files: Map<string, string>; // path → content
}

export class StructureGenerator {
  async generate(request: CodeGenRequest): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      name: request.project_name,
      root: `/generated/${request.project_name}`,
      folders: this.generateFolders(request),
      files: new Map(),
    };

    return structure;
  }

  private generateFolders(request: CodeGenRequest): string[] {
    const baseFolder = [
      "src",
      "tests",
      "docs",
      "database",
      ".github/workflows",
    ];

    if (request.project_type === "api") {
      return [
        ...baseFolder,
        "src/routes",
        "src/models",
        "src/middleware",
        "src/auth",
      ];
    } else if (request.project_type === "web") {
      return [
        ...baseFolder,
        "src/components",
        "src/pages",
        "src/hooks",
        "src/styles",
      ];
    } else if (request.project_type === "cli") {
      return [
        ...baseFolder,
        "src/commands",
        "src/lib",
        "src/utils",
        "bin",
      ];
    }

    return baseFolder;
  }

  async createOnDisk(structure: ProjectStructure): Promise<void> {
    const root = structure.root;
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }

    for (const folder of structure.folders) {
      const folderPath = path.join(root, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }

    for (const [filePath, content] of structure.files.entries()) {
      const fullPath = path.join(root, filePath);
      fs.writeFileSync(fullPath, content);
    }
  }
}

// Test
if (require.main === module) {
  (async () => {
    const generator = new StructureGenerator();
    const request: CodeGenRequest = {
      intent: "create_api",
      project_type: "api",
      project_name: "my-api",
      features: [{ name: "user_management", operations: ["create", "read"] }],
      tech_stack: { backend: "express", database: "postgresql" },
      requirements: { auth: true },
    };
    const structure = await generator.generate(request);
    console.log("Generated Structure:", {
      name: structure.name,
      folders: structure.folders,
    });
  })();
}
