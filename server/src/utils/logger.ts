// Simple logger implementation (replace with winston for production)
interface LogEntry {
  level: string
  message: string
  timestamp: string
  service: string
  [key: string]: any
}

class SimpleLogger {
  private service = 'oxprocessing-backend'

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      level,
      message,
      timestamp,
      service: this.service,
      ...meta
    }
    return JSON.stringify(logEntry)
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta))
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta))
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta))
  }

  debug(message: string, meta?: any) {
    console.debug(this.formatMessage('debug', message, meta))
  }
}

export const logger = new SimpleLogger()