# ⚡ 5분 빠른 시작

## 1️⃣ 저장소 클론

```bash
git clone https://gogs.dclub.kr/kim/claude-automation.git
cd claude-automation
```

## 2️⃣ 프로젝트 생성

```bash
# 문법
./create-project.sh "프로젝트명" "설명" [타입]

# 예제 1: API 서버
./create-project.sh "my-api" "REST API 서버" api

# 예제 2: 웹 앱
./create-project.sh "my-web" "웹 애플리케이션" web

# 예제 3: CLI 도구
./create-project.sh "my-cli" "명령줄 도구" cli
```

## 3️⃣ 코드 작성

```bash
# 프로젝트 폴더로 이동
cd /home/kimjin/my-api

# Claude Code에서 파일 생성/수정
# → Edit 또는 Write 도구 사용
```

## 4️⃣ 자동 동기화

```bash
# 1. 파일 추가
git add .

# 2. 커밋 (자동으로 Gogs로 푸시됨!)
git commit -m "feat: 기능 추가"

# ✅ 자동 푸시 완료!
# https://gogs.dclub.kr/kim/my-api
```

## 🔍 모니터링

```bash
cd /home/kimjin/claude-automation

# 모든 프로젝트 상태 확인
./monitor-sync.sh

# 특정 프로젝트만
./monitor-sync.sh my-api

# 모두 동기화
./monitor-sync.sh sync
```

---

## 📝 프로젝트 타입

| 타입 | 설명 |
|------|------|
| **web** | React, Vue, Next.js 등 |
| **api** | Express, FastAPI 등 |
| **cli** | Node CLI, Python CLI 등 |
| **library** | npm, PyPI 패키지 |
| **service** | 마이크로서비스 |
| **daemon** | PM2, systemd 백그라운드 |

---

## ✅ 완료!

이제 `https://gogs.dclub.kr/kim/my-api`에서 코드를 확인할 수 있습니다.

더 자세한 정보는 [USAGE.md](USAGE.md)를 참고하세요.
