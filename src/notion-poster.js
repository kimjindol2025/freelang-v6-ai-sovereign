#!/usr/bin/env node

/**
 * CLAUDELang v6.0 Notion 자동 포스팅 시스템
 *
 * 예제를 실행하고 결과를 Notion에 자동 발행
 *
 * 사용법:
 * 1. 기본 설정:
 *    const poster = new NotionPoster({ dataSourceId: '...' });
 *
 * 2. 단일 파일 실행 및 발행:
 *    await poster.executeAndPost('./examples/simple.json');
 *
 * 3. 배치 처리:
 *    await poster.batchProcess(['examples/*.json']);
 *
 * 4. CLI 실행:
 *    node notion-poster.js batch ./examples
 *    node notion-poster.js post ./examples/simple.json
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { NotionIntegration } = require('./notion-integration.js');

/**
 * NotionPoster 메인 클래스
 */
class NotionPoster {
  constructor(options = {}) {
    this.notionIntegration = new NotionIntegration({
      dataSourceId: options.dataSourceId || process.env.NOTION_DATA_SOURCE_ID,
      useRealNotionMCP: options.useRealNotionMCP !== false,
      tags: options.tags || ['#CLAUDELang', '#AutoPost', '#v6.0'],
    });

    this.outputDir = options.outputDir || './auto-post-results';
    this.processedFiles = [];
    this.results = [];

    // 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log('[NotionPoster] 초기화 완료');
    console.log(`  출력 디렉토리: ${this.outputDir}`);
    console.log(`  Notion 데이터소스: ${this.notionIntegration.dataSourceId || '설정 필요'}`);
  }

  /**
   * 단일 파일 실행 및 Notion 발행
   */
  async executeAndPost(filePath) {
    try {
      console.log(`\n[NotionPoster] 파일 처리: ${filePath}`);

      // 1. 파일 읽기
      if (!fs.existsSync(filePath)) {
        throw new Error(`파일을 찾을 수 없음: ${filePath}`);
      }

      const code = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath);

      // 2. 실행 및 Notion 발행
      const result = await this.notionIntegration.executeAndPost(code, {
        filename: filename,
        filePath: filePath,
        code: code,
      });

      // 3. 결과 저장
      this.results.push(result);
      this.processedFiles.push({
        filePath: filePath,
        filename: filename,
        success: result.success,
        timestamp: new Date().toISOString(),
      });

      // 4. 결과 파일 저장
      const reportPath = path.join(
        this.outputDir,
        `${path.basename(filePath, path.extname(filePath))}-result.json`
      );
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

      console.log(`✅ 처리 완료: ${filename}`);
      if (result.report?.execution?.success) {
        console.log(`   실행 시간: ${result.report.execution.executionTime}ms`);
        console.log(`   메모리: ${result.report.execution.memoryUsage.toFixed(2)}MB`);
      }

      return result;
    } catch (error) {
      console.error(`❌ 처리 실패: ${filePath}`);
      console.error(`   에러: ${error.message}`);

      const result = {
        success: false,
        error: error.message,
        filePath: filePath,
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * 배치 처리
   */
  async batchProcess(patterns, postToNotion = true) {
    const filePaths = [];

    // 패턴 처리
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        // Glob 패턴
        const matches = glob.sync(pattern);
        filePaths.push(...matches);
      } else if (fs.statSync(pattern).isDirectory()) {
        // 디렉토리: 모든 JSON 파일 처리
        const files = fs.readdirSync(pattern)
          .filter(f => f.endsWith('.json'))
          .map(f => path.join(pattern, f));
        filePaths.push(...files);
      } else {
        // 단일 파일
        filePaths.push(pattern);
      }
    }

    // 중복 제거 및 정렬
    const uniquePaths = [...new Set(filePaths)].sort();

    console.log(`\n[NotionPoster] 배치 처리 시작`);
    console.log(`  총 파일 수: ${uniquePaths.length}`);
    console.log(`  Notion 발행: ${postToNotion ? '예' : '아니오'}`);
    console.log('');

    // 파일별 처리
    for (let i = 0; i < uniquePaths.length; i++) {
      const filePath = uniquePaths[i];
      console.log(`[${i + 1}/${uniquePaths.length}] 처리 중...`);
      await this.executeAndPost(filePath);

      // 배치 처리 간 딜레이
      if (i < uniquePaths.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 요약 보고서 생성
    await this.generateSummaryReport();

    return {
      processedCount: uniquePaths.length,
      successCount: this.results.filter(r => r.success).length,
      results: this.results,
    };
  }

  /**
   * 요약 보고서 생성 및 저장
   */
  async generateSummaryReport() {
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.length - successCount;

    const summary = {
      timestamp: new Date().toISOString(),
      totalProcessed: this.results.length,
      successful: successCount,
      failed: failureCount,
      successRate: ((successCount / this.results.length) * 100).toFixed(1),
      files: this.processedFiles,
      details: this.results.map(r => {
        if (!r.success) {
          return {
            filename: r.filePath?.split('/').pop() || 'Unknown',
            success: false,
            error: r.error,
          };
        }

        return {
          filename: r.report?.metadata?.filename || 'Unknown',
          success: r.success,
          compilation: r.report?.compilation?.success,
          execution: r.report?.execution?.success,
          executionTime: r.report?.execution?.executionTime || 0,
          memory: r.report?.execution?.memoryUsage || 0,
          output: r.report?.execution?.output?.slice(0, 3) || [], // 처음 3줄만
        };
      }),
    };

    // JSON 요약 저장
    const summaryPath = path.join(this.outputDir, 'batch-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📊 요약 저장: ${summaryPath}`);

    // Markdown 요약 생성 및 저장
    const markdownSummary = this.generateMarkdownSummary(summary);
    const mdPath = path.join(this.outputDir, 'BATCH_SUMMARY.md');
    fs.writeFileSync(mdPath, markdownSummary);
    console.log(`📝 마크다운 요약: ${mdPath}`);

    // Notion에 요약 발행
    if (this.notionIntegration.useRealNotionMCP && this.notionIntegration.dataSourceId) {
      console.log('\n📤 Notion에 요약 페이지 발행 중...');
      try {
        const summaryContent = `# CLAUDELang 자동 포스팅 배치 요약\n\n${markdownSummary}`;
        await this.notionIntegration.postToNotion(
          {
            title: `CLAUDELang 배치 요약 - ${new Date().toLocaleDateString('ko-KR')}`,
            properties: {
              '처리파일': summary.totalProcessed,
              '성공': summary.successful,
              '실패': summary.failed,
              '성공률': summary.successRate,
            },
          },
          summaryContent
        );
        console.log('✅ Notion 발행 완료');
      } catch (error) {
        console.error('❌ Notion 발행 실패:', error.message);
      }
    }

    return summary;
  }

  /**
   * Markdown 요약 생성
   */
  generateMarkdownSummary(summary) {
    const lines = [];

    lines.push(`## 처리 결과`);
    lines.push(`**처리 시간**: ${new Date(summary.timestamp).toLocaleString('ko-KR')}`);
    lines.push('');

    lines.push(`| 항목 | 값 |`);
    lines.push(`|-----|-----|`);
    lines.push(`| 총 파일 수 | ${summary.totalProcessed} |`);
    lines.push(`| 성공 | ${summary.successful} |`);
    lines.push(`| 실패 | ${summary.failed} |`);
    lines.push(`| 성공률 | ${summary.successRate}% |`);
    lines.push('');

    lines.push(`## 상세 결과`);
    lines.push(`| 파일명 | 상태 | 컴파일 | 실행 | 시간(ms) | 메모리(MB) |`);
    lines.push(`|--------|------|--------|------|---------|-----------|`);

    summary.details.forEach(d => {
      const status = d.success ? '✅' : '❌';
      const comp = d.compilation !== undefined ? (d.compilation ? '✅' : '❌') : '-';
      const exec = d.execution !== undefined ? (d.execution ? '✅' : '❌') : '-';
      const time = d.executionTime || '-';
      const mem = typeof d.memory === 'number' ? d.memory.toFixed(2) : '-';

      lines.push(`| ${d.filename} | ${status} | ${comp} | ${exec} | ${time} | ${mem} |`);
    });

    lines.push('');
    lines.push(`## 성능 분석`);

    const executionTimes = summary.details
      .filter(d => d.executionTime)
      .map(d => d.executionTime);

    if (executionTimes.length > 0) {
      const avgTime = (executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length).toFixed(2);
      lines.push(`- **평균 실행 시간**: ${avgTime}ms`);
    }

    const memoryUsage = summary.details
      .filter(d => d.memory)
      .map(d => d.memory);

    if (memoryUsage.length > 0) {
      const totalMem = memoryUsage.reduce((a, b) => a + b, 0).toFixed(2);
      lines.push(`- **총 메모리 사용**: ${totalMem}MB`);
    }

    return lines.join('\n');
  }

  /**
   * 결과 조회
   */
  getResults() {
    return {
      total: this.results.length,
      successful: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      results: this.results,
      processedFiles: this.processedFiles,
    };
  }
}

// CLI 실행
async function runCLI() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
CLAUDELang v6.0 Notion 자동 포스팅 CLI

사용법:
  node notion-poster.js batch <directory|pattern>  배치 처리
  node notion-poster.js post <file>                단일 파일 처리
  node notion-poster.js help                       도움말

환경 변수:
  NOTION_DATA_SOURCE_ID  Notion 데이터소스 ID

예시:
  node notion-poster.js batch ./examples
  node notion-poster.js post ./examples/simple.json
    `);
    process.exit(0);
  }

  const command = args[0];
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

  if (!dataSourceId && command !== 'help') {
    console.warn('⚠️  경고: NOTION_DATA_SOURCE_ID 환경 변수가 설정되지 않았습니다.');
    console.warn('   Notion 발행 기능이 비활성화됩니다.');
  }

  const poster = new NotionPoster({
    dataSourceId: dataSourceId,
    useRealNotionMCP: !!dataSourceId, // 데이터소스 ID가 있을 때만 활성화
  });

  try {
    switch (command) {
      case 'batch': {
        const pattern = args[1] || './examples';
        const patterns = [pattern];

        const result = await poster.batchProcess(patterns, !!dataSourceId);

        console.log(`\n${result.successCount}/${result.processedCount} 파일 처리 완료`);
        process.exit(result.successCount === result.processedCount ? 0 : 1);
        break;
      }

      case 'post': {
        const filePath = args[1];
        if (!filePath) {
          console.error('❌ 파일 경로를 지정해주세요');
          process.exit(1);
        }

        await poster.executeAndPost(filePath);
        process.exit(0);
        break;
      }

      case 'help':
      case '-h':
      case '--help': {
        console.log(`
CLAUDELang v6.0 Notion 자동 포스팅 CLI

명령어:
  batch <directory|pattern>  배치 처리 (디렉토리 또는 패턴)
  post <file>               단일 파일 처리
  help                      도움말 표시

옵션:
  --no-notion              Notion 발행 비활성화 (로컬 저장만)
  --output <dir>           출력 디렉토리 (기본값: ./auto-post-results)

환경 변수:
  NOTION_DATA_SOURCE_ID    Notion 데이터소스 ID (필수)

예시:
  # 전체 예제 배치 처리 (Notion 발행 포함)
  NOTION_DATA_SOURCE_ID=abc123 node notion-poster.js batch ./examples

  # 단일 파일 처리
  NOTION_DATA_SOURCE_ID=abc123 node notion-poster.js post ./examples/simple.json

  # Notion 발행 없이 로컬만 저장
  node notion-poster.js batch ./examples --no-notion
        `);
        process.exit(0);
        break;
      }

      default:
        console.error(`❌ 알 수 없는 명령: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 실행 오류: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotionPoster };
}

// CLI로 실행된 경우
if (require.main === module) {
  runCLI();
}
