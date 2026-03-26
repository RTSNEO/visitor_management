import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import VisitorForm from '../components/VisitorForm';
import LanguageToggle from '../components/LanguageToggle';
import { useNavigate } from 'react-router-dom';

export default function Operator() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900 transition-colors">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-gray-600">Logged in as: {user.username} ({user.role})</span>
          <button onClick={() => navigate('/history')} className="text-blue-600 hover:underline text-sm">View History</button>
          <button onClick={logout} className="text-red-600 hover:underline text-sm">Logout</button>
        </div>
        <LanguageToggle />
      </header>

      <main>
        <VisitorForm />
      </main>
    </div>
  );
}