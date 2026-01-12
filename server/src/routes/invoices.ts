import express from 'express'
import { invoiceService } from '../services/invoiceService'
import { logger } from '../utils/logger'
import QRCode from 'qrcode'
import { validateBody, invoiceCreationSchema, sanitizeInput } from '../middleware/validation'
import { getBlockchainConfig } from '../types/blockchain'

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
    let qrData = `${blockchainConfig?.id || 'ethereum'}:${invoice.paymentAddress}?amount=${invoice.amount}`

    // Add memo for Solana
    if (invoice.network === 'solana' && invoice.memo) {
      qrData += `&memo=${encodeURIComponent(invoice.memo)}`
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
      let qrData = `${blockchainConfig?.id || 'ethereum'}:${invoice.paymentAddress}?amount=${invoice.amount}`

      // Add memo for Solana
      if (invoice.network === 'solana' && invoice.memo) {
        qrData += `&memo=${encodeURIComponent(invoice.memo)}`
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
    const stats = invoiceService.getStats()

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

export default router