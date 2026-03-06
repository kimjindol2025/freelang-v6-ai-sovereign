# CLAUDELang v6.0 테스트 가이드

## 빠른 시작

```bash
# 기본 테스트 실행
node test-basic.js

# 고급 테스트 실행
node test-advanced.js
```

---

## 테스트 파일 구조

### test-basic.js (10개 테스트)
CLAUDELang v6.0 컴파일러의 핵심 기능을 검증합니다.

**포함된 테스트:**
1. 기본 변수 선언 - i32 타입
2. 문자열 변수 선언 - string 타입
3. 배열 선언 - Array<i32>
4. 함수 호출 - print()
5. 산술 연산 - + 연산자
6. 조건문 - if-then-else
7. 반복문 - for loop
8. 람다 함수 - Array.map with lambda
9. 타입 에러 감지 - 타입 불일치
10. 주석 지원 - 주석 생성

### test-advanced.js (20개 테스트)

#### 카테고리 1: 기본 기능 확장 (5개)
- 다중 변수 선언
- 객체 생성 및 프로퍼티
- 객체 프로퍼티 접근
- 배열 인덱싱
- 중첩 산술 표현식

#### 카테고리 2: 함수 호출 고급 (5개)
- Array.map with lambda
- Array.filter with lambda
- String.split
- JSON.parse/stringify
- HTTP.get

#### 카테고리 3: 복잡한 제어 흐름 (5개)
- 중첩된 if-else
- 조건이 있는 for 루프
- 복수의 람다 함수 사용
- 여러 함수 체인 호출
- 파이프라인 패턴

#### 카테고리 4: 에러 케이스 (5개)
- 타입 불일치 감지
- 정의되지 않은 함수 호출 감지
- 정의되지 않은 변수 참조
- 지원하지 않는 버전 감지
- 함수 인자 개수 불일치

---

## 테스트 러너 API

### test(name, fn)
테스트를 실행하고 결과를 출력합니다.

```javascript
runner.test("테스트 이름", () => {
  // 테스트 코드
  runner.assert(result.success, "컴파일 실패");
});
```

### assert(condition, message)
조건을 검증합니다. 조건이 false면 에러를 발생합니다.

```javascript
runner.assert(result.success, "컴파일 실패");
```

### assertEqual(actual, expected, message)
두 값이 같은지 검증합니다.

```javascript
runner.assertEqual(result.code.length, 100, "코드 길이 불일치");
```

### assertIncludes(actual, expected, message)
문자열에 특정 내용이 포함되어 있는지 검증합니다.

```javascript
runner.assertIncludes(result.code, "(define x 42)", "변수 선언 없음");
```

### summary()
테스트 결과를 요약하고 출력합니다.

```javascript
const success = runner.summary();
process.exit(success ? 0 : 1);
```

---

## 테스트 작성 예제

### 기본 패턴

```javascript
runner.test("Test Name: 테스트 설명", () => {
  // 1. 프로그램 정의
  const program = {
    version: "6.0",
    instructions: [
      // 명령어들...
    ],
  };

  // 2. 컴파일
  const result = runner.compiler.compile(program);

  // 3. 결과 검증
  runner.assert(result.success, "컴파일 실패");
  runner.assertIncludes(result.code, "검증할_코드", "메시지");
});
```

### 에러 케이스 테스트

```javascript
runner.test("에러 감지 테스트", () => {
  const program = {
    version: "6.0",
    instructions: [
      { type: "invalid_type", /* ... */ }
    ],
  };

  const result = runner.compiler.compile(program);

  // 실패를 기대
  runner.assert(!result.success, "에러를 감지하지 못함");
  runner.assert(result.errors.length > 0, "에러 메시지 없음");
});
```

---

## 프로그램 구조 (JSON Schema)

### 기본 구조
```javascript
{
  version: "6.0",           // 버전 (필수)
  instructions: [           // 명령어 배열 (필수)
    {
      type: "var" | "call" | "condition" | "loop" | "comment",
      // 각 타입별 필드...
    }
  ]
}
```

### 변수 선언 (var)
```javascript
{
  type: "var",
  name: "x",               // 변수명
  value_type: "i32",       // 데이터 타입
  value: 42               // 초기값
}
```

### 함수 호출 (call)
```javascript
{
  type: "call",
  function: "print",      // 함수명
  args: [                 // 인자
    { type: "literal", value_type: "string", value: "Hello" }
  ],
  assign_to: "result"    // (선택) 반환값 할당
}
```

### 조건문 (condition)
```javascript
{
  type: "condition",
  test: {                 // 조건식
    type: "comparison",
    operator: ">",
    left: { type: "ref", name: "x" },
    right: { type: "literal", value_type: "i32", value: 10 }
  },
  then: [ /* 명령어들 */ ],
  else: [ /* 명령어들 */ ]  // (선택)
}
```

### 반복문 (loop)
```javascript
{
  type: "loop",
  iterator: "item",                    // 반복 변수
  range: { type: "ref", name: "arr" }, // 순회 대상
  body: [ /* 명령어들 */ ]
}
```

### 람다 함수 (lambda)
```javascript
{
  type: "lambda",
  params: [
    { name: "x", type: "i32" }  // 매개변수
  ],
  body: [ /* 표현식 */ ]
}
```

---

## 데이터 타입

| 타입 | 설명 | 예 |
|------|------|-----|
| `i32` | 32비트 정수 | 42 |
| `f64` | 64비트 실수 | 3.14 |
| `string` | 문자열 | "hello" |
| `bool` | 불린 | true/false |
| `Array<T>` | 배열 | [1, 2, 3] |
| `Object` | 객체 | {name: "Alice"} |
| `Function` | 함수 | (fn (x) x) |

---

## 테스트 결과 해석

### 성공 사례
```
✅ PASS: Test Name
```

### 실패 사례
```
❌ FAIL: Test Name
   에러 메시지
```

### 요약
```
전체: 30
성공: 30 ✅
실패: 0
```

---

## 자주 사용되는 검증 패턴

### 코드 생성 검증
```javascript
const result = runner.compiler.compile(program);
runner.assert(result.success, "컴파일 실패");
runner.assertIncludes(result.code, "(define", "정의 없음");
```

### 에러 검증
```javascript
const result = runner.compiler.compile(program);
runner.assert(!result.success, "에러를 감지하지 못함");
runner.assert(result.errors.length > 0, "에러 메시지 없음");
```

### 함수 호출 검증
```javascript
runner.assertIncludes(result.code, "Array.map", "Array.map 호출 없음");
runner.assertIncludes(result.code, "(fn", "람다 함수 없음");
```

### 복수 연산 검증
```javascript
const ifCount = (result.code.match(/\(if/g) || []).length;
runner.assert(ifCount >= 2, "중첩 if가 충분하지 않음");
```

---

## 디버깅 팁

### 생성된 코드 확인
```javascript
const result = runner.compiler.compile(program);
console.log("생성 코드:", result.code);
console.log("에러:", result.errors);
```

### 단일 테스트 실행
```javascript
// test-advanced.js의 일부만 주석 처리 후:
const runner = new TestRunner();
runner.test("특정 테스트명", () => {
  // 테스트 코드
});
runner.summary();
```

### 컴파일 단계별 확인
```javascript
const compiler = new CLAUDELangCompiler();
try {
  compiler.validate(program);        // 1단계: 검증
  compiler.typeCheck(program);       // 2단계: 타입 확인
  const code = compiler.generateVTCode(program); // 3단계: 코드 생성
  console.log(code);
} catch (error) {
  console.error("에러:", error.message);
}
```

---

## 성능 노트

- **test-basic.js**: ~50ms
- **test-advanced.js**: ~150ms
- **전체**: ~200ms

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `../src/compiler.js` | CLAUDELang 컴파일러 |
| `../CLAUDELANG_SPEC.md` | 언어 스펙 |
| `../COMPILER_DESIGN.md` | 컴파일러 설계 |
| `../TEST_COVERAGE.md` | 전체 테스트 커버리지 |

---

## 기여 가이드

새로운 테스트를 추가하려면:

1. 적절한 카테고리 선택
2. TestRunner API 사용
3. 명확한 테스트명 작성
4. 다양한 검증 추가
5. 주석으로 의도 설명

```javascript
runner.test("Test XX: 새로운 기능", () => {
  // 테스트 구현
  // 이 테스트는 ...을(를) 검증합니다.
});
```

---

## 문제 해결

### "컴파일 실패" 에러
- version이 "6.0"인지 확인
- instructions가 배열인지 확인
- 각 instruction에 type 필드가 있는지 확인

### "함수 호출 없음" 에러
- 함수명이 정확한지 확인
- 등록된 함수 목록: Array.map/filter/find/reduce, String.*, JSON.*, HTTP.*, Math.*, FS.*, Markdown.*, Notion.*

### "람다 함수 없음" 에러
- lambda 타입 표현식이 있는지 확인
- params와 body가 모두 있는지 확인

---

**마지막 업데이트**: 2026-03-06
