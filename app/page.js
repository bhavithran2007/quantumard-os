'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user && userProfile) {
        // Route based on role
        if (userProfile.role === 'client' && !userProfile.onboardingComplete) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      } else {
        router.push('/login')
      }
    }
  }, [user, userProfile, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[var(--orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--text2)]">Loading Quantumard OS...</p>
      </div>
    </div>
  )
}