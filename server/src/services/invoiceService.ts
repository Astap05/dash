import crypto from 'crypto'
import { logger } from '../utils/logger'
import { walletService } from './walletService'
import { blockchainService } from './blockchainService'
import { query, runQuery } from '../db/index'

export interface InvoiceData {
  id: string
  userId?: string
  nickname: string
  amount: number
  currency: string
  network: string
  paymentAddress: string
  memo?: string
  status: 'pending' | 'paid' | 'confirmed' | 'expired' | 'cancelled'
  createdAt: string
  expiresAt: string
  qrCode?: string
}

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async createInvoice(data: {
    nickname: string
    amount: number
    currency: string
    network: string
    userId?: string
  }): Promise<InvoiceData> {
    try {
      const invoiceId = this.generateInvoiceId()
      const paymentAddress = await walletService.generatePaymentAddress(invoiceId, data.currency)

      // Generate memo for Solana payments
      const memo = data.network === 'solana' ? this.generateMemo(invoiceId) : null

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      // Insert into database
      runQuery(
        `INSERT INTO invoices (id, user_id, nickname, amount, currency, network, payment_address, memo, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [invoiceId, data.userId, data.nickname, data.amount, data.currency.toUpperCase(), data.network, paymentAddress, memo, expiresAt.toISOString(), new Date().toISOString(), new Date().toISOString()]
      )

      // Get the inserted invoice
      const result = await query(
        `SELECT id, user_id, nickname, amount, currency, network, payment_address, memo, status, qr_code, expires_at, created_at
         FROM invoices WHERE id = $1`,
        [invoiceId]
      )

      const invoice: InvoiceData = {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        nickname: result.rows[0].nickname,
        amount: parseFloat(result.rows[0].amount),
        currency: result.rows[0].currency,
        network: result.rows[0].network,
        paymentAddress: result.rows[0].payment_address,
        memo: result.rows[0].memo,
        status: result.rows[0].status,
        qrCode: result.rows[0].qr_code,
        expiresAt: result.rows[0].expires_at,
        createdAt: result.rows[0].created_at
      }

      // Add address to blockchain monitoring
      blockchainService.addAddressToMonitor(paymentAddress, data.network, invoiceId)

      logger.info(`Created invoice ${invoiceId} for ${data.amount} ${data.currency}`)

      return invoice
    } catch (error) {
      logger.error('Failed to create invoice:', error)
      throw new Error('Failed to create invoice')
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<InvoiceData | null> {
    try {
      const result = await query(
        `SELECT id, user_id, nickname, amount, currency, network, payment_address, memo, status, qr_code, expires_at, created_at
         FROM invoices WHERE id = $1`,
        [invoiceId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      return {
        id: row.id,
        userId: row.user_id,
        nickname: row.nickname,
        amount: parseFloat(row.amount),
        currency: row.currency,
        network: row.network,
        paymentAddress: row.payment_address,
        memo: row.memo,
        status: row.status,
        qrCode: row.qr_code,
        expiresAt: row.expires_at,
        createdAt: row.created_at
      }
    } catch (error) {
      logger.error('Failed to get invoice:', error)
      throw new Error('Failed to get invoice')
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceData['status']): Promise<boolean> {
    try {
      const result = runQuery(
        `UPDATE invoices SET status = $1, updated_at = $2 WHERE id = $3`,
        [status, new Date().toISOString(), invoiceId]
      )

      if (result.changes === 0) {
        return false
      }

      logger.info(`Updated invoice ${invoiceId} status to ${status}`)
      return true
    } catch (error) {
      logger.error('Failed to update invoice status:', error)
      throw new Error('Failed to update invoice status')
    }
  }

  /**
   * Get all invoices for a user
   */
  async getUserInvoices(userId: string): Promise<InvoiceData[]> {
    try {
      const result = await query(
        `SELECT id, user_id, nickname, amount, currency, network, payment_address, memo, status, qr_code, expires_at, created_at
         FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      )

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        nickname: row.nickname,
        amount: parseFloat(row.amount),
        currency: row.currency,
        network: row.network,
        paymentAddress: row.payment_address,
        memo: row.memo,
        status: row.status,
        qrCode: row.qr_code,
        expiresAt: row.expires_at,
        createdAt: row.created_at
      }))
    } catch (error) {
      logger.error('Failed to get user invoices:', error)
      throw new Error('Failed to get user invoices')
    }
  }

  /**
   * Check if invoice is expired
   */
  isExpired(invoice: InvoiceData): boolean {
    return new Date() > new Date(invoice.expiresAt)
  }

  /**
   * Clean up expired invoices
   */
  async cleanupExpiredInvoices(): Promise<void> {
    try {
      const now = new Date().toISOString()
      const result = runQuery(
        `UPDATE invoices SET status = 'expired' WHERE status = 'pending' AND expires_at < $1`,
        [now]
      )

      const expiredCount = result.changes
      if (expiredCount > 0) {
        logger.info(`Cleaned up ${expiredCount} expired invoices`)
      }
    } catch (error) {
      logger.error('Failed to cleanup expired invoices:', error)
    }
  }

  /**
   * Generate unique invoice ID
   */
  private generateInvoiceId(): string {
    const timestamp = Date.now().toString(36)
    const random = crypto.randomBytes(4).toString('hex')
    return `inv_${timestamp}_${random}`
  }

  /**
   * Generate memo for Solana payments
   */
  private generateMemo(invoiceId: string): string {
    // Generate a short numeric memo (5 digits) for easy input
    const timestamp = Date.now()
    const shortCode = (timestamp % 90000 + 10000).toString() // 5-digit number between 10000-99999
    return shortCode
  }

  /**
   * Get invoice statistics
   */
  async getStats() {
    try {
      const result = await query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
        FROM invoices
      `)

      const row = result.rows[0]
      return {
        total: parseInt(row.total),
        pending: parseInt(row.pending),
        paid: parseInt(row.paid),
        confirmed: parseInt(row.confirmed),
        expired: parseInt(row.expired)
      }
    } catch (error) {
      logger.error('Failed to get invoice statistics:', error)
      return { total: 0, pending: 0, paid: 0, confirmed: 0, expired: 0 }
    }
  }
}

// Singleton instance
export const invoiceService = new InvoiceService()

// Auto cleanup expired invoices every 5 minutes
setInterval(() => {
  invoiceService.cleanupExpiredInvoices()
}, 5 * 60 * 1000)