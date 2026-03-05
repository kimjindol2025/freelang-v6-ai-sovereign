/**
 * Deployment Monitor
 * 배포된 서비스의 상태를 모니터링
 *
 * 모니터링 항목:
 * - 컨테이너 상태 (Up/Down/Restarting)
 * - 응답 시간 (ms)
 * - CPU/메모리 사용률
 * - 에러율
 * - 배포 히스토리 저장
 * - 자동 재시작 (실패 시)
 */

import * as fs from "fs";
import * as path from "path";

export interface MetricData {
  timestamp: number;
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  errorRate: number;
  isHealthy: boolean;
}

export interface ContainerStatus {
  id: string;
  name: string;
  status: "up" | "down" | "restarting" | "exited";
  uptime: number; // milliseconds
  restartCount: number;
  createdAt: number;
}

export interface DeploymentMetrics {
  deploymentId: string;
  containerStatus: ContainerStatus;
  metrics: MetricData[];
  currentStatus: "healthy" | "unhealthy" | "degraded";
  lastCheck: number;
  averageResponseTime: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  totalErrors: number;
  uptime: number;
}

export interface MonitoringConfig {
  interval: number; // milliseconds (default: 10000)
  maxMetricsHistorySize: number; // keep last N metrics
  errorThreshold: number; // error rate threshold for unhealthy status
  responseTimeThreshold: number; // ms threshold for degraded status
  cpuThreshold: number; // percentage
  memoryThreshold: number; // percentage
  autoRestart: boolean;
  restartAttempts: number;
}

export class DeploymentMonitor {
  private config: MonitoringConfig = {
    interval: 10000,
    maxMetricsHistorySize: 1000,
    errorThreshold: 0.05, // 5% error rate
    responseTimeThreshold: 500, // 500ms
    cpuThreshold: 80,
    memoryThreshold: 85,
    autoRestart: true,
    restartAttempts: 3,
  };

  private metricsStorage: Map<string, DeploymentMetrics> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private restartCounts: Map<string, number> = new Map();

  constructor(config?: Partial<MonitoringConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * 배포 모니터링 시작
   */
  startMonitoring(deploymentId: string, containerName: string, checkEndpoint: string): void {
    console.log(`\n📊 Starting monitoring for deployment: ${deploymentId}`);

    // Initialize metrics storage
    this.metricsStorage.set(deploymentId, {
      deploymentId,
      containerStatus: {
        id: containerName,
        name: containerName,
        status: "up",
        uptime: 0,
        restartCount: 0,
        createdAt: Date.now(),
      },
      metrics: [],
      currentStatus: "healthy",
      lastCheck: Date.now(),
      averageResponseTime: 0,
      averageCpuUsage: 0,
      averageMemoryUsage: 0,
      totalErrors: 0,
      uptime: 0,
    });

    // Start monitoring interval
    const interval = setInterval(async () => {
      await this.checkDeploymentHealth(deploymentId, containerName, checkEndpoint);
    }, this.config.interval);

    this.monitoringIntervals.set(deploymentId, interval);
  }

  /**
   * 배포 모니터링 중지
   */
  stopMonitoring(deploymentId: string): void {
    const interval = this.monitoringIntervals.get(deploymentId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(deploymentId);
      console.log(`✅ Stopped monitoring for deployment: ${deploymentId}`);
    }
  }

  /**
   * 배포 상태 체크
   */
  private async checkDeploymentHealth(
    deploymentId: string,
    containerName: string,
    checkEndpoint: string
  ): Promise<void> {
    const metrics = this.metricsStorage.get(deploymentId);
    if (!metrics) return;

    try {
      // 1. 컨테이너 상태 확인
      const containerStatus = await this.checkContainerStatus(containerName);
      metrics.containerStatus = containerStatus;

      // 2. 헬스 체크 수행
      const startTime = Date.now();
      let isHealthy = true;
      let error: string | undefined;

      try {
        const response = await this.httpGet(checkEndpoint, 5000);
        if (response.statusCode !== 200) {
          isHealthy = false;
          error = `HTTP ${response.statusCode}`;
        }
      } catch (err) {
        isHealthy = false;
        error = String(err);
      }

      const responseTime = Date.now() - startTime;

      // 3. 메트릭 수집
      const metric: MetricData = {
        timestamp: Date.now(),
        responseTime,
        cpuUsage: this.generateMockCpuUsage(),
        memoryUsage: this.generateMockMemoryUsage(),
        errorRate: isHealthy ? 0 : 1,
        isHealthy,
      };

      metrics.metrics.push(metric);

      // Keep history size under control
      if (metrics.metrics.length > this.config.maxMetricsHistorySize) {
        metrics.metrics.shift();
      }

      // 4. 평균값 계산
      this.calculateAverages(metrics);

      // 5. 상태 결정
      this.updateDeploymentStatus(metrics);

      metrics.lastCheck = Date.now();

      // 6. 자동 재시작 체크
      if (this.config.autoRestart && !isHealthy) {
        await this.handleUnhealthyDeployment(deploymentId, containerName);
      }

      console.log(
        `📊 [${deploymentId}] Status: ${metrics.currentStatus} | Response: ${responseTime}ms | Memory: ${metrics.averageMemoryUsage.toFixed(1)}%`
      );
    } catch (error) {
      console.error(`❌ Health check failed for ${deploymentId}: ${error}`);
      metrics.totalErrors++;
    }
  }

  /**
   * 컨테이너 상태 확인
   */
  private async checkContainerStatus(containerName: string): Promise<ContainerStatus> {
    // Mock implementation - in production would use docker API
    const statusMap: Record<string, ContainerStatus["status"]> = {
      running: "up",
      exited: "down",
      restarting: "restarting",
    };

    return {
      id: containerName,
      name: containerName,
      status: "up", // Mock: assume up
      uptime: Date.now(),
      restartCount: this.restartCounts.get(containerName) || 0,
      createdAt: Date.now(),
    };
  }

  /**
   * HTTP GET 요청
   */
  private httpGet(url: string, timeout: number): Promise<{ statusCode: number; data: string }> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error("HTTP request timeout"));
      }, timeout);

      const http = url.startsWith("https") ? require("https") : require("http");

      http
        .get(url, (res: any) => {
          clearTimeout(timeoutHandle);
          let data = "";

          res.on("data", (chunk: any) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve({
              statusCode: res.statusCode,
              data,
            });
          });
        })
        .on("error", (error: any) => {
          clearTimeout(timeoutHandle);
          reject(error);
        });
    });
  }

  /**
   * 평균값 계산
   */
  private calculateAverages(metrics: DeploymentMetrics): void {
    if (metrics.metrics.length === 0) return;

    const recentMetrics = metrics.metrics.slice(-100); // Last 100 metrics

    metrics.averageResponseTime =
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;

    metrics.averageCpuUsage =
      recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;

    metrics.averageMemoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;

    metrics.totalErrors = recentMetrics.filter((m) => !m.isHealthy).length;
  }

  /**
   * 배포 상태 업데이트
   */
  private updateDeploymentStatus(metrics: DeploymentMetrics): void {
    const errorRate =
      metrics.metrics.length > 0
        ? metrics.totalErrors / Math.min(metrics.metrics.length, 100)
        : 0;

    if (
      metrics.containerStatus.status !== "up" ||
      errorRate > this.config.errorThreshold ||
      metrics.averageCpuUsage > this.config.cpuThreshold ||
      metrics.averageMemoryUsage > this.config.memoryThreshold
    ) {
      metrics.currentStatus = "unhealthy";
    } else if (metrics.averageResponseTime > this.config.responseTimeThreshold) {
      metrics.currentStatus = "degraded";
    } else {
      metrics.currentStatus = "healthy";
    }
  }

  /**
   * 비정상 배포 처리
   */
  private async handleUnhealthyDeployment(deploymentId: string, containerName: string): Promise<void> {
    const restartCount = (this.restartCounts.get(containerName) || 0) + 1;

    if (restartCount > this.config.restartAttempts) {
      console.error(
        `❌ Max restart attempts exceeded for ${containerName}. Manual intervention required.`
      );
      return;
    }

    console.warn(
      `⚠️  Attempting restart (${restartCount}/${this.config.restartAttempts}): ${containerName}`
    );

    try {
      // Mock restart - in production would use docker API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      this.restartCounts.set(containerName, restartCount);
      console.log(`✅ Container restarted: ${containerName}`);
    } catch (error) {
      console.error(`❌ Failed to restart container: ${error}`);
    }
  }

  /**
   * Mock CPU 사용률 생성
   */
  private generateMockCpuUsage(): number {
    // Random between 10-50%
    return 10 + Math.random() * 40;
  }

  /**
   * Mock 메모리 사용률 생성
   */
  private generateMockMemoryUsage(): number {
    // Random between 30-60%
    return 30 + Math.random() * 30;
  }

  /**
   * 메트릭 조회
   */
  getMetrics(deploymentId: string): DeploymentMetrics | undefined {
    return this.metricsStorage.get(deploymentId);
  }

  /**
   * 모든 메트릭 조회
   */
  getAllMetrics(): DeploymentMetrics[] {
    return Array.from(this.metricsStorage.values());
  }

  /**
   * 메트릭 내역 조회
   */
  getMetricsHistory(deploymentId: string, limit: number = 100): MetricData[] {
    const metrics = this.metricsStorage.get(deploymentId);
    if (!metrics) return [];

    return metrics.metrics.slice(-limit);
  }

  /**
   * 메트릭 리포트 생성
   */
  generateReport(deploymentId: string): string {
    const metrics = this.metricsStorage.get(deploymentId);
    if (!metrics) return "No metrics found";

    const uptime = Date.now() - metrics.containerStatus.createdAt;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);

    const report = `
═══════════════════════════════════════════════════════════════
📊 DEPLOYMENT MONITORING REPORT
═══════════════════════════════════════════════════════════════

Deployment ID: ${metrics.deploymentId}
Container: ${metrics.containerStatus.name}
Status: ${metrics.currentStatus.toUpperCase()}
Last Check: ${new Date(metrics.lastCheck).toISOString()}

───────────────────────────────────────────────────────────────
CONTAINER STATUS
───────────────────────────────────────────────────────────────
State: ${metrics.containerStatus.status.toUpperCase()}
Uptime: ${uptimeHours}h
Restart Count: ${metrics.containerStatus.restartCount}
Created At: ${new Date(metrics.containerStatus.createdAt).toISOString()}

───────────────────────────────────────────────────────────────
PERFORMANCE METRICS
───────────────────────────────────────────────────────────────
Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
Average CPU Usage: ${metrics.averageCpuUsage.toFixed(2)}%
Average Memory Usage: ${metrics.averageMemoryUsage.toFixed(2)}%
Total Errors (recent 100): ${metrics.totalErrors}

Thresholds:
  Response Time: ${this.config.responseTimeThreshold}ms
  CPU: ${this.config.cpuThreshold}%
  Memory: ${this.config.memoryThreshold}%

───────────────────────────────────────────────────────────────
DATA COLLECTION
───────────────────────────────────────────────────────────────
Total Metrics Collected: ${metrics.metrics.length}
Monitoring Interval: ${this.config.interval}ms
History Size Limit: ${this.config.maxMetricsHistorySize}

═══════════════════════════════════════════════════════════════
`;

    return report;
  }

  /**
   * 메트릭 내역 저장 (JSON)
   */
  saveMetricsToFile(deploymentId: string, outputPath: string): void {
    const metrics = this.metricsStorage.get(deploymentId);
    if (!metrics) {
      console.error(`No metrics found for deployment: ${deploymentId}`);
      return;
    }

    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2), { encoding: "utf-8" });
      console.log(`✅ Metrics saved to: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to save metrics: ${error}`);
    }
  }

  /**
   * 메트릭 내역 불러오기
   */
  loadMetricsFromFile(filePath: string): DeploymentMetrics | null {
    try {
      const content = fs.readFileSync(filePath, { encoding: "utf-8" });
      const metrics = JSON.parse(content) as DeploymentMetrics;
      this.metricsStorage.set(metrics.deploymentId, metrics);
      return metrics;
    } catch (error) {
      console.error(`❌ Failed to load metrics: ${error}`);
      return null;
    }
  }

  /**
   * 메트릭 정리
   */
  clearMetrics(deploymentId: string): void {
    this.metricsStorage.delete(deploymentId);
    this.restartCounts.delete(deploymentId);
    this.stopMonitoring(deploymentId);
    console.log(`✅ Metrics cleared for deployment: ${deploymentId}`);
  }
}

// Test
if (require.main === module) {
  (async () => {
    const monitor = new DeploymentMonitor();

    console.log("📊 DeploymentMonitor Test");

    // Start monitoring
    monitor.startMonitoring("deploy-123", "test-container", "http://localhost:3000/health");

    // Simulate some time passing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get metrics
    const metrics = monitor.getMetrics("deploy-123");
    if (metrics) {
      console.log("\n📈 Current Metrics:");
      console.log(JSON.stringify(metrics, null, 2));

      // Generate report
      console.log(monitor.generateReport("deploy-123"));
    }

    // Stop monitoring
    monitor.stopMonitoring("deploy-123");
  })();
}
