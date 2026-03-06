# CLAUDELang v6.0 Notion 자동 포스팅 가이드

CLAUDELang 예제를 실행하고 결과를 Notion에 자동으로 발행하는 시스템입니다.

## 개요

```
예제 파일 (JSON)
    ↓
CLAUDELang 컴파일
    ↓
VT 바이트코드 생성 & 실행
    ↓
실행 결과 수집
    ↓
Notion 페이지 자동 생성
    ↓
FreeLang Marketing Team에 기록
```

## 구성 요소

### 1. NotionIntegration 클래스 (`src/notion-integration.js`)

Notion MCP와의 통신을 담당하는 핵심 클래스

**주요 메서드:**
- `executeAndPost(claudelangCode, metadata)` - 단일 파일 실행 및 발행
- `batchExecuteAndPost(filePaths, dataSourceId)` - 배치 처리
- `buildNotionPageContent(report)` - Notion Markdown 생성
- `postToNotion(pageProperties, pageContent)` - 실제 Notion 발행

### 2. NotionPoster CLI (`src/notion-poster.js`)

명령줄 인터페이스로 배치 및 단일 파일 처리

**주요 기능:**
- 배치 처리 (디렉토리/패턴)
- 단일 파일 처리
- 요약 보고서 생성
- 로컬 저장 및 Notion 발행

## 사용 방법

### 환경 설정

#### 1단계: Notion 데이터소스 ID 확인

Notion 페이지/데이터베이스의 URL에서 ID 추출:
```
https://www.notion.so/workspace/Database-abc123def456
                                         ↑
                              이 부분이 데이터베이스 ID
```

또는 Notion MCP를 통해 데이터소스 ID 확인:
```bash
claude fetch https://notion.so/your-database-url
```

출력에서 `<data-source url="collection://abc123...">` 태그에서 ID 추출

#### 2단계: 환경 변수 설정

```bash
export NOTION_DATA_SOURCE_ID="your-data-source-id-here"
```

또는 `.env` 파일:
```
NOTION_DATA_SOURCE_ID=abc123def456...
```

### 사용 예제

#### 예제 1: 전체 예제 배치 처리

```bash
# 모든 예제 파일을 실행하고 Notion에 발행
NOTION_DATA_SOURCE_ID=abc123 node src/notion-poster.js batch ./examples
```

결과:
- 각 예제마다 Notion 페이지 생성
- `/auto-post-results/BATCH_SUMMARY.md` 요약 생성
- `/auto-post-results/batch-summary.json` 통계 저장

#### 예제 2: 단일 파일 처리

```bash
# 특정 예제 파일만 실행 및 발행
NOTION_DATA_SOURCE_ID=abc123 node src/notion-poster.js post ./examples/simple.json
```

결과:
- Notion에 `simple.json` 실행 결과 페이지 생성
- `/auto-post-results/simple-result.json` 저장

#### 예제 3: 로컬 저장만 (Notion 발행 없음)

```bash
# Notion 발행 없이 로컬에만 저장
node src/notion-poster.js batch ./examples
```

### Node.js 코드에서 사용

```javascript
const { NotionPoster } = require('./src/notion-poster.js');

// 포스터 생성
const poster = new NotionPoster({
  dataSourceId: 'your-data-source-id',
  outputDir: './my-results',
  tags: ['#CLAUDELang', '#Production'],
});

// 배치 처리
const result = await poster.batchProcess(['./examples']);

console.log(`성공: ${result.successCount}/${result.processedCount}`);
```

## Notion 페이지 구조

각 Notion 페이지는 다음 구조로 자동 생성됩니다:

```markdown
# CLAUDELang v6.0 실행 결과

## 요약
- 파일: simple.json
- 실행 시간: 2026-03-06 12:30:45
- 상태: ✅ 성공

## 성능 지표
| 항목 | 값 |
|-----|-----|
| 컴파일 | ✅ 성공 |
| 실행 | ✅ 성공 |
| 실행 시간 | 125ms |
| 메모리 사용 | 2.34MB |
| 명령어 수 | 45 |

## 실행 결과
```
Hello, CLAUDELang!
```

## VT 바이트코드
```lisp
(define message "Hello, CLAUDELang!")
(call print message)
... (축약)
```

## 원본 CLAUDELang 코드
```json
{
  "version": "6.0",
  "instructions": [
    ...
  ]
}
```

## 메타데이터
- 타임스탬프: 2026-03-06T12:30:45.123Z
- 처리 시간: 1234ms
- 태그: #CLAUDELang, #AutoPost, #v6.0
```

## 출력 파일 구조

```
auto-post-results/
├── simple-result.json              # 단일 결과
├── array-example-result.json       # 단일 결과
├── ...
├── BATCH_SUMMARY.md                # 배치 요약 (Markdown)
└── batch-summary.json              # 배치 요약 (JSON)
```

### BATCH_SUMMARY.md 예시

```markdown
## 처리 결과
**처리 시간**: 2026-03-06 12:35:00

| 항목 | 값 |
|-----|-----|
| 총 파일 수 | 15 |
| 성공 | 14 |
| 실패 | 1 |
| 성공률 | 93.3% |

## 상세 결과
| 파일명 | 상태 | 컴파일 | 실행 | 시간(ms) | 메모리(MB) |
|--------|------|--------|------|---------|-----------|
| simple.json | ✅ | ✅ | ✅ | 125 | 2.34 |
| array-example.json | ✅ | ✅ | ✅ | 156 | 3.12 |
| ...

## 성능 분석
- **평균 실행 시간**: 142.5ms
- **총 메모리 사용**: 45.67MB
```

## Notion 데이터베이스 스키마

권장 데이터베이스 속성:

```
Name (title)           문자열 - 페이지 제목
파일명                  문자열 - 원본 파일명
실행시간               날짜 - 실행 시각
컴파일상태             선택 - "성공", "실패"
실행상태               선택 - "성공", "실패"
실행시간ms             숫자 - 실행 시간 (밀리초)
메모리사용mb           숫자 - 메모리 사용 (MB)
태그                   문자열 - 태그 리스트
```

## 에러 처리

### 경우 1: 파일 읽기 실패

```
❌ 처리 실패: ./examples/nonexistent.json
   에러: 파일을 찾을 수 없음: ./examples/nonexistent.json
```

**해결책:** 파일 경로 확인

### 경우 2: 컴파일 오류

```
❌ 처리 실패: broken.json
   에러: Compilation error: Invalid instruction type
```

**해결책:** JSON 형식 및 CLAUDELang 문법 확인

### 경우 3: Notion 연결 실패

```
⚠️  경고: NOTION_DATA_SOURCE_ID 환경 변수가 설정되지 않았습니다.
   Notion 발행 기능이 비활성화됩니다.
```

**해결책:** 환경 변수 설정 필수

## 성능 최적화

### 배치 처리 시간 단축

1. **병렬 처리** (향후 지원)
   - 현재: 순차 처리 (파일당 1초 간격)
   - 계획: 동시 처리로 10배 이상 가속

2. **증분 처리**
   ```bash
   # 실패한 파일만 재처리
   node src/notion-poster.js batch ./examples --retry-failed
   ```

3. **선택적 발행**
   ```bash
   # 실행 성공한 것만 발행
   node src/notion-poster.js batch ./examples --success-only
   ```

## FreeLang Marketing Team 통합

### 자동 팀 로깅

배치 처리 시 자동으로 `/ai-marketing-team/team-log.csv`에 기록:

```csv
2026-03-06 12:35:00,CLAUDELang Bot,Batch Post,14/15 Success,93.3%
2026-03-06 12:35:00,CLAUDELang Bot,Notion Pages,15 created,Auto Posted
```

### CMO 보고서

모든 배치 처리 후 CMO에게 요약 알림:

```
CLAUDELang 자동 포스팅 완료
- 처리 파일: 15개
- 성공: 14개 (93.3%)
- Notion 페이지: 15개 생성
- 평균 실행 시간: 142.5ms

상세: /auto-post-results/BATCH_SUMMARY.md
```

## 트러블슈팅

### Q: Notion 페이지가 생성되지 않음

A: 다음을 확인하세요:
1. `NOTION_DATA_SOURCE_ID` 환경 변수 설정 확인
2. Notion MCP가 Claude Code 환경에서 활성화되었는지 확인
3. 데이터소스 ID가 정확한지 확인 (collection:// 형식)

### Q: 배치 처리가 너무 느림

A: 다음을 시도하세요:
1. 작은 파일부터 테스트
2. 로컬 저장만 하고 Notion 발행 비활성화
3. 병렬 처리 옵션 대기 (계획 중)

### Q: 일부 파일만 실패함

A: 다음을 확인하세요:
1. JSON 형식 검증 (linting)
2. CLAUDELang 문법 확인
3. `/auto-post-results/{filename}-result.json`에서 에러 메시지 확인

## 향후 계획

- [ ] 병렬 배치 처리 (동시성 제어)
- [ ] 증분 처리 (이미 발행된 파일 스킵)
- [ ] 웹훅 통지 (Slack/Discord)
- [ ] 스케줄링 (cron 통합)
- [ ] 성능 차트 (Notion 데이터베이스 활용)
- [ ] A/B 테스트 지원

## 참고 문서

- [CLAUDELang 스펙](./CLAUDELANG_SPEC.md)
- [컴파일러 설계](./COMPILER_DESIGN.md)
- [예제](./EXAMPLES.md)
- [Notion MCP 문서](https://notion.so/mcp)
- [FreeLang 마케팅 팀 헌장](../.claude/CLAUDE.md)
