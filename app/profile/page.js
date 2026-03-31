'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function ProfilePage() {
  const { user, userProfile, loading, updateUserProfile, changePassword } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || ''
      })
    }
  }, [userProfile])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await updateUserProfile(formData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    try {
      setSaving(true)
      await changePassword(passwordData.newPassword)
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(storageRef)
      
      await updateUserProfile({ profilePhoto: photoURL })
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Error uploading photo' })
    } finally {
      setUploading(false)
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
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Profile Settings</h1>
            <p style={{ color: 'var(--text2)' }}>Manage your account information</p>
          </div>

          {message.text && (
            <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 90, 95, 0.1)', border: `1px solid ${message.type === 'success' ? 'var(--green)' : 'var(--red)'}`, color: message.type === 'success' ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              {message.text}
            </div>
          )}

          {/* Profile Photo Section */}
          <div style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Profile Photo</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: userProfile.profilePhoto ? `url(${userProfile.profilePhoto})` : 'linear-gradient(135deg, var(--orange), var(--pink))', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>
                {!userProfile.profilePhoto && userProfile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <label style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid var(--blue)', borderRadius: '10px', color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}>
                  {uploading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                  ) : (
                    <><i className="fas fa-upload"></i> Upload Photo</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.5rem' }}>JPG, PNG or GIF (max. 5MB)</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows="4"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', resize: 'vertical' }}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <i className="fas fa-user-tag" style={{ fontSize: '1.5rem', color: 'var(--blue)' }}></i>
                <div>
                  <p style={{ fontWeight: 600 }}>Role: <span style={{ textTransform: 'capitalize', color: 'var(--blue)' }}>{userProfile.role}</span></p>
                  <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Joined: {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div style={{ background: 'rgba(19, 10, 34, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  placeholder="Enter new password"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', padding: '12px', background: 'rgba(255, 90, 95, 0.1)', border: '1px solid var(--red)', borderRadius: '10px', color: 'var(--red)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : <><i className="fas fa-key"></i> Update Password</>}
              </button>
            </form>
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
