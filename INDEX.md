# CLAUDELang v6.0 - 프로젝트 인덱스

**마지막 업데이트**: 2026-03-06 10:00:00 UTC

---

## 📚 문서 네비게이션

### 🎯 시작하기

| 문서 | 설명 | 읽을 시간 |
|------|------|---------|
| **QUICKSTART.md** | 5분 안에 시작하기 | 5분 |
| **START-HERE.md** | 프로젝트 개요 | 10분 |
| **README.md** | 기본 정보 | 5분 |

### 📖 상세 설명

| 문서 | 내용 | 난이도 |
|------|------|--------|
| **VT_RUNTIME_ANALYSIS.md** | 아키텍처 분석 및 설계 전략 | 중상 |
| **VT_RUNTIME_IMPLEMENTATION.md** | API 문서 및 구현 상세 | 중상 |
| **COMPILER_DESIGN.md** | 컴파일러 설계 | 중상 |
| **JSON_SCHEMA.md** | CLAUDELang JSON 스키마 | 초급 |
| **EXAMPLES.md** | 15개 예제 프로그램 설명 | 초급 |

### 📊 프로젝트 진행 상황

| 문서 | 내용 |
|------|------|
| **PHASE2_COMPLETION_SUMMARY.md** | Phase 2 완료 리포트 |
| **TEST_COVERAGE.md** | 테스트 커버리지 분석 |

### 🚀 자동 포스팅 (Notion 통합)

| 문서 | 내용 |
|------|------|
| **AUTO-POST-README.md** | 자동 포스팅 시스템 |
| **AUTO-POST-MANIFEST.md** | 포스팅 매니페스트 |

---

## 🗂️ 프로젝트 구조

```
freelang-v6-ai-sovereign/
├── 📄 문서
│   ├── README.md
│   ├── START-HERE.md
│   ├── QUICKSTART.md
│   ├── CLAUDELANG_SPEC.md
│   ├── COMPILER_DESIGN.md
│   ├── JSON_SCHEMA.md
│   ├── EXAMPLES.md
│   ├── VT_INTEGRATION.md
│   ├── VT_RUNTIME_ANALYSIS.md
│   ├── VT_RUNTIME_IMPLEMENTATION.md
│   ├── PHASE2_COMPLETION_SUMMARY.md
│   ├── TEST_COVERAGE.md
│   ├── AUTO-POST-README.md
│   └── AUTO-POST-MANIFEST.md
│
├── 📂 src/ (소스 코드)
│   ├── compiler.js                 (CLAUDELang 컴파일러)
│   ├── vt-runtime-bridge.js        (VT 런타임 + 평가기)
│   ├── notion-integration.js       (Notion MCP 통합)
│   ├── auto-post.js                (자동 포스팅)
│   └── auto-post-cli.js            (CLI 인터페이스)
│
├── 📂 test/ (테스트)
│   └── vt-runtime.test.js          (VT 런타임 테스트)
│
├── 📂 examples/ (예제 프로그램, 14개)
│   ├── simple.json
│   ├── array-example.json
│   ├── string-split.json
│   ├── csv-parsing.json
│   ├── data-filtering.json
│   ├── data-mapping.json
│   ├── data-aggregation.json
│   ├── conditional-workflow.json
│   ├── loop-with-condition.json
│   ├── nested-operations.json
│   ├── string-transformation.json
│   ├── markdown-example.json
│   ├── http-example.json
│   ├── api-response-processing.json
│   └── README.md
│
├── 📂 docs/ (추가 문서)
│   └── (확장 가능)
│
├── 📂 auto-post-results/ (자동 포스팅 결과)
│   └── (결과 파일들)
│
└── package.json                    (프로젝트 설정)
```

---

## 🔍 파일 설명

### 핵심 소스 코드

#### `src/compiler.js` (550+ 줄)
**역할**: CLAUDELang JSON을 VT 바이트코드로 컴파일

**주요 메서드**:
- `compile(json)` - 메인 컴파일 함수
- `validate(json)` - 스키마 검증
- `typeCheck(ast)` - 타입 검사
- `generateVTCode(ast)` - VT 코드 생성
- `registerFunction(name, params, returnType)` - 함수 등록

**특징**:
- 100+ 함수 등록
- 선택적 매개변수 지원
- 타입 호환성 검사
- 상세한 에러 메시지

#### `src/vt-runtime-bridge.js` (650+ 줄)
**역할**: VT 코드를 실행하는 런타임 환경

**클래스**:
1. **VTTokenizer** - 토큰화
   - 스킴 형식 파싱
   - 주석 처리
   - 문자열/숫자/심볼 구분

2. **VTParser** - AST 생성
   - 토큰 → AST 변환
   - 리스트 표현식 파싱
   - 원자적 표현식 처리

3. **VTEvaluator** - 실행
   - AST 평가
   - 메모리 관리
   - 100+ 내장 함수
   - 제어 흐름 (if, for)

4. **VTRuntimeBridge** - 인터페이스
   - `execute(vtCode)` - VT 코드 실행
   - `executeJSON(json, compiler)` - JSON 직접 실행
   - `getMemory()` - 메모리 조회
   - `clearMemory()` - 초기화
   - `registerFunction()` - 함수 등록

#### `test/vt-runtime.test.js` (150+ 줄)
**역할**: 자동 테스트 슈트

**특징**:
- 14개 예제 파일 자동 실행
- 색상 출력 (PASS/FAIL)
- 통계 요약
- 상세 에러 메시지

**실행**:
```bash
node test/vt-runtime.test.js
```

### 예제 프로그램 (examples/)

14개의 CLAUDELang JSON 프로그램:

1. **simple.json** - 기본 변수 선언
2. **array-example.json** - 배열 처리
3. **string-split.json** - 문자열 분할
4. **csv-parsing.json** - CSV 파싱
5. **data-filtering.json** - 데이터 필터링
6. **data-mapping.json** - 데이터 매핑
7. **data-aggregation.json** - 데이터 집계
8. **conditional-workflow.json** - 조건 분기
9. **loop-with-condition.json** - 조건 루프
10. **nested-operations.json** - 중첩 연산
11. **string-transformation.json** - 문자열 변환
12. **markdown-example.json** - Markdown 생성
13. **http-example.json** - HTTP 요청
14. **api-response-processing.json** - API 응답 처리

**테스트 결과**: 14/14 통과 (100%)

---

## 📊 Phase 2 완료 현황

### ✅ 구현 완료

| 항목 | 상태 | 코드 |
|------|------|------|
| VT 토크나이저 | ✅ | VTTokenizer (150 줄) |
| VT 파서 | ✅ | VTParser (100 줄) |
| VT 평가기 | ✅ | VTEvaluator (400 줄) |
| VT 런타임 브리지 | ✅ | VTRuntimeBridge (100 줄) |
| 컴파일러 개선 | ✅ | 산술/비교/속성 지원 |
| 함수 레지스트리 | ✅ | 100+ 함수 |
| 메모리 관리 | ✅ | Map 기반 저장소 |
| 테스트 슈트 | ✅ | 14/14 통과 |
| 문서화 | ✅ | 4개 문서 |

### 📈 테스트 진행

| 단계 | 통과율 | 조치 |
|------|--------|------|
| 1차 | 85.7% (12/14) | arithmetic, property_access 지원 추가 |
| 2차 | 92.9% (13/14) | Array.slice 등록 |
| 3차 | 100% (14/14) | 선택적 파라미터 지원 |

---

## 🚀 빠른 시작

### 1단계: 테스트 실행

```bash
cd /data/data/com.termux/files/home/freelang-v6-ai-sovereign
node test/vt-runtime.test.js
```

**예상 출력**:
```
✓ simple
✓ array-example
... (14/14 전부 통과)

Pass Rate: 100.0%
```

### 2단계: 간단한 프로그램 작성

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "x",
      "value_type": "i32",
      "value": 10
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "x"}]
    }
  ]
}
```

### 3단계: 실행

```javascript
const Compiler = require('./src/compiler');
const { VTRuntimeBridge } = require('./src/vt-runtime-bridge');

const json = { /* ... */ };
const result = new VTRuntimeBridge().executeJSON(json, new Compiler());
console.log(result);
```

더 자세한 내용은 **QUICKSTART.md**를 참고하세요.

---

## 💻 주요 API

### VTRuntimeBridge

```javascript
const { VTRuntimeBridge } = require('./src/vt-runtime-bridge');
const bridge = new VTRuntimeBridge();

// VT 코드 실행
const result = bridge.execute(vtCode);
// {success, result, memory, errors}

// JSON으로 직접 실행
const result = bridge.executeJSON(json, compiler);

// 메모리 조회
const memory = bridge.getMemory();

// 메모리 초기화
bridge.clearMemory();

// 함수 등록
bridge.registerFunction('add', (a, b) => a + b);
```

### CLAUDELangCompiler

```javascript
const Compiler = require('./src/compiler');
const compiler = new Compiler();

// 컴파일
const result = compiler.compile(json);
// {success, code, errors}

if (result.success) {
  console.log(result.code); // VT 코드 출력
}
```

---

## 📖 읽을거리 순서

**초급자**:
1. START-HERE.md (프로젝트 개요)
2. QUICKSTART.md (5분 시작)
3. EXAMPLES.md (예제 학습)
4. examples/ (프로그램 분석)

**중급자**:
1. CLAUDELANG_SPEC.md (언어 스펙)
2. JSON_SCHEMA.md (JSON 형식)
3. COMPILER_DESIGN.md (컴파일러)
4. VT_RUNTIME_ANALYSIS.md (아키텍처)

**고급자**:
1. VT_RUNTIME_IMPLEMENTATION.md (API 상세)
2. src/compiler.js (컴파일러 코드)
3. src/vt-runtime-bridge.js (런타임 코드)
4. test/vt-runtime.test.js (테스트 분석)

---

## 🎯 다음 마일스톤

### Phase 3: 성능 최적화 (2026년 3월 중순)

- [ ] JIT 컴파일
- [ ] 함수 캐싱
- [ ] 메모리 풀
- [ ] 벤치마크 도구

### Phase 4: 고급 기능 (2026년 3월 말)

- [ ] Async/Await
- [ ] 모듈 시스템
- [ ] 고급 타입
- [ ] 최적화 패스

### Phase 5: Notion 통합 (2026년 4월 초)

- [ ] Notion API
- [ ] 자동 포스팅
- [ ] 성능 모니터링
- [ ] 마케팅 자동화

---

## 📞 문의 및 피드백

- **이슈 보고**: Issues 탭에서 버그 보고
- **피드백**: 토론 또는 PR로 제안
- **기여**: Pull Request로 기여

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**마지막 업데이트**: 2026-03-06 10:00:00 UTC
**상태**: ✅ Phase 2 완료 (100% 테스트 통과)
**다음**: Phase 3 성능 최적화 (예정)
