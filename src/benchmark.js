/**
 * CLAUDELang v6.0 Performance Benchmarks
 * 성능 측정 및 프로파일링 도구
 */

const CLAUDELangCompiler = require("./compiler.js");
const os = require("os");

class PerformanceBenchmark {
  constructor() {
    this.results = [];
    this.compiler = new CLAUDELangCompiler();
    this.memoryCheckpoints = [];
  }

  /**
   * 마이크로초 단위로 시간 측정 시작
   */
  startTimer() {
    return process.hrtime.bigint();
  }

  /**
   * 경과 시간 계산 (마이크로초)
   */
  endTimer(startTime) {
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / 1000; // 나노초 → 마이크로초
  }

  /**
   * 현재 메모리 사용량 (MB)
   */
  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((used.external / 1024 / 1024) * 100) / 100,
      rss: Math.round((used.rss / 1024 / 1024) * 100) / 100,
    };
  }

  /**
   * 메모리 체크포인트 설정
   */
  recordMemoryCheckpoint(label) {
    this.memoryCheckpoints.push({
      label: label,
      memory: this.getMemoryUsage(),
      timestamp: Date.now(),
    });
  }

  /**
   * 1. 기본 컴파일 성능 측정
   */
  benchmarkBasicCompile() {
    console.log("\n📊 Benchmark 1: Basic Compilation");
    console.log("═".repeat(50));

    const program = {
      version: "6.0",
      instructions: [
        {
          type: "var",
          name: "x",
          value_type: "i32",
          value: 42,
        },
        {
          type: "var",
          name: "message",
          value_type: "string",
          value: "Hello FreeLang",
        },
        {
          type: "call",
          function: "print",
          args: [{ type: "ref", name: "message" }],
        },
      ],
    };

    const startMem = this.getMemoryUsage();
    const startTime = this.startTimer();

    const result = this.compiler.compile(program);

    const elapsed = this.endTimer(startTime);
    const endMem = this.getMemoryUsage();
    const memDelta = endMem.heapUsed - startMem.heapUsed;

    const benchmark = {
      name: "Basic Compilation",
      time_us: elapsed,
      time_ms: elapsed / 1000,
      memory_mb: memDelta,
      success: result.success,
      code_size: result.code ? result.code.length : 0,
    };

    this.results.push(benchmark);

    console.log(`⏱️  Time: ${elapsed.toFixed(2)} µs (${(elapsed / 1000).toFixed(3)} ms)`);
    console.log(`💾 Memory Delta: ${memDelta.toFixed(2)} MB`);
    console.log(`📝 Code Size: ${benchmark.code_size} bytes`);
    console.log(`✅ Success: ${result.success}`);

    return benchmark;
  }

  /**
   * 2. 복잡한 컴파일 성능 측정
   */
  benchmarkComplexCompile() {
    console.log("\n📊 Benchmark 2: Complex Compilation");
    console.log("═".repeat(50));

    // 배열 처리, 조건문, 루프 포함
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
              { type: "literal", value: 1, value_type: "i32" },
              { type: "literal", value: 2, value_type: "i32" },
              { type: "literal", value: 3, value_type: "i32" },
              { type: "literal", value: 4, value_type: "i32" },
              { type: "literal", value: 5, value_type: "i32" },
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
              params: [{ name: "x" }],
              body: [
                {
                  type: "arithmetic",
                  operator: "*",
                  left: { type: "ref", name: "x" },
                  right: { type: "literal", value: 2, value_type: "i32" },
                },
              ],
            },
          ],
          assign_to: "doubled",
        },
        {
          type: "condition",
          test: {
            type: "comparison",
            operator: ">",
            left: { type: "ref", name: "x" },
            right: { type: "literal", value: 3, value_type: "i32" },
          },
          then: [
            {
              type: "call",
              function: "print",
              args: [{ type: "literal", value: "Greater than 3", value_type: "string" }],
            },
          ],
          else: [
            {
              type: "call",
              function: "print",
              args: [{ type: "literal", value: "Less than or equal to 3", value_type: "string" }],
            },
          ],
        },
        {
          type: "loop",
          iterator: "i",
          range: { type: "ref", name: "numbers" },
          body: [
            {
              type: "call",
              function: "print",
              args: [{ type: "ref", name: "i" }],
            },
          ],
        },
      ],
    };

    const startMem = this.getMemoryUsage();
    const startTime = this.startTimer();

    const result = this.compiler.compile(program);

    const elapsed = this.endTimer(startTime);
    const endMem = this.getMemoryUsage();
    const memDelta = endMem.heapUsed - startMem.heapUsed;

    const benchmark = {
      name: "Complex Compilation",
      time_us: elapsed,
      time_ms: elapsed / 1000,
      memory_mb: memDelta,
      success: result.success,
      code_size: result.code ? result.code.length : 0,
      instructions: program.instructions.length,
    };

    this.results.push(benchmark);

    console.log(`⏱️  Time: ${elapsed.toFixed(2)} µs (${(elapsed / 1000).toFixed(3)} ms)`);
    console.log(`💾 Memory Delta: ${memDelta.toFixed(2)} MB`);
    console.log(`📝 Code Size: ${benchmark.code_size} bytes`);
    console.log(`📋 Instructions: ${benchmark.instructions}`);
    console.log(`✅ Success: ${result.success}`);

    return benchmark;
  }

  /**
   * 3. 배치 처리 성능 측정
   */
  benchmarkBatchCompile(batchSize = 10) {
    console.log(`\n📊 Benchmark 3: Batch Compilation (${batchSize} items)`);
    console.log("═".repeat(50));

    const programs = [];
    for (let i = 0; i < batchSize; i++) {
      programs.push({
        version: "6.0",
        instructions: [
          {
            type: "var",
            name: `var_${i}`,
            value_type: "i32",
            value: i * 10,
          },
          {
            type: "call",
            function: "print",
            args: [{ type: "ref", name: `var_${i}` }],
          },
        ],
      });
    }

    const startMem = this.getMemoryUsage();
    const startTime = this.startTimer();

    let totalCodeSize = 0;
    let successCount = 0;

    programs.forEach((program) => {
      const result = this.compiler.compile(program);
      if (result.success) {
        successCount++;
        totalCodeSize += result.code.length;
      }
    });

    const elapsed = this.endTimer(startTime);
    const endMem = this.getMemoryUsage();
    const memDelta = endMem.heapUsed - startMem.heapUsed;
    const avgTime = elapsed / batchSize;

    const benchmark = {
      name: "Batch Compilation",
      total_time_us: elapsed,
      total_time_ms: elapsed / 1000,
      avg_time_us: avgTime,
      avg_time_ms: avgTime / 1000,
      memory_mb: memDelta,
      batch_size: batchSize,
      success_count: successCount,
      total_code_size: totalCodeSize,
    };

    this.results.push(benchmark);

    console.log(`⏱️  Total Time: ${elapsed.toFixed(2)} µs (${(elapsed / 1000).toFixed(3)} ms)`);
    console.log(`⏱️  Average per item: ${avgTime.toFixed(2)} µs (${(avgTime / 1000).toFixed(3)} ms)`);
    console.log(`💾 Memory Delta: ${memDelta.toFixed(2)} MB`);
    console.log(`📊 Success Rate: ${successCount}/${batchSize}`);
    console.log(`📝 Total Code Size: ${totalCodeSize} bytes`);

    return benchmark;
  }

  /**
   * 4. 타입 검사 성능 측정
   */
  benchmarkTypeChecking() {
    console.log("\n📊 Benchmark 4: Type Checking Performance");
    console.log("═".repeat(50));

    // 많은 변수와 함수 호출로 타입 검사 부하 증가
    const instructions = [];
    for (let i = 0; i < 20; i++) {
      instructions.push({
        type: "var",
        name: `var_${i}`,
        value_type: i % 2 === 0 ? "i32" : "string",
        value: i % 2 === 0 ? i : `value_${i}`,
      });

      instructions.push({
        type: "call",
        function: "print",
        args: [{ type: "ref", name: `var_${i}` }],
      });
    }

    const program = {
      version: "6.0",
      instructions: instructions,
    };

    const startMem = this.getMemoryUsage();
    const startTime = this.startTimer();

    const result = this.compiler.compile(program);

    const elapsed = this.endTimer(startTime);
    const endMem = this.getMemoryUsage();
    const memDelta = endMem.heapUsed - startMem.heapUsed;

    const benchmark = {
      name: "Type Checking",
      time_us: elapsed,
      time_ms: elapsed / 1000,
      memory_mb: memDelta,
      instruction_count: instructions.length,
      success: result.success,
    };

    this.results.push(benchmark);

    console.log(`⏱️  Time: ${elapsed.toFixed(2)} µs (${(elapsed / 1000).toFixed(3)} ms)`);
    console.log(`💾 Memory Delta: ${memDelta.toFixed(2)} MB`);
    console.log(`📋 Instructions: ${instructions.length}`);
    console.log(`✅ Success: ${result.success}`);

    return benchmark;
  }

  /**
   * 5. 메모리 누수 테스트
   */
  benchmarkMemoryLeak() {
    console.log("\n📊 Benchmark 5: Memory Leak Detection");
    console.log("═".repeat(50));

    const iterations = 100;
    const memoryPoints = [];

    for (let iteration = 0; iteration < iterations; iteration++) {
      const program = {
        version: "6.0",
        instructions: [
          {
            type: "var",
            name: "data",
            value_type: "Object",
            value: {
              type: "object",
              properties: {
                field1: { type: "literal", value: Math.random(), value_type: "f64" },
                field2: { type: "literal", value: `data_${iteration}`, value_type: "string" },
              },
            },
          },
        ],
      };

      const result = this.compiler.compile(program);

      if (iteration % 10 === 0) {
        // GC 강제 실행 (V8)
        if (global.gc) {
          global.gc();
        }
        const mem = this.getMemoryUsage();
        memoryPoints.push({
          iteration: iteration,
          heapUsed: mem.heapUsed,
        });
      }
    }

    const startMem = memoryPoints[0].heapUsed;
    const endMem = memoryPoints[memoryPoints.length - 1].heapUsed;
    const memoryGrowth = endMem - startMem;
    const isLeaking = memoryGrowth > 0.5; // 0.5MB 이상 증가면 누수 의심

    const benchmark = {
      name: "Memory Leak Detection",
      iterations: iterations,
      start_heap_mb: startMem,
      end_heap_mb: endMem,
      growth_mb: memoryGrowth,
      is_leaking: isLeaking,
      checkpoints: memoryPoints.length,
    };

    this.results.push(benchmark);

    console.log(`🔁 Iterations: ${iterations}`);
    console.log(`📊 Checkpoints: ${memoryPoints.length}`);
    console.log(`📈 Memory Growth: ${memoryGrowth.toFixed(2)} MB`);
    console.log(`🔴 Leak Detected: ${isLeaking ? "YES (⚠️)" : "NO (✅)"}`);

    return benchmark;
  }

  /**
   * 6. 캐싱 효과 측정 (캐싱 구현 후)
   */
  benchmarkCachingEffect() {
    console.log("\n📊 Benchmark 6: Caching Effectiveness");
    console.log("═".repeat(50));

    const program = {
      version: "6.0",
      instructions: [
        {
          type: "var",
          name: "x",
          value_type: "i32",
          value: 42,
        },
      ],
    };

    // 첫 번째 컴파일 (캐시 미스)
    const startTime1 = this.startTimer();
    const result1 = this.compiler.compile(program);
    const elapsed1 = this.endTimer(startTime1);

    // 동일한 프로그램 재컴파일 (캐시 히트 예상)
    const startTime2 = this.startTimer();
    const result2 = this.compiler.compile(program);
    const elapsed2 = this.endTimer(startTime2);

    const speedup = elapsed1 / elapsed2;

    const benchmark = {
      name: "Caching Effect",
      first_compile_us: elapsed1,
      second_compile_us: elapsed2,
      speedup_ratio: speedup,
      is_faster: elapsed2 < elapsed1,
    };

    this.results.push(benchmark);

    console.log(`⏱️  First Compile: ${elapsed1.toFixed(2)} µs`);
    console.log(`⏱️  Second Compile: ${elapsed2.toFixed(2)} µs`);
    console.log(`⚡ Speedup: ${speedup.toFixed(2)}x`);
    console.log(`✅ Cached: ${elapsed2 < elapsed1 ? "YES" : "NO"}`);

    return benchmark;
  }

  /**
   * 모든 벤치마크 실행
   */
  runAllBenchmarks() {
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + " CLAUDELang v6.0 Performance Benchmarks".padEnd(68) + "║");
    console.log("╚" + "═".repeat(68) + "╝");

    this.recordMemoryCheckpoint("Start");

    // 기본 벤치마크들
    this.benchmarkBasicCompile();
    this.benchmarkComplexCompile();
    this.benchmarkBatchCompile(10);
    this.benchmarkTypeChecking();
    this.benchmarkMemoryLeak();
    this.benchmarkCachingEffect();

    this.recordMemoryCheckpoint("End");

    this.printSummary();
    this.printTargets();

    return this.results;
  }

  /**
   * 성능 목표 표시
   */
  printTargets() {
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + " Performance Targets".padEnd(68) + "║");
    console.log("╠" + "═".repeat(68) + "╣");

    const targets = [
      { metric: "Single Compile", target: "< 1 ms", current: "?" },
      { metric: "Single Execute", target: "< 10 ms", current: "?" },
      { metric: "Batch (10 items)", target: "< 100 ms", current: "?" },
      { metric: "Memory Usage", target: "< 1 MB", current: "?" },
    ];

    targets.forEach((target) => {
      const line = `║ ${target.metric.padEnd(20)} ${target.target.padEnd(15)} ${target.current}`;
      console.log(line.padEnd(69) + "║");
    });

    console.log("╚" + "═".repeat(68) + "╝");
  }

  /**
   * 결과 요약
   */
  printSummary() {
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + " Results Summary".padEnd(68) + "║");
    console.log("╠" + "═".repeat(68) + "╣");

    this.results.forEach((benchmark, idx) => {
      const line = `║ [${idx + 1}] ${benchmark.name.padEnd(50)}`;
      console.log(line.padEnd(69) + "║");

      // 자세한 정보
      if (benchmark.time_ms !== undefined) {
        const detail = `║     ⏱️  ${(benchmark.time_ms).toFixed(3)} ms (${benchmark.time_us.toFixed(2)} µs)`;
        console.log(detail.padEnd(69) + "║");
      }
      if (benchmark.total_time_ms !== undefined) {
        const detail = `║     ⏱️  Avg: ${(benchmark.avg_time_ms).toFixed(3)} ms, Total: ${(benchmark.total_time_ms).toFixed(3)} ms`;
        console.log(detail.padEnd(69) + "║");
      }
      if (benchmark.memory_mb !== undefined) {
        const detail = `║     💾 ${benchmark.memory_mb.toFixed(2)} MB`;
        console.log(detail.padEnd(69) + "║");
      }
    });

    console.log("╚" + "═".repeat(68) + "╝\n");
  }

  /**
   * JSON으로 결과 내보내기
   */
  exportResults(filename = "benchmark-results.json") {
    const fs = require("fs");
    const report = {
      timestamp: new Date().toISOString(),
      platform: {
        system: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: os.totalmem() / 1024 / 1024 / 1024,
      },
      nodeVersion: process.version,
      benchmarks: this.results,
      memoryCheckpoints: this.memoryCheckpoints,
    };

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n✅ Results exported to ${filename}`);

    return report;
  }
}

// 실행
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAllBenchmarks();
  benchmark.exportResults("/data/data/com.termux/files/home/freelang-v6-ai-sovereign/benchmark-results.json");
}

module.exports = PerformanceBenchmark;
