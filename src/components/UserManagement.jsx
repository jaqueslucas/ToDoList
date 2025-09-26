import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Box
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../App';

const API_BASE_URL = 'http://localhost:5000/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'reader',
    password: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { user: currentUser, hasPermission } = useAuth();
  const showSnackbar = useSnackbar();

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        showSnackbar('Erro ao carregar usuários', 'error');
      }
    } catch {
      showSnackbar('Erro de conexão', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (hasPermission('manager')) {
      fetchUsers();
    }
  }, [hasPermission, fetchUsers]);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'reader',
        password: ''
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'reader',
      password: ''
    });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `${API_BASE_URL}/users/${editingUser.id}`
        : `${API_BASE_URL}/users`;

      const body = { ...formData };
      if (!editingUser || body.password) {
        // Only include password if creating new user or updating password
      } else {
        delete body.password;
      }

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        showSnackbar(data.message, 'success');
        handleCloseDialog();
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        showSnackbar(data.message, 'success');
        fetchUsers();
      } else {
        showSnackbar(data.message, 'error');
      }
    } catch {
      showSnackbar('Erro de conexão', 'error');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'reader': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerenciador';
      case 'reader': return 'Leitor';
      default: return role;
    }
  };

  if (!hasPermission('manager')) {
    return (
      <Paper elevation={3} sx={{ 
        p: 6, 
        maxWidth: 800, 
        mx: 'auto', 
        mt: 6,
        borderRadius: 3,
        boxShadow: 3
      }}>
        <Typography variant="h4" align="center" color="error" sx={{ fontWeight: 600 }}>
          Acesso negado. Você não tem permissão para gerenciar usuários.
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ 
      p: 6, 
      maxWidth: 1400, 
      mx: 'auto', 
      mt: 4,
      borderRadius: 3,
      boxShadow: 3
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 700,
          color: '#7c5e2a'
        }}>
          Gerenciamento de Usuários
        </Typography>
        {hasPermission('admin') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
            sx={{ 
              px: 4,
              py: 2,
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            Novo Usuário
          </Button>
        )}
      </Box>

      <TableContainer sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontSize: '18px', fontWeight: 600, py: 3 }}>Nome</TableCell>
              <TableCell sx={{ fontSize: '18px', fontWeight: 600, py: 3 }}>Email</TableCell>
              <TableCell sx={{ fontSize: '18px', fontWeight: 600, py: 3 }}>Função</TableCell>
              <TableCell sx={{ fontSize: '18px', fontWeight: 600, py: 3 }}>Data de Criação</TableCell>
              {hasPermission('admin') && <TableCell align="center" sx={{ fontSize: '18px', fontWeight: 600, py: 3 }}>Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                <TableCell sx={{ fontSize: '16px', py: 2 }}>{user.name}</TableCell>
                <TableCell sx={{ fontSize: '16px', py: 2 }}>{user.email}</TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Chip 
                    label={getRoleLabel(user.role)} 
                    color={getRoleColor(user.role)}
                    size="large"
                    sx={{ fontSize: '14px', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '16px', py: 2 }}>
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                {hasPermission('admin') && (
                  <TableCell align="center" sx={{ py: 2 }}>
                    <IconButton
                      onClick={() => handleOpenDialog(user)}
                      disabled={user.id === currentUser?.id}
                      sx={{ transform: 'scale(1.2)', mr: 1 }}
                    >
                      <Edit sx={{ fontSize: '24px' }} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUser?.id}
                      color="error"
                      sx={{ transform: 'scale(1.2)' }}
                    >
                      <Delete sx={{ fontSize: '24px' }} />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '24px', fontWeight: 600, py: 3 }}>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, fontSize: '16px' }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              disabled={saving}
              size="large"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '16px',
                  height: '56px'
                }
              }}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              disabled={saving}
              size="large"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '16px',
                  height: '56px'
                }
              }}
            />

            <FormControl fullWidth margin="normal" size="large">
              <InputLabel>Função</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={saving}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: '16px',
                    py: 2
                  }
                }}
              >
                <MenuItem value="reader">Leitor</MenuItem>
                <MenuItem value="manager">Gerenciador</MenuItem>
                {hasPermission('admin') && (
                  <MenuItem value="admin">Administrador</MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              label={editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingUser}
              fullWidth
              margin="normal"
              disabled={saving}
              helperText={editingUser ? "Deixe em branco para manter a senha atual" : ""}
              size="large"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '16px',
                  height: '56px'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 4 }}>
            <Button 
              onClick={handleCloseDialog} 
              disabled={saving}
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '16px' }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saving}
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '16px', fontWeight: 600 }}
            >
              {saving ? <CircularProgress size={24} /> : (editingUser ? 'Salvar' : 'Criar')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};

export default UserManagement;
