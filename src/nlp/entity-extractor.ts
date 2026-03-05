/**
 * Entity Extractor
 * 자연어에서 기술 스택, 기능, 요구사항 추출
 *
 * Example:
 * "Express + PostgreSQL + JWT"
 * → {frameworks: ["Express"], databases: ["PostgreSQL"], auth_types: ["JWT"], ...}
 */

export interface ExtractedEntity {
  frameworks: string[];      // Express, FastAPI, Django, Go, Rust, React, Vue, Angular
  databases: string[];       // PostgreSQL, MySQL, MongoDB, Redis, SQLite
  auth_types: string[];      // JWT, OAuth2, SAML, 2FA
  features: string[];        // 사용자관리, 결제, 주문, 상품, 보고서, 채팅
  requirements: string[];    // 관리자권한, 실시간, 캐싱, 다국어, 모니터링, 다크모드
}

const FRAMEWORKS = [
  "express", "fastapi", "django", "go", "rust",
  "react", "vue", "next.js", "nextjs", "angular",
  "flask", "spring", "laravel", "rails", "nodejs", "node.js"
];

const DATABASES = [
  "postgresql", "postgres", "mysql", "mongodb", "redis",
  "sqlite", "firebase", "dynamodb", "elasticsearch", "cassandra",
  "mariadb", "cockroachdb", "couchdb", "neo4j"
];

const AUTH_TYPES = [
  "jwt", "oauth", "oauth2", "saml", "2fa", "mfa",
  "basic", "bearer", "api-key", "apikey", "session",
  "ldap", "kerberos", "openid"
];

const FEATURES = [
  "사용자", "유저", "사용자관리", "user management",
  "상품", "product", "상품관리",
  "주문", "order", "주문관리",
  "결제", "payment", "결제시스템",
  "보고서", "report", "리포트",
  "채팅", "chat", "메시지", "messaging",
  "알림", "notification", "푸시",
  "검색", "search",
  "대시보드", "dashboard",
  "분석", "analytics",
  "인벤토리", "inventory",
  "배송", "shipping", "delivery",
  "리뷰", "review", "평점", "rating"
];

const REQUIREMENTS = [
  "관리자", "관리자권한", "admin", "role", "역할",
  "실시간", "real-time", "realtime", "websocket", "ws",
  "캐싱", "caching", "cache",
  "다국어", "i18n", "internationalization", "multilingual",
  "모니터링", "monitoring", "관찰",
  "로깅", "logging", "로그",
  "다크모드", "dark mode", "darkmode",
  "오프라인", "offline", "동기화", "sync",
  "성능", "performance", "최적화", "optimization",
  "보안", "security", "암호화", "encryption",
  "확장", "scalable", "확장성",
  "백업", "backup", "복구", "recovery"
];

export class EntityExtractor {
  /**
   * 텍스트에서 엔티티 추출
   */
  extract(text: string): ExtractedEntity {
    const lowerText = text.toLowerCase();

    return {
      frameworks: this.extractFrameworks(lowerText),
      databases: this.extractDatabases(lowerText),
      auth_types: this.extractAuthTypes(lowerText),
      features: this.extractFeatures(lowerText),
      requirements: this.extractRequirements(lowerText),
    };
  }

  /**
   * 프레임워크 추출
   */
  private extractFrameworks(text: string): string[] {
    const found = new Set<string>();

    // 정규식 패턴으로 매칭 (단어 경계 포함)
    const patterns = [
      /\bexpress(?:\.js|js)?\b/gi,
      /\bfastapi\b/gi,
      /\bdjango\b/gi,
      /\b(?:go\b|golang)/gi,
      /\brust\b/gi,
      /\breact(?:\.js|js)?\b/gi,
      /\bvue(?:\.js|js)?\b/gi,
      /\bnext\.?js\b/gi,
      /\bangular(?:\.js|js)?\b/gi,
      /\bflask\b/gi,
      /\bspring\b/gi,
      /\blaravel\b/gi,
      /\brails\b/gi,
      /\bnode(?:\.?js)?\b/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = this.normalizeFramework(match.toLowerCase());
          if (normalized) found.add(normalized);
        });
      }
    });

    return Array.from(found);
  }

  /**
   * 데이터베이스 추출
   */
  private extractDatabases(text: string): string[] {
    const found = new Set<string>();

    const patterns = [
      /\bpostgres(?:ql)?\b/gi,
      /\bmysql\b/gi,
      /\bmongodb\b/gi,
      /\bredis\b/gi,
      /\bsqlite\b/gi,
      /\bfirebase\b/gi,
      /\bdynamodb\b/gi,
      /\belasticsearch\b/gi,
      /\bcassandra\b/gi,
      /\bmariadb\b/gi,
      /\bcockroach(?:db)?\b/gi,
      /\bcouch(?:db)?\b/gi,
      /\bneo4j\b/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = this.normalizeDatabase(match.toLowerCase());
          if (normalized) found.add(normalized);
        });
      }
    });

    return Array.from(found);
  }

  /**
   * 인증 타입 추출
   */
  private extractAuthTypes(text: string): string[] {
    const found = new Set<string>();

    const patterns = [
      /\bjwt\b/gi,
      /\boauth2?\b/gi,
      /\bsaml\b/gi,
      /\b2fa\b/gi,
      /\bmfa\b/gi,
      /\bbasic\s+auth\b/gi,
      /\bbearer\b/gi,
      /\bapi[\s-]?key\b/gi,
      /\bsession\b/gi,
      /\bldap\b/gi,
      /\bkerberos\b/gi,
      /\bopenid\b/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = this.normalizeAuthType(match.toLowerCase());
          if (normalized) found.add(normalized);
        });
      }
    });

    return Array.from(found);
  }

  /**
   * 기능명 추출
   */
  private extractFeatures(text: string): string[] {
    const found = new Set<string>();

    const patterns = [
      /\b사용자(?:관리)?\b/g,
      /\buser\s*management\b/gi,
      /\busers?\b/gi,
      /\b상품(?:관리)?\b/g,
      /\bproduct(?:관리)?\b/gi,
      /\b주문(?:관리)?\b/g,
      /\border(?:관리)?\b/gi,
      /\b결제(?:시스템)?\b/g,
      /\bpayment(?:시스템)?\b/gi,
      /\b보고서\b/g,
      /\breport(?:s)?\b/gi,
      /\b채팅(?:시스템)?\b/g,
      /\bchat(?:ting)?\b/gi,
      /\b알림\b/g,
      /\bnotification(?:s)?\b/gi,
      /\b푸시\b/g,
      /\bpush\b/gi,
      /\b검색\b/g,
      /\bsearch\b/gi,
      /\b대시보드\b/g,
      /\bdashboard(?:s)?\b/gi,
      /\b분석\b/g,
      /\banalytic(?:s)?\b/gi,
      /\b인벤토리\b/g,
      /\binventory\b/gi,
      /\b배송\b/g,
      /\bshipping|delivery\b/gi,
      /\b리뷰\b/g,
      /\breview(?:s)?\b/gi,
      /\b평점|rating\b/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = this.normalizeFeature(match.toLowerCase());
          if (normalized) found.add(normalized);
        });
      }
    });

    return Array.from(found);
  }

  /**
   * 요구사항 추출
   */
  private extractRequirements(text: string): string[] {
    const found = new Set<string>();

    const patterns = [
      /\b관리자(?:권한)?\b/g,
      /\badmin(?:istrator)?\b/gi,
      /\brole[\s-]?based\b/gi,
      /\b실시간\b/g,
      /\breal[\s-]?time\b/gi,
      /\bwebsocket|ws\b/gi,
      /\b캐싱\b/g,
      /\bcach(?:e|ing)?\b/gi,
      /\b다국어\b/g,
      /\bi18n|internationali[sz]ation\b/gi,
      /\bmultilingual\b/gi,
      /\b모니터링\b/g,
      /\bmonitor(?:ing)?\b/gi,
      /\b로깅|logging\b/gi,
      /\b다크모드\b/g,
      /\bdark\s*mode\b/gi,
      /\b오프라인\b/g,
      /\boffline\b/gi,
      /\b동기화\b/g,
      /\bsync(?:hronize|hronization)?\b/gi,
      /\b성능(?:최적화)?\b/g,
      /\bperformance|optimi[sz]ation\b/gi,
      /\b보안\b/g,
      /\bsecurity\b/gi,
      /\b암호화\b/g,
      /\bencryption\b/gi,
      /\b확장(?:성)?\b/g,
      /\bscalable|scalability\b/gi,
      /\b백업\b/g,
      /\bbackup\b/gi,
      /\b복구\b/g,
      /\brecovery\b/gi,
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = this.normalizeRequirement(match.toLowerCase());
          if (normalized) found.add(normalized);
        });
      }
    });

    return Array.from(found);
  }

  /**
   * 프레임워크명 정규화
   */
  private normalizeFramework(text: string): string | null {
    const normalized: { [key: string]: string } = {
      'express': 'Express',
      'express.js': 'Express',
      'expressjs': 'Express',
      'fastapi': 'FastAPI',
      'django': 'Django',
      'go': 'Go',
      'golang': 'Go',
      'rust': 'Rust',
      'react': 'React',
      'react.js': 'React',
      'reactjs': 'React',
      'vue': 'Vue',
      'vue.js': 'Vue',
      'vuejs': 'Vue',
      'next.js': 'Next.js',
      'nextjs': 'Next.js',
      'angular': 'Angular',
      'angular.js': 'Angular',
      'angularjs': 'Angular',
      'flask': 'Flask',
      'spring': 'Spring',
      'laravel': 'Laravel',
      'rails': 'Rails',
      'node': 'Node.js',
      'node.js': 'Node.js',
      'nodejs': 'Node.js',
    };

    return normalized[text] || null;
  }

  /**
   * 데이터베이스명 정규화
   */
  private normalizeDatabase(text: string): string | null {
    const normalized: { [key: string]: string } = {
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mysql': 'MySQL',
      'mongodb': 'MongoDB',
      'redis': 'Redis',
      'sqlite': 'SQLite',
      'firebase': 'Firebase',
      'dynamodb': 'DynamoDB',
      'elasticsearch': 'Elasticsearch',
      'cassandra': 'Cassandra',
      'mariadb': 'MariaDB',
      'cockroachdb': 'CockroachDB',
      'cockroach': 'CockroachDB',
      'couchdb': 'CouchDB',
      'couch': 'CouchDB',
      'neo4j': 'Neo4j',
    };

    return normalized[text] || null;
  }

  /**
   * 인증 타입 정규화
   */
  private normalizeAuthType(text: string): string | null {
    const normalized: { [key: string]: string } = {
      'jwt': 'JWT',
      'oauth': 'OAuth',
      'oauth2': 'OAuth2',
      'saml': 'SAML',
      '2fa': '2FA',
      'mfa': 'MFA',
      'basic auth': 'Basic Auth',
      'bearer': 'Bearer',
      'api-key': 'API Key',
      'apikey': 'API Key',
      'api key': 'API Key',
      'session': 'Session',
      'ldap': 'LDAP',
      'kerberos': 'Kerberos',
      'openid': 'OpenID',
    };

    return normalized[text] || null;
  }

  /**
   * 기능명 정규화
   */
  private normalizeFeature(text: string): string | null {
    const normalized: { [key: string]: string } = {
      '사용자': 'User Management',
      '사용자관리': 'User Management',
      'user': 'User Management',
      'users': 'User Management',
      'user management': 'User Management',
      '상품': 'Product Management',
      '상품관리': 'Product Management',
      'product': 'Product Management',
      'products': 'Product Management',
      '주문': 'Order Management',
      '주문관리': 'Order Management',
      'order': 'Order Management',
      'orders': 'Order Management',
      '결제': 'Payment',
      '결제시스템': 'Payment',
      'payment': 'Payment',
      'payments': 'Payment',
      '보고서': 'Reporting',
      'report': 'Reporting',
      'reports': 'Reporting',
      '채팅': 'Messaging',
      '채팅시스템': 'Messaging',
      'chat': 'Messaging',
      'chatting': 'Messaging',
      '알림': 'Notifications',
      'notification': 'Notifications',
      'notifications': 'Notifications',
      '푸시': 'Push Notifications',
      'push': 'Push Notifications',
      '검색': 'Search',
      'search': 'Search',
      '대시보드': 'Dashboard',
      'dashboard': 'Dashboard',
      'dashboards': 'Dashboard',
      '분석': 'Analytics',
      'analytics': 'Analytics',
      'analytic': 'Analytics',
      '인벤토리': 'Inventory',
      'inventory': 'Inventory',
      '배송': 'Shipping/Delivery',
      'shipping': 'Shipping/Delivery',
      'delivery': 'Shipping/Delivery',
      '리뷰': 'Reviews',
      'review': 'Reviews',
      'reviews': 'Reviews',
      '평점': 'Ratings',
      'rating': 'Ratings',
      'ratings': 'Ratings',
    };

    return normalized[text] || null;
  }

  /**
   * 요구사항 정규화
   */
  private normalizeRequirement(text: string): string | null {
    const normalized: { [key: string]: string } = {
      '관리자': 'Admin Required',
      '관리자권한': 'Admin Required',
      'admin': 'Admin Required',
      'administrator': 'Admin Required',
      'role-based': 'Role-Based Access',
      'role based': 'Role-Based Access',
      '실시간': 'Real-Time',
      'real-time': 'Real-Time',
      'realtime': 'Real-Time',
      'websocket': 'WebSocket',
      'ws': 'WebSocket',
      '캐싱': 'Caching',
      'cache': 'Caching',
      'caching': 'Caching',
      '다국어': 'Internationalization',
      'i18n': 'Internationalization',
      'internationalization': 'Internationalization',
      'multilingual': 'Internationalization',
      '모니터링': 'Monitoring',
      'monitoring': 'Monitoring',
      'monitor': 'Monitoring',
      '로깅': 'Logging',
      'logging': 'Logging',
      '다크모드': 'Dark Mode',
      'dark mode': 'Dark Mode',
      'darkmode': 'Dark Mode',
      '오프라인': 'Offline Support',
      'offline': 'Offline Support',
      '동기화': 'Sync',
      'sync': 'Sync',
      'synchronize': 'Sync',
      'synchronization': 'Sync',
      '성능': 'Performance',
      'performance': 'Performance',
      '최적화': 'Optimization',
      'optimization': 'Optimization',
      'optimize': 'Optimization',
      '보안': 'Security',
      'security': 'Security',
      '암호화': 'Encryption',
      'encryption': 'Encryption',
      '확장': 'Scalability',
      '확장성': 'Scalability',
      'scalable': 'Scalability',
      'scalability': 'Scalability',
      '백업': 'Backup',
      'backup': 'Backup',
      '복구': 'Recovery',
      'recovery': 'Recovery',
    };

    return normalized[text] || null;
  }
}
