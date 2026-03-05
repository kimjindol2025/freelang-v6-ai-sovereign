# 🔧 Gogs API 참고 자료

create-project.sh에서 사용하는 Gogs API 엔드포인트들입니다.

## 📍 기본 정보

- **베이스 URL:** `https://gogs.dclub.kr/api/v1`
- **인증:** Token 기반 (Authorization 헤더)
- **응답:** JSON 형식

## 🔐 인증

```bash
# 헤더에 토큰 추가
curl -H "Authorization: token YOUR_TOKEN" https://gogs.dclub.kr/api/v1/user
```

## 📦 저장소 관리

### 저장소 생성

```bash
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"

curl -X POST https://gogs.dclub.kr/api/v1/user/repos \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-project",
    "description": "프로젝트 설명",
    "private": false
  }'
```

**응답 예:**
```json
{
  "id": 12491,
  "name": "my-project",
  "full_name": "kim/my-project",
  "html_url": "https://gogs.dclub.kr/kim/my-project",
  "clone_url": "https://gogs.dclub.kr/kim/my-project.git",
  "ssh_url": "ssh://kim@gogs.dclub.kr:2223/kim/my-project.git"
}
```

### 저장소 목록

```bash
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"

# 자신의 저장소
curl -H "Authorization: token $TOKEN" \
  https://gogs.dclub.kr/api/v1/user/repos

# 특정 사용자의 저장소
curl https://gogs.dclub.kr/api/v1/users/kim/repos
```

### 저장소 정보 조회

```bash
curl https://gogs.dclub.kr/api/v1/repos/kim/my-project
```

### 저장소 삭제

```bash
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"

curl -X DELETE https://gogs.dclub.kr/api/v1/repos/kim/my-project \
  -H "Authorization: token $TOKEN"
```

## 👤 사용자 정보

### 현재 사용자

```bash
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"

curl -H "Authorization: token $TOKEN" \
  https://gogs.dclub.kr/api/v1/user
```

**응답 예:**
```json
{
  "id": 4,
  "username": "kim",
  "login": "kim",
  "email": "kim@example.com",
  "avatar_url": "https://secure.gravatar.com/avatar/...",
  "full_name": ""
}
```

## 🔄 Git 작업

### 브랜치 목록

```bash
curl https://gogs.dclub.kr/api/v1/repos/kim/my-project/branches
```

### 커밋 목록

```bash
curl https://gogs.dclub.kr/api/v1/repos/kim/my-project/commits
```

### 특정 파일 조회

```bash
curl https://gogs.dclub.kr/api/v1/repos/kim/my-project/contents/README.md
```

## 🐛 에러 코드

| 코드 | 설명 | 해결책 |
|------|------|--------|
| **401** | Unauthorized | 토큰 확인 |
| **403** | Forbidden | 권한 확인 |
| **404** | Not Found | 저장소명 확인 |
| **409** | Conflict | 저장소 이미 존재 |
| **500** | Server Error | Gogs 서버 상태 확인 |

## 📊 자동화 스크립트에서 사용

### create-project.sh에서

```bash
# 저장소 생성 API 호출
curl -X POST "$GOGS_API/user/repos" \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$PROJECT_NAME\", \"description\": \"$PROJECT_DESC\"}"
```

이 API를 호출하여:
1. 저장소 생성
2. 응답에서 저장소 정보 추출
3. Git remote 설정
4. 초기 푸시

---

더 자세한 Gogs API 문서는 [Gogs 공식 문서](https://gogs.io/docs/api)를 참고하세요.
