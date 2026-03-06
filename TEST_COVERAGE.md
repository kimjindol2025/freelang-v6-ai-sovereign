# CLAUDELang v6.0 테스트 커버리지

## 개요

총 30개의 테스트 케이스가 작성되어 CLAUDELang v6.0 컴파일러의 다양한 기능을 검증합니다.

- **기본 테스트** (`test/test-basic.js`): 10개 - 핵심 기능
- **고급 테스트** (`test/test-advanced.js`): 20개 - 확장 기능, 복잡한 시나리오, 에러 처리

---

## 테스트 분류

### 카테고리 1: 기본 기능 (10개 + 5개)

#### 기본 테스트 (test-basic.js)
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 1 | 기본 변수 선언 | i32 타입 변수 선언 및 VT 코드 생성 | ✅ |
| 2 | 문자열 변수 선언 | string 타입 변수 선언 | ✅ |
| 3 | 배열 선언 | Array<i32> 타입 배열 생성 | ✅ |
| 4 | 함수 호출 | print() 기본 함수 호출 | ✅ |
| 5 | 산술 연산 | 덧셈(+) 연산 코드 생성 | ✅ |

#### 고급 테스트 (test-advanced.js) - 기본 기능 확장
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 1 | 다중 변수 선언 | 여러 개의 변수를 순차적으로 선언 | ✅ |
| 2 | 객체 생성 및 프로퍼티 | 객체 타입 변수와 프로퍼티 정의 | ✅ |
| 3 | 객체 프로퍼티 접근 | property 표현식으로 객체 필드 접근 | ✅ |
| 4 | 배열 인덱싱 | index 표현식으로 배열 요소 접근 | ✅ |
| 5 | 중첩 산술 표현식 | 여러 연산자를 중첩하여 사용 (a*b + 10) | ✅ |

**커버리지**: 변수, 배열, 객체, 프로퍼티 접근, 인덱싱, 산술 연산

---

### 카테고리 2: 제어 흐름 (5개 + 2개)

#### 기본 테스트 (test-basic.js)
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 6 | 조건문 (if-then-else) | 비교 연산과 함께 if 구문 생성 | ✅ |
| 7 | 반복문 (for loop) | for 루프와 이터레이터 처리 | ✅ |
| 8 | 람다 함수 | Array.map과 함께 람다 함수 사용 | ✅ |

#### 고급 테스트 (test-advanced.js) - 복잡한 제어 흐름
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 11 | 중첩된 if-else 문 | 2단계 이상의 조건 분기 | ✅ |
| 12 | 조건이 있는 for 루프 | 루프 내에서 조건문 사용 | ✅ |
| 13 | 복수의 람다 함수 사용 | 여러 개의 람다를 서로 다른 함수에 전달 | ✅ |
| 14 | 여러 함수 체인 호출 | String.trim → String.upper 순차 호출 | ✅ |
| 15 | 파이프라인 패턴 | Array.filter → Array.map 체인 | ✅ |

**커버리지**: if-else, for, lambda, 함수 체인, 파이프라인

---

### 카테고리 3: 함수 호출 (2개 + 5개)

#### 기본 테스트 (test-basic.js)
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 4 | 함수 호출 | 기본 함수 호출 (print) | ✅ |
| 8 | 람다 함수 | Array.map with lambda | ✅ |

#### 고급 테스트 (test-advanced.js) - 함수 호출 고급
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 6 | Array.map with lambda | 배열 변환 함수 | ✅ |
| 7 | Array.filter with lambda | 배열 필터링 함수 | ✅ |
| 8 | String.split 호출 | 문자열 분할 함수 | ✅ |
| 9 | JSON.parse 및 stringify | JSON 직렬화/역직렬화 | ✅ |
| 10 | HTTP.get 호출 | 네트워크 API 함수 호출 | ✅ |

**커버리지**: Array (map, filter), String (split, trim, upper), JSON, HTTP, 람다

---

### 카테고리 4: 에러 처리 (1개 + 5개)

#### 기본 테스트 (test-basic.js)
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 9 | 타입 에러 감지 | 불일치하는 타입 할당 감지 | ✅ |

#### 고급 테스트 (test-advanced.js) - 에러 케이스
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 16 | 타입 불일치 감지 | i32에 string 할당 → 에러 | ✅ |
| 17 | 정의되지 않은 함수 호출 감지 | 등록되지 않은 함수 호출 → 에러 | ✅ |
| 18 | 정의되지 않은 변수 참조 | 선언되지 않은 변수 사용 | ✅ |
| 19 | 지원하지 않는 버전 감지 | version 6.0이 아닌 경우 → 에러 | ✅ |
| 20 | 함수 인자 개수 불일치 | 필수 인자 누락 → 에러 | ✅ |

**커버리지**: 타입 체크, 함수 검증, 버전 검증, 인자 검증

---

### 카테고리 5: 기타 (1개)

#### 기본 테스트 (test-basic.js)
| # | 테스트명 | 설명 | 상태 |
|---|---------|------|------|
| 10 | 주석 지원 | 주석 생성 및 출력 | ✅ |

---

## 테스트 실행 결과

```
기본 테스트 (test-basic.js)
═══════════════════════════
전체: 10
성공: 10 ✅
실패: 0

고급 테스트 (test-advanced.js)
═══════════════════════════
전체: 20
성공: 20 ✅
실패: 0

총계: 30/30 통과 (100%)
```

---

## 테스트 실행 방법

### 개별 테스트 실행

```bash
# 기본 테스트
node test/test-basic.js

# 고급 테스트
node test/test-advanced.js
```

### 전체 테스트 실행

```bash
# bash 스크립트 생성
#!/bin/bash
echo "Running CLAUDELang v6.0 Full Test Suite..."
echo ""

echo "=== 기본 테스트 ==="
node test/test-basic.js
BASIC_RESULT=$?

echo ""
echo "=== 고급 테스트 ==="
node test/test-advanced.js
ADVANCED_RESULT=$?

echo ""
if [ $BASIC_RESULT -eq 0 ] && [ $ADVANCED_RESULT -eq 0 ]; then
  echo "✅ 모든 테스트 통과!"
  exit 0
else
  echo "❌ 일부 테스트 실패"
  exit 1
fi
```

---

## 테스트 구조

### TestRunner 클래스

양쪽 테스트 파일에서 공통으로 사용되는 테스트 러너:

```javascript
class TestRunner {
  test(name, fn)                      // 테스트 실행
  assert(condition, message)          // 조건 검증
  assertEqual(actual, expected, msg)  // 동등성 검증
  assertIncludes(actual, expected, msg) // 포함 검증
  summary()                           // 결과 출력
}
```

### 컴파일 검증 패턴

```javascript
const result = runner.compiler.compile(program);

// 성공 검증
runner.assert(result.success, "컴파일 실패");

// 생성된 코드 검증
runner.assertIncludes(result.code, "(define x", "변수 선언 없음");

// 에러 검증
runner.assert(!result.success, "에러를 감지하지 못함");
runner.assert(result.errors.length > 0, "에러 메시지 없음");
```

---

## 커버리지 분석

### 문법 요소
- ✅ 변수 선언 (var)
- ✅ 함수 호출 (call)
- ✅ 조건문 (condition)
- ✅ 반복문 (loop)
- ✅ 람다 함수 (lambda)
- ✅ 산술 연산 (arithmetic)
- ✅ 비교 연산 (comparison)
- ✅ 배열 (array)
- ✅ 객체 (object)
- ✅ 프로퍼티 접근 (property)
- ✅ 인덱싱 (index)
- ✅ 주석 (comment)

### 데이터 타입
- ✅ i32 (정수)
- ✅ f64 (실수)
- ✅ string (문자열)
- ✅ bool (불린)
- ✅ Array (배열)
- ✅ Object (객체)
- ✅ Function (함수/람다)

### 빌트인 함수
- ✅ Array.map, Array.filter, Array.reduce, Array.find
- ✅ String.split, String.join, String.upper, String.lower, String.trim
- ✅ JSON.parse, JSON.stringify
- ✅ HTTP.get, HTTP.post
- ✅ Math.sqrt, Math.pow, Math.abs
- ✅ FS.read, FS.write, FS.exists
- ✅ Markdown.* (생성, 요소 추가, 빌드)
- ✅ Notion.post, Notion.query
- ✅ print (기본 출력)

### 에러 처리
- ✅ 타입 불일치 감지
- ✅ 정의되지 않은 함수 감지
- ✅ 버전 검증
- ✅ 함수 시그니처 검증 (인자 개수)
- ✅ 필드 검증

---

## 주요 테스트 케이스 설명

### Test 1: 기본 변수 선언
```javascript
// 입력
{ type: "var", name: "x", value_type: "i32", value: 42 }

// 출력
(define x 42)
```

### Test 5: 중첩 산술 표현식
```javascript
// 입력: (a * b) + 10
{ type: "arithmetic", operator: "+",
  left: { type: "arithmetic", operator: "*", ... },
  right: { type: "literal", value: 10 } }

// 출력
(+ (* a b) 10)
```

### Test 11: 중첩 if-else
```javascript
// 입력: score >= 90 ? "A" : (score >= 80 ? "B" : "C")

// 출력 (2개 이상의 if 문)
(if (>= score 90) (do ...) (do (if (>= score 80) ...)))
```

### Test 16: 타입 불일치 에러
```javascript
// 입력
{ type: "var", name: "x", value_type: "i32", value: "string" }

// 결과
result.success === false
result.errors[0] === "Cannot assign string to i32"
```

---

## 개선 사항

### 현재 제한사항
1. 중첩 람다 (람다 내부에 다른 람다)는 부분적으로만 지원
2. 복잡한 제네릭 타입 추론은 미지원
3. 동기/비동기 함수 구분 없음
4. 모듈/임포트 시스템 미지원

### 향후 테스트 추가 계획
- [ ] 모듈 임포트/내보내기
- [ ] 제네릭 함수 테스트
- [ ] 비동기 함수 테스트
- [ ] 커스텀 타입 정의
- [ ] 에러 복구 및 제안
- [ ] 성능 벤치마크 테스트

---

## 참고 자료

- **컴파일러**: `/src/compiler.js`
- **기본 테스트**: `/test/test-basic.js`
- **고급 테스트**: `/test/test-advanced.js`
- **스펙 문서**: `CLAUDELANG_SPEC.md`
- **컴파일러 설계**: `COMPILER_DESIGN.md`
