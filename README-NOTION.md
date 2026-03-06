# CLAUDELang v6.0 Notion 자동 포스팅 시스템

CLAUDELang 예제를 자동으로 실행하고 결과를 Notion에 발행하는 완전한 시스템입니다.

## 개요

```
CLAUDELang 코드 (JSON)
        ↓
    컴파일 (VT 바이트코드)
        ↓
    실행 (시뮬레이션)
        ↓
    결과 수집
        ↓
    Notion 페이지 자동 생성
        ↓
    FreeLang Marketing Team에 기록
```

## 핵심 파일

### 1. 메인 모듈

| 파일 | 설명 |
|------|------|
| `src/notion-integration.js` | Notion MCP 통합 (14KB) |
| `src/notion-poster.js` | CLI 및 배치 처리 (13KB) |
| `src/auto-post.js` | 컴파일/실행 엔진 |
| `src/compiler.js` | CLAUDELang 컴파일러 |

### 2. 테스트 및 문서

| 파일 | 설명 |
|------|------|
| `test-notion-posting.js` | 통합 테스트 (100% 성공) |
| `NOTION-POSTING.md` | 상세 포스팅 가이드 |
| `NOTION-INTEGRATION-GUIDE.md` | Notion MCP 통합 가이드 |
| `QUICKSTART.md` | 5분 빠른 시작 |

## 빠른 시작

### 1단계: 테스트

```bash
node test-notion-posting.js
```

결과: 14개 예제 모두 성공 (100.0%)

### 2단계: 환경 설정

```bash
export NOTION_DATA_SOURCE_ID="your-data-source-id"
```

### 3단계: 포스팅

```bash
# 배치 처리 (모든 예제)
node src/notion-poster.js batch ./examples

# 단일 파일
node src/notion-poster.js post ./examples/simple.json
```

## 주요 기능

### NotionIntegration 클래스

```javascript
const { NotionIntegration } = require('./src/notion-integration.js');

// 포스터 생성
const integration = new NotionIntegration({
  dataSourceId: 'your-data-source-id',
  tags: ['#CLAUDELang', '#AutoPost'],
});

// 단일 파일 실행 및 발행
const result = await integration.executeAndPost(code, metadata);

// 배치 처리
const summary = await integration.batchExecuteAndPost(filePaths);
```

### NotionPoster CLI

```bash
# 배치 처리
node src/notion-poster.js batch ./examples

# 단일 파일
node src/notion-poster.js post ./examples/simple.json

# 도움말
node src/notion-poster.js help
```

## 출력 결과

### Notion 페이지 구조

각 페이지는 다음을 포함합니다:
- 실행 결과 (출력값)
- VT 바이트코드
- 성능 지표 (시간, 메모리)
- 원본 코드
- 메타데이터

### 로컬 저장

```
auto-post-results/
├── simple-result.json          # 단일 결과
├── array-example-result.json
├── ...
├── BATCH_SUMMARY.md            # 배치 요약 (Markdown)
└── batch-summary.json          # 배치 통계 (JSON)
```

## 테스트 결과

```
============================================================
테스트 결과 요약
============================================================

총 테스트: 14개
성공: 14개 (100.0%)
실패: 0개

성능 분석:
평균 실행 시간: 0.43ms
최대 실행 시간: 2ms
최소 실행 시간: 0ms
```

## 설정

### Notion 데이터소스 ID 확인

```bash
# Notion URL에서 추출
https://www.notion.so/.../CLAUDELang-abc123def456
                                        ↑
                        데이터소스 ID 복사

# 또는 Claude Code에서
claude fetch "https://www.notion.so/your-page"
# <data-source url="collection://abc123"/> 에서 ID 추출
```

### 환경 변수 설정

```bash
# 터미널에서
export NOTION_DATA_SOURCE_ID="your-id"

# 또는 .env 파일
echo "NOTION_DATA_SOURCE_ID=your-id" > .env
source .env
```

## Notion 데이터베이스 속성

권장 구조:

```
Name (title)           페이지 제목
파일명                 원본 파일
실행시간              실행 일시
컴파일상태            성공/실패
실행상태              성공/실패
실행시간ms            실행 시간 (ms)
메모리사용mb          메모리 (MB)
태그                  포스팅 태그
```

## API 사용 예제

### 기본 사용

```javascript
const { NotionPoster } = require('./src/notion-poster.js');

const poster = new NotionPoster({
  dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
});

// 배치 처리
const result = await poster.batchProcess(['./examples']);
console.log(`성공: ${result.successCount}/${result.processedCount}`);
```

### 커스텀 설정

```javascript
const poster = new NotionPoster({
  dataSourceId: 'your-id',
  outputDir: './custom-results',
  tags: ['#Production'],
  useRealNotionMCP: true,
});

// 결과 확인
const results = poster.getResults();
console.log(results);
```

## 자동화

### Cron 스케줄 (매주 월요일)

```bash
# crontab 편집
crontab -e

# 다음 라인 추가 (매주 월요일 09:00)
0 9 * * 1 /path/to/src/notion-poster.js batch /path/to/examples
```

### CI/CD 통합

```bash
# GitHub Actions
- name: CLAUDELang Auto-Post
  env:
    NOTION_DATA_SOURCE_ID: ${{ secrets.NOTION_DATA_SOURCE_ID }}
  run: node src/notion-poster.js batch ./examples
```

## 트러블슈팅

### 문제 1: Notion 발행 안됨

```bash
# 확인 사항
echo $NOTION_DATA_SOURCE_ID
echo $NOTION_DATA_SOURCE_ID | wc -c  # 반드시 36자 (UUID)
```

### 문제 2: 파일 처리 실패

```bash
# 파일 경로 확인
ls examples/your-file.json

# 권한 확인
chmod +x src/notion-poster.js
```

### 문제 3: 느린 처리 속도

```bash
# 로컬 저장만 (Notion 발행 비활성화)
unset NOTION_DATA_SOURCE_ID
node src/notion-poster.js batch ./examples
```

## 성능

- **컴파일 시간**: 0-2ms
- **실행 시간**: 0-2ms
- **메모리 사용**: <1MB
- **배치 처리**: 14개 파일 ~20초

## 다음 단계

1. **빠른 시작**: [QUICKSTART.md](./QUICKSTART.md) 읽기
2. **상세 설명**: [NOTION-POSTING.md](./NOTION-POSTING.md) 참고
3. **통합 가이드**: [NOTION-INTEGRATION-GUIDE.md](./NOTION-INTEGRATION-GUIDE.md) 학습
4. **자동화**: Cron/CI-CD 설정
5. **모니터링**: 로그 수집 및 분석

## 지원되는 기능

- ✅ 단일 파일 실행 및 발행
- ✅ 배치 처리 (모든 예제)
- ✅ Notion MCP 통합
- ✅ 요약 보고서 생성
- ✅ 로컬 파일 저장
- ✅ CLI 인터페이스
- ✅ Node.js API

## 계획된 기능

- [ ] 병렬 배치 처리
- [ ] 증분 처리 (이미 발행된 파일 스킵)
- [ ] 웹훅 통지 (Slack/Discord)
- [ ] 성능 차트 (Notion 데이터베이스)
- [ ] A/B 테스트 지원
- [ ] 스케줄링 UI

## 참고 문서

- [CLAUDELang 스펙](./CLAUDELANG_SPEC.md)
- [컴파일러 설계](./COMPILER_DESIGN.md)
- [예제 모음](./EXAMPLES.md)
- [Notion MCP 문서](https://claude.ai/notion-mcp)
- [FreeLang 마케팅 팀](../.claude/CLAUDE.md)

## 라이선스

MIT License

## 문의

CLAUDELang v6.0 팀
