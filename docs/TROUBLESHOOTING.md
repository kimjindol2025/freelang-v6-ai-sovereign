# 🚨 문제 해결 가이드

## Q&A 목록

### Q1: 프로젝트 생성 시 "repository already exists" 에러

**증상:**
```
❌ Gogs 저장소 생성 실패
```

**원인:** Gogs에 이미 같은 이름의 저장소가 있음

**해결책:**

```bash
cd /home/kimjin/프로젝트명
git remote remove origin

# 새로운 remote 설정
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"
git remote add origin "https://kim:${TOKEN}@gogs.dclub.kr/kim/프로젝트명.git"

# 푸시
git push -u origin master
```

---

### Q2: 자동 푸시가 작동하지 않음

**증상:**
```
git commit -m "메시지"
# Gogs에 안 올라감
```

**원인:** Post-commit hook이 없거나 권한이 없음

**확인:**

```bash
cd /home/kimjin/프로젝트명

# Hook 존재 확인
ls -la .git/hooks/post-commit

# 권한 확인
ls -l .git/hooks/post-commit
# rwx로 시작해야 함
```

**해결책:**

```bash
# Hook 재생성
mkdir -p .git/hooks

cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push origin master 2>/dev/null || true
EOF

# 권한 설정
chmod +x .git/hooks/post-commit

# 확인
ls -la .git/hooks/post-commit
# -rwxr-xr-x 이어야 함
```

---

### Q3: "프로젝트명은 영문, 숫자, -, _ 만 사용 가능" 에러

**원인:** 프로젝트명에 한글, 특수문자 포함

**잘못된 예:**
```bash
./create-project.sh "내 프로젝트" "설명" web    # ❌ 한글
./create-project.sh "my project" "설명" web     # ❌ 공백
./create-project.sh "my-pro!" "설명" web        # ❌ 특수문자
```

**올바른 예:**
```bash
./create-project.sh "my-project" "설명" web     # ✅ 영문, 하이픈
./create-project.sh "my_project" "설명" web     # ✅ 영문, 언더스코어
./create-project.sh "my123" "설명" web          # ✅ 영문, 숫자
```

---

### Q4: Git 토큰 에러

**증상:**
```
fatal: 저장소를 찾을 수 없습니다
```

**원인:** 토큰 만료 또는 잘못된 형식

**확인:**

```bash
cat ~/.git-credentials | grep gogs.dclub.kr
```

**해결책:**

1. 토큰 갱신
   - https://gogs.dclub.kr 접속
   - 설정 → 애플리케이션
   - 새 토큰 생성

2. credentials 업데이트
   ```bash
   # 기존 내용 제거 후 새로 추가
   nano ~/.git-credentials
   # 또는
   cat > ~/.git-credentials << 'EOF'
   https://kim:새토큰@gogs.dclub.kr
   https://kim:github토큰@github.com
   EOF
   chmod 600 ~/.git-credentials
   ```

---

### Q5: .git 폴더가 손상됨

**증상:**
```
fatal: Not a git repository
```

**원인:** Git 저장소 폴더 손상

**해결책:**

```bash
# 1. 기존 git 제거
cd /home/kimjin/프로젝트명
rm -rf .git

# 2. 새로 초기화
git init
git config user.name "kim"
git config user.email "kim@dclub.kr"

# 3. Post-commit hook 설정
mkdir -p .git/hooks
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push origin master 2>/dev/null || true
EOF
chmod +x .git/hooks/post-commit

# 4. Remote 설정
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"
git remote add origin "https://kim:${TOKEN}@gogs.dclub.kr/kim/프로젝트명.git"

# 5. 초기 커밋
git add .
git commit -m "Initial commit"
git push -u origin master
```

---

### Q6: 특정 파일을 실수로 커밋함

**증상:**
```
# 민감 정보가 실수로 푸시됨
git push 완료 후 깨달음
```

**해결책:**

```bash
cd /home/kimjin/프로젝트명

# 1. 파일을 .gitignore에 추가
echo "secrets.env" >> .gitignore

# 2. 이력에서 제거 (주의: Gogs에는 남아있음)
git rm --cached secrets.env
git commit -m "chore: 민감 정보 제외"

# 3. Gogs에서 수동 삭제 필요
# https://gogs.dclub.kr/kim/프로젝트명 접속 후 파일 삭제
```

---

### Q7: 프로젝트 폴더가 이미 있음

**증상:**
```
⚠️ 폴더가 이미 존재합니다: /home/kimjin/my-api
```

**원인:** 같은 이름의 프로젝트가 이미 있음

**옵션:**

1. **기존 폴더 사용**
   ```bash
   # 스크립트 물음에 y 입력
   기존 폴더를 사용하시겠습니까? (y/n): y
   ```

2. **다른 이름으로 생성**
   ```bash
   ./create-project.sh "my-api-v2" "설명" api
   ```

3. **기존 폴더 삭제 후 재생성**
   ```bash
   rm -rf /home/kimjin/my-api
   ./create-project.sh "my-api" "설명" api
   ```

---

### Q8: 모니터링 도구가 작동 안 함

**증상:**
```
./monitor-sync.sh: Permission denied
```

**해결책:**

```bash
cd /home/kimjin/claude-automation

# 권한 설정
chmod +x monitor-sync.sh

# 재시도
./monitor-sync.sh
```

---

### Q9: 커밋은 했는데 Gogs에 안 보임

**증상:**
```
git log로는 보이는데 https://gogs.dclub.kr/kim/... 에 안 보임
```

**원인:** 푸시가 실패했거나 hook이 실행 안 됨

**확인:**

```bash
cd /home/kimjin/프로젝트명

# 푸시 대기 상태 확인
git log origin/master..HEAD

# 있으면 수동 푸시
git push origin master
```

**해결책:**

```bash
# 수동 푸시
git push origin master -v   # 상세 출력

# 만약 실패하면 토큰 확인
cat ~/.git-credentials | grep gogs

# Remote 확인
git remote -v
```

---

### Q10: 프로젝트를 삭제하고 싶음

**주의:** 로컬 폴더만 삭제되고 Gogs는 남음

**로컬 삭제:**

```bash
cd /home/kimjin
rm -rf 프로젝트명
```

**Gogs도 삭제:**

1. https://gogs.dclub.kr/kim/프로젝트명 접속
2. 저장소 설정 → 위험 영역 → 저장소 삭제
3. 또는 API로 삭제:

```bash
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"
curl -X DELETE "https://gogs.dclub.kr/api/v1/repos/kim/프로젝트명" \
  -H "Authorization: token $TOKEN"
```

---

### Q11: Windows/Mac에서도 사용 가능?

**Linux:** ✅ 완벽 지원

**Mac:** ✅ 대부분 호환 (bash 필수)

**Windows:**
- WSL (Windows Subsystem for Linux) 권장
- Git Bash에서 부분 지원

---

### Q12: 팀원과 협업하려면?

```bash
# 1. 팀원이 저장소 클론
git clone https://gogs.dclub.kr/kim/프로젝트명.git
cd 프로젝트명

# 2. 브랜치 생성
git checkout -b 팀원이름-기능명

# 3. 코드 작성 및 커밋
# ...
git commit -m "feat: 기능"

# 4. 푸시
git push origin 팀원이름-기능명

# 5. Gogs에서 PR(Pull Request) 생성
```

---

## 🔍 디버깅 팁

### Git 상태 확인

```bash
cd /home/kimjin/프로젝트명

# 변경사항 확인
git status

# 스테이지된 파일
git status -s

# 커밋 히스토리
git log --oneline

# 원격 상태
git remote -v
git branch -a
```

### Gogs API 테스트

```bash
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"

# 저장소 정보 조회
curl -s "https://gogs.dclub.kr/api/v1/repos/kim/프로젝트명" | jq .

# 커밋 히스토리
curl -s "https://gogs.dclub.kr/api/v1/repos/kim/프로젝트명/commits" | jq .
```

### Hook 디버깅

```bash
cd /home/kimjin/프로젝트명

# Hook 수동 실행 (테스트)
bash .git/hooks/post-commit

# Hook 로그 보기 (있다면)
tail -f /tmp/post-commit.log
```

---

## 📞 추가 도움

문제가 해결되지 않으면:

1. **Git 상태 확인**
   ```bash
   cd /home/kimjin/프로젝트명
   git status
   git log --oneline | head -5
   git remote -v
   ```

2. **토큰 확인**
   ```bash
   cat ~/.git-credentials
   ```

3. **Gogs 저장소 확인**
   - https://gogs.dclub.kr/kim/프로젝트명 접속

4. **Hook 권한 확인**
   ```bash
   ls -la .git/hooks/post-commit
   ```

---

**해결되지 않았다면 위 명령들의 출력을 정리해서 알려주세요!** 🔍
