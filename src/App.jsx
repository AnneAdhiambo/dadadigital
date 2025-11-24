import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import IssueCertificate from './pages/IssueCertificate'
import Settings from './pages/Settings'
import BatchProcessing from './pages/BatchProcessing'
import LandingPage from './pages/LandingPage'
import Blog from './pages/Blog'
import AdminLogin from './pages/AdminLogin'
import PublicVerification from './pages/PublicVerification'

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Blog */}
      <Route path="/blog/security" element={<Blog />} />

      {/* Public Verification Routes */}
      <Route path="/verify" element={<PublicVerification />} />
      <Route path="/verify/:certificateId" element={<PublicVerification />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Routes Wrapped in Layout and Protected */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/issue" 
        element={
          <ProtectedRoute>
            <Layout><IssueCertificate /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/batch" 
        element={
          <ProtectedRoute>
            <Layout><BatchProcessing /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy Redirects */}
      <Route path="/issue" element={<Navigate to="/admin/issue" replace />} />
      <Route path="/batch" element={<Navigate to="/admin/batch" replace />} />
    </Routes>
  )
}

export default App

