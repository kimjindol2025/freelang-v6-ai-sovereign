#!/usr/bin/env node

/**
 * CLAUDELang v6.0 Notion 포스팅 테스트
 *
 * 이 스크립트는:
 * 1. 예제 파일들을 실행
 * 2. Notion 페이지 데이터 생성 (실제 발행 없음)
 * 3. 결과를 파일로 저장
 * 4. 요약 보고서 출력
 */

const fs = require('fs');
const path = require('path');
const { NotionIntegration } = require('./src/notion-integration.js');
const { AutoPoster } = require('./src/auto-post.js');

/**
 * 테스트 실행
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('CLAUDELang v6.0 Notion 포스팅 테스트');
  console.log('='.repeat(60));
  console.log('');

  // 테스트 설정
  const integration = new NotionIntegration({
    useRealNotionMCP: false, // 실제 발행 비활성화 (테스트 모드)
    tags: ['#CLAUDELang', '#Test', '#v6.0'],
  });

  const outputDir = './test-notion-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 예제 파일 목록
  const exampleDir = './examples';
  const exampleFiles = fs.readdirSync(exampleDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(exampleDir, f));

  console.log(`테스트할 예제: ${exampleFiles.length}개`);
  console.log('');

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // 각 예제 실행
  for (let i = 0; i < exampleFiles.length; i++) {
    const filePath = exampleFiles[i];
    const filename = path.basename(filePath);

    console.log(`[${i + 1}/${exampleFiles.length}] ${filename}`);

    try {
      const code = fs.readFileSync(filePath, 'utf-8');

      // Notion 발행 (테스트 모드)
      const result = await integration.executeAndPost(code, {
        filename: filename,
        filePath: filePath,
      });

      if (result.success) {
        console.log(`  ✅ 성공`);
        if (result.report?.execution) {
          console.log(`     실행 시간: ${result.report.execution.executionTime}ms`);
          console.log(`     메모리: ${result.report.execution.memoryUsage.toFixed(2)}MB`);
        }
        successCount++;
      } else {
        console.log(`  ❌ 실패: ${result.error}`);
        failureCount++;
      }

      // 결과 저장
      const resultPath = path.join(outputDir, `${path.basename(filePath, '.json')}-test.json`);
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

      results.push({
        filename: filename,
        success: result.success,
        report: result.report,
        pageProperties: result.pageProperties,
        pageContent: result.pageContent,
      });

      console.log('');
    } catch (error) {
      console.log(`  ❌ 에러: ${error.message}`);
      failureCount++;
    }
  }

  // 요약 보고서 생성
  console.log('='.repeat(60));
  console.log('테스트 결과 요약');
  console.log('='.repeat(60));
  console.log('');

  console.log(`총 테스트: ${exampleFiles.length}개`);
  console.log(`성공: ${successCount}개 (${((successCount / exampleFiles.length) * 100).toFixed(1)}%)`);
  console.log(`실패: ${failureCount}개`);
  console.log('');

  // 상세 성능 분석
  console.log('성능 분석:');
  console.log('-'.repeat(60));

  const executionTimes = results
    .filter(r => r.success && r.report?.execution)
    .map(r => r.report.execution.executionTime);

  if (executionTimes.length > 0) {
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);
    const minTime = Math.min(...executionTimes);

    console.log(`평균 실행 시간: ${avgTime.toFixed(2)}ms`);
    console.log(`최대 실행 시간: ${maxTime}ms (${results.find(r => r.report?.execution?.executionTime === maxTime)?.filename})`);
    console.log(`최소 실행 시간: ${minTime}ms (${results.find(r => r.report?.execution?.executionTime === minTime)?.filename})`);
  }

  const memoryUsages = results
    .filter(r => r.success && r.report?.execution)
    .map(r => r.report.execution.memoryUsage);

  if (memoryUsages.length > 0) {
    const totalMemory = memoryUsages.reduce((a, b) => a + b, 0);
    const avgMemory = totalMemory / memoryUsages.length;

    console.log(`총 메모리 사용: ${totalMemory.toFixed(2)}MB`);
    console.log(`평균 메모리 사용: ${avgMemory.toFixed(2)}MB`);
  }

  console.log('');

  // Notion 페이지 데이터 샘플 출력
  const sampleResult = results.find(r => r.success && r.pageProperties);
  if (sampleResult) {
    console.log('='.repeat(60));
    console.log('Notion 페이지 데이터 샘플 (테스트)');
    console.log('='.repeat(60));
    console.log('');

    console.log('파일: ' + sampleResult.filename);
    console.log('');

    console.log('페이지 속성:');
    console.log(JSON.stringify(sampleResult.pageProperties, null, 2));
    console.log('');

    console.log('페이지 콘텐츠 (축약):');
    const contentPreview = sampleResult.pageContent?.split('\n').slice(0, 20).join('\n');
    console.log(contentPreview);
    if (sampleResult.pageContent?.split('\n').length > 20) {
      console.log('... (축약됨)');
    }
    console.log('');
  }

  // 요약 파일 저장
  const summaryPath = path.join(outputDir, 'test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests: exampleFiles.length,
    successful: successCount,
    failed: failureCount,
    successRate: ((successCount / exampleFiles.length) * 100).toFixed(1),
    results: results.map(r => ({
      filename: r.filename,
      success: r.success,
      executionTime: r.report?.execution?.executionTime,
      memory: r.report?.execution?.memoryUsage,
    })),
  }, null, 2));

  console.log('='.repeat(60));
  console.log('테스트 완료');
  console.log('='.repeat(60));
  console.log('');
  console.log(`결과 저장 위치: ${outputDir}/`);
  console.log('');

  // 테스트 모드 알림
  console.log('⚠️  테스트 모드: 실제 Notion 발행이 수행되지 않았습니다.');
  console.log('');
  console.log('실제 Notion 발행을 위해서는:');
  console.log('  export NOTION_DATA_SOURCE_ID="your-data-source-id"');
  console.log('  node src/notion-poster.js batch ./examples');
  console.log('');
}

// 실행
runTests().catch(error => {
  console.error('❌ 테스트 실패:', error.message);
  console.error(error.stack);
  process.exit(1);
});
