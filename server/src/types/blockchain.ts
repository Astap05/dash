// Types for different blockchain networks
export interface BlockchainConfig {
  id: string
  name: string
  symbol: string
  rpcUrl: string
  chainId: number
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  isEVM: boolean
}

export interface CryptoCurrency {
  id: string
  symbol: string
  name: string
  network: string
  icon: string
  available: boolean
  contractAddress?: string // For tokens like USDT
  decimals: number
}

export interface PaymentNetwork {
  id: string
  name: string
  label: string
  blockchains: BlockchainConfig[]
}

// Environment-based configuration - function to avoid import-time evaluation
function isTestnetMode(): boolean {
  return process.env.USE_TESTNET === 'true'
}

// Supported blockchain configurations
export const BLOCKCHAIN_CONFIGS: Record<string, BlockchainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: isTestnetMode()
      ? 'https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}'
      : 'https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}',
    chainId: isTestnetMode() ? 11155111 : 1,
    blockExplorer: isTestnetMode()
      ? 'https://sepolia.etherscan.io'
      : 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    isEVM: true
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POLYGON',
    rpcUrl: 'https://polygon-rpc.com/',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    },
    isEVM: true
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    chainId: 56,
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    isEVM: true
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB1',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    isEVM: true
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: isTestnetMode()
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com',
    chainId: 0, // Solana doesn't use chainId
    blockExplorer: isTestnetMode()
      ? 'https://solscan.io/?cluster=devnet'
      : 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    isEVM: false
  }
}

// Network groupings
export const PAYMENT_NETWORKS: PaymentNetwork[] = [
  {
    id: 'all',
    name: 'ALL',
    label: 'ALL',
    blockchains: Object.values(BLOCKCHAIN_CONFIGS)
  },
  {
    id: 'polygon',
    name: 'Polygon',
    label: 'Polygon (POLYGON)',
    blockchains: [BLOCKCHAIN_CONFIGS.polygon]
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    label: 'Ethereum (ERC20)',
    blockchains: [BLOCKCHAIN_CONFIGS.ethereum]
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    label: 'BNB Chain (BEP20)',
    blockchains: [BLOCKCHAIN_CONFIGS.bsc]
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    label: 'Arbitrum One',
    blockchains: [BLOCKCHAIN_CONFIGS.arbitrum]
  },
  {
    id: 'solana',
    name: 'Solana',
    label: 'Solana',
    blockchains: [BLOCKCHAIN_CONFIGS.solana]
  }
]

// Helper functions
export function getBlockchainConfig(network: string): BlockchainConfig | null {
  return BLOCKCHAIN_CONFIGS[network] || null
}

export function getEVMBlockchains(): BlockchainConfig[] {
  return Object.values(BLOCKCHAIN_CONFIGS).filter(config => config.isEVM)
}

export function getNetworkById(networkId: string): PaymentNetwork | null {
  return PAYMENT_NETWORKS.find(network => network.id === networkId) || null
}