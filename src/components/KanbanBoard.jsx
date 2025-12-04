import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import AddTask from "./AddTask";
import TaskList from "./TaskList";
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip, Grid } from '@mui/material';
import { DndContext, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const COLUMN_TITLES = {
    'todo': 'A Fazer',
    'in_progress': 'Em Execução',
    'done': 'Concluída'
};

const COLUMN_COLORS = {
    'todo': '#fdf6e3', // Yellowish
    'in_progress': '#e3f2fd', // Blueish
    'done': '#e8f5e9' // Greenish
};

const DroppableColumn = ({ id, title, children }) => {
    return (
        <Card
            sx={{
                height: '100%',
                bgcolor: COLUMN_COLORS[id],
                borderRadius: 3,
                boxShadow: 3,
                border: '1px solid rgba(0,0,0,0.1)'
            }}
        >
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" gutterBottom sx={{
                    color: '#555',
                    fontWeight: 700,
                    mb: 2,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                }}>
                    {title}
                </Typography>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 200 }}>
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
};

const KanbanBoard = () => {
    const { categories, getTasksByStatus, getAllUsers, moveTask } = useContext(TaskContext);
    const { user, hasPermission } = useAuth();
    const [filterUserId, setFilterUserId] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const tasksByStatus = getTasksByStatus(filterUserId, filterCategory);
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

        const activeId = active.id;
        const overId = over.id;

        // Find source and destination containers
        const findContainer = (id) => {
            if (id in tasksByStatus) return id;
            return Object.keys(tasksByStatus).find(key =>
                tasksByStatus[key].find(t => t.id === id)
            );
        };

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        // Calculate new position
        const activeItems = tasksByStatus[activeContainer];
        const overItems = tasksByStatus[overContainer];

        const activeIndex = activeItems.findIndex(t => t.id === activeId);
        const overIndex = overItems.findIndex(t => t.id === overId);

        let newIndex;
        if (activeContainer === overContainer) {
            // Reordering in same column
            newIndex = overIndex;
        } else {
            // Moving to different column
            const isBelowOverItem = over &&
                active.rect.current.translated &&
                active.rect.current.translated.top > over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;
            newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        moveTask(activeId, overContainer, newIndex);
    };

    return (
        <Box sx={{ maxWidth: 1600, margin: '0 auto', p: 2 }}>
            {/* Filters */}
            <Card sx={{ mb: 4, boxShadow: 2 }}>
                <CardContent sx={{ p: 3, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#7c5e2a', fontWeight: 600, mr: 2 }}>
                        Filtros:
                    </Typography>

                    {hasPermission('manager') && (
                        <FormControl sx={{ minWidth: 250 }} size="small">
                            <InputLabel>Usuário</InputLabel>
                            <Select
                                value={filterUserId}
                                onChange={(e) => setFilterUserId(e.target.value)}
                                label="Usuário"
                            >
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                {users.map((u) => (
                                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <FormControl sx={{ minWidth: 250 }} size="small">
                        <InputLabel>Categoria</InputLabel>
                        <Select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            label="Categoria"
                        >
                            <MenuItem value=""><em>Todas</em></MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </CardContent>
            </Card>

            {/* Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <Grid container spacing={3} sx={{ height: 'calc(100vh - 250px)', minHeight: 500 }}>
                    {['todo', 'in_progress', 'done'].map((status) => (
                        <Grid item xs={12} md={4} key={status} sx={{ height: '100%' }}>
                            <DroppableColumn id={status} title={COLUMN_TITLES[status]}>
                                <SortableContext
                                    items={tasksByStatus[status].map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <TaskList tasks={tasksByStatus[status]} />
                                </SortableContext>

                                {/* Only show Add Task in Todo column */}
                                {status === 'todo' && (
                                    <Box sx={{ mt: 2 }}>
                                        <AddTask categoryName={filterCategory || 'Geral'} defaultStatus="todo" />
                                    </Box>
                                )}
                            </DroppableColumn>
                        </Grid>
                    ))}
                </Grid>
            </DndContext>
        </Box>
    );
};

export default KanbanBoard;
