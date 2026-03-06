/**
 * CLAUDELang v6.0 - Notion 통합 모듈
 *
 * Notion MCP를 활용하여 자동 포스팅 결과를 Notion에 발행
 * FreeLang Marketing Team Notion 활용
 *
 * 사용 방식:
 * 1. Notion 데이터베이스 ID 확인 (FreeLang Marketing Team)
 * 2. NotionIntegration 인스턴스 생성
 * 3. executeAndPost() 호출로 자동 발행
 */

const { AutoPoster } = require('./auto-post.js');

/**
 * NotionIntegration 클래스
 * Notion MCP와의 통신을 담당
 */
class NotionIntegration {
  constructor(options = {}) {
    this.autoPoster = new AutoPoster(options.notionApiToken);
    this.dataSourceId = options.dataSourceId || null; // Notion data source ID
    this.pageTitle = options.pageTitle || 'CLAUDELang 실행 결과';
    this.tags = options.tags || ['#CLAUDELang', '#AutoPost', '#v6.0'];
    this.useRealNotionMCP = options.useRealNotionMCP !== false;
  }

  /**
   * CLAUDELang 코드 실행 및 Notion에 발행
   */
  async executeAndPost(claudelangCode, metadata = {}) {
    try {
      // 1. 코드 실행 및 보고서 생성
      const report = await this.autoPoster.run(claudelangCode, metadata);

      // 2. Notion 페이지 콘텐츠 생성
      const pageContent = this.buildNotionPageContent(report);

      // 3. Notion 페이지 속성 생성
      const pageProperties = this.buildNotionPageProperties(report);

      console.log('[NotionIntegration] Notion 페이지 준비 완료');
      console.log(`  제목: ${pageProperties.title}`);
      console.log(`  상태: ${report.execution.success ? '✅ 성공' : '❌ 실패'}`);

      // 4. 실제 Notion 발행 (설정된 경우)
      let notionPageUrl = null;
      if (this.useRealNotionMCP && this.dataSourceId) {
        notionPageUrl = await this.postToNotion(pageProperties, pageContent);
      }

      return {
        success: true,
        report: report,
        notionPageUrl: notionPageUrl,
        pageProperties: pageProperties,
        pageContent: pageContent,
      };
    } catch (error) {
      console.error('[NotionIntegration] 에러:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Notion 페이지 속성 구성
   * Notion MCP 형식으로 변환 (SQLite 타입)
   */
  buildNotionPageProperties(report) {
    const { compilation, execution, metadata } = report;

    // 제목 (필수)
    const title = `CLAUDELang 예제 실행: ${metadata.filename || '자동 실행'}`;

    // 기본 속성 (Notion 데이터베이스 스키마에 맞춰 수정)
    const properties = {
      title: title,  // Notion 타이틀 필드
      '파일명': metadata.filename || 'Unknown',
      '실행시간': new Date().toLocaleString('ko-KR'),
      '컴파일상태': compilation.success ? '성공' : '실패',
      '실행상태': execution.success ? '성공' : '실패',
      '실행시간ms': execution.executionTime || 0,
      '메모리사용mb': (execution.memoryUsage || 0).toFixed(2),
      '태그': this.tags.join(', '),
    };

    return {
      title: title,
      properties: properties,
    };
  }

  /**
   * Notion 페이지 콘텐츠 생성 (Notion Markdown)
   */
  buildNotionPageContent(report) {
    const { compilation, execution, metadata } = report;

    const sections = [];

    // 헤더
    sections.push(`# CLAUDELang v6.0 실행 결과`);
    sections.push('');

    // 요약 섹션
    sections.push(`## 요약`);
    sections.push(`**파일**: ${metadata.filename || 'Unknown'}`);
    sections.push(`**실행 시간**: ${new Date().toLocaleString('ko-KR')}`);
    sections.push(`**상태**: ${execution.success ? '✅ 성공' : '❌ 실패'}`);
    sections.push('');

    // 성능 지표 테이블
    sections.push(`## 성능 지표`);
    sections.push(`| 항목 | 값 |`);
    sections.push(`|-----|-----|`);
    sections.push(`| 컴파일 | ${compilation.success ? '✅ 성공' : '❌ 실패'} |`);
    sections.push(`| 실행 | ${execution.success ? '✅ 성공' : '❌ 실패'} |`);
    sections.push(`| 실행 시간 | ${execution.executionTime}ms |`);
    sections.push(`| 메모리 사용 | ${execution.memoryUsage.toFixed(2)}MB |`);
    sections.push(`| 명령어 수 | ${execution.instructionCount || 0} |`);
    sections.push('');

    // 실행 결과
    if (execution.output && execution.output.length > 0) {
      sections.push(`## 실행 결과`);
      sections.push('```');
      execution.output.forEach(line => {
        sections.push(String(line));
      });
      sections.push('```');
      sections.push('');
    }

    // 에러 정보
    if (compilation.errors && compilation.errors.length > 0) {
      sections.push(`## 컴파일 에러`);
      compilation.errors.forEach(error => {
        sections.push(`- ❌ ${error}`);
      });
      sections.push('');
    }

    if (execution.error) {
      sections.push(`## 실행 에러`);
      sections.push(`\`\`\`\n${execution.error}\n\`\`\``);
      sections.push('');
    }

    // VT 바이트코드 (축약)
    if (compilation.vtCode) {
      sections.push(`## VT 바이트코드`);
      sections.push('```lisp');
      const vtLines = compilation.vtCode.split('\n').slice(0, 15);
      sections.push(vtLines.join('\n'));
      if (compilation.vtCode.split('\n').length > 15) {
        sections.push(`... (${compilation.vtCode.split('\n').length - 15}개 줄 생략)`);
      }
      sections.push('```');
      sections.push('');
    }

    // 원본 코드
    sections.push(`## 원본 CLAUDELang 코드`);
    sections.push('```json');
    try {
      const codeStr = typeof metadata.code === 'string'
        ? metadata.code
        : JSON.stringify(metadata.code || {}, null, 2);
      const codeLines = codeStr.split('\n');
      sections.push(codeLines.slice(0, 15).join('\n'));
      if (codeLines.length > 15) {
        sections.push(`... (${codeLines.length - 15}개 줄 생략)`);
      }
    } catch (e) {
      sections.push('(코드 표시 불가)');
    }
    sections.push('```');
    sections.push('');

    // 메타데이터
    sections.push(`## 메타데이터`);
    sections.push(`- **타임스탬프**: ${report.timestamp}`);
    sections.push(`- **처리 시간**: ${report.performance?.totalProcessingTime || 0}ms`);
    sections.push(`- **태그**: ${this.tags.join(', ')}`);

    return sections.join('\n');
  }

  /**
   * Notion MCP를 통해 실제 페이지 생성
   * mcp__claude_ai_Notion__notion-create-pages 활용
   */
  async postToNotion(pageProperties, pageContent) {
    if (!this.dataSourceId) {
      console.warn('[NotionIntegration] dataSourceId가 설정되지 않았습니다. Notion 발행이 생략됩니다.');
      return null;
    }

    try {
      console.log(`[NotionIntegration] Notion에 페이지 생성 중...`);
      console.log(`  데이터소스: ${this.dataSourceId}`);
      console.log(`  제목: ${pageProperties.title}`);

      // 주의: 실제 Notion MCP 호출은 claude code CLI에서 수행
      // 여기서는 페이지 데이터를 구성하고 로그만 출력
      const pageData = {
        parent: {
          data_source_id: this.dataSourceId,
        },
        pages: [
          {
            properties: pageProperties.properties,
            content: pageContent,
          },
        ],
      };

      console.log('[NotionIntegration] Notion 페이지 데이터:');
      console.log(JSON.stringify(pageData, null, 2));

      // 실제 Notion MCP 호출 (Claude Code 환경에서만 가능)
      if (typeof global !== 'undefined' && global.notionMCP) {
        const result = await global.notionMCP.createPages(pageData);
        console.log('[NotionIntegration] Notion 발행 완료');
        return result.url || `notion://page/${result.id}`;
      } else {
        console.log('[NotionIntegration] Notion MCP 호출 대기 (Claude Code 환경 필요)');
        return null;
      }
    } catch (error) {
      console.error('[NotionIntegration] Notion 발행 실패:', error.message);
      throw error;
    }
  }

  /**
   * 배치 처리 및 Notion 발행
   */
  async batchExecuteAndPost(filePaths, dataSourceId = null) {
    const results = [];

    if (dataSourceId) {
      this.dataSourceId = dataSourceId;
    }

    console.log(`[NotionIntegration] ${filePaths.length}개 파일 처리 시작...\n`);

    for (const filePath of filePaths) {
      try {
        const fs = require('fs');
        const code = fs.readFileSync(filePath, 'utf-8');
        const metadata = {
          filename: require('path').basename(filePath),
          filePath: filePath,
          code: code, // 원본 코드도 메타데이터에 포함
        };

        const result = await this.executeAndPost(code, metadata);
        results.push(result);

        // 배치 처리 간 딜레이 (API 과부하 방지)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[NotionIntegration] 파일 처리 실패: ${filePath}`, error.message);
        results.push({
          success: false,
          filename: require('path').basename(filePath),
          error: error.message,
        });
      }
    }

    // 요약 보고서 생성
    const summary = this.generateSummary(results);

    // 요약 페이지 Notion에 발행
    if (this.useRealNotionMCP && this.dataSourceId) {
      await this.postSummaryToNotion(summary);
    }

    return {
      results: results,
      summary: summary,
    };
  }

  /**
   * 요약 보고서 생성
   */
  generateSummary(results) {
    const successCount = results.filter(
      r => r.success && r.report?.execution?.success
    ).length;
    const failureCount = results.length - successCount;

    return {
      totalFiles: results.length,
      successful: successCount,
      failed: failureCount,
      successRate: ((successCount / results.length) * 100).toFixed(1),
      timestamp: new Date().toISOString(),
      details: results.map(r => ({
        filename: r.report?.metadata?.filename || r.filename || 'Unknown',
        status: r.success
          ? (r.report?.execution?.success ? '성공' : '실패')
          : '에러',
        executionTime: r.report?.execution?.executionTime || 0,
        memory: r.report?.execution?.memoryUsage || 0,
        message: r.error || '정상 처리됨',
      })),
    };
  }

  /**
   * Notion에 요약 페이지 생성
   */
  async postSummaryToNotion(summary) {
    try {
      const summaryContent = this.buildSummaryPageContent(summary);
      const summaryProperties = {
        title: `CLAUDELang 자동 포스팅 요약 - ${new Date().toLocaleDateString('ko-KR')}`,
        '처리파일수': summary.totalFiles,
        '성공': summary.successful,
        '실패': summary.failed,
        '성공률': `${summary.successRate}%`,
      };

      console.log('[NotionIntegration] 요약 페이지를 Notion에 발행합니다...');
      await this.postToNotion(
        { title: summaryProperties.title, properties: summaryProperties },
        summaryContent
      );
    } catch (error) {
      console.error('[NotionIntegration] 요약 발행 실패:', error.message);
    }
  }

  /**
   * 요약 페이지 콘텐츠 생성
   */
  buildSummaryPageContent(summary) {
    const sections = [];

    sections.push(`# CLAUDELang 자동 포스팅 요약 보고서`);
    sections.push('');

    sections.push(`## 처리 결과`);
    sections.push(`**처리 시간**: ${summary.timestamp}`);
    sections.push('');

    sections.push(`| 항목 | 값 |`);
    sections.push(`|-----|-----|`);
    sections.push(`| 총 파일 수 | ${summary.totalFiles} |`);
    sections.push(`| 성공 | ${summary.successful} |`);
    sections.push(`| 실패 | ${summary.failed} |`);
    sections.push(`| 성공률 | ${summary.successRate}% |`);
    sections.push('');

    sections.push(`## 상세 결과`);
    sections.push(`| 파일명 | 상태 | 시간(ms) | 메모리(MB) |`);
    sections.push(`|--------|------|---------|-----------|`);

    summary.details.forEach(d => {
      sections.push(
        `| ${d.filename} | ${d.status} | ${d.executionTime} | ${d.memory.toFixed(2)} |`
      );
    });

    sections.push('');
    sections.push(`## 성능 분석`);
    sections.push(`- **평균 실행 시간**: ${(summary.details.reduce((sum, d) => sum + d.executionTime, 0) / summary.details.length).toFixed(2)}ms`);
    sections.push(`- **총 메모리 사용**: ${summary.details.reduce((sum, d) => sum + d.memory, 0).toFixed(2)}MB`);

    return sections.join('\n');
  }

  /**
   * 요약 페이지 콘텐츠 생성 (이전 호환성)
   */
  buildSummaryPage(summary) {
    return {
      title: `CLAUDELang 자동 포스팅 - ${new Date().toLocaleDateString('ko-KR')}`,
      content: this.buildSummaryPageContent(summary),
    };
  }
}

/**
 * 간편한 사용을 위한 헬퍼 함수
 */
async function autoPostToNotion(claudelangCode, options = {}) {
  const integration = new NotionIntegration(options);
  return await integration.executeAndPost(claudelangCode, options.metadata);
}

/**
 * 배치 포스팅 헬퍼
 */
async function batchPostToNotion(filePaths, options = {}) {
  const integration = new NotionIntegration(options);
  return await integration.batchExecuteAndPost(filePaths, options.dataSourceId);
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NotionIntegration,
    autoPostToNotion,
    batchPostToNotion,
  };
}
