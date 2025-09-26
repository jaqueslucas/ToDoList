import React, { useState, useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { 
  TextField, 
  Button, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  Typography
} from '@mui/material';
import { MdOutlineAddTask, MdPerson } from 'react-icons/md';
import { SnackbarContext } from '../App';

const AddTask = ({ categoryName }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const { addTask, getAllUsers } = useContext(TaskContext);
  const { user, hasPermission } = useAuth();
  const showSnackbar = useContext(SnackbarContext);
  const users = getAllUsers();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim()) {
      // Se for Manager/Admin e selecionou um usuário, usar esse ID
      // Senão, usar o ID do usuário atual
      const userId = (hasPermission('manager') && selectedUserId) ? selectedUserId : user.id;
      
      const result = await addTask(categoryName, title.trim(), description.trim(), userId);
      if (result.success) {
        setTitle("");
        setDescription("");
        setSelectedUserId("");
        showSnackbar('Tarefa adicionada!', 'success');
      } else {
        showSnackbar(result.message, 'error');
      }
    }
  };

  return (
    <Box sx={{ 
      mb: 3, 
      p: 3, 
      border: '2px solid #e2c98d', 
      borderRadius: 3, 
      backgroundColor: '#fdf6e3',
      boxShadow: 2
    }}>
      <Typography variant="h6" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: '#7c5e2a',
        fontWeight: 600,
        mb: 3
      }}>
        <MdOutlineAddTask style={{ fontSize: '28px' }} />
        Adicionar Tarefa em "{categoryName}"
      </Typography>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          required
          size="large"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdOutlineAddTask style={{ fontSize: '24px' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '18px',
              height: '56px'
            }
          }}
        />
        
        <TextField
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          size="large"
          multiline
          rows={3}
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '16px'
            }
          }}
        />

        {/* Seletor de usuário para Managers/Admins */}
        {hasPermission('manager') && (
          <FormControl size="large">
            <InputLabel>Atribuir para usuário</InputLabel>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              label="Atribuir para usuário"
              startAdornment={
                <InputAdornment position="start">
                  <MdPerson style={{ fontSize: '24px' }} />
                </InputAdornment>
              }
              sx={{
                '& .MuiSelect-select': {
                  fontSize: '16px',
                  py: 2
                }
              }}
            >
              <MenuItem value="">
                <em>Para mim ({user.name})</em>
              </MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          size="large"
          sx={{ 
            py: 2,
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          Adicionar Tarefa
        </Button>
      </form>
    </Box>
  );
};

export default AddTask;