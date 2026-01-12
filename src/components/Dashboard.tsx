import { useState } from 'react'
import Header from './Header'
import InvoiceCreator from './InvoiceCreator'
import InvoicePaymentPage from './InvoicePaymentPage'

interface InvoiceData {
  invoiceId?: string
  email: string
  amount: number
  currency: {
    id: string
    symbol: string
    name: string
    network: string
    icon: string
  }
  paymentAddress?: string
  memo?: string
  qrCode?: string
  expiresAt?: string
}

function Dashboard() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)

  const handleCreateInvoice = (data: InvoiceData) => {
    setInvoiceData(data)
  }

  const handleBack = () => {
    setInvoiceData(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-6">
        <Header />
        
        <div className="mt-8">
          {invoiceData ? (
            <InvoicePaymentPage invoiceData={invoiceData} onBack={handleBack} />
          ) : (
            <InvoiceCreator onCreateInvoice={handleCreateInvoice} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
