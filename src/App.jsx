import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import IssueCertificate from './pages/IssueCertificate'
import Settings from './pages/Settings'
import BatchProcessing from './pages/BatchProcessing'
import Signatures from './pages/Signatures'
import SignatureCapturePage from './pages/SignatureCapturePage'
import TemplateManager from './pages/TemplateManager'
import TemplateEditorPage from './pages/TemplateEditorPage'
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
      <Route path="/blog/technology" element={<Blog />} />
      <Route path="/blog/relays" element={<Blog />} />

      {/* Public Verification Routes */}
      <Route path="/verify" element={<Layout><PublicVerification /></Layout>} />
      <Route path="/verify/:certificateId" element={<Layout><PublicVerification /></Layout>} />

      {/* Public Signature Capture Route */}
      <Route path="/sign/:requestId" element={<SignatureCapturePage />} />

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
        path="/admin/signatures" 
        element={
          <ProtectedRoute>
            <Layout><Signatures /></Layout>
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
      <Route 
        path="/admin/templates" 
        element={
          <ProtectedRoute>
            <Layout><TemplateManager /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/templates/edit/:templateId" 
        element={
          <ProtectedRoute>
            <Layout><TemplateEditorPage /></Layout>
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

