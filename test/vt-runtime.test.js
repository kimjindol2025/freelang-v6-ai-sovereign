/**
 * VT Runtime Bridge - 통합 테스트
 * 모든 예제 파일에 대한 테스트
 */

const fs = require('fs');
const path = require('path');
const CLAUDELangCompiler = require('../src/compiler');
const { VTRuntimeBridge } = require('../src/vt-runtime-bridge');

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

class TestRunner {
  constructor() {
    this.compiler = new CLAUDELangCompiler();
    this.bridge = new VTRuntimeBridge();
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.results = [];
  }

  /**
   * 단일 테스트 실행
   */
  runTest(name, jsonPath, expectedBehavior = null) {
    this.testCount++;
    const relPath = path.relative(process.cwd(), jsonPath);

    try {
      // JSON 파일 읽기
      const content = fs.readFileSync(jsonPath, 'utf8');
      const json = JSON.parse(content);

      // 컴파일
      const compiled = this.compiler.compile(json);

      if (!compiled.success) {
        log('red', `✗ ${name}`);
        log('red', `  Compilation failed: ${compiled.errors.join(', ')}`);
        this.failCount++;
        this.results.push({
          name,
          status: 'FAILED',
          reason: `Compilation: ${compiled.errors[0]}`
        });
        return;
      }

      // 실행
      const result = this.bridge.execute(compiled.code);

      if (!result.success) {
        log('red', `✗ ${name}`);
        log('red', `  Execution failed: ${result.errors.join(', ')}`);
        this.failCount++;
        this.results.push({
          name,
          status: 'FAILED',
          reason: `Execution: ${result.errors[0]}`
        });
        return;
      }

      // 성공
      log('green', `✓ ${name}`);
      this.passCount++;
      this.results.push({
        name,
        status: 'PASSED',
        result: result.result,
        memory: result.memory
      });

      // 메모리 초기화
      this.bridge.clearMemory();
    } catch (error) {
      log('red', `✗ ${name}`);
      log('red', `  Error: ${error.message}`);
      this.failCount++;
      this.results.push({
        name,
        status: 'ERROR',
        reason: error.message
      });
    }
  }

  /**
   * 모든 테스트 실행
   */
  runAll() {
    const examplesDir = path.join(__dirname, '..', 'examples');

    log('cyan', '\n╔════════════════════════════════════════════╗');
    log('cyan', '║  CLAUDELang v6.0 - VT Runtime Tests      ║');
    log('cyan', '╚════════════════════════════════════════════╝\n');

    // 예제 파일 찾기
    const files = fs.readdirSync(examplesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    log('blue', `Found ${files.length} test files\n`);

    // 각 파일 실행
    files.forEach(file => {
      const filepath = path.join(examplesDir, file);
      const testName = file.replace('.json', '');
      this.runTest(testName, filepath);
    });

    // 결과 요약
    this.printSummary();
  }

  /**
   * 결과 요약 출력
   */
  printSummary() {
    log('cyan', '\n╔════════════════════════════════════════════╗');
    log('cyan', '║           Test Summary                     ║');
    log('cyan', '╚════════════════════════════════════════════╝\n');

    log('blue', `Total Tests: ${this.testCount}`);
    log('green', `Passed: ${this.passCount}`);
    if (this.failCount > 0) {
      log('red', `Failed: ${this.failCount}`);
    }

    const passRate = this.testCount > 0 ? (this.passCount / this.testCount * 100).toFixed(1) : 0;
    log('blue', `Pass Rate: ${passRate}%\n`);

    // 실패 테스트 상세 출력
    if (this.failCount > 0) {
      log('yellow', '━━━ Failed Tests ━━━');
      this.results
        .filter(r => r.status !== 'PASSED')
        .forEach(r => {
          log('red', `• ${r.name}`);
          log('red', `  Status: ${r.status}`);
          log('red', `  Reason: ${r.reason || 'Unknown error'}`);
        });
      log('yellow', '');
    }

    // 전체 결과 정보
    if (this.passCount > 0) {
      log('green', '━━━ Test Details ━━━');
      this.results
        .filter(r => r.status === 'PASSED')
        .slice(0, 5) // 처음 5개만 표시
        .forEach(r => {
          log('green', `• ${r.name}`);
          if (r.result !== null && r.result !== undefined) {
            log('cyan', `  Result: ${JSON.stringify(r.result).substring(0, 50)}...`);
          }
        });

      if (this.passCount > 5) {
        log('cyan', `  ... and ${this.passCount - 5} more passed tests`);
      }
      log('cyan', '');
    }

    return {
      total: this.testCount,
      passed: this.passCount,
      failed: this.failCount,
      passRate: parseFloat(passRate)
    };
  }
}

// 테스트 실행
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll();

  // 프로세스 종료 코드
  process.exit(runner.failCount > 0 ? 1 : 0);
}

module.exports = TestRunner;
