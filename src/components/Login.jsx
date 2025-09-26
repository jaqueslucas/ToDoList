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

const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
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
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, fontSize: '16px' }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
          {loading ? <CircularProgress size={24} /> : 'Entrar'}
        </Button>

        <Button
          variant="text"
          onClick={onSwitchToRegister}
          disabled={loading}
          sx={{ 
            mt: 2,
            fontSize: '16px',
            py: 1
          }}
        >
          Não tem conta? Registre-se
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
