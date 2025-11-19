# DawgPound Backend - Quick Start

## One-Command Startup

```bash
./start.sh
```

This will:
- Generate SSL certificates (if needed)
- Start all Docker containers
- Run migrations
- Create superuser (admin/admin123)
- Show you the access URLs

## Access Points

- **Local HTTPS**: `https://localhost:8000`
- **Codespaces HTTPS**: `https://upgraded-palm-tree-r45xw6xvvr9vh5g94-8000.app.github.dev`
- **Test Page**: `/test/` (signup/login form)
- **Admin Panel**: `/admin/` (username: admin, password: admin123)

## Manual Commands

- **Stop**: `docker compose down`
- **View logs**: `docker compose logs -f django`
- **Rebuild**: `docker compose up -d --build`

## What's Running

- **nginx** on port 8000 (HTTPS reverse proxy)
- **django** on internal port 8000 (dev server)
- **sqlite3** database in `backend/db.sqlite3`

All code changes in `backend/` are live (volume-mounted).
