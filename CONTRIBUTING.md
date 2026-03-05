# 🤝 Contributing to FreeLang v6

FreeLang v6에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 설명합니다.

---

## 📋 목차

1. [행동 수칙](#행동-수칙)
2. [기여 방법](#기여-방법)
3. [개발 설정](#개발-설정)
4. [커밋 메시지 작성](#커밋-메시지-작성)
5. [Pull Request 프로세스](#pull-request-프로세스)
6. [코드 스타일](#코드-스타일)
7. [테스트 작성](#테스트-작성)
8. [문서 작성](#문서-작성)
9. [이슈 신고](#이슈-신고)
10. [질문](#질문)

---

## 행동 수칙

[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)를 참조하세요.

---

## 기여 방법

### 🐛 버그 리포트

**전제 조건**:
- 최신 버전을 사용하고 있는가?
- 이미 보고된 버그는 아닌가?

**신고 절차**:

1. GitHub Issues에서 "Bug report" 템플릿 선택
2. 다음 정보 포함:
   - 버그 설명 (짧고 명확)
   - 재현 방법 (단계별)
   - 예상 동작
   - 실제 동작
   - 환경 정보 (OS, Node.js, FreeLang 버전)
   - 로그 또는 스크린샷

**예시**:
```markdown
## 버그 설명
NLP 처리기가 한국어 명령을 잘못 해석하고 있습니다.

## 재현 방법
1. "Redis 캐시 모듈을 구현해" 명령 입력
2. 생성된 코드 확인
3. 캐시 기능 없는 일반 모듈이 생성됨

## 예상 동작
Redis 캐시 기능이 포함된 모듈 생성

## 실제 동작
표준 모듈만 생성됨

## 환경
- OS: Ubuntu 22.04
- Node.js: 18.15.0
- FreeLang: 1.0.0
```

### ✨ 기능 요청

**전제 조건**:
- 현재 프로젝트의 목표와 맞는가?
- 유사한 기능이 이미 있지는 않은가?

**요청 절차**:

1. GitHub Issues에서 "Feature request" 템플릿 선택
2. 다음 내용 포함:
   - 기능 설명
   - 사용 사례
   - 예상 동작
   - 현재 대체 방법

### 📈 개선 제안

코드 품질, 문서, 성능 개선 등 모든 제안을 환영합니다!

---

## 개발 설정

### 1. Fork & Clone

```bash
# GitHub에서 저장소 Fork
# Fork한 저장소 Clone
git clone https://github.com/your-username/freelang-v6-ai-sovereign.git
cd freelang-v6-ai-sovereign

# Upstream 추가
git remote add upstream https://github.com/kim/freelang-v6-ai-sovereign.git
```

### 2. 개발 브랜치 생성

```bash
# 최신 코드 동기화
git fetch upstream
git checkout -b feature/my-feature upstream/main

# 또는
git checkout -b fix/bug-description upstream/main
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
# TypeScript 컴파일 + 실행
npm run dev

# 또는 watch 모드
npm run dev:watch
```

### 5. 테스트 작성

```bash
# 테스트 실행
npm test

# Watch 모드
npm test:watch

# 커버리지 확인
npm run test:coverage
```

---

## 커밋 메시지 작성

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: 새 기능
- **fix**: 버그 수정
- **docs**: 문서 변경
- **style**: 코드 스타일 변경 (기능 변화 없음)
- **refactor**: 코드 리팩토링
- **perf**: 성능 개선
- **test**: 테스트 추가/수정
- **chore**: 빌드 프로세스, 의존성 업데이트

### Scope

변경이 영향을 미치는 영역:
- nlp-processor
- code-generator
- deployer
- optimizer
- multitenancy
- enterprise

### Subject

- 명령형으로 작성 ("add" not "added")
- 첫 글자는 소문자
- 끝에 마침표 없음
- 50자 이내

### Body

- "what"과 "why"를 설명 (어떻게는 아님)
- 여러 줄일 경우 72자 마다 줄바꿈
- 선택사항이지만 권장됨

### Footer

**Breaking Changes**:
```
BREAKING CHANGE: API 응답 형식이 변경되었습니다.
이전: { data: ... }
현재: { success: true, data: ... }
```

**이슈 연결**:
```
Closes #123
Refs #456
```

### 예시

```
feat(nlp-processor): improve Korean language accuracy to 95%

- Updated tokenizer for better Korean morphology
- Added Korean-specific context handling
- Improved entity recognition for Korean entities

BREAKING CHANGE: NLP response format changed
- Removed deprecated 'confidence' field
- Added new 'accuracy' field in percentage

Closes #456
```

---

## Pull Request 프로세스

### 1. Pull Request 생성 전 확인

```bash
# 최신 코드로 동기화
git fetch upstream
git rebase upstream/main

# 테스트 통과
npm test

# 린트 오류 없음
npm run lint

# 빌드 성공
npm run build
```

### 2. Pull Request 작성

**제목**: 커밋 메시지의 subject와 동일

**설명 템플릿**:
```markdown
## 변경 사항
이 PR이 하는 일을 설명하세요.

## 관련 이슈
Closes #123

## 변경 타입
- [ ] 버그 수정
- [ ] 새 기능
- [ ] 중단되는 변경사항

## 체크리스트
- [ ] 테스트 추가/수정
- [ ] 문서 업데이트
- [ ] 변경사항이 문서에 반영됨
- [ ] 자신의 코드를 검토했음
- [ ] 주석이 명확함
- [ ] 새 의존성 추가 시 정당성 설명

## 스크린샷/로그 (선택사항)
UI 변경이 있으면 스크린샷 첨부
```

### 3. 리뷰 대기

- 팀이 리뷰할 때까지 기다립니다
- 피드백에 적극 응합니다
- 필요시 커밋 추가

### 4. 병합

코드 리뷰 후 자동으로 병합됩니다.

---

## 코드 스타일

### TypeScript

```typescript
// ✅ 좋은 예
interface UserOptions {
  name: string;
  age: number;
  email?: string;
}

function createUser(options: UserOptions): User {
  return new User(options);
}

// ❌ 나쁜 예
function createUser(name, age, email) {
  return new User(name, age, email);
}
```

### 이름 지정

```typescript
// 변수: camelCase
const userName = "kim";
const isActive = true;

// 클래스: PascalCase
class UserManager { }

// 상수: UPPER_CASE
const MAX_USERS = 1000;

// 함수: camelCase (동사 시작)
function getUserById(id: string) { }
```

### 주석

```typescript
// ✅ 좋은 예: 명확하고 유용한 주석
// 사용자를 ID로 검색하고 캐시에 저장
const user = await getUserById(id);
cache.set(id, user);

// ❌ 나쁜 예: 명백한 내용 반복
// userId 변수 생성
const userId = id;
```

### 포맷팅

```bash
# Prettier로 자동 포맷팅
npm run format

# ESLint로 스타일 확인
npm run lint
```

---

## 테스트 작성

### 테스트 구조

```typescript
describe('NLP Processor', () => {
  describe('parseCommand', () => {
    it('should parse simple English command', () => {
      const result = nlp.parseCommand('create a REST API');
      expect(result.intent).toBe('code_generation');
      expect(result.language).toBe('English');
    });

    it('should handle Korean commands with 95% accuracy', () => {
      const result = nlp.parseCommand('REST API를 만들어');
      expect(result.confidence).toBeGreaterThan(0.95);
    });

    it('should throw error on invalid input', () => {
      expect(() => nlp.parseCommand('')).toThrow();
    });
  });
});
```

### 테스트 작성 가이드

1. **명확한 설명**: `it('should ...')` 형식
2. **arrange-act-assert**: 준비 → 실행 → 검증
3. **한 가지만 테스트**: 각 테스트는 하나의 동작만 검증
4. **재현 가능**: 외부 상태에 의존하지 않음
5. **빠름**: 각 테스트는 100ms 이내

### 테스트 실행

```bash
# 전체 테스트
npm test

# 특정 파일만
npm test nlp.test.ts

# 특정 테스트만
npm test -- --testNamePattern="Korean"

# 커버리지 리포트
npm run test:coverage
```

### 커버리지 목표

- **라인**: 85% 이상
- **분기**: 80% 이상
- **함수**: 85% 이상

---

## 문서 작성

### Markdown 스타일

```markdown
# 제목 (h1)

주요 내용을 소개합니다.

## 부제목 (h2)

더 구체적인 내용입니다.

### 세부 제목 (h3)

### 코드 예시

\`\`\`typescript
// 코드 블록
\`\`\`

### 목록

- 항목 1
- 항목 2
  - 중첩 항목

### 테이블

| 헤더 1 | 헤더 2 |
|--------|--------|
| 내용 1 | 내용 2 |
```

### 문서 위치

- **사용자 가이드**: `docs/USAGE.md`
- **API 문서**: `docs/API.md`
- **개발자 가이드**: `docs/DEVELOPER.md`
- **릴리스 노트**: `docs/CHANGELOG.md`

---

## 이슈 신고

### 이슈 템플릿

**버그**:
- 간결한 설명
- 재현 방법
- 예상/실제 동작
- 환경 정보

**기능 요청**:
- 기능 설명
- 사용 사례
- 예상 동작

**질문**:
- 정확한 질문
- 시도한 방법
- 예상 결과

---

## 질문

### 자주 묻는 질문

**Q: 첫 기여는 어디서 시작?**
A: "good first issue" 라벨이 붙은 이슈부터 시작하세요.

**Q: 큰 변경사항은?**
A: 먼저 이슈를 열어 팀과 논의하세요.

**Q: 테스트는 필수?**
A: 네. 모든 코드 변경은 테스트가 필요합니다.

**Q: 문서도 수정?**
A: 코드 변경 시 관련 문서도 함께 수정하세요.

### 연락처

- **이메일**: dev@freelang.ai
- **Slack**: #freelang-dev
- **GitHub Discussions**: [Q&A](https://github.com/kim/freelang-v6-ai-sovereign/discussions)

---

## 📚 리소스

- [FreeLang 아키텍처](./V6_ARCHITECTURE.md)
- [개발자 가이드](./docs/DEVELOPER.md)
- [API 문서](./docs/API.md)
- [테스트 가이드](./docs/TESTING.md)

---

**감사합니다! 🎉**

귀하의 기여는 FreeLang을 더 나아지게 만듭니다.
