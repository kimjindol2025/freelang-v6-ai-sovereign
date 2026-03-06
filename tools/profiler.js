/**
 * CLAUDELang v6.0 - Execution Profiler
 *
 * 실행 중 함수 호출, 시간, 메모리 사용량을 추적합니다.
 *
 * 사용법:
 *   node tools/profiler.js
 */

const { CLAUDELang } = require('../src/index.js');
const fs = require('fs');

class ExecutionProfiler {
  constructor(program, description = 'Program') {
    this.program = program;
    this.description = description;
    this.lang = new CLAUDELang(true); // 디버그 모드 활성화
  }

  /**
   * 프로파일 실행
   */
  profile() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log(`║  Profiling: ${this.description.padEnd(24)} ║`);
    console.log('╚════════════════════════════════════════╝\n');

    const beforeMem = process.memoryUsage();
    const startTime = performance.now();

    const result = this.lang.runProgram(this.program, process.cwd());

    const endTime = performance.now();
    const afterMem = process.memoryUsage();

    if (!result.success) {
      console.log(`❌ Execution failed: ${result.error}`);
      return null;
    }

    const executionTime = endTime - startTime;
    const memoryDelta = (afterMem.heapUsed - beforeMem.heapUsed) / 1024 / 1024;

    return {
      executionTime,
      memoryDelta,
      result,
      trace: result.trace || []
    };
  }

  /**
   * 프로파일 결과 분석
   */
  analyze(profileData) {
    if (!profileData) return;

    const { executionTime, memoryDelta, trace } = profileData;

    console.log('📊 Execution Profile');
    console.log('─'.repeat(60));
    console.log(`⏱️  Total Time: ${executionTime.toFixed(2)}ms`);
    console.log(`💾 Memory Delta: ${memoryDelta.toFixed(2)}MB`);
    console.log(`📞 Total Function Calls: ${trace.length}`);

    // 함수별 호출 횟수
    console.log('\n📈 Function Call Frequency:');
    console.log('─'.repeat(60));

    const callCounts = {};
    trace.forEach(t => {
      if (t.type === 'call') {
        callCounts[t.function] = (callCounts[t.function] || 0) + 1;
      }
    });

    Object.entries(callCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([func, count], i) => {
        console.log(`${i + 1}. ${func.padEnd(20)} ${count} calls`);
      });

    // 호출 깊이 분석
    console.log('\n📍 Call Stack Depth Analysis:');
    console.log('─'.repeat(60));

    const depths = trace.map(t => t.depth || 0);
    const maxDepth = Math.max(...depths, 0);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / (depths.length || 1);

    console.log(`Max Depth: ${maxDepth}`);
    console.log(`Avg Depth: ${avgDepth.toFixed(2)}`);

    // 실행 시간대 분석
    console.log('\n⏱️  Execution Timeline:');
    console.log('─'.repeat(60));

    const timestamps = trace.map(t => t.timestamp).filter(t => t);
    if (timestamps.length > 1) {
      const timeSlots = {};
      for (let i = 1; i < timestamps.length; i++) {
        const duration = timestamps[i] - timestamps[i - 1];
        const slot = Math.floor(duration / 10) * 10;
        timeSlots[slot] = (timeSlots[slot] || 0) + 1;
      }

      Object.entries(timeSlots)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .slice(0, 5)
        .forEach(([time, count]) => {
          console.log(`${time}ms range: ${count} transitions`);
        });
    }

    // 에러 분석
    const errors = trace.filter(t => t.type === 'error');
    if (errors.length > 0) {
      console.log('\n❌ Errors Detected:');
      console.log('─'.repeat(60));
      errors.slice(0, 5).forEach(err => {
        console.log(`${err.function}: ${err.error}`);
      });
    }
  }
}

// 프로파일 실행
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  CLAUDELang v6.0 - Execution Profiler                      ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// 1. 간단한 프로그램
const simpleProfiler = new ExecutionProfiler(
  {
    version: '6.0',
    instructions: [
      { type: 'call', function: 'println', args: [{ type: 'literal', value_type: 'string', value: 'Hello' }] },
      { type: 'call', function: 'println', args: [{ type: 'literal', value_type: 'string', value: 'World' }] }
    ]
  },
  'Simple Calls'
);

const simpleProfile = simpleProfiler.profile();
simpleProfiler.analyze(simpleProfile);

// 2. 배열 처리
const arrayProfiler = new ExecutionProfiler(
  require('../examples/array-example.json'),
  'Array Operations'
);

const arrayProfile = arrayProfiler.profile();
arrayProfiler.analyze(arrayProfile);

// 3. 재귀 함수
const recursiveProfiler = new ExecutionProfiler(
  require('../examples/recursive-factorial.json'),
  'Recursive Functions'
);

const recursiveProfile = recursiveProfiler.profile();
recursiveProfiler.analyze(recursiveProfile);

// 4. 모듈 import
const moduleProfiler = new ExecutionProfiler(
  require('../examples/module-usage.json'),
  'Module Import'
);

const moduleProfile = moduleProfiler.profile();
moduleProfiler.analyze(moduleProfile);

console.log('\n✅ Profiling completed!');
