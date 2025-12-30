import { useState } from 'react'
import { X } from 'lucide-react'

interface InvoiceOption {
  id: string
  title: string
  network: string
  currency: 'USDT' | 'TRX'
  exchangeRate: number
  fee: number
  networkFee?: number
  minAmount: number
  feeType: 'percentage' | 'fixed'
}

const invoiceOptions: InvoiceOption[] = [
  {
    id: 'usdt-tron',
    title: 'USDT - TRON',
    network: 'TRON',
    currency: 'USDT',
    exchangeRate: 74.57,
    fee: 0.65,
    minAmount: 1,
    feeType: 'percentage',
  },
  {
    id: 'usdt-erc20',
    title: 'USDT - ERC20',
    network: 'ERC20',
    currency: 'USDT',
    exchangeRate: 74.57,
    fee: 1.2,
    networkFee: 0.2238,
    minAmount: 2.2238,
    feeType: 'percentage',
  },
  {
    id: 'trx-tron',
    title: 'TRX - TRON',
    network: 'TRON',
    currency: 'TRX',
    exchangeRate: 21.63, // 1 USD = 21.63 TRX (примерно $0.29 за TRX)
    fee: 0.65,
    minAmount: 1,
    feeType: 'percentage',
  },
  {
    id: 'trx',
    title: 'TRX',
    network: 'TRON',
    currency: 'TRX',
    exchangeRate: 21.63,
    fee: 1.2,
    networkFee: 0,
    minAmount: 15,
    feeType: 'percentage',
  },
]

interface InvoiceCardProps {
  option: InvoiceOption
  onClose?: () => void
}

function InvoiceCard({ option, onClose }: InvoiceCardProps) {
  const [usdAmount, setUsdAmount] = useState(1000)
  const [cryptoAmount, setCryptoAmount] = useState(1000)

  // Расчет суммы к получению
  const calculateReceivedAmount = () => {
    let amount = cryptoAmount

    // Применяем комиссию
    if (option.feeType === 'percentage') {
      amount = amount * (1 - option.fee / 100)
    } else {
      amount = amount - option.fee
    }

    // Вычитаем сетевую комиссию
    if (option.networkFee) {
      amount = amount - option.networkFee
    }

    return Math.max(0, amount)
  }

  const receivedAmount = calculateReceivedAmount()

  // Обновление суммы в USD при изменении криптовалюты
  const handleCryptoChange = (value: number) => {
    setCryptoAmount(value)
    setUsdAmount(value / option.exchangeRate)
  }

  // Обновление суммы в криптовалюте при изменении USD
  const handleUsdChange = (value: number) => {
    setUsdAmount(value)
    setCryptoAmount(value * option.exchangeRate)
  }

  const handleCreateInvoice = () => {
    if (cryptoAmount < option.minAmount) {
      alert(`Минимальная сумма: ${option.minAmount} ${option.currency}`)
      return
    }

    // Здесь должна быть логика создания инвойса
    alert(`Инвойс создан!\nСумма к получению: ${receivedAmount.toFixed(2)} ${option.currency}`)
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <h3 className="text-xl font-bold mb-6">{option.title}</h3>

      {/* Сумма к получению */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Amount to be received</div>
        <div className="text-2xl font-bold text-orange-400">
          {receivedAmount.toFixed(2)} {option.currency}
        </div>
      </div>

      {/* Поля ввода */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Amount in USD</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={usdAmount}
              onChange={(e) => handleUsdChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Amount in {option.currency}</label>
          <div className="relative">
            <input
              type="number"
              value={cryptoAmount}
              onChange={(e) => handleCryptoChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-4 pr-16 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {option.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка создания инвойса */}
      <button
        onClick={handleCreateInvoice}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity mb-6"
      >
        Create invoice
      </button>

      {/* Курс обмена и комиссии */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Exchange rate:</span>
          <span className="text-white">
            $1, {option.exchangeRate.toFixed(2)} {option.currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Minimum amount:</span>
          <span className="text-white">
            {option.minAmount} {option.currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">
            {option.networkFee ? 'Recharge fee:' : 'Fee:'}
          </span>
          <span className="text-white">
            {option.fee}%
          </span>
        </div>
        {option.networkFee !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-400">Network fee:</span>
            <span className="text-white">
              {option.networkFee} {option.currency}
            </span>
          </div>
        )}
      </div>

      {/* Важные предупреждения */}
      <div className="space-y-3 text-xs">
        <div className="text-gray-400">
          Destination addresses are single-use.
        </div>

        <div className="space-y-2">
          <div className="text-red-400 font-semibold">
            We do not provide refunds for crypto payments!
          </div>
          <div className="text-red-400">
            Please keep the transaction fee in mind!
          </div>
          <div className="text-red-400">
            Transaction amount should be larger than the required minimum payment;
          </div>
          <div className="text-red-400">
            {option.networkFee !== undefined
              ? 'Payment address active for limited time;'
              : "Transaction's destination address is active for only 60 minutes;"}
          </div>
          <div className="text-red-400">
            Send strictly the amount that you specified while creating an invoice on our website;
          </div>
          <div className="text-red-400">
            Violation of any rule shall lead to loss of funds.
          </div>
        </div>

        <div className="text-yellow-400">
          Calculations are approximate. The sum of money you will get may slightly vary.
        </div>

        <div className="text-gray-400">
          We do AML checks for all payments to find out if they were made by customers that could
          potentially be part of risk groups, which may involve cryptocurrency mixing/tumbling,
          hacking, scamming or be connected with OFAC sanctions list, darkweb or terrorism-related
          communities, etc. You risk losing all your funds if you send money as part of the
          above-mentioned risk groups.
        </div>

        <div className="text-gray-400">
          If the money did not reach your balance within 12 hours, contact our support and provide
          all the details regarding your payment.
        </div>
      </div>
    </div>
  )
}

function InvoiceCreator() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Create Crypto Invoice</h2>
        <p className="text-gray-400">
          Choose a payment method and create an invoice to receive cryptocurrency payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {invoiceOptions.map((option) => (
          <InvoiceCard key={option.id} option={option} />
        ))}
      </div>
    </div>
  )
}

export default InvoiceCreator

