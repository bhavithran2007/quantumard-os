'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, user, userProfile } = useAuth()

  useEffect(() => {
    if (user && userProfile) {
      router.push('/dashboard')
    }
  }, [user, userProfile, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div className="login-container" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="login-wrapper" style={{ width: '100%', maxWidth: '1000px' }}>
        <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          {/* Hero Section */}
          <div className="login-left" style={{ animation: 'slideInLeft 0.6s ease' }}>
            <div className="hero-section">
              <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem' }}>
                Unified Operating System for Agencies
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                Connect your clients, managers, and team in one intelligent platform. Complete visibility. Full automation. Real-time collaboration.
              </p>
              <div className="feature-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="feature-item" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div className="feature-icon" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-tasks" style={{ color: 'white', fontSize: '18px' }}></i>
                  </div>
                  <div className="feature-text">
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>Project Management</h4>
                    <p style={{ color: 'var(--text2)', fontSize: '0.875rem', lineHeight: 1.5 }}>Organize projects and assign tasks efficiently</p>
                  </div>
                </div>
                <div className="feature-item" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div className="feature-icon" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-sync-alt" style={{ color: 'white', fontSize: '18px' }}></i>
                  </div>
                  <div className="feature-text">
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>Real-Time Sync</h4>
                    <p style={{ color: 'var(--text2)', fontSize: '0.875rem', lineHeight: 1.5 }}>All changes propagate instantly across platform</p>
                  </div>
                </div>
                <div className="feature-item" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div className="feature-icon" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-user-shield" style={{ color: 'white', fontSize: '18px' }}></i>
                  </div>
                  <div className="feature-text">
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>Role-Based Access</h4>
                    <p style={{ color: 'var(--text2)', fontSize: '0.875rem', lineHeight: 1.5 }}>Admin, Manager, Employee - tailored views</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Box */}
          <div className="login-right" style={{ animation: 'slideIn 0.6s ease 0.2s both' }}>
            <div className="login-box" style={{ background: 'rgba(19, 10, 34, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
              <div className="login-logo" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>QUANTUMARD</h2>
                <p style={{ color: 'var(--text2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Operating System</p>
              </div>

              {error && (
                <div className="error-msg" style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: 'var(--text)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                    <i className="fas fa-envelope" style={{ marginRight: '6px' }}></i>Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px 18px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontFamily: 'var(--fb)', fontSize: '1rem', transition: 'all 0.3s' }}
                    placeholder="Enter Your Email Address"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', color: 'var(--text)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                    <i className="fas fa-lock" style={{ marginRight: '6px' }}></i>Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px 18px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontFamily: 'var(--fb)', fontSize: '1rem', transition: 'all 0.3s' }}
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn"
                  style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontFamily: 'var(--fh)', fontWeight: 700, fontSize: '1.125rem', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Logging in...</>
                  ) : (
                    <><i className="fas fa-arrow-right"></i> Enter Platform</>
                  )}
                </button>
              </form>

              
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .login-grid {
            grid-template-columns: 1fr !important;
          }
          .login-left {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .login-box {
            padding: 30px !important;
          }
          .user-buttons {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
