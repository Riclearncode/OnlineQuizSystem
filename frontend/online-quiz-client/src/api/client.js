import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5043/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('onlineQuizAuth')
  if (stored) {
    const auth = JSON.parse(stored)
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
  }

  return config
})

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong.'
}

export default api
