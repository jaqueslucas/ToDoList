# ToDo List com Sistema de Autenticação e Kanban

Uma aplicação completa de gerenciamento de tarefas com sistema de autenticação, níveis de permissão, persistência em banco de dados SQLite e quadro Kanban interativo.

Este projeto foi desenvolvido para atender aos requisitos das disciplinas **LDDM** e **PDM2**.

## 🚀 Funcionalidades Principais

- **Autenticação Segura**: Login e registro com JWT e bcrypt.
- **Controle de Acesso (RBAC)**: Níveis de permissão (Admin, Manager, Reader).
- **Gerenciamento de Tarefas**: CRUD completo de tarefas.
- **Quadro Kanban**: Visualização e movimentação de tarefas por drag-and-drop.
- **Responsividade**: Interface adaptável para diferentes dispositivos.

---

## 📋 Atendimento aos Requisitos do Projeto

Abaixo detalhamos como cada um dos 10 pontos solicitados foi implementado, com exemplos de código.

### 1. Implementação de API
A API foi construída utilizando **Node.js** e **Express**, servindo como backend para a aplicação React. Ela gerencia rotas, middlewares e conexão com banco de dados.

**Arquivo:** `server/index.js`
```javascript
import express from 'express';
import cors from 'cors';
// ...
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Endpoints Básicos
A API expõe endpoints RESTful para manipulação de recursos. Abaixo, exemplo da rota de listagem de tarefas com filtros.

**Arquivo:** `server/routes/tasks.js`
```javascript
// Get all tasks (sorted by position)
router.get('/', authenticateToken, (req, res) => {
  const currentUser = req.user;
  // ... lógica de query baseada em permissão ...
  db.all(query, params, (err, tasks) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(tasks);
  });
});
```

### 3. Responsividade da Interface
A interface utiliza **Material-UI (MUI)** com seu sistema de Grid para garantir que o layout se adapte a telas de desktop e mobile.

**Arquivo:** `src/components/KanbanBoard.jsx`
```javascript
<Grid container spacing={3} sx={{ height: 'calc(100vh - 250px)', minHeight: 500 }}>
    {['todo', 'in_progress', 'done'].map((status) => (
        // xs={12} ocupa toda largura em mobile
        // md={4} ocupa 1/3 da largura em desktop
        <Grid item xs={12} md={4} key={status} sx={{ height: '100%' }}>
            <DroppableColumn id={status} title={COLUMN_TITLES[status]}>
                {/* ... */}
            </DroppableColumn>
        </Grid>
    ))}
</Grid>
```

### 4. Autenticação de Usuário
Implementada com **JWT (JSON Web Tokens)** para sessão stateless e **bcryptjs** para hash de senhas.

**Arquivo:** `server/routes/auth.js`
```javascript
// Login user
router.post('/login', (req, res) => {
    // ... busca usuário ...
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    // ... retorna token ...
});
```

### 5. Banco de Dados
Utilizamos **SQLite3** para persistência de dados, com tabelas relacionais para usuários e tarefas.

**Arquivo:** `server/database/init.js`
```javascript
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de Usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'reader',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      // ...
    });
  });
};
```

### 6. CRUD de Usuários
Permite a criação, leitura, atualização e exclusão de usuários, com restrições baseadas em permissões (apenas Admin pode criar/excluir outros usuários).

**Arquivo:** `server/routes/auth.js` (Exemplo de Criação)
```javascript
// Register new user
router.post('/register', async (req, res) => {
    // ... validações ...
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
            // ... resposta de sucesso ...
        }
    );
});
```

### 7. Permissões de Acesso
Middlewares protegem as rotas garantindo que apenas usuários com a role correta (Admin, Manager, Reader) acessem determinados recursos.

**Arquivo:** `server/middleware/auth.js`
```javascript
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
  };
};

// Uso na rota:
// router.delete('/:id', authenticateToken, requireRole(['admin']), ...);
```

### 8. Simulador de Kanban
Implementação de um quadro Kanban interativo utilizando `@dnd-kit/core` para funcionalidade de arrastar e soltar (drag-and-drop) tarefas entre colunas.

**Arquivo:** `src/components/KanbanBoard.jsx`
```javascript
<DndContext
    sensors={sensors}
    collisionDetection={closestCorners}
    onDragEnd={handleDragEnd}
>
    <Grid container spacing={3}>
        {/* Colunas do Kanban */}
    </Grid>
</DndContext>
```

### 9. TDD (Test Driven Development)
O projeto utiliza **Vitest** e **React Testing Library** para testes unitários e de integração, garantindo a qualidade do código.

**Arquivo:** `src/components/__tests__/Login.test.jsx`
```javascript
describe('Login Component', () => {
    it('submits form with credentials', async () => {
        renderLogin();
        
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
});
```

### 10. Design Patterns
Diversos padrões de projeto foram aplicados para melhorar a arquitetura, incluindo **Factory**, **Facade** e **Strategy**.

> 👉 **Veja a documentação completa dos padrões em: [README_PATTERNS.md](./README_PATTERNS.md)**

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19**
- **Material-UI**
- **React Router**
- **Context API**
- **Dnd-Kit** (Drag and Drop)
- **Vitest** (Testes)

### Backend
- **Node.js**
- **Express**
- **SQLite3**
- **Bcryptjs** & **JWT**

## 📦 Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone https://github.com/jaqueslucas/ToDoList.git
   cd toDoList
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o ambiente**
   Crie um arquivo `.env` na raiz:
   ```env
   JWT_SECRET=sua-chave-secreta
   PORT=5000
   ```

4. **Inicie os servidores**
   ```bash
   # Terminal 1: Backend
   npm run server

   # Terminal 2: Frontend
   npm run dev
   ```

## 👥 Usuários de Teste

| Role | Email | Senha | Permissões |
|------|-------|-------|------------|
| **Admin** | `admin@todolist.com` | `admin123` | Acesso total |
| **Manager** | `joao@test.com` | `123456` | Gerencia todas as tarefas |
| **Reader** | `maria@test.com` | `123456` | Apenas suas tarefas |

