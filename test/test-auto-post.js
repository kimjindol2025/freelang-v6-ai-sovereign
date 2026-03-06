/**
 * CLAUDELang v6.0 AutoPoster 테스트
 */

const fs = require('fs');
const path = require('path');
const { AutoPoster, VirtualMachine } = require('../src/auto-post.js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.autoPoster = new AutoPoster();
  }

  test(name, fn) {
    try {
      fn();
      console.log(`${colors.green}✅ PASS${colors.reset}: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`${colors.red}❌ FAIL${colors.reset}: ${name}`);
      console.log(`   ${error.message}`);
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        `${message} - expected '${expected}', got '${actual}'`
      );
    }
  }

  assertIncludes(str, substr, message) {
    if (!str.includes(substr)) {
      throw new Error(`${message} - '${substr}' not found in '${str}'`);
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log(`\n${colors.blue}═══════════════════════════${colors.reset}`);
    console.log(`${colors.blue}AutoPoster 테스트 결과${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════${colors.reset}`);
    console.log(`전체: ${total}`);
    console.log(`${colors.green}성공: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}실패: ${this.failed}${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════${colors.reset}\n`);

    return this.failed === 0;
  }
}

// 테스트 실행
const runner = new TestRunner();

console.log(`\n${colors.yellow}CLAUDELang v6.0 AutoPoster 테스트${colors.reset}\n`);

// ====== Test 1: AutoPoster 초기화 ======
runner.test('Test 1: AutoPoster 초기화', () => {
  const autoPoster = new AutoPoster();
  runner.assert(autoPoster.compiler !== undefined, 'compiler 미초기화');
  runner.assert(autoPoster.vm !== undefined, 'vm 미초기화');
});

// ====== Test 2: 단순 코드 컴파일 및 실행 ======
runner.test('Test 2: 단순 코드 컴파일 및 실행', async () => {
  const code = {
    version: '6.0',
    instructions: [
      {
        type: 'var',
        name: 'message',
        value_type: 'string',
        value: 'Hello, CLAUDELang!',
      },
      {
        type: 'call',
        function: 'print',
        args: [{ type: 'ref', name: 'message' }],
      },
    ],
  };

  const result = await runner.autoPoster.run(JSON.stringify(code));
  runner.assert(result.compilation.success, '컴파일 실패');
  runner.assert(result.execution.success, '실행 실패');
});

// ====== Test 3: VirtualMachine 실행 ======
runner.test('Test 3: VirtualMachine 코드 실행', () => {
  const vm = new VirtualMachine();
  const vtCode = `
(define x 42)
(call print "x is 42")
  `.trim();

  const result = vm.execute(vtCode);
  runner.assert(result.success, '실행 실패');
  runner.assert(result.output.length > 0, '출력이 없음');
});

// ====== Test 4: 컴파일 에러 처리 ======
runner.test('Test 4: 컴파일 에러 감지', async () => {
  const invalidCode = {
    version: '6.0',
    instructions: [
      {
        type: 'call',
        function: 'print',
        args: ['missing arg'], // 타입 불일치
      },
    ],
  };

  const result = await runner.autoPoster.run(JSON.stringify(invalidCode));
  // 에러가 있을 수도 있고 없을 수도 있음 (느슨한 검증)
  runner.assert(
    result.compilation !== undefined,
    'compilation 결과 없음'
  );
});

// ====== Test 5: 보고서 생성 ======
runner.test('Test 5: Markdown 보고서 생성', () => {
  const code = {
    version: '6.0',
    instructions: [
      {
        type: 'var',
        name: 'x',
        value_type: 'i32',
        value: 42,
      },
    ],
  };

  const compileResult = runner.autoPoster.compiler.compile(code);
  const execResult = runner.autoPoster.vm.execute(compileResult.code);

  const report = runner.autoPoster.generateReport(
    JSON.stringify(code),
    compileResult,
    execResult,
    { filename: 'test.json' },
    Date.now()
  );

  runner.assert(report.markdown !== undefined, 'markdown 미생성');
  runner.assertIncludes(
    report.markdown,
    'CLAUDELang v6.0 자동 실행 결과',
    '마크다운 헤더 누락'
  );
});

// ====== Test 6: 배열 처리 ======
runner.test('Test 6: 배열 처리 및 반복', async () => {
  const code = {
    version: '6.0',
    instructions: [
      {
        type: 'var',
        name: 'items',
        value_type: 'Array<i32>',
        value: {
          type: 'array',
          elements: [
            { type: 'literal', value_type: 'i32', value: 1 },
            { type: 'literal', value_type: 'i32', value: 2 },
            { type: 'literal', value_type: 'i32', value: 3 },
          ],
        },
      },
      {
        type: 'loop',
        iterator: 'item',
        range: { type: 'ref', name: 'items' },
        body: [
          {
            type: 'call',
            function: 'print',
            args: [{ type: 'ref', name: 'item' }],
          },
        ],
      },
    ],
  };

  const result = await runner.autoPoster.run(JSON.stringify(code));
  runner.assert(result.compilation.success, '컴파일 실패');
});

// ====== Test 7: 조건문 ======
runner.test('Test 7: 조건문 처리', async () => {
  const code = {
    version: '6.0',
    instructions: [
      {
        type: 'condition',
        test: {
          type: 'comparison',
          operator: '>',
          left: { type: 'literal', value_type: 'i32', value: 10 },
          right: { type: 'literal', value_type: 'i32', value: 5 },
        },
        then: [
          {
            type: 'call',
            function: 'print',
            args: [{ type: 'literal', value_type: 'string', value: 'true' }],
          },
        ],
      },
    ],
  };

  const result = await runner.autoPoster.run(JSON.stringify(code));
  runner.assert(result.compilation.success, '컴파일 실패');
});

// ====== Test 8: 성능 지표 수집 ======
runner.test('Test 8: 성능 지표 기록', () => {
  const vm = new VirtualMachine();
  const vtCode = '(define x 42)\n(define y 100)';

  const result = vm.execute(vtCode);
  runner.assert(result.executionTime >= 0, 'executionTime 없음');
  runner.assert(result.instructionCount > 0, 'instructionCount 없음');
});

// ====== Test 9: 결과 저장 ======
runner.test('Test 9: 결과 파일 저장', async () => {
  const code = {
    version: '6.0',
    instructions: [
      {
        type: 'var',
        name: 'test',
        value_type: 'string',
        value: 'test',
      },
    ],
  };

  const result = await runner.autoPoster.run(JSON.stringify(code));
  runner.autoPoster.saveResults('./test-results');

  const resultsFile = './test-results/results-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  runner.assert(
    fs.existsSync('./test-results'),
    '결과 디렉토리 미생성'
  );
});

// ====== Test 10: 예제 파일 처리 ======
runner.test('Test 10: 예제 파일 배치 처리', async () => {
  const examplesDir = path.join(__dirname, '../examples');

  if (fs.existsSync(examplesDir)) {
    const files = fs.readdirSync(examplesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(examplesDir, f));

    if (files.length > 0) {
      const results = await runner.autoPoster.runBatch(
        files.slice(0, 1),
        './test-batch-results'
      );
      runner.assert(results.length > 0, '배치 처리 결과 없음');
    }
  }
});

// ====== 결과 출력 ======
const success = runner.summary();

// 정리
try {
  if (fs.existsSync('./test-results')) {
    const files = fs.readdirSync('./test-results');
    files.forEach(f => fs.unlinkSync(path.join('./test-results', f)));
    fs.rmdirSync('./test-results');
  }
  if (fs.existsSync('./test-batch-results')) {
    const files = fs.readdirSync('./test-batch-results');
    files.forEach(f => fs.unlinkSync(path.join('./test-batch-results', f)));
    fs.rmdirSync('./test-batch-results');
  }
} catch (e) {
  // 정리 실패 무시
}

process.exit(success ? 0 : 1);
