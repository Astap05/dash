import { User } from '../services/authService'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}