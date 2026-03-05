# 🎯 FreeLang v6 필수 자원 확보 (Priority 1)

**수집 날짜**: 2026-03-06
**프로젝트**: `freelang-v6-ai-sovereign/`

---

## 1️⃣ AI 엔진 기초 (Core)

### 1-1. 자연어 처리 (NLP Processor)
**목적**: "사용자 관리 API 만들어" → 구조화된 요청 변환

**필요한 것**:
- 의도 인식 (Intent Recognition)
  - API/Web/CLI/Database/실시간 등 타입 분류
  - 필요한 라이브러리/프레임워크 추출
  - 데이터베이스 필요 여부 판단

- 개체명 인식 (NER - Named Entity Recognition)
  - 함수명, 변수명 추출
  - 기술 스택 인식 (Express, React, PostgreSQL 등)
  - 비즈니스 로직 키워드 추출

- 요구사항 분석
  - 인증/권한 필요 여부
  - 실시간 기능 필요 여부
  - 캐싱/성능 최적화 필요 여부

### 1-2. 코드 생성 (Code Generator)
**목적**: 요청 → 자동 코드 생성

**필요한 것**:
- 템플릿 시스템
  - API 템플릿 (Express/FastAPI/Go)
  - Web 템플릿 (React/Vue/Next.js)
  - Database 템플릿 (SQL/NoSQL)
  - 인증 템플릿 (JWT/OAuth2/2FA)

- AST 기반 생성
  - 타입 정의
  - 함수 선언
  - 라우트 정의
  - 데이터베이스 스키마

### 1-3. 최적화 (Optimizer)
**목적**: 생성된 코드 → 자동 최적화

**필요한 것**:
- 성능 분석
  - 데이터베이스 쿼리 최적화
  - 번들 크기 최소화
  - 캐싱 전략 제시

- 보안 검사
  - SQL Injection 방지
  - XSS 방지
  - 인증/권한 검증

### 1-4. 배포 (Deployer)
**목적**: 최적화된 코드 → 자동 배포

**필요한 것**:
- 빌드 자동화
  - npm/yarn 빌드
  - 컨테이너 빌드 (Docker)
  - 바이너리 생성

- 배포 자동화
  - Vercel/AWS/GCP 배포
  - 도메인 설정
  - SSL 인증서
  - 헬스 체크

---

## 2️⃣ 기존 자산 활용

### v2-freelang-ai (런타임)
- ✅ 1,120개 빌트인 함수
- ✅ HTTP, Database, FileSystem, Crypto 지원
- ✅ NativeFunctionRegistry 패턴

### v5-freelang-final (자체호스팅)
- ✅ compiler.js (465줄) - 자체 컴파일
- ✅ compiler-advanced.js (510줄) - 고급 최적화
- ✅ linker-complete.fl (531줄) - ELF 링킹

### claude-automation (자동화)
- ✅ create-project.sh - 프로젝트 자동 생성
- ✅ monitor-sync.sh - 모니터링/동기화
- ✅ post-commit hook - 자동 푸시

---

## 3️⃣ 외부 라이브러리 (KPM)

### 필요한 패키지 (검색 예정)
```bash
kpm search nlp
kpm search code-generation
kpm search ast-transform
kpm search template-engine
kpm search deployment
kpm search performance-analysis
```

**예상 패키지**:
- AI-Review-API (코드 검수)
- code-generator (AST 기반 생성)
- template-engine (Handlebars/EJS)
- performance-monitor (성능 분석)

---

## 4️⃣ 설계 문서

### 필요한 설계서
1. NLP_PROCESSOR_SPEC.md - 자연어 처리 상세
2. CODE_GENERATOR_SPEC.md - 코드 생성 상세
3. OPTIMIZER_SPEC.md - 최적화 전략
4. DEPLOYER_SPEC.md - 배포 자동화
5. TEMPLATE_SYSTEM.md - 템플릿 구조

### 필요한 예제
1. EXAMPLE_API_GENERATION.md - REST API 예제
2. EXAMPLE_WEB_APP.md - 웹 앱 예제
3. EXAMPLE_CLI_TOOL.md - CLI 도구 예제
4. EXAMPLE_MICROSERVICE.md - 마이크로서비스 예제

---

## 5️⃣ 파이프라인 통합

### v6 워크플로우
```
사용자 지시
  ↓
NLP Processor (자연어 → 구조화)
  ↓
Code Generator (구조화 → 코드)
  ↓
Optimizer (코드 분석 → 최적화)
  ↓
Deployer (빌드 → 배포)
  ↓
✅ 실행 중 (자동 모니터링)
```

### 필요한 통합점
1. NLP ↔ Code Generator: JSON 스키마
2. Code Generator ↔ Optimizer: AST 형식
3. Optimizer ↔ Deployer: 빌드 config
4. Deployer ↔ Monitor: 헬스 체크

---

## 6️⃣ 체크리스트

### Priority 1 필수 자원
- [ ] NLP 프로세서 스펙 작성
- [ ] Code Generator 템플릿 시스템
- [ ] 기본 배포 파이프라인
- [ ] 자동 테스트 프레임워크

### Priority 2 필수 자원
- [ ] 성능 최적화 엔진
- [ ] 보안 검사 시스템
- [ ] 모니터링 대시보드
- [ ] 문제 해결 시스템

---

**상태**: 🔍 **자료 수집 중**
**다음 단계**: NLP Processor 스펙 작성 (Week 1)
