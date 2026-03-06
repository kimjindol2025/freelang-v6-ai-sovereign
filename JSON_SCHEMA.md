# 📐 CLAUDELang JSON Schema

**정확한 스키마 정의 (TypeScript)**

---

## 📦 프로그램 스키마

```typescript
interface Program {
  version: "6.0";
  instructions: Instruction[];
}

type Instruction =
  | VarDeclaration
  | CallInstruction
  | ConditionInstruction
  | LoopInstruction
  | CommentInstruction;
```

---

## 🔤 표현식 (Expression)

```typescript
type Expression =
  | Literal
  | Reference
  | ArithmeticExpression
  | ComparisonExpression
  | LogicalExpression
  | PropertyAccess
  | IndexAccess
  | ObjectLiteral
  | ArrayLiteral
  | LambdaExpression
  | CallExpression;
```

---

## 📝 명령어 상세 정의

### VarDeclaration

```typescript
interface VarDeclaration {
  type: "var";
  name: string;                    // 변수명
  value_type: string;              // 타입 (i32, string, Array<i32> 등)
  value: Expression | Literal;     // 초기값
}

// 예
{
  "type": "var",
  "name": "count",
  "value_type": "i32",
  "value": 42
}
```

### CallInstruction

```typescript
interface CallInstruction {
  type: "call";
  function: string;                // "Namespace.function_name"
  args: Expression[];              // 인수 배열
  assign_to?: string;              // 반환값을 할당할 변수명
}

// 예
{
  "type": "call",
  "function": "Array.map",
  "args": [
    {"type": "ref", "name": "items"},
    {"type": "lambda", ...}
  ],
  "assign_to": "mapped_items"
}
```

### ConditionInstruction

```typescript
interface ConditionInstruction {
  type: "condition";
  test: Expression;                // 조건
  then: Instruction[];             // true일 때 실행
  else?: Instruction[];            // false일 때 실행 (선택사항)
}

// 예
{
  "type": "condition",
  "test": {
    "type": "comparison",
    "operator": ">",
    "left": {"type": "ref", "name": "x"},
    "right": {"type": "literal", "value_type": "i32", "value": 0}
  },
  "then": [
    {"type": "call", "function": "print", "args": [...]}
  ],
  "else": [
    {"type": "call", "function": "print", "args": [...]}
  ]
}
```

### LoopInstruction

```typescript
interface LoopInstruction {
  type: "loop";
  iterator: string;                // 루프 변수명
  range: Expression;               // 반복 대상 (배열 또는 range)
  body: Instruction[];             // 루프 본체
}

// 예
{
  "type": "loop",
  "iterator": "item",
  "range": {"type": "ref", "name": "items"},
  "body": [
    {"type": "call", "function": "print", "args": [...]}
  ]
}
```

### CommentInstruction

```typescript
interface CommentInstruction {
  type: "comment";
  text: string;                    // 주석 텍스트
}

// 예
{
  "type": "comment",
  "text": "이것은 주석입니다"
}
```

---

## 🔢 표현식 상세 정의

### Literal

```typescript
interface Literal {
  type: "literal";
  value_type: "i32" | "i64" | "f32" | "f64" | "string" | "bool";
  value: number | string | boolean;
}

// 예
{"type": "literal", "value_type": "i32", "value": 42}
{"type": "literal", "value_type": "string", "value": "hello"}
{"type": "literal", "value_type": "bool", "value": true}
```

### Reference

```typescript
interface Reference {
  type: "ref";
  name: string;                    // 변수명
}

// 예
{"type": "ref", "name": "x"}
```

### ArithmeticExpression

```typescript
interface ArithmeticExpression {
  type: "arithmetic";
  operator: "+" | "-" | "*" | "/" | "%" | "**";
  left: Expression;
  right: Expression;
}

// 예
{
  "type": "arithmetic",
  "operator": "+",
  "left": {"type": "ref", "name": "a"},
  "right": {"type": "ref", "name": "b"}
}
```

### ComparisonExpression

```typescript
interface ComparisonExpression {
  type: "comparison";
  operator: ">" | "<" | "==" | "!=" | ">=" | "<=";
  left: Expression;
  right: Expression;
}

// 예
{
  "type": "comparison",
  "operator": ">=",
  "left": {"type": "ref", "name": "age"},
  "right": {"type": "literal", "value_type": "i32", "value": 18}
}
```

### LogicalExpression

```typescript
interface LogicalExpression {
  type: "logical";
  operator: "and" | "or" | "not";
  operands: Expression[];
}

// 예
{
  "type": "logical",
  "operator": "and",
  "operands": [
    {"type": "comparison", ...},
    {"type": "comparison", ...}
  ]
}
```

### PropertyAccess

```typescript
interface PropertyAccess {
  type: "property";
  object: Expression;              // 객체
  property: string;                // 프로퍼티명
}

// 예
{
  "type": "property",
  "object": {"type": "ref", "name": "user"},
  "property": "email"
}
```

### IndexAccess

```typescript
interface IndexAccess {
  type: "index";
  array: Expression;               // 배열
  index: Expression;               // 인덱스
}

// 예
{
  "type": "index",
  "array": {"type": "ref", "name": "items"},
  "index": {"type": "literal", "value_type": "i32", "value": 0}
}
```

### ObjectLiteral

```typescript
interface ObjectLiteral {
  type: "object";
  properties: {
    [key: string]: Expression;
  };
}

// 예
{
  "type": "object",
  "properties": {
    "name": {"type": "literal", "value_type": "string", "value": "Alice"},
    "age": {"type": "literal", "value_type": "i32", "value": 30}
  }
}
```

### ArrayLiteral

```typescript
interface ArrayLiteral {
  type: "array";
  elements: Expression[];          // 배열 요소
}

// 예
{
  "type": "array",
  "elements": [
    {"type": "literal", "value_type": "i32", "value": 1},
    {"type": "literal", "value_type": "i32", "value": 2},
    {"type": "literal", "value_type": "i32", "value": 3}
  ]
}
```

### LambdaExpression

```typescript
interface LambdaExpression {
  type: "lambda";
  params: Parameter[];             // 파라미터
  body: Expression[];              // 함수 본체
}

interface Parameter {
  name: string;                    // 파라미터명
  type: string;                    // 타입 (i32, string 등)
}

// 예
{
  "type": "lambda",
  "params": [
    {"name": "x", "type": "i32"},
    {"name": "y", "type": "i32"}
  ],
  "body": [
    {
      "type": "arithmetic",
      "operator": "+",
      "left": {"type": "ref", "name": "x"},
      "right": {"type": "ref", "name": "y"}
    }
  ]
}
```

### CallExpression

```typescript
interface CallExpression {
  type: "call";
  function: string;                // "Namespace.function_name"
  args: Expression[];              // 인수
}

// 예
{
  "type": "call",
  "function": "Math.sqrt",
  "args": [{"type": "ref", "name": "x"}]
}
```

---

## 📋 타입 목록

### 기본 타입

```
i32, i64, f32, f64
string, bool
any
```

### 복합 타입

```
Array<T>
Object
Result<T, E>
Option<T>
```

---

## ✅ 검증 규칙

### 1. 변수 명명

```json
{
  "name": "variable_name"
}

규칙:
- 첫글자: 영문 또는 _
- 이후: 영문, 숫자, _
- 예: x, my_var, _private, arr123
```

### 2. 함수 명명

```json
{
  "function": "Namespace.function_name"
}

규칙:
- Namespace: HTTP, String, Array, Math, etc.
- function_name: 소문자+_
- 예: HTTP.get, String.split, Array.map
```

### 3. 타입 명명

```json
{
  "value_type": "i32" | "Array<i32>" | ...
}

규칙:
- 기본 타입: i32, f64, string, bool
- 복합 타입: Array<T>, Object, Result<T, E>
```

---

## 🎯 스키마 검증

### JSON Schema (체크 가능)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": {"type": "string", "const": "6.0"},
    "instructions": {
      "type": "array",
      "items": {
        "oneOf": [
          {"$ref": "#/definitions/VarDeclaration"},
          {"$ref": "#/definitions/CallInstruction"},
          {"$ref": "#/definitions/ConditionInstruction"},
          {"$ref": "#/definitions/LoopInstruction"}
        ]
      }
    }
  },
  "required": ["version", "instructions"],
  "definitions": {
    "VarDeclaration": {
      "type": "object",
      "properties": {
        "type": {"const": "var"},
        "name": {"type": "string"},
        "value_type": {"type": "string"},
        "value": {}
      },
      "required": ["type", "name", "value_type", "value"]
    }
  }
}
```

---

**상태**: 확정
**버전**: 6.0.0

