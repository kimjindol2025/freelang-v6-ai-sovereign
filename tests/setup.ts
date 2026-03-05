/**
 * Jest Setup File
 * 모든 테스트 전에 실행되는 글로벌 설정
 */

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Jest 타임아웃 기본값
jest.setTimeout(10000);

// 전역 에러 핸들러
global.console = {
  ...console,
  // 테스트 중 console.log 억제 (실패 시만 표시)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // 에러는 항상 표시
  warn: console.warn,
  error: console.error,
};
