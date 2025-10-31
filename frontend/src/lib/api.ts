import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'OData-Version': '4.0',
  },
})

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle OData responses
api.interceptors.response.use(
  (response) => {
    // OData returns data in a "value" property for collections
    if (response.data && 'value' in response.data) {
      return {
        ...response,
        data: {
          items: response.data.value,
          count: response.data['@odata.count'],
        },
      }
    }
    return response
  },
  (error) => {
    // If we get a 401 (Unauthorized), the token might be invalid
    // Redirect to login page
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
