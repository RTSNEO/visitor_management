import './App.css'
import './i18n';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Operator from './pages/Operator';
import History from './pages/History';
import Employee from './pages/Employee';
import SecurityOfficer from './pages/SecurityOfficer';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
     // Default redirect based on role
     if (user.role === 'employee') return <Navigate to="/employee" replace />;
     if (user.role === 'security_officer') return <Navigate to="/security" replace />;
     return <Navigate to="/operator" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/operator" element={
            <ProtectedRoute allowedRoles={['operator']}>
              <Operator />
            </ProtectedRoute>
          } />

          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Employee />
            </ProtectedRoute>
          } />

          <Route path="/security" element={
            <ProtectedRoute allowedRoles={['security_officer']}>
              <SecurityOfficer />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute allowedRoles={['operator', 'employee', 'security_officer']}>
              <History />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
