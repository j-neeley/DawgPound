# DawgPound Backend

Simple Django-only backend for DawgPound university social platform.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py migrate
```

### 3. Start Development Server

```bash
python manage.py runserver
```

Server will be available at `http://localhost:8000`

## API Endpoints

### Authentication

**Signup**
```bash
POST /api/users/signup/
Content-Type: application/json

{
  "username": "youruser",
  "email": "you@example.com",
  "password": "yourpassword",
  "first_name": "Your",
  "last_name": "Name"
}
```

**Login**
```bash
POST /api/users/login/
Content-Type: application/json

{
  "username": "youruser",
  "password": "yourpassword"
}
```

**Logout**
```bash
POST /api/users/logout/
```

**Get Current User**
```bash
GET /api/users/me/
```

## Testing

Run all tests:
```bash
pytest
```

Run specific test file:
```bash
pytest users/test_api.py -v
```

Run with coverage:
```bash
pytest --cov
```

## Database

- **Development**: SQLite (`db.sqlite3`)
- **Testing**: SQLite (`test_db.sqlite3`)

To use PostgreSQL instead, set environment variable:
```bash
export USE_POSTGRES=True
export POSTGRES_DB=dawgpound
export POSTGRES_USER=your_user
export POSTGRES_PASSWORD=your_password
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

## Admin Panel

Create a superuser:
```bash
python manage.py createsuperuser
```

Access admin panel at `http://localhost:8000/admin/`

## Project Structure

```
backend/
├── dawgpound/          # Main project settings
├── users/              # User authentication & profiles
├── groups/             # Student groups
├── forums/             # Discussion forums
├── messaging/          # Direct messaging
├── moderation/         # Content moderation
└── core/               # Shared utilities
```

## Key Features

- **Simple Signup**: No email verification required (testing-only)
- **Session-based Auth**: Uses Django sessions (no JWT complexity)
- **SQLite Default**: Single-file database for simplicity
- **Django-only**: No external services (Redis/Celery/Channels)

## Development Notes

- This is a **testing-only** backend - simplified for quick student testing
- No email verification or university checks
- AllowAny permissions on signup/login for easy testing
- Use Django admin panel to manage users and content
