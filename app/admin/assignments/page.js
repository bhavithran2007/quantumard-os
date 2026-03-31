'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function AdminAssignmentsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [managers, setManagers] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedManager, setSelectedManager] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'admin')) {
      router.push('/dashboard')
    } else if (user) {
      loadData()
    }
  }, [user, userProfile, loading, router])

  const loadData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setClients(usersData.filter(u => u.role === 'client'))
      setManagers(usersData.filter(u => u.role === 'manager'))
      setEmployees(usersData.filter(u => u.role === 'employee'))
      
      // Build assignments view
      const assignmentsData = usersData
        .filter(u => u.role === 'client')
        .map(client => ({
          client,
          manager: usersData.find(u => u.uid === client.assignedManager),
          employees: (client.assignedEmployees || []).map(empId => 
            usersData.find(u => u.uid === empId)
          ).filter(Boolean)
        }))
      setAssignments(assignmentsData)
    } catch (error) {
      // Demo fallback
      const demoClients = [{ id: 'demo-client', name: 'Rajesh Kumar', email: 'client@quantumard.com', company: 'TechLearn', assignedManager: null, assignedEmployees: [] }]
      const demoManagers = [{ id: 'demo-manager', name: 'Deepak Singh', email: 'manager@quantumard.com' }]
      const demoEmployees = [{ id: 'demo-employee', name: 'Arjun Developer', email: 'employee@quantumard.com' }]
      
      setClients(demoClients)
      setManagers(demoManagers)
      setEmployees(demoEmployees)
      setAssignments([{ client: demoClients[0], manager: null, employees: [] }])
    }
  }

  const handleAssign = async () => {
    if (!selectedClient || !selectedManager) return

    try {
      // Update client with assigned manager and employees
      await updateDoc(doc(db, 'users', selectedClient.id), {
        assignedManager: selectedManager,
        assignedEmployees: selectedEmployees
      })

      // Update manager's assigned clients list
      const managerDoc = managers.find(m => m.id === selectedManager)
      const managerClients = managerDoc?.assignedClients || []
      if (!managerClients.includes(selectedClient.id)) {
        await updateDoc(doc(db, 'users', selectedManager), {
          assignedClients: [...managerClients, selectedClient.id]
        })
      }

      setShowModal(false)
      setSelectedClient(null)
      setSelectedManager('')
      setSelectedEmployees([])
      loadData()
    } catch (error) {
      alert('Error assigning: ' + error.message)
    }
  }

  const openAssignModal = (client) => {
    setSelectedClient(client)
    setSelectedManager(client.assignedManager || '')
    setSelectedEmployees(client.assignedEmployees || [])
    setShowModal(true)
  }

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    )
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
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Client Assignments</h1>
            <p style={{ color: 'var(--text2)' }}>Assign managers and employees to clients</p>
          </div>

          {/* Assignments Table */}
          <div style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Client</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Company</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Assigned Manager</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Employees</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {assignment.client.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{assignment.client.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{assignment.client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text2)' }}>{assignment.client.company || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      {assignment.manager ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{assignment.manager.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{assignment.manager.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--red)' }}>Not assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {assignment.employees.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {assignment.employees.map(emp => (
                            <span key={emp.id} style={{ padding: '4px 8px', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.1)', color: 'var(--blue)', fontSize: '0.75rem', fontWeight: '600' }}>
                              {emp.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => openAssignModal(assignment.client)}
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <i className="fas fa-user-plus" style={{ marginRight: '6px' }}></i>
                        Assign Team
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showModal && selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'rgba(19, 10, 34, 0.95)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Assign Team to {selectedClient.name}</h2>
            <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>{selectedClient.company}</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Assign Manager *</label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
              >
                <option value="">Select a manager</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.name} ({manager.email})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Assign Employees</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                {employees.map(employee => (
                  <label key={employee.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '6px', background: selectedEmployees.includes(employee.id) ? 'rgba(96, 165, 250, 0.1)' : 'transparent' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{employee.name} ({employee.email})</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => { setShowModal(false); setSelectedClient(null); }}
                style={{ flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedManager}
                style={{ flex: 1, padding: '12px', background: selectedManager ? 'linear-gradient(135deg, var(--orange), var(--pink))' : 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: selectedManager ? 'pointer' : 'not-allowed' }}
              >
                Assign Team
              </button>
            </div>
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