// Strategy Interface (Conceptually)
// group(tasks, categories, filterUserId) -> groupedObject

export class CategoryStatusGroupingStrategy {
    group(tasks, categories, filterUserId = '') {
        const grouped = {};

        // Initialize structure
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

        // Sort by position
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
    }
}

// Example of another strategy (not used yet, but demonstrates the pattern)
export class SimpleListGroupingStrategy {
    group(tasks, categories, filterUserId = '') {
        // Just returns a flat list or grouped only by category
        // ...
        return {};
    }
}
