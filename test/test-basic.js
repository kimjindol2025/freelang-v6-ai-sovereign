/**
 * CLAUDELang v6.0 기본 테스트
 */

const CLAUDELangCompiler = require("../src/compiler.js");

// 색상 정의
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.compiler = new CLAUDELangCompiler();
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

  summary() {
    const total = this.passed + this.failed;
    console.log(`\n${colors.blue}═══════════════════════════${colors.reset}`);
    console.log(`${colors.blue}테스트 결과${colors.reset}`);
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

console.log(`\n${colors.yellow}CLAUDELang v6.0 기본 테스트${colors.reset}\n`);

// ====== Test 1: 기본 변수 선언 ======
runner.test("Test 1: 기본 변수 선언", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "x",
        value_type: "i32",
        value: 42,
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(result.code.includes("(define x 42)"), "생성된 코드에 변수 선언이 없음");
});

// ====== Test 2: 문자열 변수 ======
runner.test("Test 2: 문자열 변수 선언", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "message",
        value_type: "string",
        value: "Hello",
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(
    result.code.includes('(define message "Hello")'),
    "문자열이 제대로 생성되지 않음"
  );
});

// ====== Test 3: 배열 ======
runner.test("Test 3: 배열 선언", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "numbers",
        value_type: "Array<i32>",
        value: {
          type: "array",
          elements: [
            { type: "literal", value_type: "i32", value: 1 },
            { type: "literal", value_type: "i32", value: 2 },
            { type: "literal", value_type: "i32", value: 3 },
          ],
        },
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(
    result.code.includes("(define numbers"),
    "배열 변수 선언이 없음"
  );
  runner.assert(result.code.includes("(array"), "배열 생성이 없음");
});

// ====== Test 4: 함수 호출 ======
runner.test("Test 4: 함수 호출", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "call",
        function: "print",
        args: [
          { type: "literal", value_type: "string", value: "Hello" },
        ],
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(
    result.code.includes("(call print"),
    "함수 호출이 없음"
  );
});

// ====== Test 5: 산술 연산 ======
runner.test("Test 5: 산술 연산", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "a",
        value_type: "i32",
        value: 10,
      },
      {
        type: "var",
        name: "b",
        value_type: "i32",
        value: 20,
      },
      {
        type: "call",
        function: "print",
        args: [
          {
            type: "arithmetic",
            operator: "+",
            left: { type: "ref", name: "a" },
            right: { type: "ref", name: "b" },
          },
        ],
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(result.code.includes("(+ a b)"), "산술 연산이 없음");
});

// ====== Test 6: 조건문 ======
runner.test("Test 6: 조건문 (if-then-else)", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "condition",
        test: {
          type: "comparison",
          operator: ">",
          left: { type: "literal", value_type: "i32", value: 10 },
          right: { type: "literal", value_type: "i32", value: 5 },
        },
        then: [
          {
            type: "call",
            function: "print",
            args: [
              { type: "literal", value_type: "string", value: "true" },
            ],
          },
        ],
        else: [
          {
            type: "call",
            function: "print",
            args: [
              { type: "literal", value_type: "string", value: "false" },
            ],
          },
        ],
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(result.code.includes("(if"), "if 문이 없음");
  runner.assert(result.code.includes("(> 10 5)"), "비교 연산이 없음");
});

// ====== Test 7: 반복문 ======
runner.test("Test 7: 반복문 (for loop)", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "items",
        value_type: "Array<i32>",
        value: {
          type: "array",
          elements: [
            { type: "literal", value_type: "i32", value: 1 },
            { type: "literal", value_type: "i32", value: 2 },
          ],
        },
      },
      {
        type: "loop",
        iterator: "item",
        range: { type: "ref", name: "items" },
        body: [
          {
            type: "call",
            function: "print",
            args: [{ type: "ref", name: "item" }],
          },
        ],
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(result.code.includes("(for item"), "for 루프가 없음");
});

// ====== Test 8: 람다 함수 ======
runner.test("Test 8: 람다 함수", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "numbers",
        value_type: "Array<i32>",
        value: {
          type: "array",
          elements: [
            { type: "literal", value_type: "i32", value: 1 },
            { type: "literal", value_type: "i32", value: 2 },
          ],
        },
      },
      {
        type: "call",
        function: "Array.map",
        args: [
          { type: "ref", name: "numbers" },
          {
            type: "lambda",
            params: [{ name: "x", type: "i32" }],
            body: [
              {
                type: "arithmetic",
                operator: "*",
                left: { type: "ref", name: "x" },
                right: { type: "literal", value_type: "i32", value: 2 },
              },
            ],
          },
        ],
        assign_to: "result",
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(result.code.includes("(fn"), "람다 함수가 없음");
  runner.assert(result.code.includes("Array.map"), "Array.map 호출이 없음");
});

// ====== Test 9: 타입 에러 감지 ======
runner.test("Test 9: 타입 에러 감지", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "var",
        name: "x",
        value_type: "i32",
        value: "문자열", // 타입 불일치
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(!result.success, "타입 에러를 감지하지 못함");
  runner.assert(result.errors.length > 0, "에러 메시지가 없음");
});

// ====== Test 10: 주석 ======
runner.test("Test 10: 주석 지원", () => {
  const program = {
    version: "6.0",
    instructions: [
      {
        type: "comment",
        text: "이것은 주석입니다",
      },
      {
        type: "var",
        name: "x",
        value_type: "i32",
        value: 42,
      },
    ],
  };

  const result = runner.compiler.compile(program);
  runner.assert(result.success, "컴파일 실패");
  runner.assert(
    result.code.includes("; 이것은 주석입니다"),
    "주석이 생성되지 않음"
  );
});

// ====== 결과 출력 ======
const success = runner.summary();
process.exit(success ? 0 : 1);

