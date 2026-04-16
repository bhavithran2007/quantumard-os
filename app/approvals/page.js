'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

const STATUS_CONFIG = {
  pending:           { color: 'var(--orange)', bg: 'rgba(255,153,79,0.12)',  label: 'Pending Review',      icon: 'fa-clock' },
  approved:          { color: 'var(--green)',  bg: 'rgba(74,222,128,0.12)', label: 'Approved',             icon: 'fa-check-circle' },
  rejected:          { color: 'var(--red)',    bg: 'rgba(255,90,95,0.12)',  label: 'Rejected',             icon: 'fa-times-circle' },
  revision_requested:{ color: 'var(--blue)',   bg: 'rgba(96,165,250,0.12)', label: 'Revision Requested',   icon: 'fa-edit' }
}

const TYPE_CONFIG = {
  'ad-copy':      { color: 'var(--orange)', bg: 'rgba(255,153,79,0.1)',  label: 'Ad Copy' },
  'design':       { color: 'var(--purple)', bg: 'rgba(163,99,170,0.1)', label: 'Design' },
  'landing-page': { color: 'var(--blue)',   bg: 'rgba(96,165,250,0.1)', label: 'Landing Page' },
  'video':        { color: 'var(--pink)',   bg: 'rgba(250,109,134,0.1)', label: 'Video' },
  'copy':         { color: 'var(--gold)',   bg: 'rgba(255,215,0,0.1)',   label: 'Copy' }
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
  borderRadius: '10px', color: 'var(--text)', outline: 'none', fontSize: '0.9rem'
}

export default function ApprovalsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  const [approvals, setApprovals] = useState([])
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [rejectType, setRejectType] = useState('rejected') // 'rejected' | 'revision_requested'
  const [filterStatus, setFilterStatus] = useState('all')

  const [formData, setFormData] = useState({
    title: '', description: '', creativeType: 'ad-copy',
    driveUrl: '', clientId: '', notes: ''
  })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    else if (userProfile) {
      loadApprovals()
      if (userProfile.role === 'manager' || userProfile.role === 'admin') loadClients()
    }
  }, [user, userProfile, loading, router])

  const loadClients = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const filtered = userProfile.role === 'admin'
        ? all.filter(u => u.role === 'client')
        : all.filter(u => u.role === 'client' && u.assignedManager === user.uid)
      setClients(filtered)
    } catch { setClients([]) }
  }

  const loadApprovals = async () => {
    setDataLoading(true)
    try {
      let snap
      if (userProfile.role === 'client') {
        snap = await getDocs(query(collection(db, 'approvals'), where('clientId', '==', user.uid)))
      } else {
        snap = await getDocs(collection(db, 'approvals'))
      }
      let all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      if (userProfile.role === 'manager') {
        const usersSnap = await getDocs(collection(db, 'users'))
        const myClientIds = usersSnap.docs
          .filter(d => d.data().role === 'client' && d.data().assignedManager === user.uid)
          .map(d => d.id)
        all = all.filter(a => myClientIds.includes(a.clientId))
      }

      setApprovals(all)
    } catch (err) {
      console.error(err)
      setApprovals([])
    }
    setDataLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      // Find existing approvals for this client+title to determine version
      const existing = approvals.filter(a => a.clientId === formData.clientId && a.baseTitle === (formData.title))
      const version = existing.length + 1

      await addDoc(collection(db, 'approvals'), {
        ...formData,
        baseTitle: formData.title,
        title: version > 1 ? `${formData.title} (v${version})` : formData.title,
        version,
        createdBy: user.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        history: []
      })

      // Notify client
      if (formData.clientId) {
        await addDoc(collection(db, 'notifications'), {
          userId: formData.clientId, type: 'approval_submitted',
          message: `New creative submitted for your approval: ${formData.title}`,
          read: false, createdAt: new Date().toISOString()
        })
      }

      setShowCreateModal(false)
      setFormData({ title: '', description: '', creativeType: 'ad-copy', driveUrl: '', clientId: '', notes: '' })
      loadApprovals()
    } catch (err) { alert('Error: ' + err.message) }
  }

  const handleApprove = async (approvalId, approval) => {
    try {
      await updateDoc(doc(db, 'approvals', approvalId), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        history: [...(approval.history || []), { action: 'approved', at: new Date().toISOString(), by: user.uid }]
      })
      // Notify manager
      if (approval.createdBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: approval.createdBy, type: 'approval_approved',
          message: `"${approval.title}" was approved by the client!`,
          read: false, createdAt: new Date().toISOString()
        })
      }
      loadApprovals()
    } catch (err) { alert('Error: ' + err.message) }
  }

  const openRejectModal = (approval) => {
    setSelectedApproval(approval)
    setRejectFeedback('')
    setRejectType('rejected')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectFeedback.trim()) { alert('Please provide feedback'); return }
    try {
      await updateDoc(doc(db, 'approvals', selectedApproval.id), {
        status: rejectType,
        feedback: rejectFeedback,
        reviewedAt: new Date().toISOString(),
        history: [...(selectedApproval.history || []), {
          action: rejectType, feedback: rejectFeedback,
          at: new Date().toISOString(), by: user.uid
        }]
      })
      // Notify manager
      if (selectedApproval.createdBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: selectedApproval.createdBy, type: 'approval_rejected',
          message: `"${selectedApproval.title}" was ${rejectType === 'rejected' ? 'rejected' : 'sent for revision'} by the client.`,
          read: false, createdAt: new Date().toISOString()
        })
      }
      setShowRejectModal(false)
      setSelectedApproval(null)
      loadApprovals()
    } catch (err) { alert('Error: ' + err.message) }
  }

  if (loading || !userProfile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '64px', height: '64px', border: '4px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const filtered = filterStatus === 'all' ? approvals : approvals.filter(a => a.status === filterStatus)
  const canSubmit = userProfile.role === 'manager' || userProfile.role === 'admin'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, marginLeft: '280px' }}>
        <Topbar />
        <div style={{ padding: '2rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Approvals</h1>
              <p style={{ color: 'var(--text2)' }}>
                {userProfile.role === 'client' ? 'Review and approve creatives from your team' : 'Submit creatives for client approval'}
              </p>
            </div>
            {canSubmit && (
              <button onClick={() => setShowCreateModal(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-paper-plane"></i> Submit for Approval
              </button>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total', count: approvals.length, color: 'var(--text)', icon: 'fa-clipboard-list' },
              { label: 'Pending', count: approvals.filter(a => a.status === 'pending').length, color: 'var(--orange)', icon: 'fa-clock' },
              { label: 'Approved', count: approvals.filter(a => a.status === 'approved').length, color: 'var(--green)', icon: 'fa-check-circle' },
              { label: 'Needs Revision', count: approvals.filter(a => a.status === 'rejected' || a.status === 'revision_requested').length, color: 'var(--red)', icon: 'fa-exclamation-circle' }
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(19,10,34,0.6)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <i className={`fas ${stat.icon}`} style={{ fontSize: '1.5rem', color: stat.color }}></i>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.count}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected', 'revision_requested'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 16px', borderRadius: '20px', border: `1px solid ${filterStatus === s ? 'var(--orange)' : 'var(--border)'}`, background: filterStatus === s ? 'rgba(255,153,79,0.15)' : 'transparent', color: filterStatus === s ? 'var(--orange)' : 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>

          {/* Approvals list */}
          {dataLoading ? (
            <p style={{ color: 'var(--text2)' }}>Loading approvals...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(19,10,34,0.7)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <i className="fas fa-clipboard-check" style={{ fontSize: '4rem', color: 'var(--muted)', marginBottom: '1rem', display: 'block' }}></i>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No approvals found</h3>
              <p style={{ color: 'var(--text2)' }}>{canSubmit ? 'Submit your first creative for approval' : 'Approvals will appear here'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {filtered.map(approval => {
                const st = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending
                const tp = TYPE_CONFIG[approval.creativeType] || TYPE_CONFIG['ad-copy']
                const client = clients.find(c => c.id === approval.clientId)

                return (
                  <div key={approval.id} style={{ background: 'rgba(19,10,34,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${approval.status === 'pending' ? 'rgba(255,153,79,0.2)' : 'var(--border)'}`, borderRadius: '16px', padding: '1.5rem' }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{approval.title}</h3>
                          {approval.version > 1 && (
                            <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(163,99,170,0.15)', color: 'var(--purple)', border: '1px solid rgba(163,99,170,0.3)' }}>
                              v{approval.version}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: tp.bg, color: tp.color }}>
                            {tp.label}
                          </span>
                          {client && (
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text2)' }}>
                              <i className="fas fa-user-tie" style={{ marginRight: '4px' }}></i>{client.name}
                            </span>
                          )}
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {new Date(approval.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, background: st.bg, color: st.color, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <i className={`fas ${st.icon}`}></i> {st.label}
                      </span>
                    </div>

                    {approval.description && (
                      <p style={{ color: 'var(--text2)', marginBottom: '1rem', fontSize: '0.9rem' }}>{approval.description}</p>
                    )}

                    {/* Drive link */}
                    {approval.driveUrl && (
                      <a href={approval.driveUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '10px', color: 'var(--blue)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: '1rem', transition: 'all 0.2s' }}>
                        <i className="fab fa-google-drive" style={{ fontSize: '1rem' }}></i>
                        View on Google Drive
                        <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }}></i>
                      </a>
                    )}

                    {/* Feedback box */}
                    {approval.feedback && (
                      <div style={{ padding: '12px 16px', background: `${STATUS_CONFIG[approval.status]?.bg || 'rgba(255,90,95,0.08)'}`, border: `1px solid ${STATUS_CONFIG[approval.status]?.color || 'var(--red)'}`, borderRadius: '10px', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: STATUS_CONFIG[approval.status]?.color || 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <i className="fas fa-comment-dots" style={{ marginRight: '5px' }}></i>Client Feedback
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{approval.feedback}</p>
                      </div>
                    )}

                    {/* History */}
                    {approval.history && approval.history.length > 0 && (
                      <details style={{ marginBottom: '1rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, marginBottom: '0.5rem' }}>
                          <i className="fas fa-history" style={{ marginRight: '6px' }}></i>
                          View History ({approval.history.length} events)
                        </summary>
                        <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                          {approval.history.map((h, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.4rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{h.action}</span>
                              {h.feedback && ` — "${h.feedback}"`}
                              <span style={{ marginLeft: '0.5rem', color: 'var(--muted)' }}>
                                {new Date(h.at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Client action buttons */}
                    {userProfile.role === 'client' && approval.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button onClick={() => handleApprove(approval.id, approval)}
                          style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, var(--green), #3a9e60)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button onClick={() => { setRejectType('revision_requested'); openRejectModal(approval) }}
                          style={{ flex: 1, padding: '12px', background: 'rgba(96,165,250,0.1)', border: '1px solid var(--blue)', borderRadius: '10px', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <i className="fas fa-edit"></i> Request Revision
                        </button>
                        <button onClick={() => { setRejectType('rejected'); openRejectModal(approval) }}
                          style={{ flex: 1, padding: '12px', background: 'rgba(255,90,95,0.08)', border: '1px solid var(--red)', borderRadius: '10px', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </div>
                    )}

                    {/* Manager resubmit hint */}
                    {canSubmit && (approval.status === 'rejected' || approval.status === 'revision_requested') && (
                      <div style={{ marginTop: '0.75rem', padding: '10px 14px', background: 'rgba(255,153,79,0.05)', border: '1px dashed rgba(255,153,79,0.3)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--orange)' }}>
                        <i className="fas fa-lightbulb" style={{ marginRight: '6px' }}></i>
                        Address the feedback and submit a new version — it will be tracked as v{(approval.version || 1) + 1}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Approval Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'rgba(19,10,34,0.98)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Submit for Approval</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.5rem', cursor: 'pointer' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Client *</label>
                <select value={formData.clientId} onChange={e => setFormData(p => ({ ...p, clientId: e.target.value }))} required style={inputStyle}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Creative Type *</label>
                <select value={formData.creativeType} onChange={e => setFormData(p => ({ ...p, creativeType: e.target.value }))} style={inputStyle}>
                  <option value="ad-copy">Ad Copy</option>
                  <option value="design">Design</option>
                  <option value="landing-page">Landing Page</option>
                  <option value="video">Video</option>
                  <option value="copy">Copy / Script</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Facebook Ad — June Campaign" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows="2" placeholder="What is this creative for?" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  <i className="fab fa-google-drive" style={{ marginRight: '6px', color: 'var(--blue)' }}></i>
                  Google Drive Link *
                </label>
                <input type="url" value={formData.driveUrl} onChange={e => setFormData(p => ({ ...p, driveUrl: e.target.value }))} required placeholder="https://drive.google.com/..." style={inputStyle} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '4px' }}>
                  Make sure the Drive file/folder is shared with the client's email
                </p>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Notes for Client (optional)</label>
                <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows="2" placeholder="Any context or instructions for the client..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject / Revision Modal */}
      {showRejectModal && selectedApproval && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem' }}>
          <div style={{ background: 'rgba(19,10,34,0.98)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {rejectType === 'rejected' ? '❌ Reject Creative' : '✏️ Request Revision'}
            </h2>
            <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              "{selectedApproval.title}" — your feedback will be sent to the team
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Response Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { value: 'revision_requested', label: 'Request Revision', icon: 'fa-edit', color: 'var(--blue)' },
                  { value: 'rejected', label: 'Reject', icon: 'fa-times', color: 'var(--red)' }
                ].map(rt => (
                  <button key={rt.value} type="button" onClick={() => setRejectType(rt.value)}
                    style={{ flex: 1, padding: '10px', background: rejectType === rt.value ? `rgba(${rt.color === 'var(--blue)' ? '96,165,250' : '255,90,95'},0.15)` : 'transparent', border: `1px solid ${rejectType === rt.value ? rt.color : 'var(--border)'}`, borderRadius: '8px', color: rejectType === rt.value ? rt.color : 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                    <i className={`fas ${rt.icon}`} style={{ marginRight: '6px' }}></i>{rt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Your Feedback * <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(be specific)</span>
              </label>
              <textarea
                value={rejectFeedback}
                onChange={e => setRejectFeedback(e.target.value)}
                rows="4"
                placeholder={rejectType === 'revision_requested' ? 'e.g. Please change the headline to be more engaging, and use the brand colors...' : 'e.g. This does not meet our requirements because...'}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleReject} style={{ flex: 1, padding: '12px', background: rejectType === 'rejected' ? 'linear-gradient(135deg, var(--red), #c0392b)' : 'linear-gradient(135deg, var(--blue), #2980b9)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                <i className={`fas ${rejectType === 'rejected' ? 'fa-times' : 'fa-paper-plane'}`} style={{ marginRight: '8px' }}></i>
                {rejectType === 'rejected' ? 'Reject' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1024px) { .main-content { margin-left: 0 !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
