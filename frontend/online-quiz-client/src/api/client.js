import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5043/api'
export const AUTH_STORAGE_KEY = 'onlineQuizAuth'
export const AUTH_CHANGED_EVENT = 'onlineQuizAuthChanged'

const api = axios.create({
  baseURL: API_BASE_URL,
})

function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (stored) {
    try {
      const auth = JSON.parse(stored)
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
      }
    } catch {
      clearStoredAuth()
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredAuth()
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong.'
}

export default api
