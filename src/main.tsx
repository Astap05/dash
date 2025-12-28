import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Глобальный обработчик ошибок для подавления ошибок от других кошельков
window.addEventListener('unhandledrejection', (event) => {
  // Игнорируем ошибки от других кошельков (TronLink и т.д.), которые пытаются подключиться к MetaMask
  const errorMessage = event.reason?.message || event.reason?.toString() || ''
  const errorStack = event.reason?.stack || ''
  
  if (
    errorMessage.includes('MetaMask extension not found') ||
    errorMessage.includes('Failed to connect to MetaMask') ||
    errorStack.includes('inpage.js')
  ) {
    // Тихо игнорируем эти ошибки, так как они не относятся к нашему приложению
    event.preventDefault()
    return
  }
})

// Также обрабатываем обычные ошибки
window.addEventListener('error', (event) => {
  const errorMessage = event.message || ''
  const errorSource = event.filename || ''
  
  if (
    errorMessage.includes('MetaMask extension not found') ||
    errorMessage.includes('Failed to connect to MetaMask') ||
    errorSource.includes('inpage.js')
  ) {
    // Тихо игнорируем эти ошибки
    event.preventDefault()
    return
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

