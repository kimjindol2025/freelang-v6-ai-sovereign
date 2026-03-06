# 📚 CLAUDELang v6.0 실행 예제

11개의 완전히 실행 가능한 CLAUDELang 예제 모음

## 파일 목록

```
examples/
├── simple.json                      (395 B)   - 기본: Hello World
├── data-filtering.json              (1.9 KB) - 배열 필터링 (짝수)
├── data-mapping.json                (1.5 KB) - 배열 변환 (제곱값)
├── data-aggregation.json            (1.6 KB) - 배열 집계 (합계)
├── string-split.json                (1.4 KB) - 문자열 분할
├── string-transformation.json       (2.1 KB) - 문자열 변환 (대문자+포맷)
├── csv-parsing.json                 (2.9 KB) - CSV 파싱
├── conditional-workflow.json        (4.2 KB) - 조건부 흐름 (학점판정)
├── loop-with-condition.json         (2.3 KB) - 온도 필터링
├── nested-operations.json           (3.6 KB) - 행렬 연산 (중첩)
└── api-response-processing.json     (4.6 KB) - API 응답 처리
```

## 빠른 시작

### 1. 가장 간단한 예제
```bash
cat examples/simple.json
```

### 2. 배열 처리 기초
```bash
cat examples/data-filtering.json     # Array.filter()
cat examples/data-mapping.json       # Array.map()
cat examples/data-aggregation.json   # Array.reduce()
```

### 3. 문자열 처리
```bash
cat examples/string-split.json       # 분할
cat examples/string-transformation.json # 변환
cat examples/csv-parsing.json        # CSV 파싱
```

### 4. 복잡한 로직
```bash
cat examples/conditional-workflow.json   # if-else
cat examples/loop-with-condition.json    # 필터 + 통계
cat examples/nested-operations.json      # 2차원 배열
cat examples/api-response-processing.json # 객체 배열
```

## 예제별 학습 목표

| 파일 | 학습 목표 | 핵심 함수 |
|------|-----------|----------|
| simple.json | 기본 문법 | var, call, print |
| data-filtering.json | 필터링 | Array.filter(), lambda |
| data-mapping.json | 변환 | Array.map() |
| data-aggregation.json | 축약 | Array.reduce() |
| string-split.json | 분할 | String.split(), String.trim() |
| string-transformation.json | 포맷팅 | String.to_upper(), String.concat() |
| csv-parsing.json | 다층 파싱 | Array.get(), Array.slice() |
| conditional-workflow.json | 조건 분기 | condition (if-else-if) |
| loop-with-condition.json | 통계 계산 | Array.length(), reduce |
| nested-operations.json | 중첩 처리 | 2D Array, map+reduce |
| api-response-processing.json | 실무 시나리오 | Object[], property_access |

## 공통 패턴

### 배열 처리 체인
```json
{
  "type": "call",
  "function": "Array.filter",  // 필터링
  "args": [
    {"type": "ref", "name": "data"},
    {"type": "lambda", ...}
  ],
  "assign_to": "filtered"
}
→ 
{
  "type": "call",
  "function": "Array.map",     // 변환
  "args": [
    {"type": "ref", "name": "filtered"},
    {"type": "lambda", ...}
  ],
  "assign_to": "transformed"
}
```

### 조건부 처리
```json
{
  "type": "condition",
  "test": {"type": "comparison", "operator": ">=", ...},
  "then": [...],    // true일 때
  "else": [...]     // false일 때
}
```

### 람다 함수
```json
{
  "type": "lambda",
  "params": ["item"],           // 매개변수
  "body": [...]                 // 함수 본체
}
```

## 검증 결과

```
✓ 모든 파일 JSON 유효성 확인됨
✓ 모든 예제 컴파일 가능
✓ 1,042줄 총 코드
✓ 11개 예제 카테고리별 분류
```

## 다음 단계

1. **simple.json부터 시작** - 기본 문법 이해
2. **데이터 처리 예제** - filter, map, reduce 숙달
3. **문자열 처리 예제** - split, concat 활용
4. **복잡한 로직** - 조건, 반복, 중첩 이해
5. **api-response-processing.json** - 실무 시나리오 연습

## 주의사항

- 모든 예제는 **v6.0 호환**
- JSON 형식 유지 필수
- 함수명과 파라미터 개수 정확히 따라야 함
- 타입 명시 필수 (value_type)

## 추가 리소스

- CLAUDELANG_SPEC.md - 언어 정의
- JSON_SCHEMA.md - 정확한 스키마
- EXAMPLES.md - 자세한 설명

---

**상태**: 2026-03-06 완성
**총 예제**: 11개
**총 코드**: 1,042줄
**검증 상태**: 모두 유효한 JSON ✓
