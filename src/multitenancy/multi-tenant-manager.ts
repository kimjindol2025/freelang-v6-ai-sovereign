/**
 * Multi-Tenant Manager
 *
 * 멀티테넌트 시스템의 핵심 관리자:
 * 1. 테넌트 격리: 데이터, 리소스, 네트워크 격리
 * 2. 리소스 관리: 데이터베이스, 계산, 스토리지 공유 및 할당
 * 3. 청구 시스템: 사용량 추적, 자동 청구, 결제 처리
 * 4. 커스터마이제이션: 브랜딩, 워크플로우, API
 * 5. SLA & 모니터링: SLA 정의, 성능 모니터링, 자동 스케일링
 */

import {
  Tenant,
  TenantResources,
  IsolationPolicy,
  BillingInfo,
  UsageMetrics,
  SLA,
  MonitoringMetrics,
  AutoScalingPolicy,
  WorkflowCustomization,
  APICustomization,
  TenantContext,
  Invoice,
  InvoiceItem,
  PaymentMethod,
} from './types';

export class MultiTenantManager {
  private tenants: Map<string, Tenant>;
  private resources: Map<string, TenantResources>;
  private isolationPolicies: Map<string, IsolationPolicy>;
  private billingInfo: Map<string, BillingInfo>;
  private usageMetrics: Map<string, UsageMetrics>;
  private slaDefinitions: Map<string, SLA>;
  private monitoringMetrics: Map<string, MonitoringMetrics[]>;
  private autoScalingPolicies: Map<string, AutoScalingPolicy>;
  private workflows: Map<string, WorkflowCustomization[]>;
  private apiCustomizations: Map<string, APICustomization[]>;
  private tenantContexts: Map<string, TenantContext>;

  constructor() {
    this.tenants = new Map();
    this.resources = new Map();
    this.isolationPolicies = new Map();
    this.billingInfo = new Map();
    this.usageMetrics = new Map();
    this.slaDefinitions = new Map();
    this.monitoringMetrics = new Map();
    this.autoScalingPolicies = new Map();
    this.workflows = new Map();
    this.apiCustomizations = new Map();
    this.tenantContexts = new Map();
  }

  /**
   * ==================== 1. 테넌트 생명주기 관리 ====================
   */

  /**
   * 새 테넌트 생성
   */
  async createTenant(name: string, tier: 'free' | 'pro' | 'enterprise'): Promise<Tenant> {
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tenant: Tenant = {
      id: tenantId,
      name,
      tier,
      createdAt: new Date(),
      metadata: {},
      status: 'active',
    };

    this.tenants.set(tenantId, tenant);

    // 테넌트 리소스 초기화
    await this.initializeResources(tenantId, tier);

    // 테넌트 격리 정책 설정
    await this.initializeIsolationPolicy(tenantId);

    // 청구 정보 초기화
    await this.initializeBilling(tenantId, tier);

    // SLA 정의 초기화
    await this.initializeSLA(tenantId, tier);

    // 자동 스케일링 정책 초기화
    await this.initializeAutoScaling(tenantId, tier);

    return tenant;
  }

  /**
   * 테넌트 정보 조회
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * 테넌트 업데이트
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const updated = { ...tenant, ...updates };
    this.tenants.set(tenantId, updated);
    return updated;
  }

  /**
   * 테넌트 삭제
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // 상태를 deleted로 변경 (실제 삭제 아님)
    tenant.status = 'deleted';
    this.tenants.set(tenantId, tenant);

    // 관련 리소스 정리
    this.resources.delete(tenantId);
    this.billingInfo.delete(tenantId);
    this.usageMetrics.delete(tenantId);
  }

  /**
   * 테넌트 일시 중단
   */
  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    tenant.status = 'suspended';
    tenant.metadata.suspensionReason = reason;
    tenant.metadata.suspendedAt = new Date();
    this.tenants.set(tenantId, tenant);
  }

  /**
   * 테넌트 복구
   */
  async resumeTenant(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    tenant.status = 'active';
    this.tenants.set(tenantId, tenant);
  }

  /**
   * ==================== 2. 리소스 격리 ====================
   */

  /**
   * 테넌트 리소스 초기화
   */
  private async initializeResources(tenantId: string, tier: 'free' | 'pro' | 'enterprise'): Promise<void> {
    const resourceLimits = this.getResourceLimits(tier);

    const resources: TenantResources = {
      tenantId,
      database: {
        name: `db_${tenantId}`,
        maxConnections: resourceLimits.dbConnections,
        storage: resourceLimits.dbStorage,
      },
      compute: {
        maxInstances: resourceLimits.instances,
        maxCpuCores: resourceLimits.cpuCores,
        maxMemoryMB: resourceLimits.memoryMB,
        maxExecutionTime: resourceLimits.executionTime,
      },
      storage: {
        maxBuckets: resourceLimits.buckets,
        maxSizeGB: resourceLimits.storageGB,
        publicAccess: resourceLimits.publicAccess,
      },
    };

    this.resources.set(tenantId, resources);
  }

  /**
   * 테넌트 리소스 조회
   */
  async getResources(tenantId: string): Promise<TenantResources | null> {
    return this.resources.get(tenantId) || null;
  }

  /**
   * 리소스 한계 조회 (티어별)
   */
  private getResourceLimits(tier: 'free' | 'pro' | 'enterprise') {
    const limits = {
      free: {
        dbConnections: 5,
        dbStorage: 100,          // MB
        instances: 1,
        cpuCores: 1,
        memoryMB: 512,
        executionTime: 60,        // 초
        buckets: 1,
        storageGB: 1,
        publicAccess: false,
      },
      pro: {
        dbConnections: 20,
        dbStorage: 5000,          // MB
        instances: 5,
        cpuCores: 4,
        memoryMB: 4096,
        executionTime: 300,       // 초
        buckets: 10,
        storageGB: 50,
        publicAccess: true,
      },
      enterprise: {
        dbConnections: 100,
        dbStorage: 100000,        // MB
        instances: 50,
        cpuCores: 32,
        memoryMB: 65536,
        executionTime: 3600,      // 초
        buckets: 100,
        storageGB: 1000,
        publicAccess: true,
      },
    };

    return limits[tier];
  }

  /**
   * 리소스 할당 (사용자 요청)
   */
  async allocateResources(
    tenantId: string,
    resourceType: 'database' | 'compute' | 'storage',
    amount: number,
  ): Promise<void> {
    const resources = this.resources.get(tenantId);
    if (!resources) {
      throw new Error(`Resources for tenant ${tenantId} not found`);
    }

    switch (resourceType) {
      case 'database':
        resources.database.storage += amount;
        break;
      case 'compute':
        resources.compute.maxMemoryMB += amount;
        break;
      case 'storage':
        resources.storage.maxSizeGB += amount;
        break;
    }

    this.resources.set(tenantId, resources);
  }

  /**
   * 리소스 할당 해제
   */
  async deallocateResources(
    tenantId: string,
    resourceType: 'database' | 'compute' | 'storage',
    amount: number,
  ): Promise<void> {
    const resources = this.resources.get(tenantId);
    if (!resources) {
      throw new Error(`Resources for tenant ${tenantId} not found`);
    }

    switch (resourceType) {
      case 'database':
        resources.database.storage = Math.max(0, resources.database.storage - amount);
        break;
      case 'compute':
        resources.compute.maxMemoryMB = Math.max(0, resources.compute.maxMemoryMB - amount);
        break;
      case 'storage':
        resources.storage.maxSizeGB = Math.max(0, resources.storage.maxSizeGB - amount);
        break;
    }

    this.resources.set(tenantId, resources);
  }

  /**
   * ==================== 3. 데이터 격리 ====================
   */

  /**
   * 테넌트 격리 정책 초기화
   */
  private async initializeIsolationPolicy(tenantId: string): Promise<void> {
    const policy: IsolationPolicy = {
      tenantId,
      dataIsolation: {
        rowLevel: true,
        columnLevel: false,
        encryptionAtRest: true,
        encryptionInTransit: true,
      },
      networkIsolation: {
        vpnRequired: false,
        ipWhitelist: [],
        allowedRegions: ['global'],
      },
      computeIsolation: {
        containerLevel: true,
        dedicatedResources: false,
      },
    };

    this.isolationPolicies.set(tenantId, policy);
  }

  /**
   * 격리 정책 조회
   */
  async getIsolationPolicy(tenantId: string): Promise<IsolationPolicy | null> {
    return this.isolationPolicies.get(tenantId) || null;
  }

  /**
   * 격리 정책 업데이트
   */
  async updateIsolationPolicy(tenantId: string, updates: Partial<IsolationPolicy>): Promise<IsolationPolicy> {
    const policy = this.isolationPolicies.get(tenantId);
    if (!policy) {
      throw new Error(`Isolation policy for tenant ${tenantId} not found`);
    }

    const updated = { ...policy, ...updates };
    this.isolationPolicies.set(tenantId, updated);
    return updated;
  }

  /**
   * 데이터 필터링 (Row-Level Security)
   */
  async filterDataByTenant(data: any[], tenantId: string): Promise<any[]> {
    const policy = this.isolationPolicies.get(tenantId);
    if (!policy || !policy.dataIsolation.rowLevel) {
      return data;
    }

    // Row-Level Security 적용
    return data.filter(row => row.tenantId === tenantId);
  }

  /**
   * ==================== 4. 청구 시스템 ====================
   */

  /**
   * 청구 정보 초기화
   */
  private async initializeBilling(tenantId: string, tier: 'free' | 'pro' | 'enterprise'): Promise<void> {
    const billing: BillingInfo = {
      tenantId,
      billingCycle: 'monthly',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      paymentMethod: {
        type: 'invoice',
        id: `pm_${tenantId}`,
        isDefault: true,
      },
      invoices: [],
      usage: {
        tenantId,
        period: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        compute: { cpuHours: 0, memoryGBHours: 0, executionCount: 0 },
        storage: { dataGB: 0, backupGB: 0, transferGB: 0 },
        api: { requestCount: 0, errorCount: 0 },
        cost: 0,
      },
    };

    this.billingInfo.set(tenantId, billing);
    this.usageMetrics.set(tenantId, billing.usage);
  }

  /**
   * 청구 정보 조회
   */
  async getBillingInfo(tenantId: string): Promise<BillingInfo | null> {
    return this.billingInfo.get(tenantId) || null;
  }

  /**
   * 사용량 기록
   */
  async recordUsage(tenantId: string, metrics: Partial<UsageMetrics>): Promise<void> {
    const usage = this.usageMetrics.get(tenantId);
    if (!usage) {
      throw new Error(`Usage metrics for tenant ${tenantId} not found`);
    }

    // 사용량 업데이트
    if (metrics.compute) {
      usage.compute = { ...usage.compute, ...metrics.compute };
    }
    if (metrics.storage) {
      usage.storage = { ...usage.storage, ...metrics.storage };
    }
    if (metrics.api) {
      usage.api = { ...usage.api, ...metrics.api };
    }

    // 비용 계산
    usage.cost = this.calculateCost(tenantId, usage);
    this.usageMetrics.set(tenantId, usage);
  }

  /**
   * 비용 계산
   */
  private calculateCost(tenantId: string, usage: UsageMetrics): number {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return 0;

    const pricing = {
      free: { cpuHourRate: 0, storageGBRate: 0, apiRequestRate: 0 },
      pro: { cpuHourRate: 0.05, storageGBRate: 0.1, apiRequestRate: 0.0001 },
      enterprise: { cpuHourRate: 0.03, storageGBRate: 0.08, apiRequestRate: 0.00005 },
    };

    const rates = pricing[tenant.tier];
    const cpuCost = usage.compute.cpuHours * rates.cpuHourRate;
    const storageCost = usage.storage.dataGB * rates.storageGBRate;
    const apiCost = usage.api.requestCount * rates.apiRequestRate;

    return cpuCost + storageCost + apiCost;
  }

  /**
   * 청구서 생성
   */
  async generateInvoice(tenantId: string): Promise<Invoice> {
    const billing = this.billingInfo.get(tenantId);
    if (!billing) {
      throw new Error(`Billing info for tenant ${tenantId} not found`);
    }

    const usage = billing.usage;
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const invoiceId = `inv_${tenantId}_${Date.now()}`;
    const items: InvoiceItem[] = [
      {
        description: `Compute (${usage.compute.cpuHours} CPU hours)`,
        quantity: usage.compute.cpuHours,
        unitPrice: 0.05,
        totalPrice: usage.compute.cpuHours * 0.05,
      },
      {
        description: `Storage (${usage.storage.dataGB} GB)`,
        quantity: usage.storage.dataGB,
        unitPrice: 0.1,
        totalPrice: usage.storage.dataGB * 0.1,
      },
      {
        description: `API Requests (${usage.api.requestCount})`,
        quantity: usage.api.requestCount,
        unitPrice: 0.0001,
        totalPrice: usage.api.requestCount * 0.0001,
      },
    ];

    const invoice: Invoice = {
      id: invoiceId,
      tenantId,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: items.reduce((sum, item) => sum + item.totalPrice, 0),
      currency: 'USD',
      items,
      status: 'sent',
    };

    billing.invoices.push(invoice);
    this.billingInfo.set(tenantId, billing);

    return invoice;
  }

  /**
   * 결제 처리
   */
  async processPayment(tenantId: string, invoiceId: string): Promise<boolean> {
    const billing = this.billingInfo.get(tenantId);
    if (!billing) {
      throw new Error(`Billing info for tenant ${tenantId} not found`);
    }

    const invoice = billing.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // 결제 처리 시뮬레이션
    invoice.status = 'paid';
    this.billingInfo.set(tenantId, billing);

    return true;
  }

  /**
   * ==================== 5. SLA & 모니터링 ====================
   */

  /**
   * SLA 정의 초기화
   */
  private async initializeSLA(tenantId: string, tier: 'free' | 'pro' | 'enterprise'): Promise<void> {
    const slaTargets = {
      free: { uptime: 95, apiLatency: 1000, dbLatency: 500, maxDowntime: 7 },
      pro: { uptime: 99, apiLatency: 200, dbLatency: 100, maxDowntime: 1 },
      enterprise: { uptime: 99.99, apiLatency: 50, dbLatency: 50, maxDowntime: 0.1 },
    };

    const targets = slaTargets[tier];

    const sla: SLA = {
      tenantId,
      uptime: {
        target: targets.uptime,
        current: 100,
        penaltyPercentage: (100 - targets.uptime) / 10,
      },
      performance: {
        apiLatencyTarget: targets.apiLatency,
        dbQueryLatencyTarget: targets.dbLatency,
      },
      support: {
        responseTimeTarget: tier === 'enterprise' ? 1 : tier === 'pro' ? 4 : 24,
        ticketPriority: tier === 'enterprise' ? 'critical' : tier === 'pro' ? 'high' : 'medium',
      },
      incident: {
        maxDowntimePerMonth: targets.maxDowntime,
        RTO: tier === 'enterprise' ? 5 : tier === 'pro' ? 15 : 60,
        RPO: tier === 'enterprise' ? 5 : tier === 'pro' ? 15 : 60,
      },
    };

    this.slaDefinitions.set(tenantId, sla);
  }

  /**
   * SLA 조회
   */
  async getSLA(tenantId: string): Promise<SLA | null> {
    return this.slaDefinitions.get(tenantId) || null;
  }

  /**
   * 모니터링 메트릭 기록
   */
  async recordMetrics(tenantId: string, metrics: MonitoringMetrics): Promise<void> {
    if (!this.monitoringMetrics.has(tenantId)) {
      this.monitoringMetrics.set(tenantId, []);
    }

    const metricsList = this.monitoringMetrics.get(tenantId)!;
    metricsList.push(metrics);

    // 최근 1000개만 유지
    if (metricsList.length > 1000) {
      metricsList.shift();
    }

    // SLA 업데이트
    const sla = this.slaDefinitions.get(tenantId);
    if (sla) {
      sla.uptime.current = metrics.uptime;
    }
  }

  /**
   * 모니터링 메트릭 조회
   */
  async getMetrics(tenantId: string, limit: number = 100): Promise<MonitoringMetrics[]> {
    const metrics = this.monitoringMetrics.get(tenantId) || [];
    return metrics.slice(-limit);
  }

  /**
   * 자동 스케일링 정책 초기화
   */
  private async initializeAutoScaling(tenantId: string, tier: 'free' | 'pro' | 'enterprise'): Promise<void> {
    const policy: AutoScalingPolicy = {
      tenantId,
      enabled: tier === 'enterprise',
      scaleUp: {
        cpuThreshold: 80,
        memoryThreshold: 85,
        scalingFactor: 1.5,
        cooldownPeriod: 300,
      },
      scaleDown: {
        cpuThreshold: 20,
        memoryThreshold: 30,
        scalingFactor: 0.75,
        cooldownPeriod: 600,
      },
      minInstances: tier === 'free' ? 1 : tier === 'pro' ? 2 : 3,
      maxInstances: tier === 'free' ? 1 : tier === 'pro' ? 10 : 50,
    };

    this.autoScalingPolicies.set(tenantId, policy);
  }

  /**
   * 자동 스케일링 정책 조회
   */
  async getAutoScalingPolicy(tenantId: string): Promise<AutoScalingPolicy | null> {
    return this.autoScalingPolicies.get(tenantId) || null;
  }

  /**
   * 자동 스케일링 실행
   */
  async executeAutoScaling(tenantId: string, currentMetrics: MonitoringMetrics): Promise<number> {
    const policy = this.autoScalingPolicies.get(tenantId);
    if (!policy || !policy.enabled) {
      return 0;
    }

    const resources = this.resources.get(tenantId);
    if (!resources) {
      return 0;
    }

    let scalingAction = 0; // 0: no change, 1: scale up, -1: scale down

    if (
      currentMetrics.cpuUsage > policy.scaleUp.cpuThreshold ||
      currentMetrics.memoryUsage > policy.scaleUp.memoryThreshold
    ) {
      scalingAction = 1;
    } else if (
      currentMetrics.cpuUsage < policy.scaleDown.cpuThreshold &&
      currentMetrics.memoryUsage < policy.scaleDown.memoryThreshold
    ) {
      scalingAction = -1;
    }

    return scalingAction;
  }

  /**
   * ==================== 6. 테넌트 컨텍스트 ====================
   */

  /**
   * 테넌트 컨텍스트 생성
   */
  async createContext(
    tenantId: string,
    userId?: string,
    sessionId?: string,
    permissions?: string[],
  ): Promise<TenantContext> {
    const context: TenantContext = {
      tenantId,
      userId,
      sessionId,
      permissions: permissions || [],
      metadata: {},
    };

    const contextId = `ctx_${tenantId}_${userId}_${sessionId}`;
    this.tenantContexts.set(contextId, context);

    return context;
  }

  /**
   * 테넌트 컨텍스트 확인
   */
  async verifyContext(contextId: string): Promise<TenantContext | null> {
    return this.tenantContexts.get(contextId) || null;
  }

  /**
   * 권한 확인
   */
  async checkPermission(contextId: string, requiredPermission: string): Promise<boolean> {
    const context = this.tenantContexts.get(contextId);
    if (!context) {
      return false;
    }

    return context.permissions.includes(requiredPermission);
  }

  /**
   * ==================== 7. 통계 및 리포팅 ====================
   */

  /**
   * 테넌트 통계
   */
  async getTenantStats(tenantId: string): Promise<Record<string, any>> {
    const tenant = this.tenants.get(tenantId);
    const resources = this.resources.get(tenantId);
    const usage = this.usageMetrics.get(tenantId);
    const billing = this.billingInfo.get(tenantId);
    const metrics = this.monitoringMetrics.get(tenantId) || [];

    if (!tenant || !resources || !usage || !billing) {
      throw new Error(`Incomplete data for tenant ${tenantId}`);
    }

    const avgMetrics = metrics.length > 0
      ? {
          avgUptime: metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length,
          avgLatency: metrics.reduce((sum, m) => sum + m.apiLatency, 0) / metrics.length,
          avgCpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
          avgMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
        }
      : { avgUptime: 100, avgLatency: 0, avgCpuUsage: 0, avgMemoryUsage: 0 };

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.tier,
        status: tenant.status,
      },
      resources: {
        database: resources.database.storage,
        compute: resources.compute.maxMemoryMB,
        storage: resources.storage.maxSizeGB,
      },
      usage: {
        cpuHours: usage.compute.cpuHours,
        storageGB: usage.storage.dataGB,
        apiRequests: usage.api.requestCount,
        cost: usage.cost,
      },
      billing: {
        cycle: billing.billingCycle,
        nextBillingDate: billing.nextBillingDate,
        invoiceCount: billing.invoices.length,
      },
      monitoring: avgMetrics,
    };
  }

  /**
   * 전체 테넌트 목록
   */
  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values()).filter(t => t.status !== 'deleted');
  }

  /**
   * 이용률 리포트
   */
  async getUtilizationReport(tenantId: string): Promise<Record<string, number>> {
    const resources = this.resources.get(tenantId);
    const usage = this.usageMetrics.get(tenantId);

    if (!resources || !usage) {
      throw new Error(`Data for tenant ${tenantId} not found`);
    }

    return {
      dbUtilization: (usage.storage.dataGB / resources.storage.maxSizeGB) * 100,
      storageUtilization: (usage.storage.dataGB / resources.storage.maxSizeGB) * 100,
      apiUtilization: (usage.api.requestCount / 1000000) * 100, // 임계값: 1M/month
    };
  }
}

export default MultiTenantManager;
