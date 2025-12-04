
## 🏗️ Design Patterns Utilizados

O projeto utiliza padrões de projeto para garantir modularidade, manutenibilidade e escalabilidade.

### 1. Factory Pattern (Criacional)
**Propósito:** Encapsular a lógica de criação de objetos complexos (Tarefas), garantindo que todos os objetos sejam criados com um estado inicial consistente.
**Módulo:** `server/models/TaskFactory.js`
**Exemplo:**
```javascript
class TaskFactory {
  static createTask({ title, description, userId, category, status = 'todo' }) {
    return {
      title,
      description: description || '',
      completed: status === 'done',
      user_id: userId,
      category: category || 'Geral',
      status,
      position: 0,
      created_at: new Date().toISOString()
    };
  }
}
```

### 2. Facade Pattern (Estrutural)
**Propósito:** Fornecer uma interface simplificada para um subsistema complexo (Banco de Dados SQLite), desacoplando as rotas da API da lógica de persistência.
**Módulo:** `server/services/TaskService.js`
**Exemplo:**
```javascript
class TaskService {
  static getAllTasks(userId, role) {
    // Abstrai a query complexa com JOINs e filtros
    return new Promise((resolve, reject) => { ... });
  }
  
  static moveTask(taskId, data, user) {
    // Abstrai a transação complexa de mover e reordenar tarefas
    db.serialize(() => { ... });
  }
}
```

### 3. Strategy Pattern (Comportamental)
**Propósito:** Definir uma família de algoritmos (estratégias de agrupamento de tarefas), encapsulá-los e torná-los intercambiáveis. Isso permite mudar a forma como as tarefas são exibidas (por Categoria/Status, por Data, etc.) sem alterar o código do componente principal.
**Módulo:** `src/strategies/GroupingStrategy.js`
**Exemplo:**
```javascript
export class CategoryStatusGroupingStrategy {
  group(tasks, categories, filterUserId) {
    // Algoritmo para agrupar tarefas por Categoria > Status
    // ...
    return groupedTasks;
  }
}

// No Contexto:
const getTasksByCategoryAndStatus = () => {
  const strategy = new CategoryStatusGroupingStrategy();
  return strategy.group(tasks, categories, filterUserId);
};
```
