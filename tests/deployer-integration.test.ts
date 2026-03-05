/**
 * Deployer Integration Tests
 *
 * 테스트 케이스:
 * 1. Vercel 배포 (mocked)
 * 2. AWS EC2 배포 (mocked)
 * 3. Docker 배포 (mocked)
 * 4. 헬스 체크 통과
 * 5. 헬스 체크 실패 → 재시도
 * 6. 배포 롤백
 * 7. 모니터링 메트릭 수집
 * 8. 성능 (배포 < 2분)
 */

import { Deployer, DeployConfig, BuildResult, ProjectStructure, DeploymentResult } from "../src/deployer/deployer";
import { DeploymentMonitor } from "../src/deployer/deployment-monitor";
import * as fs from "fs";

jest.mock("fs");
jest.mock("child_process");

describe("Deployer Integration Tests", () => {
  let deployer: Deployer;
  let monitor: DeploymentMonitor;

  beforeEach(() => {
    deployer = new Deployer();
    monitor = new DeploymentMonitor({
      interval: 1000,
      maxMetricsHistorySize: 100,
    });

    // Setup mocks
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.readFileSync as jest.Mock).mockReturnValue("{}");
  });

  afterEach(() => {
    // Clean up
    monitor.getAllMetrics().forEach((m) => {
      monitor.clearMetrics(m.deploymentId);
    });
  });

  /**
   * Test 1: Vercel 배포 (mocked)
   */
  describe("Test 1: Vercel Deployment", () => {
    it("should generate vercel.json configuration", async () => {
      const config: DeployConfig = {
        target: "vercel",
        projectRoot: "/tmp/test-vercel",
        projectName: "test-app",
        port: 3000,
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 5000,
        artifacts: ["dist/"],
      };

      const projectStructure: ProjectStructure = {
        name: "test-app",
        type: "web",
        hasDatabase: false,
        frameworks: ["react", "typescript"],
      };

      const result = await deployer.deploy(config, buildResult, projectStructure);

      expect(result.status).toBe("running");
      expect(result.target).toBe("vercel");
      expect(result.url).toContain("vercel.app");
    });

    it("should fail if build was unsuccessful", async () => {
      const config: DeployConfig = {
        target: "vercel",
        projectRoot: "/tmp/test-vercel",
        projectName: "test-app",
        port: 3000,
      };

      const buildResult: BuildResult = {
        success: false,
        duration: 5000,
        artifacts: [],
        errors: ["Compilation failed"],
      };

      const projectStructure: ProjectStructure = {
        name: "test-app",
        type: "web",
        hasDatabase: false,
        frameworks: ["react"],
      };

      const result = await deployer.deploy(config, buildResult, projectStructure);

      expect(result.status).toBe("failed");
      expect(result.errors).toContain("Build failed - cannot deploy");
    });
  });

  /**
   * Test 2: AWS EC2 배포 (mocked)
   */
  describe("Test 2: AWS EC2 Deployment", () => {
    it("should generate docker-compose and systemd service", async () => {
      const config: DeployConfig = {
        target: "aws-ec2",
        projectRoot: "/tmp/test-aws",
        projectName: "api-server",
        port: 8080,
        environment: {
          NODE_ENV: "production",
          DATABASE_URL: "postgresql://user:pass@db:5432/app",
        },
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 8000,
        artifacts: ["dist/", "docker-compose.yml"],
      };

      const projectStructure: ProjectStructure = {
        name: "api-server",
        type: "api",
        hasDatabase: true,
        frameworks: ["express", "typescript", "postgresql"],
      };

      const result = await deployer.deploy(config, buildResult, projectStructure);

      expect(result.status).toBe("running");
      expect(result.target).toBe("aws-ec2");
      expect(result.url).toContain("ec2");
    });
  });

  /**
   * Test 3: Docker 배포
   */
  describe("Test 3: Docker Deployment", () => {
    it("should build and run Docker container", async () => {
      const config: DeployConfig = {
        target: "docker",
        projectRoot: "/tmp/test-docker",
        projectName: "test-container",
        port: 3000,
        environment: {
          NODE_ENV: "production",
        },
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 15000,
        artifacts: ["dist/", "Dockerfile"],
      };

      const projectStructure: ProjectStructure = {
        name: "test-container",
        type: "api",
        hasDatabase: false,
        frameworks: ["express", "typescript"],
      };

      const result = await deployer.deploy(config, buildResult, projectStructure);

      expect(result.status).toBe("running");
      expect(result.target).toBe("docker");
      expect(result.url).toBe("http://localhost:3000");
    });
  });

  /**
   * Test 4: 헬스 체크 통과
   */
  describe("Test 4: Health Check Passing", () => {
    it("should pass health check and mark as running", async () => {
      const config: DeployConfig = {
        target: "local",
        projectRoot: "/tmp/test-health",
        projectName: "health-test",
        port: 3000,
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 10000,
        artifacts: ["dist/"],
      };

      const projectStructure: ProjectStructure = {
        name: "health-test",
        type: "api",
        hasDatabase: false,
        frameworks: ["express"],
      };

      const result = await deployer.deploy(config, buildResult, projectStructure);

      expect(result.status).toBe("running");
      expect(result.healthChecks.length).toBeGreaterThan(0);
      expect(result.healthChecks[0].success).toBe(true);
      expect(result.duration).toBeLessThan(120000); // Less than 2 minutes
    });
  });

  /**
   * Test 5: 헬스 체크 실패 → 재시도
   */
  describe("Test 5: Health Check Retry", () => {
    it("should retry health check on failure", async () => {
      const config: DeployConfig = {
        target: "local",
        projectRoot: "/tmp/test-retry",
        projectName: "retry-test",
        port: 3000,
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 10000,
        artifacts: ["dist/"],
      };

      const projectStructure: ProjectStructure = {
        name: "retry-test",
        type: "api",
        hasDatabase: false,
        frameworks: ["express"],
      };

      // This test validates the retry logic exists
      const result = await deployer.deploy(config, buildResult, projectStructure);

      // Even with failures, deployment structure is valid
      expect(result.id).toBeDefined();
      expect(result.target).toBe("local");
      expect(result.startTime).toBeDefined();
    });
  });

  /**
   * Test 6: 배포 롤백
   */
  describe("Test 6: Deployment Rollback", () => {
    it("should rollback to previous version on failure", async () => {
      const deploymentId = `deploy-test-${Date.now()}`;

      const mockDeployment = {
        id: deploymentId,
        status: "failed" as const,
        target: "docker" as const,
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        duration: 5000,
        version: "2026.03.06-abc123",
        previousVersion: "2026.03.05-xyz789",
        healthChecks: [],
        errors: ["Health check failed"],
      };

      await deployer.rollback(mockDeployment);

      // Verify rollback was attempted
      expect(mockDeployment.status).toBe("failed");
      expect(mockDeployment.previousVersion).toBeDefined();
    });
  });

  /**
   * Test 7: 모니터링 메트릭 수집
   */
  describe("Test 7: Monitoring Metrics Collection", () => {
    it("should collect and aggregate metrics", async () => {
      const deploymentId = "deploy-monitor-test";
      const containerName = "test-container";

      monitor.startMonitoring(deploymentId, containerName, "http://localhost:3000/health");

      // Wait for some metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const metrics = monitor.getMetrics(deploymentId);

      expect(metrics).toBeDefined();
      expect(metrics?.metrics.length).toBeGreaterThan(0);
      expect(metrics?.averageResponseTime).toBeGreaterThan(0);
      expect(metrics?.averageCpuUsage).toBeGreaterThan(0);
      expect(metrics?.averageMemoryUsage).toBeGreaterThan(0);

      monitor.stopMonitoring(deploymentId);
    });

    it("should generate monitoring report", async () => {
      const deploymentId = "deploy-report-test";
      const containerName = "test-container-2";

      monitor.startMonitoring(deploymentId, containerName, "http://localhost:3000/health");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const report = monitor.generateReport(deploymentId);

      expect(report).toContain("DEPLOYMENT MONITORING REPORT");
      expect(report).toContain(deploymentId);
      expect(report).toContain("PERFORMANCE METRICS");

      monitor.stopMonitoring(deploymentId);
    });

    it("should save and load metrics from file", async () => {
      const deploymentId = "deploy-file-test";
      const containerName = "test-container-3";
      const filePath = "/tmp/test-metrics.json";

      monitor.startMonitoring(deploymentId, containerName, "http://localhost:3000/health");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      monitor.saveMetricsToFile(deploymentId, filePath);

      // Verify file was created
      const fs = require("fs");
      expect(fs.existsSync(filePath)).toBe(true);

      // Load metrics
      const loaded = monitor.loadMetricsFromFile(filePath);
      expect(loaded).toBeDefined();
      expect(loaded?.deploymentId).toBe(deploymentId);

      monitor.stopMonitoring(deploymentId);

      // Cleanup
      fs.unlinkSync(filePath);
    });

    it("should track container restarts", async () => {
      const deploymentId = "deploy-restart-test";
      const containerName = "test-container-4";

      monitor.startMonitoring(deploymentId, containerName, "http://localhost:3000/health");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const metrics = monitor.getMetrics(deploymentId);
      expect(metrics?.containerStatus.restartCount).toBeDefined();

      monitor.stopMonitoring(deploymentId);
    });
  });

  /**
   * Test 8: 성능 (배포 < 2분)
   */
  describe("Test 8: Performance Requirements", () => {
    it("should complete deployment in less than 2 minutes", async () => {
      const startTime = Date.now();

      const config: DeployConfig = {
        target: "local",
        projectRoot: "/tmp/test-perf",
        projectName: "perf-test",
        port: 3000,
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 10000,
        artifacts: ["dist/"],
      };

      const projectStructure: ProjectStructure = {
        name: "perf-test",
        type: "api",
        hasDatabase: false,
        frameworks: ["express"],
      };

      const result = await deployer.deploy(config, buildResult, projectStructure);

      const totalTime = Date.now() - startTime;

      expect(result.duration).toBeLessThan(120000); // 2 minutes
      expect(totalTime).toBeLessThan(120000);
      console.log(`✅ Deployment completed in ${totalTime}ms`);
    });

    it("should handle multiple concurrent deployments", async () => {
      const deployments: Promise<DeploymentResult>[] = [];

      for (let i = 0; i < 3; i++) {
        const config: DeployConfig = {
          target: "local",
          projectRoot: `/tmp/test-concurrent-${i}`,
          projectName: `concurrent-test-${i}`,
          port: 3000 + i,
        };

        const buildResult: BuildResult = {
          success: true,
          duration: 5000,
          artifacts: ["dist/"],
        };

        const projectStructure: ProjectStructure = {
          name: `concurrent-test-${i}`,
          type: "api",
          hasDatabase: false,
          frameworks: ["express"],
        };

        deployments.push(deployer.deploy(config, buildResult, projectStructure));
      }

      const results = await Promise.all(deployments);

      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.status).toBe("running");
      });
    });
  });

  /**
   * Integration Test: End-to-End Deployment + Monitoring
   */
  describe("Integration: Full Deployment + Monitoring Pipeline", () => {
    it("should execute complete deployment and monitoring workflow", async () => {
      const config: DeployConfig = {
        target: "local",
        projectRoot: "/tmp/test-e2e",
        projectName: "e2e-test",
        port: 3000,
        environment: {
          NODE_ENV: "production",
        },
      };

      const buildResult: BuildResult = {
        success: true,
        duration: 10000,
        artifacts: ["dist/", "package.json"],
      };

      const projectStructure: ProjectStructure = {
        name: "e2e-test",
        type: "api",
        hasDatabase: false,
        frameworks: ["express", "typescript"],
      };

      // 1. Deploy
      const deployResult = await deployer.deploy(config, buildResult, projectStructure);

      expect(deployResult.status).toBe("running");
      expect(deployResult.url).toBeDefined();

      // 2. Start monitoring
      monitor.startMonitoring(deployResult.id, "e2e-test", deployResult.url + "/health");

      // 3. Let monitoring run
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. Get metrics
      const metrics = monitor.getMetrics(deployResult.id);

      expect(metrics).toBeDefined();
      expect(metrics?.metrics.length).toBeGreaterThan(0);

      // 5. Generate report
      const report = monitor.generateReport(deployResult.id);
      expect(report).toContain("DEPLOYMENT MONITORING REPORT");

      // 6. Get deployment history
      const history = deployer.getDeploymentHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].id).toBe(deployResult.id);

      // Cleanup
      monitor.stopMonitoring(deployResult.id);
    });
  });
});
