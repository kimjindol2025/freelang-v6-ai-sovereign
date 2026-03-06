/**
 * CLAUDELang v6.0 - 새 예제 테스트
 * 추가 10개 예제 검증
 */

const fs = require('fs');
const path = require('path');
const CLAUDELangCompiler = require('./src/compiler');
const { VTRuntimeBridge } = require('./src/vt-runtime-bridge');

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

  runTest(name, jsonPath) {
    this.testCount++;

    try {
      const content = fs.readFileSync(jsonPath, 'utf8');
      const json = JSON.parse(content);

      const compiled = this.compiler.compile(json);

      if (!compiled.success) {
        log('red', `✗ ${name}`);
        log('red', `  컴파일 실패: ${compiled.errors.join(', ')}`);
        this.failCount++;
        this.results.push({ name, status: 'FAILED', reason: `Compilation: ${compiled.errors[0]}` });
        return;
      }

      const result = this.bridge.execute(compiled.code);

      if (!result.success) {
        log('red', `✗ ${name}`);
        log('red', `  실행 실패: ${result.errors.join(', ')}`);
        this.failCount++;
        this.results.push({ name, status: 'FAILED', reason: `Execution: ${result.errors[0]}` });
        return;
      }

      log('green', `✓ ${name}`);
      this.passCount++;
      this.results.push({ name, status: 'PASSED', result: result.result });
      this.bridge.clearMemory();
    } catch (error) {
      log('red', `✗ ${name}`);
      log('red', `  에러: ${error.message}`);
      this.failCount++;
      this.results.push({ name, status: 'ERROR', reason: error.message });
    }
  }

  runAll() {
    const examplesDir = path.join(__dirname, 'examples');

    log('cyan', '\n╔════════════════════════════════════════════╗');
    log('cyan', '║  CLAUDELang v6.0 - 새 예제 테스트         ║');
    log('cyan', '╚════════════════════════════════════════════╝\n');

    const newExamples = [
      'json-transform.json',
      'text-analysis.json',
      'conditional-loop.json',
      'reduce-example.json',
      'nested-data.json',
      'string-processing.json',
      'multiple-transforms.json',
      'data-validation.json',
      'math-operations.json',
      'data-grouping.json',
      'data-pipeline.json'
    ];

    log('blue', `${newExamples.length}개의 새 예제 테스트\n`);

    newExamples.forEach(file => {
      const filepath = path.join(examplesDir, file);
      const testName = file.replace('.json', '');
      this.runTest(testName, filepath);
    });

    this.printSummary();
  }

  printSummary() {
    log('cyan', '\n╔════════════════════════════════════════════╗');
    log('cyan', '║           테스트 결과 요약                  ║');
    log('cyan', '╚════════════════════════════════════════════╝\n');

    log('blue', `전체 테스트: ${this.testCount}`);
    log('green', `통과: ${this.passCount}`);
    if (this.failCount > 0) {
      log('red', `실패: ${this.failCount}`);
    }

    const passRate = this.testCount > 0 ? (this.passCount / this.testCount * 100).toFixed(1) : 0;
    log('blue', `성공률: ${passRate}%\n`);

    if (this.failCount > 0) {
      log('yellow', '━━━ 실패한 테스트 ━━━');
      this.results
        .filter(r => r.status !== 'PASSED')
        .forEach(r => {
          log('red', `• ${r.name}`);
          log('red', `  상태: ${r.status}`);
          log('red', `  사유: ${r.reason || '알수 없음'}`);
        });
      log('yellow', '');
    }

    if (this.passCount > 0) {
      log('green', '━━━ 통과한 테스트 ━━━');
      this.results
        .filter(r => r.status === 'PASSED')
        .forEach(r => {
          log('green', `• ${r.name}`);
        });
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

if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll();
  process.exit(runner.failCount > 0 ? 1 : 0);
}

module.exports = TestRunner;
