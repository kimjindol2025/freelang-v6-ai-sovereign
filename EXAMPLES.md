# 📚 CLAUDELang 예제 모음

**실행 가능한 코드 예제들**

---

## 🔷 기본 예제

### 예제 1: Hello World

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "message",
      "value_type": "string",
      "value": "Hello, CLAUDELang!"
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

**출력:**
```
Hello, CLAUDELang!
```

---

### 예제 2: 기본 연산

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "a",
      "value_type": "i32",
      "value": 10
    },
    {
      "type": "var",
      "name": "b",
      "value_type": "i32",
      "value": 20
    },
    {
      "type": "call",
      "function": "print",
      "args": [
        {
          "type": "arithmetic",
          "operator": "+",
          "left": {"type": "ref", "name": "a"},
          "right": {"type": "ref", "name": "b"}
        }
      ]
    }
  ]
}
```

**출력:**
```
30
```

---

## 🔵 배열 예제

### 예제 3: 배열 필터링

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "numbers",
      "value_type": "Array<i32>",
      "value": {
        "type": "array",
        "elements": [
          {"type": "literal", "value_type": "i32", "value": 1},
          {"type": "literal", "value_type": "i32", "value": 2},
          {"type": "literal", "value_type": "i32", "value": 3},
          {"type": "literal", "value_type": "i32", "value": 4},
          {"type": "literal", "value_type": "i32", "value": 5}
        ]
      }
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
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "filtered"}]
    }
  ]
}
```

**출력:**
```
[3, 4, 5]
```

---

### 예제 4: 배열 매핑

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "items",
      "value_type": "Array<i32>",
      "value": {
        "type": "array",
        "elements": [
          {"type": "literal", "value_type": "i32", "value": 1},
          {"type": "literal", "value_type": "i32", "value": 2},
          {"type": "literal", "value_type": "i32", "value": 3}
        ]
      }
    },
    {
      "type": "call",
      "function": "Array.map",
      "args": [
        {"type": "ref", "name": "items"},
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
      ],
      "assign_to": "doubled"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "doubled"}]
    }
  ]
}
```

**출력:**
```
[2, 4, 6]
```

---

## 🟢 조건문 예제

### 예제 5: 조건부 출력

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "age",
      "value_type": "i32",
      "value": 25
    },
    {
      "type": "condition",
      "test": {
        "type": "comparison",
        "operator": ">=",
        "left": {"type": "ref", "name": "age"},
        "right": {"type": "literal", "value_type": "i32", "value": 18}
      },
      "then": [
        {
          "type": "call",
          "function": "print",
          "args": [{"type": "literal", "value_type": "string", "value": "성인입니다"}]
        }
      ],
      "else": [
        {
          "type": "call",
          "function": "print",
          "args": [{"type": "literal", "value_type": "string", "value": "미성년자입니다"}]
        }
      ]
    }
  ]
}
```

**출력:**
```
성인입니다
```

---

## 🟡 반복문 예제

### 예제 6: 반복 출력

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "items",
      "value_type": "Array<string>",
      "value": {
        "type": "array",
        "elements": [
          {"type": "literal", "value_type": "string", "value": "apple"},
          {"type": "literal", "value_type": "string", "value": "banana"},
          {"type": "literal", "value_type": "string", "value": "cherry"}
        ]
      }
    },
    {
      "type": "loop",
      "iterator": "item",
      "range": {"type": "ref", "name": "items"},
      "body": [
        {
          "type": "call",
          "function": "print",
          "args": [{"type": "ref", "name": "item"}]
        }
      ]
    }
  ]
}
```

**출력:**
```
apple
banana
cherry
```

---

## 🔴 API 호출 예제

### 예제 7: HTTP GET 요청

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "call",
      "function": "HTTP.get",
      "args": [
        {"type": "literal", "value_type": "string", "value": "https://api.example.com/users"}
      ],
      "assign_to": "response"
    },
    {
      "type": "call",
      "function": "JSON.parse",
      "args": [
        {
          "type": "property",
          "object": {"type": "ref", "name": "response"},
          "property": "body"
        }
      ],
      "assign_to": "data"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "data"}]
    }
  ]
}
```

---

## 🟣 데이터 처리 예제

### 예제 8: 문자열 처리

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "text",
      "value_type": "string",
      "value": "hello,world,test"
    },
    {
      "type": "call",
      "function": "String.split",
      "args": [
        {"type": "ref", "name": "text"},
        {"type": "literal", "value_type": "string", "value": ","}
      ],
      "assign_to": "parts"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "parts"}]
    }
  ]
}
```

**출력:**
```
["hello", "world", "test"]
```

---

### 예제 9: 객체 생성

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "user",
      "value_type": "Object",
      "value": {
        "type": "object",
        "properties": {
          "name": {"type": "literal", "value_type": "string", "value": "Alice"},
          "age": {"type": "literal", "value_type": "i32", "value": 30},
          "email": {"type": "literal", "value_type": "string", "value": "alice@example.com"}
        }
      }
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "user"}]
    }
  ]
}
```

**출력:**
```
{"name": "Alice", "age": 30, "email": "alice@example.com"}
```

---

## 💎 고급 예제

### 예제 10: 파이프라인 (여러 변환)

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "numbers",
      "value_type": "Array<i32>",
      "value": {
        "type": "array",
        "elements": [
          {"type": "literal", "value_type": "i32", "value": 1},
          {"type": "literal", "value_type": "i32", "value": 2},
          {"type": "literal", "value_type": "i32", "value": 3},
          {"type": "literal", "value_type": "i32", "value": 4},
          {"type": "literal", "value_type": "i32", "value": 5}
        ]
      }
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
    },
    {
      "type": "call",
      "function": "Array.map",
      "args": [
        {"type": "ref", "name": "filtered"},
        {
          "type": "lambda",
          "params": [{"name": "x", "type": "i32"}],
          "body": [
            {
              "type": "arithmetic",
              "operator": "*",
              "left": {"type": "ref", "name": "x"},
              "right": {"type": "literal", "value_type": "i32", "value": 10}
            }
          ]
        }
      ],
      "assign_to": "result"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "result"}]
    }
  ]
}
```

**출력:**
```
[30, 40, 50]
```

---

## 📝 Markdown 생성 예제

### 예제 11: 자동 문서 생성

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "call",
      "function": "Markdown.create",
      "args": [],
      "assign_to": "doc"
    },
    {
      "type": "call",
      "function": "Markdown.heading",
      "args": [
        {"type": "ref", "name": "doc"},
        {"type": "literal", "value_type": "i32", "value": 1},
        {"type": "literal", "value_type": "string", "value": "API 문서"}
      ],
      "assign_to": "doc"
    },
    {
      "type": "call",
      "function": "Markdown.paragraph",
      "args": [
        {"type": "ref", "name": "doc"},
        {"type": "literal", "value_type": "string", "value": "이것은 자동 생성된 문서입니다."}
      ],
      "assign_to": "doc"
    },
    {
      "type": "call",
      "function": "Markdown.build",
      "args": [{"type": "ref", "name": "doc"}],
      "assign_to": "markdown"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "markdown"}]
    }
  ]
}
```

**출력:**
```
# API 문서

이것은 자동 생성된 문서입니다.
```

---

## 💾 파일 I/O 예제

### 예제 12: 파일 읽기 및 처리

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "call",
      "function": "FS.read",
      "args": [{"type": "literal", "value_type": "string", "value": "data.txt"}],
      "assign_to": "content"
    },
    {
      "type": "call",
      "function": "String.split",
      "args": [
        {"type": "ref", "name": "content"},
        {"type": "literal", "value_type": "string", "value": "\n"}
      ],
      "assign_to": "lines"
    },
    {
      "type": "call",
      "function": "Array.map",
      "args": [
        {"type": "ref", "name": "lines"},
        {
          "type": "lambda",
          "params": [{"name": "line", "type": "string"}],
          "body": [
            {
              "type": "call",
              "function": "String.upper",
              "args": [{"type": "ref", "name": "line"}]
            }
          ]
        }
      ],
      "assign_to": "uppercase_lines"
    },
    {
      "type": "call",
      "function": "print",
      "args": [{"type": "ref", "name": "uppercase_lines"}]
    }
  ]
}
```

---

## 🌐 Notion 통합 예제

### 예제 13: 자동 블로그 포스팅

```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "var",
      "name": "title",
      "value_type": "string",
      "value": "AI 실험 결과"
    },
    {
      "type": "call",
      "function": "Markdown.create",
      "args": [],
      "assign_to": "doc"
    },
    {
      "type": "call",
      "function": "Markdown.heading",
      "args": [
        {"type": "ref", "name": "doc"},
        {"type": "literal", "value_type": "i32", "value": 1},
        {"type": "ref", "name": "title"}
      ],
      "assign_to": "doc"
    },
    {
      "type": "call",
      "function": "Markdown.build",
      "args": [{"type": "ref", "name": "doc"}],
      "assign_to": "content"
    },
    {
      "type": "call",
      "function": "Notion.post",
      "args": [
        {
          "type": "object",
          "properties": {
            "title": {"type": "ref", "name": "title"},
            "content": {"type": "ref", "name": "content"},
            "tags": {
              "type": "array",
              "elements": [
                {"type": "literal", "value_type": "string", "value": "ai"},
                {"type": "literal", "value_type": "string", "value": "experiment"}
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🚀 실행 방법

```bash
# 1. JSON 파일 저장
cat > example.json << 'EOF'
{
  "version": "6.0",
  "instructions": [...]
}
EOF

# 2. 컴파일 & 실행
node src/compiler.js example.json
```

---

**상태**: 예제 모음 완료
**추가 예제**: 요청에 따라 추가

