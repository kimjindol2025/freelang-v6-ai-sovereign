# CLAUDELang v6.0 구현 로드맵

## 📋 목표 (3단계)

### STEP 1️⃣: Node.js 모듈 호환성 (OPTION 1)
- **목표**: package.json 수정 → 기존 컴파일러 작동
- **예상 시간**: 15분
- **산출물**: 모듈 호환 Node.js 버전

### STEP 2️⃣: Python 인터프리터 (OPTION 2)
- **목표**: CLAUDELang 완전 독립 실행 엔진
- **예상 시간**: 3-4시간
- **산출물**: 프로덕션 준비 Python 인터프리터

### STEP 3️⃣: 웹 Playground (OPTION 3)
- **목표**: 253 서버에서 온라인 플레이그라운드 호스팅
- **예상 시간**: 2-3시간 (서버 설정 포함)
- **산출물**: playground.freelang-ai.kim 또는 유사 도메인

---

## 🎯 STEP 1: Node.js 모듈 호환성

### 1.1 package.json 수정

```bash
# 현재 상태
{
  "type": "module",  ← 이것을 제거
  "main": "src/index.js"
}

# 목표 상태
{
  "main": "src/index.js"
  # "type" 필드 삭제
}
```

### 1.2 실행 파일 검증

```bash
npm test                           # 기존 테스트 실행
node src/index.js                  # 직접 실행 테스트
npm run test:examples              # 예제 테스트
```

### 1.3 확인 사항

- ✅ test-ai-evaluation.clg 로드
- ✅ 컴파일 성공
- ✅ 기존 테스트 100% 통과

---

## 🎯 STEP 2: Python 인터프리터 완성

### 2.1 현재 상태

```
✅ 파일 로드: 성공
✅ JSON 파싱: 성공
✅ 메타데이터 출력: 성공
⚠️  람다 함수: 미구현
⚠️  복잡한 타입: 미처리
```

### 2.2 필요한 구현

#### Phase A: 기본 함수 지원 (1시간)
```python
# 완성할 것
- Array.filter (predicate 함수 실행)
- Array.map (transformer 함수 실행)
- Array.reduce (reducer 함수 실행)
- Math 모든 연산
- String 함수들
- IO.print
```

#### Phase B: 람다 함수 처리 (1시간)
```python
# 람다 표현식 파싱
lambda params: body

# 예제
{
  "type": "lambda",
  "params": [{"name": "x", "type": "i32"}],
  "body": { ... }
}
```

#### Phase C: 고급 타입 처리 (1시간)
```python
# 지원할 것
- 중첩 객체
- 깊은 속성 접근 (obj.x.y.z)
- 배열 인덱싱 (arr[0][1])
- 조건문의 다양한 연산자
```

#### Phase D: 에러 처리 및 최적화 (1시간)
```python
# 추가할 것
- 유효성 검증
- 더 나은 에러 메시지
- 성능 최적화
- 실행 통계 추적
```

### 2.3 테스트 계획

```bash
# 완성 후 실행
python3 claudelang_interpreter.py

# 예상 결과
✅ 모든 변수 생성
✅ 모든 함수 호출
✅ 모든 조건문 처리
✅ 출력 결과 정확
✅ 실행 통계 추적
```

---

## 🎯 STEP 3: 웹 Playground 배포

### 3.1 서버 환경 확인

```bash
# 253 서버 접속
ssh -p 22253 kimjin@123.212.111.26
# 또는
ssh -p 10053 kimjin@253.ssh.dclub.kr

# 디렉토리 생성
mkdir -p /var/www/freelang-playground
cd /var/www/freelang-playground
```

### 3.2 파일 배포

```bash
# playground.html을 서버로 업로드
scp -P 22253 playground.html kimjin@123.212.111.26:/var/www/freelang-playground/

# 또는 git으로 푸시하고 서버에서 pull
```

### 3.3 웹서버 설정

#### Nginx 설정 (예시)
```nginx
server {
    listen 80;
    server_name playground.freelang-ai.kim;
    
    root /var/www/freelang-playground;
    index playground.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### 또는 Python SimpleHTTPServer
```bash
cd /var/www/freelang-playground
python3 -m http.server 8080
```

### 3.4 도메인 설정

```bash
# DNS 레코드 추가
playground.freelang-ai.kim → 123.212.111.26

# 또는 기존 도메인 서브도메인
playground.dclub.kr → 123.212.111.26
```

### 3.5 배포 확인

```bash
# 브라우저에서
https://playground.freelang-ai.kim
또는
http://253.playground.dclub.kr
```

---

## 📊 타임라인

### 오늘 (2026-03-06)

**STEP 1: 모듈 호환성 (15분)**
```
14:00 - 14:05: package.json 수정
14:05 - 14:10: 테스트 실행
14:10 - 14:15: 검증
```

**STEP 2A: Python 인터프리터 Phase A (1시간)**
```
14:15 - 14:45: Array/Math/String 함수 구현
14:45 - 15:00: 테스트 및 디버깅
15:00 - 15:15: 최적화
```

### 내일 또는 다음날

**STEP 2B-D: Python 인터프리터 나머지 (2-3시간)**
```
- Phase B: 람다 함수 (1시간)
- Phase C: 고급 타입 (1시간)
- Phase D: 에러 처리 (1시간)
```

### 이 주일 중

**STEP 3: 웹 Playground (2-3시간)**
```
- 253 서버 설정 (30분)
- 웹서버 설정 (30분)
- 도메인 설정 (30분)
- 배포 및 테스트 (30분)
- 문서화 (1시간)
```

---

## 🚀 구현 시작

### STEP 1 준비 사항
```bash
# 1. 현재 package.json 백업
cp package.json package.json.backup

# 2. "type": "module" 제거
# (Edit로 수정)

# 3. 테스트
npm test
```

### STEP 2 준비 사항
```bash
# 1. Python 3.8+ 설치 확인
python3 --version

# 2. 필요한 라이브러리 (없음 - 표준 라이브러리만 사용)

# 3. 인터프리터 개선 사항 파악
cat claudelang_interpreter.py | grep "# TODO"
```

### STEP 3 준비 사항
```bash
# 1. 253 서버 접속 확인
ssh -p 22253 kimjin@123.212.111.26 "echo 'Connected'"

# 2. 웹서버 확인 (nginx or apache)
sudo systemctl status nginx

# 3. 도메인 설정 권한 확인
```

---

## ✅ 체크리스트

### STEP 1
- [ ] package.json에서 "type" 필드 삭제
- [ ] npm test 통과
- [ ] 예제 모두 실행 성공
- [ ] GOGS 커밋: "fix: Node.js CommonJS 호환성"

### STEP 2
- [ ] 람다 함수 파싱 완성
- [ ] Array 함수 모두 작동
- [ ] 복잡한 타입 지원
- [ ] 100% 테스트 통과
- [ ] GOGS 커밋: "feat: Python 인터프리터 완성"

### STEP 3
- [ ] 253 서버에 파일 배포
- [ ] 웹서버 설정 완료
- [ ] 도메인 설정 완료
- [ ] 온라인 테스트 성공
- [ ] 문서화 완료
- [ ] GOGS 커밋: "feat: 웹 Playground 배포"

---

## 🎯 최종 결과

### STEP 1 완료 후
```
✅ Node.js에서 CLAUDELang 실행 가능
✅ 기존 코드 100% 호환
✅ npm 패키지로 사용 준비 (아직 npm에 등록 X)
```

### STEP 2 완료 후
```
✅ 완전히 독립적인 Python 인터프리터
✅ 크로스 플랫폼 지원
✅ 프로덕션 준비됨
```

### STEP 3 완료 후
```
✅ 온라인 웹 Playground
✅ 설치 불필요 (URL만 열면 됨)
✅ 커뮤니티 학습 환경 준비
```

---

## 📝 다음 문서

- `STEP_1_NODEJS_FIX.md` - Node.js 모듈 호환성 상세 가이드
- `STEP_2_PYTHON_INTERPRETER.md` - Python 인터프리터 구현 가이드
- `STEP_3_WEB_DEPLOYMENT.md` - 웹 Playground 배포 가이드

