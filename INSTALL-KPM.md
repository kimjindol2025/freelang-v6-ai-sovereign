# 📦 KPM 설치 & 완전 자동화 가이드

## 🎯 한 줄 설치

```bash
kpm install claude-automation
```

**완료!** 이제 모든 것이 자동으로 설정됩니다. 🚀

---

## 📋 설치 프로세스 (자동)

KPM 설치 시 다음이 자동으로 진행됩니다:

```
1️⃣ 필수 요구사항 확인
   ├─ git
   ├─ bash 4.0+
   └─ curl

2️⃣ 설치 디렉토리 준비
   └─ /home/kimjin/kim_modules/claude-automation/

3️⃣ 파일 복사
   ├─ create-project.sh
   ├─ monitor-sync.sh
   ├─ README.md
   ├─ package.json
   └─ docs/

4️⃣ Git 인증 설정
   └─ ~/.git-credentials 자동 구성

5️⃣ Shell 명령어 등록
   ├─ claude-create
   └─ claude-monitor

6️⃣ 검증 & 테스트
   └─ 모든 파일 확인
```

---

## 🚀 설치 후 사용

### 1단계: 프로젝트 생성

```bash
# 방법 1: 직접 실행
/home/kimjin/kim_modules/claude-automation/create-project.sh "프로젝트명" "설명" 타입

# 방법 2: 심링크 사용 (권장)
claude-create "프로젝트명" "설명" 타입

# 예제
claude-create "my-api" "REST API 서버" api
claude-create "my-web" "웹 애플리케이션" web
claude-create "my-cli" "CLI 도구" cli
```

### 2단계: 코드 작성

```bash
cd /home/kimjin/프로젝트명

# Claude Code에서 파일 생성/수정
# → Edit 또는 Write 도구 사용
```

### 3단계: 자동 동기화

```bash
git add .
git commit -m "feat: 기능 추가"

# ✅ 자동으로 Gogs에 푸시됨!
```

### 4단계: 모니터링

```bash
# 모든 프로젝트 상태 보기
claude-monitor

# 특정 프로젝트
claude-monitor my-api

# 일괄 동기화
claude-monitor sync
```

---

## 📂 설치 구조

```
/home/kimjin/kim_modules/claude-automation/
├── create-project.sh        프로젝트 생성 (5단계 파이프라인)
├── monitor-sync.sh          모니터링 및 동기화
├── install.sh               KPM 설치 스크립트
├── post-install.sh          사후 설치 훅
├── test.sh                  자동 테스트
├── README.md                메인 문서
├── package.json             패키지 메타데이터
└── docs/
    ├── QUICK-START.md       5분 빠른 시작
    ├── USAGE.md            상세 가이드
    ├── TROUBLESHOOTING.md  문제 해결
    └── API.md              API 참고
```

---

## ⚡ 명령어 목록

| 명령어 | 설명 |
|--------|------|
| `claude-create "name" "desc" type` | 프로젝트 생성 |
| `claude-monitor` | 모든 프로젝트 상태 |
| `claude-monitor projectname` | 특정 프로젝트 상태 |
| `claude-monitor sync` | 모든 프로젝트 일괄 동기화 |

---

## 📊 지원 프로젝트 타입

```
web      - 웹 애플리케이션 (React, Vue, Next.js)
api      - REST API 서버 (Express, FastAPI)
cli      - 명령줄 도구 (Node CLI, Python)
library  - 라이브러리 (npm, PyPI)
service  - 마이크로서비스
daemon   - 백그라운드 프로세스
```

---

## ✅ 자동 설정 내용

### Git 설정 (자동)
- [x] ~/.git-credentials에 Gogs 토큰 추가
- [x] credential.helper = store 설정
- [x] 사용자 이름/이메일 설정

### 프로젝트 구조 (자동)
```
/home/kimjin/프로젝트명/
├── .git/
│   └── hooks/
│       └── post-commit (자동 푸시)
├── README.md (자동 생성)
├── .project-info (메타데이터)
└── (코드 파일들)
```

### Gogs 연동 (자동)
- ✅ Gogs 저장소 자동 생성
- ✅ Git remote 자동 설정
- ✅ 초기 푸시 자동 실행

---

## 🔍 설치 확인

설치 후 확인하려면:

```bash
# 1. 설치 경로 확인
ls -la /home/kimjin/kim_modules/claude-automation/

# 2. 명령어 확인
which claude-create
which claude-monitor

# 3. 테스트 실행
cd /home/kimjin/kim_modules/claude-automation/
bash test.sh
```

---

## 🚨 문제 해결

### Q: 권한 오류 발생
```bash
# 스크립트 권한 설정
chmod +x /home/kimjin/kim_modules/claude-automation/*.sh
```

### Q: 명령어를 찾을 수 없음
```bash
# Shell 다시 로드
source ~/.bashrc
# 또는
exec bash
```

### Q: Git 푸시 실패
```bash
# 토큰 확인
cat ~/.git-credentials | grep gogs

# 수동 푸시
cd /home/kimjin/프로젝트명
git push origin master -v
```

---

## 📚 다음 단계

1. **프로젝트 생성**
   ```bash
   claude-create "my-project" "설명" web
   ```

2. **코드 작성**
   ```bash
   cd /home/kimjin/my-project
   # Claude Code에서 파일 생성/수정
   ```

3. **자동 동기화**
   ```bash
   git add .
   git commit -m "feat: 기능 추가"
   # 자동 푸시!
   ```

4. **Gogs 확인**
   ```
   https://gogs.dclub.kr/kim/my-project
   ```

---

## 🎯 완전 자동화 특징

✅ **한 줄 설치** - `kpm install claude-automation`
✅ **자동 설정** - Git, Gogs 모두 자동 구성
✅ **자동 동기화** - 커밋하면 자동 푸시
✅ **자동 모니터링** - 모든 프로젝트 상태 추적
✅ **자동 테스트** - 설치 후 자동 검증

---

## 📞 지원

- **문서**: `/home/kimjin/kim_modules/claude-automation/docs/`
- **Gogs**: https://gogs.dclub.kr/kim/claude-automation
- **설치 위치**: `/home/kimjin/kim_modules/claude-automation/`

---

**🎉 이제 모든 것이 자동화되었습니다!**

`kpm install claude-automation` 한 줄이면 완전히 준비됩니다. ✨
