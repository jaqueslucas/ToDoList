const db = require('../database/init');
const TaskFactory = require('../models/TaskFactory');

class TaskService {
    static getAllTasks(userId, role) {
        return new Promise((resolve, reject) => {
            let query = `
        SELECT t.*, u.name as user_name 
        FROM tasks t 
        LEFT JOIN users u ON t.user_id = u.id
      `;
            const params = [];

            if (role !== 'admin' && role !== 'manager') {
                query += ' WHERE t.user_id = ?';
                params.push(userId);
            }

            query += ' ORDER BY t.status, t.position ASC';

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static createTask(taskData) {
        return new Promise((resolve, reject) => {
            try {
                const task = TaskFactory.createTask(taskData);

                const query = `
          INSERT INTO tasks (title, description, completed, user_id, category, status, position, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

                const params = [
                    task.title,
                    task.description,
                    task.completed,
                    task.user_id,
                    task.category,
                    task.status,
                    task.position,
                    task.created_at,
                    task.updated_at
                ];

                db.run(query, params, function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...task });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    static updateTask(taskId, updates, currentUser) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
                if (err || !task) {
                    return reject(new Error('Task not found'));
                }

                if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && task.user_id !== currentUser.id) {
                    return reject(new Error('Permission denied'));
                }

                const allowedUpdates = ['title', 'description', 'completed', 'category', 'status', 'position'];
                const fields = [];
                const params = [];

                allowedUpdates.forEach(field => {
                    if (updates[field] !== undefined) {
                        fields.push(`${field} = ?`);
                        params.push(updates[field]);
                    }
                });

                if (fields.length === 0) return resolve(task);

                fields.push('updated_at = CURRENT_TIMESTAMP');

                const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
                params.push(taskId);

                db.run(query, params, function (err) {
                    if (err) reject(err);
                    else {
                        // Return updated task
                        db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, updatedTask) => {
                            if (err) reject(err);
                            else resolve(updatedTask);
                        });
                    }
                });
            });
        });
    }

    static deleteTask(taskId, currentUser) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
                if (err || !task) return reject(new Error('Task not found'));

                if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && task.user_id !== currentUser.id) {
                    return reject(new Error('Permission denied'));
                }

                db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    static moveTask(taskId, { newStatus, newPosition, newCategory }, currentUser) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
                    if (err || !task) {
                        db.run('ROLLBACK');
                        return reject(new Error('Task not found'));
                    }

                    if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && task.user_id !== currentUser.id) {
                        db.run('ROLLBACK');
                        return reject(new Error('Permission denied'));
                    }

                    const oldStatus = task.status;
                    const oldPosition = task.position;
                    const oldCategory = task.category;

                    const targetStatus = newStatus || oldStatus;
                    const targetCategory = newCategory || oldCategory;

                    // Logic to shift positions (same as before)
                    const isSameColumn = oldStatus === targetStatus && oldCategory === targetCategory;

                    if (isSameColumn) {
                        if (oldPosition < newPosition) {
                            db.run(`UPDATE tasks SET position = position - 1 WHERE status = ? AND category = ? AND position > ? AND position <= ?`,
                                [targetStatus, targetCategory, oldPosition, newPosition]);
                        } else {
                            db.run(`UPDATE tasks SET position = position + 1 WHERE status = ? AND category = ? AND position >= ? AND position < ?`,
                                [targetStatus, targetCategory, newPosition, oldPosition]);
                        }
                    } else {
                        db.run(`UPDATE tasks SET position = position - 1 WHERE status = ? AND category = ? AND position > ?`,
                            [oldStatus, oldCategory, oldPosition]);
                        db.run(`UPDATE tasks SET position = position + 1 WHERE status = ? AND category = ? AND position >= ?`,
                            [targetStatus, targetCategory, newPosition]);
                    }

                    const completed = targetStatus === 'done';

                    db.run(`UPDATE tasks SET status = ?, category = ?, position = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [targetStatus, targetCategory, newPosition, completed, taskId], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                            } else {
                                db.run('COMMIT');
                                resolve();
                            }
                        });
                });
            });
        });
    }
}

module.exports = TaskService;
