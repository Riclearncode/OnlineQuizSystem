import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { AUTH_CHANGED_EVENT, AUTH_STORAGE_KEY } from '../api/client.js'

const AuthContext = createContext(null)

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? Date.now() >= payload.exp * 1000 : false
  } catch {
    return true
  }
}

function loadStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const auth = JSON.parse(raw)
    if (!auth?.token || isTokenExpired(auth.token)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return auth
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth)

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload)
    setAuth(data)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
    return data
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    setAuth(data)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
    return data
  }

  function logout() {
    setAuth(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  useEffect(() => {
    function syncStoredAuth() {
      setAuth(loadStoredAuth())
    }

    window.addEventListener(AUTH_CHANGED_EVENT, syncStoredAuth)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncStoredAuth)
  }, [])

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
