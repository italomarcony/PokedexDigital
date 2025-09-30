# 🐳 Guia de Uso do Docker

Este documento explica como executar a aplicação Pokédex usando Docker.

## Pré-requisitos

- Docker instalado ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose instalado (geralmente vem com Docker Desktop)

## Executando a Aplicação

### Opção 1: Usando Docker Compose (Recomendado)

Execute o seguinte comando na raiz do projeto:

```bash
docker-compose up --build
```

Este comando irá:
- Construir as imagens do backend (Flask) e frontend (Angular + Nginx)
- Criar os containers
- Iniciar os serviços

**Acessando a aplicação:**
- Frontend: http://localhost
- Backend API: http://localhost:5000/api

### Opção 2: Executando em segundo plano

Para executar os containers em background (modo detached):

```bash
docker-compose up -d --build
```

Para ver os logs:

```bash
docker-compose logs -f
```

## Parando a Aplicação

Para parar os containers:

```bash
docker-compose down
```

Para parar e remover volumes (isso apagará o banco de dados):

```bash
docker-compose down -v
```

## Construindo Imagens Individuais

### Backend (Flask API)

```bash
cd backend
docker build -t pokedex-backend .
docker run -p 5000:5000 pokedex-backend
```

### Frontend (Angular)

```bash
cd frontend
docker build -t pokedex-frontend .
docker run -p 80:80 pokedex-frontend
```

## Variáveis de Ambiente

Você pode configurar variáveis de ambiente no arquivo `docker-compose.yml`:

- `JWT_SECRET_KEY`: Chave secreta para JWT (mude em produção)
- `FLASK_APP`: Nome da aplicação Flask

## Volumes

O projeto usa volumes Docker para:
- **backend-data**: Persiste o banco de dados SQLite entre restarts
- **./backend e ./frontend**: Montados durante desenvolvimento para hot-reload

## Rede

Os containers se comunicam através da rede `pokedex-network` criada automaticamente.

## Troubleshooting

### Porta já em uso

Se as portas 80 ou 5000 estiverem em uso, você pode alterá-las no `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Frontend na porta 8080
  - "5001:5000"  # Backend na porta 5001
```

### Reconstruir imagens

Se fez alterações no código e quer reconstruir as imagens:

```bash
docker-compose up --build --force-recreate
```

### Limpar tudo

Para remover containers, redes e volumes:

```bash
docker-compose down -v
docker system prune -a
```

## Produção

Para ambiente de produção:

1. Mude a `JWT_SECRET_KEY` no docker-compose.yml
2. Configure variáveis de ambiente adequadas
3. Considere usar um banco de dados externo (PostgreSQL/MySQL)
4. Configure HTTPS com certificados SSL
5. Use um servidor WSGI adequado (Gunicorn) ao invés do servidor de desenvolvimento do Flask

## Comandos Úteis

```bash
# Ver containers rodando
docker ps

# Ver logs de um container específico
docker logs pokedex-backend
docker logs pokedex-frontend

# Entrar em um container
docker exec -it pokedex-backend sh
docker exec -it pokedex-frontend sh

# Ver uso de recursos
docker stats
```