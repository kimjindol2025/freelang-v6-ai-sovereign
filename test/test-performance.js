/**
 * CLAUDELang v6.0 Performance Tests
 * 성능 최적화 검증 테스트
 */

const CLAUDELangCompiler = require("../src/compiler.js");
const CachedCLAUDELangCompiler = require("../src/compiler-cached.js");
const OptimizedVTRuntime = require("../src/vt-runtime-optimized.js");
const BatchProcessor = require("../src/batch-processor.js");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

class PerformanceTestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 테스트 실행 및 시간 측정
   */
  performanceTest(name, fn, expectedTime = null) {
    console.log(`\n${colors.cyan}▶ ${name}${colors.reset}`);

    const startTime = process.hrtime.bigint();
    let result;
    let error = null;

    try {
      result = fn();
    } catch (e) {
      error = e;
    }

    const endTime = process.hrtime.bigint();
    const elapsedUs = Number(endTime - startTime) / 1000;
    const elapsedMs = elapsedUs / 1000;

    const testResult = {
      name: name,
      passed: !error && (!expectedTime || elapsedMs < expectedTime),
      time_ms: elapsedMs,
      time_us: elapsedUs,
      expectedTime: expectedTime,
      error: error ? error.message : null,
      result: result,
    };

    this.testResults.push(testResult);
    this.totalTests++;

    if (testResult.passed) {
      this.passedTests++;
      const timeStr = `${elapsedMs.toFixed(3)}ms (${elapsedUs.toFixed(0)}µs)`;
      const expectedStr = expectedTime ? ` [Target: ${expectedTime}ms]` : "";
      console.log(`${colors.green}✅ PASS${colors.reset} - ${timeStr}${expectedStr}`);
    } else {
      this.failedTests++;
      if (error) {
        console.log(`${colors.red}❌ FAIL${colors.reset} - Error: ${error.message}`);
      } else {
        console.log(
          `${colors.red}❌ FAIL${colors.reset} - Too slow: ${elapsedMs.toFixed(3)}ms (expected < ${expectedTime}ms)`
        );
      }
    }

    return testResult;
  }

  /**
   * Test 1: 기본 컴파일 성능 (< 1ms)
   */
  testBasicCompilePerformance() {
    console.log(`\n${colors.yellow}=== Test 1: Basic Compilation Performance ===${colors.reset}`);

    const compiler = new CLAUDELangCompiler();

    const program = {
      version: "6.0",
      instructions: [
        { type: "var", name: "x", value_type: "i32", value: 42 },
      ],
    };

    this.performanceTest("Single variable compilation", () => {
      return compiler.compile(program);
    }, 1); // 1ms 목표
  }

  /**
   * Test 2: 캐싱 효과 측정
   */
  testCachingEffect() {
    console.log(`\n${colors.yellow}=== Test 2: Caching Effect ===${colors.reset}`);

    const cachedCompiler = new CachedCLAUDELangCompiler();

    const program = {
      version: "6.0",
      instructions: [
        { type: "var", name: "x", value_type: "i32", value: 42 },
        { type: "call", function: "print", args: [{ type: "ref", name: "x" }] },
      ],
    };

    // 첫 번째 컴파일 (캐시 미스)
    const test1 = this.performanceTest("First compilation (cache miss)", () => {
      return cachedCompiler.compile(program);
    });

    // 두 번째 컴파일 (캐시 히트)
    const test2 = this.performanceTest("Second compilation (cache hit)", () => {
      return cachedCompiler.compile(program);
    });

    // 캐시 효과 검증
    if (test2.time_ms < test1.time_ms) {
      console.log(
        `${colors.green}✅ Caching effective: ${(test1.time_ms / test2.time_ms).toFixed(1)}x faster${colors.reset}`
      );
    }

    // 캐시 통계
    const stats = cachedCompiler.getCacheStats();
    console.log(`📊 Cache Stats: Hit Rate ${stats.hitRate} (${stats.hits} hits, ${stats.misses} misses)`);
  }

  /**
   * Test 3: 복잡한 컴파일 성능
   */
  testComplexCompilePerformance() {
    console.log(`\n${colors.yellow}=== Test 3: Complex Compilation Performance ===${colors.reset}`);

    const compiler = new CLAUDELangCompiler();

    const instructions = [];
    for (let i = 0; i < 10; i++) {
      instructions.push({
        type: "var",
        name: `var_${i}`,
        value_type: "i32",
        value: i * 5,
      });

      instructions.push({
        type: "call",
        function: "Array.map",
        args: [
          { type: "literal", value: [1, 2, 3], value_type: "Array<i32>" },
          { type: "lambda", params: [{ name: "x" }], body: [] },
        ],
      });
    }

    const program = {
      version: "6.0",
      instructions: instructions,
    };

    this.performanceTest("Complex program with 20 instructions", () => {
      return compiler.compile(program);
    }, 2); // 2ms 목표
  }

  /**
   * Test 4: 배치 처리 성능
   */
  async testBatchProcessing() {
    console.log(`\n${colors.yellow}=== Test 4: Batch Processing Performance ===${colors.reset}`);

    const compiler = new CLAUDELangCompiler();
    const processor = new BatchProcessor({ batchSize: 10 });

    // 100개 프로그램 생성
    const programs = [];
    for (let i = 0; i < 100; i++) {
      programs.push({
        version: "6.0",
        instructions: [
          { type: "var", name: `var_${i}`, value_type: "i32", value: i },
          { type: "call", function: "print", args: [{ type: "ref", name: `var_${i}` }] },
        ],
      });
    }

    processor.addJobs(programs);

    const result = await this.performanceTest("Batch process 100 programs", () => {
      return processor.process(compiler);
    }, 100); // 100ms 목표

    if (result.passed && result.result) {
      console.log(`📊 Processed ${result.result.total || 'N/A'} items in ${result.time_ms.toFixed(2)}ms`);
      if (result.result.avgTimeMs) {
        console.log(`⚡ Average: ${result.result.avgTimeMs.toFixed(3)}ms per item`);
      }
    }
  }

  /**
   * Test 5: 메모리 사용량
   */
  testMemoryUsage() {
    console.log(`\n${colors.yellow}=== Test 5: Memory Usage ===${colors.reset}`);

    const compiler = new CLAUDELangCompiler();

    const startMem = process.memoryUsage();

    for (let i = 0; i < 50; i++) {
      const program = {
        version: "6.0",
        instructions: [
          { type: "var", name: `var_${i}`, value_type: "i32", value: i },
          { type: "call", function: "print", args: [{ type: "ref", name: `var_${i}` }] },
        ],
      };

      compiler.compile(program);
    }

    const endMem = process.memoryUsage();
    const memDelta = {
      heapUsed: (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024,
      external: (endMem.external - startMem.external) / 1024 / 1024,
    };

    console.log(`${colors.cyan}Memory Delta:${colors.reset}`);
    console.log(`  Heap: ${memDelta.heapUsed.toFixed(2)} MB`);
    console.log(`  External: ${memDelta.external.toFixed(2)} MB`);

    // 메모리 누수 확인
    if (memDelta.heapUsed > 5) {
      console.log(`${colors.red}⚠️  Potential memory leak detected${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Memory usage within acceptable range${colors.reset}`);
    }
  }

  /**
   * Test 6: 런타임 성능
   */
  testRuntimePerformance() {
    console.log(`\n${colors.yellow}=== Test 6: Runtime Performance ===${colors.reset}`);

    const runtime = new OptimizedVTRuntime({ enableMemoryPool: true });

    // 변수 할당 성능
    const test1 = this.performanceTest("Set 100 variables", () => {
      for (let i = 0; i < 100; i++) {
        runtime.setVariable(`var_${i}`, i * 2);
      }
    }, 1);

    // 변수 조회 성능 (캐시)
    const test2 = this.performanceTest("Get 100 variables (cached)", () => {
      let sum = 0;
      for (let i = 0; i < 100; i++) {
        sum += runtime.getVariable(`var_${i}`) || 0;
      }
      return sum;
    }, 1);

    // 배열 처리 성능
    const arr = [1, 2, 3, 4, 5];
    const test3 = this.performanceTest("Array.map operation", () => {
      return runtime.callFunction("Array.map", [arr, (x) => x * 2]);
    }, 1);

    runtime.cleanup();
  }

  /**
   * Test 7: 비교: 기본 vs 최적화
   */
  testOptimizationComparison() {
    console.log(`\n${colors.yellow}=== Test 7: Optimization Comparison ===${colors.reset}`);

    const basicCompiler = new CLAUDELangCompiler();
    const cachedCompiler = new CachedCLAUDELangCompiler();

    const program = {
      version: "6.0",
      instructions: [
        { type: "var", name: "x", value_type: "i32", value: 42 },
        { type: "call", function: "print", args: [{ type: "ref", name: "x" }] },
      ],
    };

    let basicTimes = [];
    let cachedTimes = [];

    // 10번 반복
    for (let i = 0; i < 10; i++) {
      // 기본 컴파일러
      const start1 = process.hrtime.bigint();
      basicCompiler.compile(program);
      const end1 = process.hrtime.bigint();
      basicTimes.push(Number(end1 - start1) / 1000);

      // 캐싱 컴파일러
      const start2 = process.hrtime.bigint();
      cachedCompiler.compile(program);
      const end2 = process.hrtime.bigint();
      cachedTimes.push(Number(end2 - start2) / 1000);
    }

    const avgBasic = basicTimes.reduce((a, b) => a + b) / basicTimes.length;
    const avgCached = cachedTimes.reduce((a, b) => a + b) / cachedTimes.length;

    console.log(`\n${colors.cyan}Comparison Results (10 iterations):${colors.reset}`);
    console.log(`  Basic Compiler Avg: ${(avgBasic / 1000).toFixed(3)}ms`);
    console.log(`  Cached Compiler Avg: ${(avgCached / 1000).toFixed(3)}ms`);
    console.log(`  Improvement: ${((avgBasic / avgCached - 1) * 100).toFixed(1)}% faster`);
  }

  /**
   * 모든 테스트 실행
   */
  async runAll() {
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + " CLAUDELang v6.0 Performance Test Suite".padEnd(68) + "║");
    console.log("╚" + "═".repeat(68) + "╝");

    this.testBasicCompilePerformance();
    this.testCachingEffect();
    this.testComplexCompilePerformance();
    await this.testBatchProcessing();
    this.testMemoryUsage();
    this.testRuntimePerformance();
    this.testOptimizationComparison();

    this.printSummary();
  }

  /**
   * 테스트 요약
   */
  printSummary() {
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + " Test Summary".padEnd(68) + "║");
    console.log("╠" + "═".repeat(68) + "╣");
    console.log(`║ Total Tests: ${this.totalTests}`.padEnd(69) + "║");
    console.log(
      `║ ${colors.green}Passed: ${this.passedTests}${colors.reset}`.padEnd(69) + "║"
    );
    console.log(
      `║ ${colors.red}Failed: ${this.failedTests}${colors.reset}`.padEnd(69) + "║"
    );

    const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    console.log(`║ Pass Rate: ${passRate}%`.padEnd(69) + "║");
    console.log("╚" + "═".repeat(68) + "╝\n");
  }
}

// 실행
if (require.main === module) {
  const suite = new PerformanceTestSuite();
  suite.runAll().catch(console.error);
}

module.exports = PerformanceTestSuite;
