'use client'

import { useAuth } from '@/context/AuthContext'

export default function Topbar() {
  const { userProfile } = useAuth()

  return (
    <div className="top-bar" style={{ background: 'rgba(19, 10, 34, 0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Welcome back, {userProfile?.name}!</h3>
        <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
          {userProfile?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  )
}