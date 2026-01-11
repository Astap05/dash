// Простая система авторизации с использованием localStorage
// В продакшене нужно использовать backend API

export interface User {
  id: string
  nickname: string
  email?: string
  walletAddress: string | null
  createdAt: string
}

const STORAGE_KEY = 'staking_dashboard_user'
const STORAGE_SESSION_KEY = 'staking_dashboard_session'

// Простое хэширование PIN для демо (в продакшене использовать bcrypt)
function hashPin(pin: string): string {
  // Для демо используем простой хэш, в реальности - bcrypt или argon2
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

// Валидация PIN: ровно 4 цифры
function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

// Валидация nickname: 3-20 символов, буквы/цифры/подчеркивание
function validateNickname(nickname: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(nickname)
}

export function register(nickname: string, pin: string): Promise<User> {
  return new Promise((resolve, reject) => {
    // Валидация входных данных
    if (!validateNickname(nickname)) {
      reject(new Error('Никнейм должен содержать 3-20 символов (буквы, цифры, подчеркивание)'))
      return
    }

    if (!validatePin(pin)) {
      reject(new Error('PIN должен состоять ровно из 4 цифр'))
      return
    }

    // Проверяем, не зарегистрирован ли уже этот nickname
    const existingUsers = getStoredUsers()
    if (existingUsers.find((u: any) => u.nickname && u.nickname.toLowerCase() === nickname.toLowerCase())) {
      reject(new Error('Пользователь с таким никнеймом уже зарегистрирован'))
      return
    }

    // Создаем нового пользователя
    const user: User = {
      id: generateId(),
      nickname,
      walletAddress: null,
      createdAt: new Date().toISOString(),
    }

    // Сохраняем хэшированный PIN
    const userData = {
      ...user,
      pinHash: hashPin(pin),
    }

    // Сохраняем пользователя
    existingUsers.push(userData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingUsers))

    // Автоматически авторизуем
    setSession(user.id)

    resolve(user)
  })
}

export function login(nickname: string, pin: string): Promise<User> {
  return new Promise((resolve, reject) => {
    // Валидация входных данных
    if (!validateNickname(nickname)) {
      reject(new Error('Неверный формат никнейма'))
      return
    }

    if (!validatePin(pin)) {
      reject(new Error('PIN должен состоять из 4 цифр'))
      return
    }

    const users = getStoredUsers()
    const user = users.find(
      (u: any) => u.nickname && u.nickname.toLowerCase() === nickname.toLowerCase() && u.pinHash === hashPin(pin)
    )

    if (!user) {
      reject(new Error('Неверный никнейм или PIN'))
      return
    }

    // Удаляем pinHash из объекта перед возвратом
    const { pinHash: _, ...userWithoutPin } = user
    setSession(user.id)

    resolve(userWithoutPin as User)
  })
}

export function logout(): void {
  localStorage.removeItem(STORAGE_SESSION_KEY)
  localStorage.removeItem('walletAddress')
}

export function getCurrentUser(): User | null {
  const sessionId = localStorage.getItem(STORAGE_SESSION_KEY)
  if (!sessionId) return null

  const users = getStoredUsers()
  const user = users.find((u: any) => u.id === sessionId)
  if (!user) return null

  const { pinHash: _, ...userWithoutPin } = user
  return userWithoutPin as User
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_SESSION_KEY)
}

export function updateUserWallet(address: string | null): void {
  const user = getCurrentUser()
  if (!user) return

  const users = getStoredUsers()
  const userIndex = users.findIndex((u: any) => u.id === user.id)
  if (userIndex === -1) return

  users[userIndex].walletAddress = address
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

function getStoredUsers(): any[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setSession(userId: string): void {
  localStorage.setItem(STORAGE_SESSION_KEY, userId)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

