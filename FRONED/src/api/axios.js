import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// 每次请求自动带上 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
