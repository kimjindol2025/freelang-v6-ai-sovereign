import PipelineGenerator, {
  PipelineConfig,
  TestConfig,
  DeployConfig,
} from '../src/cicd/pipeline-generator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PipelineGenerator', () => {
  let generator: PipelineGenerator;
  let tempDir: string;

  const testConfig: PipelineConfig = {
    projectName: 'freelang-v6-ai-sovereign',
    languages: ['TypeScript', 'JavaScript'],
    deployTargets: ['vercel', 'aws', 'gcp'],
    slackWebhook: 'https://hooks.slack.com/services/test',
    testFramework: 'jest',
    e2eFramework: 'cypress',
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-test-'));
    generator = new PipelineGenerator(testConfig, undefined, undefined, tempDir);
  });

  afterEach(() => {
    // 임시 디렉토리 정리
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ============================================
  // GitHub Actions 생성 테스트
  // ============================================
  describe('GitHub Actions 생성', () => {
    test('GitHub Actions 워크플로우 디렉토리 생성', () => {
      generator.generateGitHubActions();
      const workflowDir = path.join(tempDir, '.github/workflows');
      expect(fs.existsSync(workflowDir)).toBe(true);
    });

    test('CI/CD YAML 파일 생성', () => {
      generator.generateGitHubActions();
      const cicdFile = path.join(tempDir, '.github/workflows/ci-cd.yml');
      expect(fs.existsSync(cicdFile)).toBe(true);
      const content = fs.readFileSync(cicdFile, 'utf-8');
      expect(content).toContain('CI/CD Pipeline');
      expect(content).toContain('lint');
      expect(content).toContain('test');
      expect(content).toContain('build');
    });

    test('Vercel YAML 파일 생성', () => {
      generator.generateGitHubActions();
      const vercelFile = path.join(tempDir, '.github/workflows/deploy-vercel.yml');
      expect(fs.existsSync(vercelFile)).toBe(true);
      const content = fs.readFileSync(vercelFile, 'utf-8');
      expect(content).toContain('Deploy to Vercel');
      expect(content).toContain('VERCEL_TOKEN');
    });

    test('AWS YAML 파일 생성', () => {
      generator.generateGitHubActions();
      const awsFile = path.join(tempDir, '.github/workflows/deploy-aws.yml');
      expect(fs.existsSync(awsFile)).toBe(true);
      const content = fs.readFileSync(awsFile, 'utf-8');
      expect(content).toContain('Deploy to AWS');
      expect(content).toContain('AWS_ACCESS_KEY_ID');
      expect(content).toContain('ECS');
    });

    test('GCP YAML 파일 생성', () => {
      generator.generateGitHubActions();
      const gcpFile = path.join(tempDir, '.github/workflows/deploy-gcp.yml');
      expect(fs.existsSync(gcpFile)).toBe(true);
      const content = fs.readFileSync(gcpFile, 'utf-8');
      expect(content).toContain('Deploy to GCP');
      expect(content).toContain('Cloud Run');
    });
  });

  // ============================================
  // 테스트 파이프라인 테스트
  // ============================================
  describe('테스트 파이프라인 설정', () => {
    test('단위 테스트 설정 포함', () => {
      const testPipeline = generator.setupTestPipeline() as any;
      expect(testPipeline).toHaveProperty('unitTest');
      expect(testPipeline.unitTest).toHaveProperty('enabled');
      expect(testPipeline.unitTest).toHaveProperty('framework');
    });

    test('E2E 테스트 설정 포함', () => {
      const testPipeline = generator.setupTestPipeline() as any;
      expect(testPipeline).toHaveProperty('e2eTest');
      expect(testPipeline.e2eTest).toHaveProperty('enabled');
      expect(testPipeline.e2eTest).toHaveProperty('framework');
      expect(testPipeline.e2eTest.framework).toBe('cypress');
    });

    test('성능 테스트 설정 포함', () => {
      const testPipeline = generator.setupTestPipeline() as any;
      expect(testPipeline).toHaveProperty('performanceTest');
      expect(testPipeline.performanceTest).toHaveProperty('metrics');
      expect(Array.isArray(testPipeline.performanceTest.metrics)).toBe(true);
    });

    test('린팅 설정 포함', () => {
      const testPipeline = generator.setupTestPipeline() as any;
      expect(testPipeline).toHaveProperty('linting');
      expect(testPipeline.linting).toHaveProperty('enabled');
      expect(testPipeline.linting.tools).toContain('eslint');
    });

    test('커버리지 임계값 설정', () => {
      const testCfg: TestConfig = {
        unitTest: true,
        e2eTest: true,
        performanceTest: true,
        coverageThreshold: 85,
      };
      const gen = new PipelineGenerator(testConfig, testCfg, undefined, tempDir);
      const testPipeline = gen.setupTestPipeline() as any;
      expect(testPipeline.unitTest.coverage).toBe(85);
    });
  });

  // ============================================
  // 배포 파이프라인 테스트
  // ============================================
  describe('배포 파이프라인 설정', () => {
    test('개발/스테이징/프로덕션 환경 설정', () => {
      const deployPipeline = generator.setupDeploymentPipeline() as any;
      expect(deployPipeline).toHaveProperty('environments');
      expect(deployPipeline.environments).toHaveProperty('dev');
      expect(deployPipeline.environments).toHaveProperty('staging');
      expect(deployPipeline.environments).toHaveProperty('prod');
    });

    test('Blue-Green 배포 설정', () => {
      const deployPipeline = generator.setupDeploymentPipeline() as any;
      expect(deployPipeline.strategies).toHaveProperty('blueGreen');
      expect(deployPipeline.strategies.blueGreen).toBe(true);
    });

    test('자동 롤백 설정', () => {
      const deployPipeline = generator.setupDeploymentPipeline() as any;
      expect(deployPipeline.strategies).toHaveProperty('autoRollback');
      expect(deployPipeline.strategies.autoRollback).toBe(true);
    });

    test('배포 전/후 작업 설정', () => {
      const deployPipeline = generator.setupDeploymentPipeline() as any;
      expect(deployPipeline).toHaveProperty('preDeployment');
      expect(deployPipeline).toHaveProperty('postDeployment');
      expect(deployPipeline.preDeployment.runTests).toBe(true);
      expect(deployPipeline.postDeployment.smokeTests).toBe(true);
    });

    test('다중 리전 배포 설정', () => {
      const deployCfg: DeployConfig = {
        environment: 'prod',
        autoRollback: true,
        blueGreenDeploy: true,
        regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      };
      const gen = new PipelineGenerator(testConfig, undefined, deployCfg, tempDir);
      const deployPipeline = gen.setupDeploymentPipeline() as any;
      expect(deployPipeline.strategies.regions).toHaveLength(3);
      expect(deployPipeline.strategies.regions).toContain('eu-west-1');
    });
  });

  // ============================================
  // 모니터링 테스트
  // ============================================
  describe('모니터링 및 알림 설정', () => {
    test('로깅 설정 포함', () => {
      const monitoring = generator.setupMonitoring() as any;
      expect(monitoring).toHaveProperty('logging');
      expect(monitoring.logging.enabled).toBe(true);
      expect(monitoring.logging).toHaveProperty('retention');
    });

    test('메트릭 수집 설정', () => {
      const monitoring = generator.setupMonitoring() as any;
      expect(monitoring).toHaveProperty('metrics');
      expect(monitoring.metrics.enabled).toBe(true);
      expect(Array.isArray(monitoring.metrics.metrics)).toBe(true);
      expect(monitoring.metrics.metrics.length).toBeGreaterThan(0);
    });

    test('알림 규칙 설정', () => {
      const monitoring = generator.setupMonitoring() as any;
      expect(monitoring).toHaveProperty('alerts');
      expect(monitoring.alerts.enabled).toBe(true);
      expect(Array.isArray(monitoring.alerts.rules)).toBe(true);
      const rules = monitoring.alerts.rules as any[];
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('severity');
    });

    test('Slack 알림 설정', () => {
      const monitoring = generator.setupMonitoring() as any;
      expect(monitoring).toHaveProperty('slackNotifications');
      expect(monitoring.slackNotifications.enabled).toBe(true);
      expect(monitoring.slackNotifications.webhook).toBeTruthy();
    });

    test('다중 채널 알림', () => {
      const monitoring = generator.setupMonitoring() as any;
      expect(monitoring.alerts.channels).toContain('slack');
      expect(monitoring.alerts.channels).toContain('email');
    });
  });

  // ============================================
  // 버전 태깅 테스트
  // ============================================
  describe('자동 버전 태깅', () => {
    test('Semantic Versioning 설정', () => {
      const versioning = generator.setupVersionTagging() as any;
      expect(versioning).toHaveProperty('scheme');
      expect(versioning.scheme).toBe('semver');
    });

    test('자동 증분 설정', () => {
      const versioning = generator.setupVersionTagging() as any;
      expect(versioning).toHaveProperty('autoIncrement');
      expect(versioning.autoIncrement).toBe(true);
    });

    test('태그 규칙 설정', () => {
      const versioning = generator.setupVersionTagging() as any;
      expect(versioning).toHaveProperty('tagRules');
      expect(versioning.tagRules).toHaveProperty('major');
      expect(versioning.tagRules).toHaveProperty('minor');
      expect(versioning.tagRules).toHaveProperty('patch');
    });

    test('체인지로그 생성', () => {
      const versioning = generator.setupVersionTagging() as any;
      expect(versioning).toHaveProperty('changelog');
      expect(versioning.changelog).toBe(true);
    });
  });

  // ============================================
  // 아티팩트 관리 테스트
  // ============================================
  describe('아티팩트 관리', () => {
    test('보관 정책 설정', () => {
      const artifacts = generator.setupArtifactManagement() as any;
      expect(artifacts).toHaveProperty('retention');
      expect(artifacts.retention).toHaveProperty('buildArtifacts');
      expect(artifacts.retention).toHaveProperty('testReports');
      expect(artifacts.retention).toHaveProperty('logs');
    });

    test('압축 설정', () => {
      const artifacts = generator.setupArtifactManagement() as any;
      expect(artifacts).toHaveProperty('compression');
      expect(artifacts.compression).toBe(true);
    });

    test('S3 저장소 설정', () => {
      const artifacts = generator.setupArtifactManagement() as any;
      expect(artifacts.storage).toHaveProperty('type');
      expect(artifacts.storage.type).toBe('s3');
      expect(artifacts.storage).toHaveProperty('bucket');
    });
  });

  // ============================================
  // 보안 스캔 테스트
  // ============================================
  describe('보안 스캔 설정', () => {
    test('의존성 취약점 검사', () => {
      const security = generator.setupSecurityScanning() as any;
      expect(security).toHaveProperty('dependencyCheck');
      expect(security.dependencyCheck.enabled).toBe(true);
    });

    test('코드 품질 검사', () => {
      const security = generator.setupSecurityScanning() as any;
      expect(security).toHaveProperty('codeQuality');
      expect(security.codeQuality.enabled).toBe(true);
      expect(security.codeQuality).toHaveProperty('threshold');
    });

    test('시크릿 스캔', () => {
      const security = generator.setupSecurityScanning() as any;
      expect(security).toHaveProperty('secretScanning');
      expect(security.secretScanning.enabled).toBe(true);
      expect(Array.isArray(security.secretScanning.tools)).toBe(true);
    });

    test('컨테이너 이미지 스캔', () => {
      const security = generator.setupSecurityScanning() as any;
      expect(security).toHaveProperty('containerScan');
      expect(security.containerScan.enabled).toBe(true);
      expect(Array.isArray(security.containerScan.registries)).toBe(true);
    });
  });

  // ============================================
  // 통합 테스트
  // ============================================
  describe('통합 테스트', () => {
    test('모든 워크플로우 파일 생성 성공', () => {
      generator.generateGitHubActions();

      const files = [
        '.github/workflows/ci-cd.yml',
        '.github/workflows/deploy-vercel.yml',
        '.github/workflows/deploy-aws.yml',
        '.github/workflows/deploy-gcp.yml',
      ];

      files.forEach((file) => {
        const fullPath = path.join(tempDir, file);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
      });
    });

    test('파이프라인 설정 객체 일관성', () => {
      const testPipeline = generator.setupTestPipeline() as any;
      const deployPipeline = generator.setupDeploymentPipeline() as any;
      const monitoring = generator.setupMonitoring() as any;

      expect(testPipeline).toHaveProperty('unitTest');
      expect(deployPipeline).toHaveProperty('environments');
      expect(monitoring).toHaveProperty('logging');
    });

    test('완전한 파이프라인 설정 생성', () => {
      const configs = {
        test: generator.setupTestPipeline(),
        deploy: generator.setupDeploymentPipeline(),
        monitoring: generator.setupMonitoring(),
        versioning: generator.setupVersionTagging(),
        artifacts: generator.setupArtifactManagement(),
        security: generator.setupSecurityScanning(),
      };

      Object.values(configs).forEach((config) => {
        expect(config).toBeTruthy();
        expect(typeof config).toBe('object');
      });
    });
  });
});
