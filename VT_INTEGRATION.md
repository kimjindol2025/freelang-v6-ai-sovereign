# 🔗 VT 통합 설계

**CLAUDELang ↔ VT (자체호스팅 컴파일러) 통합**

---

## 🏗️ 아키텍처

```
Claude
  ↓ (생성)
CLAUDELang JSON
  ↓ (파싱)
AST (Abstract Syntax Tree)
  ↓ (컴파일)
VT 바이트코드
  ↓ (실행)
VT 런타임
  ↓
결과
```

---

## 📦 VT 라이브러리 매핑

### 1,120+ 함수를 네임스페이스로 조직화

#### HTTP (150개 함수)

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

**VT 함수 호출:**
```
HTTP.get(url: string) -> Response
HTTP.post(url: string, data: Object) -> Response
HTTP.put(url: string, data: Object) -> Response
HTTP.delete(url: string) -> Response
HTTP.patch(url: string, data: Object) -> Response
... (150개)
```

#### String (120개 함수)

```json
{
  "type": "call",
  "function": "String.split",
  "args": [
    {"type": "ref", "name": "text"},
    {"type": "literal", "value_type": "string", "value": ","}
  ],
  "assign_to": "parts"
}
```

**VT 함수:**
```
String.split(str: string, delimiter: string) -> Array<string>
String.join(arr: Array<string>, delimiter: string) -> string
String.trim(str: string) -> string
String.upper(str: string) -> string
String.lower(str: string) -> string
... (120개)
```

#### Array (120개 함수)

```json
{
  "type": "call",
  "function": "Array.map",
  "args": [
    {"type": "ref", "name": "items"},
    {
      "type": "lambda",
      "params": [{"name": "x", "type": "any"}],
      "body": [
        {
          "type": "arithmetic",
          "operator": "*",
          "left": {"type": "ref", "name": "x"},
          "right": {"type": "literal", "value_type": "i32", "value": 2}
        }
      ]
    }
  ],
  "assign_to": "doubled"
}
```

**VT 함수:**
```
Array.map(arr: Array<T>, fn: (T) -> U) -> Array<U>
Array.filter(arr: Array<T>, fn: (T) -> bool) -> Array<T>
Array.reduce(arr: Array<T>, fn: (acc, T) -> T, init: T) -> T
Array.find(arr: Array<T>, fn: (T) -> bool) -> Option<T>
... (120개)
```

#### Math (115개 함수)

```json
{
  "type": "call",
  "function": "Math.sqrt",
  "args": [{"type": "literal", "value_type": "f64", "value": 16.0}],
  "assign_to": "result"
}
```

**VT 함수:**
```
Math.sqrt(x: f64) -> f64
Math.pow(x: f64, y: f64) -> f64
Math.sin(x: f64) -> f64
Math.cos(x: f64) -> f64
Math.abs(x: f64) -> f64
... (115개)
```

#### FileSystem (120개 함수)

```json
{
  "type": "call",
  "function": "FS.read",
  "args": [{"type": "literal", "value_type": "string", "value": "data.txt"}],
  "assign_to": "content"
}
```

**VT 함수:**
```
FS.read(path: string) -> string
FS.write(path: string, content: string) -> bool
FS.exists(path: string) -> bool
FS.delete(path: string) -> bool
FS.list(path: string) -> Array<string>
... (120개)
```

#### JSON (100개 함수)

```json
{
  "type": "call",
  "function": "JSON.parse",
  "args": [{"type": "ref", "name": "json_string"}],
  "assign_to": "data"
}
```

**VT 함수:**
```
JSON.parse(str: string) -> Object
JSON.stringify(obj: Object) -> string
JSON.pretty(obj: Object) -> string
JSON.get(obj: Object, path: string) -> any
JSON.set(obj: Object, path: string, value: any) -> Object
... (100개)
```

#### Database (150개 함수)

```json
{
  "type": "call",
  "function": "DB.connect",
  "args": [{"type": "literal", "value_type": "string", "value": "postgresql://..."}],
  "assign_to": "connection"
}
```

**VT 함수:**
```
DB.connect(uri: string) -> Connection
DB.query(conn: Connection, sql: string) -> Array<Object>
DB.execute(conn: Connection, sql: string, params: Array) -> i32
DB.close(conn: Connection) -> bool
... (150개)
```

#### Markdown (80개 함수)

```json
{
  "type": "call",
  "function": "Markdown.create",
  "args": [],
  "assign_to": "doc"
}
```

**VT 함수:**
```
Markdown.create() -> Document
Markdown.heading(doc: Document, level: i32, text: string) -> Document
Markdown.paragraph(doc: Document, text: string) -> Document
Markdown.code(doc: Document, lang: string, code: string) -> Document
Markdown.build(doc: Document) -> string
... (80개)
```

#### Notion (100개 함수)

```json
{
  "type": "call",
  "function": "Notion.post",
  "args": [
    {
      "type": "object",
      "properties": {
        "title": {"type": "literal", "value_type": "string", "value": "포스트"},
        "content": {"type": "ref", "name": "markdown_content"}
      }
    }
  ]
}
```

**VT 함수:**
```
Notion.post(data: Object) -> Object
Notion.query(database_id: string, filter: Object) -> Array<Object>
Notion.update(page_id: string, properties: Object) -> Object
Notion.delete(page_id: string) -> bool
... (100개)
```

---

## 🔄 변환 프로세스

### Step 1: CLAUDELang JSON → AST

```json
입력:
{
  "version": "6.0",
  "instructions": [
    {"type": "var", "name": "x", "value_type": "i32", "value": 10}
  ]
}

AST:
{
  type: Program,
  instructions: [
    {
      type: VarDeclaration,
      name: "x",
      value_type: "i32",
      value: 10
    }
  ]
}
```

### Step 2: AST → VT 코드

```vt
; VT 아우풋
(define x 10)
(call print x)
```

### Step 3: VT 코드 → 실행

```
VT 컴파일러 (자체호스팅)
  ↓ 바이트코드로 컴파일
VT 런타임
  ↓ 실행
결과
```

---

## 🚀 구현 전략

### Phase 1: 컴파일러 코어

```javascript
// src/compiler.js
class CLAUDELangCompiler {
  constructor() {
    this.vtFunctions = this.loadVTFunctions();
  }

  compile(claudelangJson) {
    // 1. 검증
    this.validateSchema(claudelangJson);

    // 2. AST 생성
    const ast = this.parseJson(claudelangJson);

    // 3. 타입 검증
    this.typeCheck(ast);

    // 4. VT 코드 생성
    const vtCode = this.generateVTCode(ast);

    // 5. 최적화
    const optimized = this.optimize(vtCode);

    return optimized;
  }

  generateVTCode(ast) {
    // AST를 VT 바이트코드로 변환
    // VT 함수 호출로 변환
  }
}
```

### Phase 2: VT 함수 래핑

```javascript
// src/vt-bridge.js
class VTBridge {
  constructor() {
    this.vt = require('freelang-final');
  }

  callVTFunction(nameSpace, functionName, args) {
    // "HTTP.get" → VT의 HTTP.get 호출
    const fn = this.vt[nameSpace][functionName];
    return fn(...args);
  }
}
```

### Phase 3: 통합 테스트

```javascript
// test/integration.test.js
const compiler = new CLAUDELangCompiler();

const program = {
  version: "6.0",
  instructions: [...]
};

const vtCode = compiler.compile(program);
const result = vtCode.execute();

console.log(result);
```

---

## 📊 함수 통계

| 네임스페이스 | 함수 수 |
|------------|--------|
| HTTP | 150 |
| String | 120 |
| Array | 120 |
| Math | 115 |
| FileSystem | 120 |
| JSON | 100 |
| Database | 150 |
| Markdown | 80 |
| Notion | 100 |
| System | 115 |
| **합계** | **1,070+** |

---

## 🔒 타입 매핑

### CLAUDELang ← → VT

```
CLAUDELang       VT
i32       ←→  i32
i64       ←→  i64
f64       ←→  f64
string    ←→  string
bool      ←→  bool
Array<T>  ←→  array
Object    ←→  object
any       ←→  any
```

---

## ✅ 검증 레이어

### 컴파일 타임

```javascript
// 1. 함수 존재 검증
if (!vt[namespace][functionName]) {
  throw new Error(`Unknown function: ${namespace}.${functionName}`);
}

// 2. 함수 시그니처 검증
const signature = vt.getSignature(namespace, functionName);
if (args.length !== signature.params.length) {
  throw new Error(`Wrong argument count for ${namespace}.${functionName}`);
}

// 3. 타입 검증
for (let i = 0; i < args.length; i++) {
  const expectedType = signature.params[i].type;
  const actualType = this.inferType(args[i]);
  if (!this.isCompatible(actualType, expectedType)) {
    throw new Error(`Type mismatch in argument ${i}`);
  }
}
```

---

## 🎯 다음 단계

1. ✅ 스펙 정의 (완료)
2. 🔨 컴파일러 구현 (진행 중)
3. 📝 함수 라이브러리 정리 (진행 예정)
4. 🧪 통합 테스트 (진행 예정)
5. 📚 문서화 (진행 예정)

---

**상태**: 진행 중
**기반**: VT (freelang-final)
**호환성**: 100% VT 함수 지원

