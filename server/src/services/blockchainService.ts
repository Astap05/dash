import { ethers } from 'ethers'
import { Connection } from '@solana/web3.js'
import { logger } from '../utils/logger'
import { query, runQuery } from '../db/index'
import { BlockchainConfig, BLOCKCHAIN_CONFIGS, getBlockchainConfig } from '../types/blockchain'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

interface MonitoredAddress {
  address: string
  network: string
}

interface DBInvoice {
  id: string
  amount: string
  memo: string
  status: string
  payment_address?: string
  network?: string
}

// Move log file to a completely separate directory to avoid triggering tsx watch restarts
const LOG_FILE = 'c:/Users/Admin/dashboard_data/blockchain-monitor.log'

function debugLog(msg: string) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${msg}\n`
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch (e) { }
  console.log(line.trim())
}

export class BlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider | Connection> = new Map()
  private monitoredAddresses: Set<string> = new Set()
  private isChecking: boolean = false
  private failedAddresses: Map<string, number> = new Map()
  private lastLedgerSequence: number = 0

  constructor() {
    debugLog('BlockchainService initializing...')
    this.initializeProviders()

    this.loadPendingInvoices().then(() => {
      debugLog('Initial invoices loaded.')
      this.checkPendingPayments()
    }).catch((error: any) => {
      debugLog(`Failed to load pending invoices: ${error.message}`)
    })

    this.startMonitoring()
  }

  private async loadPendingInvoices() {
    try {
      const result = await query(
        "SELECT payment_address, network FROM invoices WHERE status = 'pending' OR status = 'expired'",
        []
      )

      const rows = result.rows as DBInvoice[]
      debugLog(`Found ${rows.length} invoices in DB to monitor`)

      for (const row of rows) {
        if (row.payment_address && row.network) {
          this.addAddressToMonitor(row.payment_address, row.network)
        }
      }
    } catch (error: any) {
      debugLog(`Error loading pending invoices: ${error.message}`)
    }
  }

  private initializeProviders() {
    Object.values(BLOCKCHAIN_CONFIGS).forEach(config => {
      try {
        if (config.isEVM) {
          const rpcUrl = config.rpcUrl.replace('${INFURA_PROJECT_ID}', process.env.INFURA_PROJECT_ID || 'your-infura-project-id')
          const provider = new ethers.JsonRpcProvider(rpcUrl)
          this.providers.set(config.id, provider)
        } else if (config.id === 'solana') {
          const connection = new Connection(config.rpcUrl, 'confirmed')
          this.providers.set(config.id, connection)
        }
      } catch (error: any) {
        debugLog(`Failed to initialize provider for ${config.name}: ${error.message}`)
      }
    })
  }

  private startMonitoring() {
    setInterval(() => {
      this.checkPendingPayments()
    }, 30000)
    debugLog('Monitoring loop started (30s interval)')
  }

  addAddressToMonitor(address: string, network: string) {
    if (!address || !network) return
    const config = getBlockchainConfig(network)
    if (!config) return

    if (network === 'ripple' && address.length < 30) return
    if (network === 'stellar' && address.length < 50) return

    const normalizedAddress = config.isEVM ? address.toLowerCase() : address
    const key = `${network}:${normalizedAddress}`

    if (!this.monitoredAddresses.has(key)) {
      this.monitoredAddresses.add(key)
      debugLog(`[Monitor] Added ${key}`)
    }
  }

  private async checkPendingPayments() {
    if (this.isChecking) {
      debugLog('Check cycle already in progress, skipping...')
      return
    }

    this.isChecking = true
    try {
      const addresses = Array.from(this.monitoredAddresses)
      if (addresses.length === 0) {
        this.isChecking = false
        return
      }

      // Prioritize master XRP address
      const masterXRP = 'ripple:rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3'
      const sortedAddresses = addresses.sort((a, b) => {
        if (a === masterXRP) return -1
        if (b === masterXRP) return 1
        return 0
      })

      // Update current ledger sequence once per cycle for Ripple
      const hasRipple = sortedAddresses.some(k => k.startsWith('ripple:'))
      if (hasRipple) {
        try {
          const config = getBlockchainConfig('ripple')
          if (config) {
            // Force Testnet URL if needed (fix for config loading issue)
            if (process.env.USE_TESTNET === 'true' && !config.rpcUrl.includes('testnet')) {
              config.rpcUrl = 'https://testnet.xrpl-labs.com'
              debugLog('[XRP] Forced Testnet URL')
            }

            const infoResponse = await axios.post(config.rpcUrl, {
              method: 'server_info'
            }, { timeout: 5000 })
            const seq = infoResponse.data?.result?.info?.validated_ledger?.seq
            if (seq) {
              this.lastLedgerSequence = seq
              // debugLog(`[XRP] Current ledger sequence: ${seq}`)
            }
          }
        } catch (e: any) {
          debugLog(`[XRP] Failed to get server info: ${e.message}`)
        }
      }

      debugLog(`--- Starting check cycle for ${sortedAddresses.length} addresses ---`)

      for (const key of sortedAddresses) {
        const [network, address] = key.split(':')

        // Skip addresses that failed too many times (except master)
        const fails = this.failedAddresses.get(key) || 0
        if (fails > 5 && key !== masterXRP) {
          continue
        }

        await this.checkAddressPayments(address, network)
        // Increased delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      debugLog(`--- Check cycle finished ---`)
    } catch (error: any) {
      debugLog(`Error in payment check loop: ${error.message}`)
    } finally {
      this.isChecking = false
    }
  }

  private async checkAddressPayments(address: string, network: string) {
    try {
      const config = getBlockchainConfig(network)
      if (!config) {
        debugLog(`[Skip] No config for network ${network}`)
        return
      }

      if (config.id === 'ripple') {
        await this.checkRipplePayments(address)
      } else if (config.id === 'stellar') {
        await this.checkStellarPayments(address)
      } else {
        debugLog(`[${network.toUpperCase()}] Monitoring not implemented yet for ${address}`)
      }
    } catch (error: any) {
      const key = `${network}:${address}`
      this.failedAddresses.set(key, (this.failedAddresses.get(key) || 0) + 1)
    }
  }

  private async checkRipplePayments(address: string) {
    const key = `ripple:${address}`
    try {
      const config = getBlockchainConfig('ripple')
      if (!config) return

      // Force Testnet URL if needed (double check)
      if (process.env.USE_TESTNET === 'true' && !config.rpcUrl.includes('testnet')) {
        config.rpcUrl = 'https://testnet.xrpl-labs.com'
      }

      // Calculate min ledger to fetch only recent transactions
      let minLedger = -1
      if (this.lastLedgerSequence > 0) {
        // Fetch last ~1000 ledgers (approx 1 hour of history)
        minLedger = Math.max(0, this.lastLedgerSequence - 1000)
      }

      const response = await axios.post(config.rpcUrl, {
        method: 'account_tx',
        params: [{
          account: address,
          ledger_index_min: minLedger,
          limit: 400,
          forward: false
        }]
      }, { timeout: 30000 })

      const result = response.data?.result
      if (!result) return

      if (result.error) {
        if (result.error === 'actNotFound' || result.error === 'accountNotFound') {
          this.failedAddresses.set(key, 10) // Permanent fail
        }
        return
      }

      // Reset fail count on success
      this.failedAddresses.set(key, 0)

      const transactions = result.transactions || []
      if (address === 'rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3') {
        debugLog(`[XRP] Found ${transactions.length} transactions for master address (from ledger ${minLedger})`)
        if (transactions.length === 0 && result.status === 'success') {
          debugLog(`[XRP] API returned success but no transactions - possible issue with ledger range`)
        }
      }

      const pendingInvoicesResult = await query(
        "SELECT id, amount, memo FROM invoices WHERE network = 'ripple' AND (status = 'pending' OR status = 'expired')",
        []
      )
      const pendingInvoices = pendingInvoicesResult.rows as DBInvoice[]
      debugLog(`[XRP] Pending invoices: ${pendingInvoices.length}`)

      if (pendingInvoices.length === 0) return

      if (address === 'rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3') {
        const tags = pendingInvoices.map(i => i.memo).join(', ')
        debugLog(`[XRP] Master address (${address}): ${transactions.length} txs. Looking for tags: [${tags}]`)
      }

      for (const txWrapper of transactions) {
        const tx = txWrapper.tx || txWrapper
        const meta = txWrapper.meta || txWrapper.metaData

        if (tx.TransactionType !== 'Payment') continue

        const resultStatus = meta?.TransactionResult || meta?.transaction_result
        if (resultStatus !== 'tesSUCCESS') continue
        if (tx.Destination !== address) continue

        const destinationTag = tx.DestinationTag !== undefined ? String(tx.DestinationTag) : null

        const amountDrops = typeof tx.Amount === 'string' ? tx.Amount : (tx.Amount?.value || '0')
        const amountXRP = parseFloat(amountDrops) / 1000000

        // Debug log incoming payments (reduced logging)
        if (destinationTag) debugLog(`[XRP Payment] Hash: ${tx.hash}, Tag: ${destinationTag}, Amount: ${amountXRP}`)

        // TEMPORARILY accept payments without tag for testing
        if (!destinationTag) {
          debugLog(`[XRP Skip] No destination tag for tx ${tx.hash}`)
          // continue  // Commented out for testing
        }

        let foundMatch = false
        for (const invoice of pendingInvoices) {
          const invMemo = String(invoice.memo).trim()
          const txTag = String(destinationTag).trim()

          // Check by tag if present
          if (destinationTag && invMemo === txTag) {
            const expectedAmount = parseFloat(invoice.amount)
            debugLog(`[XRP Match by Tag] Tag: ${txTag}, Amount: ${amountXRP}, Expected: ${expectedAmount}`)
            if (amountXRP >= expectedAmount * 0.98) {
              debugLog(`[XRP Success] Invoice ${invoice.id} confirmed by tag!`)
              await this.confirmPaymentDirectly(invoice.id, tx.hash || tx.TxnSignature, amountXRP)
              foundMatch = true
            } else {
              debugLog(`[XRP Fail] Amount too low for ${invoice.id}: ${amountXRP} < ${expectedAmount}`)
            }
          }
          // Check by amount if no tag (TEMPORARY for testing)
          else if (!destinationTag) {
            const expectedAmount = parseFloat(invoice.amount)
            if (Math.abs(amountXRP - expectedAmount) < 0.000001) { // Exact match
              debugLog(`[XRP Success] Invoice ${invoice.id} confirmed by amount! Hash: ${tx.hash}`)
              await this.confirmPaymentDirectly(invoice.id, tx.hash || tx.TxnSignature, amountXRP)
              foundMatch = true
            }
          }
        }
        if (!foundMatch && !destinationTag) {
          debugLog(`[XRP No Match] Payment without tag, amount ${amountXRP} not matching any invoice`)
        }
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        debugLog(`[XRP] Timeout for ${address}`)
      } else {
        debugLog(`[XRP] Error for ${address}: ${error.message}`)
      }
      this.failedAddresses.set(key, (this.failedAddresses.get(key) || 0) + 1)
    }
  }

  private async checkStellarPayments(address: string) {
    const key = `stellar:${address}`
    try {
      const config = getBlockchainConfig('stellar')
      if (!config) return

      const response = await axios.get(`${config.rpcUrl}/accounts/${address}/payments?limit=20&order=desc`, { timeout: 20000 })
      const payments = response.data?._embedded?.records || []

      // Reset fail count on success
      this.failedAddresses.set(key, 0)

      const pendingInvoicesResult = await query(
        "SELECT id, amount, memo FROM invoices WHERE network = 'stellar' AND (status = 'pending' OR status = 'expired')",
        []
      )
      const pendingInvoices = pendingInvoicesResult.rows as DBInvoice[]

      if (pendingInvoices.length === 0) return

      for (const payment of payments) {
        if (payment.type !== 'payment' || !payment.transaction_successful) continue

        const txResponse = await axios.get(payment._links.transaction.href, { timeout: 10000 })
        const memo = txResponse.data.memo
        const amount = parseFloat(payment.amount)

        for (const invoice of pendingInvoices) {
          if (String(invoice.memo).trim() === String(memo).trim() && amount >= parseFloat(invoice.amount) * 0.98) {
            debugLog(`[Stellar Match] Invoice ${invoice.id} confirmed! Memo: ${memo}, Amount: ${amount}`)
            await this.confirmPaymentDirectly(invoice.id, payment.transaction_hash, amount)
          }
        }
      }
    } catch (error: any) {
      debugLog(`[Stellar] Error for ${address}: ${error.message}`)
      this.failedAddresses.set(key, (this.failedAddresses.get(key) || 0) + 1)
    }
  }

  private async confirmPaymentDirectly(invoiceId: string, txHash: string, amount: number) {
    try {
      const check = await query('SELECT status FROM invoices WHERE id = $1', [invoiceId])
      const rows = check.rows as DBInvoice[]
      if (rows.length === 0) {
        debugLog(`[Confirm Error] Invoice ${invoiceId} not found in DB`)
        return
      }

      const currentStatus = rows[0].status
      if (currentStatus === 'paid' || currentStatus === 'confirmed') {
        debugLog(`[Confirm] Invoice ${invoiceId} already ${currentStatus}`)
        return
      }

      const now = new Date().toISOString()
      debugLog(`[Confirm] Updating ${invoiceId} to paid...`)

      runQuery("UPDATE invoices SET status = 'paid', updated_at = $1 WHERE id = $2", [now, invoiceId])

      const verify = await query('SELECT status FROM invoices WHERE id = $1', [invoiceId])
      const verifyRows = verify.rows as DBInvoice[]
      debugLog(`[Confirm] Invoice ${invoiceId} status updated to: ${verifyRows[0]?.status}`)

      runQuery(
        `INSERT INTO transactions (invoice_id, tx_hash, amount, status, confirmations, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoiceId, txHash, amount, 'confirmed', 1, now]
      )
      debugLog(`[Success] Invoice ${invoiceId} marked as PAID and transaction recorded`)
    } catch (error: any) {
      debugLog(`[Confirm Error] ${invoiceId}: ${error.message}`)
    }
  }
}

export const blockchainService = new BlockchainService()