# CLAUDELang v6.0 Notion 포스팅 빠른 시작 가이드

5분 안에 CLAUDELang 예제를 실행하고 Notion에 발행하는 방법입니다.

## 1단계: 테스트 (1분)

```bash
node test-notion-posting.js
```

결과: 14개 예제 모두 성공 (100.0%)

## 2단계: Notion 설정 (2분)

```bash
# 환경 변수 설정
export NOTION_DATA_SOURCE_ID="your-data-source-id"

# 확인
echo $NOTION_DATA_SOURCE_ID
```

## 3단계: 배치 포스팅 (2분)

```bash
# 모든 예제 포스팅
node src/notion-poster.js batch ./examples
```

결과:
- 14개 예제 Notion에 발행
- 요약 보고서 생성

## 확인

```bash
# 결과 확인
cat auto-post-results/BATCH_SUMMARY.md

# Notion 확인
# → CLAUDELang Results 데이터베이스 열기
# → 새로 생성된 페이지들 확인
```

더 자세한 내용은 [NOTION-POSTING.md](./NOTION-POSTING.md)를 참고하세요.
