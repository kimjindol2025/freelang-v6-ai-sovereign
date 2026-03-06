# 🔨 CLAUDELang 컴파일러 설계

**CLAUDELang JSON → VT 바이트코드 변환**

---

## 🏗️ 컴파일 파이프라인

```
CLAUDELang JSON
  ↓ 1. JSON 파싱
JSON Object
  ↓ 2. 검증
검증된 AST
  ↓ 3. 타입 검사
타입 검증됨 AST
  ↓ 4. VT 코드 생성
VT 코드
  ↓ 5. 최적화
최적화된 VT 코드
  ↓ 6. 바이트코드 생성
실행 가능한 바이트코드
```

---

## 📋 컴파일 단계별 상세

### 1. JSON 파싱 (Parsing)

```javascript
class JSONParser {
  parse(jsonString) {
    try {
      const obj = JSON.parse(jsonString);
      return obj;
    } catch (e) {
      throw new SyntaxError(`Invalid JSON: ${e.message}`);
    }
  }
}
```

**검증:**
- ✅ 올바른 JSON 형식
- ✅ 필수 필드 존재 (version, instructions)

---

### 2. 스키마 검증 (Validation)

```javascript
class SchemaValidator {
  validate(obj) {
    // 1. 버전 확인
    if (obj.version !== "6.0") {
      throw new Error(`Unsupported version: ${obj.version}`);
    }

    // 2. instructions 배열 확인
    if (!Array.isArray(obj.instructions)) {
      throw new Error("instructions must be an array");
    }

    // 3. 각 명령어 검증
    obj.instructions.forEach((instr, idx) => {
      this.validateInstruction(instr, idx);
    });
  }

  validateInstruction(instr, idx) {
    const type = instr.type;

    switch (type) {
      case "var":
        this.validateVarDeclaration(instr, idx);
        break;
      case "call":
        this.validateCallInstruction(instr, idx);
        break;
      case "condition":
        this.validateConditionInstruction(instr, idx);
        break;
      case "loop":
        this.validateLoopInstruction(instr, idx);
        break;
      default:
        throw new Error(`Unknown instruction type: ${type} at line ${idx}`);
    }
  }

  validateVarDeclaration(instr, idx) {
    if (!instr.name) {
      throw new Error(`VarDeclaration missing 'name' at line ${idx}`);
    }
    if (!instr.value_type) {
      throw new Error(`VarDeclaration missing 'value_type' at line ${idx}`);
    }
    if (instr.value === undefined) {
      throw new Error(`VarDeclaration missing 'value' at line ${idx}`);
    }
  }

  validateCallInstruction(instr, idx) {
    if (!instr.function) {
      throw new Error(`CallInstruction missing 'function' at line ${idx}`);
    }
    if (!Array.isArray(instr.args)) {
      throw new Error(`CallInstruction 'args' must be array at line ${idx}`);
    }
  }
}
```

---

### 3. 타입 검사 (Type Checking)

```javascript
class TypeChecker {
  constructor() {
    this.scope = new Map(); // 변수명 → 타입
  }

  typeCheck(ast) {
    ast.instructions.forEach((instr) => {
      this.checkInstruction(instr);
    });
  }

  checkInstruction(instr) {
    switch (instr.type) {
      case "var":
        // 변수를 scope에 추가
        this.scope.set(instr.name, instr.value_type);

        // 초기값 타입 검사
        const exprType = this.inferType(instr.value);
        if (!this.isCompatible(exprType, instr.value_type)) {
          throw new TypeError(
            `Type mismatch: cannot assign ${exprType} to ${instr.value_type}`
          );
        }
        break;

      case "call":
        // 함수 존재 여부 확인
        if (!this.vtFunctions.has(instr.function)) {
          throw new ReferenceError(`Unknown function: ${instr.function}`);
        }

        // 함수 시그니처 검사
        const signature = this.vtFunctions.get(instr.function);
        if (instr.args.length !== signature.params.length) {
          throw new TypeError(
            `${instr.function} expects ${signature.params.length} arguments, got ${instr.args.length}`
          );
        }

        // 각 인수의 타입 검사
        instr.args.forEach((arg, idx) => {
          const argType = this.inferType(arg);
          const paramType = signature.params[idx].type;
          if (!this.isCompatible(argType, paramType)) {
            throw new TypeError(
              `Argument ${idx}: expected ${paramType}, got ${argType}`
            );
          }
        });

        // 반환값을 scope에 추가
        if (instr.assign_to) {
          this.scope.set(instr.assign_to, signature.returnType);
        }
        break;
    }
  }

  inferType(expr) {
    if (expr.type === "literal") {
      return expr.value_type;
    } else if (expr.type === "ref") {
      if (!this.scope.has(expr.name)) {
        throw new ReferenceError(`Undefined variable: ${expr.name}`);
      }
      return this.scope.get(expr.name);
    } else if (expr.type === "arithmetic") {
      // 산술 연산은 숫자를 반환
      return "f64"; // 또는 더 정교한 타입 추론
    }
    // ... 다른 표현식 타입들
    return "any";
  }

  isCompatible(from, to) {
    // 같은 타입
    if (from === to) return true;

    // 호환 가능한 타입
    if (from === "i32" && to === "f64") return true; // 정수 → 실수
    if (from === "i32" && to === "any") return true;

    return false;
  }
}
```

---

### 4. VT 코드 생성 (Code Generation)

```javascript
class VTCodeGenerator {
  constructor(typeChecker) {
    this.typeChecker = typeChecker;
    this.code = [];
  }

  generate(ast) {
    this.code = [];
    this.code.push("; CLAUDELang compiled to VT");
    this.code.push("; Generated code below");
    this.code.push("");

    ast.instructions.forEach((instr) => {
      this.generateInstruction(instr);
    });

    return this.code.join("\n");
  }

  generateInstruction(instr) {
    switch (instr.type) {
      case "var":
        this.generateVarDeclaration(instr);
        break;
      case "call":
        this.generateCallInstruction(instr);
        break;
      case "condition":
        this.generateConditionInstruction(instr);
        break;
      case "loop":
        this.generateLoopInstruction(instr);
        break;
    }
  }

  generateVarDeclaration(instr) {
    const value = this.generateExpression(instr.value);
    this.code.push(`(define ${instr.name} ${value})`);
  }

  generateCallInstruction(instr) {
    const [namespace, functionName] = instr.function.split(".");
    const args = instr.args.map((arg) => this.generateExpression(arg));

    const callCode = `(call ${namespace}.${functionName} ${args.join(" ")})`;

    if (instr.assign_to) {
      this.code.push(`(define ${instr.assign_to} ${callCode})`);
    } else {
      this.code.push(callCode);
    }
  }

  generateExpression(expr) {
    switch (expr.type) {
      case "literal":
        if (expr.value_type === "string") {
          return `"${expr.value}"`;
        }
        return expr.value.toString();

      case "ref":
        return expr.name;

      case "arithmetic":
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        return `(${expr.operator} ${left} ${right})`;

      case "array":
        const elements = expr.elements
          .map((e) => this.generateExpression(e))
          .join(" ");
        return `(array ${elements})`;

      case "lambda":
        const params = expr.params.map((p) => p.name).join(" ");
        const body = expr.body.map((e) => this.generateExpression(e)).join(" ");
        return `(fn (${params}) ${body})`;

      default:
        throw new Error(`Unknown expression type: ${expr.type}`);
    }
  }

  generateConditionInstruction(instr) {
    const test = this.generateExpression(instr.test);
    const thenCode = instr.then
      .map((i) => this.generateInstructionToExpression(i))
      .join(" ");
    const elseCode = instr.else
      ? instr.else
          .map((i) => this.generateInstructionToExpression(i))
          .join(" ")
      : "null";

    this.code.push(`(if ${test} (do ${thenCode}) (do ${elseCode}))`);
  }

  generateLoopInstruction(instr) {
    const range = this.generateExpression(instr.range);
    const body = instr.body
      .map((i) => this.generateInstructionToExpression(i))
      .join(" ");

    this.code.push(`(for ${instr.iterator} ${range} (do ${body}))`);
  }
}
```

---

### 5. 최적화 (Optimization)

```javascript
class Optimizer {
  optimize(vtCode) {
    // 1. 상수 접기 (Constant Folding)
    vtCode = this.foldConstants(vtCode);

    // 2. 불필요한 코드 제거 (Dead Code Elimination)
    vtCode = this.eliminateDeadCode(vtCode);

    // 3. 인라인 함수 (Function Inlining)
    vtCode = this.inlineFunctions(vtCode);

    return vtCode;
  }

  foldConstants(code) {
    // (+ 1 2) → 3
    return code.replace(/\(\+ (\d+) (\d+)\)/g, (match, a, b) => {
      return (parseInt(a) + parseInt(b)).toString();
    });
  }

  eliminateDeadCode(code) {
    // 사용되지 않는 변수 정의 제거
    // ...
    return code;
  }

  inlineFunctions(code) {
    // 작은 함수는 인라인
    // ...
    return code;
  }
}
```

---

### 6. 실행 (Execution)

```javascript
class VTExecutor {
  constructor() {
    this.vt = require("freelang-final");
  }

  execute(vtCode) {
    // VT 컴파일러로 컴파일
    const compiled = this.vt.compile(vtCode);

    // VT 런타임으로 실행
    const result = this.vt.run(compiled);

    return result;
  }
}
```

---

## 🚀 사용 예제

### 전체 파이프라인

```javascript
const compiler = new CLAUDELangCompiler();

// 1. CLAUDELang JSON
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
      assign_to: "doubled",
    },
    {
      type: "call",
      function: "print",
      args: [{ type: "ref", name: "doubled" }],
    },
  ],
};

// 2. 컴파일
const result = compiler.compile(program);

// 3. 실행
console.log(result);
// Output: [2, 4, 6]
```

---

## ✅ 에러 처리

```javascript
class CompileError extends Error {
  constructor(message, lineNumber) {
    super(`[Line ${lineNumber}] ${message}`);
    this.lineNumber = lineNumber;
  }
}

class TypeError extends CompileError {}
class ReferenceError extends CompileError {}
class SyntaxError extends CompileError {}
```

---

## 📊 컴파일러 통계

| 단계 | 복잡도 | 최적화 |
|------|--------|--------|
| 파싱 | O(n) | JSON 네이티브 |
| 검증 | O(n) | 스키마 고정 |
| 타입 검사 | O(n) | 선형 스캔 |
| 코드 생성 | O(n) | 직접 생성 |
| 최적화 | O(n) | 선택적 |

---

## 🎯 다음 단계

1. ✅ 설계 (완료)
2. 🔨 구현 (진행 중)
3. 🧪 테스트 (진행 예정)
4. 📚 최적화 (진행 예정)

---

**상태**: 설계 완료
**버전**: 6.0.0-alpha
**기반**: VT 런타임

