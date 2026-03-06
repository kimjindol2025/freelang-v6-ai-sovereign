#!/usr/bin/env node

/**
 * CLAUDELang v6.0 자동 포스팅 CLI
 * 명령줄에서 자동 포스팅 시스템 실행
 */

const fs = require('fs');
const path = require('path');
const { AutoPoster } = require('./auto-post.js');

class AutoPostCLI {
  constructor() {
    this.autoPoster = new AutoPoster();
    this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.showHelp();
      process.exit(0);
    }

    const command = args[0];

    switch (command) {
      case 'run':
        this.handleRun(args.slice(1));
        break;
      case 'batch':
        this.handleBatch(args.slice(1));
        break;
      case 'examples':
        this.handleExamples();
        break;
      case 'help':
      case '-h':
      case '--help':
        this.showHelp();
        break;
      default:
        console.error(`알 수 없는 명령: ${command}`);
        this.showHelp();
        process.exit(1);
    }
  }

  /**
   * 단일 파일 실행
   */
  async handleRun(args) {
    if (args.length === 0) {
      console.error('파일 경로를 지정하세요');
      process.exit(1);
    }

    const filePath = args[0];
    const outputDir = args[1] || './auto-post-results';

    if (!fs.existsSync(filePath)) {
      console.error(`파일을 찾을 수 없습니다: ${filePath}`);
      process.exit(1);
    }

    try {
      console.log(`\n[CLAUDELang AutoPoster] 파일 처리 중: ${filePath}\n`);

      const code = fs.readFileSync(filePath, 'utf-8');
      const metadata = {
        filename: path.basename(filePath),
        filePath: filePath,
      };

      const result = await this.autoPoster.run(code, metadata);

      // 결과 디렉토리 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // JSON 결과 저장
      const resultPath = path.join(
        outputDir,
        `${path.basename(filePath, path.extname(filePath))}-result.json`
      );
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

      // Markdown 결과 저장
      const markdownPath = path.join(
        outputDir,
        `${path.basename(filePath, path.extname(filePath))}-report.md`
      );
      fs.writeFileSync(markdownPath, result.markdown);

      console.log('\n════════════════════════════════════════════');
      console.log('처리 완료!');
      console.log('════════════════════════════════════════════\n');
      console.log(`컴파일: ${result.compilation.success ? '✅ 성공' : '❌ 실패'}`);
      console.log(`실행: ${result.execution.success ? '✅ 성공' : '❌ 실패'}`);

      if (result.execution.executionTime !== undefined) {
        console.log(`실행 시간: ${result.execution.executionTime}ms`);
      }
      if (result.execution.memoryUsage !== undefined) {
        console.log(`메모리 사용: ${result.execution.memoryUsage.toFixed(2)}MB`);
      }

      console.log(`\n결과 저장:`);
      console.log(`  - JSON: ${resultPath}`);
      console.log(`  - Markdown: ${markdownPath}\n`);

      if (result.execution.output && result.execution.output.length > 0) {
        console.log('출력 결과:');
        console.log('─────────────────────────────────────────');
        result.execution.output.forEach(line => {
          console.log(`  ${line}`);
        });
        console.log('─────────────────────────────────────────\n');
      }

      if (result.execution.error) {
        console.log('에러 메시지:');
        console.log('─────────────────────────────────────────');
        console.log(`  ${result.execution.error}`);
        console.log('─────────────────────────────────────────\n');
      }

      if (result.compilation.errors && result.compilation.errors.length > 0) {
        console.log('컴파일 에러:');
        console.log('─────────────────────────────────────────');
        result.compilation.errors.forEach(err => {
          console.log(`  ${err}`);
        });
        console.log('─────────────────────────────────────────\n');
      }
    } catch (error) {
      console.error(`에러: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 배치 처리 (여러 파일)
   */
  async handleBatch(args) {
    const pattern = args[0] || './examples/**/*.json';
    const outputDir = args[1] || './auto-post-results';

    console.log(`\n[CLAUDELang AutoPoster] 배치 처리 시작: ${pattern}\n`);

    try {
      // 파일 목록 수집
      const files = this.findFiles(pattern);

      if (files.length === 0) {
        console.error(`일치하는 파일을 찾을 수 없습니다: ${pattern}`);
        process.exit(1);
      }

      console.log(`발견된 파일: ${files.length}개\n`);

      const results = await this.autoPoster.runBatch(files, outputDir);

      console.log('\n════════════════════════════════════════════');
      console.log('배치 처리 완료!');
      console.log('════════════════════════════════════════════\n');
      console.log(`처리된 파일: ${results.length}개`);
      console.log(`성공: ${results.filter(r => r.execution.success).length}개`);
      console.log(`실패: ${results.filter(r => !r.execution.success).length}개\n`);
    } catch (error) {
      console.error(`에러: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 예제 파일 처리
   */
  async handleExamples() {
    console.log(`\n[CLAUDELang AutoPoster] 예제 실행\n`);

    const examplesDir = path.join(__dirname, '../examples');

    if (!fs.existsSync(examplesDir)) {
      console.error(`예제 디렉토리를 찾을 수 없습니다: ${examplesDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(examplesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(examplesDir, f));

    if (files.length === 0) {
      console.error('예제 파일을 찾을 수 없습니다');
      process.exit(1);
    }

    const outputDir = './auto-post-results/examples';
    const results = await this.autoPoster.runBatch(files, outputDir);

    console.log('\n예제 처리 완료!\n');
  }

  /**
   * 파일 찾기 (glob 패턴)
   */
  findFiles(pattern) {
    const parts = pattern.split('**/');
    let baseDir = parts[0];

    if (!fs.existsSync(baseDir)) {
      baseDir = './';
    }

    const results = [];
    this.walkDir(baseDir, results, pattern.includes('**'));

    return results.filter(f => f.endsWith('.json'));
  }

  /**
   * 디렉토리 순회
   */
  walkDir(dir, results, recursive = false) {
    try {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile() && file.endsWith('.json')) {
          results.push(fullPath);
        } else if (stat.isDirectory() && recursive) {
          this.walkDir(fullPath, results, recursive);
        }
      });
    } catch (error) {
      // 디렉토리 접근 불가
    }
  }

  /**
   * 도움말 출력
   */
  showHelp() {
    const help = `
╔══════════════════════════════════════════════════════════════╗
║     CLAUDELang v6.0 자동 포스팅 시스템 (AutoPoster CLI)     ║
╚══════════════════════════════════════════════════════════════╝

사용법:
  auto-post-cli <command> [options]

명령어:

  run <file> [outputDir]
    단일 CLAUDELang 파일 컴파일 및 실행

    예시:
      auto-post-cli run examples/simple.json
      auto-post-cli run code.json ./results

  batch [pattern] [outputDir]
    여러 CLAUDELang 파일 배치 처리

    예시:
      auto-post-cli batch "./examples/**/*.json"
      auto-post-cli batch "./src/**/*.json" "./output"

  examples
    예제 디렉토리의 모든 파일 처리

    예시:
      auto-post-cli examples

  help, -h, --help
    도움말 표시

옵션:

  outputDir (선택사항)
    결과가 저장될 디렉토리
    기본값: ./auto-post-results

출력:

  - JSON 형식: 상세 실행 결과
  - Markdown 형식: Notion 발행용 보고서
  - summary.json: 배치 처리 요약

예제:

  1. 단일 파일 실행:
     $ auto-post-cli run examples/simple.json

  2. 모든 예제 처리:
     $ auto-post-cli examples

  3. 커스텀 디렉토리 배치 처리:
     $ auto-post-cli batch "./test/**/*.json" "./reports"

════════════════════════════════════════════════════════════════
프로젝트: https://github.com/your-org/freelang-v6
문서: https://github.com/your-org/freelang-v6/docs
════════════════════════════════════════════════════════════════
`;
    console.log(help);
  }
}

// CLI 실행
if (require.main === module) {
  new AutoPostCLI();
}

module.exports = AutoPostCLI;
