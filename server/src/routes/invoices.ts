import express from 'express'
import { invoiceService } from '../services/invoiceService'
import { logger } from '../utils/logger'
import QRCode from 'qrcode'
import { validateBody, invoiceCreationSchema, sanitizeInput } from '../middleware/validation'
import { getBlockchainConfig } from '../types/blockchain'
import { query } from '../db/index'

const router = express.Router()

/**
 * Create a new invoice
 */
router.post('/', sanitizeInput, validateBody(invoiceCreationSchema), async (req, res) => {
  try {
    const { nickname, amount, currency, network } = req.body

    // Basic validation
    if (!nickname || typeof nickname !== 'string' || nickname.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid nickname (min 3 characters)'
      })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      })
    }

    if (!currency || typeof currency !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency'
      })
    }

    const invoice = await invoiceService.createInvoice({
      nickname,
      amount,
      currency,
      network,
      userId: req.user?.id // Will be set by auth middleware later
    })

    // Generate QR code
    const blockchainConfig = getBlockchainConfig(invoice.network)
    let qrData = ''

    if (invoice.network === 'solana') {
      qrData = `solana:${invoice.paymentAddress}?amount=${invoice.amount}`
      if (invoice.memo) {
        qrData += `&memo=${encodeURIComponent(invoice.memo)}`
      }
    } else {
      qrData = `${blockchainConfig?.id || 'ethereum'}:${invoice.paymentAddress}?amount=${invoice.amount}`
    }

    const qrCodeDataURL = await QRCode.toDataURL(qrData)

    const invoiceWithQR = { ...invoice, qrCode: qrCodeDataURL }

    res.status(201).json({
      success: true,
      data: invoiceWithQR
    })

  } catch (error) {
    logger.error('Failed to create invoice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    })
  }
})

/**
 * Get invoice by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const invoice = await invoiceService.getInvoice(id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      })
    }

    // Check if expired
    if (invoiceService.isExpired(invoice)) {
      await invoiceService.updateInvoiceStatus(id, 'expired')
      invoice.status = 'expired'
    }

    // Generate QR code if not exists
    if (!invoice.qrCode) {
      const blockchainConfig = getBlockchainConfig(invoice.network)
      let qrData = ''

      if (invoice.network === 'solana') {
        qrData = `solana:${invoice.paymentAddress}?amount=${invoice.amount}`
        if (invoice.memo) {
          qrData += `&memo=${encodeURIComponent(invoice.memo)}`
        }
      } else {
        qrData = `${blockchainConfig?.id || 'ethereum'}:${invoice.paymentAddress}?amount=${invoice.amount}`
      }

      invoice.qrCode = await QRCode.toDataURL(qrData)
    }

    res.json({
      success: true,
      data: invoice
    })

  } catch (error) {
    logger.error('Failed to get invoice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get invoice'
    })
  }
})

/**
 * Get user invoices
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id // Will be set by auth middleware later
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const invoices = await invoiceService.getUserInvoices(userId)

    res.json({
      success: true,
      data: invoices
    })

  } catch (error) {
    logger.error('Failed to get user invoices:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get invoices'
    })
  }
})

/**
 * Get invoice statistics
 */
router.get('/stats/admin', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const stats = await invoiceService.getStats()

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logger.error('Failed to get invoice stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    })
  }
})

/**
 * Get all transactions for admin
 */
router.get('/transactions/admin', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const result = await query(
      `SELECT t.*, i.nickname, i.currency, i.network, i.amount as invoice_amount
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.id
       ORDER BY t.created_at DESC
       LIMIT 1000`,
      []
    )

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    logger.error('Failed to get transactions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions'
    })
  }
})

/**
 * Simulate payment (DEV ONLY)
 */
router.post('/:id/simulate-payment', async (req, res) => {
  // Allow in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_PAYMENTS !== 'true') {
    return res.status(403).json({ success: false, error: 'Not available in production' })
  }

  try {
    const { id } = req.params
    const success = await invoiceService.updateInvoiceStatus(id, 'paid')

    if (success) {
      logger.info(`Simulated payment for invoice ${id}`)
      res.json({ success: true, message: 'Payment simulated' })
    } else {
      res.status(404).json({ success: false, error: 'Invoice not found' })
    }
  } catch (error) {
    logger.error('Failed to simulate payment:', error)
    res.status(500).json({ success: false, error: 'Failed to simulate payment' })
  }
})

/**
 * Simulate test payment for any currency (ADMIN ONLY)
 */
router.post('/test-payment', async (req, res) => {
  // Allow only in testnet or if explicitly enabled
  if (!process.env.USE_TESTNET && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not available in production mainnet' })
  }

  try {
    const { currency, network, amount = 0.01, nickname = 'Test User' } = req.body

    // Create test invoice
    const invoice = await invoiceService.createInvoice({
      nickname,
      amount: 1, // 1 USD for test
      currency,
      network
    })

    // Simulate payment
    const success = await invoiceService.updateInvoiceStatus(invoice.id, 'paid')

    if (success) {
      // Get the transaction that was created
      const txResult = await query(
        'SELECT * FROM transactions WHERE invoice_id = $1',
        [invoice.id]
      )

      logger.info(`Test payment simulated for ${currency} on ${network}`)
      res.json({
        success: true,
        message: `Test payment of ${amount} ${currency} on ${network} simulated`,
        invoice: invoice,
        transaction: txResult.rows[0]
      })
    } else {
      res.status(500).json({ success: false, error: 'Failed to simulate payment' })
    }
  } catch (error) {
    logger.error('Failed to simulate test payment:', error)
    res.status(500).json({ success: false, error: 'Failed to simulate test payment' })
  }
})

export default router