import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createServer } from 'http'

// Import routes
import authRoutes from './routes/auth'
import invoiceRoutes from './routes/invoices'
import walletRoutes from './routes/wallet'
import userRoutes from './routes/user'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'
import { generalLimiter, invoiceCreationLimiter, walletLimiter, authLimiter } from './middleware/rateLimiter'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting - general limiter for all routes
app.use(generalLimiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/invoices', invoiceCreationLimiter, invoiceRoutes)
app.use('/api/wallet', walletLimiter, walletRoutes)
app.use('/api/user', walletLimiter, userRoutes)

// Error handling (must be last)
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

server.listen(PORT, () => {
  const networkMode = process.env.USE_TESTNET === 'true' ? 'TESTNET' : 'MAINNET'
  logger.info(`🚀 OX Processing Backend running on port ${PORT}`)
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`)
  logger.info(`🌐 Network Mode: ${networkMode}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

export default app