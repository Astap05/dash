import { createContext, useContext, ReactNode } from 'react'
import { useWallet } from '../hooks/useWallet'

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  balance: string | null
  chainId: number | null
  walletType: 'metamask' | 'walletconnect' | null
  connectWallet: () => Promise<void>
  connectWalletConnect: () => Promise<void>
  disconnectWallet: () => void
  isMetaMaskInstalled: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet()

  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

