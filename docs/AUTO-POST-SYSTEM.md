# CLAUDELang v6.0 자동 포스팅 시스템 문서

## 개요

CLAUDELang v6.0 자동 포스팅 시스템은 Claude가 생성한 CLAUDELang 코드를 자동으로 컴파일하고 실행하며, 결과를 Notion에 발행하는 완전 자동화 파이프라인입니다.

### 핵심 기능

1. **자동 컴파일**: CLAUDELang JSON → VT 바이트코드
2. **VT 시뮬레이션**: 컴파일된 코드를 가상 머신에서 실행
3. **결과 분석**: 성공/실패, 성능 지표 수집
4. **Notion 자동 발행**: Notion MCP를 통한 결과 포스팅
5. **보고서 생성**: JSON/Markdown 형식의 상세 보고서
6. **배치 처리**: 여러 파일을 한 번에 자동 처리

---

## 아키텍처

```
┌────────────────────────────────────────────────────────────┐
│                  CLAUDELang 코드                            │
│  (Claude가 생성 또는 사용자 제공)                          │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  1. 컴파일      │ (compiler.js)
        │ (검증→타입→VT)  │
        └────────┬────────┘
                 │ ✅ 성공 / ❌ 실패
                 ▼
        ┌─────────────────────┐
        │ 2. VT 실행          │ (auto-post.js)
        │ (시뮬레이션)        │
        └────────┬────────────┘
                 │ 출력/에러
                 ▼
        ┌──────────────────────────┐
        │ 3. 결과 분석             │
        │ (성능, 메모리, 시간)     │
        └────────┬─────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 4. 보고서 생성                  │
    │ (JSON, Markdown)                │
    └────────┬───────────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │ 5. Notion 발행          │ (notion-integration.js)
    │ (MCP 활용)              │
    └─────────────────────────┘
```

---

## 주요 모듈

### 1. AutoPoster (`src/auto-post.js`)

메인 자동 포스팅 클래스

#### 주요 메서드

```javascript
// 단일 코드 실행
await autoPoster.run(claudelangCode, metadata);

// 배치 처리
await autoPoster.runBatch(filePaths, outputDir);

// 결과 저장
autoPoster.saveResults(outputDir);

// 결과 조회
autoPoster.getResults();
```

#### 반환 형식

```javascript
{
  timestamp: "2026-03-06T10:30:00.000Z",
  metadata: {
    filename: "simple.json",
    filePath: "/path/to/file"
  },
  compilation: {
    success: true,
    vtCode: "(define x 42)...",
    errors: [],
    vtCodeLength: 256
  },
  execution: {
    success: true,
    output: ["Hello, World!"],
    error: null,
    executionTime: 5,
    memoryUsage: 0.12,
    instructionCount: 3
  },
  performance: {
    totalProcessingTime: 45
  },
  markdown: "# CLAUDELang v6.0..."
}
```

### 2. VirtualMachine (`src/auto-post.js`)

VT 바이트코드 시뮬레이션 환경

#### 내장 함수

| 함수 | 설명 | 예 |
|------|------|-----|
| `print` | 값 출력 | `(call print "Hello")` |
| `HTTP.get` | HTTP GET 요청 (시뮬레이션) | `(call HTTP.get "url")` |
| `String.upper` | 대문자 변환 | `(call String.upper "hello")` |
| `String.lower` | 소문자 변환 | `(call String.lower "HELLO")` |
| `Math.sqrt` | 제곱근 | `(call Math.sqrt 16)` |
| `Array.map` | 배열 맵핑 (시뮬레이션) | - |

### 3. NotionIntegration (`src/notion-integration.js`)

Notion MCP와의 통합

#### 사용법

```javascript
const integration = new NotionIntegration({
  databaseId: "notion-database-id",
  tags: ["CLAUDELang", "AutoPost"]
});

const result = await integration.executeAndPost(code);
```

### 4. AutoPostCLI (`src/auto-post-cli.js`)

명령줄 인터페이스

#### 명령어

```bash
# 단일 파일 실행
node src/auto-post-cli.js run examples/simple.json

# 배치 처리
node src/auto-post-cli.js batch "./examples/**/*.json"

# 예제 실행
node src/auto-post-cli.js examples

# 도움말
node src/auto-post-cli.js help
```

---

## 사용 방법

### 기본 사용 (Node.js)

```javascript
const { AutoPoster } = require('./src/auto-post.js');

const autoPoster = new AutoPoster();

// CLAUDELang 코드 (JSON)
const code = {
  version: "6.0",
  instructions: [
    {
      type: "var",
      name: "message",
      value_type: "string",
      value: "Hello, CLAUDELang!"
    },
    {
      type: "call",
      function: "print",
      args: [{ type: "ref", name: "message" }]
    }
  ]
};

// 실행 및 보고서 생성
const result = await autoPoster.run(
  JSON.stringify(code),
  { filename: "my-code.json" }
);

console.log(result.markdown); // Notion 발행용 마크다운
```

### CLI 사용

```bash
# 예제 파일 실행
node src/auto-post-cli.js run examples/simple.json

# 모든 예제 처리
node src/auto-post-cli.js examples

# 커스텀 디렉토리 배치 처리
node src/auto-post-cli.js batch "./my-files/**/*.json" "./results"
```

### Notion 통합

```javascript
const { NotionIntegration } = require('./src/notion-integration.js');

const integration = new NotionIntegration({
  databaseId: "your-notion-db-id",
  pageTitle: "CLAUDELang 실행 결과",
  tags: ["CLAUDELang", "AutoPost", "v6.0"]
});

// 실행 및 Notion 발행
const result = await integration.executeAndPost(code, {
  filename: "example.json"
});

console.log(result.notionPageData);
```

---

## 출력 파일 형식

### 1. JSON 보고서 (`*-result.json`)

```json
{
  "timestamp": "2026-03-06T10:30:00.000Z",
  "metadata": {
    "filename": "simple.json"
  },
  "compilation": {
    "success": true,
    "vtCode": "..."
  },
  "execution": {
    "success": true,
    "output": ["Hello!"]
  }
}
```

### 2. Markdown 보고서 (`*-report.md`)

자동 생성된 Notion 발행용 마크다운 형식

```markdown
# CLAUDELang v6.0 자동 실행 결과

**파일**: simple.json
**실행 시간**: 2026년 3월 6일...

## 1. 컴파일 결과
- **상태**: ✅ 성공
...
```

### 3. 배치 요약 (`summary.json`)

```json
{
  "totalFiles": 5,
  "successfulCompilations": 5,
  "successfulExecutions": 5,
  "averageExecutionTime": 3.2,
  "totalMemoryUsage": 0.85,
  "results": [...]
}
```

---

## 성능 지표

### 수집 항목

| 항목 | 설명 | 단위 |
|------|------|------|
| `executionTime` | VT 코드 실행 시간 | ms |
| `memoryUsage` | 힙 메모리 증가량 | MB |
| `instructionCount` | 실행된 명령어 수 | 개 |
| `totalProcessingTime` | 전체 처리 시간 | ms |

### 예

```javascript
{
  executionTime: 5,        // 5ms
  memoryUsage: 0.12,       // 0.12MB
  instructionCount: 3,     // 3개 명령어
  totalProcessingTime: 45  // 전체 45ms
}
```

---

## 에러 처리

### 컴파일 에러

```javascript
{
  compilation: {
    success: false,
    errors: ["Missing 'version' field"],
    code: null
  }
}
```

### 실행 에러

```javascript
{
  execution: {
    success: false,
    error: "Unknown function: CustomFunc",
    output: []
  }
}
```

---

## FreeLang Marketing Team 통합

### Notion 데이터베이스 설정

```javascript
const integration = new NotionIntegration({
  databaseId: "freelang-marketing-db-id",
  tags: ["CLAUDELang", "마케팅", "자동발행"]
});
```

### 팀 로그 기록 (`team-log.csv`)

```csv
[시간],[에이전트],[활동],[결과],[KPI]
2026-03-06T10:30:00Z,[AutoPost],[CLAUDELang 실행],[성공],[execution_time:5ms]
```

---

## 예제

### 예제 1: 간단한 인사말

**파일**: `examples/simple.json`

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "message",
      "value_type": "string",
      "value": "Hello, CLAUDELang!"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "message"}]
    }
  ]
}
```

**실행**:
```bash
node src/auto-post-cli.js run examples/simple.json
```

**출력**:
```
컴파일: ✅ 성공
실행: ✅ 성공
실행 시간: 2ms
메모리 사용: 0.08MB

출력 결과:
─────────────────────────────────────────
  Hello, CLAUDELang!
─────────────────────────────────────────
```

### 예제 2: 배열 처리

**파일**: `examples/array-example.json`

```bash
node src/auto-post-cli.js run examples/array-example.json
```

### 예제 3: 배치 처리

```bash
# 모든 예제 처리
node src/auto-post-cli.js examples

# 커스텀 디렉토리
node src/auto-post-cli.js batch "./my-code/**/*.json" "./reports"
```

---

## 고급 기능

### 커스텀 메타데이터

```javascript
await autoPoster.run(code, {
  filename: "special.json",
  author: "claude",
  category: "test",
  priority: "high"
});
```

### 결과 필터링

```javascript
const results = autoPoster.getResults();
const successful = results.filter(r => r.execution.success);
const failed = results.filter(r => !r.execution.success);
```

### 보고서 커스터마이징

```javascript
const markdown = result.markdown
  .replace("CLAUDELang v6.0", "FreeLang Marketing Team")
  .replace("[AUTO]", "[CLAUDE]");
```

---

## 문제 해결

### 컴파일 실패

**증상**: `Missing 'version' field`

**해결**: CLAUDELang 코드가 유효한 JSON 형식인지 확인

```json
{
  "version": "6.0",  // 필수!
  "instructions": [...]
}
```

### 실행 실패

**증상**: `Unknown function: HTTPGet`

**해결**: 함수명이 정확한지 확인

| 잘못된 이름 | 올바른 이름 |
|-----------|----------|
| `HTTPGet` | `HTTP.get` |
| `print_line` | `print` |
| `arrayMap` | `Array.map` |

### Notion 발행 실패

**증상**: `Notion API token not set`

**해결**: API 토큰 설정

```javascript
const integration = new NotionIntegration({
  notionApiToken: process.env.NOTION_API_TOKEN
});
```

---

## API 레퍼런스

### AutoPoster 클래스

```javascript
class AutoPoster {
  // 초기화
  constructor(notionApiToken = null)

  // 단일 파일 처리
  async run(claudelangCode, metadata)

  // 배치 처리
  async runBatch(filePaths, outputDir)

  // 결과 저장
  saveResults(outputDir)

  // 결과 조회
  getResults()
}
```

### VirtualMachine 클래스

```javascript
class VirtualMachine {
  // VT 코드 실행
  execute(vtCode)

  // 함수 실행
  executeFunction(funcName, argsStr)
}
```

### NotionIntegration 클래스

```javascript
class NotionIntegration {
  // 초기화
  constructor(options)

  // 실행 및 발행
  async executeAndPost(code, metadata)

  // 배치 처리 및 발행
  async batchExecuteAndPost(filePaths, databaseId)
}
```

---

## 라이선스

MIT License - FreeLang v6.0 Project

## 지원

- 문서: https://github.com/freelang-community/freelang-v6
- 이슈: https://github.com/freelang-community/freelang-v6/issues
