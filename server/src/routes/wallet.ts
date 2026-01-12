import express from 'express'
import { walletService } from '../services/walletService'
import { logger } from '../utils/logger'

const router = express.Router()

/**
 * Get payment address for a specific currency
 * In production, this should be tied to an invoice
 */
router.get('/address/:currency', async (req, res) => {
  try {
    const { currency } = req.params
    const invoiceId = req.query.invoiceId as string

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'invoiceId parameter is required'
      })
    }

    // Generate unique address for this invoice
    const address = await walletService.generatePaymentAddress(invoiceId, currency.toUpperCase())

    res.json({
      success: true,
      data: {
        address,
        currency: currency.toUpperCase(),
        invoiceId
      }
    })

  } catch (error) {
    logger.error('Failed to generate payment address:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate payment address'
    })
  }
})

/**
 * Validate if an address belongs to our system
 */
router.post('/validate-address', async (req, res) => {
  try {
    const { address, invoiceId } = req.body

    if (!address || !invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'address and invoiceId are required'
      })
    }

    const isValid = await walletService.validateAddressOwnership(address, invoiceId)

    res.json({
      success: true,
      data: {
        isValid,
        address,
        invoiceId
      }
    })

  } catch (error) {
    logger.error('Failed to validate address:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate address'
    })
  }
})

export default router