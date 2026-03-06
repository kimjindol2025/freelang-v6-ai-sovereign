# 📚 CLAUDELang v6.0 예제 모음

**실행 가능한 11개 예제 (1,042줄)**

---

## 📋 예제 목록

| # | 파일명 | 주제 | 설명 |
|---|--------|------|------|
| 1 | `simple.json` | 기본 | 변수 선언 및 출력 (Hello World) |
| 2 | `data-filtering.json` | 데이터 처리 | 배열 필터링 (짝수 추출) |
| 3 | `data-mapping.json` | 데이터 처리 | 배열 변환 (제곱값 계산) |
| 4 | `data-aggregation.json` | 데이터 처리 | 배열 집계 (합계 계산 with reduce) |
| 5 | `string-split.json` | 문자열 처리 | 문자열 분할 (CSV 파싱) |
| 6 | `string-transformation.json` | 문자열 처리 | 문자열 변환 (대문자 + 포맷팅) |
| 7 | `csv-parsing.json` | 문자열 처리 | CSV 파싱 (헤더/데이터 분리) |
| 8 | `conditional-workflow.json` | 복잡한 로직 | 조건부 흐름 (학점 판정) |
| 9 | `loop-with-condition.json` | 복잡한 로직 | 조건부 반복 (온도 필터링) |
| 10 | `nested-operations.json` | 복잡한 로직 | 중첩 작업 (행렬 연산) |
| 11 | `api-response-processing.json` | 실무 시뮬레이션 | API 응답 처리 (사용자 데이터) |

---

## 🔷 예제별 상세 설명

### 예제 1: simple.json (기본)

**목적**: 변수 선언 및 함수 호출 기본 문법

**파일**: `/examples/simple.json`

**코드:**
```json
{
  "version": "6.0",
  "instructions": [
    {
      "type": "comment",
      "text": "CLAUDELang v6.0 첫 번째 프로그램"
    },
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

**학습 포인트**:
- ✓ `version` 필드 설정
- ✓ 문자열 변수 선언
- ✓ 함수 호출 및 참조

**출력:**
```
Hello, CLAUDELang!
```

---

### 예제 2: data-filtering.json (배열 필터링)

**목적**: 조건을 만족하는 배열 요소만 추출

**파일**: `/examples/data-filtering.json`

**주요 기능**:
- 정수 배열 선언
- `Array.filter()` 함수 사용
- 람다 함수로 필터 조건 정의 (짝수: `n % 2 == 0`)

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "Array.filter",
  "args": [
    {"type": "ref", "name": "numbers"},
    {
      "type": "lambda",
      "params": ["n"],
      "body": [
        {
          "type": "comparison",
          "operator": "==",
          "left": {
            "type": "arithmetic",
            "operator": "%",
            "left": {"type": "ref", "name": "n"},
            "right": {"type": "literal", "value_type": "i32", "value": 2}
          },
          "right": {"type": "literal", "value_type": "i32", "value": 0}
        }
      ]
    }
  ],
  "assign_to": "even_numbers"
}
```

**학습 포인트**:
- ✓ 배열 선언 (`Array<i32>`)
- ✓ 람다 함수 문법
- ✓ 산술/비교 연산자
- ✓ 함수 반환값 할당

**예상 출력:**
```
[2, 4, 6, 8]
```

---

### 예제 3: data-mapping.json (배열 변환)

**목적**: 배열의 각 요소를 변환 (제곱값 계산)

**파일**: `/examples/data-mapping.json`

**주요 기능**:
- `Array.map()` 함수 사용
- 람다 함수로 변환 로직 정의 (`n * n`)

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "Array.map",
  "args": [
    {"type": "ref", "name": "numbers"},
    {
      "type": "lambda",
      "params": ["n"],
      "body": [
        {
          "type": "arithmetic",
          "operator": "*",
          "left": {"type": "ref", "name": "n"},
          "right": {"type": "ref", "name": "n"}
        }
      ]
    }
  ],
  "assign_to": "squared_numbers"
}
```

**학습 포인트**:
- ✓ map() vs filter() 차이
- ✓ 람다 매개변수 활용
- ✓ 산술 연산 중첩

**예상 출력:**
```
[1, 4, 9, 16, 25]
```

---

### 예제 4: data-aggregation.json (배열 집계)

**목적**: 배열의 모든 요소를 하나의 값으로 축약 (reduce)

**파일**: `/examples/data-aggregation.json`

**주요 기능**:
- `Array.reduce()` 함수 사용
- 초기값(accumulator) 설정
- 람다 함수로 누적 로직 정의

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "Array.reduce",
  "args": [
    {"type": "ref", "name": "numbers"},
    {"type": "ref", "name": "initial_sum"},
    {
      "type": "lambda",
      "params": ["acc", "current"],
      "body": [
        {
          "type": "arithmetic",
          "operator": "+",
          "left": {"type": "ref", "name": "acc"},
          "right": {"type": "ref", "name": "current"}
        }
      ]
    }
  ],
  "assign_to": "sum"
}
```

**학습 포인트**:
- ✓ reduce() 패턴 (누적값 + 현재값)
- ✓ 람다 함수 2개 매개변수
- ✓ 초기값 의미

**예상 출력:**
```
100
```

---

### 예제 5: string-split.json (문자열 분할)

**목적**: 구분자로 문자열을 배열로 분할

**파일**: `/examples/string-split.json`

**주요 기능**:
- `String.split()` 함수
- `String.trim()` 함수 (공백 제거)
- map으로 배열 전체 처리

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "String.split",
  "args": [
    {"type": "ref", "name": "csv_line"},
    {"type": "literal", "value_type": "string", "value": ","}
  ],
  "assign_to": "items"
}
```

**학습 포인트**:
- ✓ 문자열 함수 사용
- ✓ 구분자 처리
- ✓ 다단계 변환 (split → trim)

**예상 출력:**
```
["apple", "banana", "cherry", "date"]
```

---

### 예제 6: string-transformation.json (문자열 변환)

**목적**: 문자열 포맷팅 (대문자 + 접두/접미사)

**파일**: `/examples/string-transformation.json`

**주요 기능**:
- `String.to_upper()` 함수
- `String.concat()` 함수 (3개 인자)
- 연쇄적 map 호출

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "String.concat",
  "args": [
    {"type": "literal", "value_type": "string", "value": "["},
    {"type": "ref", "name": "word"},
    {"type": "literal", "value_type": "string", "value": "]"}
  ]
}
```

**학습 포인트**:
- ✓ 여러 인자 concat()
- ✓ 다중 map() 체이닝
- ✓ 문자열 함수 조합

**예상 출력:**
```
["[HELLO]", "[WORLD]", "[CLAUDELANG]"]
```

---

### 예제 7: csv-parsing.json (CSV 파싱)

**목적**: CSV 형식 데이터를 구조화된 배열로 변환

**파일**: `/examples/csv-parsing.json`

**주요 기능**:
- 다층 분할 (줄 → 열)
- `Array.get()` 함수 (인덱싱)
- `Array.slice()` 함수 (부분 추출)
- 복잡한 루프 구조

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "String.split",
  "args": [
    {"type": "ref", "name": "csv_data"},
    {"type": "literal", "value_type": "string", "value": "\n"}
  ],
  "assign_to": "rows"
},
{
  "type": "call",
  "function": "Array.slice",
  "args": [
    {"type": "ref", "name": "rows"},
    {"type": "literal", "value_type": "i32", "value": 1}
  ],
  "assign_to": "data_rows"
}
```

**학습 포인트**:
- ✓ 2단계 파싱
- ✓ 배열 인덱싱/슬라이싱
- ✓ 헤더 분리
- ✓ 데이터 행 추출

**예상 출력:**
```
Headers: ["name", "age", "city"]
Data rows: [["Alice", "30", "Seoul"], ["Bob", "25", "Busan"], ...]
```

---

### 예제 8: conditional-workflow.json (조건부 흐름)

**목적**: 다중 조건으로 데이터 변환 (점수 → 학점)

**파일**: `/examples/conditional-workflow.json`

**주요 기능**:
- 중첩된 `condition` 명령어
- 범위 기반 비교 (>=)
- loop로 배열 순회

**코드 스니펫:**
```json
{
  "type": "condition",
  "test": {
    "type": "comparison",
    "operator": ">=",
    "left": {"type": "ref", "name": "score"},
    "right": {"type": "literal", "value_type": "i32", "value": 90}
  },
  "then": [
    {"type": "literal", "value_type": "string", "value": "A"}
  ],
  "else": [
    // 더 많은 condition...
  ]
}
```

**학습 포인트**:
- ✓ if-else-if 패턴
- ✓ 조건부 블록 (then/else)
- ✓ loop와 condition 조합

**예상 출력:**
```
Score -> Grade mapping:
95 -> A
87 -> B
72 -> C
65 -> F
58 -> F
```

---

### 예제 9: loop-with-condition.json (조건부 반복)

**목적**: 배열에서 조건을 만족하는 항목 찾기 및 통계

**파일**: `/examples/loop-with-condition.json`

**주요 기능**:
- `Array.filter()` 조건 필터링
- `Array.length()` 개수 계산
- 결과 통계 출력

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "Array.filter",
  "args": [
    {"type": "ref", "name": "temperatures"},
    {
      "type": "lambda",
      "params": ["temp"],
      "body": [
        {
          "type": "comparison",
          "operator": ">=",
          "left": {"type": "ref", "name": "temp"},
          "right": {"type": "literal", "value_type": "i32", "value": 25}
        }
      ]
    }
  ],
  "assign_to": "high_temps"
}
```

**학습 포인트**:
- ✓ 조건부 필터링
- ✓ 길이 계산
- ✓ 통계 출력

**예상 출력:**
```
Temperatures >= 25 degrees:
[28, 35, 30]
Count: 3
```

---

### 예제 10: nested-operations.json (중첩 작업)

**목적**: 다차원 배열(행렬) 처리

**파일**: `/examples/nested-operations.json`

**주요 기능**:
- 2차원 배열 선언
- map 안에 reduce 중첩
- 이중 람다 함수

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "Array.map",
  "args": [
    {"type": "ref", "name": "matrix"},
    {
      "type": "lambda",
      "params": ["row"],
      "body": [
        {
          "type": "call",
          "function": "Array.reduce",
          "args": [
            {"type": "ref", "name": "row"},
            {"type": "literal", "value_type": "i32", "value": 0},
            {
              "type": "lambda",
              "params": ["acc", "val"],
              "body": [...]
            }
          ]
        }
      ]
    }
  ],
  "assign_to": "row_sums"
}
```

**학습 포인트**:
- ✓ 다차원 배열 구조
- ✓ 중첩 함수 호출
- ✓ 이중 reduce 패턴
- ✓ 행 및 전체 합계

**예상 출력:**
```
Row sums: [6, 15, 24]
Total sum: 45
```

---

### 예제 11: api-response-processing.json (API 응답 처리)

**목적**: API 응답 JSON을 필터링 및 집계 (실무 시나리오)

**파일**: `/examples/api-response-processing.json`

**주요 기능**:
- 객체 배열 선언
- 논리값(boolean) 필터링
- 프로퍼티 접근 (property_access)
- 복합 통계 계산

**코드 스니펫:**
```json
{
  "type": "call",
  "function": "Array.filter",
  "args": [
    {"type": "ref", "name": "api_response"},
    {
      "type": "lambda",
      "params": ["user"],
      "body": [
        {
          "type": "property_access",
          "object": {"type": "ref", "name": "user"},
          "property": "active"
        }
      ]
    }
  ],
  "assign_to": "active_users"
}
```

**학습 포인트**:
- ✓ 객체 배열 선언 (`Array<Object>`)
- ✓ 프로퍼티 접근 문법
- ✓ 객체 필터링
- ✓ 평균값 계산

**예상 출력:**
```
Active users: ["Alice", "Charlie"]
Average age of active users: 32
```

---

## 🛠️ 컴파일 및 실행

### 기본 구조 검증

모든 예제는 다음 규칙을 따릅니다:
```
1. version: "6.0" 필수
2. instructions: 배열 필수
3. 모든 JSON 유효성 확인됨
```

### 검증 완료

✓ 11개 파일 모두 유효한 JSON
✓ 총 1,042줄 코드
✓ 모든 예제 컴파일 가능

---

## 📊 학습 경로

**초급**: simple.json → data-mapping.json → data-filtering.json
**중급**: data-aggregation.json → string-split.json → conditional-workflow.json
**고급**: csv-parsing.json → nested-operations.json → api-response-processing.json

---

## 🎯 기술 범위

| 기술 | 예제 |
|------|------|
| 변수 선언 | 모든 예제 |
| 람다 함수 | 2-11 |
| 배열 조작 | 2-5, 8-11 |
| 문자열 처리 | 5-7 |
| 조건문 | 8-9 |
| 객체 처리 | 11 |
| 프로퍼티 접근 | 11 |
| 복합 로직 | 10-11 |

---

## 📝 주석 (Comment) 사용
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

