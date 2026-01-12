import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// Invoice creation validation schema
export const invoiceCreationSchema = Joi.object({
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Nickname must be at least 3 characters long',
      'string.max': 'Nickname must not exceed 50 characters',
      'string.pattern.base': 'Nickname can only contain letters, numbers, and underscores',
      'any.required': 'Nickname is required'
    }),

  amount: Joi.number()
    .positive()
    .max(10000) // Maximum 10k USD equivalent
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'number.max': 'Amount cannot exceed 10,000',
      'any.required': 'Amount is required'
    }),

  currency: Joi.string()
    .valid('ETH', 'USDT', 'BTC', 'USDC')
    .required()
    .messages({
      'any.only': 'Currency must be one of: ETH, USDT, BTC, USDC',
      'any.required': 'Currency is required'
    }),

  network: Joi.string()
    .valid('ethereum', 'polygon', 'bsc', 'arbitrum', 'solana', 'tron', 'bitcoin', 'avax')
    .required()
    .messages({
      'any.only': 'Network must be one of: ethereum, polygon, bsc, arbitrum, solana, tron, bitcoin, avax',
      'any.required': 'Network is required'
    })
})

// Auth validation schemas
export const registerSchema = Joi.object({
  nickname: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'PIN must be exactly 4 digits'
    })
})

export const loginSchema = Joi.object({
  nickname: Joi.string()
    .min(3)
    .max(50)
    .required(),
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
})

// Wallet validation schemas
export const addressValidationSchema = Joi.object({
  invoiceId: Joi.string()
    .min(10)
    .max(100)
    .required()
})

// Middleware function to validate request body
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      logger.warn(`Validation error for ${req.path}: ${error.details.map(d => d.message).join(', ')}`)

      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      })
    }

    // Replace req.body with validated value
    req.body = value
    next()
  }
}

// Middleware to validate query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false })

    if (error) {
      logger.warn(`Query validation error for ${req.path}: ${error.details.map(d => d.message).join(', ')}`)

      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details.map(d => d.message)
      })
    }

    req.query = value
    next()
  }
}

// Sanitize input (basic XSS protection)
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic sanitization - remove script tags
  const sanitizeString = (str: string) => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key])
      }
      return sanitized
    }
    return obj
  }

  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }

  next()
}