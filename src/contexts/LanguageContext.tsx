import { createContext, useContext, ReactNode, useState, useEffect } from 'react'

export type Language = 'ru' | 'en'

interface Translations {
  [key: string]: {
    ru: string
    en: string
  }
}

const translations: Translations = {
  // Auth Modal
  'login': { ru: 'Вход', en: 'Login' },
  'register': { ru: 'Регистрация', en: 'Register' },
  'nickname': { ru: 'Никнейм', en: 'Nickname' },
  'pin': { ru: 'PIN-код', en: 'PIN Code' },
  'pin_placeholder': { ru: '4 цифры', en: '4 digits' },
  'nickname_placeholder': { ru: 'Ваш никнейм (3-20 символов)', en: 'Your nickname (3-20 characters)' },
  'login_button': { ru: 'Войти', en: 'Login' },
  'register_button': { ru: 'Зарегистрироваться', en: 'Register' },
  'no_account': { ru: 'Нет аккаунта? Зарегистрироваться', en: 'No account? Register' },
  'have_account': { ru: 'Уже есть аккаунт? Войти', en: 'Already have account? Login' },
  'loading': { ru: 'Загрузка...', en: 'Loading...' },

  // Header
  'logout': { ru: 'Выйти', en: 'Logout' },
  'connect_wallet': { ru: 'ПОДКЛЮЧИТЬ КОШЕЛЕК', en: 'CONNECT WALLET' },
  'disconnect': { ru: 'Отключить', en: 'Disconnect' },

  // Invoice Creator
  'enter_nickname': { ru: 'Введите ваш ник', en: 'Enter your nickname' },
  'enter_amount': { ru: 'Введите сумму', en: 'Enter amount' },
  'select_network': { ru: 'Выберите сеть', en: 'Select network' },
  'select_crypto': { ru: 'Выберите криптовалюту', en: 'Select cryptocurrency' },
  'continue': { ru: 'Продолжить', en: 'Continue' },
  'cryptos_not_found': { ru: 'Криптовалюты не найдены', en: 'Cryptocurrencies not found' },

  // Invoice Payment
  'processing': { ru: 'OX processing', en: 'OX processing' },
  'send_to_wallet': { ru: 'Отправьте на адрес кошелька, скопировав его или отсканировав следующий QR код:', en: 'Send to the wallet address by copying it or scan the following QR code:' },
  'check_coin_ticker': { ru: 'Проверьте тикер монеты', en: 'Check coin ticker' },
  'check_total': { ru: 'Проверьте итоговую сумму в', en: 'Check the total in' },
  'send_amount_to': { ru: 'Отправьте указанную сумму на этот адрес кошелька', en: 'Send the above amount to this wallet address' },
  'commission_warning': { ru: 'Учитывайте комиссию за отправку!', en: 'Please take into account the commission for sending!' },
  'commission_text': { ru: 'Сумма указана без учета комиссии сервиса, который вы будете использовать для перевода. OXprocessing должен получить точную сумму, указанную в платежной форме. Если полученная сумма отличается даже на одну цифру, платеж может быть зачислен только через службу технической поддержки.', en: 'The amount is specified without the commission of the service you are going to use for the transfer. OXprocessing must receive the exact amount specified in the payment form. If the amount received differs even by one digit, the payment can be credited only through the technical support service.' },
  'pay_with_web3': { ru: 'Или оплатите с Web3 кошельком', en: 'Or pay with Web3 wallet' },
  'connect_metamask': { ru: 'Подключить MetaMask', en: 'Connect MetaMask' },
  'walletconnect': { ru: 'WalletConnect', en: 'WalletConnect' },
  'attention': { ru: 'Внимание!', en: 'Attention!' },
  'confirmation_text': { ru: 'После отправки криптовалюты дождитесь 3 подтверждений транзакции, после чего средства будут зачислены на ваш счет.', en: 'After sending cryptocurrency, wait for 3 confirmation of the transaction, after which the funds will be credited to your account.' },
  'back': { ru: 'Назад', en: 'Back' },

  // Dashboard
  'welcome': { ru: 'Добро пожаловать', en: 'Welcome' },
  'create_invoice': { ru: 'Создать счет', en: 'Create Invoice' },
  'my_invoices': { ru: 'Мои счета', en: 'My Invoices' },
  'no_invoices': { ru: 'Счетов пока нет', en: 'No invoices yet' },

  // Common
  'cancel': { ru: 'Отмена', en: 'Cancel' },
  'save': { ru: 'Сохранить', en: 'Save' },
  'delete': { ru: 'Удалить', en: 'Delete' },
  'edit': { ru: 'Редактировать', en: 'Edit' },
  'yes': { ru: 'Да', en: 'Yes' },
  'no': { ru: 'Нет', en: 'No' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru')

  useEffect(() => {
    // Load language from localStorage
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'ru' || saved === 'en')) {
      setLanguage(saved)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const translation = translations[key]
    return translation ? translation[language] : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}