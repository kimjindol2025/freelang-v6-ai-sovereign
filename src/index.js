/**
 * CLAUDELang v6.0 통합 시스템
 *
 * 기능:
 * 1. JSON 파일 읽기
 * 2. 컴파일러를 통한 VT 바이트코드 생성
 * 3. VT 런타임에서 실행
 * 4. 결과값 추출 및 검증
 */

const fs = require('fs');
const path = require('path');
const CLAUDELangCompiler = require('./compiler.js');

/**
 * 향상된 VT 런타임
 * Array.map, Array.filter 등의 고차 함수 지원
 */
class VTRuntime {
  constructor() {
    this.scope = new Map();
    this.output = [];
    this.executionTime = 0;
    this.memoryUsage = 0;
    this.instructionCount = 0;
    this.lastResult = undefined;
  }

  /**
   * VT 코드 실행
   */
  execute(vtCode) {
    const startTime = Date.now();
    const startMem = process.memoryUsage().heapUsed;

    try {
      const lines = vtCode.split('\n').filter(line => {
        return line.trim() && !line.trim().startsWith(';');
      });

      for (const line of lines) {
        this.executeSExpression(line.trim());
        this.instructionCount++;
      }

      const endTime = Date.now();
      const endMem = process.memoryUsage().heapUsed;

      this.executionTime = endTime - startTime;
      this.memoryUsage = Math.max(0, (endMem - startMem) / 1024 / 1024);

      return {
        success: true,
        output: this.output,
        result: this.lastResult,
        executionTime: this.executionTime,
        memoryUsage: this.memoryUsage,
        instructionCount: this.instructionCount,
      };
    } catch (error) {
      return {
        success: false,
        output: this.output,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * S-expression 실행
   */
  executeSExpression(expr) {
    // 기본 변수 선언: (define name value)
    const defineMatch = expr.match(/^\(define\s+(\w+)\s+(.+)\)$/);
    if (defineMatch) {
      const [, name, valueExpr] = defineMatch;
      this.lastResult = this.evaluateExpression(valueExpr);
      this.scope.set(name, this.lastResult);
      return;
    }

    // 함수 호출: (call function arg1 arg2 ...)
    const callMatch = expr.match(/^\(call\s+(\S+)\s*(.*)\)$/);
    if (callMatch) {
      const [, funcName, argsStr] = callMatch;
      this.lastResult = this.executeFunction(funcName, argsStr);
      return;
    }

    // if 조건: (if condition then-block else-block)
    const ifMatch = expr.match(/^\(if\s+(.+?)\s+\(do\s+(.+?)\)\s+\(do\s+(.+?)\)\)$/);
    if (ifMatch) {
      const [, condExpr, thenExpr, elseExpr] = ifMatch;
      const condition = this.evaluateExpression(condExpr);
      if (condition) {
        this.executeSExpression(thenExpr);
      } else {
        this.executeSExpression(elseExpr);
      }
      return;
    }

    // for 루프: (for iterator range body) 또는 (for iterator varname (do body))
    const forMatch = expr.match(/^\(for\s+(\w+)\s+(.+?)\s+\(do\s+(.+)\)\)$/);
    if (forMatch) {
      const [, iterator, rangeExpr, bodyExpr] = forMatch;

      // range 평가: 배열 리터럴 또는 변수 참조
      let elements = [];
      if (rangeExpr.startsWith('(array')) {
        // (array 1 2 3) 형태
        const arrayMatch = rangeExpr.match(/^\(array\s+([\d\s]+)\)$/);
        if (arrayMatch) {
          elements = arrayMatch[1].trim().split(/\s+/).map(e => Number(e));
        }
      } else {
        // 변수 참조
        const value = this.evaluateExpression(rangeExpr);
        if (Array.isArray(value)) {
          elements = value;
        }
      }

      for (const elem of elements) {
        this.scope.set(iterator, elem);
        this.executeSExpression(bodyExpr);
      }
      return;
    }
  }

  /**
   * 식 평가
   */
  evaluateExpression(expr) {
    expr = expr.trim();

    // 문자열 리터럴
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // 숫자 리터럴
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // 참조 (변수명)
    if (this.scope.has(expr)) {
      return this.scope.get(expr);
    }

    // 배열: (array elem1 elem2 ...)
    if (expr.startsWith('(array')) {
      const elementsStr = expr.slice(7, -1).trim();
      if (!elementsStr) return [];
      return elementsStr.split(/\s+/).map(e => this.evaluateExpression(e));
    }

    // 객체: (object (key1 val1) (key2 val2) ...)
    if (expr.startsWith('(object')) {
      const obj = {};
      const propsStr = expr.slice(8, -1);
      const propMatches = propsStr.match(/\("(\w+)"\s+([^)]+)\)/g);
      if (propMatches) {
        propMatches.forEach(prop => {
          const match = prop.match(/\("(\w+)"\s+(.+)\)/);
          if (match) {
            obj[match[1]] = this.evaluateExpression(match[2]);
          }
        });
      }
      return obj;
    }

    // 산술 연산: (+ a b), (- a b), (* a b), (/ a b), (% a b)
    const arithmeticOp = expr.match(/^\(([+\-*/%])/);
    if (arithmeticOp) {
      const operator = arithmeticOp[1];
      const content = expr.slice(operator.length + 2, -1).trim();

      // Split by the last space that's not inside parentheses
      let depth = 0;
      let splitIdx = -1;
      for (let i = content.length - 1; i >= 0; i--) {
        if (content[i] === ')') depth++;
        else if (content[i] === '(') depth--;
        else if (content[i] === ' ' && depth === 0) {
          splitIdx = i;
          break;
        }
      }

      if (splitIdx > 0) {
        const left = content.substring(0, splitIdx);
        const right = content.substring(splitIdx + 1);
        const leftVal = this.evaluateExpression(left);
        const rightVal = this.evaluateExpression(right);
        switch (operator) {
          case '+': return leftVal + rightVal;
          case '-': return leftVal - rightVal;
          case '*': return leftVal * rightVal;
          case '/': return leftVal / rightVal;
          case '%': return leftVal % rightVal;
        }
      }
    }

    // 비교 연산: (== a b), (!= a b), (< a b), (> a b), (<= a b), (>= a b)
    const comparisonMatch = expr.match(/^\((==|!=|<|>|<=|>=)\s+(.+)\s+([^()]*|.+)\)$/);
    if (comparisonMatch) {
      const compOp = expr.match(/^\((==|!=|<|>|<=|>=)/);
      if (compOp) {
        const operator = compOp[1];
        // Extract left and right operands by finding the split point
        const content = expr.slice(operator.length + 2, -1).trim();

        // Split by the last space that's not inside parentheses
        let depth = 0;
        let splitIdx = -1;
        for (let i = content.length - 1; i >= 0; i--) {
          if (content[i] === ')') depth++;
          else if (content[i] === '(') depth--;
          else if (content[i] === ' ' && depth === 0) {
            splitIdx = i;
            break;
          }
        }

        if (splitIdx > 0) {
          const left = content.substring(0, splitIdx);
          const right = content.substring(splitIdx + 1);
          const leftVal = this.evaluateExpression(left);
          const rightVal = this.evaluateExpression(right);
          switch (operator) {
            case '==': return leftVal === rightVal;
            case '!=': return leftVal !== rightVal;
            case '<': return leftVal < rightVal;
            case '>': return leftVal > rightVal;
            case '<=': return leftVal <= rightVal;
            case '>=': return leftVal >= rightVal;
          }
        }
      }
    }

    // 속성 접근: (property obj "prop")
    const propertyMatch = expr.match(/^\(property\s+(.+?)\s+"(\w+)"\)$/);
    if (propertyMatch) {
      const [, objExpr, propName] = propertyMatch;
      const obj = this.evaluateExpression(objExpr);
      if (obj && typeof obj === 'object' && propName in obj) {
        return obj[propName];
      }
      return null;
    }

    // 인덱스 접근: (index array idx)
    const indexMatch = expr.match(/^\(index\s+(.+?)\s+(.+)\)$/);
    if (indexMatch) {
      const [, arrayExpr, indexExpr] = indexMatch;
      const array = this.evaluateExpression(arrayExpr);
      const index = this.evaluateExpression(indexExpr);
      if (Array.isArray(array) && typeof index === 'number') {
        return array[Math.floor(index)];
      }
      return null;
    }

    // 함수 호출: (call function arg1 arg2 ...)
    const callExpr = expr.match(/^\(call\s+(\S+)\s*(.*)\)$/);
    if (callExpr) {
      const [, funcName, argsStr] = callExpr;
      return this.executeFunction(funcName, argsStr);
    }

    // 함수: (fn (params) body)
    if (expr.startsWith('(fn')) {
      // 람다 함수 반환 (실제 평가는 나중에)
      return { type: 'lambda', expr: expr };
    }

    return null;
  }

  /**
   * 함수 실행
   */
  executeFunction(funcName, argsStr) {
    const args = this.parseArguments(argsStr);

    switch (funcName) {
      case 'print':
        if (args.length > 0) {
          this.output.push(String(args[0]));
        }
        return args[0];

      case 'IO.print_array':
        if (args.length > 0 && Array.isArray(args[0])) {
          const result = args[0];
          this.output.push(JSON.stringify(result));
          return result;
        }
        return null;

      case 'Array.map': {
        if (args.length >= 2 && Array.isArray(args[0]) && args[1].type === 'lambda') {
          const array = args[0];
          const lambdaExpr = args[1].expr;

          // 람다 파라미터 추출: (fn (param) body)
          const paramMatch = lambdaExpr.match(/\(fn\s+\((\w+)\)\s+(.+)\)/);
          if (paramMatch) {
            const [, paramName, bodyExpr] = paramMatch;
            const result = [];
            for (const elem of array) {
              this.scope.set(paramName, elem);
              result.push(this.evaluateExpression(bodyExpr));
            }
            return result;
          }
        }
        return args[0];
      }

      case 'Array.filter': {
        if (args.length >= 2 && Array.isArray(args[0]) && args[1].type === 'lambda') {
          const array = args[0];
          const lambdaExpr = args[1].expr;

          const paramMatch = lambdaExpr.match(/\(fn\s+\((\w+)\)\s+(.+)\)/);
          if (paramMatch) {
            const [, paramName, bodyExpr] = paramMatch;
            const result = [];
            for (const elem of array) {
              this.scope.set(paramName, elem);
              if (this.evaluateExpression(bodyExpr)) {
                result.push(elem);
              }
            }
            return result;
          }
        }
        return args[0];
      }

      case 'Array.reduce': {
        if (args.length >= 3 && Array.isArray(args[0]) && args[1].type === 'lambda') {
          const array = args[0];
          const lambdaExpr = args[1].expr;
          let accumulator = args[2];

          const paramMatch = lambdaExpr.match(/\(fn\s+\((\w+)\s+(\w+)\)\s+(.+)\)/);
          if (paramMatch) {
            const [, accName, elemName, bodyExpr] = paramMatch;
            for (const elem of array) {
              this.scope.set(accName, accumulator);
              this.scope.set(elemName, elem);
              accumulator = this.evaluateExpression(bodyExpr);
            }
            return accumulator;
          }
        }
        return args[2];
      }

      case 'String.split': {
        if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
          return args[0].split(args[1]);
        }
        return args[0];
      }

      case 'String.join': {
        if (args.length >= 2 && Array.isArray(args[0]) && typeof args[1] === 'string') {
          return args[0].join(args[1]);
        }
        return '';
      }

      case 'String.upper': {
        if (args.length >= 1 && typeof args[0] === 'string') {
          return args[0].toUpperCase();
        }
        return args[0];
      }

      case 'String.lower': {
        if (args.length >= 1 && typeof args[0] === 'string') {
          return args[0].toLowerCase();
        }
        return args[0];
      }

      case 'String.trim': {
        if (args.length >= 1 && typeof args[0] === 'string') {
          return args[0].trim();
        }
        return args[0];
      }

      case 'String.concat': {
        // 모든 인수를 문자열로 연결
        return args.map(arg => String(arg)).join('');
      }

      case 'Math.sqrt':
        return Math.sqrt(Number(args[0]));

      case 'Math.pow':
        return Math.pow(Number(args[0]), Number(args[1]));

      case 'Math.abs':
        return Math.abs(Number(args[0]));

      case 'Array.find': {
        if (args.length >= 2 && Array.isArray(args[0]) && args[1].type === 'lambda') {
          const array = args[0];
          const lambdaExpr = args[1].expr;

          const paramMatch = lambdaExpr.match(/\(fn\s+\((\w+)\)\s+(.+)\)/);
          if (paramMatch) {
            const [, paramName, bodyExpr] = paramMatch;
            for (const elem of array) {
              this.scope.set(paramName, elem);
              if (this.evaluateExpression(bodyExpr)) {
                return elem;
              }
            }
          }
        }
        return null;
      }

      case 'JSON.stringify':
        return JSON.stringify(args[0]);

      case 'JSON.parse':
        try {
          return JSON.parse(args[0]);
        } catch {
          return null;
        }

      default:
        this.output.push(`[${funcName}] 함수 호출`);
        return null;
    }
  }

  /**
   * 인수 파싱
   */
  parseArguments(argsStr) {
    if (!argsStr.trim()) return [];

    const args = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;

    for (const char of argsStr) {
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === '(' && !inQuotes) {
        depth++;
        current += char;
      } else if (char === ')' && !inQuotes) {
        depth--;
        current += char;
      } else if (char === ' ' && !inQuotes && depth === 0) {
        if (current) args.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) args.push(current);

    return args.map(arg => this.evaluateExpression(arg));
  }
}

/**
 * CLAUDELang 메인 클래스
 * JSON 파일 읽기 → 컴파일 → 실행 → 결과 반환
 */
class CLAUDELang {
  constructor(debugMode = false) {
    this.compiler = new CLAUDELangCompiler();
    this.runtime = new VTRuntime();
    this.moduleCache = new Map(); // 모듈 캐싱 (중복 로드 방지)
    this.bytecodeCache = new Map(); // VT 바이트코드 캐싱
    this.debugMode = debugMode;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      compilations: 0
    };
  }

  /**
   * 프로그램의 해시값 계산 (캐싱용)
   */
  hashProgram(program) {
    const crypto = require('crypto');
    const str = JSON.stringify(program);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * 모듈 import 처리
   */
  importModule(modulePath, baseDir) {
    const result = this.compiler.resolveAndLoadModule(
      modulePath,
      baseDir,
      this.moduleCache,
      {}
    );
    return result;
  }

  /**
   * 파일 실행 (모듈 지원)
   */
  runFile(jsonFilePath) {
    try {
      // 1. JSON 파일 읽기
      const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
      const program = JSON.parse(fileContent);

      // 2. 파일의 기본 디렉토리 추출 (모듈 import를 위해)
      const baseDir = path.dirname(path.resolve(jsonFilePath));

      // 3. 컴파일 (모듈 지원)
      const compileResult = this.compiler.compile(
        program,
        baseDir,
        this.moduleCache
      );
      if (!compileResult.success) {
        return {
          success: false,
          error: `Compilation failed: ${compileResult.errors.join(', ')}`,
        };
      }

      // 4. VT 런타임에서 실행
      this.runtime = new VTRuntime(); // 런타임 초기화
      const executionResult = this.runtime.execute(compileResult.code);

      // 5. 결과 반환
      return {
        success: executionResult.success,
        output: executionResult.output,
        result: executionResult.result,
        executionTime: executionResult.executionTime,
        memoryUsage: executionResult.memoryUsage,
        instructionCount: executionResult.instructionCount,
        error: executionResult.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 프로그램 문자열 실행 (모듈 지원 + 바이트코드 캐싱 + 디버그 모드)
   */
  runProgram(program, baseDir = process.cwd(), debugMode = null) {
    try {
      // debugMode가 null이면 인스턴스 설정 사용
      const enableDebug = debugMode !== null ? debugMode : this.debugMode;

      // 1. 바이트코드 캐시 확인
      const programHash = this.hashProgram(program);
      let vtCode;
      let cachedCompilation = false;

      if (this.bytecodeCache.has(programHash)) {
        vtCode = this.bytecodeCache.get(programHash);
        this.cacheStats.hits++;
        cachedCompilation = true;
      } else {
        // 2. 컴파일 (모듈 지원)
        const compileResult = this.compiler.compile(
          program,
          baseDir,
          this.moduleCache
        );
        if (!compileResult.success) {
          return {
            success: false,
            error: `Compilation failed: ${compileResult.errors.join(', ')}`,
          };
        }

        vtCode = compileResult.code;
        this.bytecodeCache.set(programHash, vtCode);
        this.cacheStats.misses++;
        this.cacheStats.compilations++;
      }

      // 3. 실행 (디버그 모드 지원)
      this.runtime = new VTRuntime();
      const executionResult = this.runtime.execute(vtCode);

      const result = {
        success: executionResult.success,
        output: executionResult.output,
        result: executionResult.result,
        executionTime: executionResult.executionTime,
        memoryUsage: executionResult.memoryUsage,
        instructionCount: executionResult.instructionCount,
        error: executionResult.error,
        _cached: cachedCompilation // 내부 통계용
      };

      // 디버그 모드: execution trace 포함
      if (enableDebug && executionResult.trace) {
        result.trace = executionResult.trace;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total === 0 ? 0 : ((this.cacheStats.hits / total) * 100).toFixed(2);
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      total: total,
      hitRate: `${hitRate}%`,
      compilations: this.cacheStats.compilations,
      cacheSize: this.bytecodeCache.size
    };
  }

  /**
   * 캐시 초기화
   */
  clearBytecodeCache() {
    this.bytecodeCache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      compilations: 0
    };
  }

  /**
   * 예제 디렉토리의 모든 파일 실행
   */
  runExamplesDirectory(examplesDir) {
    const results = {};
    const files = fs.readdirSync(examplesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    for (const file of files) {
      const filePath = path.join(examplesDir, file);
      const name = path.basename(file, '.json');
      results[name] = this.runFile(filePath);
    }

    return results;
  }
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CLAUDELang, VTRuntime };
}
