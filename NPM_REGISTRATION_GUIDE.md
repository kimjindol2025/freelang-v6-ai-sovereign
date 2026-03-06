# CLAUDELang NPM 등록 가이드

## 📦 패키지 정보

```json
{
  "name": "claudelang",
  "version": "1.0.0",
  "description": "AI-optimized programming language designed for Claude",
  "main": "src/index.js"
}
```

---

## 🚀 npm 레지스트리 등록 단계

### 1단계: npm 계정 준비

```bash
# npm 계정이 없으면 생성
npm adduser

# 또는 npm 웹사이트에서 가입
# https://www.npmjs.com/signup
```

### 2단계: 레지스트리 로그인

```bash
npm login
```

### 3단계: 패키지 배포

```bash
npm publish
```

### 4단계: 배포 확인

```bash
npm view claudelang
```

---

## 📋 배포 전 체크리스트

- [ ] package.json 확인
- [ ] README.md 작성 (자동 생성됨)
- [ ] LICENSE 파일 포함
- [ ] src/ 디렉토리 포함
- [ ] examples/ 디렉토리 포함
- [ ] 버전 번호 확인 (1.0.0)
- [ ] 테스트 통과 확인

---

## 📝 README.md (npm 페이지용)

```markdown
# CLAUDELang

AI-optimized programming language designed for Claude.

Express your programs as pure JSON with functional programming paradigms.

## Installation

\`\`\`bash
npm install claudelang
\`\`\`

## Usage

\`\`\`javascript
const CLAUDELang = require('claudelang');

const lang = new CLAUDELang();
const result = await lang.runFile('example.json');
console.log(result);
\`\`\`

## Features

- ✅ JSON-based syntax
- ✅ Functional programming (map, filter, reduce)
- ✅ Lambda expressions
- ✅ Type inference
- ✅ VT runtime integration
- ✅ 100+ built-in functions

## Examples

See the `examples/` directory for 31 working examples.

## License

MIT
```

---

## 🔄 버전 업데이트 시 순서

```bash
# 1. package.json에서 버전 업데이트
# "version": "1.0.1"

# 2. 커밋
git add .
git commit -m "Release v1.0.1"

# 3. npm publish
npm publish

# 4. 태그 생성 (선택사항)
git tag v1.0.1
git push origin v1.0.1
```

---

## 📊 배포 후 사용

### npm으로 설치

```bash
npm install claudelang
```

### 스크립트에서 사용

```javascript
const { CLAUDELang } = require('claudelang');

const lang = new CLAUDELang();
const program = {
  version: "6.0",
  instructions: [
    { type: "var", name: "x", value_type: "i32", value: 42 },
    { type: "call", function: "IO.print", args: [{type: "ref", name: "x"}] }
  ]
};

const result = lang.runProgram(program);
```

---

## 🔗 관련 링크

- npm 페이지: https://www.npmjs.com/package/claudelang
- GitHub: (저장소 URL)
- 문서: ./CLAUDELANG_SPEC.md

---

## ⚠️ 중요 사항

1. **첫 배포 후 수정 불가**: 같은 버전으로 재배포 불가
2. **버전 관리**: semantic versioning 사용 권장
3. **npm 계정**: 공개 계정이 필요 (비공개는 유료)

---

**생성일**: 2026-03-06
**상태**: 배포 준비 완료 ✅
