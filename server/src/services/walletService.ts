import { ethers } from 'ethers'
import crypto from 'crypto'
import { logger } from '../utils/logger'

// CRITICAL SECURITY: Master seed phrase MUST be set in environment variables!
// Never commit real seed phrases to code - they will be stolen immediately.
const MASTER_SEED_PHRASE = process.env.MASTER_SEED_PHRASE
const ENCRYPTION_KEY = process.env.MASTER_SEED_ENCRYPTION_KEY

if (!MASTER_SEED_PHRASE) {
  throw new Error(
    'MASTER_SEED_PHRASE environment variable is required. ' +
    'Generate a secure 12/24-word seed phrase and set it in your .env file. ' +
    'NEVER use test seed phrases in production!'
  )
}

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error(
    'MASTER_SEED_ENCRYPTION_KEY environment variable is required and must be at least 32 characters long.'
  )
}

export class WalletService {
  private masterHDWallet: ethers.HDNodeWallet | null = null
  private derivationIndex: number = 0

  constructor() {
    this.initializeMasterHDWallet()
  }

  private async initializeMasterHDWallet() {
    try {
      // Type assertion after validation
      const seedPhrase = MASTER_SEED_PHRASE as string

      // Validate seed phrase format (basic check)
      const words = seedPhrase.split(' ')
      if (words.length !== 12 && words.length !== 24) {
        throw new Error('Seed phrase must be 12 or 24 words')
      }

      // Create HD wallet from seed phrase using BIP39/BIP44
      // Use standard Ethereum derivation path: m/44'/60'/0'/0/0
      this.masterHDWallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, "m/44'/60'/0'/0/0")

      logger.info('Master HD wallet initialized successfully with BIP39/BIP44')
      logger.info(`Master address for validation: ${this.masterHDWallet.address}`)
    } catch (error) {
      logger.error('Failed to initialize master HD wallet:', error)
      throw new Error('HD Wallet initialization failed - check your MASTER_SEED_PHRASE')
    }
  }

  /**
   * Generate a unique payment address for an invoice
   * Uses HD wallet derivation for security
   */
  async generatePaymentAddress(invoiceId: string, currency: string = 'ETH'): Promise<string> {
    if (!this.masterHDWallet) {
      throw new Error('Master HD wallet not initialized')
    }

    try {
      // Generate deterministic index from invoiceId for consistent address generation
      const index = this.hashToIndex(invoiceId)

      // Derive unique address for this invoice using HD wallet
      const paymentWallet = this.masterHDWallet.deriveChild(index)
      const address = paymentWallet.address

      logger.info(`Generated HD payment address for invoice ${invoiceId}: ${address} (index: ${index})`)

      return address
    } catch (error) {
      logger.error('Failed to generate payment address:', error)
      throw new Error('Address generation failed')
    }
  }

  /**
   * Get private key for a payment address (for signing transactions)
   * WARNING: Only use when absolutely necessary
   */
  async getPrivateKey(invoiceId: string): Promise<string> {
    if (!this.masterHDWallet) {
      throw new Error('Master HD wallet not initialized')
    }

    try {
      // Generate the same derivation index as in generatePaymentAddress
      const index = this.hashToIndex(invoiceId)

      // Derive the same payment wallet
      const paymentWallet = this.masterHDWallet.deriveChild(index)
      const privateKey = paymentWallet.privateKey

      logger.warn(`Retrieved private key for invoice ${invoiceId} (index: ${index})`)

      return privateKey
    } catch (error) {
      logger.error('Failed to get private key:', error)
      throw new Error('Private key retrieval failed')
    }
  }

  /**
   * Convert invoice ID to derivation index
   */
  private hashToIndex(invoiceId: string): number {
    const hash = crypto.createHash('sha256').update(invoiceId).digest('hex')
    // Take first 8 characters and convert to number
    const index = parseInt(hash.substring(0, 8), 16)
    return index % 1000000 // Limit to reasonable range
  }

  /**
   * Validate if an address belongs to our wallet
   */
  async validateAddressOwnership(address: string, invoiceId: string): Promise<boolean> {
    try {
      const expectedAddress = await this.generatePaymentAddress(invoiceId)
      return expectedAddress.toLowerCase() === address.toLowerCase()
    } catch {
      return false
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY as string)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY as string)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}

// Singleton instance
export const walletService = new WalletService()