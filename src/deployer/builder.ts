/**
 * Builder
 * 빌드 자동화
 * 
 * 프로세스:
 * 검증 → npm install → TypeScript 컴파일 → Docker 빌드
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface BuildConfig {
  projectRoot: string;
  outputDir: string;
  dockerize: boolean;
  sourceMap: boolean;
}

export class Builder {
  async build(config: BuildConfig): Promise<boolean> {
    try {
      console.log("🔨 Building project...");

      // Step 1: Validate
      if (!this.validateProject(config.projectRoot)) {
        console.error("❌ Project validation failed");
        return false;
      }
      console.log("✅ Project validated");

      // Step 2: Install dependencies
      console.log("📦 Installing dependencies...");
      this.runCommand("npm install", config.projectRoot);
      console.log("✅ Dependencies installed");

      // Step 3: Compile TypeScript
      console.log("🔄 Compiling TypeScript...");
      this.runCommand("npm run build", config.projectRoot);
      console.log("✅ TypeScript compiled");

      // Step 4: Docker build (optional)
      if (config.dockerize) {
        console.log("🐳 Building Docker image...");
        this.runCommand("docker build -t myapp:latest .", config.projectRoot);
        console.log("✅ Docker image built");
      }

      return true;
    } catch (error) {
      console.error("Build failed:", error);
      return false;
    }
  }

  private validateProject(projectRoot: string): boolean {
    const requiredFiles = [
      "package.json",
      "tsconfig.json",
      "src",
    ];

    return requiredFiles.every((file) =>
      fs.existsSync(path.join(projectRoot, file))
    );
  }

  private runCommand(command: string, cwd: string): string {
    try {
      return execSync(command, { cwd, encoding: "utf-8" });
    } catch (error) {
      console.error(`Command failed: ${command}`);
      throw error;
    }
  }
}

// Test
if (require.main === module) {
  (async () => {
    const builder = new Builder();
    const result = await builder.build({
      projectRoot: "./generated/my-api",
      outputDir: "./dist",
      dockerize: false,
      sourceMap: true,
    });
    console.log("Build result:", result);
  })();
}
