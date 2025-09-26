# ToDo List com Sistema de Autenticação

Uma aplicação completa de gerenciamento de tarefas com sistema de autenticação, níveis de permissão e persistência em banco de dados SQLite.

## 🚀 Funcionalidades

### Sistema de Autenticação

- **Login e Registro** de usuários
- **JWT tokens** para autenticação segura
- **Verificação automática** de sessão

### Níveis de Permissão

- **Leitor (Reader)**: Pode ver usuários e gerenciar apenas suas próprias tarefas
- **Gerenciador (Manager)**: Pode ver usuários e alterar tarefas de todos os usuários
- **Administrador (Admin)**: Acesso total - pode gerenciar usuários, criar/editar/excluir usuários e tarefas

### Gerenciamento de Tarefas

- **Categorias**: Organize tarefas por categorias
- **CRUD completo**: Criar, editar, marcar como concluída e excluir tarefas
- **Persistência**: Todas as tarefas são salvas no banco de dados

### Gerenciamento de Usuários (Admin/Manager)

- **Visualizar** lista de usuários
- **Criar** novos usuários (Admin)
- **Editar** informações de usuários (Admin)
- **Excluir** usuários (Admin)

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React 19** - Biblioteca para interface de usuário
- **Material-UI** - Componentes de interface
- **React Router** - Navegação
- **Context API** - Gerenciamento de estado

### Backend

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite3** - Banco de dados
- **bcryptjs** - Criptografia de senhas
- **jsonwebtoken** - Autenticação JWT
- **CORS** - Cross-origin resource sharing

## 📦 Instalação

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd toDoList
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:

```env
JWT_SECRET=sua-chave-secreta-jwt-aqui
PORT=5000
```

4. **Inicie o servidor backend**

```bash
npm run server
```

5. **Em outro terminal, inicie o frontend**

```bash
npm run dev
```

## 👥 Usuários de Teste

A aplicação já vem com usuários pré-cadastrados para teste:

### Administrador

- **Email**: admin@todolist.com
- **Senha**: admin123
- **Permissões**: Total controle sobre usuários e tarefas

### Gerenciadores

- **Email**: joao@test.com
- **Senha**: 123456
- **Email**: ana@test.com
- **Senha**: 123456
- **Permissões**: Pode ver usuários e gerenciar todas as tarefas

### Leitores

- **Email**: maria@test.com
- **Senha**: 123456
- **Email**: pedro@test.com
- **Senha**: 123456
- **Permissões**: Pode ver usuários e gerenciar apenas suas próprias tarefas

## 🗄️ Estrutura do Banco de Dados

### Tabela `users`

- `id` - Chave primária
- `name` - Nome do usuário
- `email` - Email único
- `password` - Senha criptografada
- `role` - Função (reader, manager, admin)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### Tabela `tasks`

- `id` - Chave primária
- `title` - Título da tarefa
- `description` - Descrição da tarefa
- `completed` - Status de conclusão
- `user_id` - ID do usuário (chave estrangeira)
- `category` - Categoria da tarefa
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### Tabela `categories`

- `id` - Chave primária
- `name` - Nome da categoria
- `user_id` - ID do usuário (NULL para categorias globais)
- `created_at` - Data de criação

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento do frontend
- `npm run build` - Constrói a aplicação para produção
- `npm run server` - Inicia o servidor backend com nodemon
- `npm start` - Inicia o servidor backend
- `npm run lint` - Executa o linter ESLint

## 🌐 Endpoints da API

### Autenticação

- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/verify` - Verificar token

### Usuários

- `GET /api/users` - Listar usuários (Manager/Admin)
- `GET /api/users/:id` - Obter usuário específico
- `POST /api/users` - Criar usuário (Admin)
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário (Admin)

### Tarefas

- `GET /api/tasks` - Listar tarefas
- `GET /api/tasks/:id` - Obter tarefa específica
- `POST /api/tasks` - Criar tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Excluir tarefa

### Categorias

- `GET /api/tasks/categories/list` - Listar categorias
- `POST /api/tasks/categories` - Criar categoria

## 🔒 Segurança

- **Senhas criptografadas** com bcrypt
- **JWT tokens** para autenticação
- **Middleware de autorização** por níveis
- **Validação de entrada** em todas as rotas
- **CORS configurado** adequadamente

## 📱 Interface

A interface é responsiva e inclui:

- **Tela de login/registro** com validação
- **Dashboard** com gerenciamento de tarefas
- **Tabela de usuários** para administradores
- **Formulários** para criar/editar usuários e tarefas
- **Feedback visual** com notificações

## 🚀 Deploy

Para fazer deploy da aplicação:

1. **Configure as variáveis de ambiente** no servidor
2. **Execute o build** do frontend: `npm run build`
3. **Inicie o servidor** backend: `npm start`
4. **Configure um proxy** para servir os arquivos estáticos

## 📝 Notas Importantes

- O banco de dados SQLite é criado automaticamente na primeira execução
- Usuários de teste são criados automaticamente
- A aplicação suporta hot reload em desenvolvimento
- Todas as operações são assíncronas e incluem tratamento de erros
