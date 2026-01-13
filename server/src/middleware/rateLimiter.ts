import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger'
import { auditService } from '../services/auditService'

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`)
    auditService.logRateLimitEvent(req.path, req.ip || 'unknown', req.get('User-Agent') || 'unknown')
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    })
  }
})

// Stricter limiter for invoice creation
const isDevelopment = process.env.NODE_ENV !== 'production'
export const invoiceCreationLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 60 * 60 * 1000, // 1 minute in dev, 1 hour in prod
  max: isDevelopment ? 50 : 10, // 50 in dev, 10 in prod per window
  message: {
    success: false,
    error: isDevelopment ? 'Too many invoices created. Please wait a minute.' : 'Too many invoices created. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Invoice creation rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      error: isDevelopment ? 'Invoice creation limit exceeded. Please wait a minute.' : 'Invoice creation limit exceeded. Please try again in an hour.'
    })
  }
})

// Wallet operations limiter
export const walletLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 wallet operations per 5 minutes
  message: {
    success: false,
    error: 'Too many wallet operations. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Wallet operations rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      error: 'Wallet operation limit exceeded. Please try again later.'
    })
  }
})

// Auth operations limiter (most strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(`Auth rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      error: 'Authentication attempts limit exceeded. Please try again later.'
    })
  }
})