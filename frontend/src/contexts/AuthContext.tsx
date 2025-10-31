import { createContext, useContext, useState, ReactNode } from 'react'
import api from '../lib/api'

/**
 * DEVELOPMENT ONLY: Fake Authentication Context
 * 
 * This authentication implementation is for development purposes only.
 * It uses a simple email-based login without password verification.
 * 
 * TODO: Replace with proper authentication provider integration:
 * - Auth0
 * - Okta
 * - Azure AD
 * - AWS Cognito
 * - Or similar enterprise authentication service
 */

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Load token and user from localStorage on mount (initialize state from localStorage)
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken')
  })
  
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('authUser')
    return storedUser ? JSON.parse(storedUser) : null
  })
  
  const isLoading = false // No loading state since we initialize from localStorage

  // DEVELOPMENT ONLY: Fake login using email only
  const login = async (email: string) => {
    try {
      // Call the fake authentication action
      const response = await api.post('/LoginWithEmail', { email })
      
      const { token: authToken, user: userData } = response.data

      // Store in state and localStorage
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('authToken', authToken)
      localStorage.setItem('authUser', JSON.stringify(userData))
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
