import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ClientForm from './pages/ClientForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Route publique - Formulaire client */}
            <Route path="/" element={<ClientForm />} />
            
            {/* Route de connexion admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Routes protégées admin */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Redirection par défaut pour les routes admin */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

// Composant 404
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="max-w-md w-full text-center px-6">
        <div className="animate-bounce-subtle mb-8">
          <div className="mx-auto h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="h-12 w-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page introuvable
        </h2>
        
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <div className="space-y-4">
          <a
            href="/"
            className="btn btn-primary w-full hover-lift"
          >
            Retour à l'accueil
          </a>
          
          <a
            href="/admin/login"
            className="btn btn-secondary w-full hover-lift"
          >
            Connexion administrateur
          </a>
        </div>
        
        {/* Décoration */}
        <div className="mt-12 opacity-20">
          <div className="flex justify-center space-x-4">
            <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
