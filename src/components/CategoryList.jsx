import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import AddTask from "./AddTask";
import TaskList from "./TaskList";
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { DndContext, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';

const DroppableCategory = ({ category, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: category.name,
  });

  return (
    <Card
      ref={setNodeRef}
      sx={{
        borderRadius: 3,
        boxShadow: isOver ? 6 : 3,
        border: isOver ? '2px solid #7c5e2a' : '1px solid #e2c98d',
        transition: 'all 0.2s ease',
        bgcolor: isOver ? '#fff8e1' : 'white'
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{
          color: '#7c5e2a',
          fontWeight: 700,
          mb: 3
        }}>
          {category.name}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
};

const CategoryList = () => {
  const { categories, getTasksByCategory, getAllUsers, moveTask } = useContext(TaskContext);
  const { user, hasPermission } = useAuth();
  const [filterUserId, setFilterUserId] = useState('');

  const tasksByCategory = getTasksByCategory(filterUserId);
  const users = getAllUsers();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id;
    const overContainer = over.id; // This will be the category name

    // Find the task object to check if it's already in the category
    let activeTask = null;
    Object.values(tasksByCategory).forEach(tasks => {
      const found = tasks.find(t => t.id === activeTaskId);
      if (found) activeTask = found;
    });

    if (activeTask && activeTask.category !== overContainer) {
      moveTask(activeTaskId, overContainer);
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <Box display="flex" flexDirection="column" gap={4}>
          {categories.map((cat) => (
            <DroppableCategory key={cat.id} category={cat}>
              <AddTask categoryName={cat.name} />
              <TaskList tasks={tasksByCategory[cat.name] || []} />
            </DroppableCategory>
          ))}
        </Box>
      </DndContext>
    </Box>
  );
};

export default CategoryList;