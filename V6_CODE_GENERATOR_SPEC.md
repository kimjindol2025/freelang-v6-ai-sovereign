# 🏗️ V6 Code Generator 스펙

**버전**: 1.0-draft
**상태**: 설계 중
**목표**: 구조화된 요청 → 완전한 프로젝트 코드 생성

---

## 1️⃣ 입력 형식

### CodeGenRequest (NLP에서 온 출력)
```json
{
  "intent": "create_api",
  "project_type": "api",
  "features": [
    {"name": "user_management", "operations": ["create", "read", "update", "delete"]},
    {"name": "authentication", "auth_type": "jwt"}
  ],
  "tech_stack": {
    "backend": "express",
    "database": "postgresql",
    "auth": "jwt"
  },
  "requirements": {
    "role_based_access": true,
    "rate_limiting": true
  }
}
```

---

## 2️⃣ 템플릿 시스템

### 2-1. 템플릿 구조
```
templates/
├── api/
│   ├── express/
│   │   ├── server.ts (기본 서버)
│   │   ├── auth.ts (JWT 인증)
│   │   ├── middleware.ts
│   │   ├── routes/ (라우트 템플릿)
│   │   └── models/ (데이터 모델)
│   ├── fastapi/
│   └── go/
├── web/
│   ├── react/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   └── components/
│   ├── vue/
│   └── next/
├── database/
│   ├── sql/
│   │   ├── schema.sql
│   │   └── migrations/
│   └── nosql/
└── auth/
    ├── jwt.ts
    ├── oauth2.ts
    └── 2fa.ts
```

### 2-2. 템플릿 엔진 (Handlebars)
```handlebars
{{!-- server.ts --}}
import express from 'express';
import { {{authMiddleware}} } from './auth';

const app = express();

{{#features}}
app.use('/api/{{this.path}}', require('./routes/{{this.path}}'));
{{/features}}

{{#if requirements.rate_limiting}}
const rateLimit = require('express-rate-limit');
app.use(rateLimit({/* ... */}));
{{/if}}

app.listen({{port}}, () => {
  console.log('Server running on port {{port}}');
});
```

---

## 3️⃣ 생성 프로세스

### Phase 1: 구조 결정
```javascript
generateProjectStructure(request) {
  // 1. project_type 기반 폴더 구조 결정
  // 2. tech_stack 기반 파일 구성 선택
  // 3. features 기반 모듈 추가
}
```

### Phase 2: 코드 생성
```javascript
generateCode(structure, templates) {
  // 1. 각 템플릿에 요청 데이터 주입
  // 2. 기능별 라우트 생성
  // 3. 인증/권한 코드 추가
  // 4. 데이터베이스 스키마 생성
}
```

### Phase 3: 통합
```javascript
integrateCode(modules) {
  // 1. 모든 모듈 조합
  // 2. import 문 생성
  // 3. config 파일 생성
  // 4. package.json 생성
}
```

---

## 4️⃣ 출력 구조

### REST API 예제
```
generated-project/
├── src/
│   ├── server.ts (메인)
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── middleware.ts
│   ├── routes/
│   │   ├── users.ts
│   │   ├── auth.ts
│   │   └── admin.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Role.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── rateLimit.ts
│   └── db/
│       └── schema.ts
├── database/
│   ├── schema.sql
│   └── migrations/
├── tests/
│   ├── auth.test.ts
│   └── routes.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5️⃣ 기능별 생성 규칙

### 사용자 관리
```typescript
// routes/users.ts (자동 생성)
router.get('/', authenticateJWT, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

router.put('/:id', authenticateJWT, checkOwnership, async (req, res) => {
  const user = await User.update(req.params.id, req.body);
  res.json(user);
});
```

### 인증
```typescript
// auth/jwt.ts (자동 생성)
export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
```

### 데이터베이스
```sql
-- database/schema.sql (자동 생성)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

---

## 6️⃣ 설정 파일 자동 생성

### package.json
```json
{
  "name": "generated-api",
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.8.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0"
  },
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts"
  }
}
```

### .env
```
DATABASE_URL=postgresql://user:pass@localhost/db
JWT_SECRET=your-secret-key
PORT=3000
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist"
  }
}
```

---

## 7️⃣ 테스트 케이스

### Test 1: 기본 API
```
입력: {intent: create_api, backend: express, db: postgresql}
출력: 기본 Express 서버 + PostgreSQL 연결
```

### Test 2: 인증 포함
```
입력: {..., auth: jwt}
출력: JWT 미들웨어 + 인증 라우트
```

### Test 3: 복합 기능
```
입력: {..., features: [user_mgmt, auth, role_based]}
출력: 완전한 사용자 관리 시스템
```

---

**상태**: 🔍 **설계 중**
**다음 단계**: 템플릿 시스템 구현
