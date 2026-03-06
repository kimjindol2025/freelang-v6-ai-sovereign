/**
 * VT Runtime Bridge for CLAUDELang v6.0
 * VT 코드 (스킴 형식) → AST → 실행
 *
 * 역할:
 * 1. VT 코드 파싱 (스킴 형식)
 * 2. AST 생성
 * 3. 런타임 평가
 * 4. 메모리 관리
 * 5. 함수 호출
 */

'use strict';

/**
 * VT 코드를 토큰으로 변환
 */
class VTTokenizer {
  constructor(code) {
    this.code = code;
    this.pos = 0;
    this.tokens = [];
  }

  tokenize() {
    while (this.pos < this.code.length) {
      const char = this.code[this.pos];

      // 공백 무시
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      // 주석 무시
      if (char === ';') {
        while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
          this.pos++;
        }
        continue;
      }

      // 괄호
      if (char === '(' || char === ')') {
        this.tokens.push(char);
        this.pos++;
        continue;
      }

      // 문자열
      if (char === '"') {
        const str = this.readString();
        this.tokens.push({ type: 'string', value: str });
        continue;
      }

      // 심볼/숫자
      const symbol = this.readSymbol();
      if (symbol) {
        // 숫자인지 확인
        if (/^-?\d+(\.\d+)?$/.test(symbol)) {
          this.tokens.push({ type: 'number', value: parseFloat(symbol) });
        } else if (symbol === 'true' || symbol === 'false') {
          this.tokens.push({ type: 'boolean', value: symbol === 'true' });
        } else {
          this.tokens.push({ type: 'symbol', value: symbol });
        }
      }
    }

    return this.tokens;
  }

  readString() {
    this.pos++; // 시작 따옴표 건너뛰기
    let str = '';
    while (this.pos < this.code.length && this.code[this.pos] !== '"') {
      if (this.code[this.pos] === '\\') {
        this.pos++;
        if (this.pos < this.code.length) {
          switch (this.code[this.pos]) {
            case 'n': str += '\n'; break;
            case 't': str += '\t'; break;
            case 'r': str += '\r'; break;
            case '"': str += '"'; break;
            case '\\': str += '\\'; break;
            default: str += this.code[this.pos];
          }
          this.pos++;
        }
      } else {
        str += this.code[this.pos];
        this.pos++;
      }
    }
    this.pos++; // 끝 따옴표 건너뛰기
    return str;
  }

  readSymbol() {
    let symbol = '';
    while (this.pos < this.code.length && !/[\s()"]/.test(this.code[this.pos])) {
      symbol += this.code[this.pos];
      this.pos++;
    }
    return symbol;
  }
}

/**
 * VT 토큰을 AST로 파싱
 */
class VTParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse() {
    const expressions = [];
    while (this.pos < this.tokens.length) {
      const expr = this.parseExpression();
      if (expr !== null) {
        expressions.push(expr);
      }
    }
    return { type: 'program', expressions };
  }

  parseExpression() {
    const token = this.peek();
    if (token === null) return null;

    if (token === '(') {
      return this.parseList();
    } else {
      return this.parseAtom();
    }
  }

  parseList() {
    this.consume('(');
    const elements = [];
    while (this.peek() !== ')') {
      elements.push(this.parseExpression());
    }
    this.consume(')');
    return { type: 'list', elements };
  }

  parseAtom() {
    const token = this.next();
    if (token === null) return null;

    if (typeof token === 'object') {
      return {
        type: 'literal',
        value: token.value,
        literalType: token.type
      };
    } else {
      return {
        type: 'symbol',
        value: token
      };
    }
  }

  peek() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }
    return null;
  }

  next() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos++];
    }
    return null;
  }

  consume(expected) {
    const token = this.next();
    if (token !== expected) {
      throw new Error(`Expected '${expected}', got '${token}'`);
    }
  }
}

/**
 * VT AST를 평가하는 평가기
 */
class VTEvaluator {
  constructor() {
    this.memory = new Map();
    this.functions = new Map();
    this.initializeBuiltins();
  }

  /**
   * 내장 함수 초기화
   */
  initializeBuiltins() {
    // I/O
    this.functions.set('print', (value) => {
      process.stdout.write(String(value));
      return null;
    });

    this.functions.set('println', (value) => {
      console.log(String(value));
      return null;
    });

    // 산술 연산
    this.functions.set('+', (...args) => {
      return args.reduce((a, b) => a + b, 0);
    });

    this.functions.set('-', (...args) => {
      if (args.length === 1) return -args[0];
      return args.reduce((a, b) => a - b);
    });

    this.functions.set('*', (...args) => {
      return args.reduce((a, b) => a * b, 1);
    });

    this.functions.set('/', (...args) => {
      return args.reduce((a, b) => a / b);
    });

    this.functions.set('%', (a, b) => {
      return a % b;
    });

    // 비교 연산
    this.functions.set('=', (a, b) => a === b);
    this.functions.set('!=', (a, b) => a !== b);
    this.functions.set('<', (a, b) => a < b);
    this.functions.set('>', (a, b) => a > b);
    this.functions.set('<=', (a, b) => a <= b);
    this.functions.set('>=', (a, b) => a >= b);

    // 논리 연산
    this.functions.set('and', (...args) => {
      return args.reduce((a, b) => a && b, true);
    });

    this.functions.set('or', (...args) => {
      return args.reduce((a, b) => a || b, false);
    });

    this.functions.set('not', (a) => {
      return !a;
    });

    // 타입 관련
    this.functions.set('array', (...args) => {
      return args;
    });

    this.functions.set('object', (...args) => {
      const obj = {};
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          obj[args[i]] = args[i + 1];
        }
      }
      return obj;
    });

    // 배열 함수
    this.functions.set('Array.length', (arr) => {
      return Array.isArray(arr) ? arr.length : 0;
    });

    this.functions.set('Array.get', (arr, index) => {
      return Array.isArray(arr) ? arr[index] : null;
    });

    this.functions.set('Array.set', (arr, index, value) => {
      if (Array.isArray(arr)) {
        arr[index] = value;
      }
      return arr;
    });

    this.functions.set('Array.push', (arr, value) => {
      if (Array.isArray(arr)) {
        arr.push(value);
      }
      return arr;
    });

    this.functions.set('Array.pop', (arr) => {
      return Array.isArray(arr) ? arr.pop() : null;
    });

    this.functions.set('Array.slice', (arr, start, end) => {
      return Array.isArray(arr) ? arr.slice(start, end) : [];
    });

    this.functions.set('Array.indexOf', (arr, value) => {
      return Array.isArray(arr) ? arr.indexOf(value) : -1;
    });

    this.functions.set('Array.includes', (arr, value) => {
      return Array.isArray(arr) ? arr.includes(value) : false;
    });

    this.functions.set('Array.reverse', (arr) => {
      if (Array.isArray(arr)) {
        return arr.reverse();
      }
      return arr;
    });

    this.functions.set('Array.sort', (arr) => {
      if (Array.isArray(arr)) {
        return arr.sort();
      }
      return arr;
    });

    // 문자열 함수
    this.functions.set('String.length', (str) => {
      return String(str).length;
    });

    this.functions.set('String.upper', (str) => {
      return String(str).toUpperCase();
    });

    this.functions.set('String.lower', (str) => {
      return String(str).toLowerCase();
    });

    this.functions.set('String.trim', (str) => {
      return String(str).trim();
    });

    this.functions.set('String.split', (str, delimiter) => {
      return String(str).split(delimiter);
    });

    this.functions.set('String.join', (arr, delimiter) => {
      return (Array.isArray(arr) ? arr : [arr]).join(delimiter);
    });

    // JSON 함수
    this.functions.set('JSON.stringify', (obj) => {
      return JSON.stringify(obj);
    });

    this.functions.set('JSON.parse', (str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    });

    // Math 함수
    this.functions.set('Math.sqrt', (x) => Math.sqrt(x));
    this.functions.set('Math.abs', (x) => Math.abs(x));
    this.functions.set('Math.pow', (x, y) => Math.pow(x, y));
    this.functions.set('Math.floor', (x) => Math.floor(x));
    this.functions.set('Math.ceil', (x) => Math.ceil(x));
    this.functions.set('Math.round', (x) => Math.round(x));
    this.functions.set('Math.sin', (x) => Math.sin(x));
    this.functions.set('Math.cos', (x) => Math.cos(x));
    this.functions.set('Math.tan', (x) => Math.tan(x));
    this.functions.set('Math.max', (...args) => Math.max(...args));
    this.functions.set('Math.min', (...args) => Math.min(...args));

    // FileSystem 함수
    const fs = require('fs');
    this.functions.set('FS.read', (path) => {
      try {
        return fs.readFileSync(String(path), 'utf8');
      } catch (e) {
        return null;
      }
    });

    this.functions.set('FS.write', (path, content) => {
      try {
        fs.writeFileSync(String(path), String(content), 'utf8');
        return true;
      } catch (e) {
        return false;
      }
    });

    this.functions.set('FS.exists', (path) => {
      try {
        return fs.existsSync(String(path));
      } catch (e) {
        return false;
      }
    });

    // Type checking
    this.functions.set('typeof', (value) => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    });

    this.functions.set('is_null', (value) => value === null);
    this.functions.set('is_array', (value) => Array.isArray(value));
    this.functions.set('is_object', (value) => {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    });

    // Property access
    this.functions.set('property', (obj, prop) => {
      if (obj === null || obj === undefined) return null;
      return obj[prop];
    });

    this.functions.set('index', (arr, idx) => {
      if (Array.isArray(arr)) return arr[idx];
      return null;
    });
  }

  /**
   * AST 평가
   */
  evaluate(ast) {
    if (!ast) return null;

    if (ast.type === 'program') {
      let result = null;
      for (const expr of ast.expressions) {
        result = this.evaluateExpression(expr);
      }
      return result;
    }

    return this.evaluateExpression(ast);
  }

  evaluateExpression(expr) {
    if (!expr) return null;

    switch (expr.type) {
      case 'literal':
        return expr.value;

      case 'symbol':
        // 변수 참조
        if (this.memory.has(expr.value)) {
          return this.memory.get(expr.value);
        }
        throw new Error(`Undefined variable: ${expr.value}`);

      case 'list':
        return this.evaluateList(expr);

      default:
        return null;
    }
  }

  evaluateList(expr) {
    if (!expr.elements || expr.elements.length === 0) {
      return [];
    }

    const first = expr.elements[0];
    if (!first) return null;

    // 특별한 형식 (define, if, do, for 등)
    if (first.type === 'symbol') {
      const opName = first.value;

      if (opName === 'define') {
        return this.evaluateDefine(expr.elements.slice(1));
      }

      if (opName === 'if') {
        return this.evaluateIf(expr.elements.slice(1));
      }

      if (opName === 'do') {
        return this.evaluateDo(expr.elements.slice(1));
      }

      if (opName === 'for') {
        return this.evaluateFor(expr.elements.slice(1));
      }

      if (opName === 'call') {
        return this.evaluateCall(expr.elements.slice(1));
      }

      if (opName === 'lambda' || opName === 'fn') {
        return this.evaluateLambda(expr.elements.slice(1));
      }

      // 함수 호출 (첫 요소가 함수명)
      if (this.functions.has(opName)) {
        const args = expr.elements.slice(1).map(e => this.evaluateExpression(e));
        return this.functions.get(opName)(...args);
      }
    }

    // 연산자 호출
    if (first.type === 'symbol' && this.functions.has(first.value)) {
      const fn = this.functions.get(first.value);
      const args = expr.elements.slice(1).map(e => this.evaluateExpression(e));
      return fn(...args);
    }

    return null;
  }

  evaluateDefine(args) {
    if (args.length < 2) {
      throw new Error('define requires at least 2 arguments');
    }

    const nameExpr = args[0];
    const valueExpr = args[1];

    if (nameExpr.type !== 'symbol') {
      throw new Error('define: first argument must be a symbol');
    }

    const value = this.evaluateExpression(valueExpr);
    this.memory.set(nameExpr.value, value);
    return value;
  }

  evaluateIf(args) {
    if (args.length < 2) {
      throw new Error('if requires at least 2 arguments');
    }

    const test = this.evaluateExpression(args[0]);
    if (test) {
      return this.evaluateExpression(args[1]);
    } else if (args.length >= 3) {
      return this.evaluateExpression(args[2]);
    }
    return null;
  }

  evaluateDo(args) {
    let result = null;
    for (const expr of args) {
      result = this.evaluateExpression(expr);
    }
    return result;
  }

  evaluateFor(args) {
    if (args.length < 3) {
      throw new Error('for requires at least 3 arguments');
    }

    const iteratorExpr = args[0];
    const rangeExpr = args[1];
    const bodyExpr = args[2];

    if (iteratorExpr.type !== 'symbol') {
      throw new Error('for: first argument must be a symbol');
    }

    const range = this.evaluateExpression(rangeExpr);
    let result = null;

    if (Array.isArray(range)) {
      for (const item of range) {
        this.memory.set(iteratorExpr.value, item);
        result = this.evaluateExpression(bodyExpr);
      }
    }

    return result;
  }

  evaluateCall(args) {
    if (args.length < 1) {
      throw new Error('call requires at least 1 argument');
    }

    const funcExpr = args[0];
    if (funcExpr.type !== 'symbol') {
      throw new Error('call: function name must be a symbol');
    }

    const funcName = funcExpr.value;
    if (!this.functions.has(funcName)) {
      throw new Error(`Unknown function: ${funcName}`);
    }

    const fn = this.functions.get(funcName);
    const callArgs = args.slice(1).map(e => this.evaluateExpression(e));
    return fn(...callArgs);
  }

  evaluateLambda(args) {
    // Lambda 함수는 단순히 저장
    return {
      type: 'lambda',
      params: args[0],
      body: args.slice(1)
    };
  }

  /**
   * 함수 등록
   */
  registerFunction(name, fn) {
    this.functions.set(name, fn);
  }

  /**
   * 메모리 상태 조회
   */
  getMemory() {
    return Object.fromEntries(this.memory);
  }

  /**
   * 메모리 초기화
   */
  clearMemory() {
    this.memory.clear();
  }
}

/**
 * VT Runtime Bridge - 메인 인터페이스
 */
class VTRuntimeBridge {
  constructor() {
    this.evaluator = new VTEvaluator();
  }

  /**
   * VT 코드 실행
   * @param {string} vtCode - VT 코드 (스킴 형식)
   * @returns {Object} {success, result, memory, errors}
   */
  execute(vtCode) {
    try {
      // 1. 토크나이즈
      const tokenizer = new VTTokenizer(vtCode);
      const tokens = tokenizer.tokenize();

      // 2. 파싱
      const parser = new VTParser(tokens);
      const ast = parser.parse();

      // 3. 평가
      const result = this.evaluator.evaluate(ast);

      // 4. 메모리 상태 반환
      return {
        success: true,
        result: result,
        memory: this.evaluator.getMemory(),
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        memory: this.evaluator.getMemory(),
        errors: [error.message]
      };
    }
  }

  /**
   * 메모리 상태 조회
   */
  getMemory() {
    return this.evaluator.getMemory();
  }

  /**
   * 메모리 초기화
   */
  clearMemory() {
    this.evaluator.clearMemory();
  }

  /**
   * 함수 등록
   */
  registerFunction(name, fn) {
    this.evaluator.registerFunction(name, fn);
  }

  /**
   * CLAUDELang JSON + 컴파일러를 사용하여 직접 실행
   * @param {Object} claudelangJson - CLAUDELang JSON
   * @param {CLAUDELangCompiler} compiler - 컴파일러 인스턴스
   * @returns {Object} 실행 결과
   */
  executeJSON(claudelangJson, compiler) {
    try {
      // 컴파일
      const compiled = compiler.compile(claudelangJson);
      if (!compiled.success) {
        return {
          success: false,
          result: null,
          memory: {},
          errors: compiled.errors
        };
      }

      // 실행
      return this.execute(compiled.code);
    } catch (error) {
      return {
        success: false,
        result: null,
        memory: {},
        errors: [error.message]
      };
    }
  }
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VTTokenizer,
    VTParser,
    VTEvaluator,
    VTRuntimeBridge
  };
}
