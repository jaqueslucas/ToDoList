import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken, canManageTasks } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks (with user filtering based on role)
router.get('/', authenticateToken, (req, res) => {
  const currentUser = req.user;
  let query, params;

  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    // Admin and managers can see all tasks
    query = `
      SELECT t.*, u.name as user_name 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `;
    params = [];
  } else {
    // Readers can only see their own tasks
    query = `
      SELECT t.*, u.name as user_name 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.user_id = ? 
      ORDER BY t.created_at DESC
    `;
    params = [currentUser.id];
  }

  db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(tasks);
  });
});

// Get task by ID
router.get('/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const currentUser = req.user;

  let query, params;

  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    query = `
      SELECT t.*, u.name as user_name 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `;
    params = [taskId];
  } else {
    query = `
      SELECT t.*, u.name as user_name 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.id = ? AND t.user_id = ?
    `;
    params = [taskId, currentUser.id];
  }

  db.get(query, params, (err, task) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  });
});

// Create new task
router.post('/', authenticateToken, canManageTasks, (req, res) => {
  try {
    const { title, description, category = 'Geral', user_id } = req.body;
    const currentUser = req.user;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Determine which user_id to use
    let taskUserId;
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      // Admin and managers can create tasks for any user
      taskUserId = user_id || currentUser.id;
    } else {
      // Readers can only create tasks for themselves
      taskUserId = currentUser.id;
    }

    // Verify user exists
    db.get('SELECT id FROM users WHERE id = ?', [taskUserId], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create task
      db.run(
        'INSERT INTO tasks (title, description, category, user_id) VALUES (?, ?, ?, ?)',
        [title, description, category, taskUserId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating task' });
          }

          // Get the created task with user info
          db.get(`
            SELECT t.*, u.name as user_name 
            FROM tasks t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.id = ?
          `, [this.lastID], (err, task) => {
            if (err) {
              return res.status(500).json({ message: 'Database error' });
            }

            res.status(201).json({
              message: 'Task created successfully',
              task
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, completed, category, user_id } = req.body;
    const currentUser = req.user;

    // First, get the current task to check permissions
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, existingTask) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!existingTask) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check permissions
      if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && 
          existingTask.user_id !== currentUser.id) {
        return res.status(403).json({ message: 'You can only update your own tasks' });
      }

      // Prepare update query
      let updates = [];
      let params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }

      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
      }

      if (category !== undefined) {
        updates.push('category = ?');
        params.push(category);
      }

      if (user_id !== undefined && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
        updates.push('user_id = ?');
        params.push(user_id);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(taskId);

      const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, params, function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error updating task' });
        }

        // Get updated task with user info
        db.get(`
          SELECT t.*, u.name as user_name 
          FROM tasks t 
          JOIN users u ON t.user_id = u.id 
          WHERE t.id = ?
        `, [taskId], (err, task) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          res.json({
            message: 'Task updated successfully',
            task
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const currentUser = req.user;

  // First, get the task to check permissions
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && 
        task.user_id !== currentUser.id) {
      return res.status(403).json({ message: 'You can only delete your own tasks' });
    }

    // Delete task
    db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ message: 'Task deleted successfully' });
    });
  });
});

// Get all categories
router.get('/categories/list', authenticateToken, (req, res) => {
  const currentUser = req.user;
  let query, params;

  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    // Admin and managers can see all categories
    query = 'SELECT * FROM categories ORDER BY name';
    params = [];
  } else {
    // Readers can see global categories and their own
    query = 'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY name';
    params = [currentUser.id];
  }

  db.all(query, params, (err, categories) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(categories);
  });
});

// Create new category
router.post('/categories', authenticateToken, (req, res) => {
  try {
    const { name } = req.body;
    const currentUser = req.user;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists for this user
    const query = currentUser.role === 'admin' 
      ? 'SELECT id FROM categories WHERE name = ?'
      : 'SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)';
    
    const params = currentUser.role === 'admin' ? [name] : [name, currentUser.id];

    db.get(query, params, (err, existingCategory) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      // Create category
      const userId = currentUser.role === 'admin' ? null : currentUser.id;
      
      db.run(
        'INSERT INTO categories (name, user_id) VALUES (?, ?)',
        [name, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating category' });
          }

          res.status(201).json({
            message: 'Category created successfully',
            category: {
              id: this.lastID,
              name,
              user_id: userId
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category
router.put('/categories/:id', authenticateToken, (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;
    const currentUser = req.user;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category exists and user has permission to edit it
    const checkQuery = currentUser.role === 'admin' 
      ? 'SELECT * FROM categories WHERE id = ?'
      : 'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)';
    
    const checkParams = currentUser.role === 'admin' ? [categoryId] : [categoryId, currentUser.id];

    db.get(checkQuery, checkParams, (err, category) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!category) {
        return res.status(404).json({ message: 'Category not found or no permission' });
      }

      // Update category
      db.run(
        'UPDATE categories SET name = ? WHERE id = ?',
        [name, categoryId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error updating category' });
          }

          res.json({
            message: 'Category updated successfully',
            category: {
              id: categoryId,
              name,
              user_id: category.user_id
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/categories/:id', authenticateToken, (req, res) => {
  try {
    const categoryId = req.params.id;
    const currentUser = req.user;

    // Check if category exists and user has permission to delete it
    const checkQuery = currentUser.role === 'admin' 
      ? 'SELECT * FROM categories WHERE id = ?'
      : 'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)';
    
    const checkParams = currentUser.role === 'admin' ? [categoryId] : [categoryId, currentUser.id];

    db.get(checkQuery, checkParams, (err, category) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!category) {
        return res.status(404).json({ message: 'Category not found or no permission' });
      }

      // Check if category has tasks
      db.get('SELECT COUNT(*) as count FROM tasks WHERE category = ?', [category.name], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (result.count > 0) {
          return res.status(400).json({ message: 'Cannot delete category with existing tasks' });
        }

        // Delete category
        db.run('DELETE FROM categories WHERE id = ?', [categoryId], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error deleting category' });
          }

          res.json({ message: 'Category deleted successfully' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
