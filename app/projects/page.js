'use client'


export const dynamic = 'force-dynamic'  // Add this line

import { useEffect, useState } from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function ProjectsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    managerId: '',
    assignedEmployees: []
  })
  const [employees, setEmployees] = useState([])
  const [managers, setManagers] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userProfile) {
      loadProjects()
      if (userProfile.role === 'admin') {
        loadUsers()
      }
    }
  }, [userProfile])

  const loadProjects = async () => {
    try {
      setDataLoading(true)
      let projectsQuery

      if (userProfile.role === 'admin') {
        projectsQuery = query(collection(db, 'projects'))
      } else if (userProfile.role === 'manager') {
        projectsQuery = query(
          collection(db, 'projects'),
          where('managerId', '==', user.uid)
        )
      } else {
        projectsQuery = query(
          collection(db, 'projects'),
          where('assignedEmployees', 'array-contains', user.uid)
        )
      }

      const snapshot = await getDocs(projectsQuery)
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'))
      const snapshot = await getDocs(usersQuery)
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setManagers(users.filter(u => u.role === 'manager'))
      setEmployees(users.filter(u => u.role === 'employee'))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const projectData = {
        ...formData,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'projects'), projectData)
      
      setShowModal(false)
      setFormData({ name: '', managerId: '', assignedEmployees: [] })
      loadProjects()

      // Create notification
      if (formData.managerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: formData.managerId,
          message: `You have been assigned as manager for project: ${formData.name}`,
          read: false,
          createdAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleDelete = async (projectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', projectId))
        loadProjects()
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const toggleEmployee = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter(id => id !== employeeId)
        : [...prev.assignedEmployees, employeeId]
    }))
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
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Projects</h1>
              <p style={{ color: 'var(--text2)' }}>Manage your projects</p>
            </div>
            {userProfile.role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-plus"></i> Create Project
              </button>
            )}
          </div>

          {dataLoading ? (
            <p style={{ color: 'var(--text2)' }}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(19, 10, 34, 0.7)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <i className="fas fa-project-diagram" style={{ fontSize: '4rem', color: 'var(--muted)', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No projects yet</h3>
              <p style={{ color: 'var(--text2)' }}>Create your first project to get started</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {projects.map(project => (
                <div key={project.id} style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{project.name}</h3>
                    {userProfile.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        style={{ padding: '8px 12px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2)', fontSize: '0.875rem' }}>
                      <i className="fas fa-users"></i>
                      <span>{project.assignedEmployees?.length || 0} employees assigned</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2)', fontSize: '0.875rem' }}>
                      <i className="fas fa-calendar"></i>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/tasks?projectId=${project.id}`)}
                    style={{ width: '100%', marginTop: '1rem', padding: '10px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid var(--blue)', borderRadius: '8px', color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View Tasks
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'rgba(19, 10, 34, 0.95)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Project</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  placeholder="Enter project name"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Assign Manager</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                >
                  <option value="">Select a manager</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Assign Employees</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                  {employees.map(employee => (
                    <label key={employee.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '6px', background: formData.assignedEmployees.includes(employee.id) ? 'rgba(96, 165, 250, 0.1)' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={formData.assignedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{employee.name}</span>
                    </label>
                  ))}
                </div>
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
                  Create Project
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
