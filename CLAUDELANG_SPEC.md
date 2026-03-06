# 🤖 CLAUDELang v6.0 스펙

**최종 정의**: Claude AI를 위한 프로그래밍 언어

---

## 🎯 정의

```
CLAUDELang =
  JSON 구조
  + 고정된 스키마
  + VT 함수 라이브러리
  + 99.9% 생성 정확도
  = AI 전용 언어
```

---

## 📋 설계 원칙

### 원칙 1: 선택지는 1개

변수 선언:
```json
{
  "type": "var",
  "name": "x",
  "value_type": "i32",
  "value": 10
}
```

**다른 방법 없음** - 이것이 유일

### 원칙 2: JSON = 스키마 = 명확성

```json
모든 명령어:
{
  "type": "...",
  "... specific fields ...": ...
}

→ 고정된 필드
→ 타입 명시
→ 선택지 1개
```

### 원칙 3: 모호성 제거

```json
❌ "이 값의 타입이 뭐지?"
{"value": 10}

✅ "정확히 뭔지 명시"
{"value_type": "i32", "value": 10}
```

### 원칙 4: 계층 구조 = 우선순위 자동 해결

```json
❌ 텍스트 (우선순위 혼동)
a + b * c

✅ JSON (명확)
{
  "type": "arithmetic",
  "operator": "+",
  "left": {...},
  "right": {
    "type": "arithmetic",
    "operator": "*",
    ...
  }
}
```

### 원칙 5: 모든 것이 명시적

```json
❌ 암묵적 타입 변환
x + "hello"

✅ 명시적 타입
{
  "type": "call",
  "function": "String.concat",
  "args": [
    {"type": "ref", "name": "x"},
    {"type": "literal", "value_type": "string", "value": "hello"}
  ]
}
```

---

## 🏗️ 코어 구조

### 프로그램 구조

```json
{
  "version": "6.0",
  "instructions": [
    { instruction 1 },
    { instruction 2 },
    ...
  ]
}
```

---

## 📝 명령어 타입

### 1. 변수 선언 (var)

```json
{
  "type": "var",
  "name": "variable_name",
  "value_type": "i32|string|Array|Object|...",
  "value": ...
}
```

**예:**
```json
{
  "type": "var",
  "name": "x",
  "value_type": "i32",
  "value": 42
}
```

### 2. 함수 호출 (call)

```json
{
  "type": "call",
  "function": "NameSpace.function_name",
  "args": [...],
  "assign_to": "variable_name"  // 선택사항
}
```

**예:**
```json
{
  "type": "call",
  "function": "HTTP.get",
  "args": [
    {"type": "literal", "value_type": "string", "value": "https://api.example.com"}
  ],
  "assign_to": "response"
}
```

### 3. 산술 연산 (arithmetic)

```json
{
  "type": "arithmetic",
  "operator": "+|-|*|/|%|**",
  "left": {...},
  "right": {...}
}
```

**예:**
```json
{
  "type": "arithmetic",
  "operator": "*",
  "left": {"type": "ref", "name": "x"},
  "right": {"type": "literal", "value_type": "i32", "value": 2}
}
```

### 4. 비교 (comparison)

```json
{
  "type": "comparison",
  "operator": ">|<|==|!=|>=|<=",
  "left": {...},
  "right": {...}
}
```

### 5. 논리 연산 (logical)

```json
{
  "type": "logical",
  "operator": "and|or|not",
  "operands": [...]
}
```

### 6. 조건 (condition)

```json
{
  "type": "condition",
  "test": {...},
  "then": [...],
  "else": [...]  // 선택사항
}
```

**예:**
```json
{
  "type": "condition",
  "test": {
    "type": "comparison",
    "operator": ">",
    "left": {"type": "ref", "name": "x"},
    "right": {"type": "literal", "value_type": "i32", "value": 5}
  },
  "then": [
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "literal", "value_type": "string", "value": "big"}]
    }
  ]
}
```

### 7. 반복 (loop)

```json
{
  "type": "loop",
  "iterator": "item_name",
  "range": {...},
  "body": [...]
}
```

**예:**
```json
{
  "type": "loop",
  "iterator": "i",
  "range": {
    "type": "call",
    "function": "range",
    "args": [
      {"type": "literal", "value_type": "i32", "value": 0},
      {"type": "literal", "value_type": "i32", "value": 10}
    ]
  },
  "body": [
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "i"}]
    }
  ]
}
```

### 8. 익명 함수 (lambda)

```json
{
  "type": "lambda",
  "params": [
    {"name": "param1", "type": "string"},
    {"name": "param2", "type": "i32"}
  ],
  "body": [...]
}
```

**예:**
```json
{
  "type": "lambda",
  "params": [{"name": "x", "type": "i32"}],
  "body": [
    {
      "type": "arithmetic",
      "operator": "*",
      "left": {"type": "ref", "name": "x"},
      "right": {"type": "literal", "value_type": "i32", "value": 2}
    }
  ]
}
```

### 9. 객체 (object)

```json
{
  "type": "object",
  "properties": {
    "key1": {...},
    "key2": {...}
  }
}
```

### 10. 배열 (array)

```json
{
  "type": "array",
  "elements": [...]
}
```

### 11. 참조 (ref)

```json
{
  "type": "ref",
  "name": "variable_name"
}
```

### 12. 리터럴 (literal)

```json
{
  "type": "literal",
  "value_type": "i32|f64|string|bool",
  "value": ...
}
```

### 13. 프로퍼티 접근 (property)

```json
{
  "type": "property",
  "object": {...},
  "property": "key_name"
}
```

**예:**
```json
{
  "type": "property",
  "object": {"type": "ref", "name": "user"},
  "property": "name"
}
```

### 14. 인덱싱 (index)

```json
{
  "type": "index",
  "array": {...},
  "index": {...}
}
```

**예:**
```json
{
  "type": "index",
  "array": {"type": "ref", "name": "items"},
  "index": {"type": "literal", "value_type": "i32", "value": 0}
}
```

---

## 🔤 타입 시스템

### 기본 타입

```
i32          - 32비트 정수
i64          - 64비트 정수
f32          - 32비트 실수
f64          - 64비트 실수
string       - 문자열
bool         - 불린
any          - 동적 타입
```

### 복합 타입

```
Array<T>     - 배열
Object       - 객체
Result<T, E> - Result 타입 (성공/실패)
Option<T>    - Option 타입 (Some/None)
```

---

## 🎓 예제

### 기본

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "message",
      "value_type": "string",
      "value": "Hello"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "message"}]
    }
  ]
}
```

### 배열 필터링

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "numbers",
      "value_type": "Array<i32>",
      "value": [1, 2, 3, 4, 5]
    },
    {
      "type": "call",
      "function": "Array.filter",
      "args": [
        {"type": "ref", "name": "numbers"},
        {
          "type": "lambda",
          "params": [{"name": "x", "type": "i32"}],
          "body": [
            {
              "type": "comparison",
              "operator": ">",
              "left": {"type": "ref", "name": "x"},
              "right": {"type": "literal", "value_type": "i32", "value": 2}
            }
          ]
        }
      ],
      "assign_to": "filtered"
    }
  ]
}
```

---

## ✅ 검증

### 컴파일 타임

- ✅ 스키마 검증 (JSON 구조)
- ✅ 타입 검증 (모든 값이 타입과 일치)
- ✅ 함수 검증 (함수 존재 여부)
- ✅ 변수 검증 (변수 선언 여부)

### 런타임

- ✅ 값 범위 검증
- ✅ Null 포인터 검증
- ✅ 배열 인덱스 검증

---

## 🚀 철학

**CLAUDELang은 다음을 보장합니다:**

1. **정확성** - 99.9% 생성 정확도
2. **명확성** - 모호함 제로
3. **안전성** - 컴파일 타임 검증
4. **효율성** - 토큰 낭비 최소
5. **자동성** - 인간 개입 없음

---

**상태**: 확정
**버전**: 6.0.0-alpha
**기반**: VT 1,120+ 함수

