# 🚀 Instruções para Testar a Aplicação

## ✅ Sistema Implementado com Sucesso!

Sua aplicação ToDo List com sistema de autenticação e gerenciamento de usuários está **100% funcional**!

## 🎯 Como Testar

### 1. Iniciar a Aplicação

**Terminal 1 - Backend:**

```bash
npm run server
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

### 2. Acessar a Aplicação

Abra seu navegador em: `http://localhost:5173`

## 👥 Usuários de Teste Criados

### 🔑 Administrador (Acesso Total)

- **Email:** `admin@todolist.com`
- **Senha:** `admin123`
- **Pode:** Gerenciar usuários, criar/editar/excluir usuários, gerenciar todas as tarefas

### 👨‍💼 Gerenciadores (Acesso a Tarefas)

- **Email:** `joao@test.com`
- **Senha:** `123456`
- **Email:** `ana@test.com`
- **Senha:** `123456`
- **Podem:** Ver usuários, gerenciar tarefas de todos os usuários

### 👤 Leitores (Acesso Limitado)

- **Email:** `maria@test.com`
- **Senha:** `123456`
- **Email:** `pedro@test.com`
- **Senha:** `123456`
- **Podem:** Ver usuários, gerenciar apenas suas próprias tarefas

## 🧪 Cenários de Teste

### Teste 1: Login como Administrador

1. Faça login com `admin@todolist.com` / `admin123`
2. Verifique que aparece "Administrador" no header
3. Clique em "Gerenciar Usuários" no menu
4. Teste criar um novo usuário
5. Teste editar um usuário existente
6. Teste excluir um usuário (exceto o próprio admin)

### Teste 2: Login como Gerenciador

1. Faça login com `joao@test.com` / `123456`
2. Verifique que aparece "Gerenciador" no header
3. Clique em "Gerenciar Usuários" - deve conseguir ver a lista
4. Tente criar usuário - deve aparecer erro (apenas admin pode)
5. Volte ao dashboard e teste criar/editar tarefas

### Teste 3: Login como Leitor

1. Faça login com `maria@test.com` / `123456`
2. Verifique que aparece "Leitor" no header
3. Clique em "Gerenciar Usuários" - deve aparecer erro de permissão
4. Teste criar tarefas - devem ser associadas ao usuário logado
5. Teste marcar tarefas como concluídas

### Teste 4: Sistema de Tarefas

1. Faça login com qualquer usuário
2. Crie uma nova categoria
3. Adicione tarefas na categoria
4. Teste editar tarefas (duplo clique)
5. Teste marcar como concluída
6. Teste excluir tarefas

### Teste 5: Registro de Novo Usuário

1. Na tela de login, clique em "Registrar"
2. Preencha os dados (será criado como "Leitor")
3. Faça login com o novo usuário
4. Verifique as permissões limitadas

## 🔍 Verificações de Segurança

### ✅ Autenticação

- Tokens JWT funcionando
- Sessões persistem após refresh
- Logout remove token

### ✅ Autorização

- Leitores só veem suas tarefas
- Gerenciadores veem todas as tarefas
- Apenas Admin pode gerenciar usuários
- Middleware de permissões funcionando

### ✅ Persistência

- Banco SQLite criado automaticamente
- Dados persistem entre reinicializações
- Usuários de teste criados automaticamente

## 🎉 Funcionalidades Implementadas

### ✅ Sistema de Autenticação

- [x] Login/Registro
- [x] JWT tokens
- [x] Verificação de sessão
- [x] Logout

### ✅ Níveis de Permissão

- [x] Leitor (reader)
- [x] Gerenciador (manager)
- [x] Administrador (admin)
- [x] Middleware de autorização

### ✅ CRUD de Usuários

- [x] Listar usuários
- [x] Criar usuários (Admin)
- [x] Editar usuários
- [x] Excluir usuários (Admin)

### ✅ Sistema de Tarefas

- [x] Criar/editar/excluir tarefas
- [x] Categorias
- [x] Marcar como concluída
- [x] Permissões por usuário

### ✅ Interface

- [x] Tela de login/registro
- [x] Dashboard de tarefas
- [x] Gerenciamento de usuários
- [x] Header com informações do usuário
- [x] Notificações de feedback

### ✅ Backend

- [x] API REST completa
- [x] Banco SQLite
- [x] Criptografia de senhas
- [x] Validações
- [x] Tratamento de erros

## 🚨 Solução de Problemas

### Servidor não inicia

```bash
# Verifique se a porta 5000 está livre
netstat -an | findstr :5000
```

### Erro de conexão no frontend

- Verifique se o backend está rodando na porta 5000
- Verifique o console do navegador para erros CORS

### Erro de banco de dados

- O arquivo `server/database/todolist.db` é criado automaticamente
- Se houver problemas, delete o arquivo e reinicie o servidor

## 📝 Notas Finais

- **Banco de dados:** SQLite (arquivo: `server/database/todolist.db`)
- **Porta backend:** 5000
- **Porta frontend:** 5173 (Vite)
- **Tokens JWT:** Expiração de 24 horas
- **Senhas:** Criptografadas com bcrypt

**A aplicação está pronta para uso! 🎉**
