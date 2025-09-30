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
  - **Cards com Glassmorphism** (efeito de vidro fosco com backdrop-filter)
  - **Modo Escuro** (Dark Mode) com toggle e persistência no localStorage
  - **Cards detalhados** exibindo:
    - Número da Pokédex formatado (#001, #002, etc.)
    - Badge de geração do Pokémon
    - Tipos com cores oficiais (18 tipos diferentes)
    - **Barras de progresso animadas** para stats (HP, ATK, DEF, SPD)
    - **Indicador de Poder Total** (soma de todos os stats)
  - **Loading Skeletons** animados durante carregamento
  - **Sistema de paginação** (50 Pokémon por página) com transições suaves
  - **Animações e Hover Effects**:
    - Cards com zoom e elevação ao hover
    - Imagem do Pokémon rotaciona e aumenta ao hover
    - Transições suaves entre páginas e filtros
    - Shimmer effect nas barras de progresso
  - **Grid Responsivo Adaptativo**:
    - Mobile: 1 coluna
    - Tablet: 2-3 colunas
    - Desktop: 4-5 colunas
  - Badges visuais para favoritos e equipe com animação bounce
  - Toast notifications com glassmorphism
  - Hero banner e barra de estatísticas
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

- **Modo Escuro/Claro** (Dark/Light Mode):
  - Toggle flutuante no canto superior direito
  - Persistência da preferência no localStorage
  - Transições suaves entre modos
  - Paletas de cores otimizadas para cada modo

- **Hero Banner** com título e descrição
- **Barra de Estatísticas** (1302 Pokémon, 18 Tipos, 9 Gerações)

- **Cards de Pokémon com Glassmorphism**:
  - Efeito de vidro fosco (backdrop-filter: blur)
  - Gradientes sutis nas bordas
  - Número da Pokédex com formatação (#001, #002, etc.)
  - Badge de geração (Gen 1-10)
  - Imagens oficiais dos sprites com drop-shadow
  - Tipos com cores oficiais (18 tipos diferentes)
  - **Barras de progresso animadas** para stats:
    - HP (vermelho), ATK (laranja), DEF (azul), SPD (verde)
    - Efeito shimmer nas barras
    - Valores numéricos e porcentagem visual
  - Indicador de Poder Total (soma de todos os stats)
  - Badges visuais com animação bounce (⭐ Fav e ⚔️ Equipe)
  - **Hover Effects**:
    - Card eleva e aumenta levemente (translateY + scale)
    - Imagem rotaciona 5° e aumenta
    - Brilho sutil com gradiente
  - Aspect ratio fixo 3:4 para consistência

- **Loading Skeletons**: Animação de pulso durante carregamento inicial

- **Sistema de Paginação**:
  - 50 Pokémon por página
  - Navegação (Primeira, Anterior, Próxima, Última)
  - Scroll suave ao mudar de página
  - Preload de próximas páginas

- **Grid Responsivo Adaptativo**:
  - Mobile (≤768px): 1 coluna
  - Tablet (769-1024px): 2 colunas
  - Desktop (1025-1440px): 3 colunas
  - Large Desktop (≥1441px): 4 colunas

- **Filtros Interativos** por nome, tipo e geração
- **Toast Notifications** com glassmorphism e animações
- **Design Moderno** com gradientes laranja, roxo e azul
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

Desenvolvido por **Italo Marcony** como projeto de estudo e aprendizado de tecnologias fullstack modernas, com foco em Angular 17+ (Standalone Components) e Flask com autenticação JWT.

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!