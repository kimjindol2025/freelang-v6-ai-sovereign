/**
 * CLAUDELang v6.0 Compiler
 * CLAUDELang JSON → VT 바이트코드 변환
 */

class CLAUDELangCompiler {
  constructor() {
    this.scope = new Map(); // 변수 저장소
    this.vtFunctions = new Map(); // VT 함수 목록
    this.initializeVTFunctions();
  }

  /**
   * VT 함수 목록 초기화
   */
  initializeVTFunctions() {
    // HTTP (예)
    this.registerFunction("HTTP.get", ["url: string"], "Object");
    this.registerFunction("HTTP.post", ["url: string", "data: Object"], "Object");

    // Array
    this.registerFunction("Array.map", ["array: Array", "fn: Function"], "Array");
    this.registerFunction("Array.filter", ["array: Array", "fn: Function"], "Array");
    this.registerFunction("Array.reduce", ["array: Array", "fn: Function", "init: any"], "any");
    this.registerFunction("Array.find", ["array: Array", "fn: Function"], "any");
    this.registerFunction("Array.get", ["array: Array", "index: i32"], "any");
    this.registerFunction("Array.set", ["array: Array", "index: i32", "value: any"], "Array");
    this.registerFunction("Array.length", ["array: Array"], "i32");
    this.registerFunction("Array.push", ["array: Array", "value: any"], "Array");
    this.registerFunction("Array.pop", ["array: Array"], "any");
    this.registerFunction("Array.join", ["array: Array", "delimiter: string"], "string");
    this.registerFunction("Array.slice", ["array: Array", "start: i32", "end: i32"], "Array");
    this.registerFunction("Array.indexOf", ["array: Array", "value: any"], "i32");
    this.registerFunction("Array.includes", ["array: Array", "value: any"], "bool");
    this.registerFunction("Array.reverse", ["array: Array"], "Array");
    this.registerFunction("Array.sort", ["array: Array"], "Array");
    this.registerFunction("Array.length", ["array: Array"], "i32");

    // String
    this.registerFunction("String.split", ["str: string", "delimiter: string"], "Array<string>");
    this.registerFunction("String.join", ["arr: Array", "delimiter: string"], "string");
    this.registerFunction("String.upper", ["str: string"], "string");
    this.registerFunction("String.lower", ["str: string"], "string");
    this.registerFunction("String.trim", ["str: string"], "string");

    // Math
    this.registerFunction("Math.sqrt", ["x: f64"], "f64");
    this.registerFunction("Math.pow", ["x: f64", "y: f64"], "f64");
    this.registerFunction("Math.abs", ["x: f64"], "f64");

    // FileSystem
    this.registerFunction("FS.read", ["path: string"], "string");
    this.registerFunction("FS.write", ["path: string", "content: string"], "bool");
    this.registerFunction("FS.exists", ["path: string"], "bool");

    // JSON
    this.registerFunction("JSON.parse", ["str: string"], "Object");
    this.registerFunction("JSON.stringify", ["obj: Object"], "string");

    // Markdown
    this.registerFunction("Markdown.create", [], "Object");
    this.registerFunction("Markdown.heading", ["doc: Object", "level: i32", "text: string"], "Object");
    this.registerFunction("Markdown.paragraph", ["doc: Object", "text: string"], "Object");
    this.registerFunction("Markdown.code", ["doc: Object", "lang: string", "code: string"], "Object");
    this.registerFunction("Markdown.build", ["doc: Object"], "string");

    // Notion
    this.registerFunction("Notion.post", ["data: Object"], "Object");
    this.registerFunction("Notion.query", ["database_id: string", "filter: Object"], "Array");

    // Print (기본)
    this.registerFunction("print", ["value: any"], "null");

    // IO (입출력)
    this.registerFunction("IO.print", ["value: any"], "null");
    this.registerFunction("IO.print_array", ["array: Array"], "null");
    this.registerFunction("IO.print_object", ["obj: Object"], "null");
  }

  registerFunction(name, params, returnType) {
    this.vtFunctions.set(name, {
      params: params,
      returnType: returnType,
    });
  }

  /**
   * 주요 컴파일 함수
   */
  compile(claudelangJson) {
    try {
      // 1. 검증
      this.validate(claudelangJson);

      // 2. 타입 검사
      this.typeCheck(claudelangJson);

      // 3. VT 코드 생성
      const vtCode = this.generateVTCode(claudelangJson);

      return {
        success: true,
        code: vtCode,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        code: null,
        errors: [error.message],
      };
    }
  }

  /**
   * 스키마 검증
   */
  validate(obj) {
    if (!obj.version) {
      throw new Error("Missing 'version' field");
    }

    if (obj.version !== "6.0") {
      throw new Error(`Unsupported version: ${obj.version}`);
    }

    if (!Array.isArray(obj.instructions)) {
      throw new Error("'instructions' must be an array");
    }

    obj.instructions.forEach((instr, idx) => {
      if (!instr.type) {
        throw new Error(`Instruction at line ${idx} missing 'type'`);
      }

      switch (instr.type) {
        case "var":
          if (!instr.name || !instr.value_type) {
            throw new Error(`VarDeclaration at line ${idx} missing required fields`);
          }
          break;

        case "call":
          if (!instr.function || !Array.isArray(instr.args)) {
            throw new Error(`CallInstruction at line ${idx} missing required fields`);
          }
          break;

        case "condition":
          if (!instr.test || !Array.isArray(instr.then)) {
            throw new Error(`ConditionInstruction at line ${idx} missing required fields`);
          }
          break;

        case "loop":
          if (!instr.iterator || !instr.range || !Array.isArray(instr.body)) {
            throw new Error(`LoopInstruction at line ${idx} missing required fields`);
          }
          break;

        case "arithmetic":
          if (!instr.operator) {
            throw new Error(`ArithmeticInstruction at line ${idx} missing operator`);
          }
          break;

        case "comment":
          break;

        default:
          throw new Error(`Unknown instruction type at line ${idx}: ${instr.type}`);
      }
    });
  }

  /**
   * 타입 검사
   */
  typeCheck(ast) {
    this.scope.clear();

    ast.instructions.forEach((instr, idx) => {
      try {
        this.checkInstruction(instr);
      } catch (error) {
        throw new Error(`Type error at instruction ${idx}: ${error.message}`);
      }
    });
  }

  checkInstruction(instr) {
    switch (instr.type) {
      case "var":
        // 변수를 scope에 추가
        this.scope.set(instr.name, instr.value_type);

        // 초기값 타입이 있으면 검사
        if (instr.value !== undefined) {
          const exprType = this.inferType(instr.value);
          if (!this.isCompatible(exprType, instr.value_type)) {
            throw new Error(
              `Cannot assign ${exprType} to ${instr.value_type}`
            );
          }
        }
        break;

      case "call":
        // 함수 존재 여부 확인
        if (!this.vtFunctions.has(instr.function)) {
          throw new Error(`Unknown function: ${instr.function}`);
        }

        // 함수 시그니처 검사
        const signature = this.vtFunctions.get(instr.function);
        if (instr.args.length !== signature.params.length) {
          throw new Error(
            `${instr.function} expects ${signature.params.length} arguments, got ${instr.args.length}`
          );
        }

        // 반환값을 scope에 추가
        if (instr.assign_to) {
          this.scope.set(instr.assign_to, signature.returnType);
        }
        break;

      case "arithmetic":
        // 산술 연산 타입 추론
        const arithType = this.inferType({ type: "arithmetic" });
        if (instr.assign_to) {
          this.scope.set(instr.assign_to, arithType);
        }
        break;

      case "comparison":
        // 비교 연산 타입 추론
        if (instr.assign_to) {
          this.scope.set(instr.assign_to, "bool");
        }
        break;

      case "property_access":
        // 속성 접근 타입 추론
        if (instr.assign_to) {
          this.scope.set(instr.assign_to, "any");
        }
        break;

      case "condition":
        // 조건 검사 (선택사항)
        break;

      case "loop":
        // 범위 검사 (선택사항)
        break;
    }
  }

  inferType(expr) {
    if (!expr) {
      return "any";
    }

    // 기본 값 타입
    if (typeof expr === "number") {
      return "i32";
    }
    if (typeof expr === "string") {
      return "string";
    }
    if (typeof expr === "boolean") {
      return "bool";
    }

    if (expr.type === "literal") {
      return expr.value_type || "any";
    } else if (expr.type === "ref") {
      if (!this.scope.has(expr.name)) {
        // throw new Error(`Undefined variable: ${expr.name}`);
        return "any"; // 선언되지 않은 변수는 any로 취급
      }
      return this.scope.get(expr.name);
    } else if (expr.type === "arithmetic") {
      return "f64"; // 간단한 추론
    } else if (expr.type === "comparison") {
      return "bool";
    } else if (expr.type === "array") {
      // 배열 요소 타입 추론
      if (!expr.elements || expr.elements.length === 0) {
        return "Array<any>";
      }
      // 첫 번째 요소의 타입을 배열 타입으로 사용
      const elementType = this.inferType(expr.elements[0]);
      return `Array<${elementType}>`;
    } else if (expr.type === "object") {
      return "Object";
    } else if (expr.type === "lambda") {
      return "Function";
    } else if (expr.type === "call") {
      if (this.vtFunctions.has(expr.function)) {
        return this.vtFunctions.get(expr.function).returnType;
      }
      return "any";
    }

    return "any";
  }

  isCompatible(from, to) {
    if (from === to) return true;
    if (from === "any" || to === "any") return true;
    if (from === "i32" && to === "f64") return true; // 정수 → 실수

    // Generic type compatibility (e.g., Array<i32> to Array<i32>)
    if (from.startsWith("Array<") && to.startsWith("Array<")) {
      const fromElement = from.slice(6, -1); // Array<X> → X
      const toElement = to.slice(6, -1);     // Array<Y> → Y
      return this.isCompatible(fromElement, toElement);
    }

    return false;
  }

  /**
   * VT 코드 생성
   */
  generateVTCode(ast) {
    const lines = [
      "; CLAUDELang v6.0 compiled to VT",
      "; Generated code below",
      "",
    ];

    ast.instructions.forEach((instr) => {
      lines.push(this.generateInstruction(instr));
    });

    return lines.filter((line) => line !== null).join("\n");
  }

  generateInstruction(instr) {
    switch (instr.type) {
      case "var":
        return this.generateVarDeclaration(instr);

      case "call":
        return this.generateCallInstruction(instr);

      case "condition":
        return this.generateConditionInstruction(instr);

      case "loop":
        return this.generateLoopInstruction(instr);

      case "arithmetic":
        return this.generateArithmeticInstruction(instr);

      case "comparison":
        return this.generateComparisonInstruction(instr);

      case "property_access":
        return this.generatePropertyAccessInstruction(instr);

      case "comment":
        return `; ${instr.text}`;

      default:
        return null;
    }
  }

  generateVarDeclaration(instr) {
    let value;

    // 값이 기본 타입(숫자, 문자열, 불린)이면 직접 처리
    if (typeof instr.value === "number") {
      value = instr.value.toString();
    } else if (typeof instr.value === "string") {
      value = `"${instr.value}"`;
    } else if (typeof instr.value === "boolean") {
      value = instr.value ? "true" : "false";
    } else if (typeof instr.value === "object" && instr.value) {
      // 객체/배열이면 표현식으로 처리
      value = this.generateExpression(instr.value);
    } else {
      value = "null";
    }

    return `(define ${instr.name} ${value})`;
  }

  generateCallInstruction(instr) {
    const args = instr.args.map((arg) => this.generateExpression(arg)).join(" ");
    const callCode = `(call ${instr.function} ${args})`;

    if (instr.assign_to) {
      return `(define ${instr.assign_to} ${callCode})`;
    } else {
      return callCode;
    }
  }

  generateExpression(expr) {
    if (!expr) {
      return "null";
    }

    // 기본 타입 처리
    if (typeof expr === "number" || typeof expr === "boolean") {
      return expr.toString();
    }
    if (typeof expr === "string") {
      return `"${expr}"`;
    }

    // 객체/배열 타입 처리
    if (typeof expr !== "object" || !expr.type) {
      return "null";
    }

    switch (expr.type) {
      case "literal":
        if (expr.value_type === "string") {
          return `"${expr.value}"`;
        }
        return expr.value !== undefined ? expr.value.toString() : "null";

      case "ref":
        return expr.name;

      case "arithmetic":
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        return `(${expr.operator} ${left} ${right})`;

      case "comparison":
        const compLeft = this.generateExpression(expr.left);
        const compRight = this.generateExpression(expr.right);
        return `(${expr.operator} ${compLeft} ${compRight})`;

      case "array":
        if (!expr.elements || expr.elements.length === 0) {
          return "(array)";
        }
        const elements = expr.elements
          .map((e) => this.generateExpression(e))
          .join(" ");
        return `(array ${elements})`;

      case "object":
        const props = Object.entries(expr.properties)
          .map(([key, value]) => `("${key}" ${this.generateExpression(value)})`)
          .join(" ");
        return `(object ${props})`;

      case "lambda":
        const params = expr.params ? expr.params.map((p) => p.name).join(" ") : "";
        const bodyExpr = expr.body
          .map((b) => {
            // Check if it's an instruction or an expression
            if (b.type === "arithmetic" || b.type === "comparison" || b.type === "ref" || b.type === "literal" || b.type === "call") {
              return this.generateExpression(b);
            } else {
              return this.generateInstruction(b);
            }
          })
          .filter((b) => b !== null)
          .join(" ");
        return `(fn (${params}) ${bodyExpr})`;

      case "property":
        const obj = this.generateExpression(expr.object);
        return `(property ${obj} "${expr.property}")`;

      case "property_access":
        const objPA = this.generateExpression(expr.object);
        return `(property ${objPA} "${expr.property}")`;

      case "index":
        const array = this.generateExpression(expr.array);
        const index = this.generateExpression(expr.index);
        return `(index ${array} ${index})`;

      default:
        return "null";
    }
  }

  generateConditionInstruction(instr) {
    const test = this.generateExpression(instr.test);
    const thenCode = instr.then
      .map((i) => this.generateInstruction(i))
      .filter((i) => i !== null)
      .join(" ");
    const elseCode = instr.else
      ? instr.else
          .map((i) => this.generateInstruction(i))
          .filter((i) => i !== null)
          .join(" ")
      : "null";

    return `(if ${test} (do ${thenCode}) (do ${elseCode}))`;
  }

  generateLoopInstruction(instr) {
    const range = this.generateExpression(instr.range);
    const body = instr.body
      .map((i) => this.generateInstruction(i))
      .filter((i) => i !== null)
      .join(" ");

    return `(for ${instr.iterator} ${range} (do ${body}))`;
  }

  generateArithmeticInstruction(instr) {
    const left = this.generateExpression(instr.left);
    const right = this.generateExpression(instr.right);
    const callCode = `(${instr.operator} ${left} ${right})`;

    if (instr.assign_to) {
      return `(define ${instr.assign_to} ${callCode})`;
    } else {
      return callCode;
    }
  }

  generateComparisonInstruction(instr) {
    const left = this.generateExpression(instr.left);
    const right = this.generateExpression(instr.right);
    const callCode = `(${instr.operator} ${left} ${right})`;

    if (instr.assign_to) {
      return `(define ${instr.assign_to} ${callCode})`;
    } else {
      return callCode;
    }
  }

  generatePropertyAccessInstruction(instr) {
    const obj = this.generateExpression(instr.object);
    const prop = `"${instr.property}"`;
    const callCode = `(property ${obj} ${prop})`;

    if (instr.assign_to) {
      return `(define ${instr.assign_to} ${callCode})`;
    } else {
      return callCode;
    }
  }
}

// 내보내기
if (typeof module !== "undefined" && module.exports) {
  module.exports = CLAUDELangCompiler;
}

