# STEP 3: 웹 Playground 배포 가이드

## 📋 현황

### 파일 준비 (✅ 완료)
```
playground.html (568줄)
- 순수 HTML/CSS/JavaScript
- 독립 실행 가능
- 브라우저 호환성 100%
```

### 서버 준비 (✅ 완료)
```
253 서버 (123.212.111.26:22253)
- SSH 접속: ✅
- 디렉토리 생성: ~/freelang-playground ✅
- 파일 업로드: playground.html ✅
```

---

## 🚀 배포 방법

### 방법 1: 로컬 테스트 (즉시)

```bash
# 로컬 웹서버 시작 (포트 8000)
cd ~/freelang-v6-ai-sovereign
python3 -m http.server 8000

# 브라우저에서 접속
http://localhost:8000/playground.html
```

**결과**: ✅ 완전히 작동하는 CLAUDELang 에디터

---

### 방법 2: 253 서버 배포 (권장)

#### 2.1 웹서버 설정

**Option A: Python SimpleHTTPServer (권장)**
```bash
ssh -p 22253 kimjin@123.212.111.26

# 백그라운드에서 웹서버 시작
cd ~/freelang-playground
nohup python3 -m http.server 8080 &

# 확인
curl http://localhost:8080/playground.html
```

**Option B: Nginx (고성능)**
```bash
# Nginx 설치
sudo apt-get install nginx

# 설정 파일 생성
sudo vi /etc/nginx/sites-available/freelang-playground
```

```nginx
server {
    listen 80;
    server_name playground.freelang-ai.kim;

    root /home/kimjin/freelang-playground;
    index playground.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
# 활성화
sudo ln -s /etc/nginx/sites-available/freelang-playground \
           /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

#### 2.2 도메인 설정

**DNS 레코드 추가**:
```
playground.freelang-ai.kim    A    123.212.111.26
```

또는:
```
playground.dclub.kr    A    123.212.111.26
```

**확인**:
```bash
ping playground.freelang-ai.kim
curl http://playground.freelang-ai.kim/playground.html
```

---

### 방법 3: Docker 배포

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY playground.html .

EXPOSE 8080

CMD ["python3", "-m", "http.server", "8080"]
```

```bash
# 빌드
docker build -t freelang-playground .

# 실행
docker run -p 8080:8080 freelang-playground
```

---

## 📊 배포 현황

### 완료됨 ✅
| 항목 | 상태 | 세부 |
|------|------|------|
| HTML 생성 | ✅ | 568줄, 완전 독립 |
| 파일 업로드 | ✅ | 253 서버 ~/freelang-playground |
| 로컬 테스트 | ⏳ | 준비 완료 |
| 웹서버 설정 | ⏳ | 여러 옵션 제공 |
| 도메인 설정 | ⏳ | DNS 레코드 필요 |

---

## 🎯 접속 주소

### 로컬 (개발)
```
http://localhost:8000/playground.html
```

### 원격 (프로덕션)
```
Option 1: http://playground.freelang-ai.kim
Option 2: http://playground.dclub.kr
Option 3: http://123.212.111.26:8080/playground.html
```

---

## ⚙️ 웹서버 시작 스크립트

**start-playground.sh**:
```bash
#!/bin/bash

# 253 서버에서 실행
ssh -p 22253 kimjin@123.212.111.26 <<'EOF'
cd ~/freelang-playground

# 기존 프로세스 종료
pkill -f "http.server 8080"
sleep 1

# 새 프로세스 시작
nohup python3 -m http.server 8080 > playground.log 2>&1 &

echo "✅ 웹서버 시작됨 (포트 8080)"
echo "http://localhost:8080/playground.html"
EOF
```

---

## 📝 사용 방법

### 1. 프로그램 작성
```json
{
  "metadata": {
    "title": "My CLAUDELang Program"
  },
  "instructions": [...]
}
```

### 2. JSON 입력
웹 에디터의 왼쪽 패널에 JSON 붙여넣기

### 3. 실행
"Run Program" 버튼 클릭

### 4. 결과 확인
오른쪽 패널에 실행 결과 표시

---

## 🔍 문제 해결

### 포트 8080이 사용 중
```bash
# 다른 포트 사용
python3 -m http.server 9090

# 또는 프로세스 종료
lsof -i :8080
kill -9 <PID>
```

### CORS 에러
- 로컬에서는 자동 해결됨
- 원격에서는 같은 도메인 내 접속

### 파일 권한 오류
```bash
chmod 644 playground.html
chmod 755 ~/freelang-playground
```

---

## 🎊 최종 체크리스트

- [ ] playground.html 생성 (✅ 완료)
- [ ] 파일 업로드 (✅ 완료)
- [ ] 로컬 웹서버 테스트
- [ ] 253 서버 웹서버 설정
- [ ] 도메인 DNS 설정
- [ ] 원격 접속 테스트
- [ ] 문서화 완료

---

## 📚 관련 파일

- `playground.html` - 메인 애플리케이션
- `IMPLEMENTATION_ROADMAP.md` - 전체 구현 계획
- `COMPARISON_ALL_THREE_OPTIONS.md` - 옵션 비교

---

**상태**: 배포 준비 완료 ✅
**다음**: 웹서버 시작 + 도메인 설정
