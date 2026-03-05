# 🚀 Claude Code 자동 동기화 파이프라인

**Claude Code에서 작성한 모든 코드를 자동으로 Gogs 저장소에 동기화하는 완전 자동화 시스템**

```
Claude Code 작성
    ↓
프로젝트 자동 생성
    ↓
Git 저장소 초기화
    ↓
Gogs 저장소 자동 생성
    ↓
자동 푸시 (post-commit hook)
    ↓
✅ Gogs에 자동 저장됨
```

---

## 📋 시스템 구성

### 🎯 목표
- Claude Code에서 코드를 쓰고 커밋하면 **자동으로 Gogs에 저장**
- 복잡한 설정 없이 **한 줄 명령으로 프로젝트 생성**
- **모든 프로젝트의 상태를 실시간으로 모니터링**

### ⚙️ 핵심 구성요소

| 파일 | 설명 | 기능 |
|------|------|------|
| **create-project.sh** | 프로젝트 생성 파이프라인 | 5단계 자동화 (폴더 생성 → Git 초기화 → Gogs 저장소 생성 → 동기화 설정) |
| **monitor-sync.sh** | 모니터링 & 동기화 도구 | 모든 프로젝트 상태 확인, 일괄 동기화 |
| **docs/** | 문서 디렉토리 | QUICK-START, USAGE, API 가이드 |

---

## 🚀 5분 빠른 시작

### Step 1: 이 저장소 클론

```bash
git clone https://gogs.dclub.kr/kim/claude-automation.git
cd claude-automation
```

### Step 2: 프로젝트 생성

```bash
# 기본 문법
./create-project.sh "프로젝트명" "설명" [타입]

# 예시
./create-project.sh "my-api" "REST API 서버" api
./create-project.sh "web-app" "웹 애플리케이션" web
./create-project.sh "cli-tool" "명령줄 도구" cli
```

### Step 3: 코드 작성

```bash
cd /home/kimjin/my-api

# Claude Code에서 파일 생성/수정
# → Edit, Write 도구 사용
```

### Step 4: 자동 동기화

```bash
git add .
git commit -m "feat: 기능 추가"

# ✅ 자동으로 Gogs로 푸시됨!
```

---

## 📦 프로젝트 타입

```
web      - 웹 애플리케이션 (React, Vue, Next.js 등)
api      - REST API 서버 (Express, FastAPI 등)
cli      - 명령줄 도구 (Node CLI, Python CLI 등)
library  - 재사용 가능한 라이브러리
service  - 마이크로서비스 또는 통합 서비스
daemon   - 백그라운드 데몬 (PM2, systemd 등)
```

---

## 📂 생성되는 구조

```
/home/kimjin/프로젝트명/
├── .git/                    # Git 저장소
│   └── hooks/
│       └── post-commit      # 자동 푸시 hook
├── .project-info            # 프로젝트 메타데이터
├── README.md                # 프로젝트 설명
└── (your code files)        # 작성한 코드
```

---

## 🔄 동기화 방식

### 자동 동기화 (권장)
```bash
git add .
git commit -m "메시지"
# ↓ post-commit hook 자동 실행
# ↓ git push origin master
# ✅ Gogs에 자동 저장!
```

### 수동 동기화
```bash
cd /home/kimjin/프로젝트명
git push origin master
```

---

## 🔍 모니터링

### 전체 프로젝트 상태 확인
```bash
cd /home/kimjin/claude-automation
./monitor-sync.sh
```

### 특정 프로젝트 확인
```bash
./monitor-sync.sh my-api
```

### 모든 프로젝트 동기화
```bash
./monitor-sync.sh sync
```

---

## 📚 문서

| 문서 | 설명 |
|------|------|
| [QUICK-START.md](docs/QUICK-START.md) | 5분 빠른 시작 가이드 |
| [USAGE.md](docs/USAGE.md) | 상세 사용 가이드 |
| [API.md](docs/API.md) | Gogs API 가이드 |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 문제 해결 |

---

## ⚡ 주요 기능

✅ **자동 프로젝트 생성** - 1줄 명령으로 완전한 프로젝트 셋업
✅ **Gogs 자동 연동** - API로 저장소 자동 생성 및 연결
✅ **자동 푸시** - Post-commit hook으로 커밋 시 자동 푸시
✅ **모니터링** - 모든 프로젝트의 동기화 상태 실시간 확인
✅ **일괄 동기화** - 여러 프로젝트 한 번에 푸시
✅ **타입별 템플릿** - 프로젝트 타입별 README 자동 생성

---

## 🛠️ 스크립트 상세

### create-project.sh

**5단계 파이프라인:**

1. **입력 검증** - 프로젝트명 유효성 확인
2. **폴더 생성** - `/home/kimjin/프로젝트명` 디렉토리 생성
3. **Git 초기화** - 저장소 초기화 및 README 생성
4. **Gogs 저장소** - API로 자동 생성
5. **자동 동기화** - post-commit hook 설정

**사용 예:**
```bash
./create-project.sh "my-project" "프로젝트 설명" web
```

### monitor-sync.sh

**4가지 모드:**

- `./monitor-sync.sh` - 대시보드 보기
- `./monitor-sync.sh sync` - 모든 프로젝트 동기화
- `./monitor-sync.sh 프로젝트명` - 특정 프로젝트 상태
- `./monitor-sync.sh list` - Gogs 저장소 목록

---

## 🔐 보안

- 토큰: `~/.git-credentials`에 안전하게 저장
- 파일 권한: `600` (소유자만 접근)
- 민감 정보: `.gitignore`에 자동 추가

```bash
# .gitignore에 추가됨
.env
*.key
secrets/
```

---

## 📊 예제

### 예제 1: Express API 프로젝트

```bash
# 1. 프로젝트 생성
./create-project.sh "express-api" "Express REST API" api

# 2. 코드 작성 (Claude Code에서)
cd /home/kimjin/express-api

# Claude Code에서:
# - server.js 생성
# - routes/ 디렉토리 생성

# 3. 자동 동기화
git add .
git commit -m "feat: Express 서버 기본 구조"

# ✅ Gogs에 자동 저장!
# https://gogs.dclub.kr/kim/express-api
```

### 예제 2: React 웹 앱

```bash
# 1. 프로젝트 생성
./create-project.sh "react-dashboard" "대시보드 앱" web

# 2. 코드 작성
cd /home/kimjin/react-dashboard

# Claude Code에서:
# - src/App.jsx 생성
# - src/components/ 디렉토리 생성

# 3. 자동 동기화
git add .
git commit -m "feat: 대시보드 구현"

# ✅ Gogs에 자동 저장!
```

---

## ✅ 체크리스트

프로젝트를 만들 때:

- [ ] 프로젝트명은 영문, 숫자, `-`, `_` 만 사용
- [ ] 타입을 올바르게 지정 (web, api, cli, library, service, daemon)
- [ ] 커밋 메시지는 명확하게 작성
- [ ] `.gitignore`에 민감 정보 추가
- [ ] README.md는 항상 최신 유지

---

## 🚨 문제 해결

### Q: 프로젝트 생성이 실패함
**A:** 프로젝트명을 확인하세요 (영문, 숫자, `-`, `_` 만 가능)

### Q: 자동 푸시가 안 됨
**A:** Hook 권한을 확인하세요:
```bash
chmod +x /home/kimjin/프로젝트명/.git/hooks/post-commit
```

### Q: Gogs 저장소에 안 보임
**A:** 수동으로 푸시하세요:
```bash
cd /home/kimjin/프로젝트명
git push origin master
```

---

## 📞 지원

- **문서**: [docs/](docs/) 디렉토리
- **Gogs 저장소**: https://gogs.dclub.kr/kim/claude-automation
- **문제 신고**: 로컬 git log 확인

---

## 📝 라이센스

MIT

---

## 🎯 다음 단계

```bash
# 1. 저장소 클론
git clone https://gogs.dclub.kr/kim/claude-automation.git
cd claude-automation

# 2. 프로젝트 생성
./create-project.sh "my-first" "첫 프로젝트" web

# 3. 코드 작성 및 커밋
cd /home/kimjin/my-first
echo "Hello!" > hello.txt
git add .
git commit -m "feat: 첫 파일"

# 4. 확인
# https://gogs.dclub.kr/kim/my-first
```

---

**🚀 Claude Code와 Gogs의 완벽한 통합! 즐거운 코딩!**

마지막 업데이트: 2026-03-06
