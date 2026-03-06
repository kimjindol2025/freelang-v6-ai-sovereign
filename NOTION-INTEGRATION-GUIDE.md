# Notion MCP 통합 가이드

CLAUDELang v6.0 자동 포스팅 시스템을 Notion과 연동하는 완전한 가이드입니다.

## 1단계: Notion 데이터베이스 설정

### 1.1 Notion 페이지/데이터베이스 확인

FreeLang Marketing Team의 Notion 워크스페이스를 사용합니다:
- **URL**: https://www.notion.so/freelang-marketing
- **용도**: CLAUDELang 예제 실행 결과 저장

### 1.2 데이터베이스 ID 확인

#### 방법 1: URL에서 추출

```
https://www.notion.so/workspace/CLAUDELang-Results-f336d0bc-b841-465b-8045-024475c079dd
                                                        ↑
                               이 부분이 데이터베이스 ID (UUID)
```

#### 방법 2: Notion MCP fetch를 통해 확인

```bash
# Notion 페이지 정보 조회
claude fetch "https://www.notion.so/freelang-marketing"

# 또는 직접 ID로 조회
claude fetch "f336d0bc-b841-465b-8045-024475c079dd"
```

출력에서 다음 정보를 확인:

```
<database url="..." title="CLAUDELang Results">
  <data-source url="collection://f336d0bc-b841-465b-8045-024475c079dd">
    ...
  </data-source>
</database>
```

여기서:
- **데이터베이스 ID**: f336d0bc-b841-465b-8045-024475c079dd
- **데이터소스 ID (Collection ID)**: collection:// 뒤의 ID

**중요**: 실제 Notion MCP 호출 시에는 **데이터소스 ID** (collection://)을 사용합니다.

## 2단계: 환경 설정

### 방법 A: 환경 변수 설정 (권장)

```bash
# Linux/macOS
export NOTION_DATA_SOURCE_ID="f336d0bc-b841-465b-8045-024475c079dd"

# Windows PowerShell
$env:NOTION_DATA_SOURCE_ID="f336d0bc-b841-465b-8045-024475c079dd"

# 확인
echo $NOTION_DATA_SOURCE_ID
```

### 방법 B: .env 파일 사용

```bash
# .env 파일 생성
cat > .env << EOF
NOTION_DATA_SOURCE_ID=f336d0bc-b841-465b-8045-024475c079dd
EOF

# .env 로드
source .env
```

### 방법 C: Node.js 코드에서 직접 설정

```javascript
const { NotionPoster } = require('./src/notion-poster.js');

const poster = new NotionPoster({
  dataSourceId: 'f336d0bc-b841-465b-8045-024475c079dd',
  outputDir: './auto-post-results',
});
```

## 3단계: 기본 사용

### 단일 파일 포스팅

```bash
node src/notion-poster.js post ./examples/simple.json
```

**결과:**
- ✅ `simple.json` 실행
- ✅ Notion에 페이지 생성
- ✅ 결과를 `/auto-post-results/simple-result.json`에 저장

### 배치 포스팅

```bash
# 모든 예제 처리
node src/notion-poster.js batch ./examples

# 또는
node src/notion-poster.js batch ./examples/*.json
```

**결과:**
- ✅ 14개 예제 모두 실행
- ✅ 각각 Notion 페이지 생성
- ✅ 요약 보고서 생성:
  - `/auto-post-results/BATCH_SUMMARY.md`
  - `/auto-post-results/batch-summary.json`

## 4단계: Node.js API 사용

### 기본 사용법

```javascript
const { NotionPoster } = require('./src/notion-poster.js');

// 포스터 생성
const poster = new NotionPoster({
  dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
  outputDir: './my-results',
});

// 단일 파일 처리
await poster.executeAndPost('./examples/simple.json');

// 배치 처리
const result = await poster.batchProcess(['./examples']);

console.log(`성공: ${result.successCount}/${result.processedCount}`);
```

### 고급 옵션

```javascript
const poster = new NotionPoster({
  dataSourceId: 'collection://abc123...',
  outputDir: './custom-results',
  tags: ['#Production', '#AutoPost', '#v6.0'],
  useRealNotionMCP: true, // 실제 Notion 발행
});

// 결과 확인
const results = poster.getResults();
console.log(`
  총: ${results.total}
  성공: ${results.successful}
  실패: ${results.failed}
`);
```

## 5단계: Notion 데이터베이스 스키마

권장 데이터베이스 속성 설정:

```
Column Name         Type           Options
─────────────────────────────────────────────
Name                Title          (필수)
파일명              Text           -
실행시간            Date           -
컴파일상태          Select         [성공, 실패]
실행상태            Select         [성공, 실패]
실행시간ms          Number         -
메모리사용mb        Number         -
태그                Text           -
```

### Notion 데이터베이스 생성 (Claude Code)

```bash
# Claude Code를 통해 데이터베이스 생성
claude create database \
  --title "CLAUDELang Results" \
  --schema "CREATE TABLE (
    \"Name\" TITLE,
    \"파일명\" TEXT,
    \"실행시간\" DATE,
    \"컴파일상태\" SELECT('성공':green, '실패':red),
    \"실행상태\" SELECT('성공':green, '실패':red),
    \"실행시간ms\" NUMBER,
    \"메모리사용mb\" NUMBER,
    \"태그\" TEXT
  )"
```

## 6단계: 실제 사용 예제

### 예제 1: 주간 자동 포스팅

```bash
#!/bin/bash
# weekly-post.sh - 매주 월요일 자동 실행

export NOTION_DATA_SOURCE_ID="f336d0bc-b841-465b-8045-024475c079dd"

# 모든 예제 실행 및 포스팅
node /path/to/src/notion-poster.js batch ./examples

# 결과 알림 (선택사항)
if [ $? -eq 0 ]; then
  echo "✅ CLAUDELang 자동 포스팅 완료"
else
  echo "❌ CLAUDELang 자동 포스팅 실패"
fi
```

Cron 설정:
```bash
# 매주 월요일 09:00에 실행
0 9 * * 1 /path/to/weekly-post.sh
```

### 예제 2: 실시간 포스팅 (듀얼 모니터)

```javascript
// auto-post-server.js
const express = require('express');
const { NotionPoster } = require('./src/notion-poster.js');
const app = express();

const poster = new NotionPoster({
  dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
});

// POST /post - 파일 포스팅
app.post('/post', async (req, res) => {
  try {
    const filePath = req.body.filePath;
    const result = await poster.executeAndPost(filePath);

    res.json({
      success: result.success,
      message: result.success ? 'Posted to Notion' : result.error,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Auto-posting server running on http://localhost:3000');
});
```

사용:
```bash
curl -X POST http://localhost:3000/post \
  -H "Content-Type: application/json" \
  -d '{"filePath":"./examples/simple.json"}'
```

### 예제 3: 조건부 포스팅

```javascript
// selective-posting.js
const { NotionPoster } = require('./src/notion-poster.js');
const fs = require('fs');

const poster = new NotionPoster({
  dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
});

// 특정 파턴의 파일만 포스팅
const exampleDir = './examples';
const files = fs.readdirSync(exampleDir)
  .filter(f => f.startsWith('data-') && f.endsWith('.json'))
  .map(f => `${exampleDir}/${f}`);

await poster.batchProcess(files);
```

## 7단계: 모니터링 및 디버깅

### 로그 확인

```bash
# 배치 처리 로그 저장
node src/notion-poster.js batch ./examples > post.log 2>&1

# 로그 확인
tail -f post.log
```

### 결과 분석

```bash
# 요약 보고서 확인
cat auto-post-results/BATCH_SUMMARY.md

# JSON 통계 확인
cat auto-post-results/batch-summary.json | jq '.summary'
```

### 개별 결과 검토

```bash
# 특정 파일의 상세 결과
cat auto-post-results/simple-result.json | jq '.report.execution'

# Notion 페이지 데이터 확인
cat auto-post-results/simple-result.json | jq '.pageProperties'
```

## 8단계: 트러블슈팅

### 문제 1: "NOTION_DATA_SOURCE_ID가 설정되지 않음"

```bash
# 해결책
export NOTION_DATA_SOURCE_ID="your-data-source-id"
echo $NOTION_DATA_SOURCE_ID  # 확인
```

### 문제 2: Notion 연결 실패

```
❌ Notion 발행 실패: Connection refused
```

**원인**: Claude Code 환경이 아니거나 Notion MCP가 활성화되지 않음

**해결책**:
1. Claude Code CLI에서 실행하는지 확인
2. `claude auth` 확인
3. 로그 조회: `cat ~/.claude/debug/latest`

### 문제 3: 데이터소스 ID 오류

```
❌ Notion 발행 실패: Invalid data source ID format
```

**원인**: 올바른 형식 아님

**확인**:
```bash
# 올바른 형식
echo $NOTION_DATA_SOURCE_ID
# 출력: f336d0bc-b841-465b-8045-024475c079dd (UUID)

# 잘못된 형식
collection://f336d0bc-b841-465b-8045-024475c079dd  # ❌ collection:// 제거
https://notion.so/...                              # ❌ URL 사용 금지
```

### 문제 4: 로컬 저장은 되는데 Notion 발행 안됨

```
✅ 처리 완료
⚠️  테스트 모드: 실제 Notion 발행이 수행되지 않았습니다.
```

**해결책**:
```bash
# 환경 변수 설정 확인
echo $NOTION_DATA_SOURCE_ID

# useRealNotionMCP 옵션 확인 (기본값: true)
# Node.js: new NotionPoster({ dataSourceId, useRealNotionMCP: true })
```

## 9단계: 성능 최적화

### 배치 처리 최적화

```javascript
// 병렬 처리 (향후 지원)
const poster = new NotionPoster({
  dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
  concurrent: 5, // 동시 처리 (계획 중)
});
```

### 메모리 사용 최적화

```bash
# Node.js 메모리 제한 설정
NODE_OPTIONS=--max-old-space-size=2048 \
  node src/notion-poster.js batch ./examples
```

### 네트워크 최적화

```javascript
// 배치 간 딜레이 커스터마이징
const poster = new NotionPoster({
  dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
  delayBetweenBatches: 500, // ms (기본값: 1000)
});
```

## 10단계: FreeLang Marketing Team 통합

### 자동 팀 로깅

배치 처리 후 자동으로 기록:

```csv
# /ai-marketing-team/team-log.csv
2026-03-06 12:35:00,CLAUDELang Bot,Batch Post,14/15 Success,93.3%
```

### CMO 알림

```javascript
// CMO에게 완료 알림 (계획 중)
const summary = await poster.batchProcess(files);

sendMessageToCMO({
  title: 'CLAUDELang 자동 포스팅',
  body: `완료: ${summary.successCount}/${summary.processedCount}`,
  attachment: 'auto-post-results/BATCH_SUMMARY.md',
});
```

## 참고 자료

- [CLAUDELang 스펙](./CLAUDELANG_SPEC.md)
- [Notion 포스팅 가이드](./NOTION-POSTING.md)
- [예제 모음](./EXAMPLES.md)
- [FreeLang 마케팅 팀](../.claude/CLAUDE.md)
- [Notion MCP 문서](https://claude.ai/notion-mcp)

## 다음 단계

1. ✅ 환경 변수 설정
2. ✅ 배치 테스트 실행
3. ✅ Notion 결과 확인
4. ✅ Cron/스케줄러 설정
5. ✅ 자동화 완료!

---

**작성**: CLAUDELang 팀
**최종 업데이트**: 2026-03-06
**상태**: 프로덕션 준비 완료
