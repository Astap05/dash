// Простая система авторизации с использованием localStorage
// В продакшене нужно использовать backend API

export interface User {
  id: string
  email: string
  walletAddress: string | null
  createdAt: string
}

const STORAGE_KEY = 'staking_dashboard_user'
const STORAGE_SESSION_KEY = 'staking_dashboard_session'

export function register(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    // Проверяем, не зарегистрирован ли уже этот email
    const existingUsers = getStoredUsers()
    if (existingUsers.find((u) => u.email === email)) {
      reject(new Error('Пользователь с таким email уже зарегистрирован'))
      return
    }

    // Создаем нового пользователя
    const user: User = {
      id: generateId(),
      email,
      walletAddress: null,
      createdAt: new Date().toISOString(),
    }

    // Сохраняем пароль (в продакшене НЕ ДЕЛАЙТЕ ТАК! Используйте хеширование на backend)
    const userData = {
      ...user,
      password, // ВРЕМЕННО для демо, в продакшене удалить!
    }

    // Сохраняем пользователя
    existingUsers.push(userData as any)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingUsers))

    // Автоматически авторизуем
    setSession(user.id)

    resolve(user)
  })
}

export function login(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    const users = getStoredUsers()
    const user = users.find(
      (u: any) => u.email === email && u.password === password
    )

    if (!user) {
      reject(new Error('Неверный email или пароль'))
      return
    }

    // Удаляем пароль из объекта перед возвратом
    const { password: _, ...userWithoutPassword } = user
    setSession(user.id)

    resolve(userWithoutPassword as User)
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

  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as User
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

