import { logger } from '../utils/logger'

export interface AuditEvent {
  id: string
  timestamp: string
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ip: string
  userAgent?: string
  details?: Record<string, any>
  success: boolean
  errorMessage?: string
}

export class AuditService {
  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ...event
    }

    // Log to Winston with audit level
    logger.info('AUDIT_EVENT', {
      audit: auditEvent
    })

    // In production, also store in database
    // await this.storeInDatabase(auditEvent)
  }

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    action: 'login' | 'register' | 'logout' | 'failed_login',
    userId: string | undefined,
    ip: string,
    userAgent: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: `auth.${action}`,
      resource: 'authentication',
      ip,
      userAgent,
      details: { action },
      success,
      errorMessage
    })
  }

  /**
   * Log invoice operations
   */
  async logInvoiceEvent(
    action: 'create' | 'view' | 'expire',
    userId: string | undefined,
    invoiceId: string,
    ip: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: `invoice.${action}`,
      resource: 'invoice',
      resourceId: invoiceId,
      ip,
      details,
      success: true
    })
  }

  /**
   * Log wallet operations
   */
  async logWalletEvent(
    action: 'address_generated' | 'address_validated',
    userId: string | undefined,
    invoiceId: string,
    ip: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: `wallet.${action}`,
      resource: 'wallet',
      resourceId: invoiceId,
      ip,
      details,
      success: true
    })
  }

  /**
   * Log rate limit violations
   */
  async logRateLimitEvent(
    endpoint: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      action: 'rate_limit.exceeded',
      resource: 'api',
      resourceId: endpoint,
      ip,
      userAgent,
      details: { endpoint },
      success: false,
      errorMessage: 'Rate limit exceeded'
    })
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    type: 'suspicious_activity' | 'invalid_input' | 'unauthorized_access',
    ip: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action: `security.${type}`,
      resource: 'system',
      ip,
      details,
      success: false,
      errorMessage: `Security event: ${type}`
    })
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `evt_${timestamp}_${random}`
  }

  /**
   * Get audit events (for admin panel)
   */
  async getAuditEvents(
    limit: number = 100,
    offset: number = 0,
    filters?: {
      userId?: string
      action?: string
      dateFrom?: string
      dateTo?: string
    }
  ): Promise<AuditEvent[]> {
    // In production, query from database
    // For now, return empty array
    logger.info(`Audit query requested: limit=${limit}, offset=${offset}, filters=${JSON.stringify(filters)}`)
    return []
  }
}

// Singleton instance
export const auditService = new AuditService()