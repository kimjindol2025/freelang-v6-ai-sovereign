# 🤖 V6 NLP Processor 스펙

**버전**: 1.0-draft
**상태**: 설계 중
**목표**: 자연어 → 구조화된 코드 생성 요청

---

## 1️⃣ 입력 형식

### 자연어 지시
```
"사용자 관리 REST API 만들어 (JWT 인증, PostgreSQL, 관리자 권한)"
```

### 파싱 결과 (JSON)
```json
{
  "intent": "create_api",
  "project_type": "api",
  "features": [
    {
      "name": "user_management",
      "type": "core",
      "operations": ["create", "read", "update", "delete"]
    }
  ],
  "tech_stack": {
    "backend": "express",
    "database": "postgresql",
    "auth": "jwt",
    "admin_required": true
  },
  "requirements": {
    "auth_type": "jwt",
    "role_based_access": true,
    "database_required": true
  }
}
```

---

## 2️⃣ NLP 모듈 구조

### 2-1. Intent Classifier
**역할**: 사용자 지시의 의도 분류

**입력**: 자연어 문장
**출력**: intent, confidence

**지원 의도**:
- create_api (API 생성)
- create_web (웹앱 생성)
- create_cli (CLI 도구 생성)
- create_service (서비스 생성)
- add_feature (기능 추가)
- modify_auth (인증 변경)
- optimize (성능 최적화)

### 2-2. Entity Extractor
**역할**: 기술 스택, 기능, 요구사항 추출

**정규식 패턴**:
```javascript
// 기술 스택
/Express|FastAPI|Django|Go|Rust/
/React|Vue|Next\.js|Angular/
/PostgreSQL|MySQL|MongoDB|Redis/

// 인증 방식
/JWT|OAuth2?|2FA|SAML/

// 기능명
/사용자|상품|주문|결제|보고서/
```

**NER 엔티티**:
- FRAMEWORK: Express, FastAPI, React 등
- DATABASE: PostgreSQL, MongoDB 등
- AUTH: JWT, OAuth2 등
- FEATURE: 사용자관리, 결제시스템 등

### 2-3. Requirement Parser
**역할**: 비즈니스 요구사항 분석

**파싱 규칙**:
```
"관리자 권한" → {role_based_access: true}
"실시간 알림" → {real_time: true, ws_required: true}
"캐싱" → {cache_required: true, redis_required: true}
"다국어 지원" → {i18n_required: true}
```

---

## 3️⃣ 구현 가능 옵션

### Option A: Rule-based (정규식)
**장점**: 빠른 구현, 결정론적
**단점**: 새로운 패턴 추가 필요
**예상 시간**: 2-3일

### Option B: ML-based (분류 모델)
**장점**: 새로운 패턴 자동 학습
**단점**: 모델 훈련 필요
**예상 시간**: 1주

### Option C: LLM-based (Claude API)
**장점**: 최고 정확도, 유연성
**단점**: API 호출 비용
**예상 시간**: 1-2일

---

## 4️⃣ 통합 인터페이스

### Input
```typescript
interface UserPrompt {
  text: string;      // 사용자 지시
  context?: string;  // 프로젝트 컨텍스트 (선택)
}
```

### Output
```typescript
interface CodeGenRequest {
  intent: string;
  project_type: 'api' | 'web' | 'cli' | 'service';
  features: Feature[];
  tech_stack: TechStack;
  requirements: Requirements;
  confidence: number;  // 0-1
  warnings?: string[];
}
```

---

## 5️⃣ 테스트 케이스

### Test 1: 기본 API
```
입력: "REST API 서버 만들어"
예상: {intent: create_api, project_type: api, ...}
```

### Test 2: 복합 요청
```
입력: "사용자 관리 API (JWT 인증, PostgreSQL, 관리자 권한)"
예상: {intent: create_api, auth: jwt, db: postgresql, role_based: true}
```

### Test 3: 웹앱
```
입력: "React 대시보드 (실시간 채트, 다크모드)"
예상: {intent: create_web, tech_stack: {frontend: react}, features: [...]}
```

---

**상태**: 🔍 **설계 중**
**다음 단계**: 구현 방식 선택 (Option A/B/C)
