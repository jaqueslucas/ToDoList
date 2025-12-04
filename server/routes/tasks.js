import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken, canManageTasks } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks (sorted by position)
router.get('/', authenticateToken, (req, res) => {
  const currentUser = req.user;
  let query, params;

  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    query = `
      SELECT t.*, u.name as user_name 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.status, t.position ASC, t.created_at DESC
    `;
    params = [];
  } else {
    query = `
      SELECT t.*, u.name as user_name 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.user_id = ? 
      ORDER BY t.status, t.position ASC, t.created_at DESC
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
    const { title, description, category = 'Geral', user_id, status = 'todo' } = req.body;
    const currentUser = req.user;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let taskUserId;
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      taskUserId = user_id || currentUser.id;
    } else {
      taskUserId = currentUser.id;
    }

    // Get max position for the status to append to the end
    db.get('SELECT MAX(position) as maxPos FROM tasks WHERE status = ?', [status], (err, row) => {
      const position = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;

      db.run(
        'INSERT INTO tasks (title, description, category, user_id, status, position) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, category, taskUserId, status, position],
        function (err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating task' });
          }

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

// Move task (Change status, position, and/or category)
router.put('/move', authenticateToken, (req, res) => {
  const { taskId, newStatus, newPosition, newCategory } = req.body;
  const currentUser = req.user;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1. Get current task info
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
      if (err || !task) {
        db.run('ROLLBACK');
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check permissions
      if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && task.user_id !== currentUser.id) {
        db.run('ROLLBACK');
        return res.status(403).json({ message: 'Permission denied' });
      }

      const oldStatus = task.status;
      const oldPosition = task.position;
      const oldCategory = task.category;

      const targetStatus = newStatus || oldStatus;
      const targetCategory = newCategory || oldCategory;

      // 2. Update positions
      const isSameColumn = oldStatus === targetStatus && oldCategory === targetCategory;

      if (isSameColumn) {
        // Reordering within same column
        if (oldPosition < newPosition) {
          // Moved down
          db.run(`
            UPDATE tasks 
            SET position = position - 1 
            WHERE status = ? AND category = ? AND position > ? AND position <= ?
          `, [targetStatus, targetCategory, oldPosition, newPosition]);
        } else {
          // Moved up
          db.run(`
            UPDATE tasks 
            SET position = position + 1 
            WHERE status = ? AND category = ? AND position >= ? AND position < ?
          `, [targetStatus, targetCategory, newPosition, oldPosition]);
        }
      } else {
        // Moving to different column (different status OR different category)
        // 1. Shift items in OLD column UP
        db.run(`
          UPDATE tasks 
          SET position = position - 1 
          WHERE status = ? AND category = ? AND position > ?
        `, [oldStatus, oldCategory, oldPosition]);

        // 2. Shift items in NEW column DOWN
        db.run(`
          UPDATE tasks 
          SET position = position + 1 
          WHERE status = ? AND category = ? AND position >= ?
        `, [targetStatus, targetCategory, newPosition]);
      }

      // 3. Update the task itself
      const completed = targetStatus === 'done';
      db.run(`
        UPDATE tasks 
        SET status = ?, category = ?, position = ?, completed = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [targetStatus, targetCategory, newPosition, completed, taskId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error updating task' });
        }

        db.run('COMMIT');
        res.json({ success: true });
      });
    });
  });
});

// Update task details
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, completed, category, user_id, status } = req.body;
    const currentUser = req.user;

    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, existingTask) => {
      if (err || !existingTask) {
        return res.status(404).json({ message: 'Task not found' });
      }

      if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && existingTask.user_id !== currentUser.id) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      let updates = [];
      let params = [];

      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
        // Sync status with completed flag if needed, or rely on status
        if (completed) {
          updates.push("status = 'done'");
        }
      }
      if (category !== undefined) { updates.push('category = ?'); params.push(category); }
      if (status !== undefined) { updates.push('status = ?'); params.push(status); }
      if (user_id !== undefined && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
        updates.push('user_id = ?'); params.push(user_id);
      }

      if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(taskId);

      const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, params, function (err) {
        if (err) return res.status(500).json({ message: 'Error updating task' });

        db.get(`SELECT t.*, u.name as user_name FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.id = ?`, [taskId], (err, task) => {
          res.json({ message: 'Task updated', task });
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

  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err || !task) return res.status(404).json({ message: 'Task not found' });

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && task.user_id !== currentUser.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Shift positions of remaining tasks in same column
    db.run(`
      UPDATE tasks 
      SET position = position - 1 
      WHERE status = ? AND position > ?
    `, [task.status, task.position]);

    db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Task deleted successfully' });
    });
  });
});

// Categories routes (unchanged)
router.get('/categories/list', authenticateToken, (req, res) => {
  const currentUser = req.user;
  let query = currentUser.role === 'admin' || currentUser.role === 'manager'
    ? 'SELECT * FROM categories ORDER BY name'
    : 'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY name';
  let params = currentUser.role === 'admin' || currentUser.role === 'manager' ? [] : [currentUser.id];

  db.all(query, params, (err, categories) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(categories);
  });
});

router.post('/categories', authenticateToken, (req, res) => {
  const { name } = req.body;
  const currentUser = req.user;
  if (!name) return res.status(400).json({ message: 'Name required' });

  const userId = currentUser.role === 'admin' ? null : currentUser.id;
  db.run('INSERT INTO categories (name, user_id) VALUES (?, ?)', [name, userId], function (err) {
    if (err) return res.status(500).json({ message: 'Error creating category' });
    res.status(201).json({ message: 'Category created', category: { id: this.lastID, name, user_id: userId } });
  });
});

router.delete('/categories/:id', authenticateToken, (req, res) => {
  const categoryId = req.params.id;
  db.run('DELETE FROM categories WHERE id = ?', [categoryId], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting category' });
    res.json({ message: 'Category deleted' });
  });
});

export default router;
