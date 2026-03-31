import { Suspense } from 'react'
import TasksPageContent from './TasksPageContent'

export default function TasksPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>}>
      <TasksPageContent />
    </Suspense>
  )
}