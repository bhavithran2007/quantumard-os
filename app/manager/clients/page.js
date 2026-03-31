'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function ManagerClientsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'manager')) {
      router.push('/dashboard')
    } else if (user && userProfile) {
      loadClients()
    }
  }, [user, userProfile, loading, router])

  const loadClients = async () => {
    try {
      setDataLoading(true)
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Filter clients assigned to this manager
      const assignedClients = allUsers.filter(u => 
        u.role === 'client' && u.assignedManager === user.uid
      )
      
      // Get employees for each client
      const clientsWithTeam = assignedClients.map(client => {
        const employees = (client.assignedEmployees || []).map(empId => 
          allUsers.find(u => u.uid === empId)
        ).filter(Boolean)
        return { ...client, employees }
      })
      
      setClients(clientsWithTeam)
    } catch (error) {
      console.error('Error loading clients:', error)
      // Demo fallback
      setClients([])
    } finally {
      setDataLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text2)]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, marginLeft: '280px' }}>
        <Topbar />
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>My Clients</h1>
            <p style={{ color: 'var(--text2)' }}>Manage your assigned clients and their teams</p>
          </div>

          {dataLoading ? (
            <p style={{ color: 'var(--text2)' }}>Loading clients...</p>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(19, 10, 34, 0.7)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <i className="fas fa-user-tie" style={{ fontSize: '4rem', color: 'var(--muted)', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No clients assigned yet</h3>
              <p style={{ color: 'var(--text2)' }}>Ask your admin to assign clients to you</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {clients.map(client => (
                <div key={client.id} style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                  {/* Client Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{client.name}</h3>
                      <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{client.company || 'No company'}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--text2)', fontSize: '0.875rem' }}>
                      <i className="fas fa-envelope" style={{ width: '16px' }}></i>
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: 'var(--text2)', fontSize: '0.875rem' }}>
                        <i className="fas fa-phone" style={{ width: '16px' }}></i>
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.industry && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2)', fontSize: '0.875rem' }}>
                        <i className="fas fa-industry" style={{ width: '16px' }}></i>
                        <span>{client.industry}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Team */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text2)' }}>ASSIGNED TEAM</h4>
                    {client.employees.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {client.employees.map(emp => (
                          <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid var(--blue)', borderRadius: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                              {emp.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 600 }}>{emp.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No employees assigned</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => router.push(`/projects?clientId=${client.id}`)}
                      style={{ flex: 1, padding: '10px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid var(--blue)', borderRadius: '8px', color: 'var(--blue)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <i className="fas fa-project-diagram" style={{ marginRight: '6px' }}></i>
                      Projects
                    </button>
                    <button
                      onClick={() => router.push(`/tasks?clientId=${client.id}`)}
                      style={{ flex: 1, padding: '10px', background: 'rgba(163, 99, 170, 0.1)', border: '1px solid var(--purple)', borderRadius: '8px', color: 'var(--purple)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <i className="fas fa-tasks" style={{ marginRight: '6px' }}></i>
                      Tasks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}