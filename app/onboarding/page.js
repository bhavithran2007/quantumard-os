'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Sidebar from '@/components/Sidebar'

export default function OnboardingPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState('overview')
  const [onboardingData, setOnboardingData] = useState(null)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (userProfile && userProfile.role !== 'client') {
      router.push('/dashboard')
    } else if (userProfile && userProfile.onboardingComplete) {
      router.push('/dashboard')
    } else if (user) {
      loadOnboarding()
    }
  }, [user, userProfile, loading, router])

  const loadOnboarding = async () => {
    try {
      // Try to load existing onboarding data
      const docRef = doc(db, 'onboarding', user.uid)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        setOnboardingData(docSnap.data())
      } else {
        // Initialize new onboarding
        const initialData = {
          clientId: user.uid,
          sections: {
            overview: { completed: true },
            businessDetails: { completed: false, data: {} },
            brandAssets: { completed: false, links: [] },
            adAccounts: { completed: false, credentials: {} },
            kickoffCall: { completed: false, callDetails: {} }
          },
          progressPercentage: 20,
          createdAt: new Date().toISOString()
        }
        await setDoc(docRef, initialData)
        setOnboardingData(initialData)
      }
    } catch (error) {
      console.error('Error loading onboarding:', error)
      // Fallback for demo mode
      setOnboardingData({
        sections: {
          overview: { completed: true },
          businessDetails: { completed: false, data: {} },
          brandAssets: { completed: false, links: [] },
          adAccounts: { completed: false, credentials: {} },
          kickoffCall: { completed: false, callDetails: {} }
        },
        progressPercentage: 20
      })
    }
  }

  const saveSection = async (sectionKey, data) => {
    try {
      const updatedSections = {
        ...onboardingData.sections,
        [sectionKey]: { completed: true, ...data }
      }
      
      const completedCount = Object.values(updatedSections).filter(s => s.completed).length
      const totalSections = Object.keys(updatedSections).length
      const progress = Math.round((completedCount / totalSections) * 100)
      
      const updatedData = {
        ...onboardingData,
        sections: updatedSections,
        progressPercentage: progress
      }
      
      await setDoc(doc(db, 'onboarding', user.uid), updatedData)
      setOnboardingData(updatedData)
      
      // If all sections completed, mark onboarding as complete
      if (progress === 100) {
        await updateUserProfile({ onboardingComplete: true })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error saving section:', error)
    }
  }

  const handleBusinessDetails = async (e) => {
    e.preventDefault()
    await saveSection('businessDetails', {
      data: {
        businessName: e.target.businessName.value,
        industry: e.target.industry.value,
        website: e.target.website.value,
        revenue: e.target.revenue.value,
        teamSize: e.target.teamSize.value,
        mainGoal: e.target.mainGoal.value
      }
    })
  }

  if (loading || !onboardingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text2)]">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, marginLeft: '280px' }}>
        {/* Hero Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255, 90, 95, .15), rgba(163, 99, 170, .15))', border: '1px solid rgba(255, 90, 95, .25)', borderRadius: '20px', padding: '40px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontFamily: 'var(--fh)', fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>Welcome to Your Quantumard Journey</h1>
            <p style={{ color: 'var(--text2)', lineHeight: 1.6, maxWidth: '600px' }}>You're now part of a partnership that's committed to exponential growth. Complete these steps to get started.</p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: 'var(--fh)', fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Your Onboarding Progress</div>
          <div style={{ background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--orange), var(--pink))', borderRadius: '10px', width: `${onboardingData.progressPercentage}%`, transition: 'width .6s ease' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{onboardingData.progressPercentage}% Complete</span>
            <span>Keep going!</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {Object.entries(onboardingData.sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setCurrentSection(key)}
              style={{
                padding: '12px 20px',
                background: currentSection === key ? 'linear-gradient(135deg, var(--orange), var(--pink))' : 'rgba(255, 255, 255, .05)',
                border: '1px solid ' + (currentSection === key ? 'transparent' : 'var(--border)'),
                borderRadius: '10px',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
            >
              {section.completed && <i className="fas fa-check-circle" style={{ color: 'var(--green)' }}></i>}
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div style={{ background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px' }}>
          {currentSection === 'overview' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Getting Started</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ background: 'rgba(96, 165, 250, .1)', border: '1px solid rgba(96, 165, 250, .2)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '12px' }}>
                  <i className="fas fa-lightbulb" style={{ color: 'var(--blue)', fontSize: '20px' }}></i>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Our Approach</h4>
                    <p style={{ color: 'var(--text2)', fontSize: '14px' }}>We focus on data-driven decisions and rapid optimization. Your success is our only metric.</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(96, 165, 250, .1)', border: '1px solid rgba(96, 165, 250, .2)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '12px' }}>
                  <i className="fas fa-clock" style={{ color: 'var(--blue)', fontSize: '20px' }}></i>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Timeline</h4>
                    <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Onboarding: 2-3 days. First campaign live: 5-7 days. Optimization and scaling begins immediately.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'businessDetails' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Business Details</h2>
              <form onSubmit={handleBusinessDetails}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Business Name *</label>
                    <input name="businessName" required style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Industry *</label>
                    <input name="industry" required style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Website *</label>
                    <input name="website" type="url" required style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Monthly Revenue *</label>
                    <input name="revenue" required style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Team Size *</label>
                    <input name="teamSize" required style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Main Goal *</label>
                    <input name="mainGoal" required style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, .05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }} />
                  </div>
                </div>
                <button type="submit" style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  <i className="fas fa-save" style={{ marginRight: '8px' }}></i>Save & Continue
                </button>
              </form>
            </div>
          )}

          {currentSection === 'brandAssets' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Brand Assets</h2>
              <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Share Google Drive links to your logos, brand guidelines, and assets.</p>
              <button onClick={() => saveSection('brandAssets', { links: [] })} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Complete Section
              </button>
            </div>
          )}

          {currentSection === 'adAccounts' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Ad Accounts Access</h2>
              <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Grant us access to your Meta and Google Ads accounts.</p>
              <button onClick={() => saveSection('adAccounts', { credentials: {} })} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Complete Section
              </button>
            </div>
          )}

          {currentSection === 'kickoffCall' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px' }}>Kickoff Call</h2>
              <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Schedule your strategy kickoff call with the team.</p>
              <button onClick={() => saveSection('kickoffCall', { callDetails: {} })} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Complete Section
              </button>
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