/**
 * CLAUDELang v6.0 - Performance Benchmarking Tool
 *
 * 사용법:
 *   node tools/benchmarks.js
 *
 * 측정 항목:
 *   - Compilation time
 *   - Execution time
 *   - Memory usage
 *   - Cache hit rate
 */

const { CLAUDELang } = require('../src/index.js');
const fs = require('fs');
const path = require('path');

class Benchmark {
  constructor() {
    this.results = [];
  }

  /**
   * 단일 벤치마크 실행
   */
  run(name, program, iterations = 1) {
    const lang = new CLAUDELang();
    const times = [];
    const memories = [];

    console.log(`\n📊 Testing: ${name}`);
    console.log('─'.repeat(60));

    for (let i = 0; i < iterations; i++) {
      const before = process.memoryUsage();
      const startTime = performance.now();

      const result = lang.runProgram(program, process.cwd());

      const endTime = performance.now();
      const after = process.memoryUsage();

      if (!result.success) {
        console.log(`❌ Failed: ${result.error}`);
        return;
      }

      const executionTime = endTime - startTime;
      const memoryDelta = (after.heapUsed - before.heapUsed) / 1024 / 1024;

      times.push(executionTime);
      memories.push(Math.max(0, memoryDelta));

      if (iterations === 1) {
        console.log(`⏱️  Time: ${executionTime.toFixed(2)}ms`);
        console.log(`💾 Memory: ${memoryDelta.toFixed(2)}MB`);
      }
    }

    if (iterations > 1) {
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const avgMem = memories.reduce((a, b) => a + b) / memories.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log(`⏱️  Avg Time: ${avgTime.toFixed(2)}ms (min: ${minTime.toFixed(2)}ms, max: ${maxTime.toFixed(2)}ms)`);
      console.log(`💾 Avg Memory: ${avgMem.toFixed(2)}MB`);
      console.log(`🔄 Iterations: ${iterations}`);
    }

    // 캐시 통계
    const stats = lang.getCacheStats();
    console.log(`📈 Cache Stats: ${stats.hitRate} hit rate (${stats.hits}/${stats.total})`);

    this.results.push({
      name,
      avgTime: times.reduce((a, b) => a + b) / times.length,
      avgMemory: memories.reduce((a, b) => a + b) / memories.length,
      iterations
    });
  }

  /**
   * 벤치마크 결과 출력
   */
  printSummary() {
    console.log('\n\n╔════════════════════════════════════════╗');
    console.log('║     Benchmark Summary                  ║');
    console.log('╚════════════════════════════════════════╝\n');

    const sortedByTime = [...this.results].sort((a, b) => a.avgTime - b.avgTime);

    console.log('📊 By Execution Time (fastest first):');
    console.log('─'.repeat(60));
    sortedByTime.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name.padEnd(30)} ${r.avgTime.toFixed(2)}ms`);
    });

    const sortedByMemory = [...this.results].sort((a, b) => a.avgMemory - b.avgMemory);

    console.log('\n💾 By Memory Usage (lowest first):');
    console.log('─'.repeat(60));
    sortedByMemory.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name.padEnd(30)} ${r.avgMemory.toFixed(2)}MB`);
    });

    const totalTime = this.results.reduce((sum, r) => sum + r.avgTime, 0);
    const totalMemory = this.results.reduce((sum, r) => sum + r.avgMemory, 0);

    console.log('\n📈 Overall Statistics:');
    console.log('─'.repeat(60));
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`Total Memory: ${totalMemory.toFixed(2)}MB`);
    console.log(`Avg Time: ${(totalTime / this.results.length).toFixed(2)}ms`);
    console.log(`Avg Memory: ${(totalMemory / this.results.length).toFixed(2)}MB`);
  }
}

// 벤치마크 실행
const bench = new Benchmark();

console.log('╔════════════════════════════════════════╗');
console.log('║  CLAUDELang v6.0 Benchmark Suite      ║');
console.log('╚════════════════════════════════════════╝');

// 1. 기본 프로그램
bench.run('Simple Variable Declaration', {
  version: '6.0',
  instructions: [
    { type: 'var', name: 'x', value_type: 'i32', value: 42 }
  ]
}, 100);

// 2. 함수 호출
bench.run('Function Call (println)', {
  version: '6.0',
  instructions: [
    { type: 'call', function: 'println', args: [{ type: 'literal', value_type: 'string', value: 'hello' }] }
  ]
}, 100);

// 3. 배열 처리
bench.run('Array Operations', require('../examples/array-example.json'), 50);

// 4. 재귀 함수
bench.run('Recursive Function (factorial)', require('../examples/recursive-factorial.json'), 20);

// 5. 조건문
bench.run('Conditional Logic', require('../examples/conditional-loop.json'), 50);

// 6. 모듈 import
bench.run('Module Import', require('../examples/module-usage.json'), 10);

// 7. 복잡한 데이터 처리
bench.run('Complex Data Pipeline', require('../examples/data-pipeline.json'), 10);

// 8. 바이트코드 캐싱 효과
console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('🔍 Testing Bytecode Cache Effectiveness');
console.log('═══════════════════════════════════════════════════════════');

const lang = new CLAUDELang();
const testProgram = require('../examples/simple.json');

console.log('\n1️⃣  First run (no cache):');
const t1 = performance.now();
lang.runProgram(testProgram);
const t1_end = performance.now();
console.log(`   Time: ${(t1_end - t1).toFixed(2)}ms`);

console.log('\n2️⃣  Second run (cache hit):');
const t2 = performance.now();
lang.runProgram(testProgram);
const t2_end = performance.now();
console.log(`   Time: ${(t2_end - t2).toFixed(2)}ms`);

const speedup = (t1_end - t1) / (t2_end - t2);
console.log(`\n⚡ Speedup: ${speedup.toFixed(2)}x faster with cache`);

const cacheStats = lang.getCacheStats();
console.log(`📈 Cache Stats: ${cacheStats.hits}/${cacheStats.total} hits (${cacheStats.hitRate})`);

// 최종 요약
bench.printSummary();

console.log('\n✅ Benchmark completed!');
