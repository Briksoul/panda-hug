import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../hooks/useUser'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, authLoading } = useUser()

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        正在恢复登录状态...
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
