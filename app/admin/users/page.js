'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function AdminUsersPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee',
    phone: '',
    bio: '',
    company: '',
    industry: ''
  })

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'admin')) {
      router.push('/dashboard')
    } else if (user) {
      loadUsers()
    }
  }, [user, userProfile, loading, router])

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      // Demo fallback
      const demoUsers = [
        { id: 'demo-admin', email: 'admin@quantumard.com', name: 'Admin User', role: 'admin' },
        { id: 'demo-manager', email: 'manager@quantumard.com', name: 'Deepak Singh', role: 'manager' },
        { id: 'demo-employee', email: 'employee@quantumard.com', name: 'Arjun Developer', role: 'employee' },
        { id: 'demo-client', email: 'client@quantumard.com', name: 'Rajesh Kumar', role: 'client', company: 'TechLearn' }
      ]
      setUsers(demoUsers)
      setFilteredUsers(demoUsers)
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    if (newFilter === 'all') {
      setFilteredUsers(users)
    } else {
      setFilteredUsers(users.filter(u => u.role === newFilter))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        // Update existing user
        await updateDoc(doc(db, 'users', editingUser.id), {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          bio: formData.bio,
          ...(formData.company && { company: formData.company }),
          ...(formData.industry && { industry: formData.industry })
        })
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          bio: formData.bio,
          ...(formData.company && { company: formData.company }),
          ...(formData.industry && { industry: formData.industry }),
          createdAt: new Date().toISOString(),
          status: 'active',
          ...(formData.role === 'client' && { onboardingComplete: false })
        })
      }
      
      setShowModal(false)
      setEditingUser(null)
      setFormData({ email: '', password: '', name: '', role: 'employee', phone: '', bio: '', company: '', industry: '' })
      loadUsers()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      bio: user.bio || '',
      company: user.company || '',
      industry: user.industry || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId))
        loadUsers()
      } catch (error) {
        alert('Error deleting user')
      }
    }
  }

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"w-16 h-16 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4\"></div>
          <p className=\"text-[var(--text2)]\">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=\"dashboard-wrapper\" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <div className=\"main-content\" style={{ flex: 1, marginLeft: '280px' }}>
        <Topbar />
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Management</h1>
              <p style={{ color: 'var(--text2)' }}>Manage all users, clients, managers, and employees</p>
            </div>
            <button
              onClick={() => { setShowModal(true); setEditingUser(null); setFormData({ email: '', password: '', name: '', role: 'employee', phone: '', bio: '', company: '', industry: '' }); }}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className=\"fas fa-plus\"></i> Create User
            </button>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {['all', 'client', 'manager', 'employee', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => handleFilterChange(role)}
                style={{
                  padding: '10px 20px',
                  background: filter === role ? 'linear-gradient(135deg, var(--orange), var(--pink))' : 'rgba(255, 255, 255, .05)',
                  border: '1px solid ' + (filter === role ? 'transparent' : 'var(--border)'),
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {role} ({role === 'all' ? users.length : users.filter(u => u.role === role).length})
              </button>
            ))}
          </div>

          {/* Users Table */}
          <div style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Company</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{user.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text2)' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: user.role === 'admin' ? 'rgba(255, 90, 95, 0.1)' : user.role === 'manager' ? 'rgba(96, 165, 250, 0.1)' : user.role === 'client' ? 'rgba(255, 153, 79, 0.1)' : 'rgba(163, 99, 170, 0.1)', color: user.role === 'admin' ? 'var(--red)' : user.role === 'manager' ? 'var(--blue)' : user.role === 'client' ? 'var(--orange)' : 'var(--purple)', textTransform: 'capitalize' }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text2)' }}>{user.company || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(user)}
                          style={{ padding: '8px 16px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid var(--blue)', borderRadius: '8px', color: 'var(--blue)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <i className=\"fas fa-edit\"></i> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          style={{ padding: '8px 16px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <i className=\"fas fa-trash\"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'rgba(19, 10, 34, 0.95)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Name *</label>
                  <input
                    type=\"text\"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email *</label>
                  <input
                    type=\"email\"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  />
                </div>
                
                {!editingUser && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Password *</label>
                    <input
                      type=\"password\"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                    />
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  >
                    <option value=\"employee\">Employee</option>
                    <option value=\"manager\">Manager</option>
                    <option value=\"client\">Client</option>
                    <option value=\"admin\">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Phone</label>
                  <input
                    type=\"tel\"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  />
                </div>
                
                {formData.role === 'client' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Company</label>
                      <input
                        type=\"text\"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Industry</label>
                      <input
                        type=\"text\"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                      />
                    </div>
                  </>
                )}
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows=\"3\"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', resize: 'vertical' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type=\"button\"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type=\"submit\"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingUser ? 'Update User' : 'Create User'}
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
          table {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}
