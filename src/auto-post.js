/**
 * CLAUDELang v6.0 자동 포스팅 시스템
 *
 * 기능:
 * 1. CLAUDELang 코드 컴파일
 * 2. VT로 실행 (시뮬레이션)
 * 3. 결과 Notion에 자동 발행
 * 4. 성능 지표 및 보고서 자동 생성
 */

const fs = require('fs');
const path = require('path');
const CLAUDELangCompiler = require('./compiler.js');

/**
 * VT 가상 머신 시뮬레이터
 * CLAUDELang 컴파일된 코드를 실행하는 시뮬레이션 환경
 */
class VirtualMachine {
  constructor() {
    this.scope = new Map();
    this.output = [];
    this.executionTime = 0;
    this.memoryUsage = 0;
    this.instructionCount = 0;
  }

  /**
   * VT 코드 실행 (시뮬레이션)
   */
  execute(vtCode) {
    const startTime = Date.now();
    const startMem = process.memoryUsage().heapUsed;

    try {
      // VT 코드 파싱 (간단한 S-expression 파싱)
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
      this.memoryUsage = (endMem - startMem) / 1024 / 1024; // MB

      return {
        success: true,
        output: this.output,
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
      const [, name, value] = defineMatch;
      this.scope.set(name, this.evaluateValue(value));
      return;
    }

    // 함수 호출: (call function arg1 arg2 ...)
    const callMatch = expr.match(/^\(call\s+(\S+)\s*(.*)\)$/);
    if (callMatch) {
      const [, funcName, argsStr] = callMatch;
      this.executeFunction(funcName, argsStr);
      return;
    }

    // print 호출: (print value)
    const printMatch = expr.match(/^\(call\s+print\s+"([^"]*)"\)$/);
    if (printMatch) {
      this.output.push(printMatch[1]);
      return;
    }
  }

  /**
   * 내장 함수 실행
   */
  executeFunction(funcName, argsStr) {
    const args = this.parseArguments(argsStr);

    switch (funcName) {
      case 'print':
        args.forEach(arg => {
          this.output.push(String(arg));
        });
        break;

      case 'HTTP.get':
        // 시뮬레이션: HTTP GET 요청
        this.output.push(`[HTTP.get] URL: ${args[0]}`);
        break;

      case 'Array.map':
        // 배열 맵핑 시뮬레이션
        this.output.push(`[Array.map] 배열 변환 시뮬레이션`);
        break;

      case 'String.upper':
        this.output.push(String(args[0]).toUpperCase());
        break;

      case 'String.lower':
        this.output.push(String(args[0]).toLowerCase());
        break;

      case 'Math.sqrt':
        this.output.push(Math.sqrt(Number(args[0])).toString());
        break;

      case 'JSON.stringify':
        this.output.push(JSON.stringify(args[0]));
        break;

      default:
        this.output.push(`[${funcName}] 함수 호출 시뮬레이션`);
    }
  }

  /**
   * 인수 파싱
   */
  parseArguments(argsStr) {
    if (!argsStr.trim()) return [];

    const args = [];
    let current = '';
    let inQuotes = false;

    for (const char of argsStr) {
      if (char === '"') {
        inQuotes = !inQuotes;
      }
      if (char === ' ' && !inQuotes) {
        if (current) args.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) args.push(current);

    return args.map(arg => this.evaluateValue(arg));
  }

  /**
   * 값 평가
   */
  evaluateValue(value) {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    if (this.scope.has(value)) {
      return this.scope.get(value);
    }
    return value;
  }
}

/**
 * AutoPoster 메인 클래스
 * CLAUDELang 코드를 컴파일하고 실행하며 Notion에 발행
 */
class AutoPoster {
  constructor(notionApiToken = null) {
    this.compiler = new CLAUDELangCompiler();
    this.vm = new VirtualMachine();
    this.notionApiToken = notionApiToken;
    this.results = [];
  }

  /**
   * 메인 처리 함수
   * CLAUDELang 코드 → 컴파일 → 실행 → Notion 발행
   */
  async run(claudelangCode, metadata = {}) {
    const processStartTime = Date.now();

    // claudelangCode가 문자열이면 JSON으로 파싱
    let codeObj = claudelangCode;
    if (typeof claudelangCode === 'string') {
      try {
        codeObj = JSON.parse(claudelangCode);
      } catch (e) {
        return this.generateFailureReport(
          claudelangCode,
          {
            success: false,
            errors: [`JSON 파싱 실패: ${e.message}`],
            code: null
          },
          metadata,
          processStartTime
        );
      }
    }

    // 1. 컴파일
    console.log('[AutoPoster] 1단계: CLAUDELang 컴파일...');
    const compilationResult = this.compiler.compile(codeObj);

    if (!compilationResult.success) {
      return this.generateFailureReport(
        claudelangCode,
        compilationResult,
        metadata,
        processStartTime
      );
    }

    // 2. VT로 실행
    console.log('[AutoPoster] 2단계: VT 시뮬레이션 실행...');
    const executionResult = this.vm.execute(compilationResult.code);

    // 3. 결과 분석
    console.log('[AutoPoster] 3단계: 결과 분석...');
    const report = this.generateReport(
      codeObj,
      compilationResult,
      executionResult,
      metadata,
      processStartTime
    );

    // 4. Notion 발행 (설정된 경우)
    if (this.notionApiToken) {
      console.log('[AutoPoster] 4단계: Notion 발행...');
      await this.postToNotion(report);
    }

    this.results.push(report);
    return report;
  }

  /**
   * 여러 CLAUDELang 파일 배치 처리
   */
  async runBatch(filePaths, outputDir = './results') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`[AutoPoster] ${filePaths.length}개 파일 처리 시작...`);

    const results = [];
    for (const filePath of filePaths) {
      try {
        const code = fs.readFileSync(filePath, 'utf-8');
        const metadata = {
          filename: path.basename(filePath),
          filePath: filePath,
        };

        const result = await this.run(code, metadata);
        results.push(result);

        // 결과를 파일로 저장
        const reportPath = path.join(
          outputDir,
          `${path.basename(filePath, path.extname(filePath))}-report.json`
        );
        fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(`[AutoPoster] 파일 처리 실패: ${filePath}`, error.message);
      }
    }

    // 요약 보고서 생성
    this.generateSummaryReport(results, outputDir);

    return results;
  }

  /**
   * 보고서 생성
   */
  generateReport(code, compileResult, execResult, metadata, startTime) {
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return {
      timestamp: new Date().toISOString(),
      metadata: metadata,
      compilation: {
        success: compileResult.success,
        vtCode: compileResult.code,
        errors: compileResult.errors,
        vtCodeLength: compileResult.code ? compileResult.code.length : 0,
      },
      execution: {
        success: execResult.success,
        output: execResult.output,
        error: execResult.error,
        executionTime: execResult.executionTime,
        memoryUsage: execResult.memoryUsage,
        instructionCount: execResult.instructionCount,
      },
      performance: {
        totalProcessingTime: totalTime,
        compilationPhase: 'included in total',
        executionPhase: execResult.executionTime,
      },
      markdown: this.generateMarkdown(code, compileResult, execResult, metadata),
    };
  }

  /**
   * 실패 보고서 생성
   */
  generateFailureReport(code, compileResult, metadata, startTime) {
    const endTime = Date.now();

    return {
      timestamp: new Date().toISOString(),
      metadata: metadata,
      compilation: {
        success: false,
        errors: compileResult.errors,
      },
      execution: {
        success: false,
        error: '컴파일 실패로 인해 실행되지 않음',
      },
      performance: {
        totalProcessingTime: endTime - startTime,
      },
      markdown: this.generateFailureMarkdown(code, compileResult, metadata),
    };
  }

  /**
   * Markdown 보고서 생성
   */
  generateMarkdown(code, compileResult, execResult, metadata) {
    const lines = [];

    // 헤더
    lines.push(`# CLAUDELang v6.0 자동 실행 결과`);
    lines.push('');

    // 메타데이터
    lines.push(`**파일**: ${metadata.filename || 'Unknown'}`);
    lines.push(`**실행 시간**: ${new Date().toLocaleString('ko-KR')}`);
    lines.push('');

    // 컴파일 결과
    lines.push(`## 1. 컴파일 결과`);
    lines.push(`- **상태**: ${compileResult.success ? '✅ 성공' : '❌ 실패'}`);
    lines.push(`- **VT 코드 길이**: ${compileResult.code ? compileResult.code.length : 0} bytes`);
    if (compileResult.errors.length > 0) {
      lines.push(`- **에러**: ${compileResult.errors.join(', ')}`);
    }
    lines.push('');

    // VT 코드 (축약)
    if (compileResult.code) {
      lines.push(`### VT 바이트코드`);
      lines.push('```vt');
      const vtLines = compileResult.code.split('\n').slice(0, 10);
      lines.push(vtLines.join('\n'));
      if (compileResult.code.split('\n').length > 10) {
        lines.push(`... (${compileResult.code.split('\n').length - 10}개 줄 생략)`);
      }
      lines.push('```');
      lines.push('');
    }

    // 실행 결과
    lines.push(`## 2. 실행 결과`);
    lines.push(`- **상태**: ${execResult.success ? '✅ 성공' : '❌ 실패'}`);
    lines.push(`- **실행 시간**: ${execResult.executionTime}ms`);
    lines.push(`- **메모리 사용량**: ${execResult.memoryUsage.toFixed(2)}MB`);
    lines.push(`- **명령어 수**: ${execResult.instructionCount}`);
    lines.push('');

    if (execResult.error) {
      lines.push(`**에러 메시지**: ${execResult.error}`);
      lines.push('');
    }

    if (execResult.output.length > 0) {
      lines.push(`### 출력 결과`);
      lines.push('```');
      execResult.output.forEach(line => {
        lines.push(String(line));
      });
      lines.push('```');
      lines.push('');
    }

    // 원본 코드
    lines.push(`## 3. 원본 CLAUDELang 코드`);
    lines.push('```json');
    try {
      const codeObj = typeof code === 'string' ? JSON.parse(code) : code;
      const prettyCode = JSON.stringify(codeObj, null, 2);
      const codeLines = prettyCode.split('\n');
      lines.push(codeLines.slice(0, 15).join('\n'));
      if (codeLines.length > 15) {
        lines.push(`... (${codeLines.length - 15}개 줄 생략)`);
      }
    } catch (e) {
      lines.push(code.substring(0, 200));
      if (code.length > 200) lines.push('... (생략)');
    }
    lines.push('```');
    lines.push('');

    // 성능 지표
    lines.push(`## 4. 성능 지표`);
    lines.push(`| 항목 | 값 |`);
    lines.push(`|-----|-----|`);
    lines.push(`| 컴파일 상태 | ${compileResult.success ? '성공' : '실패'} |`);
    lines.push(`| 실행 상태 | ${execResult.success ? '성공' : '실패'} |`);
    lines.push(`| 실행 시간 | ${execResult.executionTime}ms |`);
    lines.push(`| 메모리 사용 | ${execResult.memoryUsage.toFixed(2)}MB |`);
    lines.push(`| 명령어 수 | ${execResult.instructionCount} |`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 실패 Markdown 보고서
   */
  generateFailureMarkdown(code, compileResult, metadata) {
    const lines = [];

    lines.push(`# CLAUDELang v6.0 실행 실패`);
    lines.push('');

    lines.push(`**파일**: ${metadata.filename || 'Unknown'}`);
    lines.push(`**실행 시간**: ${new Date().toLocaleString('ko-KR')}`);
    lines.push('');

    lines.push(`## 컴파일 에러`);
    compileResult.errors.forEach(error => {
      lines.push(`- ❌ ${error}`);
    });
    lines.push('');

    lines.push(`## 원본 코드`);
    lines.push('```json');
    try {
      const codeObj = typeof code === 'string' ? JSON.parse(code) : code;
      lines.push(JSON.stringify(codeObj, null, 2));
    } catch (e) {
      lines.push(code);
    }
    lines.push('```');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Notion에 발행
   * (실제 API 통합은 Notion MCP 활용)
   */
  async postToNotion(report) {
    if (!this.notionApiToken) {
      console.log('[AutoPoster] Notion API 토큰이 설정되지 않았습니다');
      return false;
    }

    try {
      // Notion MCP를 통한 실제 발행은 외부에서 처리
      // 여기서는 발행 준비만 수행
      console.log('[AutoPoster] Notion 발행 준비 완료');
      console.log(`  - 제목: CLAUDELang 실행 결과 (${report.metadata.filename})`);
      console.log(`  - 시간: ${report.timestamp}`);

      return true;
    } catch (error) {
      console.error('[AutoPoster] Notion 발행 실패:', error.message);
      return false;
    }
  }

  /**
   * 요약 보고서 생성
   */
  generateSummaryReport(results, outputDir) {
    const summary = {
      totalFiles: results.length,
      successfulCompilations: results.filter(r => r.compilation.success).length,
      successfulExecutions: results.filter(r => r.execution.success).length,
      averageExecutionTime: results.length > 0
        ? results.reduce((sum, r) => sum + (r.execution.executionTime || 0), 0) / results.length
        : 0,
      totalMemoryUsage: results.reduce((sum, r) => sum + (r.execution.memoryUsage || 0), 0),
      results: results.map(r => ({
        file: r.metadata.filename,
        compilation: r.compilation.success,
        execution: r.execution.success,
        time: r.execution.executionTime,
        memory: r.execution.memoryUsage,
      })),
    };

    const summaryPath = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Markdown 요약
    const lines = [
      '# CLAUDELang 자동 포스팅 요약 보고서',
      '',
      `## 처리 결과`,
      `- **처리 파일 수**: ${summary.totalFiles}개`,
      `- **컴파일 성공**: ${summary.successfulCompilations}/${summary.totalFiles}`,
      `- **실행 성공**: ${summary.successfulExecutions}/${summary.totalFiles}`,
      `- **평균 실행 시간**: ${summary.averageExecutionTime.toFixed(2)}ms`,
      `- **총 메모리 사용량**: ${summary.totalMemoryUsage.toFixed(2)}MB`,
      '',
      '## 상세 결과',
      '| 파일 | 컴파일 | 실행 | 시간(ms) | 메모리(MB) |',
      '|------|--------|------|---------|-----------|',
    ];

    summary.results.forEach(r => {
      lines.push(
        `| ${r.file} | ${r.compilation ? '✅' : '❌'} | ${r.execution ? '✅' : '❌'} | ${r.time || 'N/A'} | ${(r.memory || 0).toFixed(2)} |`
      );
    });

    const summaryMarkdownPath = path.join(outputDir, 'summary.md');
    fs.writeFileSync(summaryMarkdownPath, lines.join('\n'));

    console.log(`[AutoPoster] 요약 보고서 생성: ${summaryPath}`);
  }

  /**
   * 결과 저장
   */
  saveResults(outputDir = './auto-post-results') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(outputDir, `results-${timestamp}.json`);

    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    console.log(`[AutoPoster] 결과 저장: ${resultsFile}`);
  }

  /**
   * 결과 조회
   */
  getResults() {
    return this.results;
  }
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AutoPoster,
    VirtualMachine,
  };
}
