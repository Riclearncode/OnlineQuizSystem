import { createContext, useContext, useMemo, useState } from 'react'
import api from '../api/client.js'

const AuthContext = createContext(null)
const storageKey = 'onlineQuizAuth'

function loadStoredAuth() {
  const raw = localStorage.getItem(storageKey)
  return raw ? JSON.parse(raw) : null
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth)

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload)
    setAuth(data)
    localStorage.setItem(storageKey, JSON.stringify(data))
    return data
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    setAuth(data)
    localStorage.setItem(storageKey, JSON.stringify(data))
    return data
  }

  function logout() {
    setAuth(null)
    localStorage.removeItem(storageKey)
  }

  const value = useMemo(() => ({
    token: auth?.token,
    user: auth ? {
      userId: auth.userId,
      fullName: auth.fullName,
      email: auth.email,
      role: auth.role,
    } : null,
    login,
    register,
    logout,
  }), [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
