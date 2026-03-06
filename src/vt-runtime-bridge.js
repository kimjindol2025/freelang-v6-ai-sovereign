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
  constructor(debugMode = false) {
    // 스코프 체인 시스템 (배열의 0번 인덱스가 전역 스코프)
    this.scopes = [new Map()];
    this.functions = new Map();
    this.debugMode = debugMode;
    this.executionTrace = [];
    this.callStack = [];
    this.initializeBuiltins();
  }

  /**
   * 변수 조회 (현재 스코프에서 전역 스코프로 탐색)
   */
  lookupVar(name) {
    // 스택 최상단에서 최하단(전역)으로 탐색
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name);
      }
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * 변수 설정 (가장 가까운 스코프에 설정)
   */
  setVar(name, value) {
    this.scopes[this.scopes.length - 1].set(name, value);
  }

  /**
   * 변수 존재 확인
   */
  hasVar(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 새 스코프 푸시
   */
  pushScope() {
    this.scopes.push(new Map());
  }

  /**
   * 현재 스코프 팝
   */
  popScope() {
    if (this.scopes.length > 1) {
      this.scopes.pop();
    }
  }

  /**
   * 전역 메모리 접근 (호환성)
   */
  get memory() {
    return this.scopes[0];
  }

  /**
   * 내장 함수 초기화
   */
  /**
   * 클래스 생성
   */
  evaluateClass(args) {
    if (args.length < 2) {
      throw new Error('class requires name and body');
    }

    const nameExpr = args[0];
    const bodyExprs = args.slice(1);

    if (nameExpr.type !== 'symbol') {
      throw new Error('class: first argument must be a symbol');
    }

    const className = nameExpr.value;
    const methods = {};

    // 메서드 수집
    bodyExprs.forEach(expr => {
      if (expr.type === 'list' && expr.elements && expr.elements[0]) {
        const first = expr.elements[0];
        if (first.type === 'symbol' && first.value === 'method') {
          const methodName = expr.elements[1]?.value;
          if (methodName) {
            methods[methodName] = expr;
          }
        }
      }
    });

    // 클래스 정의 (생성자 함수)
    const classConstructor = (props = {}) => {
      return {
        __className: className,
        __methods: methods,
        __evaluator: this,
        ...props
      };
    };

    this.functions.set(className, classConstructor);
    this.setVar(className, `[Class: ${className}]`);

    return classConstructor;
  }

  /**
   * 메서드 호출
   */
  evaluateMethodCall(args) {
    if (args.length < 2) {
      throw new Error('method call requires object and method');
    }

    const objExpr = args[0];
    const methodName = args[1]?.value;
    const methodArgs = args.slice(2);

    const obj = this.evaluateExpression(objExpr);

    if (!obj || typeof obj !== 'object' || !obj.__className) {
      throw new Error('method: first argument must be an object instance');
    }

    if (!methodName) {
      throw new Error('method: second argument must be a symbol');
    }

    // 속성 접근
    if (methodName.startsWith('get_')) {
      const propName = methodName.slice(4);
      return obj[propName];
    }

    // 속성 설정
    if (methodName.startsWith('set_')) {
      const propName = methodName.slice(4);
      const value = this.evaluateExpression(methodArgs[0]);
      obj[propName] = value;
      return obj;
    }

    // 메서드 호출
    if (obj.__methods && obj.__methods[methodName]) {
      // 메서드 실행 (간단히 구현)
      return null;
    }

    throw new Error(`Unknown method: ${methodName}`);
  }

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

    // Map 함수들
    this.functions.set('Map.create', () => {
      return new Map();
    });

    this.functions.set('Map.get', (map, key) => {
      if (map instanceof Map) {
        return map.get(key) ?? null;
      }
      return null;
    });

    this.functions.set('Map.set', (map, key, value) => {
      if (map instanceof Map) {
        map.set(key, value);
      }
      return map;
    });

    this.functions.set('Map.has', (map, key) => {
      if (map instanceof Map) {
        return map.has(key);
      }
      return false;
    });

    this.functions.set('Map.delete', (map, key) => {
      if (map instanceof Map) {
        return map.delete(key);
      }
      return false;
    });

    this.functions.set('Map.keys', (map) => {
      if (map instanceof Map) {
        return Array.from(map.keys());
      }
      return [];
    });

    this.functions.set('Map.values', (map) => {
      if (map instanceof Map) {
        return Array.from(map.values());
      }
      return [];
    });

    this.functions.set('Map.size', (map) => {
      if (map instanceof Map) {
        return map.size;
      }
      return 0;
    });

    this.functions.set('Map.clear', (map) => {
      if (map instanceof Map) {
        map.clear();
      }
      return null;
    });

    // Set 함수들
    this.functions.set('Set.create', () => {
      return new Set();
    });

    this.functions.set('Set.add', (set, value) => {
      if (set instanceof Set) {
        set.add(value);
      }
      return set;
    });

    this.functions.set('Set.has', (set, value) => {
      if (set instanceof Set) {
        return set.has(value);
      }
      return false;
    });

    this.functions.set('Set.delete', (set, value) => {
      if (set instanceof Set) {
        return set.delete(value);
      }
      return false;
    });

    this.functions.set('Set.size', (set) => {
      if (set instanceof Set) {
        return set.size;
      }
      return 0;
    });

    this.functions.set('Set.clear', (set) => {
      if (set instanceof Set) {
        set.clear();
      }
      return null;
    });

    this.functions.set('Set.toArray', (set) => {
      if (set instanceof Set) {
        return Array.from(set);
      }
      return [];
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
        // 변수 참조 (스코프 체인 탐색)
        return this.lookupVar(expr.value);

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

      if (opName === 'defn') {
        return this.evaluateDefn(expr.elements.slice(1));
      }

      if (opName === 'return') {
        return this.evaluateReturn(expr.elements.slice(1));
      }

      if (opName === 'try') {
        return this.evaluateTryCatch(expr.elements.slice(1));
      }

      if (opName === 'throw') {
        return this.evaluateThrow(expr.elements.slice(1));
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
    this.setVar(nameExpr.value, value);
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
        this.setVar(iteratorExpr.value, item);
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

    // 디버그 모드: 함수 호출 추적
    if (this.debugMode) {
      const callArgs = args.slice(1).map(e => this.evaluateExpression(e));
      this.callStack.push(funcName);
      const depth = this.callStack.length - 1;
      const indent = '  '.repeat(depth);
      const argsStr = callArgs.map(arg => {
        if (typeof arg === 'string') return `"${arg}"`;
        if (typeof arg === 'object') return `[Object]`;
        return String(arg);
      }).join(', ');
      this.executionTrace.push({
        type: 'call',
        function: funcName,
        args: callArgs,
        depth: depth,
        timestamp: Date.now()
      });
      console.log(`${indent}→ ${funcName}(${argsStr})`);

      try {
        const fn = this.functions.get(funcName);
        const result = fn(...callArgs);

        this.executionTrace.push({
          type: 'return',
          function: funcName,
          result: result,
          depth: depth,
          timestamp: Date.now()
        });
        console.log(`${indent}← ${funcName} = ${typeof result === 'string' ? `"${result}"` : result}`);

        this.callStack.pop();
        return result;
      } catch (e) {
        this.executionTrace.push({
          type: 'error',
          function: funcName,
          error: e.message,
          depth: depth,
          timestamp: Date.now()
        });
        console.log(`${indent}✗ ${funcName} threw: ${e.message}`);
        this.callStack.pop();
        throw e;
      }
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
   * 메모리 상태 조회 (전역 스코프만 반환)
   */
  getMemory() {
    return Object.fromEntries(this.scopes[0] || new Map());
  }

  /**
   * 메모리 초기화
   */
  clearMemory() {
    if (this.scopes[0]) {
      this.scopes[0].clear();
    }
  }

  /**
   * 함수 정의: (defn name (params...) body...)
   */
  evaluateDefn(args) {
    if (args.length < 2) {
      throw new Error('defn requires at least 2 arguments');
    }

    const nameExpr = args[0];
    const paramsExpr = args[1];

    if (nameExpr.type !== 'symbol') {
      throw new Error('defn: first argument must be a symbol (function name)');
    }

    const funcName = nameExpr.value;
    const paramNames = [];

    if (paramsExpr.type === 'list' && paramsExpr.elements) {
      paramsExpr.elements.forEach(elem => {
        if (elem.type === 'symbol') {
          paramNames.push(elem.value);
        }
      });
    }

    const bodyExprs = args.slice(2);

    // 클로저로 함수 저장
    const fn = (...callArgs) => {
      // 새 스코프 푸시
      this.pushScope();

      // 파라미터 바인딩
      for (let i = 0; i < paramNames.length; i++) {
        this.setVar(paramNames[i], callArgs[i]);
      }

      try {
        // 함수 바디 실행
        let result = null;
        for (const expr of bodyExprs) {
          result = this.evaluateExpression(expr);
          // return이 발생하면 즉시 반환
          if (this.returnValue !== undefined) {
            result = this.returnValue;
            this.returnValue = undefined;
            break;
          }
        }
        return result;
      } finally {
        // 스코프 팝
        this.popScope();
      }
    };

    // 함수 등록
    this.functions.set(funcName, fn);
    this.setVar(funcName, `[Function: ${funcName}]`);

    return fn;
  }

  /**
   * 반환: (return value)
   */
  evaluateReturn(args) {
    if (args.length < 1) {
      this.returnValue = null;
    } else {
      this.returnValue = this.evaluateExpression(args[0]);
    }
    // throw를 사용하여 함수 실행을 중단하지 않고 반환값만 설정
    return this.returnValue;
  }

  /**
   * try/catch/finally: (try (do body...) (catch error-var (do catch-body...)) (finally (do finally-body...)))
   */
  evaluateTryCatch(args) {
    if (args.length < 1) {
      throw new Error('try requires at least 1 argument');
    }

    let result = null;
    let caught = false;

    try {
      // try 블록 실행
      result = this.evaluateExpression(args[0]);
    } catch (e) {
      caught = true;
      // catch 블록 찾기
      for (let i = 1; i < args.length; i++) {
        const clause = args[i];
        if (clause.type === 'list' && clause.elements && clause.elements[0]) {
          if (clause.elements[0].type === 'symbol') {
            const clauseName = clause.elements[0].value;

            if (clauseName === 'catch' && clause.elements.length >= 3) {
              const errorVar = clause.elements[1];
              const catchBody = clause.elements[2];

              if (errorVar.type === 'symbol') {
                // 에러 변수 바인딩
                this.setVar(errorVar.value, e.message);
                // catch 블록 실행
                result = this.evaluateExpression(catchBody);
              }
              break;
            }
          }
        }
      }

      // catch가 없으면 에러 재발생
      if (!caught) {
        throw e;
      }
    } finally {
      // finally 블록 찾기 및 실행
      for (let i = 1; i < args.length; i++) {
        const clause = args[i];
        if (clause.type === 'list' && clause.elements && clause.elements[0]) {
          if (clause.elements[0].type === 'symbol') {
            const clauseName = clause.elements[0].value;

            if (clauseName === 'finally' && clause.elements.length >= 2) {
              const finallyBody = clause.elements[1];
              this.evaluateExpression(finallyBody);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * throw: (throw error-type message)
   */
  evaluateThrow(args) {
    let errorType = 'Error';
    let message = 'Unknown error';

    if (args.length >= 1) {
      if (args[0].type === 'symbol' || args[0].type === 'string') {
        const firstArg = this.evaluateExpression(args[0]);
        if (args.length >= 2) {
          errorType = String(firstArg);
          message = String(this.evaluateExpression(args[1]));
        } else {
          message = String(firstArg);
        }
      }
    }

    throw new Error(`[${errorType}] ${message}`);
  }

  /**
   * 반환값 저장소 (함수 내에서 사용)
   */
  get returnValue() {
    return this._returnValue;
  }

  set returnValue(value) {
    this._returnValue = value;
  }
}

/**
 * VT Runtime Bridge - 메인 인터페이스
 */
class VTRuntimeBridge {
  constructor(debugMode = false) {
    this.evaluator = new VTEvaluator(debugMode);
    this.debugMode = debugMode;
  }

  /**
   * VT 코드 실행
   * @param {string} vtCode - VT 코드 (스킴 형식)
   * @param {boolean} debugMode - 디버그 모드 활성화
   * @returns {Object} {success, result, memory, errors, trace (디버그용)}
   */
  execute(vtCode, debugMode = false) {
    try {
      // 디버그 모드 설정
      if (debugMode) {
        this.evaluator.debugMode = debugMode;
        this.evaluator.executionTrace = [];
      }

      // 1. 토크나이즈
      const tokenizer = new VTTokenizer(vtCode);
      const tokens = tokenizer.tokenize();

      // 2. 파싱
      const parser = new VTParser(tokens);
      const ast = parser.parse();

      // 3. 평가
      const result = this.evaluator.evaluate(ast);

      // 4. 메모리 상태 반환
      const response = {
        success: true,
        result: result,
        memory: this.evaluator.getMemory(),
        errors: []
      };

      // 디버그 모드: execution trace 포함
      if (debugMode || this.debugMode) {
        response.trace = this.evaluator.executionTrace;
      }

      return response;
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
