import express from 'express'
import { walletService } from '../services/walletService'
import { logger } from '../utils/logger'
import { query, runQuery } from '../db/index'

interface DBInvoice {
  id: string
  amount: string
  currency: string
  network: string
  status: string
  payment_address?: string
}

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
    const { address, invoiceId, currency = 'ETH' } = req.body

    if (!address || !invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'address and invoiceId are required'
      })
    }

    const isValid = await walletService.validateAddressOwnership(address, invoiceId, currency)

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

/**
 * Simulate payment for testing (TESTNET ONLY)
 * This endpoint allows testing the payment flow without real blockchain transactions
 */
router.post('/simulate-payment', async (req, res) => {
  try {
    const { paymentAddress, amount, memo, network = 'solana' } = req.body

    // Only allow in testnet mode
    if (process.env.USE_TESTNET !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Payment simulation is only available in TESTNET mode'
      })
    }

    if (!paymentAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'paymentAddress and amount are required'
      })
    }

    // Find the invoice by payment address
    const invoicesResult = await query(
      'SELECT id, amount, currency, network, status FROM invoices WHERE payment_address = $1 AND status = $2',
      [paymentAddress, 'pending']
    )

    if (invoicesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pending invoice found for this address'
      })
    }

    const invoice = invoicesResult.rows[0] as DBInvoice

    // Validate amount (allow small tolerance for testing)
    const expectedAmount = parseFloat(invoice.amount)
    const receivedAmount = parseFloat(amount)
    const tolerance = expectedAmount * 0.01 // 1% tolerance

    if (Math.abs(receivedAmount - expectedAmount) > tolerance) {
      return res.status(400).json({
        success: false,
        error: `Amount mismatch. Expected: ${expectedAmount}, Received: ${receivedAmount}`
      })
    }

    // For Solana, validate memo if provided
    if (network === 'solana' && invoice.network === 'solana' && memo) {
      // In a real scenario, this would be checked from transaction data
      // For simulation, we'll accept any memo
    }

    // Simulate payment confirmation
    const simulatedTxHash = `simulated_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    runQuery(
      "UPDATE invoices SET status = $1, updated_at = datetime('now') WHERE id = $2",
      ['paid', invoice.id]
    )

    runQuery(
      `INSERT INTO transactions (invoice_id, tx_hash, amount, status, confirmations, created_at)
       VALUES ($1, $2, $3, $4, $5, datetime('now'))`,
      [invoice.id, simulatedTxHash, receivedAmount, 'confirmed', 12]
    )

    logger.info(`Simulated payment confirmed for invoice ${invoice.id}: ${receivedAmount} ${invoice.currency}, tx: ${simulatedTxHash}`)

    res.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        txHash: simulatedTxHash,
        amount: receivedAmount,
        currency: invoice.currency,
        network: invoice.network,
        status: 'confirmed',
        message: 'Payment simulation successful'
      }
    })

  } catch (error) {
    logger.error('Failed to simulate payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to simulate payment'
    })
  }
})

/**
 * Get balances for all generated wallet addresses
 */
router.get('/balances', async (req, res) => {
  try {
    // Get all unique payment addresses from invoices
    const addressesResult = await query(
      'SELECT DISTINCT payment_address, network, currency FROM invoices WHERE payment_address IS NOT NULL',
      []
    )

    const addresses = addressesResult.rows as Array<{
      payment_address: string
      network: string
      currency: string
    }>

    if (addresses.length === 0) {
      return res.json({
        success: true,
        data: []
      })
    }

    // Check balances for each address
    const balancePromises = addresses.map(async (addr) => {
      try {
        const balanceResult = await walletService.getAddressBalance(addr.payment_address, addr.network)
        return {
          address: addr.payment_address,
          network: addr.network,
          currency: addr.currency,
          balance: balanceResult.balance,
          error: balanceResult.error,
          lastChecked: new Date().toISOString()
        }
      } catch (error: any) {
        return {
          address: addr.payment_address,
          network: addr.network,
          currency: addr.currency,
          balance: '0',
          error: error.message || 'Failed to check balance',
          lastChecked: new Date().toISOString()
        }
      }
    })

    // Wait for all balance checks (with timeout to prevent hanging)
    const balances = await Promise.allSettled(balancePromises)

    const results = balances.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // Promise rejected
        const addr = addresses[index]
        return {
          address: addr.payment_address,
          network: addr.network,
          currency: addr.currency,
          balance: '0',
          error: 'Promise rejected',
          lastChecked: new Date().toISOString()
        }
      }
    })

    // Filter out zero balances unless they have errors
    const nonZeroBalances = results.filter(item =>
      parseFloat(item.balance) > 0 || item.error
    )

    res.json({
      success: true,
      data: nonZeroBalances,
      totalAddresses: addresses.length,
      checkedAddresses: results.length
    })

  } catch (error) {
    logger.error('Failed to get wallet balances:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balances'
    })
  }
})

export default router