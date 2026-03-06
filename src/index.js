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

    // for 루프: (for iterator range body)
    const forMatch = expr.match(/^\(for\s+(\w+)\s+\(array\s+([\d\s]+)\)\s+\(do\s+(.+?)\)\)$/);
    if (forMatch) {
      const [, iterator, elementsStr, bodyExpr] = forMatch;
      const elements = elementsStr.trim().split(/\s+/).map(e => Number(e));
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
    const arithmeticMatch = expr.match(/^\(([+\-*/%])\s+(.+?)\s+(.+)\)$/);
    if (arithmeticMatch) {
      const [, op, left, right] = arithmeticMatch;
      const leftVal = this.evaluateExpression(left);
      const rightVal = this.evaluateExpression(right);
      switch (op) {
        case '+': return leftVal + rightVal;
        case '-': return leftVal - rightVal;
        case '*': return leftVal * rightVal;
        case '/': return leftVal / rightVal;
        case '%': return leftVal % rightVal;
      }
    }

    // 비교 연산: (== a b), (!= a b), (< a b), (> a b), (<= a b), (>= a b)
    const comparisonMatch = expr.match(/^\((==|!=|<|>|<=|>=)\s+(.+?)\s+(.+)\)$/);
    if (comparisonMatch) {
      const [, op, left, right] = comparisonMatch;
      const leftVal = this.evaluateExpression(left);
      const rightVal = this.evaluateExpression(right);
      switch (op) {
        case '==': return leftVal === rightVal;
        case '!=': return leftVal !== rightVal;
        case '<': return leftVal < rightVal;
        case '>': return leftVal > rightVal;
        case '<=': return leftVal <= rightVal;
        case '>=': return leftVal >= rightVal;
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
  constructor() {
    this.compiler = new CLAUDELangCompiler();
    this.runtime = new VTRuntime();
  }

  /**
   * 파일 실행
   */
  runFile(jsonFilePath) {
    try {
      // 1. JSON 파일 읽기
      const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
      const program = JSON.parse(fileContent);

      // 2. 컴파일
      const compileResult = this.compiler.compile(program);
      if (!compileResult.success) {
        return {
          success: false,
          error: `Compilation failed: ${compileResult.errors.join(', ')}`,
        };
      }

      // 3. VT 런타임에서 실행
      this.runtime = new VTRuntime(); // 런타임 초기화
      const executionResult = this.runtime.execute(compileResult.code);

      // 4. 결과 반환
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
   * 프로그램 문자열 실행
   */
  runProgram(program) {
    try {
      // 1. 컴파일
      const compileResult = this.compiler.compile(program);
      if (!compileResult.success) {
        return {
          success: false,
          error: `Compilation failed: ${compileResult.errors.join(', ')}`,
        };
      }

      // 2. 실행
      this.runtime = new VTRuntime();
      const executionResult = this.runtime.execute(compileResult.code);

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
