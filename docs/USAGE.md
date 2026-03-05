# 📖 완벽한 사용 가이드

## 📋 목차

1. [기본 사용법](#기본-사용법)
2. [스크립트 상세](#스크립트-상세)
3. [자동 동기화](#자동-동기화)
4. [모니터링](#모니터링)
5. [고급 기능](#고급-기능)
6. [베스트 프랙티스](#베스트-프랙티스)

---

## 기본 사용법

### Step 1: 프로젝트 생성

```bash
cd /home/kimjin/claude-automation

# 기본 명령
./create-project.sh "프로젝트명" "설명" [타입]

# 필수: 프로젝트명, 설명
# 선택: 타입 (기본값: service)
```

**예제:**

```bash
# Express API
./create-project.sh "express-api" "REST API 서버" api

# React 앱
./create-project.sh "react-dashboard" "관리자 대시보드" web

# CLI 도구
./create-project.sh "crypto-cli" "암호화 도구" cli

# 라이브러리
./create-project.sh "utils-lib" "유틸리티 라이브러리" library

# 데몬
./create-project.sh "log-daemon" "로그 수집 데몬" daemon
```

### Step 2: 자동 생성되는 구조

```
/home/kimjin/프로젝트명/
├── .git/                    # Git 저장소
│   └── hooks/
│       └── post-commit      # 자동 푸시 hook ⭐
├── .project-info            # 프로젝트 메타데이터
├── README.md                # 자동 생성된 문서
└── (your code)              # 작성한 코드
```

### Step 3: 코드 작성

Claude Code에서 파일을 생성하거나 수정합니다:

```bash
cd /home/kimjin/프로젝트명

# Claude Code에서 작업:
# - Edit: 기존 파일 수정
# - Write: 새 파일 생성
```

### Step 4: 자동 동기화

```bash
# 변경사항 추가
git add .

# 커밋 (자동으로 Gogs로 푸시됨!)
git commit -m "feat: 기능 추가"
git commit -m "fix: 버그 수정"
git commit -m "docs: 문서 업데이트"
```

---

## 스크립트 상세

### create-project.sh

**목적**: 새 프로젝트를 한 번에 생성 및 설정

**5단계 프로세스:**

1. **입력 검증**
   - 프로젝트명: 영문, 숫자, `-`, `_` 만 허용
   - 타입: 미리 정의된 6가지 중 선택

2. **폴더 생성**
   - `/home/kimjin/프로젝트명` 디렉토리 생성

3. **Git 초기화**
   - `git init` 실행
   - 사용자 이름/이메일 설정
   - `README.md` 및 `.project-info` 생성
   - 초기 커밋

4. **Gogs 저장소 생성**
   - API로 자동 저장소 생성
   - 기존 저장소면 자동 감지

5. **동기화 설정**
   - Post-commit hook 설정
   - Remote 연결
   - 초기 푸시

**사용법:**

```bash
./create-project.sh "my-project" "설명" web
```

**타입 목록:**

```
web      - 웹 애플리케이션
api      - REST API 서버
cli      - 명령줄 도구
library  - 라이브러리
service  - 서비스
daemon   - 데몬
```

### monitor-sync.sh

**목적**: 모든 프로젝트의 동기화 상태 확인 및 관리

**모드:**

```bash
# 1. 대시보드 (모든 프로젝트 상태)
./monitor-sync.sh

# 2. 특정 프로젝트
./monitor-sync.sh my-project

# 3. 모든 프로젝트 동기화
./monitor-sync.sh sync

# 4. Gogs 저장소 목록
./monitor-sync.sh list
```

**출력 예:**

```
📦 my-api
├─ 경로: /home/kimjin/my-api
├─ 변경사항: 2개
├─ 푸시 대기: 1개
├─ 최근 커밋: a1b2c3d - feat: 기능 추가 (5분 전)
└─ 상태: 푸시 필요
```

---

## 자동 동기화

### Post-Commit Hook

`create-project.sh`가 자동으로 설정합니다.

**파일 위치:** `.git/hooks/post-commit`

**작동 원리:**
1. 커밋이 완료되면 hook 자동 실행
2. `git push origin master` 실행
3. Gogs로 자동 푸시

**수동 확인:**

```bash
cd /home/kimjin/프로젝트명

# Hook 보기
cat .git/hooks/post-commit

# Hook 재설정
mkdir -p .git/hooks
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push origin master 2>/dev/null || true
EOF
chmod +x .git/hooks/post-commit
```

### 동기화 흐름

```
코드 작성
  ↓
git add .
  ↓
git commit -m "메시지"
  ↓
post-commit hook 자동 실행
  ↓
git push origin master
  ↓
✅ Gogs에 저장됨
```

---

## 모니터링

### 대시보드 보기

```bash
cd /home/kimjin/claude-automation
./monitor-sync.sh
```

**보여주는 정보:**

- 📁 프로젝트명 및 경로
- 📝 변경사항 파일 수
- 📤 푸시 대기 중인 커밋
- 📅 최근 커밋 정보
- ✅ 동기화 상태

### 프로젝트별 모니터링

```bash
./monitor-sync.sh my-api

# 출력:
# 📦 my-api
# ├─ 경로: /home/kimjin/my-api
# ├─ 변경사항: 0개
# ├─ 푸시 완료
# ├─ 최근 커밋: ed459c8 - feat: API 구현 (10분 전)
# └─ 상태: 동기화됨
```

### 일괄 동기화

```bash
# 변경사항이 있는 모든 프로젝트를 동기화
./monitor-sync.sh sync

# 결과:
# 동기화 완료: 3개 성공, 0개 실패
```

---

## 고급 기능

### 프로젝트 목록 확인

```bash
# 모든 프로젝트 나열
ls -d /home/kimjin/*/ | grep -v claude | xargs -I {} basename {}

# 또는
ls -la /home/kimjin/ | grep "^d" | awk '{print $NF}'
```

### 특정 프로젝트의 커밋 히스토리

```bash
cd /home/kimjin/프로젝트명

# 최근 10개 커밋
git log --oneline -n 10

# 상세 히스토리
git log --stat

# 특정 파일의 히스토리
git log --oneline -- 파일명
```

### 여러 파일 한 번에 커밋

```bash
cd /home/kimjin/프로젝트명

# 특정 파일들만 추가
git add src/
git add README.md
git commit -m "feat: 여러 파일 수정"

# 자동 푸시 (hook)
```

### 프로젝트 초기화

```bash
# 새로 시작하고 싶은 경우
cd /home/kimjin/프로젝트명
rm -rf .git
git init
git config user.name "kim"
git config user.email "kim@dclub.kr"

# Gogs 저장소와 연결
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"
git remote add origin "https://kim:${TOKEN}@gogs.dclub.kr/kim/프로젝트명.git"
git add .
git commit -m "Initial commit"
git push -u origin master
```

---

## 베스트 프랙티스

### 1. 커밋 메시지

**좋은 예:**
```bash
git commit -m "feat: 사용자 인증 기능 추가"
git commit -m "fix: 로그인 버그 수정"
git commit -m "docs: README 업데이트"
git commit -m "refactor: 코드 정리"
```

**나쁜 예:**
```bash
git commit -m "수정"
git commit -m "작업"
git commit -m "..."
```

### 2. 작은 단위 커밋

```bash
# 기능별로 분리해서 커밋
git add src/auth.js
git commit -m "feat: JWT 인증 추가"

git add src/routes.js
git commit -m "feat: API 라우트 추가"

git add tests/
git commit -m "test: 테스트 코드 추가"
```

### 3. README 유지

```bash
# 프로젝트 설명은 항상 최신 상태로
# - 개요
# - 설치 방법
# - 사용법
# - 기여 방법
```

### 4. .gitignore 설정

```bash
cd /home/kimjin/프로젝트명

# 민감 정보 제외
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
echo "secrets/" >> .gitignore
echo "node_modules/" >> .gitignore
echo "__pycache__/" >> .gitignore

git add .gitignore
git commit -m "chore: .gitignore 업데이트"
```

---

## 📊 실제 예제

### 예제 1: Express API 프로젝트

```bash
# 1. 프로젝트 생성
cd /home/kimjin/claude-automation
./create-project.sh "express-api" "Express REST API" api

# 2. 코드 작성
cd /home/kimjin/express-api

# Claude Code에서:
# - server.js 생성
# - package.json 수정
# - routes/ 디렉토리 생성

# 3. 커밋
git add .
git commit -m "feat: Express 서버 기본 구조"

# 4. 추가 개발
# - src/routes/users.js 추가
git add src/routes/
git commit -m "feat: 사용자 라우트 추가"

# 5. 확인
# https://gogs.dclub.kr/kim/express-api
```

### 예제 2: Python CLI 도구

```bash
# 1. 프로젝트 생성
./create-project.sh "python-cli" "Python 명령줄 도구" cli

# 2. 코드 작성
cd /home/kimjin/python-cli

# Claude Code에서:
# - main.py 생성
# - requirements.txt 생성

# 3. 커밋
git add .
git commit -m "feat: CLI 기본 구조"

# 4. 테스트
python main.py --help

# 5. 최종 푸시
# 자동으로 Gogs에 저장됨!
```

---

## 🔐 보안 팁

1. **토큰 보호**
   - `~/.git-credentials`는 권한 `600`으로 유지
   - 토큰을 코드에 커밋하지 말 것

2. **민감 정보**
   - `.env` 파일은 `.gitignore`에 추가
   - API 키, 비밀번호는 환경변수로 관리

3. **액세스 제어**
   - 프라이빗 프로젝트는 설명에 명시
   - 협업자 권한 정기 검토

---

더 궁금한 점은 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)를 참고하세요.
