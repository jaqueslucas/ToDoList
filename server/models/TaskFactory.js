class TaskFactory {
    static createTask({ title, description, userId, category, status = 'todo', position = 0 }) {
        if (!title) {
            throw new Error('Title is required');
        }
        if (!userId) {
            throw new Error('User ID is required');
        }

        return {
            title,
            description: description || '',
            completed: status === 'done', // Sync completed with status
            user_id: userId,
            category: category || 'Geral',
            status,
            position,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
}

module.exports = TaskFactory;
