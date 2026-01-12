import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Log error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // PostgreSQL errors
  if ((err as any).code === '23505') { // Unique violation
    statusCode = 409
    message = 'Resource already exists'
  }

  if ((err as any).code === '23503') { // Foreign key violation
    statusCode = 400
    message = 'Invalid reference'
  }

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        stack: err.stack,
        statusCode
      }
    })
  } else {
    // Don't leak error details in production
    res.status(statusCode).json({
      success: false,
      error: {
        message: statusCode === 500 ? 'Internal Server Error' : message
      }
    })
  }
}