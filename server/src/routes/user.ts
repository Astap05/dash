import express from 'express'
import { runQuery, query } from '../db/index'
import { logger } from '../utils/logger'

const router = express.Router()

/**
 * Get user's wallet addresses
 */
router.get('/wallets', async (req, res) => {
  try {
    const userId = req.user?.id || '1'

    const result = await query('SELECT wallets FROM users WHERE id = $1', [userId])

    if (result.rows.length === 0) {
      // Create user if not exists
      runQuery('INSERT INTO users (id, nickname, pin_hash, created_at) VALUES ($1, $2, $3, $4)', [userId, 'test', 'test', new Date().toISOString()])
      return res.json({ success: true, data: { wallets: [] } })
    }

    const wallets = JSON.parse(result.rows[0].wallets || '[]')

    res.json({
      success: true,
      data: { wallets }
    })

  } catch (error) {
    logger.error('Failed to get wallets:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get wallets'
    })
  }
})

/**
 * Add wallet address
 */
router.post('/wallets', async (req, res) => {
  try {
    const { address } = req.body
    const userId = req.user?.id || '1'

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      })
    }

    // Get current wallets
    const result = await query('SELECT wallets FROM users WHERE id = $1', [userId])

    if (result.rows.length === 0) {
      // Create user if not exists
      runQuery('INSERT INTO users (id, nickname, pin_hash, created_at) VALUES ($1, $2, $3, $4)', [userId, 'test', 'test', new Date().toISOString()])
      const wallets = [address]
      runQuery('UPDATE users SET wallets = $1 WHERE id = $2', [JSON.stringify(wallets), userId])
      return res.json({ success: true, data: { wallets } })
    }

    const wallets = JSON.parse(result.rows[0].wallets || '[]')

    // Add if not exists
    if (!wallets.includes(address)) {
      wallets.push(address)
    }

    // Update
    runQuery('UPDATE users SET wallets = $1 WHERE id = $2', [JSON.stringify(wallets), userId])

    res.json({
      success: true,
      data: { wallets }
    })

  } catch (error) {
    logger.error('Failed to add wallet:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add wallet'
    })
  }
})

/**
 * Remove wallet address
 */
router.delete('/wallets/:address', async (req, res) => {
  try {
    const { address } = req.params
    const userId = req.user?.id || '1'

    // Get current wallets
    const result = await query('SELECT wallets FROM users WHERE id = $1', [userId])

    if (result.rows.length === 0) {
      return res.json({ success: true, data: { wallets: [] } })
    }

    const wallets = JSON.parse(result.rows[0].wallets || '[]')

    // Remove
    const updatedWallets = wallets.filter((w: string) => w !== address)

    // Update
    runQuery('UPDATE users SET wallets = $1 WHERE id = $2', [JSON.stringify(updatedWallets), userId])

    res.json({
      success: true,
      data: { wallets: updatedWallets }
    })

  } catch (error) {
    logger.error('Failed to remove wallet:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove wallet'
    })
  }
})

export default router