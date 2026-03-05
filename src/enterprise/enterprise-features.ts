/**
 * FreeLang v6 Enterprise Features
 *
 * 엔터프라이즈급 기능:
 * 1. 역할 기반 접근 제어 (RBAC)
 * 2. 감시 & 감사 로그
 * 3. 데이터 거버넌스
 * 4. 규정 준수 (GDPR, HIPAA, SOC2)
 * 5. SSO/OAuth 통합
 */

// ============================================================================
// 1. RBAC (Role-Based Access Control)
// ============================================================================

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // 시스템 역할 여부
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface RBACPolicy {
  version: string;
  roles: Role[];
  permissions: Permission[];
}

export class RBACManager {
  private policy: RBACPolicy;
  private userRoles: Map<string, string[]> = new Map();

  constructor() {
    this.policy = this.initializeDefaultPolicy();
  }

  private initializeDefaultPolicy(): RBACPolicy {
    return {
      version: '1.0.0',
      roles: [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system access',
          permissions: ['*:*'],
          isSystem: true,
        },
        {
          id: 'editor',
          name: 'Editor',
          description: 'Can edit content',
          permissions: [
            'content:create',
            'content:read',
            'content:update',
            'content:delete',
          ],
          isSystem: true,
        },
        {
          id: 'viewer',
          name: 'Viewer',
          description: 'Read-only access',
          permissions: ['content:read', 'report:read'],
          isSystem: true,
        },
      ],
      permissions: [
        {
          id: 'content-create',
          resource: 'content',
          action: 'create',
          description: 'Create new content',
        },
        {
          id: 'content-read',
          resource: 'content',
          action: 'read',
          description: 'Read content',
        },
        {
          id: 'content-update',
          resource: 'content',
          action: 'update',
          description: 'Update content',
        },
        {
          id: 'content-delete',
          resource: 'content',
          action: 'delete',
          description: 'Delete content',
        },
        {
          id: 'report-read',
          resource: 'report',
          action: 'read',
          description: 'Read reports',
        },
      ],
    };
  }

  assignRole(userId: string, roleId: string): boolean {
    const role = this.policy.roles.find((r) => r.id === roleId);
    if (!role) return false;

    const roles = this.userRoles.get(userId) || [];
    if (!roles.includes(roleId)) {
      roles.push(roleId);
      this.userRoles.set(userId, roles);
    }
    return true;
  }

  removeRole(userId: string, roleId: string): boolean {
    const roles = this.userRoles.get(userId) || [];
    const index = roles.indexOf(roleId);
    if (index > -1) {
      roles.splice(index, 1);
      this.userRoles.set(userId, roles);
      return true;
    }
    return false;
  }

  hasPermission(userId: string, resource: string, action: string): boolean {
    const roles = this.userRoles.get(userId) || [];
    if (roles.length === 0) return false;

    for (const roleId of roles) {
      const role = this.policy.roles.find((r) => r.id === roleId);
      if (!role) continue;

      for (const perm of role.permissions) {
        if (perm === '*:*') return true;
        if (perm === `${resource}:*`) return true;
        if (perm === `${resource}:${action}`) return true;
      }
    }
    return false;
  }

  getUserRoles(userId: string): string[] {
    return this.userRoles.get(userId) || [];
  }

  createCustomRole(role: Role): boolean {
    if (this.policy.roles.find((r) => r.id === role.id)) {
      return false;
    }
    this.policy.roles.push(role);
    return true;
  }

  deleteCustomRole(roleId: string): boolean {
    const index = this.policy.roles.findIndex(
      (r) => r.id === roleId && !r.isSystem
    );
    if (index > -1) {
      this.policy.roles.splice(index, 1);
      // Remove role from all users
      for (const [, roles] of this.userRoles) {
        const idx = roles.indexOf(roleId);
        if (idx > -1) roles.splice(idx, 1);
      }
      return true;
    }
    return false;
  }

  getPolicy(): RBACPolicy {
    return JSON.parse(JSON.stringify(this.policy));
  }
}

// ============================================================================
// 2. 감시 & 감사 로그
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditPolicy {
  enabled: boolean;
  retentionDays: number;
  logLevel: 'basic' | 'detailed';
  auditedResources: string[];
}

export class AuditLogger {
  private logs: AuditLog[] = [];
  private policy: AuditPolicy;
  private logId = 0;

  constructor() {
    this.policy = {
      enabled: true,
      retentionDays: 90,
      logLevel: 'detailed',
      auditedResources: ['user', 'content', 'permission', 'config'],
    };
  }

  log(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    status: 'success' | 'failure' = 'success',
    errorMessage?: string,
    changes?: Record<string, unknown>
  ): AuditLog {
    if (!this.policy.enabled) {
      return {} as AuditLog;
    }

    if (!this.policy.auditedResources.includes(resource)) {
      return {} as AuditLog;
    }

    const log: AuditLog = {
      id: `audit-${++this.logId}`,
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      changes,
      status,
      errorMessage,
    };

    this.logs.push(log);
    return log;
  }

  getLogs(
    filter?: {
      userId?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): AuditLog[] {
    let result = [...this.logs];

    if (filter?.userId) {
      result = result.filter((log) => log.userId === filter.userId);
    }
    if (filter?.resource) {
      result = result.filter((log) => log.resource === filter.resource);
    }
    if (filter?.startDate) {
      result = result.filter((log) => log.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      result = result.filter((log) => log.timestamp <= filter.endDate!);
    }

    const limit = filter?.limit || 100;
    return result.slice(-limit);
  }

  getLogsByUser(userId: string): AuditLog[] {
    return this.getLogs({ userId });
  }

  getLogsByResource(resource: string): AuditLog[] {
    return this.getLogs({ resource });
  }

  purgeOldLogs(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.policy.retentionDays);

    const initialLength = this.logs.length;
    this.logs = this.logs.filter((log) => log.timestamp >= cutoffDate);
    return initialLength - this.logs.length;
  }

  setPolicy(policy: Partial<AuditPolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  getPolicy(): AuditPolicy {
    return { ...this.policy };
  }
}

// ============================================================================
// 3. 데이터 거버넌스
// ============================================================================

export interface DataClassification {
  id: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  description: string;
  retentionDays: number;
  encryptionRequired: boolean;
}

export interface DataGovernancePolicy {
  classifications: DataClassification[];
  defaultClassification: string;
  dataMinimization: boolean;
  purposeLimitation: boolean;
}

export class DataGovernanceManager {
  private policy: DataGovernancePolicy;
  private dataMetadata: Map<string, DataClassification> = new Map();

  constructor() {
    this.policy = this.initializePolicy();
  }

  private initializePolicy(): DataGovernancePolicy {
    return {
      classifications: [
        {
          id: 'public',
          level: 'public',
          description: 'Publicly available data',
          retentionDays: 365,
          encryptionRequired: false,
        },
        {
          id: 'internal',
          level: 'internal',
          description: 'Internal use only',
          retentionDays: 180,
          encryptionRequired: false,
        },
        {
          id: 'confidential',
          level: 'confidential',
          description: 'Confidential business data',
          retentionDays: 90,
          encryptionRequired: true,
        },
        {
          id: 'restricted',
          level: 'restricted',
          description: 'Highly sensitive personal data',
          retentionDays: 30,
          encryptionRequired: true,
        },
      ],
      defaultClassification: 'internal',
      dataMinimization: true,
      purposeLimitation: true,
    };
  }

  classifyData(dataId: string, classificationLevel: string): boolean {
    const classification = this.policy.classifications.find(
      (c) => c.level === classificationLevel
    );
    if (!classification) return false;

    this.dataMetadata.set(dataId, classification);
    return true;
  }

  getDataClassification(dataId: string): DataClassification | undefined {
    return this.dataMetadata.get(dataId);
  }

  requiresEncryption(dataId: string): boolean {
    const classification = this.dataMetadata.get(dataId);
    if (!classification) {
      const default_classification = this.policy.classifications.find(
        (c) => c.level === this.policy.defaultClassification
      );
      return default_classification?.encryptionRequired || false;
    }
    return classification.encryptionRequired;
  }

  getRetentionPolicy(dataId: string): number {
    const classification = this.dataMetadata.get(dataId);
    if (!classification) {
      const default_classification = this.policy.classifications.find(
        (c) => c.level === this.policy.defaultClassification
      );
      return default_classification?.retentionDays || 180;
    }
    return classification.retentionDays;
  }

  setPolicy(policy: Partial<DataGovernancePolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  getPolicy(): DataGovernancePolicy {
    return JSON.parse(JSON.stringify(this.policy));
  }
}

// ============================================================================
// 4. 규정 준수 (Compliance)
// ============================================================================

export interface ComplianceFramework {
  id: string;
  name: string;
  standard: 'GDPR' | 'HIPAA' | 'SOC2' | 'PCI-DSS';
  controls: ComplianceControl[];
  assessmentDate: Date;
  status: 'compliant' | 'non-compliant' | 'partial';
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  implementation: boolean;
  evidence: string[];
}

export class ComplianceManager {
  private frameworks: Map<string, ComplianceFramework> = new Map();

  initializeGDPR(): void {
    this.frameworks.set('gdpr', {
      id: 'gdpr',
      name: 'GDPR Compliance',
      standard: 'GDPR',
      assessmentDate: new Date(),
      status: 'partial',
      controls: [
        {
          id: 'lawful-basis',
          name: 'Lawful Basis for Processing',
          description:
            'Ensure lawful basis exists for all personal data processing',
          implementation: true,
          evidence: ['privacy-policy.md', 'consent-forms.pdf'],
        },
        {
          id: 'data-minimization',
          name: 'Data Minimization',
          description:
            'Only collect and process necessary personal data',
          implementation: true,
          evidence: ['data-inventory.xlsx'],
        },
        {
          id: 'right-to-access',
          name: 'Right to Access',
          description:
            'Individuals can request access to their personal data',
          implementation: true,
          evidence: ['access-request-process.md'],
        },
        {
          id: 'right-to-erasure',
          name: 'Right to Erasure (Right to be Forgotten)',
          description:
            'Individuals can request deletion of their data',
          implementation: true,
          evidence: ['deletion-policy.md'],
        },
        {
          id: 'data-portability',
          name: 'Data Portability',
          description: 'Users can obtain and reuse their data',
          implementation: false,
          evidence: [],
        },
      ],
    });
  }

  initializeHIPAA(): void {
    this.frameworks.set('hipaa', {
      id: 'hipaa',
      name: 'HIPAA Compliance',
      standard: 'HIPAA',
      assessmentDate: new Date(),
      status: 'partial',
      controls: [
        {
          id: 'administrative-safeguards',
          name: 'Administrative Safeguards',
          description: 'Manage personnel, information access, and security',
          implementation: true,
          evidence: ['hipaa-training-records.pdf'],
        },
        {
          id: 'physical-safeguards',
          name: 'Physical Safeguards',
          description: 'Protect facilities and equipment',
          implementation: true,
          evidence: ['facility-access-log.xlsx'],
        },
        {
          id: 'technical-safeguards',
          name: 'Technical Safeguards',
          description: 'Implement encryption and access controls',
          implementation: true,
          evidence: ['encryption-audit.md'],
        },
        {
          id: 'breach-notification',
          name: 'Breach Notification',
          description:
            'Notify individuals and regulators of breaches',
          implementation: true,
          evidence: ['breach-response-policy.md'],
        },
      ],
    });
  }

  initializeSOC2(): void {
    this.frameworks.set('soc2', {
      id: 'soc2',
      name: 'SOC2 Compliance',
      standard: 'SOC2',
      assessmentDate: new Date(),
      status: 'partial',
      controls: [
        {
          id: 'cc-security',
          name: 'Common Criteria - Security',
          description: 'Logical and physical access control',
          implementation: true,
          evidence: ['access-control-policy.md'],
        },
        {
          id: 'cc-availability',
          name: 'Common Criteria - Availability',
          description: 'System is available for operation',
          implementation: true,
          evidence: ['uptime-report.xlsx'],
        },
        {
          id: 'cc-processing-integrity',
          name: 'Common Criteria - Processing Integrity',
          description: 'Complete and accurate processing',
          implementation: true,
          evidence: ['audit-logs.csv'],
        },
        {
          id: 'cc-confidentiality',
          name: 'Common Criteria - Confidentiality',
          description: 'Protect confidential information',
          implementation: true,
          evidence: ['encryption-standard.md'],
        },
      ],
    });
  }

  getFramework(standard: string): ComplianceFramework | undefined {
    return this.frameworks.get(standard.toLowerCase());
  }

  updateControlStatus(
    standard: string,
    controlId: string,
    implemented: boolean
  ): boolean {
    const framework = this.frameworks.get(standard.toLowerCase());
    if (!framework) return false;

    const control = framework.controls.find((c) => c.id === controlId);
    if (!control) return false;

    control.implementation = implemented;
    this.updateFrameworkStatus(framework);
    return true;
  }

  private updateFrameworkStatus(framework: ComplianceFramework): void {
    const total = framework.controls.length;
    const implemented = framework.controls.filter(
      (c) => c.implementation
    ).length;

    if (implemented === total) {
      framework.status = 'compliant';
    } else if (implemented === 0) {
      framework.status = 'non-compliant';
    } else {
      framework.status = 'partial';
    }
    framework.assessmentDate = new Date();
  }

  getComplianceStatus(standard: string): string {
    const framework = this.getFramework(standard);
    return framework?.status || 'unknown';
  }

  getAllFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }
}

// ============================================================================
// 5. SSO/OAuth 통합
// ============================================================================

export interface OAuthProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth2';
  clientId: string;
  clientSecret?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  enabled: boolean;
}

export interface SSOSession {
  id: string;
  userId: string;
  providerId: string;
  externalId: string;
  createdAt: Date;
  expiresAt: Date;
  refreshToken?: string;
}

export class SSOManager {
  private providers: Map<string, OAuthProvider> = new Map();
  private sessions: Map<string, SSOSession> = new Map();
  private sessionId = 0;

  registerProvider(provider: OAuthProvider): boolean {
    if (this.providers.has(provider.id)) return false;
    this.providers.set(provider.id, provider);
    return true;
  }

  enableProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    provider.enabled = true;
    return true;
  }

  disableProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    provider.enabled = false;
    return true;
  }

  createSession(
    userId: string,
    providerId: string,
    externalId: string,
    refreshToken?: string
  ): SSOSession {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${providerId} not found or disabled`);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 유효

    const session: SSOSession = {
      id: `session-${++this.sessionId}`,
      userId,
      providerId,
      externalId,
      createdAt: new Date(),
      expiresAt,
      refreshToken,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): SSOSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    // Check if session expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  validateSession(sessionId: string): boolean {
    return this.getSession(sessionId) !== undefined;
  }

  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getProviders(): OAuthProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): OAuthProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.enabled);
  }

  getProvider(providerId: string): OAuthProvider | undefined {
    return this.providers.get(providerId);
  }
}

// ============================================================================
// 엔터프라이즈 통합 관리자
// ============================================================================

export interface EnterpriseConfig {
  rbacEnabled: boolean;
  auditEnabled: boolean;
  complianceFrameworks: string[]; // 'GDPR', 'HIPAA', 'SOC2'
  ssoEnabled: boolean;
}

export class EnterpriseManager {
  private rbac: RBACManager;
  private audit: AuditLogger;
  private governance: DataGovernanceManager;
  private compliance: ComplianceManager;
  private sso: SSOManager;
  private config: EnterpriseConfig;

  constructor(config?: Partial<EnterpriseConfig>) {
    this.rbac = new RBACManager();
    this.audit = new AuditLogger();
    this.governance = new DataGovernanceManager();
    this.compliance = new ComplianceManager();
    this.sso = new SSOManager();

    this.config = {
      rbacEnabled: true,
      auditEnabled: true,
      complianceFrameworks: [],
      ssoEnabled: false,
      ...config,
    };

    this.initializeCompliance();
  }

  private initializeCompliance(): void {
    if (this.config.complianceFrameworks.includes('GDPR')) {
      this.compliance.initializeGDPR();
    }
    if (this.config.complianceFrameworks.includes('HIPAA')) {
      this.compliance.initializeHIPAA();
    }
    if (this.config.complianceFrameworks.includes('SOC2')) {
      this.compliance.initializeSOC2();
    }
  }

  // RBAC 접근
  getRBAC(): RBACManager {
    return this.rbac;
  }

  // 감사 로그 접근
  getAudit(): AuditLogger {
    return this.audit;
  }

  // 데이터 거버넌스 접근
  getGovernance(): DataGovernanceManager {
    return this.governance;
  }

  // 규정 준수 접근
  getCompliance(): ComplianceManager {
    return this.compliance;
  }

  // SSO 접근
  getSSO(): SSOManager {
    return this.sso;
  }

  getConfig(): EnterpriseConfig {
    return { ...this.config };
  }
}

export default {
  RBACManager,
  AuditLogger,
  DataGovernanceManager,
  ComplianceManager,
  SSOManager,
  EnterpriseManager,
};
