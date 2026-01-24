// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { logger } from './utils/logger'
import invoiceRoutes from './routes/invoices'
import authRoutes from './routes/auth'
import walletRoutes from './routes/wallet'
import { blockchainService } from './services/blockchainService'

const app = express()
const port = process.env.PORT || 3002

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/invoices', invoiceRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/wallets', walletRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Initialize blockchain service
// This is already done by the import above, but we can log it
logger.info('Blockchain service initialized and monitoring started')

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
  console.log(`Server running on port ${port}`)
})

export default app