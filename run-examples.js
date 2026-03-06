#!/usr/bin/env node

/**
 * CLAUDELang v6.0 예제 실행 스크립트
 *
 * 기능:
 * - examples/*.json 자동 검사
 * - 순서대로 실행
 * - 결과 기록
 * - 보고서 생성
 */

const fs = require('fs');
const path = require('path');
const { CLAUDELang } = require('./src/index.js');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * 예제 실행기
 */
class ExampleRunner {
  constructor(examplesDir = './examples') {
    this.examplesDir = examplesDir;
    this.claudeLang = new CLAUDELang();
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * 모든 예제 파일 찾기
   */
  findExamples() {
    const files = fs.readdirSync(this.examplesDir)
      .filter(f => f.endsWith('.json') && f !== 'package.json')
      .sort();

    return files.map(f => ({
      name: path.basename(f, '.json'),
      path: path.join(this.examplesDir, f),
    }));
  }

  /**
   * 예제 실행
   */
  async runExample(example) {
    console.log(`\n${colors.cyan}실행: ${example.name}${colors.reset}`);
    console.log(`파일: ${example.path}`);

    const result = this.claudeLang.runFile(example.path);

    const status = result.success
      ? `${colors.green}✅ 성공${colors.reset}`
      : `${colors.red}❌ 실패${colors.reset}`;

    console.log(`상태: ${status}`);

    if (result.success) {
      console.log(`실행 시간: ${result.executionTime}ms`);
      console.log(`메모리 사용량: ${result.memoryUsage.toFixed(4)}MB`);
      console.log(`명령어 개수: ${result.instructionCount}`);

      if (result.output && result.output.length > 0) {
        console.log(`\n출력 (첫 500자):`);
        const outputStr = result.output.join('\n');
        console.log(
          `${colors.blue}${outputStr.substring(0, 500)}${
            outputStr.length > 500 ? '...' : ''
          }${colors.reset}`
        );
      }

      if (result.result !== undefined) {
        console.log(`\n결과값:`);
        console.log(
          `${colors.magenta}${JSON.stringify(result.result, null, 2).substring(0, 200)}${colors.reset}`
        );
      }
    } else {
      console.log(`${colors.red}에러: ${result.error}${colors.reset}`);
    }

    return result;
  }

  /**
   * 모든 예제 실행
   */
  async runAll() {
    console.log(
      `\n${colors.yellow}${'═'.repeat(60)}${colors.reset}`
    );
    console.log(
      `${colors.yellow}CLAUDELang v6.0 예제 실행${colors.reset}`
    );
    console.log(
      `${colors.yellow}${'═'.repeat(60)}${colors.reset}`
    );

    const examples = this.findExamples();
    console.log(`\n총 ${examples.length}개의 예제 발견\n`);

    for (const example of examples) {
      const result = await this.runExample(example);
      this.results.push({
        ...example,
        ...result,
      });
    }

    this.printSummary();
    this.saveReport();
  }

  /**
   * 요약 출력
   */
  printSummary() {
    console.log(
      `\n\n${colors.blue}${'═'.repeat(60)}${colors.reset}`
    );
    console.log(`${colors.blue}실행 요약${colors.reset}`);
    console.log(
      `${colors.blue}${'═'.repeat(60)}${colors.reset}\n`
    );

    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;
    const totalTime = Date.now() - this.startTime;

    console.log(`전체 예제: ${this.results.length}`);
    console.log(`${colors.green}성공: ${successCount}${colors.reset}`);
    console.log(`${colors.red}실패: ${failureCount}${colors.reset}`);
    console.log(`총 실행 시간: ${totalTime}ms\n`);

    // 성공한 예제 목록
    if (successCount > 0) {
      console.log(`${colors.green}성공한 예제:${colors.reset}`);
      this.results
        .filter(r => r.success)
        .forEach(r => {
          console.log(`  ✅ ${r.name}`);
          console.log(
            `     - 시간: ${r.executionTime}ms, 메모리: ${r.memoryUsage.toFixed(4)}MB`
          );
        });
    }

    // 실패한 예제 목록
    if (failureCount > 0) {
      console.log(`\n${colors.red}실패한 예제:${colors.reset}`);
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     - 에러: ${r.error}`);
        });
    }

    // 성능 통계
    console.log(`\n${colors.cyan}성능 통계:${colors.reset}`);
    const successResults = this.results.filter(r => r.success);
    if (successResults.length > 0) {
      const avgTime = successResults.reduce((sum, r) => sum + r.executionTime, 0)
        / successResults.length;
      const maxTime = Math.max(...successResults.map(r => r.executionTime));
      const minTime = Math.min(...successResults.map(r => r.executionTime));
      const totalMem = successResults.reduce((sum, r) => sum + r.memoryUsage, 0);

      console.log(`  평균 실행 시간: ${avgTime.toFixed(2)}ms`);
      console.log(`  최대 실행 시간: ${maxTime}ms`);
      console.log(`  최소 실행 시간: ${minTime}ms`);
      console.log(`  총 메모리 사용: ${totalMem.toFixed(4)}MB`);
    }

    console.log('');
  }

  /**
   * 보고서 저장
   */
  saveReport() {
    const reportDir = './run-examples-results';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `report-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - this.startTime,
      successCount: this.results.filter(r => r.success).length,
      failureCount: this.results.filter(r => !r.success).length,
      results: this.results.map(r => ({
        name: r.name,
        success: r.success,
        executionTime: r.executionTime,
        memoryUsage: r.memoryUsage,
        instructionCount: r.instructionCount,
        error: r.error,
        outputLength: r.output ? r.output.length : 0,
      })),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`${colors.cyan}보고서 저장: ${reportPath}${colors.reset}`);

    // 최신 보고서 링크 생성
    const latestPath = path.join(reportDir, 'latest-report.json');
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  }
}

/**
 * 메인 실행
 */
async function main() {
  const examplesDir = process.argv[2] || './examples';

  // 디렉토리 확인
  if (!fs.existsSync(examplesDir)) {
    console.error(
      `${colors.red}에러: 디렉토리를 찾을 수 없음: ${examplesDir}${colors.reset}`
    );
    process.exit(1);
  }

  const runner = new ExampleRunner(examplesDir);
  await runner.runAll();
}

// 실행
main().catch(error => {
  console.error(`${colors.red}오류: ${error.message}${colors.reset}`);
  process.exit(1);
});
