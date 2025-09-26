import React, { useState, useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { 
  TextField, 
  Button, 
  InputAdornment, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Chip
} from '@mui/material';
import { MdCategory, MdEdit, MdDelete } from 'react-icons/md';
import { SnackbarContext } from '../App';

const AddCategory = () => {
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const { categories, tasks, addCategory, editCategory, deleteCategory } = useContext(TaskContext);
  const { hasPermission } = useAuth();
  const showSnackbar = useContext(SnackbarContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim()) {
      const result = await addCategory(name.trim());
      if (result.success) {
        setName("");
        showSnackbar('Categoria adicionada!', 'success');
      } else {
        showSnackbar(result.message, 'error');
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleSaveEdit = async () => {
    if (editName.trim() && editingCategory) {
      const result = await editCategory(editingCategory.id, editName.trim());
      if (result.success) {
        setEditingCategory(null);
        setEditName("");
        showSnackbar('Categoria atualizada!', 'success');
      } else {
        showSnackbar(result.message, 'error');
      }
    }
  };

  const handleDelete = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    const confirmMessage = category 
      ? `Tem certeza que deseja excluir a categoria "${category.name}"?\n\nNOTA: Categorias com tarefas não podem ser excluídas.`
      : 'Tem certeza que deseja excluir esta categoria?';
    
    if (window.confirm(confirmMessage)) {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        showSnackbar('Categoria excluída!', 'success');
      } else {
        showSnackbar(result.message, 'error');
      }
    }
  };

  return (
    <Card sx={{ mb: 4, boxShadow: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 700, 
          color: '#7c5e2a',
          mb: 3 
        }}>
          Gerenciar Categorias
        </Typography>
        
        {/* Adicionar nova categoria */}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nova categoria"
            required
            size="large"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdCategory style={{ fontSize: '24px' }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flex: 1,
              '& .MuiInputBase-root': {
                fontSize: '18px',
                height: '56px'
              }
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large"
            sx={{ 
              px: 4,
              py: 2,
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            Adicionar
          </Button>
        </form>

        {/* Lista de categorias existentes */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ 
            color: '#7c5e2a',
            fontWeight: 600,
            mb: 2
          }}>
            Categorias existentes ({categories.length}):
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {categories.map((category) => {
              const categoryTasks = tasks.filter(t => t.category === category.name);
              return (
                <Chip
                  key={category.id}
                  label={`${category.name} (${categoryTasks.length})`}
                  onDelete={hasPermission('manager') ? () => handleDelete(category.id) : undefined}
                  deleteIcon={<MdDelete style={{ fontSize: '20px' }} />}
                  onClick={hasPermission('manager') ? () => handleEdit(category) : undefined}
                  color="primary"
                  variant="outlined"
                  size="large"
                  sx={{ 
                    cursor: hasPermission('manager') ? 'pointer' : 'default',
                    fontSize: '16px',
                    height: '40px',
                    px: 2,
                    '&:hover': hasPermission('manager') ? { 
                      backgroundColor: 'primary.light',
                      transform: 'scale(1.05)',
                      transition: 'all 0.2s ease'
                    } : {}
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Dialog de edição */}
        <Dialog open={!!editingCategory} onClose={() => setEditingCategory(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nome da categoria"
              fullWidth
              variant="outlined"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingCategory(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AddCategory;