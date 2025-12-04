import React, { createContext, useState, useEffect, useCallback } from "react";
import { useAuth } from './AuthContext';
import { CategoryStatusGroupingStrategy } from '../strategies/GroupingStrategy';

export const TaskContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const TaskProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const { user, token } = useAuth();

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/categories/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [token]);

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [token]);

  const addCategory = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        const data = await response.json();
        loadCategories(); // Recarregar para evitar duplicatas
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const editCategory = async (categoryId, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        loadCategories(); // Recarregar para atualizar
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadCategories(); // Recarregar para atualizar
        return { success: true };
      } else {
        const data = await response.json();
        // Melhorar mensagem de erro
        let message = data.message;
        if (message.includes('existing tasks')) {
          const category = categories.find(c => c.id === categoryId);
          const categoryTasks = tasks.filter(t => t.category === category?.name);
          message = `Não é possível excluir "${category?.name}". Esta categoria possui ${categoryTasks.length} tarefa(s). Remova as tarefas primeiro.`;
        }
        return { success: false, message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const addTask = async (categoryName, title, description, userId = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category: categoryName,
          user_id: userId || user.id
        })
      });

      if (response.ok) {
        loadTasks(); // Recarregar para evitar duplicatas
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Tarefa não encontrada' };

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !task.completed })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const removeTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const editTask = async (taskId, title, description) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch {
      return { success: false, message: 'Erro de conexão' };
    }
  };

  const moveTask = async (taskId, newStatus, newPosition, newCategory) => {
    // Optimistic update
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;

      const oldStatus = task.status || 'todo';
      const oldPosition = task.position;
      const oldCategory = task.category;

      const targetStatus = newStatus || oldStatus;
      const targetCategory = newCategory || oldCategory;

      // Remove task from old position
      let newTasks = prev.filter(t => t.id !== taskId);

      // Adjust positions of other tasks
      const isSameColumn = oldStatus === targetStatus && oldCategory === targetCategory;

      if (isSameColumn) {
        // Moving within same column
        newTasks = newTasks.map(t => {
          if (t.status === targetStatus && t.category === targetCategory) {
            if (oldPosition < newPosition && t.position > oldPosition && t.position <= newPosition) {
              return { ...t, position: t.position - 1 };
            }
            if (oldPosition > newPosition && t.position >= newPosition && t.position < oldPosition) {
              return { ...t, position: t.position + 1 };
            }
          }
          return t;
        });
      } else {
        // Moving to different column
        // 1. Shift items in OLD column UP
        newTasks = newTasks.map(t => {
          if (t.status === oldStatus && t.category === oldCategory && t.position > oldPosition) {
            return { ...t, position: t.position - 1 };
          }
          return t;
        });

        // 2. Shift items in NEW column DOWN
        newTasks = newTasks.map(t => {
          if (t.status === targetStatus && t.category === targetCategory && t.position >= newPosition) {
            return { ...t, position: t.position + 1 };
          }
          return t;
        });
      }

      // Add task to new position
      const updatedTask = {
        ...task,
        status: targetStatus,
        position: newPosition,
        category: targetCategory
      };
      newTasks.push(updatedTask);

      return newTasks.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        if (a.status !== b.status) return a.status.localeCompare(b.status);
        return a.position - b.position;
      });
    });

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, newStatus, newPosition, newCategory })
      });

      if (!response.ok) {
        loadTasks();
        const data = await response.json();
        return { success: false, message: data.message };
      }
      return { success: true };
    } catch {
      loadTasks();
      return { success: false, message: 'Erro de conexão' };
    }
  };

  // Group tasks by Category AND Status
  const getTasksByCategoryAndStatus = (filterUserId = '') => {
    const grouped = {};

    categories.forEach(cat => {
      grouped[cat.name] = {
        'todo': [],
        'in_progress': [],
        'done': []
      };
    });

    if (!grouped['Geral']) {
      grouped['Geral'] = { 'todo': [], 'in_progress': [], 'done': [] };
    }

    let filteredTasks = tasks;
    if (filterUserId) {
      filteredTasks = filteredTasks.filter(t => t.user_id === parseInt(filterUserId));
    }

    filteredTasks.sort((a, b) => a.position - b.position);

    filteredTasks.forEach(task => {
      const catName = task.category || 'Geral';
      const status = task.status || 'todo';

      if (!grouped[catName]) {
        grouped[catName] = { 'todo': [], 'in_progress': [], 'done': [] };
      }

      if (grouped[catName][status]) {
        grouped[catName][status].push(task);
      } else {
        grouped[catName]['todo'].push(task);
      }
    });

    return grouped;
  };

  // Legacy support
  const getTasksByCategory = (filterUserId = '') => {
    const grouped = {};
    categories.forEach(category => {
      let categoryTasks = tasks.filter(task => task.category === category.name);
      if (filterUserId) {
        categoryTasks = categoryTasks.filter(task => task.user_id === parseInt(filterUserId));
      }
      grouped[category.name] = categoryTasks;
    });
    let uncategorized = tasks.filter(task => !categories.find(cat => cat.name === task.category));
    if (filterUserId && uncategorized.length > 0) {
      uncategorized = uncategorized.filter(task => task.user_id === parseInt(filterUserId));
    }
    if (uncategorized.length > 0) {
      grouped['Geral'] = uncategorized;
    }
    return grouped;
  };

  const getAllUsers = () => {
    return users;
  };

  // Load categories and tasks when user changes
  useEffect(() => {
    if (user && token) {
      loadCategories();
      loadTasks();
      loadUsers();
    } else {
      setCategories([]);
      setTasks([]);
      setUsers([]);
    }
  }, [user, token, loadCategories, loadTasks, loadUsers]);

  return (
    <TaskContext.Provider value={{
      categories,
      tasks,
      users,
      addCategory,
      editCategory,
      deleteCategory,
      addTask,
      toggleTask,
      removeTask,
      editTask,
      getTasksByCategory,
      getTasksByCategoryAndStatus,
      getAllUsers,
      loadTasks,
      moveTask
    }}>
      {children}
    </TaskContext.Provider>
  );
};