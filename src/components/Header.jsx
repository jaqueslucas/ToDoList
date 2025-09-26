import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip
} from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Header = ({ onUserManagement, onDashboard, currentView }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, hasPermission } = useAuth();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleUserManagement = () => {
    onUserManagement();
    handleClose();
  };

  const handleDashboard = () => {
    onDashboard();
    handleClose();
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

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main', boxShadow: 3 }}>
      <Toolbar sx={{ minHeight: '80px !important', px: 4 }}>
        <Typography variant="h4" component="div" sx={{ 
          flexGrow: 1, 
          fontWeight: 700,
          fontSize: { xs: '24px', md: '32px' }
        }}>
          ToDo List
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Chip 
            label={getRoleLabel(user?.role)} 
            color={getRoleColor(user?.role)}
            size="large"
            variant="outlined"
            sx={{ 
              color: 'white', 
              borderColor: 'white',
              fontSize: '16px',
              height: '40px',
              fontWeight: 600
            }}
          />
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{ transform: 'scale(1.2)' }}
          >
            <AccountCircle sx={{ fontSize: '32px' }} />
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: { minWidth: 250, py: 1 }
            }}
          >
            <MenuItem disabled sx={{ py: 2 }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
            </MenuItem>
            <MenuItem disabled sx={{ py: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            
            <MenuItem onClick={handleDashboard} sx={{ py: 2, fontSize: '16px' }}>
              Dashboard
            </MenuItem>
            
            {hasPermission('manager') && (
              <MenuItem onClick={handleUserManagement} sx={{ py: 2, fontSize: '16px' }}>
                Gerenciar Usuários
              </MenuItem>
            )}
            
            <MenuItem onClick={handleLogout} sx={{ py: 2, fontSize: '16px' }}>
              <Logout sx={{ mr: 2 }} />
              Sair
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
