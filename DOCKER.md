# Docker Setup Guide

This guide explains how to run the Accusitions API using Docker for both development and production environments.

## Overview

| Environment | Database | Docker Compose File |
|-------------|----------|---------------------|
| Development | Neon Local (ephemeral branches) | `docker-compose.dev.yml` |
| Production | Neon Cloud | `docker-compose.prod.yml` |

## Prerequisites

- Docker and Docker Compose installed
- A [Neon](https://neon.tech) account with a project created
- Neon API key and Project ID

## Getting Your Neon Credentials

1. **API Key**: Go to [Neon Console → Settings → API Keys](https://console.neon.tech/app/settings/api-keys)
2. **Project ID**: Found in your project's Settings → General
3. **Parent Branch ID**: Found in your project's Branches tab (usually your `main` branch)

---

## Development Environment

Development uses **Neon Local**, a proxy that creates ephemeral database branches. Each time you start the container, a fresh copy of your database is created from the parent branch. When you stop the container, the branch is automatically deleted.

### Setup

1. **Copy and configure environment variables:**

   ```bash
   cp .env.development .env
   ```

2. **Edit `.env` with your Neon credentials:**

   ```env
   NEON_API_KEY=your_neon_api_key_here
   NEON_PROJECT_ID=your_neon_project_id_here
   PARENT_BRANCH_ID=your_parent_branch_id_here
   JWT_SECRET=your_dev_jwt_secret
   ```

3. **Start the development environment:**

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

4. **Run database migrations (in a separate terminal):**

   ```bash
   docker compose -f docker-compose.dev.yml exec app npm run db:migrate
   ```

### Development Features

- **Hot-reloading**: Source code is mounted as a volume, changes reflect immediately
- **Ephemeral branches**: Fresh database on each container start
- **Debug logging**: `LOG_LEVEL=debug` for verbose output
- **Health checks**: Neon Local waits until ready before app starts

### Useful Commands

```bash
# Start in detached mode
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker compose -f docker-compose.dev.yml logs -f app

# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v

# Run database studio
docker compose -f docker-compose.dev.yml exec app npm run db:studio

# Access app container shell
docker compose -f docker-compose.dev.yml exec app sh
```

### Persisting Development Branches

If you want to keep your database branch after stopping the container (useful for debugging), add this to the `neon-local` service environment in `docker-compose.dev.yml`:

```yaml
DELETE_BRANCH: 'false'
```

---

## Production Environment

Production connects directly to **Neon Cloud** using your production database URL. No Neon Local proxy is used.

### Setup

1. **Set environment variables:**

   You can either use a `.env` file or inject variables directly (recommended for production).

   **Option A: Using .env file (for testing)**
   ```bash
   cp .env.production .env
   # Edit .env with your production values
   ```

   **Option B: Export environment variables (recommended)**
   ```bash
   export DATABASE_URL="postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   export JWT_SECRET="your_strong_production_secret"
   export ARCJET_KEY="your_arcjet_key"
   ```

2. **Build and start the production container:**

   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

3. **Run database migrations:**

   ```bash
   docker compose -f docker-compose.prod.yml exec app node node_modules/drizzle-kit/bin.cjs migrate
   ```

### Production Features

- **Non-root user**: App runs as unprivileged `nodejs` user
- **Health checks**: Built-in health endpoint monitoring
- **Resource limits**: CPU and memory constraints defined
- **Auto-restart**: Container restarts automatically on failure
- **Production dependencies only**: Smaller image size

### Useful Commands

```bash
# View container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart the app
docker compose -f docker-compose.prod.yml restart app

# Stop production
docker compose -f docker-compose.prod.yml down

# Check health
curl http://localhost:3000/health
```

---

## Environment Variables Reference

### Required for Development (Neon Local)

| Variable | Description |
|----------|-------------|
| `NEON_API_KEY` | Your Neon API key |
| `NEON_PROJECT_ID` | Your Neon project ID |
| `PARENT_BRANCH_ID` | Branch ID to create ephemeral copies from |

### Required for Production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full Neon Cloud connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `ARCJET_KEY` | - | Arcjet security key |

---

## How DATABASE_URL Switches Between Environments

The `DATABASE_URL` connection string format differs between environments:

**Development (Neon Local):**
```
postgres://neon:npg@neon-local:5432/neondb
```
- `neon:npg` - Fixed credentials for Neon Local
- `neon-local` - Docker service name (internal DNS)
- No SSL required (internal network)

**Production (Neon Cloud):**
```
postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```
- Real credentials from Neon Console
- Neon's serverless endpoint
- SSL required

The application's `src/config/database.js` automatically detects the environment and configures the Neon driver accordingly.

---

## Troubleshooting

### Neon Local fails to start

1. Verify your `NEON_API_KEY` is valid
2. Check that `NEON_PROJECT_ID` matches your project
3. Ensure `PARENT_BRANCH_ID` exists in your project

```bash
docker compose -f docker-compose.dev.yml logs neon-local
```

### App can't connect to database

1. Ensure Neon Local is healthy before app starts
2. Check the `DATABASE_URL` format
3. Verify network connectivity:
   ```bash
   docker compose -f docker-compose.dev.yml exec app ping neon-local
   ```

### Database migrations fail

Run migrations manually after containers are fully started:
```bash
# Development
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Production
docker compose -f docker-compose.prod.yml exec app node node_modules/drizzle-kit/bin.cjs migrate
```

### Container keeps restarting

Check logs for errors:
```bash
docker compose -f docker-compose.[dev|prod].yml logs app
```

---

## CI/CD Integration

For CI/CD pipelines, you can use the development setup for testing:

```yaml
# Example GitHub Actions
- name: Start test database
  run: |
    docker compose -f docker-compose.dev.yml up -d neon-local
    docker compose -f docker-compose.dev.yml exec -T neon-local pg_isready -h localhost -p 5432 -U neon

- name: Run tests
  run: |
    docker compose -f docker-compose.dev.yml up -d app
    docker compose -f docker-compose.dev.yml exec -T app npm test
```

---

## Security Notes

1. **Never commit `.env` files** with real credentials
2. **Use secrets management** in production (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Rotate API keys** regularly
4. **Use strong JWT secrets** in production (min 32 characters)
5. **Review resource limits** based on your workload
