'use client'

export const dynamic = 'force-dynamic'  // Add this line

import { useEffect, useState } from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function ApprovalsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [approvals, setApprovals] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creativeType: 'ad-copy',
    driveUrl: '',
    clientId: ''
  })
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (userProfile) {
      loadApprovals()
      if (userProfile.role === 'manager') {
        loadClients()
      }
    }
  }, [user, userProfile, loading, router])

  const loadClients = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const assignedClients = allUsers.filter(u => 
        u.role === 'client' && u.assignedManager === user.uid
      )
      setClients(assignedClients)
    } catch (error) {
      setClients([])
    }
  }

  const loadApprovals = async () => {
    try {
      setDataLoading(true)
      let approvalsQuery
      
      if (userProfile.role === 'client') {
        approvalsQuery = query(
          collection(db, 'approvals'),
          where('clientId', '==', user.uid)
        )
      } else if (userProfile.role === 'manager') {
        // Get all approvals for manager's clients
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const managerClients = usersSnapshot.docs
          .filter(doc => doc.data().role === 'client' && doc.data().assignedManager === user.uid)
          .map(doc => doc.id)
        
        approvalsQuery = collection(db, 'approvals')
      } else {
        approvalsQuery = collection(db, 'approvals')
      }

      const snapshot = await getDocs(approvalsQuery)
      const approvalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Filter manager's client approvals
      if (userProfile.role === 'manager') {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const managerClientIds = usersSnapshot.docs
          .filter(doc => doc.data().role === 'client' && doc.data().assignedManager === user.uid)
          .map(doc => doc.id)
        
        setApprovals(approvalsData.filter(a => managerClientIds.includes(a.clientId)))
      } else {
        setApprovals(approvalsData)
      }
    } catch (error) {
      console.error('Error loading approvals:', error)
      setApprovals([])
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, 'approvals'), {
        ...formData,
        createdBy: user.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      })

      setShowModal(false)
      setFormData({ title: '', description: '', creativeType: 'ad-copy', driveUrl: '', clientId: '' })
      loadApprovals()
    } catch (error) {
      alert('Error creating approval: ' + error.message)
    }
  }

  const handleApprove = async (approvalId) => {
    try {
      await updateDoc(doc(db, 'approvals', approvalId), {
        status: 'approved',
        reviewedAt: new Date().toISOString()
      })
      loadApprovals()
    } catch (error) {
      alert('Error approving: ' + error.message)
    }
  }

  const handleReject = async (approvalId, feedback) => {
    try {
      const feedbackText = prompt('Rejection reason:')
      if (!feedbackText) return

      await updateDoc(doc(db, 'approvals', approvalId), {
        status: 'rejected',
        feedback: feedbackText,
        reviewedAt: new Date().toISOString()
      })
      loadApprovals()
    } catch (error) {
      alert('Error rejecting: ' + error.message)
    }
  }

  if (loading || !userProfile) {
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Approvals</h1>
              <p style={{ color: 'var(--text2)' }}>
                {userProfile.role === 'client' ? 'Review and approve creatives' : 'Submit creatives for client approval'}
              </p>
            </div>
            {userProfile.role === 'manager' && (
              <button
                onClick={() => setShowModal(true)}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-plus"></i> Submit for Approval
              </button>
            )}
          </div>

          {dataLoading ? (
            <p style={{ color: 'var(--text2)' }}>Loading approvals...</p>
          ) : approvals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(19, 10, 34, 0.7)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <i className="fas fa-clipboard-check" style={{ fontSize: '4rem', color: 'var(--muted)', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No approvals yet</h3>
              <p style={{ color: 'var(--text2)' }}>
                {userProfile.role === 'client' ? 'Approvals will appear here' : 'Submit your first creative for approval'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {approvals.map(approval => (
                <div key={approval.id} style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{approval.title}</h3>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: approval.creativeType === 'ad-copy' ? 'rgba(255, 153, 79, 0.1)' : approval.creativeType === 'design' ? 'rgba(163, 99, 170, 0.1)' : 'rgba(96, 165, 250, 0.1)', color: approval.creativeType === 'ad-copy' ? 'var(--orange)' : approval.creativeType === 'design' ? 'var(--purple)' : 'var(--blue)', textTransform: 'capitalize', display: 'inline-block' }}>
                        {approval.creativeType.replace('-', ' ')}
                      </span>
                    </div>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600', background: approval.status === 'approved' ? 'rgba(74, 222, 128, 0.1)' : approval.status === 'rejected' ? 'rgba(255, 90, 95, 0.1)' : 'rgba(255, 153, 79, 0.1)', color: approval.status === 'approved' ? 'var(--green)' : approval.status === 'rejected' ? 'var(--red)' : 'var(--orange)', textTransform: 'capitalize' }}>
                      {approval.status}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text2)', marginBottom: '1rem' }}>{approval.description}</p>

                  {approval.driveUrl && (
                    <a
                      href={approval.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid var(--blue)', borderRadius: '8px', color: 'var(--blue)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: '1rem' }}
                    >
                      <i className="fas fa-external-link-alt"></i> View Creative
                    </a>
                  )}

                  {approval.feedback && (
                    <div style={{ padding: '12px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '10px', marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--red)' }}>Feedback:</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{approval.feedback}</p>
                    </div>
                  )}

                  {userProfile.role === 'client' && approval.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => handleApprove(approval.id)}
                        style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, var(--green), #3a9e60)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        style={{ flex: 1, padding: '10px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Approval Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'rgba(19, 10, 34, 0.95)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '600px', width: '100%' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Submit for Approval</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                >
                  <option value="">Select client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name} ({client.company})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Creative Type *</label>
                <select
                  value={formData.creativeType}
                  onChange={(e) => setFormData({ ...formData, creativeType: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                >
                  <option value="ad-copy">Ad Copy</option>
                  <option value="design">Design</option>
                  <option value="landing-page">Landing Page</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Drive URL *</label>
                <input
                  type="url"
                  value={formData.driveUrl}
                  onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                  required
                  placeholder="https://drive.google.com/..."
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
