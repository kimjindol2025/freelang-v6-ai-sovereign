# 🚀 V6 Deployer 스펙

**버전**: 1.0-draft
**상태**: 설계 중
**목표**: 생성된 코드 → 자동 빌드 + 배포

---

## 1️⃣ 배포 파이프라인

### 워크플로우
```
코드 생성 완료
  ↓
1️⃣ 검증 (Validation)
  - package.json 검사
  - TypeScript 타입 체크
  - 보안 스캔
  ↓
2️⃣ 빌드 (Build)
  - npm install
  - npm run build
  - Docker 이미지 생성
  ↓
3️⃣ 테스트 (Testing)
  - 단위 테스트
  - 통합 테스트
  - E2E 테스트
  ↓
4️⃣ 배포 (Deploy)
  - 대상 환경 선택
  - 환경 설정
  - 배포 실행
  ↓
5️⃣ 검증 (Post-Deploy)
  - 헬스 체크
  - 성능 모니터링
  - 에러 로깅
```

---

## 2️⃣ 빌드 단계 상세

### Phase 1: 의존성 설치
```bash
# package.json에서 의존성 자동 결정
npm install --production

# 예상 설치 패키지
express@^4.18.0
pg@^8.8.0
jsonwebtoken@^9.0.0
dotenv@^16.0.0
```

### Phase 2: TypeScript 컴파일
```bash
# tsconfig.json 기반 컴파일
tsc --outDir dist --declaration

# 생성 결과
dist/
├── server.js
├── auth/
│   ├── jwt.js
│   └── middleware.js
├── routes/
│   ├── users.js
│   └── auth.js
└── types/
    └── *.d.ts
```

### Phase 3: Docker 빌드
```dockerfile
# Dockerfile (자동 생성)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist
COPY database ./database

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

---

## 3️⃣ 배포 대상

### Option A: Vercel (웹앱용)
```javascript
// vercel.json (자동 생성)
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/dist/server.js"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### Option B: AWS (엔터프라이즈용)
```javascript
// 자동 배포 설정
1. S3에 Docker 이미지 푸시
2. ECR 저장소 생성
3. ECS 클러스터 생성
4. RDS 인스턴스 생성
5. Application Load Balancer 설정
```

### Option C: 로컬 (개발용)
```bash
# docker-compose.yml (자동 생성)
version: '3'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/app
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    ports:
      - "5432:5432"
```

---

## 4️⃣ 환경 설정 자동화

### 환경 변수 설정
```bash
# .env (자동 생성)
DATABASE_URL=postgresql://user:pass@localhost/app
JWT_SECRET=generated-secret-key
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### 데이터베이스 초기화
```bash
# migration 자동 실행
1. CREATE TABLE users
2. CREATE INDEX idx_users_email
3. INSERT DEFAULT ROLES
4. CREATE ADMIN USER
```

### SSL 인증서
```bash
# Let's Encrypt 자동 설정
1. 도메인 확인
2. 인증서 발급
3. 자동 갱신 설정
```

---

## 5️⃣ 배포 후 검증

### 헬스 체크
```javascript
// GET /health
{
  "status": "ok",
  "timestamp": "2026-03-06T10:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "database": "connected",
  "memory": "45MB"
}
```

### 성능 모니터링
```javascript
// Prometheus 메트릭
http_requests_total{method="GET",endpoint="/api/users"}
http_request_duration_seconds{endpoint="/api/users",quantile="0.95"}
database_query_duration_seconds{query="SELECT"}
```

### 에러 로깅
```javascript
// Sentry 통합
1. 자동 에러 수집
2. 스택 트레이스 분석
3. 성능 저하 감지
4. 실시간 알림
```

---

## 6️⃣ 자동화 스크립트

### deploy.sh (v6 기본 배포)
```bash
#!/bin/bash

# 1. 검증
npm run typecheck
npm run lint
npm run security-check

# 2. 빌드
npm run build
docker build -t myapp:latest .

# 3. 테스트
npm run test
npm run test:e2e

# 4. 배포
docker push myapp:latest
kubectl apply -f k8s.yml

# 5. 검증
curl https://myapp.example.com/health
```

### rollback.sh (자동 롤백)
```bash
#!/bin/bash

# 이전 버전으로 즉시 복구
kubectl rollout undo deployment/myapp
docker pull myapp:previous
docker run -d myapp:previous
```

---

## 7️⃣ 배포 상태 트래킹

### 배포 기록
```json
{
  "deployments": [
    {
      "id": "deploy-001",
      "timestamp": "2026-03-06T10:00:00Z",
      "version": "1.0.0",
      "status": "success",
      "duration": "5m 30s",
      "target": "production",
      "changes": 42,
      "tests_passed": 150,
      "performance": {
        "p50": "45ms",
        "p95": "200ms"
      }
    }
  ]
}
```

---

## 8️⃣ 테스트 케이스

### Test 1: 기본 배포
```
입력: Express API + PostgreSQL
과정: 빌드 → Docker → 로컬 배포
검증: http://localhost:3000/health
```

### Test 2: 클라우드 배포
```
입력: React 앱 + Node.js API
과정: 빌드 → Docker → Vercel 배포
검증: https://app.vercel.app/
```

### Test 3: Kubernetes 배포
```
입력: 마이크로서비스 (3개 서비스)
과정: 빌드 → Docker → K8s 배포
검증: kubectl get pods
```

---

**상태**: 🔍 **설계 중**
**다음 단계**: 배포 자동화 스크립트 구현
