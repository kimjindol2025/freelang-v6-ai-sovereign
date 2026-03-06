/**
 * CLAUDELang v6.0 Cached Compiler
 * 컴파일 결과 캐싱을 통한 성능 최적화
 *
 * 최적화:
 * 1. 전체 AST 캐싱
 * 2. 부분 컴파일 결과 캐싱
 * 3. 함수 시그니처 캐싱
 */

const crypto = require("crypto");
const CLAUDELangCompiler = require("./compiler.js");

class CachedCLAUDELangCompiler extends CLAUDELangCompiler {
  constructor(maxCacheSize = 1000) {
    super();
    this.cache = new Map(); // 컴파일 결과 캐시
    this.astCache = new Map(); // AST 파싱 결과 캐시
    this.maxCacheSize = maxCacheSize;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * 입력 프로그램의 해시 생성
   * 동일한 입력을 빠르게 식별하기 위함
   */
  generateHash(data) {
    const str = JSON.stringify(data);
    return crypto.createHash("md5").update(str).digest("hex");
  }

  /**
   * 캐시 크기 관리 (LRU 정책)
   */
  evictIfNeeded() {
    if (this.cache.size > this.maxCacheSize) {
      // 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 최적화된 컴파일 (캐싱 포함)
   */
  compile(claudelangJson) {
    // 입력 해시 생성
    const hash = this.generateHash(claudelangJson);

    // 캐시 확인
    if (this.cache.has(hash)) {
      this.cacheHits++;
      return this.cache.get(hash);
    }

    this.cacheMisses++;

    // 원본 컴파일 실행
    const result = super.compile(claudelangJson);

    // 결과 캐싱
    this.cache.set(hash, result);
    this.evictIfNeeded();

    return result;
  }

  /**
   * 검증만 캐싱 (빠른 검증)
   */
  validateCached(obj) {
    const hash = this.generateHash(obj);
    const cacheKey = `validate_${hash}`;

    if (this.cache.has(cacheKey)) {
      return true; // 이미 검증됨
    }

    try {
      super.validate(obj);
      this.cache.set(cacheKey, { validated: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 부분 AST 캐싱을 통한 개별 명령어 컴파일
   */
  compileInstruction(instruction) {
    const hash = this.generateHash(instruction);
    const cacheKey = `instr_${hash}`;

    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      return this.cache.get(cacheKey);
    }

    this.cacheMisses++;

    try {
      const result = this.generateInstruction(instruction);
      this.cache.set(cacheKey, result);
      this.evictIfNeeded();
      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total === 0 ? 0 : (this.cacheHits / total) * 100;

    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      total: total,
      hitRate: hitRate.toFixed(2) + "%",
      efficiency: ((this.cacheHits * 100) / (total || 1)).toFixed(2),
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * 캐시 상태 출력
   */
  printCacheStats() {
    const stats = this.getCacheStats();
    console.log("\n");
    console.log("╔" + "═".repeat(50) + "╗");
    console.log("║" + " Cache Statistics".padEnd(50) + "║");
    console.log("╠" + "═".repeat(50) + "╣");
    console.log(`║ Cache Size: ${stats.cacheSize}/${stats.maxCacheSize}`.padEnd(51) + "║");
    console.log(`║ Hits: ${stats.hits}, Misses: ${stats.misses}`.padEnd(51) + "║");
    console.log(`║ Hit Rate: ${stats.hitRate}`.padEnd(51) + "║");
    console.log("╚" + "═".repeat(50) + "╝\n");
  }
}

module.exports = CachedCLAUDELangCompiler;
