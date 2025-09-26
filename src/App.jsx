import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './components/AppRouter';

export const SnackbarContext = React.createContext();

export const useSnackbar = () => {
  const context = React.useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

const taskTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#a67c2d' },
    secondary: { main: '#e2c98d' },
    background: {
      default: '#f8f5e4',
      paper: '#fdf6e3',
    },
    text: {
      primary: '#7c5e2a',
      secondary: '#a67c2d',
    },
    info: { main: '#a67c2d' },
    success: { main: '#7c5e2a' },
    error: { main: '#e53935' },
  },
  typography: {
    fontFamily: 'Caveat, Indie Flower, Comic Sans MS, cursive, Arial, sans-serif',
    h2: { fontWeight: 700, letterSpacing: 1 },
    h3: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleClose = () => {
    setSnackbar(s => ({ ...s, open: false }));
  };

  return (
    <ThemeProvider theme={taskTheme}>
      <CssBaseline />
      <SnackbarContext.Provider value={showSnackbar}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={2500} 
          onClose={handleClose} 
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </SnackbarContext.Provider>
    </ThemeProvider>
  );
}

export default App;