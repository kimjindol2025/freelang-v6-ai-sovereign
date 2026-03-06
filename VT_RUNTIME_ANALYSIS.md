# CLAUDELang v6.0 Phase 2 - VT 런타임 통합 분석

**목표**: CLAUDELang JSON → VT 바이트코드 → 실제 실행 → 결과

**작성일**: 2026-03-06
**상태**: 분석 완료, 구현 시작

---

## 1. 현재 아키텍처 분석

### 1.1 FreeLang-Final (VT 기반 런타임)

**경로**: `/data/data/com.termux/files/home/freelang-final/`

#### 구성 요소

| 파일 | 역할 | 중요도 |
|------|------|--------|
| `src/lexer.js` | 소스 코드 → 토큰 | 높음 |
| `src/parser.js` | 토큰 → AST | 높음 |
| `src/evaluator.js` | AST 실행 | 높음 |
| `src/runtime.js` | 내장 함수 (print, JSON, HTTP 등) | 높음 |
| `src/interpreter.js` | 전체 통합 파이프라인 | 높음 |
| `src/modules/*` | 확장 모듈 (json, fs, http, crypto 등) | 중간 |

#### 주요 특징

1. **Environment 시스템**
   - 변수 저장소 (Map 기반)
   - 스코핑 (부모 Environment 체이닝)
   - 동적 조회: `env.get(name)`, `env.set(name, value)`

2. **제어 흐름**
   - ReturnValue Exception으로 함수 반환 처리
   - BreakException, ContinueException으로 루프 제어

3. **함수 처리**
   - FreeLangFunction 클래스 (매개변수, 바디, 클로저 저장)
   - 동적 환경 생성 및 매개변수 바인딩

4. **내장 함수**
   - `print()`, `println()` - I/O
   - `read_file()`, `write_file()` - 파일 시스템
   - `fetch_http()` - HTTP
   - `json_parse()`, `json_stringify()` - JSON

### 1.2 CLAUDELang v6.0 (현재 프로젝트)

**경로**: `/data/data/com.termux/files/home/freelang-v6-ai-sovereign/`

#### 현재 구현

| 파일 | 역할 | 상태 |
|------|------|------|
| `src/compiler.js` | JSON → VT 코드 생성 | ✅ 완료 |
| `src/vt-runtime-bridge.js` | (미구현) | ⏳ 예정 |
| `examples/*.json` | 테스트 케이스 | ✅ 15개 |

#### Compiler 분석

```javascript
compile(claudelangJson) {
  // 1. validate(claudelangJson) - 스키마 검증
  // 2. typeCheck(claudelangJson) - 타입 검사
  // 3. generateVTCode(claudelangJson) - VT 코드 생성
  return {
    success: true,
    code: vtCode,  // 문자열로 반환
    errors: []
  };
}
```

**생성된 VT 코드 예시**:
```
; CLAUDELang v6.0 compiled to VT
; Generated code below

(define message "Hello, CLAUDELang!")
(call print message)
```

---

## 2. 필요한 VT Runtime Bridge 설계

### 2.1 목표

CLAUDELang에서 FreeLang-Final의 모든 기능을 활용할 수 있도록 브리지 구축

```
CLAUDELang JSON
    ↓
Compiler.compile()
    ↓
VT 코드 (문자열)
    ↓
VTRuntimeBridge.execute()
    ↓
FreeLang Interpreter
    ↓
결과값 반환
```

### 2.2 핵심 구현

#### VTRuntimeBridge 클래스

```javascript
class VTRuntimeBridge {
  constructor() {
    this.freelangInterpreter = new FreeLangInterpreter();
    this.memory = new Map(); // 변수 저장소
    this.functions = new Map(); // 함수 저장소
  }

  /**
   * VT 코드를 해석하고 실행
   * @param {string} vtCode - VT 코드 (스킴 형식)
   * @returns {*} 실행 결과
   */
  execute(vtCode) {
    // 1. VT 코드 파싱
    const ast = this.parseVTCode(vtCode);

    // 2. 실행
    const result = this.evalAst(ast);

    // 3. 메모리 상태 반환
    return {
      success: true,
      result: result,
      memory: Object.fromEntries(this.memory),
      errors: []
    };
  }

  /**
   * VT 코드를 AST로 파싱
   */
  parseVTCode(vtCode) {
    // 스킴 형식의 코드를 파싱
    // (define x 10)
    // (call print x)
    // (if (> x 5) (do ...) (do ...))
  }

  /**
   * AST 평가
   */
  evalAst(ast) {
    // FreeLang Interpreter 또는 직접 평가
  }

  /**
   * 메모리 상태 조회
   */
  getMemory() {
    return Object.fromEntries(this.memory);
  }
}
```

### 2.3 메모리 모델

```javascript
// 변수 저장소
memory: {
  "message": {
    type: "string",
    value: "Hello, CLAUDELang!"
  },
  "numbers": {
    type: "Array<i32>",
    value: [1, 2, 3, 4, 5]
  },
  "result": {
    type: "any",
    value: null
  }
}
```

### 2.4 통합 흐름

```javascript
// 1. 컴파일
const compiler = new CLAUDELangCompiler();
const compiled = compiler.compile(claudelangJson);

// 2. 실행
const bridge = new VTRuntimeBridge();
const result = bridge.execute(compiled.code);

// 3. 결과 확인
console.log(result.result);      // 실행 결과
console.log(result.memory);      // 변수 상태
console.log(result.errors);      // 에러 메시지
```

---

## 3. VT 코드 형식 분석

### 3.1 지원되는 형식

**변수 선언**:
```lisp
(define name value)
(define message "Hello")
(define numbers (array 1 2 3 4 5))
(define obj (object ("key1" "value1") ("key2" 42)))
```

**함수 호출**:
```lisp
(call function_name arg1 arg2 ...)
(call print message)
(call String.split text ",")
```

**제어 흐름**:
```lisp
(if test then_expr else_expr)
(if (> x 5) (do ...) (do ...))

(for iterator range body)
(for num (array 1 2 3) (do ...))
```

**연산**:
```lisp
(operator left right)
(+ 1 2)
(* x 2)
(> x 5)
```

### 3.2 VT 코드 생성 예시

**입력 (CLAUDELang JSON)**:
```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "x",
      "value_type": "i32",
      "value": 10
    },
    {
      "type": "var",
      "name": "doubled",
      "value_type": "i32",
      "value": {
        "type": "arithmetic",
        "operator": "*",
        "left": {"type": "ref", "name": "x"},
        "right": {"type": "literal", "value_type": "i32", "value": 2}
      }
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "doubled"}]
    }
  ]
}
```

**출력 (VT 코드)**:
```lisp
; CLAUDELang v6.0 compiled to VT
; Generated code below

(define x 10)
(define doubled (* x 2))
(call print doubled)
```

---

## 4. 구현 전략

### Phase 1: VT 코드 파서 (VT 언어의 스킴 형식 파싱)

```javascript
class VTParser {
  parse(vtCode) {
    // 문자열을 토크나이즈
    const tokens = this.tokenize(vtCode);

    // 토큰을 AST로 파싱
    const ast = this.parseTokens(tokens);

    return ast;
  }

  tokenize(code) {
    // "(define x 10)" → ["(", "define", "x", "10", ")"]
  }

  parseTokens(tokens) {
    // 토큰 → AST 노드 변환
  }
}
```

### Phase 2: VT 런타임 평가기 (AST 실행)

```javascript
class VTEvaluator {
  evaluate(ast, memory) {
    // define: 변수 선언
    // call: 함수 호출
    // if: 조건 분기
    // for: 루프
    // arithmetic: 연산
  }

  evaluateDefine(name, value) {
    // 변수 저장소에 추가
    this.memory.set(name, this.evaluate(value));
  }

  evaluateCall(functionName, args) {
    // 함수 호출
    const fn = this.getFunction(functionName);
    const evaluatedArgs = args.map(arg => this.evaluate(arg));
    return fn(...evaluatedArgs);
  }
}
```

### Phase 3: FreeLang 통합 (기존 런타임 활용)

```javascript
class VTRuntimeBridge {
  constructor() {
    this.interpreter = new FreeLangInterpreter();
    this.evaluator = new VTEvaluator();
  }

  execute(vtCode) {
    // 방법 1: 직접 평가
    const result = this.evaluator.evaluate(ast);

    // 또는 방법 2: FreeLang으로 변환하여 실행
    const flCode = this.vtCodeToFreelang(vtCode);
    const result = this.interpreter.execute(flCode);

    return result;
  }
}
```

### Phase 4: 통합 테스트

```javascript
// test/integration.test.js
const testCases = [
  {
    name: "Simple variable assignment",
    input: examples/simple.json,
    expectedOutput: "Hello, CLAUDELang!"
  },
  {
    name: "Array iteration",
    input: examples/array-example.json,
    expectedOutput: [1, 2, 3, 4, 5]
  },
  // ... 15개 예제 모두
];
```

---

## 5. 함수 매핑 (1,070+ 함수)

### 5.1 기본 함수 (FreeLang 기존)

| 함수 | 시그니처 | VT 호출 |
|------|---------|--------|
| print | `print(value: any): null` | `(call print value)` |
| println | `println(value: any): null` | `(call println value)` |
| read_file | `read_file(path: string): {ok, value?, error?}` | `(call read_file path)` |
| write_file | `write_file(path: string, content: string): {ok, error?}` | `(call write_file path content)` |
| json_parse | `json_parse(str: string): Object` | `(call json_parse str)` |
| json_stringify | `json_stringify(obj: Object): string` | `(call json_stringify obj)` |

### 5.2 네임스페이스 함수 (CLAUDELang 확장)

| 네임스페이스 | 함수 수 | 예시 |
|-----------|---------|------|
| HTTP | 150 | `HTTP.get(url)`, `HTTP.post(url, data)` |
| String | 120 | `String.split(str, delim)`, `String.upper(str)` |
| Array | 120 | `Array.map(arr, fn)`, `Array.filter(arr, fn)` |
| Math | 115 | `Math.sqrt(x)`, `Math.pow(x, y)` |
| FileSystem | 120 | `FS.read(path)`, `FS.write(path, content)` |
| JSON | 100 | `JSON.parse(str)`, `JSON.stringify(obj)` |
| Database | 150 | `DB.connect(uri)`, `DB.query(conn, sql)` |
| Markdown | 80 | `Markdown.create()`, `Markdown.heading(doc, level, text)` |
| Notion | 100 | `Notion.post(data)`, `Notion.query(db_id, filter)` |
| System | 115 | 시스템 함수 |

---

## 6. 구현 우선순위

### Phase 1 (필수, 이번 주)

✅ **VT 코드 파서**
- 토크나이저 (괄호 기반 파싱)
- AST 생성
- 에러 처리

✅ **VT 평가기**
- 변수 저장소 관리
- 기본 함수 호출 (print, println)
- 산술/비교 연산
- 제어 흐름 (if, for)

✅ **VTRuntimeBridge**
- 메인 인터페이스
- 메모리 상태 관리
- 결과값 반환

### Phase 2 (확장 함수)

📍 **문자열 함수** (String.*)
📍 **배열 함수** (Array.*)
📍 **파일 시스템** (FS.*)
📍 **HTTP** (HTTP.*)
📍 **JSON** (JSON.*)

### Phase 3 (고급 기능)

📍 **Database** (DB.*)
📍 **Markdown** (Markdown.*)
📍 **Notion** (Notion.*)

---

## 7. 예상 소요 시간

| 작업 | 소요 시간 | 담당 |
|------|---------|------|
| VT 파서 | 2시간 | 구현 |
| VT 평가기 | 3시간 | 구현 |
| VTRuntimeBridge | 1시간 | 구현 |
| 기본 함수 통합 | 2시간 | 통합 |
| 테스트 (15개 예제) | 2시간 | 검증 |
| **총계** | **10시간** | |

---

## 8. 성공 기준

- ✅ 모든 15개 예제 성공적으로 실행
- ✅ 변수 저장소 정상 작동
- ✅ 함수 호출 정상 작동
- ✅ 제어 흐름 정상 작동
- ✅ 에러 처리 정상 작동
- ✅ 결과값 정확하게 반환

---

**다음 단계**: `src/vt-runtime-bridge.js` 구현 시작
