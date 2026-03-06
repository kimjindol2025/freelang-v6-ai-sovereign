/**
 * CLAUDELang v6.0 - Notion 통합 모듈
 *
 * Notion MCP를 활용하여 자동 포스팅 결과를 Notion에 발행
 * FreeLang Marketing Team Notion 활용
 */

const { AutoPoster } = require('./auto-post.js');

/**
 * NotionIntegration 클래스
 * Notion MCP와의 통신을 담당
 */
class NotionIntegration {
  constructor(options = {}) {
    this.autoPoster = new AutoPoster(options.notionApiToken);
    this.notionDatabaseId = options.databaseId || null;
    this.pageTitle = options.pageTitle || 'CLAUDELang 실행 결과';
    this.tags = options.tags || ['CLAUDELang', 'AutoPost', 'v6.0'];
  }

  /**
   * CLAUDELang 코드 실행 및 Notion에 발행
   */
  async executeAndPost(claudelangCode, metadata = {}) {
    try {
      // 1. 코드 실행 및 보고서 생성
      const report = await this.autoPoster.run(claudelangCode, metadata);

      // 2. Notion 페이지 생성
      const notionPageData = this.buildNotionPage(report);

      console.log('[NotionIntegration] Notion 페이지 데이터:');
      console.log(JSON.stringify(notionPageData, null, 2));

      return {
        success: true,
        report: report,
        notionPageData: notionPageData,
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
   * Notion 페이지 데이터 구성
   * Notion MCP 형식으로 변환
   */
  buildNotionPage(report) {
    const { compilation, execution, metadata } = report;

    return {
      title: `CLAUDELang 실행: ${metadata.filename || '자동 실행'}`,
      content: this.buildPageContent(report),
      properties: {
        '파일명': metadata.filename || 'Unknown',
        '실행시간': new Date().toLocaleString('ko-KR'),
        '컴파일 상태': compilation.success ? '성공' : '실패',
        '실행 상태': execution.success ? '성공' : '실패',
        '태그': this.tags,
      },
      cover: {
        emoji: execution.success ? '✅' : '❌',
      },
    };
  }

  /**
   * Notion 페이지 콘텐츠 생성
   */
  buildPageContent(report) {
    const { compilation, execution, metadata } = report;

    const sections = [];

    // 요약 섹션
    sections.push({
      type: 'heading_2',
      content: '요약',
    });

    sections.push({
      type: 'paragraph',
      content: [
        {
          text: `파일: ${metadata.filename || 'Unknown'}`,
          bold: false,
        },
      ],
    });

    sections.push({
      type: 'table',
      rows: [
        ['항목', '상태'],
        ['컴파일', compilation.success ? '✅ 성공' : '❌ 실패'],
        ['실행', execution.success ? '✅ 성공' : '❌ 실패'],
        ['실행 시간', `${execution.executionTime}ms`],
        ['메모리 사용', `${execution.memoryUsage.toFixed(2)}MB`],
      ],
    });

    // 결과 섹션
    if (execution.output.length > 0) {
      sections.push({
        type: 'heading_2',
        content: '실행 결과',
      });

      sections.push({
        type: 'code',
        language: 'text',
        content: execution.output.join('\n'),
      });
    }

    // 에러 섹션
    if (compilation.errors.length > 0) {
      sections.push({
        type: 'heading_2',
        content: '컴파일 에러',
      });

      compilation.errors.forEach(error => {
        sections.push({
          type: 'paragraph',
          content: [
            {
              text: `❌ ${error}`,
              color: 'red',
            },
          ],
        });
      });
    }

    if (execution.error) {
      sections.push({
        type: 'paragraph',
        content: [
          {
            text: `❌ 실행 에러: ${execution.error}`,
            color: 'red',
          },
        ],
      });
    }

    // VT 코드 섹션
    if (compilation.code) {
      sections.push({
        type: 'heading_2',
        content: 'VT 바이트코드',
      });

      const vtCodePreview = compilation.code
        .split('\n')
        .slice(0, 15)
        .join('\n');

      sections.push({
        type: 'code',
        language: 'lisp',
        content: vtCodePreview,
      });
    }

    return sections;
  }

  /**
   * 배치 처리 및 Notion 발행
   */
  async batchExecuteAndPost(filePaths, databaseId = null) {
    const results = [];

    console.log(`[NotionIntegration] ${filePaths.length}개 파일 처리 시작...\n`);

    for (const filePath of filePaths) {
      try {
        const fs = require('fs');
        const code = fs.readFileSync(filePath, 'utf-8');
        const metadata = {
          filename: require('path').basename(filePath),
          filePath: filePath,
        };

        const result = await this.executeAndPost(code, metadata);
        results.push(result);
      } catch (error) {
        console.error(`[NotionIntegration] 파일 처리 실패: ${filePath}`, error.message);
      }
    }

    // 요약 보고서 생성
    const summary = this.generateSummary(results);

    return {
      results: results,
      summary: summary,
    };
  }

  /**
   * 요약 보고서 생성
   */
  generateSummary(results) {
    const successCount = results.filter(r => r.success && r.report.execution.success).length;
    const failureCount = results.length - successCount;

    return {
      totalFiles: results.length,
      successful: successCount,
      failed: failureCount,
      timestamp: new Date().toISOString(),
      details: results.map(r => ({
        filename: r.report?.metadata?.filename || 'Unknown',
        status: r.success ? (r.report.execution.success ? '성공' : '실패') : '에러',
        message: r.error || '정상 처리됨',
      })),
    };
  }

  /**
   * Notion에 요약 페이지 생성
   */
  buildSummaryPage(summary) {
    const sections = [];

    sections.push({
      type: 'heading_1',
      content: 'CLAUDELang 자동 포스팅 요약',
    });

    sections.push({
      type: 'paragraph',
      content: [
        {
          text: `처리 시간: ${summary.timestamp}`,
        },
      ],
    });

    sections.push({
      type: 'table',
      rows: [
        ['항목', '값'],
        ['총 파일 수', summary.totalFiles.toString()],
        ['성공', summary.successful.toString()],
        ['실패', summary.failed.toString()],
        ['성공률', `${((summary.successful / summary.totalFiles) * 100).toFixed(1)}%`],
      ],
    });

    sections.push({
      type: 'heading_2',
      content: '상세 결과',
    });

    sections.push({
      type: 'table',
      rows: [
        ['파일명', '상태', '메모'],
        ...summary.details.map(d => [
          d.filename,
          d.status,
          d.message,
        ]),
      ],
    });

    return {
      title: `CLAUDELang 자동 포스팅 - ${new Date().toLocaleDateString('ko-KR')}`,
      content: sections,
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

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NotionIntegration,
    autoPostToNotion,
  };
}
