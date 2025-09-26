import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { authenticateToken, requireRole, canAccessUser } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin and managers only)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  const query = `
    SELECT id, name, email, role, created_at, updated_at 
    FROM users 
    ORDER BY created_at DESC
  `;

  db.all(query, [], (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(users);
  });
});

// Get user by ID
router.get('/:id', authenticateToken, canAccessUser, (req, res) => {
  const userId = req.params.id;

  db.get(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    }
  );
});

// Create new user (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, role = 'reader' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['reader', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating user' });
          }

          res.status(201).json({
            message: 'User created successfully',
            user: {
              id: this.lastID,
              name,
              email,
              role
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only, or users can update their own profile)
router.put('/:id', authenticateToken, canAccessUser, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, password } = req.body;
    const currentUser = req.user;

    // Non-admin users can only update their own profile and cannot change role
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    if (currentUser.role !== 'admin' && role && role !== currentUser.role) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, existingUser) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (existingUser) {
          return res.status(400).json({ message: 'Email already exists' });
        }

        updateUser();
      });
    } else {
      updateUser();
    }

    function updateUser() {
      let query = 'UPDATE users SET ';
      let params = [];
      let updates = [];

      if (name) {
        updates.push('name = ?');
        params.push(name);
      }

      if (email) {
        updates.push('email = ?');
        params.push(email);
      }

      if (role && currentUser.role === 'admin') {
        updates.push('role = ?');
        params.push(role);
      }

      if (password) {
        bcrypt.hash(password, 10).then(hashedPassword => {
          updates.push('password = ?');
          params.push(hashedPassword);
          updates.push('updated_at = CURRENT_TIMESTAMP');
          params.push(userId);

          const finalQuery = query + updates.join(', ') + ' WHERE id = ?';

          db.run(finalQuery, params, function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error updating user' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User updated successfully' });
          });
        });
      } else {
        if (updates.length === 0) {
          return res.status(400).json({ message: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        const finalQuery = query + updates.join(', ') + ' WHERE id = ?';

        db.run(finalQuery, params, function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error updating user' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
          }

          res.json({ message: 'User updated successfully' });
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (req.user.id === parseInt(userId)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// Get user's tasks
router.get('/:id/tasks', authenticateToken, canAccessUser, (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT t.*, u.name as user_name 
    FROM tasks t 
    JOIN users u ON t.user_id = u.id 
    WHERE t.user_id = ? 
    ORDER BY t.created_at DESC
  `;

  db.all(query, [userId], (err, tasks) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(tasks);
  });
});

export default router;
