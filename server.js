#!/usr/bin/env node

/**
 * CLAUDELang v6.0 웹서버
 *
 * 기능:
 * - Playground 호스팅 (포트 3000)
 * - API 엔드포인트 제공
 * - Python 인터프리터 통합
 * - CORS 지원
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const HOST = 'localhost';

// 간단한 라우터
class Router {
  constructor() {
    this.routes = {};
  }

  get(path, handler) {
    if (!this.routes[path]) this.routes[path] = {};
    this.routes[path].GET = handler;
  }

  post(path, handler) {
    if (!this.routes[path]) this.routes[path] = {};
    this.routes[path].POST = handler;
  }

  handle(req, res) {
    const route = this.routes[req.url];
    const method = req.method;

    if (route && route[method]) {
      return route[method](req, res);
    }

    return null;
  }
}

const router = new Router();

// ============================================
// 라우트 정의
// ============================================

// 1. Playground HTML 제공
router.get('/playground.html', (req, res) => {
  const filePath = path.join(__dirname, 'playground.html');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'playground.html not found' }));
  }
});

// 2. 루트 경로 (Playground로 리다이렉트)
router.get('/', (req, res) => {
  res.writeHead(301, { Location: '/playground.html' });
  res.end();
});

// 3. 상태 체크
router.get('/api/health', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '6.0',
    interpreter: 'python3 (claudelang_interpreter.py)'
  }));
});

// 4. 프로그램 실행 API
router.post('/api/execute', (req, res) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const program = data.program;

      if (!program) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No program provided' }));
        return;
      }

      // 임시 파일에 프로그램 저장
      const tempFile = `/tmp/claude_${Date.now()}.clg`;
      fs.writeFileSync(tempFile, JSON.stringify(program, null, 2));

      // Python 인터프리터 실행
      try {
        const output = execSync(
          `python3 claudelang_interpreter.py ${tempFile}`,
          { encoding: 'utf-8', timeout: 5000 }
        );

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          success: true,
          output: output,
          timestamp: new Date().toISOString()
        }));
      } catch (execErr) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          success: false,
          error: execErr.message,
          stderr: execErr.stderr ? execErr.stderr.toString() : ''
        }));
      } finally {
        // 임시 파일 삭제
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}
      }
    } catch (parseErr) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
});

// 5. 테스트 프로그램 조회
router.get('/api/programs/test', (req, res) => {
  const filePath = path.join(__dirname, 'test-ai-evaluation.clg');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const program = JSON.parse(content);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(program));
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Test program not found' }));
  }
});

// 6. 메타데이터
router.get('/api/info', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({
    name: 'CLAUDELang v6.0 Server',
    version: '1.0.0',
    language: 'JSON-based programming language for AI',
    features: [
      '35 built-in functions',
      'Lambda function support',
      'String template interpolation',
      'Arithmetic operations',
      'Cross-platform execution'
    ],
    endpoints: [
      'GET  / (redirect to playground)',
      'GET  /playground.html',
      'GET  /api/health',
      'GET  /api/info',
      'GET  /api/programs/test',
      'POST /api/execute'
    ],
    repository: 'https://gogs.dclub.kr/kim/freelang-v6-ai-sovereign.git'
  }));
});

// ============================================
// 웹서버 생성
// ============================================

const server = http.createServer((req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 라우터 처리
  const handled = router.handle(req, res);
  if (handled !== null) {
    return;
  }

  // 정적 파일 제공 (현재 디렉토리)
  if (req.url !== '/api/execute' && !req.url.startsWith('/api/')) {
    const filePath = path.join(__dirname, req.url === '/' ? 'playground.html' : req.url);

    try {
      // 보안: 상위 디렉토리 접근 방지
      if (!filePath.startsWith(__dirname)) {
        throw new Error('Access denied');
      }

      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);

      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ============================================
// 서버 시작
// ============================================

server.listen(PORT, HOST, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 CLAUDELang v6.0 웹서버 시작                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`📍 서버 주소: http://${HOST}:${PORT}`);
  console.log(`🌐 Playground: http://${HOST}:${PORT}/playground.html\n`);

  console.log('📋 사용 가능한 엔드포인트:');
  console.log(`   GET  http://${HOST}:${PORT}/                  (홈페이지)`);
  console.log(`   GET  http://${HOST}:${PORT}/playground.html   (에디터)`);
  console.log(`   GET  http://${HOST}:${PORT}/api/health        (상태 체크)`);
  console.log(`   GET  http://${HOST}:${PORT}/api/info          (메타데이터)`);
  console.log(`   GET  http://${HOST}:${PORT}/api/programs/test (테스트 프로그램)`);
  console.log(`   POST http://${HOST}:${PORT}/api/execute       (프로그램 실행)\n`);

  console.log('🛑 종료하려면: Ctrl+C를 누르세요\n');
  console.log('═══════════════════════════════════════════════════════════\n');
});

// 에러 처리
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${PORT}은 이미 사용 중입니다.`);
    console.error(`다른 포트를 사용하거나 기존 프로세스를 종료하세요.\n`);
    console.error('현재 프로세스:');
    try {
      execSync(`lsof -i :${PORT}`);
    } catch (e) {}
    process.exit(1);
  } else {
    console.error('서버 에러:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버 종료됨\n');
    process.exit(0);
  });
});
