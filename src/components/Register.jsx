import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    const result = await register(formData.name, formData.email, formData.password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ 
        mb: 4,
        color: '#7c5e2a',
        fontWeight: 600
      }}>
        Registrar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, fontSize: '16px' }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Nome"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          fullWidth
          disabled={loading}
          size="large"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '18px',
              height: '56px'
            }
          }}
        />
        
        <TextField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          fullWidth
          disabled={loading}
          size="large"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '18px',
              height: '56px'
            }
          }}
        />
        
        <TextField
          label="Senha"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          fullWidth
          disabled={loading}
          size="large"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '18px',
              height: '56px'
            }
          }}
        />
        
        <TextField
          label="Confirmar Senha"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          fullWidth
          disabled={loading}
          size="large"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '18px',
              height: '56px'
            }
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ 
            mt: 3, 
            py: 2,
            fontSize: '18px',
            fontWeight: 600,
            height: '56px'
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Registrar'}
        </Button>

        <Button
          variant="text"
          onClick={onSwitchToLogin}
          disabled={loading}
          sx={{ 
            mt: 2,
            fontSize: '16px',
            py: 1
          }}
        >
          Já tem conta? Faça login
        </Button>
      </Box>
    </Box>
  );
};

export default Register;
