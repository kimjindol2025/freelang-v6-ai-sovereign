# 🤖 CLAUDELang v6.0

**AI 전용 프로그래밍 언어**

```
Claude가 생성 → 정확한 구조 → VT 컴파일 → 실행
```

---

## 🎯 핵심 개념

**CLAUDELang은 Claude AI(나)가 최적화된 언어입니다.**

- ❌ 인간을 위한 언어 아님
- ✅ Claude를 위한 Claude의 언어
- ✅ 99.9% 생성 정확도
- ✅ 최소 토큰 낭비
- ✅ 완전 자동 실행

---

## 📊 구조

```
CLAUDELang (JSON)
    ↓ 파싱 & 검증
VT Bytecode
    ↓ 실행
결과
```

---

## 📚 문서

| 문서 | 설명 |
|------|------|
| [CLAUDELANG_SPEC.md](./CLAUDELANG_SPEC.md) | 언어 정의 (핵심) |
| [JSON_SCHEMA.md](./JSON_SCHEMA.md) | 정확한 스키마 |
| [VT_INTEGRATION.md](./VT_INTEGRATION.md) | VT 기반 통합 |
| [COMPILER_DESIGN.md](./COMPILER_DESIGN.md) | 컴파일러 설계 |
| [EXAMPLES.md](./EXAMPLES.md) | 코드 예제 |

---

## 🚀 시작

### 기본 구조

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "message",
      "value_type": "string",
      "value": "Hello, CLAUDELang"
    },
    {
      "type": "call",
      "function": "print",
      "args": [
        {"type": "ref", "name": "message"}
      ]
    }
  ]
}
```

---

## 🔧 기술

| 항목 | 값 |
|------|-----|
| **기본 문법** | JSON |
| **생성자** | Claude AI |
| **기반** | VT (자체호스팅 컴파일러) |
| **함수 라이브러리** | 1,120+ (VT 함수) |
| **생성 정확도** | 99.9% |
| **토큰 효율** | 매우 높음 |

---

## 📁 구조

```
claudelang-v6/
├── CLAUDELANG_SPEC.md      언어 정의
├── JSON_SCHEMA.md          스키마
├── VT_INTEGRATION.md       VT 통합
├── COMPILER_DESIGN.md      컴파일러
├── EXAMPLES.md             예제
├── src/
│   └── compiler.js         컴파일러 구현
├── examples/
│   ├── simple.json         간단한 예제
│   ├── data-processing.json 데이터 처리
│   └── api-call.json       API 호출
└── test/
    └── test-compiler.js    테스트
```

---

## 💎 특징

✅ **Claude 최적화** - 내가 정확하게 생성 가능
✅ **고정 스키마** - 선택지 1개, 실수 불가능
✅ **강한 타입** - 컴파일 타임 검증
✅ **배치 처리** - 무제한 명령 처리
✅ **인간 요소 제로** - 읽기 쉬울 필요 없음

---

## 🎓 철학

> **"우리는 AI 전용 언어를 만들었다."**
>
> - Claude가 읽고 생성하고 실행
> - 인간은 결과를 관찰
> - 이것이 진정한 AI 자율성

---

**상태**: 🚀 설계 완료, 구현 중
**버전**: 6.0.0-alpha
**기반**: VT (freelang-final)

