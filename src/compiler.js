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
    this.registerFunction("Array.slice", ["array: Array", "start: i32", "end: i32"], "Array", 2);
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
    this.registerFunction("println", ["value: any"], "null");

    // IO (입출력)
    this.registerFunction("IO.print", ["value: any"], "null");
    this.registerFunction("IO.print_array", ["array: Array"], "null");
    this.registerFunction("IO.print_object", ["obj: Object"], "null");

    // Map (제너릭 컬렉션)
    this.registerFunction("Map.create", [], "Map<any,any>");
    this.registerFunction("Map.get", ["map: Map", "key: any"], "any");
    this.registerFunction("Map.set", ["map: Map", "key: any", "value: any"], "Map");
    this.registerFunction("Map.has", ["map: Map", "key: any"], "bool");
    this.registerFunction("Map.delete", ["map: Map", "key: any"], "bool");
    this.registerFunction("Map.keys", ["map: Map"], "Array");
    this.registerFunction("Map.values", ["map: Map"], "Array");
    this.registerFunction("Map.size", ["map: Map"], "i32");
    this.registerFunction("Map.clear", ["map: Map"], "null");

    // Set (제너릭 컬렉션)
    this.registerFunction("Set.create", [], "Set<any>");
    this.registerFunction("Set.add", ["set: Set", "value: any"], "Set");
    this.registerFunction("Set.has", ["set: Set", "value: any"], "bool");
    this.registerFunction("Set.delete", ["set: Set", "value: any"], "bool");
    this.registerFunction("Set.size", ["set: Set"], "i32");
    this.registerFunction("Set.clear", ["set: Set"], "null");
    this.registerFunction("Set.toArray", ["set: Set"], "Array");
  }

  registerFunction(name, params, returnType, minParams = null) {
    this.vtFunctions.set(name, {
      params: params,
      returnType: returnType,
      minParams: minParams !== null ? minParams : params.length
    });
  }

  /**
   * 주요 컴파일 함수 (3-pass compilation)
   */
  compile(claudelangJson, baseDir = process.cwd(), moduleCache = new Map()) {
    try {
      // 0. 모듈 처리 (3-pass: import/export)
      const imports = claudelangJson.imports || [];
      const loadedModules = {};
      this.loadingModules = this.loadingModules || new Set();

      for (const importItem of imports) {
        const modulePath = importItem.module;
        const symbols = importItem.symbols || null; // null = 전체 import
        const resolved = this.resolveAndLoadModule(
          modulePath,
          baseDir,
          moduleCache,
          loadedModules,
          symbols
        );
        if (!resolved.success) {
          throw new Error(`Failed to import ${modulePath}: ${resolved.error}`);
        }
      }

      // 1. 사용자 정의 함수 미리 등록 (2-pass: first pass)
      this.collectFunctionDefinitions(claudelangJson);

      // 2. 검증
      this.validate(claudelangJson);

      // 3. 타입 검사
      this.typeCheck(claudelangJson);

      // 4. VT 코드 생성
      let vtCode = this.generateVTCode(claudelangJson);

      // 모듈 내보내기 주석 추가
      if (claudelangJson.exports && claudelangJson.exports.length > 0) {
        const exportComment = `; 내보내기: ${claudelangJson.exports.join(", ")}\n`;
        vtCode = exportComment + vtCode;
      }

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
   * 모듈 해석 및 로드 (순환 import 감지 + 선택적 심볼 import)
   */
  resolveAndLoadModule(modulePath, baseDir, moduleCache, loadedModules, symbols = null) {
    const fs = require('fs');
    const path = require('path');

    // 절대 경로로 변환
    const resolvedPath = path.isAbsolute(modulePath)
      ? modulePath
      : path.join(baseDir, modulePath);

    // 확장자 추가 (.json이 없으면)
    const fullPath = resolvedPath.endsWith('.json')
      ? resolvedPath
      : resolvedPath + '.json';

    // 순환 import 감지
    if (this.loadingModules.has(fullPath)) {
      return {
        success: false,
        error: `Circular import detected: ${fullPath}`
      };
    }

    // 캐시에서 확인
    if (moduleCache.has(fullPath)) {
      return {
        success: true,
        module: moduleCache.get(fullPath)
      };
    }

    try {
      this.loadingModules.add(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const moduleJson = JSON.parse(content);

      // 모듈의 재귀적 import 처리
      const moduleDir = path.dirname(fullPath);
      const moduleImports = moduleJson.imports || [];
      for (const importItem of moduleImports) {
        const result = this.resolveAndLoadModule(
          importItem.module,
          moduleDir,
          moduleCache,
          loadedModules,
          importItem.symbols
        );
        if (!result.success) {
          return result;
        }
      }

      // 모듈의 함수 등록 (선택적 import 지원)
      if (moduleJson.instructions && Array.isArray(moduleJson.instructions)) {
        moduleJson.instructions.forEach((instr) => {
          if (instr.type === "function") {
            // symbols 필터링: null이면 전체, 배열이면 해당하는 것만
            const shouldRegister = !symbols || symbols.includes(instr.name);

            if (shouldRegister) {
              const paramTypes = instr.params.map(p => `${p.name}: ${p.type || "any"}`);
              const returnType = instr.return_type || "any";
              this.registerFunction(instr.name, paramTypes, returnType);
            }
          }
        });
      }

      // 캐시에 저장
      moduleCache.set(fullPath, moduleJson);
      this.loadingModules.delete(fullPath);

      return {
        success: true,
        module: moduleJson
      };
    } catch (error) {
      this.loadingModules.delete(fullPath);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 함수 정의 사전 수집 (2-pass compilation - first pass)
   * 타입 체크 전에 모든 함수 정의를 등록하여 forward reference 허용
   */
  collectFunctionDefinitions(obj) {
    if (!Array.isArray(obj.instructions)) {
      return;
    }

    obj.instructions.forEach((instr) => {
      if (instr.type === "function") {
        // 함수 정의를 vtFunctions에 등록
        const paramTypes = instr.params.map(p => `${p.name}: ${p.type || "any"}`);
        const returnType = instr.return_type || "any";
        this.registerFunction(instr.name, paramTypes, returnType);
      }
    });
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

        case "function":
          if (!instr.name || !Array.isArray(instr.params) || !Array.isArray(instr.body)) {
            throw new Error(`FunctionDeclaration at line ${idx} missing required fields`);
          }
          break;

        case "return":
          if (!instr.value) {
            throw new Error(`ReturnInstruction at line ${idx} missing value`);
          }
          break;

        case "try":
          if (!Array.isArray(instr.body)) {
            throw new Error(`TryInstruction at line ${idx} missing body`);
          }
          break;

        case "throw":
          if (!instr.message) {
            throw new Error(`ThrowInstruction at line ${idx} missing message`);
          }
          break;

        case "class":
          if (!instr.name || !Array.isArray(instr.body)) {
            throw new Error(`ClassDeclaration at line ${idx} missing required fields`);
          }
          break;

        case "new":
          if (!instr.class_name || !Array.isArray(instr.args)) {
            throw new Error(`NewInstruction at line ${idx} missing required fields`);
          }
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
        const minParams = signature.minParams || signature.params.length;
        const maxParams = signature.params.length;

        if (instr.args.length < minParams || instr.args.length > maxParams) {
          throw new Error(
            `${instr.function} expects ${minParams}-${maxParams} arguments, got ${instr.args.length}`
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

      case "function":
        // 함수 정의: 함수명을 scope에 등록
        this.scope.set(instr.name, `fn[${instr.params.map(p => p.type || "any").join(",")}]`);
        // 파라미터도 scope에 등록
        if (instr.params && Array.isArray(instr.params)) {
          instr.params.forEach(param => {
            this.scope.set(param.name, param.type || "any");
          });
        }
        // 함수 바디의 각 instruction을 검사
        if (instr.body && Array.isArray(instr.body)) {
          instr.body.forEach(bodyInstr => {
            this.checkInstruction(bodyInstr);
          });
        }
        break;

      case "return":
        // return 값의 타입을 검사 (선택사항)
        if (instr.value) {
          this.inferType(instr.value);
        }
        break;

      case "try":
        // try 블록 내의 instruction들을 검사
        if (instr.body && Array.isArray(instr.body)) {
          instr.body.forEach(bodyInstr => {
            this.checkInstruction(bodyInstr);
          });
        }
        // catch 블록 검사
        if (instr.catch && Array.isArray(instr.catch.body)) {
          instr.catch.body.forEach(catchInstr => {
            this.checkInstruction(catchInstr);
          });
        }
        // finally 블록 검사
        if (instr.finally && Array.isArray(instr.finally)) {
          instr.finally.forEach(finallyInstr => {
            this.checkInstruction(finallyInstr);
          });
        }
        break;

      case "throw":
        // throw 메시지 타입 검사 (선택사항)
        if (instr.message) {
          this.inferType(instr.message);
        }
        break;

      case "comment":
        // 주석은 무시
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

      case "function":
        return this.generateFunctionDeclaration(instr);

      case "return":
        return this.generateReturnStatement(instr);

      case "try":
        return this.generateTryStatement(instr);

      case "throw":
        return this.generateThrowStatement(instr);

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

      case "call":
        const callArgs = expr.args ? expr.args.map((arg) => this.generateExpression(arg)).join(" ") : "";
        return `(call ${expr.function}${callArgs ? ' ' + callArgs : ''})`;

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
        const params = expr.params ? expr.params.map((p) => typeof p === 'string' ? p : p.name).join(" ") : "";
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

    // 주석과 코드를 분리하여 처리
    const thenLines = instr.then
      .map((i) => this.generateInstruction(i))
      .filter((i) => i !== null);

    const comments = thenLines.filter((line) => line.startsWith(";")).join("\n");
    const thenCode = thenLines
      .filter((line) => !line.startsWith(";"))
      .join(" ");

    const elseLines = instr.else
      ? instr.else
          .map((i) => this.generateInstruction(i))
          .filter((i) => i !== null)
      : [];

    const elseComments = elseLines.filter((line) => line.startsWith(";")).join("\n");
    const elseCode = elseLines
      .filter((line) => !line.startsWith(";"))
      .join(" ") || "null";

    let result = "";
    if (comments) result += comments + "\n";
    if (elseComments) result += elseComments + "\n";

    result += `(if ${test} (do ${thenCode}) (do ${elseCode}))`;
    return result;
  }

  generateLoopInstruction(instr) {
    const range = this.generateExpression(instr.range);

    // 주석과 코드를 분리하여 처리
    const bodyLines = instr.body
      .map((i) => this.generateInstruction(i))
      .filter((i) => i !== null);

    const comments = bodyLines.filter((line) => line.startsWith(";")).join("\n");
    const bodyCode = bodyLines
      .filter((line) => !line.startsWith(";"))
      .join(" ");

    let result = "";
    if (comments) result += comments + "\n";
    result += `(for ${instr.iterator} ${range} (do ${bodyCode}))`;
    return result;
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

  /**
   * 함수 정의 생성: (defn name (params...) body...)
   */
  generateFunctionDeclaration(instr) {
    const params = instr.params
      .map(p => p.name)
      .join(" ");

    const bodyLines = instr.body
      .map(b => this.generateInstruction(b))
      .filter(line => line !== null);

    const bodyCode = bodyLines.join("\n    ");

    return `(defn ${instr.name} (${params})\n    ${bodyCode})`;
  }

  /**
   * 반환 명령어 생성
   */
  generateReturnStatement(instr) {
    const value = this.generateExpression(instr.value);
    return `(return ${value})`;
  }

  /**
   * try/catch/finally 생성
   */
  generateTryStatement(instr) {
    // 주석과 코드를 분리하여 처리
    const bodyLines = instr.body
      .map(b => this.generateInstruction(b))
      .filter(line => line !== null);

    const comments = bodyLines.filter((line) => line.startsWith(";")).join("\n");
    const bodyCode = bodyLines
      .filter((line) => !line.startsWith(";"))
      .join(" ");

    let result = "";
    if (comments) result += comments + "\n";
    result += `(try (do ${bodyCode})`;

    if (instr.catch) {
      const catchLines = instr.catch.body
        .map(b => this.generateInstruction(b))
        .filter(line => line !== null);
      const catchCode = catchLines
        .filter((line) => !line.startsWith(";"))
        .join(" ");
      result += ` (catch ${instr.catch.error_var} (do ${catchCode}))`;
    }

    if (instr.finally && instr.finally.length > 0) {
      const finallyLines = instr.finally
        .map(b => this.generateInstruction(b))
        .filter(line => line !== null);
      const finallyCode = finallyLines
        .filter((line) => !line.startsWith(";"))
        .join(" ");
      result += ` (finally (do ${finallyCode}))`;
    }

    result += ")";
    return result;
  }

  /**
   * throw 명령어 생성
   */
  generateThrowStatement(instr) {
    const message = this.generateExpression(instr.message);
    const errorType = instr.error_type || "Error";
    return `(throw "${errorType}" ${message})`;
  }
}

// 내보내기
if (typeof module !== "undefined" && module.exports) {
  module.exports = CLAUDELangCompiler;
}

