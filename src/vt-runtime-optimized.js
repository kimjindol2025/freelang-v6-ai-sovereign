/**
 * CLAUDELang v6.0 Optimized VT Runtime
 * VT 바이트코드 실행 엔진 (최적화 버전)
 *
 * 최적화:
 * 1. 메모리 풀 관리 (객체 재사용)
 * 2. 불필요한 복사 제거
 * 3. 변수 접근 최적화 (직접 참조)
 * 4. JIT 컴파일 준비 (미래 확장)
 */

class OptimizedVTRuntime {
  constructor(options = {}) {
    this.variables = new Map();
    this.functions = new Map();
    this.output = [];

    // 최적화 옵션
    this.options = {
      poolSize: options.poolSize || 1000,
      enableMemoryPool: options.enableMemoryPool !== false,
      enableDirectAccess: options.enableDirectAccess !== false,
      enableInlining: options.enableInlining !== false,
      ...options,
    };

    // 메모리 풀 초기화
    this.objectPool = [];
    this.arrayPool = [];
    this.stringPool = new Set();

    if (this.options.enableMemoryPool) {
      this.initializePools();
    }

    // 접근 최적화: 빈번하게 사용되는 변수 캐시
    this.accessCache = new Map();

    this.registerBuiltinFunctions();
  }

  /**
   * 메모리 풀 초기화
   */
  initializePools() {
    for (let i = 0; i < this.options.poolSize; i++) {
      this.objectPool.push({});
      this.arrayPool.push([]);
    }
  }

  /**
   * 객체 풀에서 객체 할당
   */
  allocateObject() {
    if (this.options.enableMemoryPool && this.objectPool.length > 0) {
      return this.objectPool.pop();
    }
    return {};
  }

  /**
   * 객체를 풀에 반환
   */
  deallocateObject(obj) {
    if (this.options.enableMemoryPool) {
      // 객체 초기화
      for (const key in obj) {
        delete obj[key];
      }
      this.objectPool.push(obj);
    }
  }

  /**
   * 배열 풀에서 배열 할당
   */
  allocateArray(size = 0) {
    if (this.options.enableMemoryPool && this.arrayPool.length > 0) {
      const arr = this.arrayPool.pop();
      arr.length = 0; // 초기화
      return arr;
    }
    return new Array(size);
  }

  /**
   * 배열을 풀에 반환
   */
  deallocateArray(arr) {
    if (this.options.enableMemoryPool) {
      arr.length = 0;
      this.arrayPool.push(arr);
    }
  }

  /**
   * 직접 접근을 위한 변수 캐시
   */
  cacheVariable(name) {
    if (this.options.enableDirectAccess && !this.accessCache.has(name)) {
      const value = this.variables.get(name);
      if (value !== undefined) {
        this.accessCache.set(name, value);
      }
    }
  }

  /**
   * 변수 접근 (최적화)
   */
  getVariable(name) {
    // 캐시에서 먼저 확인
    if (this.options.enableDirectAccess && this.accessCache.has(name)) {
      return this.accessCache.get(name);
    }

    // 원본 저장소에서 조회
    const value = this.variables.get(name);

    // 캐시 업데이트
    if (value !== undefined) {
      this.cacheVariable(name);
    }

    return value;
  }

  /**
   * 변수 설정 (캐시 무효화 포함)
   */
  setVariable(name, value) {
    this.variables.set(name, value);
    // 캐시 무효화
    if (this.options.enableDirectAccess) {
      this.accessCache.set(name, value);
    }
  }

  /**
   * 내장 함수 등록
   */
  registerBuiltinFunctions() {
    // Array 함수들
    this.registerFunction("Array.map", (arr, fn) => {
      const result = this.allocateArray(arr.length);
      for (let i = 0; i < arr.length; i++) {
        result[i] = fn(arr[i]);
      }
      return result;
    });

    this.registerFunction("Array.filter", (arr, fn) => {
      const result = this.allocateArray();
      for (let i = 0; i < arr.length; i++) {
        if (fn(arr[i])) {
          result.push(arr[i]);
        }
      }
      return result;
    });

    this.registerFunction("Array.reduce", (arr, fn, init) => {
      let acc = init;
      for (let i = 0; i < arr.length; i++) {
        acc = fn(acc, arr[i]);
      }
      return acc;
    });

    this.registerFunction("Array.find", (arr, fn) => {
      for (let i = 0; i < arr.length; i++) {
        if (fn(arr[i])) {
          return arr[i];
        }
      }
      return undefined;
    });

    // String 함수들
    this.registerFunction("String.split", (str, delimiter) => {
      return str.split(delimiter);
    });

    this.registerFunction("String.join", (arr, delimiter) => {
      return arr.join(delimiter);
    });

    this.registerFunction("String.upper", (str) => {
      return str.toUpperCase();
    });

    this.registerFunction("String.lower", (str) => {
      return str.toLowerCase();
    });

    this.registerFunction("String.trim", (str) => {
      return str.trim();
    });

    // Math 함수들
    this.registerFunction("Math.sqrt", (x) => Math.sqrt(x));
    this.registerFunction("Math.pow", (x, y) => Math.pow(x, y));
    this.registerFunction("Math.abs", (x) => Math.abs(x));

    // JSON 함수들
    this.registerFunction("JSON.parse", (str) => JSON.parse(str));
    this.registerFunction("JSON.stringify", (obj) => JSON.stringify(obj));

    // Print
    this.registerFunction("print", (value) => {
      this.output.push(String(value));
      console.log(value);
    });
  }

  /**
   * 함수 등록
   */
  registerFunction(name, fn) {
    this.functions.set(name, fn);
  }

  /**
   * 함수 호출
   */
  callFunction(name, args) {
    const fn = this.functions.get(name);
    if (!fn) {
      throw new Error(`Unknown function: ${name}`);
    }
    return fn(...args);
  }

  /**
   * VT 코드 라인 실행 (단순화된 버전)
   */
  executeLine(line) {
    if (!line || line.startsWith(";")) {
      return null; // 주석 또는 빈 줄
    }

    // 간단한 파싱 (실제로는 VT 인터프리터 필요)
    // 현재는 구조만 제시

    // (define x 42) 형태
    if (line.startsWith("(define ")) {
      const match = line.match(/\(define\s+(\w+)\s+(.+)\)/);
      if (match) {
        const varName = match[1];
        const value = this.evaluateExpression(match[2]);
        this.setVariable(varName, value);
        return value;
      }
    }

    // (call function arg1 arg2) 형태
    if (line.startsWith("(call ")) {
      const match = line.match(/\(call\s+(\S+)\s*(.*)\)/);
      if (match) {
        const funcName = match[1];
        const argsStr = match[2];
        const args = argsStr ? argsStr.split(/\s+/).map((a) => this.evaluateExpression(a)) : [];
        return this.callFunction(funcName, args);
      }
    }

    return null;
  }

  /**
   * 간단한 식 평가
   */
  evaluateExpression(expr) {
    // 숫자
    if (/^\d+$/.test(expr)) {
      return parseInt(expr);
    }

    // 문자열
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // 변수 참조
    if (/^[a-zA-Z_]\w*$/.test(expr)) {
      return this.getVariable(expr);
    }

    return expr;
  }

  /**
   * 전체 프로그램 실행
   */
  execute(vtCode) {
    const lines = vtCode.split("\n");
    const results = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        const result = this.executeLine(trimmed);
        if (result !== null && result !== undefined) {
          results.push(result);
        }
      }
    }

    return {
      success: true,
      results: results,
      output: this.output,
      variables: Object.fromEntries(this.variables),
    };
  }

  /**
   * 메모리 통계
   */
  getMemoryStats() {
    return {
      variableCount: this.variables.size,
      functionCount: this.functions.size,
      pooledObjects: this.objectPool.length,
      pooledArrays: this.arrayPool.length,
      accessCacheSize: this.accessCache.size,
      totalOutput: this.output.length,
    };
  }

  /**
   * 런타임 정리
   */
  cleanup() {
    this.variables.clear();
    this.accessCache.clear();
    this.output = [];

    if (this.options.enableMemoryPool) {
      this.objectPool = [];
      this.arrayPool = [];
      this.initializePools();
    }
  }

  /**
   * 성능 통계 출력
   */
  printStats() {
    const stats = this.getMemoryStats();
    console.log("\n");
    console.log("╔" + "═".repeat(50) + "╗");
    console.log("║" + " Runtime Statistics".padEnd(50) + "║");
    console.log("╠" + "═".repeat(50) + "╣");
    console.log(`║ Variables: ${stats.variableCount}`.padEnd(51) + "║");
    console.log(`║ Functions: ${stats.functionCount}`.padEnd(51) + "║");
    console.log(`║ Pooled Objects: ${stats.pooledObjects}`.padEnd(51) + "║");
    console.log(`║ Access Cache: ${stats.accessCacheSize}`.padEnd(51) + "║");
    console.log("╚" + "═".repeat(50) + "╝\n");
  }
}

module.exports = OptimizedVTRuntime;
