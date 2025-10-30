import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'OData-Version': '4.0',
  },
})

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
    return Promise.reject(error)
  }
)

export default api
