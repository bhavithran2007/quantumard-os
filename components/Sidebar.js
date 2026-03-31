'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Sidebar() {
  const { userProfile, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fa-home', roles: ['admin', 'manager', 'employee', 'client'] },
    { name: 'Users', path: '/admin/users', icon: 'fa-users-cog', roles: ['admin'] },
    { name: 'Assignments', path: '/admin/assignments', icon: 'fa-user-friends', roles: ['admin'] },
    { name: 'Clients', path: '/manager/clients', icon: 'fa-user-tie', roles: ['manager'] },
    { name: 'Projects', path: '/projects', icon: 'fa-project-diagram', roles: ['admin', 'manager', 'employee'] },
    { name: 'Tasks', path: '/tasks', icon: 'fa-tasks', roles: ['admin', 'manager', 'employee'] },
    { name: 'Approvals', path: '/approvals', icon: 'fa-clipboard-check', roles: ['client', 'manager'] },
    { name: 'Profile', path: '/profile', icon: 'fa-user', roles: ['admin', 'manager', 'employee', 'client'] }
  ]

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userProfile?.role)
  )

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <div className="sidebar" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', background: 'rgba(19, 10, 34, 0.9)', backdropFilter: 'blur(24px)', borderRight: '1px solid var(--border)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div className="sidebar-logo" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>QUANTUMARD</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>OS</p>
        </div>

        {userProfile && (
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
              {userProfile.name?.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{userProfile.name}</h3>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(96, 165, 250, 0.1)', color: 'var(--blue)', textTransform: 'capitalize', display: 'inline-block' }}>
              {userProfile.role}
            </span>
          </div>
        )}

        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {filteredNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={pathname === item.path ? 'active' : ''}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: pathname === item.path ? 'linear-gradient(135deg, var(--orange), var(--pink))' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: pathname === item.path ? 'white' : 'var(--text)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '0.5rem',
                textAlign: 'left'
              }}
            >
              <i className={`fas ${item.icon}`} style={{ fontSize: '1.125rem', width: '20px' }}></i>
              {item.name}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '10px', color: 'var(--red)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}
        >
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .sidebar {
            left: -280px;
            transition: left 0.3s;
          }
        }
      `}</style>
    </>
  )
}