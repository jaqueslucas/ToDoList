import React, { createContext, useState, useEffect, useCallback } from "react";
import { useAuth } from './AuthContext';

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

  // Group tasks by category for display
  const getTasksByCategory = (filterUserId = '') => {
    const grouped = {};
    
    categories.forEach(category => {
      let categoryTasks = tasks.filter(task => task.category === category.name);
      
      // Filtrar por usuário se especificado
      if (filterUserId) {
        categoryTasks = categoryTasks.filter(task => task.user_id === parseInt(filterUserId));
      }
      
      grouped[category.name] = categoryTasks;
    });
    
    // Add tasks without categories
    let uncategorized = tasks.filter(task => 
      !categories.find(cat => cat.name === task.category)
    );
    
    // Filtrar por usuário se especificado
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
      getAllUsers,
      loadTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
}; 