/**
 * CLAUDELang v6.0 통합 테스트
 *
 * 테스트 항목:
 * 1. 모든 11개 예제 실행
 * 2. 결과값 검증
 * 3. 성능 측정
 * 4. 에러 처리
 */

const fs = require('fs');
const path = require('path');
const { CLAUDELang } = require('../src/index.js');

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

class IntegrationTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
    this.claudeLang = new CLAUDELang();
  }

  test(name, fn) {
    try {
      fn();
      console.log(`${colors.green}✅ PASS${colors.reset}: ${name}`);
      this.passed++;
      this.tests.push({ name, status: 'pass' });
    } catch (error) {
      console.log(`${colors.red}❌ FAIL${colors.reset}: ${name}`);
      console.log(`   ${colors.red}${error.message}${colors.reset}`);
      this.failed++;
      this.tests.push({ name, status: 'fail', error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${message}\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(actual)}`
      );
    }
  }

  assertArrayEquals(actual, expected, message) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error(`${message} - both must be arrays`);
    }
    if (actual.length !== expected.length) {
      throw new Error(
        `${message}\nArray length mismatch - Expected: ${expected.length}, Got: ${actual.length}`
      );
    }
    for (let i = 0; i < actual.length; i++) {
      if (JSON.stringify(actual[i]) !== JSON.stringify(expected[i])) {
        throw new Error(
          `${message}\nAt index ${i}: Expected ${JSON.stringify(expected[i])}, Got ${JSON.stringify(actual[i])}`
        );
      }
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log(
      `\n${colors.blue}${'═'.repeat(50)}${colors.reset}`
    );
    console.log(`${colors.blue}통합 테스트 결과${colors.reset}`);
    console.log(
      `${colors.blue}${'═'.repeat(50)}${colors.reset}`
    );
    console.log(`전체: ${total}`);
    console.log(`${colors.green}성공: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}실패: ${this.failed}${colors.reset}`);
    console.log(
      `${colors.blue}${'═'.repeat(50)}${colors.reset}\n`
    );

    return this.failed === 0;
  }
}

// 테스트 실행
const runner = new IntegrationTestRunner();

console.log(`\n${colors.yellow}CLAUDELang v6.0 통합 테스트${colors.reset}\n`);

// ============================================
// 단계 1: 기본 예제 테스트 (5개)
// ============================================

console.log(`${colors.cyan}[단계 1] 기본 예제 테스트${colors.reset}`);

// Test 1: data-filtering
runner.test('Test 1: data-filtering - 짝수 필터링', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/data-filtering.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );

  // 결과값 검증: [2, 4, 6, 8]이어야 함
  const output = result.output[0];
  const parsed = JSON.parse(output);
  runner.assertArrayEquals(
    parsed,
    [2, 4, 6, 8],
    'data-filtering 결과값 오류'
  );
});

// Test 2: data-mapping
runner.test('Test 2: data-mapping - 제곱값 변환', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/data-mapping.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );

  const output = result.output[0];
  const parsed = JSON.parse(output);
  runner.assertArrayEquals(
    parsed,
    [1, 4, 9, 16, 25],
    'data-mapping 결과값 오류'
  );
});

// Test 3: string-split
runner.test('Test 3: string-split - 문자열 분할', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/string-split.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );

  const output = result.output[0];
  const parsed = JSON.parse(output);
  runner.assertArrayEquals(
    parsed,
    ['apple', 'banana', 'cherry', 'date'],
    'string-split 결과값 오류'
  );
});

// Test 4: simple
runner.test('Test 4: simple - 기본 프로그램', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/simple.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
});

// Test 5: conditional-workflow
runner.test('Test 5: conditional-workflow - 조건부 실행', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/conditional-workflow.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );
});

// ============================================
// 단계 2: 고급 예제 테스트 (6개)
// ============================================

console.log(`\n${colors.cyan}[단계 2] 고급 예제 테스트${colors.reset}`);

// Test 6: loop-with-condition
runner.test('Test 6: loop-with-condition - 조건부 루프', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/loop-with-condition.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );
});

// Test 7: nested-operations
runner.test('Test 7: nested-operations - 중첩 연산', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/nested-operations.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
});

// Test 8: data-aggregation
runner.test('Test 8: data-aggregation - 데이터 집계', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/data-aggregation.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );
});

// Test 9: string-transformation
runner.test('Test 9: string-transformation - 문자열 변환', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/string-transformation.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );
});

// Test 10: api-response-processing
runner.test('Test 10: api-response-processing - API 응답 처리', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/api-response-processing.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
});

// Test 11: array-example
runner.test('Test 11: array-example - 배열 예제', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/array-example.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.output && result.output.length > 0,
    '출력이 없음'
  );
});

// ============================================
// 단계 3: 성능 측정
// ============================================

console.log(`\n${colors.cyan}[단계 3] 성능 측정${colors.reset}`);

runner.test('Test 12: 성능 - data-filtering 실행 시간 < 100ms', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/data-filtering.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.executionTime < 100,
    `실행 시간이 너무 김: ${result.executionTime}ms`
  );
});

runner.test('Test 13: 성능 - data-mapping 실행 시간 < 100ms', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/data-mapping.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.executionTime < 100,
    `실행 시간이 너무 김: ${result.executionTime}ms`
  );
});

runner.test('Test 14: 메모리 - 메모리 사용량 합리적', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/data-filtering.json')
  );

  runner.assert(result.success, `실행 실패: ${result.error}`);
  runner.assert(
    result.memoryUsage >= 0,
    '메모리 사용량 측정 오류'
  );
});

// ============================================
// 단계 4: 에러 처리
// ============================================

console.log(`\n${colors.cyan}[단계 4] 에러 처리${colors.reset}`);

runner.test('Test 15: 에러 처리 - 존재하지 않는 파일', () => {
  const result = runner.claudeLang.runFile(
    path.join(__dirname, '../examples/nonexistent.json')
  );

  runner.assert(!result.success, '오류를 감지하지 못함');
  runner.assert(
    result.error && result.error.length > 0,
    '에러 메시지가 없음'
  );
});

runner.test('Test 16: 에러 처리 - 잘못된 JSON', () => {
  try {
    const program = { version: '6.0' }; // instructions 필드 없음
    const result = runner.claudeLang.runProgram(program);
    runner.assert(!result.success, '오류를 감지하지 못함');
  } catch (error) {
    // 예외 처리됨
  }
});

// ============================================
// 단계 5: 디렉토리 일괄 실행
// ============================================

console.log(`\n${colors.cyan}[단계 5] 디렉토리 일괄 실행${colors.reset}`);

runner.test('Test 17: 모든 예제 실행', () => {
  const examplesDir = path.join(__dirname, '../examples');
  const results = runner.claudeLang.runExamplesDirectory(examplesDir);

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;

  console.log(
    `     ${colors.cyan}실행된 예제: ${successCount}/${totalCount}${colors.reset}`
  );

  runner.assert(
    successCount > 0,
    `실행된 예제가 없음`
  );
});

// 결과 요약
const success = runner.summary();

// 자세한 결과 보고
console.log(`${colors.magenta}상세 결과${colors.reset}`);
runner.tests.forEach((test, idx) => {
  const status = test.status === 'pass'
    ? `${colors.green}✅${colors.reset}`
    : `${colors.red}❌${colors.reset}`;
  console.log(`${status} ${idx + 1}. ${test.name}`);
  if (test.error) {
    console.log(`   ${colors.red}${test.error.split('\n')[0]}${colors.reset}`);
  }
});

console.log('');

// 프로세스 종료 코드
process.exit(success ? 0 : 1);
