'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userProfile) {
      loadDashboardData()
    }
  }, [userProfile])

  const loadDashboardData = async () => {
    try {
      setDataLoading(true)
      const role = userProfile.role

      // Load projects
      let projectsQuery
      if (role === 'admin') {
        projectsQuery = query(collection(db, 'projects'))
      } else if (role === 'manager') {
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

      const projectsSnap = await getDocs(projectsQuery)
      const projectsCount = projectsSnap.size

      // Load tasks
      let tasksQuery
      if (role === 'admin') {
        tasksQuery = query(collection(db, 'tasks'))
      } else if (role === 'manager') {
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

      const tasksSnap = await getDocs(tasksQuery)
      const allTasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      const completed = allTasks.filter(t => t.status === 'done').length
      const pending = allTasks.filter(t => t.status !== 'done').length

      // Get recent tasks
      const recent = allTasks.slice(0, 5)

      setStats({
        projects: projectsCount,
        tasks: allTasks.length,
        completedTasks: completed,
        pendingTasks: pending
      })
      setRecentTasks(recent)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text2)]">Loading dashboard...</p>
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
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text2)' }}>Welcome back, {userProfile.name}!</p>
          </div>

          {/* Stats Grid */}
          <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-project-diagram" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.projects}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Projects</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-tasks" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.tasks}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Total Tasks</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--green), #3a9e60)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.completedTasks}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Completed</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--gold), var(--orange))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-clock" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.pendingTasks}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Tasks</h2>
            {dataLoading ? (
              <p style={{ color: 'var(--text2)' }}>Loading tasks...</p>
            ) : recentTasks.length === 0 ? (
              <p style={{ color: 'var(--text2)' }}>No tasks found. Create your first project!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentTasks.map(task => (
                  <div key={task.id} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</h4>
                      <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{task.description}</p>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: task.status === 'done' ? 'rgba(74, 222, 128, 0.1)' : task.status === 'in_progress' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(163, 99, 170, 0.1)', color: task.status === 'done' ? 'var(--green)' : task.status === 'in_progress' ? 'var(--blue)' : 'var(--purple)' }}>
                      {task.status === 'done' ? 'Done' : task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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