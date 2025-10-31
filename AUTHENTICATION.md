# Authentication System (Development Only)

## ⚠️ IMPORTANT: DEVELOPMENT ONLY

This authentication implementation is **for development purposes only** and should **NOT be used in production**.

## Current Implementation

### Backend (Go)

The backend provides a fake authentication endpoint using an OData Action:

- **Action**: `LoginWithEmail`
- **Method**: POST to `/LoginWithEmail`
- **Input**: `{ "email": "user@example.com" }`
- **Output**: JWT token containing employee ID and basic user info

**Key Points:**
- No password verification
- Finds employee by email address only
- Returns a JWT token signed with a hardcoded secret key
- Token expires after 24 hours
- Token contains: `employeeId`, `email`, `name`, `exp`, `iat`

**Files Modified:**
- `backend/cmd/server/main.go` - Added `LoginWithEmail` action and `registerDevAuthAction` function
- `backend/go.mod` - Added `github.com/golang-jwt/jwt/v5` dependency

### Frontend (React + TypeScript)

The frontend implements a login flow with:

- **Login Page** (`src/pages/Login.tsx`): Email-only login form
- **Auth Context** (`src/contexts/AuthContext.tsx`): Manages authentication state
- **Protected Routes** (`src/components/ProtectedRoute.tsx`): Route guard component
- **API Interceptors** (`src/lib/api.ts`): Adds JWT token to requests

**Key Features:**
- Stores JWT token in `localStorage`
- Automatically adds `Authorization: Bearer <token>` header to all API requests
- Redirects to login on 401 (Unauthorized) responses
- Shows user info in header (name and email)
- Logout button clears token and redirects to login

**Files Created/Modified:**
- `frontend/src/pages/Login.tsx` - Login page with email input
- `frontend/src/contexts/AuthContext.tsx` - Authentication context and hooks
- `frontend/src/components/ProtectedRoute.tsx` - Route protection wrapper
- `frontend/src/components/Layout.tsx` - Added user info and logout button
- `frontend/src/App.tsx` - Wrapped routes with AuthProvider and ProtectedRoute
- `frontend/src/lib/api.ts` - Added request/response interceptors for JWT

## How to Use (Development)

1. **Start the backend and frontend** (both should be running)

2. **Navigate to the login page**: http://localhost:3000/login

3. **Enter any employee email address** from the database:
   - Example: `admin@company.com`
   - No password required

4. **You'll be logged in** and redirected to the dashboard

5. **The JWT token is stored** in localStorage and sent with all API requests

6. **Logout** using the button in the top-right corner

## Sample Employee Emails

The seeded database includes these employee emails:
- `admin@company.com`
- Check the `Employees` table in the database for more

## Security Warnings

⚠️ **This implementation has NO security:**
- No password required
- Anyone can log in as any employee by knowing their email
- JWT secret is hardcoded in the source code
- No token refresh mechanism
- No proper session management
- No rate limiting or brute force protection

## Production Replacement Plan

### Recommended Authentication Providers

Replace this fake authentication with a proper provider:

1. **Auth0** - https://auth0.com/
   - Enterprise-grade authentication
   - Social login, MFA, SSO
   - Easy integration with Go and React

2. **Okta** - https://www.okta.com/
   - Enterprise identity management
   - SAML, OAuth 2.0, OpenID Connect
   - Advanced security features

3. **Azure Active Directory** - https://azure.microsoft.com/en-us/products/active-directory/
   - Microsoft ecosystem integration
   - Enterprise SSO
   - Conditional access policies

4. **AWS Cognito** - https://aws.amazon.com/cognito/
   - AWS-native solution
   - User pools and identity pools
   - Easy integration with AWS services

5. **Keycloak** - https://www.keycloak.org/
   - Open-source solution
   - Self-hosted option
   - Full-featured identity provider

### Migration Steps

When replacing with proper authentication:

1. **Choose authentication provider** from the list above

2. **Backend changes:**
   - Remove `LoginWithEmail` action from `cmd/server/main.go`
   - Remove JWT generation code
   - Add authentication middleware to verify tokens from provider
   - Update CORS settings for provider domains

3. **Frontend changes:**
   - Replace `Login.tsx` with provider's login flow
   - Update `AuthContext.tsx` to use provider's SDK
   - Remove fake login logic from `api.ts`
   - Add proper token refresh mechanism

4. **Testing:**
   - Test all authentication flows (login, logout, token refresh)
   - Verify protected routes work correctly
   - Test with multiple users and roles
   - Security audit and penetration testing

## Code Comments

All files related to fake authentication include comments:
- `// DEVELOPMENT ONLY:`
- `// TODO: Replace with proper authentication provider integration`

These comments help identify what needs to be replaced during production migration.

## Questions?

If you have questions about authentication or need help with the migration, please refer to:
- `Agents.md` - AI agent instructions for this project
- Authentication provider documentation
- Security best practices guides
