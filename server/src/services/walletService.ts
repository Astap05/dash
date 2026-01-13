import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
import { derivePath } from 'ed25519-hd-key'
import { mnemonicToSeedSync } from 'bip39'
import crypto from 'crypto'
import { logger } from '../utils/logger'

// CRITICAL SECURITY: Master seed phrase MUST be set in environment variables!
// Never commit real seed phrases to code - they will be stolen immediately.
const isTestnet = process.env.USE_TESTNET === 'true'
const isProduction = process.env.NODE_ENV === 'production'

// Select appropriate environment variables based on testnet/mainnet
let MASTER_SEED_PHRASE = isTestnet
  ? process.env.TESTNET_MASTER_SEED_PHRASE || process.env.MASTER_SEED_PHRASE
  : process.env.MASTER_SEED_PHRASE

let ENCRYPTION_KEY = isTestnet
  ? process.env.TESTNET_MASTER_SEED_ENCRYPTION_KEY || process.env.MASTER_SEED_ENCRYPTION_KEY
  : process.env.MASTER_SEED_ENCRYPTION_KEY

if (!MASTER_SEED_PHRASE) {
  if (isProduction && !isTestnet) {
    throw new Error(
      'MASTER_SEED_PHRASE environment variable is required in production mainnet. ' +
      'Generate a secure 12/24-word seed phrase and set it in your .env file. ' +
      'NEVER use test seed phrases in production!'
    )
  } else {
    // Use a test seed phrase for development/testnet
    const envType = isTestnet ? 'TESTNET' : 'DEVELOPMENT'
    console.warn(`⚠️  USING TEST SEED PHRASE FOR ${envType} - DO NOT USE IN PRODUCTION!`)
    console.warn(`⚠️  Replace MASTER_SEED_PHRASE in .env with a real seed phrase before going to production!`)
    // Generate a deterministic test seed phrase
    MASTER_SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  }
}

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  if (isProduction && !isTestnet) {
    throw new Error(
      'MASTER_SEED_ENCRYPTION_KEY environment variable is required in production mainnet and must be at least 32 characters long.'
    )
  } else {
    // Use a test encryption key for development/testnet
    const envType = isTestnet ? 'TESTNET' : 'DEVELOPMENT'
    console.warn(`⚠️  USING TEST ENCRYPTION KEY FOR ${envType} - DO NOT USE IN PRODUCTION!`)
    ENCRYPTION_KEY = 'test-encryption-key-for-development-only-32-chars'
  }
}

export class WalletService {
  private masterHDWallet: ethers.HDNodeWallet | null = null
  private masterSolanaKeypair: Keypair | null = null
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

      // Initialize Solana master keypair from the same seed
      const seed = mnemonicToSeedSync(seedPhrase)
      const { key: derivedSeed } = derivePath("m/44'/501'/0'/0'", seed.toString('hex'))
      this.masterSolanaKeypair = Keypair.fromSeed(derivedSeed.slice(0, 32))

      const networkMode = isTestnet ? 'TESTNET' : 'MAINNET'
      logger.info(`Master HD wallet initialized successfully with BIP39/BIP44 (${networkMode})`)
      logger.info(`Master ETH address for validation: ${this.masterHDWallet.address}`)
      logger.info(`Master SOL address for validation: ${this.masterSolanaKeypair.publicKey.toString()}`)
    } catch (error) {
      logger.error('Failed to initialize master HD wallet:', error)
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        seedPhrase: MASTER_SEED_PHRASE ? 'present' : 'missing',
        encryptionKey: ENCRYPTION_KEY ? 'present' : 'missing'
      })
      throw new Error('HD Wallet initialization failed - check your MASTER_SEED_PHRASE')
    }
  }

  /**
   * Generate a unique payment address for an invoice
   * Uses HD wallet derivation for security
   */
  async generatePaymentAddress(invoiceId: string, currency: string = 'ETH'): Promise<string> {
    try {
      // Generate deterministic index from invoiceId for consistent address generation
      const index = this.hashToIndex(invoiceId)

      if (currency === 'SOL') {
        if (!this.masterSolanaKeypair) {
          throw new Error('Master Solana keypair not initialized')
        }

        // Derive Solana address using ed25519 HD derivation
        const seed = mnemonicToSeedSync(MASTER_SEED_PHRASE as string)
        const path = `m/44'/501'/${index}'/0'`
        const { key: derivedSeed } = derivePath(path, seed.toString('hex'))
        const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32))
        const address = keypair.publicKey.toString()

        logger.info(`Generated Solana payment address for invoice ${invoiceId}: ${address} (path: ${path})`)
        return address
      } else {
        // For EVM chains (ETH, etc.)
        if (!this.masterHDWallet) {
          throw new Error('Master HD wallet not initialized')
        }

        // Derive unique address for this invoice using HD wallet
        const paymentWallet = this.masterHDWallet.deriveChild(index)
        const address = paymentWallet.address

        logger.info(`Generated HD payment address for invoice ${invoiceId}: ${address} (index: ${index})`)
        return address
      }
    } catch (error) {
      logger.error('Failed to generate payment address:', error)
      throw new Error('Address generation failed')
    }
  }

  /**
   * Get private key for a payment address (for signing transactions)
   * WARNING: Only use when absolutely necessary
   */
  async getPrivateKey(invoiceId: string, currency: string = 'ETH'): Promise<string> {
    try {
      // Generate the same derivation index as in generatePaymentAddress
      const index = this.hashToIndex(invoiceId)

      if (currency === 'SOL') {
        if (!this.masterSolanaKeypair) {
          throw new Error('Master Solana keypair not initialized')
        }

        // Derive Solana private key using ed25519 HD derivation
        const seed = mnemonicToSeedSync(MASTER_SEED_PHRASE as string)
        const path = `m/44'/501'/${index}'/0'`
        const { key: derivedSeed } = derivePath(path, seed.toString('hex'))
        const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32))
        const privateKey = Buffer.from(keypair.secretKey).toString('hex')

        logger.warn(`Retrieved Solana private key for invoice ${invoiceId} (path: ${path})`)
        return privateKey
      } else {
        // For EVM chains (ETH, etc.)
        if (!this.masterHDWallet) {
          throw new Error('Master HD wallet not initialized')
        }

        // Derive the same payment wallet
        const paymentWallet = this.masterHDWallet.deriveChild(index)
        const privateKey = paymentWallet.privateKey

        logger.warn(`Retrieved private key for invoice ${invoiceId} (index: ${index})`)
        return privateKey
      }
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
  async validateAddressOwnership(address: string, invoiceId: string, currency: string = 'ETH'): Promise<boolean> {
    try {
      const expectedAddress = await this.generatePaymentAddress(invoiceId, currency)
      if (currency === 'SOL') {
        return expectedAddress === address
      } else {
        return expectedAddress.toLowerCase() === address.toLowerCase()
      }
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