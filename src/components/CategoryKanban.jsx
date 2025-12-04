import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import AddTask from "./AddTask";
import TaskList from "./TaskList";
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip, Grid } from '@mui/material';
import { DndContext, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const COLUMN_TITLES = {
    'todo': 'A Fazer',
    'in_progress': 'Em Execução',
    'done': 'Concluída'
};

const COLUMN_COLORS = {
    'todo': '#fdf6e3', // Light beige (keep or slightly adjust)
    'in_progress': '#fff8e1', // Warm yellowish/sand
    'done': '#e8f5e9' // Keep green but maybe warmer? Let's try a sage green: #dcedc8 or similar. User said "condizer mais com a cor do projeto".
    // Project uses #f8f5e4 (bg), #7c5e2a (primary).
    // Let's try:
    // todo: #fffdf5 (very light yellow/beige)
    // in_progress: #fff3cd (warmer yellow/gold)
    // done: #d7ccc8 (light brown/beige) OR #c8e6c9 (sage)
    // User image shows: Todo (beige), InProgress (blue), Done (green).
    // User wants to CHANGE InProgress and Done to match project.
    // Project is earthy.
    // Let's go with:
    // Todo: #fdf6e3 (Solarized light background, matches current)
    // In Progress: #faeec5 (Warm sand)
    // Done: #e0e0d1 (Sage/Greyish beige)
};

// Actually, let's define them more explicitly
const THEME_COLORS = {
    todo: '#fff9c4', // Light Yellow
    in_progress: '#ffe0b2', // Light Orange/Sand
    done: '#dcedc8' // Light Green/Sage
};

// Let's use the user's "earthy" vibe.
// Todo: #fdf6e3 (Base)
// In Progress: #f0e68c (Khaki) -> maybe too dark. #fff176 (light yellow)
// Done: #a5d6a7 (Green) -> maybe too bright. 
// Let's try to match the "brown" text #7c5e2a.
// In Progress: #ffecb3 (Amber 100)
// Done: #c8e6c9 (Green 100) - classic success but soft.

const NEW_COLUMN_COLORS = {
    'todo': '#fdf6e3',
    'in_progress': '#fff3e0', // Very light orange
    'done': '#e8f5e9' // Very light green
};

const DroppableColumn = ({ id, title, children, bgColor }) => {
    // Note: We need to import useDroppable
    const { setNodeRef } = useDroppable({ id });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                height: '100%',
                bgcolor: bgColor || '#fff',
                borderRadius: 2,
                p: 1,
                border: '1px solid rgba(0,0,0,0.05)',
                minHeight: 150
            }}
        >
            <Typography variant="subtitle2" sx={{
                textAlign: 'center',
                mb: 1,
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#666',
                fontSize: '0.75rem'
            }}>
                {title}
            </Typography>
            <Box sx={{ minHeight: 100 }}>
                {children}
            </Box>
        </Box>
    );
};

import { Dialog, DialogTitle, DialogContent, IconButton, Button } from '@mui/material';
import { MdAdd, MdClose } from 'react-icons/md';

const AddTaskDialog = ({ open, onClose, categoryName }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#7c5e2a', fontWeight: 700 }}>
                Nova Tarefa em "{categoryName}"
                <IconButton onClick={onClose} size="small">
                    <MdClose />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <AddTask categoryName={categoryName} defaultStatus="todo" />
            </DialogContent>
        </Dialog>
    );
};

const CategorySection = ({ categoryName, tasksByStatus }) => {
    const [openAdd, setOpenAdd] = useState(false);

    return (
        <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 3, bgcolor: '#fffbf2' }}>
            <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" sx={{ color: '#7c5e2a', fontWeight: 700 }}>
                        {categoryName}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        onClick={() => setOpenAdd(true)}
                        sx={{
                            bgcolor: '#a67c2d',
                            '&:hover': { bgcolor: '#8c6b28' },
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        Adicionar Tarefa
                    </Button>
                </Box>

                <AddTaskDialog
                    open={openAdd}
                    onClose={() => setOpenAdd(false)}
                    categoryName={categoryName}
                />

                <Grid container spacing={2}>
                    {['todo', 'in_progress', 'done'].map(status => {
                        const columnId = `${categoryName}::${status}`;
                        const tasks = tasksByStatus[status] || [];

                        // Custom colors for this specific implementation
                        const bgColors = {
                            'todo': '#fdf6e3',
                            'in_progress': '#fff3e0', // Warm sand
                            'done': '#e8f5e9' // Sage green
                        };

                        return (
                            <Grid size={{ xs: 12, md: 4 }} key={status}>
                                <DroppableColumn
                                    id={columnId}
                                    title={COLUMN_TITLES[status]}
                                    bgColor={bgColors[status]}
                                >
                                    <SortableContext
                                        id={columnId}
                                        items={tasks.map(t => t.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <TaskList tasks={tasks} />
                                    </SortableContext>
                                </DroppableColumn>
                            </Grid>
                        );
                    })}
                </Grid>
            </CardContent>
        </Card>
    );
};

const CategoryKanban = () => {
    const { categories, getTasksByCategoryAndStatus, getAllUsers, moveTask } = useContext(TaskContext);
    const { user, hasPermission } = useAuth();
    const [filterUserId, setFilterUserId] = useState('');

    const groupedTasks = getTasksByCategoryAndStatus(filterUserId);
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

        // Helper to find task and its location
        const findTaskLocation = (taskId) => {
            for (const catName of Object.keys(groupedTasks)) {
                for (const status of ['todo', 'in_progress', 'done']) {
                    const tasks = groupedTasks[catName][status];
                    const task = tasks.find(t => t.id === taskId);
                    if (task) return { category: catName, status, task, index: tasks.indexOf(task) };
                }
            }
            return null;
        };

        // Helper to parse container ID "Category::Status"
        const parseContainerId = (id) => {
            if (typeof id === 'string' && id.includes('::')) {
                const [category, status] = id.split('::');
                return { category, status };
            }
            return null;
        };

        const activeLoc = findTaskLocation(activeId);
        if (!activeLoc) return;

        let targetCategory, targetStatus, targetIndex;

        // Check if over is a container (empty column drop) or an item
        const overContainerParsed = parseContainerId(overId);

        if (overContainerParsed) {
            // Dropped on a column directly (likely empty or at end)
            targetCategory = overContainerParsed.category;
            targetStatus = overContainerParsed.status;
            targetIndex = groupedTasks[targetCategory][targetStatus].length; // Add to end
        } else {
            // Dropped on another item
            const overLoc = findTaskLocation(overId);
            if (!overLoc) return; // Should not happen

            targetCategory = overLoc.category;
            targetStatus = overLoc.status;

            // Calculate index
            const isBelowOverItem = over &&
                active.rect.current.translated &&
                active.rect.current.translated.top > over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;
            targetIndex = overLoc.index >= 0 ? overLoc.index + modifier : 0;
        }

        // Call moveTask
        moveTask(activeId, targetStatus, targetIndex, targetCategory);
    };

    return (
        <Box sx={{ maxWidth: 1400, margin: '0 auto', pb: 4 }}>
            {/* Filters */}
            {hasPermission('manager') && (
                <Card sx={{ mb: 4, boxShadow: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <FormControl sx={{ minWidth: 250 }} size="small">
                            <InputLabel>Filtrar por Usuário</InputLabel>
                            <Select
                                value={filterUserId}
                                onChange={(e) => setFilterUserId(e.target.value)}
                                label="Filtrar por Usuário"
                            >
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                {users.map((u) => (
                                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
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
                {Object.keys(groupedTasks).map(catName => (
                    <CategorySection
                        key={catName}
                        categoryName={catName}
                        tasksByStatus={groupedTasks[catName]}
                    />
                ))}
            </DndContext>
        </Box>
    );
};

export default CategoryKanban;
