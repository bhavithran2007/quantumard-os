'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState, useRef } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db, onForegroundMessage } from '@/lib/firebase'

export default function Topbar() {
  const { user, userProfile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const dropdownRef = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (user?.uid) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    let unsub = () => {}
    onForegroundMessage((payload) => {
      const msg = payload.notification?.title || payload.data?.message || 'New notification'
      setToastMsg(msg)
      setTimeout(() => setToastMsg(null), 4500)
      loadNotifications()
    }).then(fn => { unsub = fn })
    return () => unsub()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifications = async () => {
    if (!user?.uid || user.uid.startsWith('demo-')) return
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid)))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20)
      setNotifications(all)
    } catch {}
  }

  const markRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true })
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    await Promise.all(notifications.filter(n => !n.read).map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const NOTIF_ICONS = {
    task_assigned:      { icon: 'fa-tasks',         color: 'var(--orange)' },
    approval_submitted: { icon: 'fa-paper-plane',   color: 'var(--blue)' },
    approval_approved:  { icon: 'fa-check-circle',  color: 'var(--green)' },
    approval_rejected:  { icon: 'fa-times-circle',  color: 'var(--red)' },
    default:            { icon: 'fa-bell',           color: 'var(--purple)' }
  }

  return (
    <>
      <div className="top-bar" style={{ background: 'rgba(19,10,34,0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Welcome back, {userProfile?.name}!</h3>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setShowDropdown(!showDropdown)}
              style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <i className="fas fa-bell" style={{ fontSize: '1rem', color: unread > 0 ? 'var(--orange)' : 'var(--text2)' }}></i>
              {unread > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', fontSize: '0.65rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showDropdown && (
              <div style={{ position: 'absolute', top: '52px', right: 0, width: '340px', background: 'rgba(19,10,34,0.98)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 200 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 700 }}>Notifications {unread > 0 && <span style={{ color: 'var(--orange)' }}>({unread})</span>}</h4>
                  {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                      <i className="fas fa-bell-slash" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      All caught up!
                    </div>
                  ) : notifications.map(notif => {
                    const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default
                    return (
                      <div key={notif.id} onClick={() => markRead(notif.id)}
                        style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', background: notif.read ? 'transparent' : 'rgba(255,153,79,0.04)', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`fas ${cfg.icon}`} style={{ fontSize: '0.85rem', color: cfg.color }}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.85rem', lineHeight: 1.4, color: notif.read ? 'var(--text2)' : 'var(--text)', fontWeight: notif.read ? 400 : 600 }}>{notif.message}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '3px' }}>{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                        {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--orange)', flexShrink: 0, marginTop: '5px' }}></div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
            {userProfile?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Foreground toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '80px', right: '1.5rem', background: 'rgba(19,10,34,0.97)', border: '1px solid rgba(255,153,79,0.4)', borderRadius: '12px', padding: '1rem 1.25rem', maxWidth: '320px', zIndex: 9998, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'slideInRight 0.3s ease' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,153,79,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-bell" style={{ color: 'var(--orange)' }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>Quantumard OS</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{toastMsg}</p>
          </div>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
        </div>
      )}

      <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </>
  )
}
