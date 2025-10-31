import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Accounts', href: '/accounts' },
    { name: 'Contacts', href: '/contacts' },
    { name: 'Activities', href: '/activities' },
    { name: 'Issues', href: '/issues' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Opportunities', href: '/opportunities' },
    { name: 'Employees', href: '/employees' },
    { name: 'Products', href: '/products' },
  ]

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Hamburger menu button */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo - now clickable */}
            <Link to="/">
              <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                CRM System
              </h1>
            </Link>

            {/* User info and logout - right side */}
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">({user?.email})</span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay - left side */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/50 dark:bg-gray-950/70 z-40 transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <nav className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Sidebar header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                <Link 
                  to="/"
                  onClick={closeMobileMenu}
                  className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  CRM System
                </Link>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation links */}
              <div className="flex-1 px-4 py-4 overflow-y-auto">
                <div className="flex flex-col space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
