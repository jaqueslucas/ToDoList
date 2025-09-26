import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import AddTask from "./AddTask";
import TaskList from "./TaskList";
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';

const CategoryList = () => {
  const { categories, getTasksByCategory, getAllUsers } = useContext(TaskContext);
  const { user, hasPermission } = useAuth();
  const [filterUserId, setFilterUserId] = useState('');

  const tasksByCategory = getTasksByCategory(filterUserId);
  const users = getAllUsers();

  if (categories.length === 0) {
    return <Typography color="text.secondary">Nenhuma categoria criada ainda.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Filtro por usuário */}
      {hasPermission('manager') && (
        <Card sx={{ mb: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              color: '#7c5e2a',
              fontWeight: 600,
              mb: 3
            }}>
              Filtrar Tarefas por Usuário
            </Typography>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Usuário</InputLabel>
              <Select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                label="Usuário"
                size="large"
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: '16px',
                    py: 2
                  }
                }}
              >
                <MenuItem value="">
                  <em>Todos os usuários</em>
                </MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {u.name}
                      <Chip 
                        label={u.role} 
                        size="small" 
                        color={u.role === 'admin' ? 'error' : u.role === 'manager' ? 'warning' : 'info'}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      <Box display="flex" flexDirection="column" gap={4}>
        {categories.map((cat) => (
          <Card key={cat.id} sx={{ 
            borderRadius: 3, 
            boxShadow: 3,
            border: '1px solid #e2c98d'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ 
                color: '#7c5e2a',
                fontWeight: 700,
                mb: 3
              }}>
                {cat.name}
              </Typography>
              <AddTask categoryName={cat.name} />
              <TaskList tasks={tasksByCategory[cat.name] || []} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default CategoryList; 