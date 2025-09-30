# 🎮 Pokédex Digital

Aplicação fullstack de Pokédex interativa desenvolvida com Angular e Flask, permitindo aos usuários explorar, favoritar e montar equipes de Pokémon.

## 📋 Sobre o Projeto

Sistema completo de gerenciamento de Pokémon com autenticação JWT, integração com a PokéAPI, e funcionalidades de favoritos e formação de equipe de batalha. O primeiro usuário cadastrado se torna administrador e pode gerenciar todos os usuários do sistema.

## 🚀 Tecnologias Utilizadas

### Frontend
- **Angular 17+** (Standalone Components)
- **TypeScript**
- **RxJS** (Reactive Programming)
- **Signals** (State Management)
- **Angular Router**

### Backend
- **Python 3.11**
- **Flask** (Web Framework)
- **SQLAlchemy** (ORM)
- **Flask-JWT-Extended** (Autenticação)
- **SQLite** (Banco de Dados)
- **Flask-CORS**

### Infraestrutura
- **Docker & Docker Compose**
- **Nginx** (Servidor Web)

## ✨ Funcionalidades

### Obrigatórias
- ✅ Listagem de todos os 1302 Pokémon da PokéAPI
- ✅ Sistema de favoritos por usuário
- ✅ Formação de equipe de batalha (máximo 6 Pokémon)
- ✅ Autenticação com JWT
- ✅ Banco de dados SQLite
- ✅ Backend Flask + Frontend Angular

### Diferenciais Implementados
- ✅ **Tela de Login e Registro** com validação
- ✅ **Filtros Avançados**:
  - Busca por nome em tempo real
  - Filtro por tipo de Pokémon (18 tipos)
  - Filtro por geração (1-9 + formas especiais)
- ✅ **Reset de Senha** sem autenticação
- ✅ **Gestão de Usuários** (apenas administrador)
  - Primeiro usuário cadastrado é admin automaticamente
  - Admin pode visualizar e deletar outros usuários
  - Proteção contra auto-deleção
  - Dados sensíveis (login/email) ocultos por segurança
- ✅ **Melhorias de UI/UX**:
  - **Cards detalhados** exibindo número da Pokédex, tipos e stats (HP, ATK, DEF, SPD)
  - **Sistema de paginação** (50 Pokémon por página) para melhor performance
  - Badges visuais para favoritos e equipe
  - Toast notifications para feedback
  - Hero banner e barra de estatísticas
  - Design responsivo com gradientes
  - Cores oficiais dos tipos de Pokémon
- ✅ **Docker** com docker-compose

## 🏗️ Estrutura do Projeto

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Configuração da aplicação Flask
│   │   ├── models.py            # Modelos do banco de dados
│   │   ├── auth.py              # Rotas de autenticação
│   │   └── pokemon.py           # Rotas de Pokémon
│   ├── Dockerfile
│   ├── requirements.txt
│   └── recreate_db.py           # Script para recriar o banco
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/          # Auth e Admin guards
│   │   │   ├── pages/           # Componentes de páginas
│   │   │   ├── services/        # Serviços (API, Auth)
│   │   │   └── ...
│   │   └── ...
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── DOCKER.md                    # Documentação do Docker
├── Requirements.md              # Requisitos do projeto
└── README.md                    # Este arquivo
```

## 🐳 Executando com Docker (Recomendado)

A forma mais rápida de executar o projeto:

```bash
docker-compose up --build
```

**Acesso:**
- Frontend: http://localhost
- Backend API: http://localhost:5000/api

Para mais detalhes sobre Docker, consulte [DOCKER.md](DOCKER.md).

## 💻 Executando Localmente (Sem Docker)

### Pré-requisitos

- Python 3.11+
- Node.js 20+
- npm

### Backend (Flask API)

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Execute a aplicação:
```bash
python -m flask run
```

A API estará disponível em http://localhost:5000

### Frontend (Angular)

1. Navegue até a pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute a aplicação:
```bash
npm start
```

O frontend estará disponível em http://localhost:4200

## 🗄️ Banco de Dados

O banco de dados SQLite é criado automaticamente na primeira execução. Se precisar recriá-lo:

```bash
cd backend
python recreate_db.py
```

**⚠️ Importante:** O primeiro usuário cadastrado será o **administrador**.

## 🔑 Sistema de Administração

- O **primeiro usuário** cadastrado automaticamente recebe privilégios de administrador
- Apenas administradores podem:
  - Acessar a área de gestão de usuários
  - Visualizar lista de usuários cadastrados
  - Deletar outros usuários (exceto a própria conta)
- Por segurança, dados sensíveis (login/email) não são expostos na listagem

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário autenticado
- `POST /api/auth/reset-password` - Reset de senha
- `GET /api/auth/users` - Listar usuários (admin)
- `DELETE /api/auth/users/:id` - Deletar usuário (admin)

### Pokémon
- `GET /api/pokemon` - Listar Pokémon (com paginação)
- `GET /api/pokemon/:id` - Detalhes de um Pokémon
- `GET /api/types` - Listar tipos de Pokémon
- `POST /api/user/pokemon` - Adicionar aos favoritos/equipe
- `DELETE /api/user/pokemon/:id` - Remover dos favoritos/equipe
- `GET /api/user/pokemon` - Listar favoritos e equipe do usuário

## 🎨 Features de Interface

- **Hero Banner** com título e descrição
- **Barra de Estatísticas** (1302 Pokémon, 18 Tipos, 9 Gerações)
- **Cards de Pokémon Detalhados**:
  - Número da Pokédex com formatação (#001, #002, etc.)
  - Imagens oficiais dos sprites
  - Tipos com cores oficiais (18 tipos diferentes)
  - Stats principais: HP, Attack, Defense, Speed
  - Badges visuais (⭐ Fav e ⚔️ Equipe)
- **Sistema de Paginação**: 50 Pokémon por página com navegação (Primeira, Anterior, Próxima, Última)
- **Filtros Interativos** por nome, tipo e geração
- **Toast Notifications** para feedback de ações
- **Design Responsivo** com gradientes laranja e roxo
- **Proteção de Rotas** com guards de autenticação e admin

## 🔒 Segurança

- Senhas hasheadas com Werkzeug
- Autenticação JWT
- Guards de proteção de rotas no frontend
- Verificação de permissões no backend
- Dados sensíveis não expostos nas APIs
- CORS configurado corretamente

## 📝 Notas

- O projeto utiliza SQLite para desenvolvimento. Para produção, considere PostgreSQL ou MySQL.
- A aplicação consome dados da [PokéAPI](https://pokeapi.co/)
- Todos os 1302 Pokémon são carregados através de requisições paralelas otimizadas
- Sistema de paginação carrega apenas 50 Pokémon por vez para melhor performance
- Detalhes dos Pokémon (stats, tipos) são carregados sob demanda e cacheados

## 👤 Autor

Desenvolvido como parte do processo seletivo para Desenvolvedor Full Stack Jr/Trainee na Kogui.

---

**Processo seletivo Kogui - Pessoa Desenvolvedora Full Stack Júnior / Trainee**