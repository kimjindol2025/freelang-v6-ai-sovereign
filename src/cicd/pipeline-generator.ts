import * as fs from 'fs';
import * as path from 'path';

export interface PipelineConfig {
  projectName: string;
  languages: string[];
  deployTargets: ('vercel' | 'aws' | 'gcp' | 'docker')[];
  slackWebhook?: string;
  testFramework: 'jest' | 'mocha' | 'vitest';
  e2eFramework: 'cypress' | 'playwright' | 'selenium';
}

export interface TestConfig {
  unitTest: boolean;
  e2eTest: boolean;
  performanceTest: boolean;
  coverageThreshold: number;
}

export interface DeployConfig {
  environment: 'dev' | 'staging' | 'prod';
  autoRollback: boolean;
  blueGreenDeploy: boolean;
  regions?: string[];
}

export class PipelineGenerator {
  private config: PipelineConfig;
  private testConfig: TestConfig;
  private deployConfig: DeployConfig;
  private projectRoot: string;

  constructor(
    config: PipelineConfig,
    testConfig: TestConfig = {
      unitTest: true,
      e2eTest: true,
      performanceTest: true,
      coverageThreshold: 80,
    },
    deployConfig: DeployConfig = {
      environment: 'prod',
      autoRollback: true,
      blueGreenDeploy: true,
    },
    projectRoot: string = process.cwd()
  ) {
    this.config = config;
    this.testConfig = testConfig;
    this.deployConfig = deployConfig;
    this.projectRoot = projectRoot;
  }

  /**
   * 메인 파이프라인 생성 (GitHub Actions)
   */
  generateGitHubActions(): void {
    this.ensureDirectory('.github/workflows');

    // CI/CD 메인 파이프라인
    const cicdYaml = this.generateCICDWorkflow();
    fs.writeFileSync(
      path.join(this.projectRoot, '.github/workflows/ci-cd.yml'),
      cicdYaml
    );

    // Vercel 배포
    if (this.config.deployTargets.includes('vercel')) {
      const vercelYaml = this.generateVercelWorkflow();
      fs.writeFileSync(
        path.join(this.projectRoot, '.github/workflows/deploy-vercel.yml'),
        vercelYaml
      );
    }

    // AWS 배포
    if (this.config.deployTargets.includes('aws')) {
      const awsYaml = this.generateAWSWorkflow();
      fs.writeFileSync(
        path.join(this.projectRoot, '.github/workflows/deploy-aws.yml'),
        awsYaml
      );
    }

    // GCP 배포
    if (this.config.deployTargets.includes('gcp')) {
      const gcpYaml = this.generateGCPWorkflow();
      fs.writeFileSync(
        path.join(this.projectRoot, '.github/workflows/deploy-gcp.yml'),
        gcpYaml
      );
    }
  }

  /**
   * CI/CD 메인 워크플로우 생성
   */
  private generateCICDWorkflow(): string {
    const nodeVersions = ['18.x', '20.x'];
    const pythonVersions = ['3.11', '3.12'];

    let yaml = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  # ============================================
  # Step 1: 린트 검사 (Lint)
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정 (18.x)
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 의존성 설치
        run: npm ci

      - name: ESLint 실행
        run: npm run lint || true

      - name: TypeScript 타입 검사
        run: npx tsc --noEmit || true

  # ============================================
  # Step 2: 단위 테스트 (Unit Tests)
  # ============================================
  test:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        node-version: ${JSON.stringify(nodeVersions)}
    steps:
      - uses: actions/checkout@v4

      - name: Node.js \${{ matrix.node-version }} 설정
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: npm

      - name: 의존성 설치
        run: npm ci

      - name: 단위 테스트 실행
        run: npm run test -- --coverage

      - name: 코드 커버리지 업로드
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  # ============================================
  # Step 3: E2E 테스트
  # ============================================
  e2e:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 의존성 설치
        run: npm ci

      - name: 빌드
        run: npm run build

      - name: E2E 테스트 실행
        run: npm run test:e2e || true

  # ============================================
  # Step 4: 빌드
  # ============================================
  build:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 의존성 설치
        run: npm ci

      - name: 프로젝트 빌드
        run: npm run build

      - name: 빌드 아티팩트 업로드
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  # ============================================
  # Step 5: 성능 테스트
  # ============================================
  performance:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 의존성 설치
        run: npm ci

      - name: 성능 테스트
        run: npm run test -- tests/performance.test.ts || true

      - name: 결과 저장
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: performance-results
          path: test-results/

  # ============================================
  # Step 6: Docker 빌드 (선택)
  # ============================================
  docker-build:
    runs-on: ubuntu-latest
    needs: build
    if: \${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
    steps:
      - uses: actions/checkout@v4

      - name: QEMU 설정
        uses: docker/setup-qemu-action@v3

      - name: Docker Buildx 설정
        uses: docker/setup-buildx-action@v3

      - name: GitHub Container Registry 로그인
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: 메타데이터 추출
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: Docker 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}

  # ============================================
  # Step 7: 배포 게이트
  # ============================================
  deploy-gate:
    runs-on: ubuntu-latest
    needs: [test, build, performance, docker-build]
    if: \${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
    outputs:
      deploy-ready: \${{ steps.check.outputs.ready }}
    steps:
      - uses: actions/checkout@v4

      - name: 배포 준비 확인
        id: check
        run: |
          echo "ready=true" >> \$GITHUB_OUTPUT
`;

    return yaml;
  }

  /**
   * Vercel 배포 워크플로우
   */
  private generateVercelWorkflow(): string {
    return `name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  workflow_run:
    workflows: [ "CI/CD Pipeline" ]
    types: [ completed ]
    branches: [ main ]

jobs:
  deploy-vercel:
    runs-on: ubuntu-latest
    if: \${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'push' }}
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18.x

      - name: Vercel CLI 설치
        run: npm install -g vercel

      - name: Vercel 배포 (프로덕션)
        run: vercel --prod --confirm
        env:
          VERCEL_TOKEN: \${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}

  notify-success:
    runs-on: ubuntu-latest
    needs: deploy-vercel
    if: \${{ success() }}
    steps:
      - name: Slack 알림
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "Vercel 배포 성공 ✅",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Vercel 배포 완료* ✅\nCommit: <\${{ github.event.head_commit.url }}|\${{ github.event.head_commit.message }}>\nAuthor: \${{ github.event.head_commit.author.name }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}

  notify-failure:
    runs-on: ubuntu-latest
    needs: deploy-vercel
    if: \${{ failure() }}
    steps:
      - name: Slack 알림 (실패)
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "Vercel 배포 실패 ❌",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Vercel 배포 실패* ❌\nCheck logs: <\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}|Link>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
`;
  }

  /**
   * AWS 배포 워크플로우
   */
  private generateAWSWorkflow(): string {
    return `name: Deploy to AWS

on:
  push:
    branches: [ main ]
  workflow_run:
    workflows: [ "CI/CD Pipeline" ]
    types: [ completed ]
    branches: [ main ]

jobs:
  deploy-aws:
    runs-on: ubuntu-latest
    if: \${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'push' }}
    strategy:
      matrix:
        region: [ us-east-1, us-west-2, eu-west-1 ]
    steps:
      - uses: actions/checkout@v4

      - name: AWS 자격증명 설정
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ matrix.region }}

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 의존성 설치 및 빌드
        run: |
          npm ci
          npm run build

      - name: ECR에 로그인
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Docker 이미지 빌드 및 푸시
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: freelang-v6
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          echo "\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" > image.txt

      - name: ECS 작업 정의 업데이트
        run: |
          aws ecs update-service \
            --cluster freelang-prod \
            --service freelang-service \
            --force-new-deployment \
            --region \${{ matrix.region }}

      - name: 배포 상태 확인
        run: |
          aws ecs wait services-stable \
            --cluster freelang-prod \
            --services freelang-service \
            --region \${{ matrix.region }}

  smoke-test-aws:
    runs-on: ubuntu-latest
    needs: deploy-aws
    steps:
      - uses: actions/checkout@v4

      - name: Smoke 테스트
        run: |
          sleep 30
          curl -f https://api.freelang.example.com/health || exit 1

  rollback-on-failure:
    runs-on: ubuntu-latest
    needs: [deploy-aws, smoke-test-aws]
    if: \${{ failure() }}
    steps:
      - name: AWS 자격증명 설정
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: 자동 롤백
        run: |
          aws ecs update-service \
            --cluster freelang-prod \
            --service freelang-service \
            --force-new-deployment \
            --region us-east-1
          echo "✅ 롤백 완료"
`;
  }

  /**
   * GCP 배포 워크플로우
   */
  private generateGCPWorkflow(): string {
    return `name: Deploy to GCP

on:
  push:
    branches: [ main ]
  workflow_run:
    workflows: [ "CI/CD Pipeline" ]
    types: [ completed ]
    branches: [ main ]

jobs:
  deploy-gcp:
    runs-on: ubuntu-latest
    if: \${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'push' }}
    steps:
      - uses: actions/checkout@v4

      - name: GCP 인증
        uses: google-github-actions/auth@v2
        with:
          credentials_json: \${{ secrets.GCP_SA_KEY }}

      - name: Google Cloud SDK 설정
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: \${{ secrets.GCP_PROJECT_ID }}

      - name: Docker 인증 설정
        run: |
          gcloud auth configure-docker gcr.io

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 의존성 설치 및 빌드
        run: |
          npm ci
          npm run build

      - name: Docker 이미지 빌드 및 푸시
        run: |
          docker build -t gcr.io/\${{ secrets.GCP_PROJECT_ID }}/freelang-v6:\${{ github.sha }} .
          docker push gcr.io/\${{ secrets.GCP_PROJECT_ID }}/freelang-v6:\${{ github.sha }}

      - name: Cloud Run 배포
        run: |
          gcloud run deploy freelang-v6 \
            --image gcr.io/\${{ secrets.GCP_PROJECT_ID }}/freelang-v6:\${{ github.sha }} \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated \
            --memory 2Gi \
            --cpu 2 \
            --timeout 3600

  health-check-gcp:
    runs-on: ubuntu-latest
    needs: deploy-gcp
    steps:
      - name: 헬스 체크
        run: |
          curl -f https://freelang-v6-xxxxxxx.run.app/health || exit 1
`;
  }

  /**
   * 테스트 파이프라인 설정
   */
  setupTestPipeline(): object {
    return {
      unitTest: {
        enabled: this.testConfig.unitTest,
        framework: this.config.testFramework,
        command: 'npm run test',
        coverage: this.testConfig.coverageThreshold,
      },
      e2eTest: {
        enabled: this.testConfig.e2eTest,
        framework: this.config.e2eFramework,
        command: 'npm run test:e2e',
        timeout: 60000,
      },
      performanceTest: {
        enabled: this.testConfig.performanceTest,
        metrics: ['responseTime', 'memoryUsage', 'cpuUsage'],
        threshold: {
          responseTime: 500, // ms
          memoryUsage: 512, // MB
        },
      },
      linting: {
        enabled: true,
        tools: ['eslint', 'prettier'],
        command: 'npm run lint',
      },
    };
  }

  /**
   * 배포 파이프라인 설정
   */
  setupDeploymentPipeline(): object {
    return {
      environments: {
        dev: {
          branch: 'develop',
          autoApproval: true,
          timeout: 600,
        },
        staging: {
          branch: 'staging',
          autoApproval: false,
          timeout: 1800,
        },
        prod: {
          branch: 'main',
          autoApproval: false,
          timeout: 3600,
          requireApproval: true,
        },
      },
      strategies: {
        blueGreen: this.deployConfig.blueGreenDeploy,
        autoRollback: this.deployConfig.autoRollback,
        canary: true,
        regions: this.deployConfig.regions || ['us-central1'],
      },
      preDeployment: {
        runTests: true,
        validateConfig: true,
        checkResources: true,
      },
      postDeployment: {
        smokeTests: true,
        healthChecks: true,
        monitoring: true,
      },
    };
  }

  /**
   * 모니터링 및 알림 설정
   */
  setupMonitoring(): object {
    return {
      logging: {
        enabled: true,
        service: 'CloudLogging',
        level: 'INFO',
        retention: 30, // days
      },
      metrics: {
        enabled: true,
        service: 'Prometheus',
        scrapeInterval: 15, // seconds
        metrics: [
          'http_requests_total',
          'http_request_duration_seconds',
          'process_memory_bytes',
          'deployment_status',
        ],
      },
      alerts: {
        enabled: true,
        channels: ['slack', 'email'],
        rules: [
          {
            name: 'HighErrorRate',
            condition: 'error_rate > 5%',
            severity: 'critical',
          },
          {
            name: 'DeploymentFailure',
            condition: 'deployment_status == failed',
            severity: 'critical',
          },
          {
            name: 'HighLatency',
            condition: 'p95_latency > 1000ms',
            severity: 'warning',
          },
        ],
      },
      slackNotifications: {
        enabled: !!this.config.slackWebhook,
        webhook: this.config.slackWebhook,
        events: ['deployment', 'error', 'alert'],
      },
    };
  }

  /**
   * 자동 버전 태깅
   */
  setupVersionTagging(): object {
    return {
      scheme: 'semver',
      prefix: 'v',
      autoIncrement: true,
      changelog: true,
      tagRules: {
        major: ['BREAKING CHANGE'],
        minor: ['feat:'],
        patch: ['fix:', 'chore:'],
      },
    };
  }

  /**
   * 문서 생성 및 아티팩트 관리
   */
  setupArtifactManagement(): object {
    return {
      retention: {
        buildArtifacts: 30, // days
        testReports: 90, // days
        logs: 180, // days
      },
      compression: true,
      storage: {
        type: 's3',
        bucket: 'freelang-v6-artifacts',
        prefix: 'ci-cd/',
      },
    };
  }

  /**
   * 보안 스캔 설정
   */
  setupSecurityScanning(): object {
    return {
      dependencyCheck: {
        enabled: true,
        tool: 'snyk',
      },
      codeQuality: {
        enabled: true,
        tool: 'sonarqube',
        threshold: {
          coverage: 80,
          duplication: 3,
        },
      },
      secretScanning: {
        enabled: true,
        tools: ['gitleaks', 'truffleHog'],
      },
      containerScan: {
        enabled: true,
        registries: ['gcr.io', 'docker.io'],
      },
    };
  }

  /**
   * 디렉토리 확인/생성
   */
  private ensureDirectory(dirPath: string): void {
    const fullPath = path.join(this.projectRoot, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

export default PipelineGenerator;
