import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000
})

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 402) {
      return Promise.reject({
        type: 'INSUFFICIENT_CREDIT',
        required: error.response.data?.data?.required,
        balance: error.response.data?.data?.balance
      })
    }
    return Promise.reject(error)
  }
)

export default client
