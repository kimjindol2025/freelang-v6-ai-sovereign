# CLAUDELang v6.0 자동 포스팅 - 빠른 시작 가이드

## 5분 안에 시작하기

### 1단계: 설치 확인

```bash
cd freelang-v6-ai-sovereign
npm install  # (이미 설치되었을 경우 생략)
```

### 2단계: 첫 번째 실행

```bash
# 예제 파일 실행
node src/auto-post-cli.js run examples/simple.json
```

### 3단계: 결과 확인

```
════════════════════════════════════════════
처리 완료!
════════════════════════════════════════════

컴파일: ✅ 성공
실행: ✅ 성공
실행 시간: 5ms
메모리 사용: 0.08MB

출력 결과:
─────────────────────────────────────────
  Hello, CLAUDELang!
─────────────────────────────────────────

결과 저장:
  - JSON: ./auto-post-results/simple-result.json
  - Markdown: ./auto-post-results/simple-report.md
```

---

## 일반적인 작업

### 1. 자신의 CLAUDELang 코드 실행

```bash
node src/auto-post-cli.js run ./my-code.json
```

### 2. 모든 예제 처리

```bash
node src/auto-post-cli.js examples
```

### 3. 여러 파일 배치 처리

```bash
node src/auto-post-cli.js batch "./code/**/*.json" "./results"
```

### 4. 테스트 실행

```bash
node test/test-auto-post.js
```

---

## 코드로 사용하기

### JavaScript 스크립트

```javascript
const { AutoPoster } = require('./src/auto-post.js');

const autoPoster = new AutoPoster();

// CLAUDELang 코드 작성
const code = {
  version: "6.0",
  instructions: [
    {
      type: "var",
      name: "name",
      value_type: "string",
      value: "FreeLang"
    },
    {
      type: "call",
      function: "print",
      args: [
        { type: "ref", "name": "name" }
      ]
    }
  ]
};

// 실행
autoPoster.run(JSON.stringify(code)).then(result => {
  console.log("컴파일:", result.compilation.success ? "✅" : "❌");
  console.log("실행:", result.execution.success ? "✅" : "❌");
  console.log("출력:", result.execution.output.join("\n"));

  // Notion 발행용 마크다운
  console.log(result.markdown);
});
```

### 배치 처리

```javascript
const fs = require('fs');
const path = require('path');
const { AutoPoster } = require('./src/auto-post.js');

const autoPoster = new AutoPoster();

// 파일 목록
const files = [
  'examples/simple.json',
  'examples/array-example.json',
  'examples/markdown-example.json'
];

// 배치 실행
autoPoster.runBatch(files, './batch-results').then(() => {
  console.log("배치 처리 완료!");
});
```

---

## Notion 통합

### 1단계: Notion API 토큰 설정

```bash
export NOTION_API_TOKEN="your-token-here"
```

### 2단계: 코드 작성

```javascript
const { NotionIntegration } = require('./src/notion-integration.js');

const integration = new NotionIntegration({
  databaseId: "your-notion-db-id",
  pageTitle: "CLAUDELang 실행 결과",
  tags: ["CLAUDELang", "AutoPost"]
});

// 실행 및 발행
integration.executeAndPost(code, {
  filename: "example.json"
}).then(result => {
  console.log("Notion 발행 완료!");
});
```

---

## CLAUDELang 코드 예제

### 예제 1: Hello World

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "msg",
      "value_type": "string",
      "value": "Hello, World!"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "msg"}]
    }
  ]
}
```

실행:
```bash
node src/auto-post-cli.js run hello.json
```

### 예제 2: 변수 및 계산

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "a",
      "value_type": "i32",
      "value": 10
    },
    {
      "type": "var",
      "name": "b",
      "value_type": "i32",
      "value": 20
    },
    {
      "type": "call",
      "function": "print",
      "args": [
        {
          "type": "arithmetic",
          "operator": "+",
          "left": {"type": "ref", "name": "a"},
          "right": {"type": "ref", "name": "b"}
        }
      ]
    }
  ]
}
```

### 예제 3: 배열 반복

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "items",
      "value_type": "Array<string>",
      "value": {
        "type": "array",
        "elements": [
          {"type": "literal", "value_type": "string", "value": "Apple"},
          {"type": "literal", "value_type": "string", "value": "Banana"},
          {"type": "literal", "value_type": "string", "value": "Cherry"}
        ]
      }
    },
    {
      "type": "loop",
      "iterator": "fruit",
      "range": {"type": "ref", "name": "items"},
      "body": [
        {
          "type": "call",
          "function": "print",
          "args": [{"type": "ref", "name": "fruit"}]
        }
      ]
    }
  ]
}
```

---

## 문제 해결

### 문제: "Cannot find module 'compiler.js'"

**해결**:
```bash
cd freelang-v6-ai-sovereign
node src/auto-post-cli.js run examples/simple.json
```

### 문제: 파일을 찾을 수 없음

**해결**: 상대 경로 사용
```bash
# ❌ 잘못됨
node src/auto-post-cli.js run my-code.json

# ✅ 올바름
node src/auto-post-cli.js run ./my-code.json
```

### 문제: Notion 발행 실패

**확인**:
- API 토큰이 설정되었는가?
- Database ID가 정확한가?
- 토큰이 해당 데이터베이스에 접근 권한이 있는가?

---

## 출력 파일 위치

```
auto-post-results/
├── simple-result.json      # JSON 보고서
├── simple-report.md        # Markdown 보고서
├── summary.json            # 배치 요약
└── summary.md              # 배치 요약 (Markdown)
```

---

## 다음 단계

1. **커스텀 코드 작성**: JSON 형식으로 자신의 CLAUDELang 코드 작성
2. **Notion 연동**: Notion 데이터베이스에 자동 발행 설정
3. **CI/CD 통합**: GitHub Actions로 자동 실행 설정
4. **마케팅 팀 연동**: FreeLang Marketing Team Notion과 연결

---

## 도움말

```bash
node src/auto-post-cli.js help
```

모든 명령어와 옵션을 확인할 수 있습니다.

---

## 참고 문서

- [자동 포스팅 시스템 전체 문서](./AUTO-POST-SYSTEM.md)
- [CLAUDELang 스펙](../CLAUDELANG_SPEC.md)
- [컴파일러 설계](../COMPILER_DESIGN.md)
- [JSON 스키마](../JSON_SCHEMA.md)
