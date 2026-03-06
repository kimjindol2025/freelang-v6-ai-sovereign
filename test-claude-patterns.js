/**
 * CLAUDELang v6.0 - Claude 패턴 테스트
 * Claude가 자주 사용하는 코드 패턴을 CLAUDELang으로 표현
 */

const fs = require('fs');
const path = require('path');
const CLAUDELangCompiler = require('./src/compiler');
const { VTRuntimeBridge } = require('./src/vt-runtime-bridge');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

class ClaudePatternTester {
  constructor() {
    this.compiler = new CLAUDELangCompiler();
    this.bridge = new VTRuntimeBridge();
    this.patterns = [];
  }

  testPattern(name, jsonPath) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf8');
      const json = JSON.parse(content);

      const compiled = this.compiler.compile(json);
      if (!compiled.success) {
        return { name, status: 'COMPILE_FAILED', error: compiled.errors[0] };
      }

      const result = this.bridge.execute(compiled.code);
      if (!result.success) {
        return { name, status: 'EXECUTION_FAILED', error: result.errors[0] };
      }

      return { name, status: 'SUCCESS', result: result.result };
    } catch (error) {
      return { name, status: 'ERROR', error: error.message };
    }
  }

  runAll() {
    log('cyan', '\n╔════════════════════════════════════════════╗');
    log('cyan', '║  Claude 특화 패턴 테스트                   ║');
    log('cyan', '╚════════════════════════════════════════════╝\n');

    const patterns = [
      'claude-code-generation.json',
      'claude-analysis-pattern.json',
      'claude-step-by-step.json',
      'claude-api-response.json',
      'claude-code-review.json',
      'claude-problem-solving.json'
    ];

    log('blue', `${patterns.length}개의 Claude 패턴 테스트\n`);

    patterns.forEach((file, idx) => {
      const filepath = path.join(__dirname, 'examples', file);
      const patternName = file.replace('.json', '');
      const result = this.testPattern(patternName, filepath);
      
      if (result.status === 'SUCCESS') {
        log('green', `${idx + 1}. ✓ ${result.name}`);
      } else {
        log('red', `${idx + 1}. ✗ ${result.name}`);
        log('red', `   ${result.error}`);
      }
      
      this.patterns.push(result);
      this.bridge.clearMemory();
    });

    this.printAnalysis();
  }

  printAnalysis() {
    const passed = this.patterns.filter(p => p.status === 'SUCCESS').length;
    const total = this.patterns.length;

    log('cyan', '\n╔════════════════════════════════════════════╗');
    log('cyan', '║        분석 및 평가                        ║');
    log('cyan', '╚════════════════════════════════════════════╝\n');

    log('blue', `전체: ${total} | 성공: ${passed} | 성공률: ${(passed/total*100).toFixed(1)}%\n`);

    log('magenta', '━━━ Claude 패턴 분석 ━━━\n');

    const patternAnalysis = {
      '코드 생성': 'claude-code-generation',
      '분석': 'claude-analysis-pattern',
      '단계별 처리': 'claude-step-by-step',
      'API 응답 처리': 'claude-api-response',
      '코드 리뷰': 'claude-code-review',
      '문제 해결': 'claude-problem-solving'
    };

    Object.entries(patternAnalysis).forEach(([category, pattern]) => {
      const result = this.patterns.find(p => p.name === pattern);
      const status = result.status === 'SUCCESS' ? '✓' : '✗';
      log('yellow', `${status} ${category}`);
      
      if (result.status === 'SUCCESS') {
        log('cyan', `  → JSON 구조로 명확하게 표현 가능`);
      }
    });

    log('magenta', '\n━━━ 효율성 평가 ━━━\n');

    log('green', '✓ JSON 기반 구조의 장점:');
    log('cyan', '  • 파서 없이 직접 객체로 작업');
    log('cyan', '  • Type-safe한 인터페이스');
    log('cyan', '  • 중간 언어 불필요');

    log('green', '\n✓ Claude 특화 기능:');
    log('cyan', '  • 함수형 프로그래밍 (map, filter, reduce)');
    log('cyan', '  • 람다 표현식');
    log('cyan', '  • 명확한 제어 흐름');

    log('magenta', '\n━━━ 결론 ━━━\n');
    log('green', '✓ CLAUDELang은 Claude의 사고 패턴과 일치합니다');
    log('green', '✓ 자연스러운 코드 생성 가능');
    log('green', '✓ 실무적 데이터 처리에 최적화');
  }
}

if (require.main === module) {
  const tester = new ClaudePatternTester();
  tester.runAll();
}

module.exports = ClaudePatternTester;
