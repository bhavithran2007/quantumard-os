'use client'

export const dynamic = 'force-dynamic' // Add this line



import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function TasksPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] })
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    assignedTo: '',
    deadline: '',
    status: 'todo'
  })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userProfile) {
      loadTasks()
      loadProjects()
      if (userProfile.role !== 'employee') {
        loadEmployees()
      }
    }
  }, [userProfile, projectId])

  const loadTasks = async () => {
    try {
      setDataLoading(true)
      let tasksQuery

      if (projectId) {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId)
        )
      } else if (userProfile.role === 'admin') {
        tasksQuery = query(collection(db, 'tasks'))
      } else if (userProfile.role === 'manager') {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('assignedBy', '==', user.uid)
        )
      } else {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('assignedTo', '==', user.uid)
        )
      }

      const snapshot = await getDocs(tasksQuery)
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setTasks({
        todo: tasksData.filter(t => t.status === 'todo'),
        in_progress: tasksData.filter(t => t.status === 'in_progress'),
        done: tasksData.filter(t => t.status === 'done')
      })
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
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
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'employee')
      )
      const snapshot = await getDocs(usersQuery)
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const taskData = {
        ...formData,
        assignedBy: user.uid,
        createdAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'tasks'), taskData)
      
      // Create notification
      if (formData.assignedTo) {
        await addDoc(collection(db, 'notifications'), {
          userId: formData.assignedTo,
          message: `New task assigned: ${formData.title}`,
          read: false,
          createdAt: new Date().toISOString()
        })
      }

      setShowModal(false)
      setFormData({ title: '', description: '', projectId: projectId || '', assignedTo: '', deadline: '', status: 'todo' })
      loadTasks()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus })
      loadTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId))
        loadTasks()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
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

  const canCreateTask = userProfile.role === 'admin' || userProfile.role === 'manager'

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, marginLeft: '280px' }}>
        <Topbar />
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tasks Board</h1>
              <p style={{ color: 'var(--text2)' }}>Kanban view of all tasks</p>
            </div>
            {canCreateTask && (
              <button
                onClick={() => setShowModal(true)}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-plus"></i> Create Task
              </button>
            )}
          </div>

          {/* Kanban Board */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', minHeight: '500px' }}>
            {/* To Do Column */}
            <div style={{ background: 'rgba(19, 10, 34, 0.5)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--purple)' }}></div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>To Do</h3>
                <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '12px', background: 'rgba(163, 99, 170, 0.2)', color: 'var(--purple)', fontSize: '0.75rem', fontWeight: '600' }}>
                  {tasks.todo.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.todo.map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} canEdit={canCreateTask} />
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div style={{ background: 'rgba(19, 10, 34, 0.5)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--blue)' }}></div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>In Progress</h3>
                <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.2)', color: 'var(--blue)', fontSize: '0.75rem', fontWeight: '600' }}>
                  {tasks.in_progress.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.in_progress.map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} canEdit={canCreateTask} />
                ))}
              </div>
            </div>

            {/* Done Column */}
            <div style={{ background: 'rgba(19, 10, 34, 0.5)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--green)' }}></div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Done</h3>
                <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.2)', color: 'var(--green)', fontSize: '0.75rem', fontWeight: '600' }}>
                  {tasks.done.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.done.map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} canEdit={canCreateTask} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'rgba(19, 10, 34, 0.95)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Task</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  placeholder="Enter task title"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', resize: 'vertical' }}
                  placeholder="Task description"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                >
                  <option value="">Select project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Assign To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function TaskCard({ task, onStatusChange, onDelete, canEdit }) {
  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'var(--purple)' },
    { value: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
    { value: 'done', label: 'Done', color: 'var(--green)' }
  ]

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
      <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{task.title}</h4>
      {task.description && (
        <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{task.description}</p>
      )}
      {task.deadline && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
          <i className="fas fa-calendar"></i>
          <span>{new Date(task.deadline).toLocaleDateString()}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        {statusOptions.map(option => (
          option.value !== task.status && (
            <button
              key={option.value}
              onClick={() => onStatusChange(task.id, option.value)}
              style={{ flex: 1, padding: '6px 10px', background: `rgba(${option.color === 'var(--green)' ? '74, 222, 128' : option.color === 'var(--blue)' ? '96, 165, 250' : '163, 99, 170'}, 0.1)`, border: `1px solid ${option.color}`, borderRadius: '6px', color: option.color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {option.label}
            </button>
          )
        ))}
        {canEdit && (
          <button
            onClick={() => onDelete(task.id)}
            style={{ padding: '6px 10px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  )
}
