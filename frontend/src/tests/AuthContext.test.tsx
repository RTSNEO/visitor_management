import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import axios from 'axios'

// Mock axios
vi.mock('axios')

const TestComponent = () => {
  const { user, token, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>No user</div>
  
  return (
    <div>
      <div data-testid="username">{user.username}</div>
      <div data-testid="role">{user.role}</div>
      <div data-testid="token">{token}</div>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should render children', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Child Component</div>
      </AuthProvider>
    )
    
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should initialize with no user when localStorage is empty', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument()
    })
  })

  it('should fetch user from API when token exists in localStorage', async () => {
    const mockUser = { username: 'testuser', role: 'operator' }
    localStorage.setItem('token', 'fake-token')
    
    ;(axios.get as any).mockResolvedValueOnce({ data: mockUser })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
      expect(screen.getByTestId('role')).toHaveTextContent('operator')
    })
  })

  it('should handle API errors gracefully', async () => {
    localStorage.setItem('token', 'invalid-token')
    
    ;(axios.get as any).mockRejectedValueOnce(new Error('Unauthorized'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  it('should set loading state correctly', async () => {
    const mockUser = { username: 'testuser', role: 'admin' }
    localStorage.setItem('token', 'fake-token')
    
    ;(axios.get as any).mockResolvedValueOnce({ data: mockUser })

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('should set axios authorization header when token is available', async () => {
    const mockUser = { username: 'testuser', role: 'operator' }
    const token = 'test-token-123'
    localStorage.setItem('token', token)
    
    ;(axios.get as any).mockResolvedValueOnce({ data: mockUser })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`)
    })
  })

  it('should remove authorization header on logout', async () => {
    localStorage.setItem('token', 'test-token')
    const mockUser = { username: 'testuser', role: 'operator' }
    
    ;(axios.get as any).mockRejectedValueOnce(new Error('Unauthorized'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(delete axios.defaults.headers.common['Authorization']).toBe(true)
    })
  })
})

describe('useAuth Hook', () => {
  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
