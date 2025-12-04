import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';
import UserManagement from './UserManagement';
import Header from './Header';
import { TaskProvider } from '../context/TaskContext';
import AddCategory from './AddCategory';
import CategoryKanban from './CategoryKanban';
import { Box, CircularProgress } from '@mui/material';

const AppRouter = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <TaskProvider>
      <Box sx={{ flexGrow: 1 }}>
        <Header
          onUserManagement={() => setCurrentView('users')}
          onDashboard={() => setCurrentView('dashboard')}
          currentView={currentView}
        />
        <Box component="main" sx={{
          p: 4,
          maxWidth: '100%',
          overflow: 'auto',
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: '#f8f5e4'
        }}>
          {currentView === 'dashboard' && (
            <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
              <AddCategory />
              <CategoryKanban />
            </Box>
          )}
          {currentView === 'users' && (
            <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
              <UserManagement />
            </Box>
          )}
        </Box>
      </Box>
    </TaskProvider>
  );
};

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f5e4',
      padding: '20px'
    }}>
      <div style={{
        padding: '60px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        maxWidth: '600px',
        width: '100%',
        minHeight: '600px'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: '#7c5e2a',
          fontSize: '48px',
          fontWeight: 700,
          fontFamily: 'Caveat, cursive'
        }}>
          ToDo List
        </h1>

        <div style={{ marginBottom: '40px', display: 'flex', gap: '0' }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              padding: '16px 32px',
              backgroundColor: isLogin ? '#a67c2d' : 'transparent',
              color: isLogin ? 'white' : '#7c5e2a',
              border: '2px solid #a67c2d',
              borderRadius: '12px 0 0 12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 600,
              width: '50%',
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              padding: '16px 32px',
              backgroundColor: !isLogin ? '#a67c2d' : 'transparent',
              color: !isLogin ? 'white' : '#7c5e2a',
              border: '2px solid #a67c2d',
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 600,
              width: '50%',
              transition: 'all 0.3s ease'
            }}
          >
            Registrar
          </button>
        </div>

        {isLogin ? <Login /> : <Register />}

        <div style={{
          marginTop: '40px',
          fontSize: '16px',
          color: '#666',
          textAlign: 'center',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ marginBottom: '16px', fontWeight: 600, color: '#7c5e2a' }}>
            <strong>Usuários de teste:</strong>
          </p>
          <p style={{ marginBottom: '8px' }}>Admin: admin@todolist.com / admin123</p>
          <p style={{ marginBottom: '8px' }}>Manager: joao@test.com / 123456</p>
          <p style={{ marginBottom: '0' }}>Reader: maria@test.com / 123456</p>
        </div>
      </div>
    </div>
  );
};

export default AppRouter;