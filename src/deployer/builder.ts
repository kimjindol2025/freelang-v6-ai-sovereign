/**
 * Builder
 * 빌드 자동화
 *
 * 프로세스:
 * 검증 → npm install → TypeScript 컴파일 → Docker 빌드
 */

import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

export interface BuildConfig {
  projectRoot: string;
  outputDir: string;
  dockerize: boolean;
  sourceMap: boolean;
}

export interface BuildResult {
  success: boolean;
  duration: number;
  steps: Map<string, { status: "success" | "failed" | "skipped"; error?: string }>;
  artifacts: string[];
}

export class Builder {
  async build(config: BuildConfig): Promise<BuildResult> {
    const startTime = Date.now();
    const steps = new Map<string, { status: "success" | "failed" | "skipped"; error?: string }>();
    const artifacts: string[] = [];

    try {
      console.log("🔨 Building project...");

      // Step 1: Validate
      console.log("📋 Validating project...");
      if (!this.validateProject(config.projectRoot)) {
        console.error("❌ Project validation failed");
        steps.set("validate", { status: "failed", error: "Missing required files" });
        return {
          success: false,
          duration: Date.now() - startTime,
          steps,
          artifacts: [],
        };
      }
      console.log("✅ Project validated");
      steps.set("validate", { status: "success" });

      // Step 2: Install dependencies
      console.log("📦 Installing dependencies...");
      try {
        this.runCommand("npm install", config.projectRoot);
        console.log("✅ Dependencies installed");
        steps.set("install", { status: "success" });
        artifacts.push(`${config.projectRoot}/node_modules`);
      } catch (error) {
        console.error("❌ npm install failed");
        steps.set("install", { status: "failed", error: String(error) });
        return {
          success: false,
          duration: Date.now() - startTime,
          steps,
          artifacts,
        };
      }

      // Step 3: Compile TypeScript
      console.log("🔄 Compiling TypeScript...");
      try {
        this.runCommand("npm run build", config.projectRoot);
        console.log("✅ TypeScript compiled");
        steps.set("compile", { status: "success" });
        artifacts.push(`${config.projectRoot}/${config.outputDir}`);
      } catch (error) {
        console.error("❌ TypeScript compilation failed");
        steps.set("compile", { status: "failed", error: String(error) });
        return {
          success: false,
          duration: Date.now() - startTime,
          steps,
          artifacts,
        };
      }

      // Step 4: Docker build (optional)
      if (config.dockerize) {
        console.log("🐳 Building Docker image...");
        try {
          this.runCommand("docker build -t myapp:latest .", config.projectRoot);
          console.log("✅ Docker image built");
          steps.set("docker", { status: "success" });
        } catch (error) {
          console.warn("⚠️  Docker build skipped or failed (non-fatal)");
          steps.set("docker", { status: "failed", error: String(error) });
          // Don't fail the entire build if Docker fails
        }
      } else {
        steps.set("docker", { status: "skipped" });
      }

      // Success
      const duration = Date.now() - startTime;
      console.log(`\n✅ Build completed in ${duration}ms`);

      return {
        success: true,
        duration,
        steps,
        artifacts,
      };
    } catch (error) {
      console.error("❌ Build failed:", error);
      return {
        success: false,
        duration: Date.now() - startTime,
        steps,
        artifacts,
      };
    }
  }

  private validateProject(projectRoot: string): boolean {
    // Check if project root exists
    if (!fs.existsSync(projectRoot)) {
      console.error(`❌ Project root not found: ${projectRoot}`);
      return false;
    }

    const requiredFiles = [
      "package.json",
      "tsconfig.json",
      "src",
    ];

    const missing: string[] = [];
    for (const file of requiredFiles) {
      const filePath = path.join(projectRoot, file);
      if (!fs.existsSync(filePath)) {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      console.error(`❌ Missing required files: ${missing.join(", ")}`);
      return false;
    }

    return true;
  }

  private runCommand(command: string, cwd: string): string {
    try {
      // 명령어와 인자를 안전하게 분리
      const parts = command.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      const result = spawnSync(cmd, args, {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        console.error(`❌ Command failed: ${command}`);
        if (result.stdout) console.error("STDOUT:", result.stdout);
        if (result.stderr) console.error("STDERR:", result.stderr);
        throw new Error(`Command execution failed with status ${result.status}: ${command}`);
      }

      return result.stdout || "";
    } catch (error) {
      console.error(`❌ Command failed: ${command}`);
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      throw new Error(`Command execution failed: ${command}`);
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
    console.log("\n📊 Build result:", {
      success: result.success,
      duration: `${result.duration}ms`,
      steps: Object.fromEntries(result.steps),
      artifacts: result.artifacts,
    });
  })();
}
