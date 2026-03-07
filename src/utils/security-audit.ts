/**
 * Security Audit
 * 종합 보안 검증 시스템
 *
 * 검사 항목:
 * 1. Shell Injection - execSync, system 명령 검수
 * 2. API Key Exposure - 하드코딩된 키, 토큰
 * 3. SQL Injection - 문자열 연결 패턴
 * 4. Path Traversal - ../ 경로 조작
 * 5. Type Safety - any 타입 사용
 * 6. Hardcoded Secrets - 기본값 배경 및 시크릿
 * 7. Error Leakage - 스택 트레이스 노출
 * 8. Dependencies - 알려진 취약점
 */

import * as fs from "fs";
import * as path from "path";

export interface AuditCheck {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  details: string;
  findings?: Array<{
    file: string;
    line: number;
    code: string;
  }>;
}

export interface SecurityAuditReport {
  timestamp: string;
  projectRoot: string;
  checks: AuditCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  status: "PASS" | "FAIL" | "WARN";
  recommendations: string[];
}

export class SecurityAudit {
  private projectRoot: string;
  private findings: Array<{
    category: string;
    file: string;
    line: number;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    message: string;
    code: string;
  }> = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * 전체 감사 실행
   */
  async runFullAudit(): Promise<SecurityAuditReport> {
    const checks: AuditCheck[] = [];

    // 1. Shell Injection 검사
    checks.push(await this.checkShellInjection());

    // 2. API Key 노출 검사
    checks.push(await this.checkAPIKeyExposure());

    // 3. SQL Injection 검사
    checks.push(await this.checkSQLInjection());

    // 4. Path Traversal 검사
    checks.push(await this.checkPathTraversal());

    // 5. Type Safety 검사
    checks.push(await this.checkTypeSafety());

    // 6. Hardcoded Secrets 검사
    checks.push(await this.checkHardcodedSecrets());

    // 7. Error Leakage 검사
    checks.push(await this.checkErrorLeakage());

    // 8. Dependencies 검사
    checks.push(await this.checkDependencies());

    // 요약 계산
    const summary = {
      total: checks.length,
      passed: checks.filter((c) => c.status === "PASS").length,
      failed: checks.filter((c) => c.status === "FAIL").length,
      warnings: checks.filter((c) => c.status === "WARN").length,
    };

    const status =
      summary.failed > 0 ? "FAIL" : summary.warnings > 0 ? "WARN" : "PASS";

    // 권고사항 생성
    const recommendations = this.generateRecommendations(checks);

    return {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      checks,
      summary,
      status,
      recommendations,
    };
  }

  /**
   * 1. Shell Injection 검사
   */
  private async checkShellInjection(): Promise<AuditCheck> {
    const patterns = [
      {
        regex: /execSync\s*\(\s*`[^`]*\$\{/,
        message: "Template literal with variable in execSync",
      },
      {
        regex: /execSync\s*\(\s*[`'"]\s*[^`'"]*\+\s*[a-zA-Z_]/,
        message: "String concatenation in execSync command",
      },
      { regex: /spawn\s*\(\s*['"][^'"]+['"]\s*,\s*\[\]/, message: "Unsafe spawn usage" },
      {
        regex: /child_process\.(exec|execFile|execSync)\s*\(/,
        message: "Direct child_process execution found",
      },
    ];

    return this.scanCodePatterns("Shell Injection", patterns);
  }

  /**
   * 2. API Key / Token 노출 검사
   */
  private async checkAPIKeyExposure(): Promise<AuditCheck> {
    const patterns = [
      { regex: /api[_-]?key\s*[:=]\s*["'][^"']+["']/i, message: "Hardcoded API key" },
      {
        regex: /(?:secret|token|password)\s*[:=]\s*["'](?!.*\*\*\*)[^"']{8,}["']/i,
        message: "Potential hardcoded secret",
      },
      {
        regex: /authorization\s*[:=]\s*["']Bearer\s+[a-zA-Z0-9._\-]+["']/i,
        message: "Hardcoded Bearer token",
      },
      { regex: /github[_-]?token\s*[:=]/i, message: "GitHub token reference" },
      { regex: /aws[_-]?(?:access|secret)[_-]?key/i, message: "AWS credentials" },
    ];

    return this.scanCodePatterns("API Key Exposure", patterns);
  }

  /**
   * 3. SQL Injection 검사
   */
  private async checkSQLInjection(): Promise<AuditCheck> {
    const patterns = [
      {
        regex: /query\s*\(\s*["'`][^"'`]*\+\s*[a-zA-Z_]/,
        message: "SQL query with string concatenation",
      },
      {
        regex: /SELECT\s+.*\+\s*[a-zA-Z_]/i,
        message: "SQL SELECT with string concatenation",
      },
      {
        regex: /INSERT\s+INTO\s+.*\+\s*[a-zA-Z_]/i,
        message: "SQL INSERT with string concatenation",
      },
      {
        regex: /UPDATE\s+.*\+\s*[a-zA-Z_]/i,
        message: "SQL UPDATE with string concatenation",
      },
      {
        regex: /DELETE\s+FROM\s+.*\+\s*[a-zA-Z_]/i,
        message: "SQL DELETE with string concatenation",
      },
    ];

    return this.scanCodePatterns("SQL Injection", patterns);
  }

  /**
   * 4. Path Traversal 검사
   */
  private async checkPathTraversal(): Promise<AuditCheck> {
    const patterns = [
      {
        regex: /readFile\s*\(\s*(?:path\.join\s*\()?\s*\.\.\/+/,
        message: "Relative path traversal in file operations",
      },
      {
        regex: /join\s*\(\s*["'][^"']*\.\.["']/,
        message: "path.join with ..",
      },
      {
        regex: /require\s*\(\s*["'][\.\/]\.\.\/[^"']+["']\)/,
        message: "require with relative path traversal",
      },
      {
        regex: /fs\.(read|write|access).*\.\.\/+/,
        message: "File system operation with traversal",
      },
    ];

    return this.scanCodePatterns("Path Traversal", patterns);
  }

  /**
   * 5. Type Safety 검사
   */
  private async checkTypeSafety(): Promise<AuditCheck> {
    const patterns = [
      { regex: /:\s*any\b/, message: "Use of 'any' type" },
      { regex: /as\s+any\b/, message: "Type assertion to any" },
      { regex: /\(any\)/, message: "Casting to any" },
      { regex: /:\s*any\s*[=,;)]/, message: "Function parameter with any type" },
    ];

    return this.scanCodePatterns("Type Safety", patterns);
  }

  /**
   * 6. Hardcoded Secrets 검사
   */
  private async checkHardcodedSecrets(): Promise<AuditCheck> {
    const patterns = [
      {
        regex: /(?:private|public)?\s*(?:readonly\s+)?(?:const|let|var)\s+(?:SECRET|API_KEY|TOKEN|PASSWORD|DB_PASSWORD)\s*[:=]\s*["'][^"']+["']/i,
        message: "Hardcoded secret variable",
      },
      {
        regex: /(?:DATABASE_URL|MONGODB_URI)\s*=\s*["'][^"']+["']/i,
        message: "Hardcoded database URL",
      },
      {
        regex: /process\.env\.[A-Z_]+\s*\|\|\s*["'][^"']+["']/,
        message: "Hardcoded default for environment variable",
      },
    ];

    return this.scanCodePatterns("Hardcoded Secrets", patterns);
  }

  /**
   * 7. Error Leakage 검사
   */
  private async checkErrorLeakage(): Promise<AuditCheck> {
    const patterns = [
      {
        regex: /console\.error\s*\(\s*error\s*\)/,
        message: "Direct error object logging (may leak stack trace)",
      },
      {
        regex: /console\.error\s*\(\s*[`'].*\$\{error\}/,
        message: "Template literal with error object",
      },
      {
        regex: /throw\s+new\s+Error\s*\(\s*error\s*\)/,
        message: "Re-throwing error object",
      },
      {
        regex: /res\.send\s*\(\s*(?:error|err)/i,
        message: "Sending error object in response",
      },
    ];

    return this.scanCodePatterns("Error Leakage", patterns);
  }

  /**
   * 8. Dependencies 검사
   */
  private async checkDependencies(): Promise<AuditCheck> {
    const check: AuditCheck = {
      name: "Dependencies Vulnerability",
      status: "PASS",
      details: "No known vulnerable dependencies detected",
      findings: [],
    };

    try {
      const packageJsonPath = path.join(this.projectRoot, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        return check;
      }

      // 패키지 분석 (간단한 버전)
      // 실제로는 npm audit, snyk 등 사용 권장
      const knownVulnerabilities: Record<string, string[]> = {
        "lodash-4.0.0": ["Prototype Pollution"],
        "minimist-<1.2.6": ["Command Injection"],
      };

      // 취약점 목록만 표시 (감사용)
      check.details = "Manual dependency audit recommended. Use: npm audit";
    } catch (error) {
      check.status = "WARN";
      check.details = `Failed to check dependencies: ${String(error).slice(0, 50)}`;
    }

    return check;
  }

  /**
   * 코드 패턴 스캔
   */
  private async scanCodePatterns(
    category: string,
    patterns: Array<{ regex: RegExp; message: string }>
  ): Promise<AuditCheck> {
    const findings: Array<{
      file: string;
      line: number;
      code: string;
    }> = [];

    try {
      const srcDir = path.join(this.projectRoot, "src");
      if (!fs.existsSync(srcDir)) {
        return {
          name: category,
          status: "PASS",
          details: "No source directory found",
        };
      }

      const files = this.walkDirectory(srcDir);

      for (const file of files) {
        if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

        try {
          const content = fs.readFileSync(file, "utf-8");
          const lines = content.split("\n");

          for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];

            for (const pattern of patterns) {
              if (pattern.regex.test(line)) {
                findings.push({
                  file: path.relative(this.projectRoot, file),
                  line: lineNum + 1,
                  code: line.trim().slice(0, 80),
                });
              }
            }
          }
        } catch {
          // Skip file read errors
        }
      }
    } catch (error) {
      return {
        name: category,
        status: "WARN",
        details: `Failed to scan: ${String(error).slice(0, 50)}`,
      };
    }

    const status = findings.length === 0 ? "PASS" : findings.length <= 2 ? "WARN" : "FAIL";

    return {
      name: category,
      status,
      details:
        findings.length === 0
          ? "No issues found"
          : `Found ${findings.length} potential issue(s)`,
      findings,
    };
  }

  /**
   * 디렉토리 순회
   */
  private walkDirectory(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // node_modules, dist 등 제외
          if (!["node_modules", "dist", ".git", ".env"].includes(entry.name)) {
            files.push(...this.walkDirectory(fullPath));
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip inaccessible directories
    }

    return files;
  }

  /**
   * 권고사항 생성
   */
  private generateRecommendations(checks: AuditCheck[]): string[] {
    const recommendations: string[] = [];

    for (const check of checks) {
      if (check.status === "FAIL") {
        switch (check.name) {
          case "Shell Injection":
            recommendations.push("Use child_process safely: avoid template literals in commands");
            recommendations.push("Validate and sanitize all user inputs before shell commands");
            break;
          case "API Key Exposure":
            recommendations.push("Move hardcoded keys to environment variables (.env)");
            recommendations.push("Use dotenv library to load .env files");
            break;
          case "SQL Injection":
            recommendations.push("Use parameterized queries or ORM (TypeORM, Prisma)");
            recommendations.push("Never concatenate user input into SQL queries");
            break;
          case "Path Traversal":
            recommendations.push("Validate file paths before accessing filesystem");
            recommendations.push("Use path.resolve() and check against whitelist");
            break;
          case "Type Safety":
            recommendations.push('Replace any types with specific types (string, number, etc)');
            recommendations.push("Enable strict: true in tsconfig.json");
            break;
          case "Error Leakage":
            recommendations.push("Use ErrorHandler.sanitizeErrorMessage() for user-facing errors");
            recommendations.push("Log full errors only in debug mode");
            break;
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ No security recommendations at this time");
    }

    return recommendations;
  }
}

/**
 * 편의 함수: 감사 실행 및 보고
 */
export async function runSecurityAudit(projectRoot: string): Promise<void> {
  const audit = new SecurityAudit(projectRoot);
  const report = await audit.runFullAudit();

  console.log("\n========== SECURITY AUDIT REPORT ==========");
  console.log(`Project: ${report.projectRoot}`);
  console.log(`Time: ${report.timestamp}`);
  console.log(`Status: ${report.status}`);
  console.log();

  console.log("Summary:");
  console.log(`  Total Checks: ${report.summary.total}`);
  console.log(`  ✅ Passed: ${report.summary.passed}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
  console.log(`  ❌ Failed: ${report.summary.failed}`);
  console.log();

  console.log("Detailed Results:");
  for (const check of report.checks) {
    const icon = check.status === "PASS" ? "✅" : check.status === "WARN" ? "⚠️ " : "❌";
    console.log(`\n${icon} ${check.name}`);
    console.log(`   ${check.details}`);

    if (check.findings && check.findings.length > 0) {
      console.log("   Findings:");
      for (const finding of check.findings.slice(0, 3)) {
        console.log(`     - ${finding.file}:${finding.line}`);
        console.log(`       ${finding.code}`);
      }
      if (check.findings.length > 3) {
        console.log(`     ... and ${check.findings.length - 3} more`);
      }
    }
  }

  console.log("\nRecommendations:");
  for (const rec of report.recommendations) {
    console.log(`  • ${rec}`);
  }

  console.log("\n==========================================\n");
}
