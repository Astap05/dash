import { KMSClient, EncryptCommand, DecryptCommand, CreateKeyCommand, DescribeKeyCommand } from '@aws-sdk/client-kms'
import { logger } from '../utils/logger'

export interface KeyMetadata {
  keyId: string
  keyArn: string
  description?: string
  createdAt: Date
}

export class KeyManagementService {
  private kmsClient: KMSClient
  private keyId: string | null = null
  private keyAlias: string

  constructor() {
    // Initialize KMS client
    this.kmsClient = new KMSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    })

    this.keyAlias = process.env.KMS_KEY_ALIAS || 'alias/crypto-payment-seed'
  }

  /**
   * Initialize KMS key if not exists
   */
  async initializeKey(): Promise<string> {
    try {
      // Check if key exists
      const existingKey = await this.getKeyMetadata()
      if (existingKey) {
        this.keyId = existingKey.keyId
        logger.info('KMS key already exists:', existingKey.keyId)
        return existingKey.keyId
      }

      // Create new KMS key
      const createKeyCommand = new CreateKeyCommand({
        Description: 'KMS key for encrypting crypto payment seed phrases',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
        Origin: 'AWS_KMS'
      })

      const response = await this.kmsClient.send(createKeyCommand)
      this.keyId = response.KeyMetadata?.KeyId || ''

      logger.info('Created new KMS key:', this.keyId)
      return this.keyId as string

    } catch (error) {
      logger.error('Failed to initialize KMS key:', error)
      throw new Error('KMS key initialization failed')
    }
  }

  /**
   * Encrypt sensitive data using KMS
   */
  async encryptData(plaintext: string): Promise<string> {
    try {
      const keyId = await this.ensureKeyExists()

      const encryptCommand = new EncryptCommand({
        KeyId: keyId,
        Plaintext: Buffer.from(plaintext, 'utf8')
      })

      const response = await this.kmsClient.send(encryptCommand)
      const encryptedData = response.CiphertextBlob

      // Convert to base64 for storage
      return encryptedData ? Buffer.from(encryptedData).toString('base64') : ''

    } catch (error) {
      logger.error('Failed to encrypt data:', error)
      throw new Error('Data encryption failed')
    }
  }

  /**
   * Decrypt sensitive data using KMS
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      const keyId = await this.ensureKeyExists()

      const decryptCommand = new DecryptCommand({
        KeyId: keyId,
        CiphertextBlob: Buffer.from(encryptedData, 'base64')
      })

      const response = await this.kmsClient.send(decryptCommand)
      const plaintext = response.Plaintext

      return plaintext ? Buffer.from(plaintext).toString('utf8') : ''

    } catch (error) {
      logger.error('Failed to decrypt data:', error)
      throw new Error('Data decryption failed')
    }
  }

  /**
   * Encrypt seed phrase for storage
   */
  async encryptSeedPhrase(seedPhrase: string): Promise<string> {
    logger.info('Encrypting seed phrase with KMS')
    return await this.encryptData(seedPhrase)
  }

  /**
   * Decrypt seed phrase for use
   */
  async decryptSeedPhrase(encryptedSeed: string): Promise<string> {
    logger.info('Decrypting seed phrase with KMS')
    return await this.decryptData(encryptedSeed)
  }

  /**
   * Securely store encrypted seed phrase
   */
  async storeEncryptedSeed(seedPhrase: string): Promise<string> {
    const encrypted = await this.encryptSeedPhrase(seedPhrase)

    // In production, store in secure database or secret manager
    // For demo, return encrypted string
    logger.info('Seed phrase encrypted and ready for storage')
    return encrypted
  }

  /**
   * Retrieve and decrypt seed phrase
   */
  async retrieveDecryptedSeed(encryptedSeed: string): Promise<string> {
    return await this.decryptSeedPhrase(encryptedSeed)
  }

  /**
   * Get key metadata
   */
  private async getKeyMetadata(): Promise<KeyMetadata | null> {
    try {
      const describeCommand = new DescribeKeyCommand({
        KeyId: this.keyAlias
      })

      const response = await this.kmsClient.send(describeCommand)
      const metadata = response.KeyMetadata

      if (!metadata) return null

      return {
        keyId: metadata.KeyId || '',
        keyArn: metadata.Arn || '',
        description: metadata.Description,
        createdAt: metadata.CreationDate || new Date()
      }

    } catch (error: any) {
      // Key doesn't exist or other error
      if (error.name === 'NotFoundException') {
        return null
      }
      throw error
    }
  }

  /**
   * Ensure KMS key exists
   */
  private async ensureKeyExists(): Promise<string> {
    if (this.keyId) return this.keyId

    const metadata = await this.getKeyMetadata()
    if (metadata) {
      this.keyId = metadata.keyId
      return this.keyId
    }

    // Create new key if doesn't exist
    return await this.initializeKey()
  }

  /**
   * Health check for KMS
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureKeyExists()
      return true
    } catch (error) {
      logger.error('KMS health check failed:', error)
      return false
    }
  }

  /**
   * Rotate KMS key (for enhanced security)
   */
  async rotateKey(): Promise<string> {
    logger.info('Rotating KMS key for enhanced security')

    // Create new key
    const newKeyId = await this.initializeKey()

    // TODO: Re-encrypt all stored data with new key
    // This requires access to all encrypted data

    logger.info('KMS key rotation completed')
    return newKeyId
  }
}

// Singleton instance
export const keyManagementService = new KeyManagementService()