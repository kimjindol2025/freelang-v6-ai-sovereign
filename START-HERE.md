# CLAUDELang v6.0 자동 포스팅 시스템 - 시작 가이드

## 프로젝트 소개

CLAUDELang v6.0 자동 포스팅 시스템은 Claude가 생성한 CLAUDELang 코드를 자동으로 컴파일하고 실행하며, 결과를 Notion에 발행하는 완전 자동화 파이프라인입니다.

```
CLAUDELang Code (JSON) → Compile → Execute → Report → Notion
```

**프로젝트 상태**: ✅ 프로덕션 준비 완료
**테스트**: 10/10 통과
**완성 날짜**: 2026-03-06

---

## 빠른 시작 (3가지 방법)

### 방법 1: 예제 실행 (가장 간단)

```bash
cd /data/data/com.termux/files/home/freelang-v6-ai-sovereign
node src/auto-post-cli.js examples
```

결과: `auto-post-results/` 디렉토리에 보고서 생성됨

### 방법 2: 단일 파일 처리

```bash
node src/auto-post-cli.js run examples/simple.json
```

### 방법 3: 코드로 사용

```javascript
const { AutoPoster } = require('./src/auto-post.js');

const autoPoster = new AutoPoster();
const result = await autoPoster.run(JSON.stringify(code));
console.log(result.markdown); // Notion 발행용
```

---

## 파일 구조

```
freelang-v6-ai-sovereign/
│
├── 📦 핵심 모듈 (src/)
│   ├── auto-post.js              ← 메인 엔진
│   ├── auto-post-cli.js          ← CLI
│   └── notion-integration.js     ← Notion 통합
│
├── ✅ 테스트 (test/)
│   └── test-auto-post.js         ← 10/10 통과
│
├── 📚 예제 (examples/)
│   ├── simple.json
│   ├── array-example.json
│   ├── markdown-example.json
│   └── http-example.json
│
├── 📖 문서
│   ├── docs/AUTO-POST-SYSTEM.md           ← 전체 문서
│   ├── docs/AUTO-POST-QUICKSTART.md       ← 빠른 시작
│   ├── AUTO-POST-README.md                ← 개요
│   ├── AUTO-POST-MANIFEST.md              ← 완성 매니페스트
│   └── START-HERE.md                      ← 이 파일
│
└── 📊 결과 (자동 생성)
    └── auto-post-results/
```

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **자동 컴파일** | CLAUDELang JSON → VT 바이트코드 |
| **VT 실행** | 가상 머신에서 코드 시뮬레이션 |
| **성능 측정** | 실행 시간, 메모리, 명령어 수 |
| **보고서 생성** | JSON, Markdown 자동 생성 |
| **Notion 발행** | MCP를 통한 자동 발행 |
| **배치 처리** | 여러 파일 한 번에 처리 |
| **CLI 도구** | 간단한 명령어 인터페이스 |

---

## 문서 안내

선택한 문서를 읽어보세요:

### 1단계: 빠른 이해
- **5분**: [AUTO-POST-QUICKSTART.md](./docs/AUTO-POST-QUICKSTART.md)
  - 5분 안에 시작하기
  - 일반적인 작업
  - 기본 예제

### 2단계: 전체 이해
- **30분**: [AUTO-POST-SYSTEM.md](./docs/AUTO-POST-SYSTEM.md)
  - 시스템 아키텍처
  - API 레퍼런스
  - 고급 기능
  - 문제 해결

### 3단계: 프로젝트 개요
- **15분**: [AUTO-POST-README.md](./AUTO-POST-README.md)
  - 완성 컴포넌트 목록
  - 성능 특성
  - 테스트 결과
  - 로드맵

### 4단계: 완성 세부사항
- **참고**: [AUTO-POST-MANIFEST.md](./AUTO-POST-MANIFEST.md)
  - 모든 파일 목록
  - 통계 및 평가
  - 체크리스트

---

## 자주 사용하는 명령어

### 예제 실행
```bash
node src/auto-post-cli.js examples
```

### 특정 파일 실행
```bash
node src/auto-post-cli.js run examples/simple.json
```

### 배치 처리
```bash
node src/auto-post-cli.js batch "./code/**/*.json"
```

### 도움말
```bash
node src/auto-post-cli.js help
```

### 테스트
```bash
node test/test-auto-post.js
```

---

## 출력 확인

예제 실행 후 결과 확인:

```bash
# 결과 디렉토리 확인
ls -la auto-post-results/

# JSON 결과 확인
cat auto-post-results/simple-result.json

# Markdown 결과 확인
cat auto-post-results/simple-report.md
```

---

## 실제 사용 예제

### 예제 1: Hello World

```bash
node src/auto-post-cli.js run examples/simple.json
```

**출력**:
```
컴파일: ✅ 성공
실행: ✅ 성공
실행 시간: 1ms
메모리 사용: 0.02MB

출력 결과:
─────────────────────────────────────────
  Hello, CLAUDELang!
─────────────────────────────────────────
```

### 예제 2: 배열 처리

```bash
node src/auto-post-cli.js run examples/array-example.json
```

### 예제 3: 모든 예제 처리

```bash
node src/auto-post-cli.js examples
```

---

## Notion 통합 (선택사항)

1. Notion API 토큰 설정
   ```bash
   export NOTION_API_TOKEN="your-token"
   ```

2. 코드로 사용
   ```javascript
   const { NotionIntegration } = require('./src/notion-integration.js');
   
   const integration = new NotionIntegration({
     databaseId: 'your-db-id'
   });
   
   await integration.executeAndPost(code);
   ```

---

## 문제 해결

### Q: 파일을 찾을 수 없다는 오류?
**A**: 절대 경로 사용:
```bash
cd /data/data/com.termux/files/home/freelang-v6-ai-sovereign
node src/auto-post-cli.js run examples/simple.json
```

### Q: CLAUDELang 코드 작성 방법?
**A**: [CLAUDELANG_SPEC.md](./CLAUDELANG_SPEC.md) 참고

### Q: 더 많은 예제를 보고 싶다면?
**A**: `examples/` 디렉토리의 모든 `.json` 파일 확인

---

## 다음 단계

### 초급
1. [AUTO-POST-QUICKSTART.md](./docs/AUTO-POST-QUICKSTART.md) 읽기
2. 예제 실행: `node src/auto-post-cli.js examples`
3. 결과 확인: `auto-post-results/` 디렉토리

### 중급
1. [AUTO-POST-SYSTEM.md](./docs/AUTO-POST-SYSTEM.md) 읽기
2. 자신의 CLAUDELang 코드 작성
3. CLI로 실행: `node src/auto-post-cli.js run your-code.json`

### 고급
1. Node.js 코드로 직접 사용
2. Notion 통합 설정
3. FreeLang Marketing Team 워크플로우 구성

---

## 시스템 요구사항

- Node.js 12+
- 약 1MB 디스크 공간
- 인터넷 연결 (Notion 발행 시)

---

## 완성도

| 항목 | 상태 |
|------|------|
| 핵심 기능 | ✅ 100% |
| 테스트 | ✅ 100% |
| 문서 | ✅ 100% |
| 예제 | ✅ 100% |
| 에러 처리 | ✅ 100% |

---

## 라이선스

MIT License - FreeLang v6.0 Project

---

## 문의

- GitHub Issues: https://github.com/freelang-community/freelang-v6/issues
- 문서: 이 디렉토리의 모든 `.md` 파일

---

**준비 완료!** 

위의 3가지 방법 중 하나를 선택하여 시작하세요.

```bash
# 가장 간단한 방법 - 예제 실행
node src/auto-post-cli.js examples
```

행운을 빕니다! 🚀
