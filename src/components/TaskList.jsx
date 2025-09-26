import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { Checkbox, IconButton, List, ListItem, ListItemText, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Box } from '@mui/material';
import { MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';
import { SnackbarContext } from '../App';

const TaskList = ({ tasks }) => {
  const { toggleTask, removeTask, editTask } = useContext(TaskContext);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const showSnackbar = useContext(SnackbarContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const handleToggle = async (taskId) => {
    const result = await toggleTask(taskId);
    if (result.success) {
      showSnackbar('Tarefa atualizada!', 'success');
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  const handleEdit = async (taskId) => {
    const result = await editTask(taskId, editTitle.trim(), editDescription.trim());
    if (result.success) {
      setEditingId(null);
      showSnackbar('Tarefa editada!', 'success');
    } else {
      showSnackbar(result.message, 'error');
    }
  };

  const handleDelete = async (taskId) => {
    const result = await removeTask(taskId);
    if (result.success) {
      showSnackbar('Tarefa excluída!', 'info');
    } else {
      showSnackbar(result.message, 'error');
    }
    setConfirmOpen(false);
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  if (!tasks || tasks.length === 0) {
    return (
      <Typography 
        variant="h6" 
        color="text.secondary" 
        sx={{ 
          textAlign: 'center', 
          py: 4,
          fontStyle: 'italic'
        }}
      >
        Nenhuma tarefa nesta categoria.
      </Typography>
    );
  }

  return (
    <>
      <List sx={{ bgcolor: 'transparent', borderRadius: 2, p: 2 }}>
        {tasks.map((task) => (
          <ListItem 
            key={task.id} 
            disableGutters 
            sx={{ 
              flexDirection: 'column', 
              alignItems: 'stretch',
              mb: 2,
              p: 2,
              bgcolor: '#fdf6e3',
              borderRadius: 2,
              boxShadow: 1,
              border: '1px solid #e2c98d'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
              <Checkbox
                checked={task.completed}
                onChange={() => handleToggle(task.id)}
                color="primary"
                disabled={editingId === task.id}
                sx={{ mt: 1, transform: 'scale(1.2)' }}
              />
              
              <Box sx={{ flex: 1, mr: 1 }}>
                {editingId === task.id ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      size="large"
                      autoFocus
                      placeholder="Título"
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: '18px',
                          height: '56px'
                        }
                      }}
                    />
                    <TextField
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      size="large"
                      multiline
                      rows={3}
                      placeholder="Descrição"
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: '16px'
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <ListItemText
                    primary={
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          textDecoration: task.completed ? 'line-through' : 'none', 
                          color: task.completed ? '#888' : '#333',
                          fontWeight: 600,
                          mb: 1
                        }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      task.description && (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            textDecoration: task.completed ? 'line-through' : 'none', 
                            color: task.completed ? '#888' : '#666',
                            lineHeight: 1.6
                          }}
                        >
                          {task.description}
                        </Typography>
                      )
                    }
                    onDoubleClick={() => startEdit(task)}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
                
                {task.user_name && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Criado por: {task.user_name}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {editingId === task.id ? (
                  <>
                    <IconButton 
                      color="success" 
                      onClick={handleEdit}
                      sx={{ transform: 'scale(1.2)' }}
                    >
                      <MdCheck style={{ fontSize: '24px' }} />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => setEditingId(null)}
                      sx={{ transform: 'scale(1.2)' }}
                    >
                      <MdClose style={{ fontSize: '24px' }} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton 
                      color="primary" 
                      onClick={() => startEdit(task)}
                      sx={{ transform: 'scale(1.2)' }}
                    >
                      <MdEdit style={{ fontSize: '24px' }} />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => { setToDeleteId(task.id); setConfirmOpen(true); }}
                      sx={{ transform: 'scale(1.2)' }}
                    >
                      <MdDelete style={{ fontSize: '24px' }} />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
          Confirmar exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '16px', mt: 2 }}>
            Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            color="primary"
            size="large"
            sx={{ px: 3, py: 1.5 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => handleDelete(toDeleteId)} 
            color="error"
            variant="contained"
            size="large"
            sx={{ px: 3, py: 1.5 }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskList; 