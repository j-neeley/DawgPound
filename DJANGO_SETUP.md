# Django Backend Setup for DawgPound

This document provides setup instructions and development workflow for the Django backend.

## Overview

The DawgPound Django backend provides:
- REST API endpoints for all features
- PostgreSQL database integration
- JWT authentication
- Django Channels for WebSocket support
- Celery for async task processing
- Comprehensive admin interface
- API documentation via Swagger/ReDoc

## Architecture

```
backend/
├── dawgpound/          # Django project configuration
│   ├── settings.py     # Settings and configuration
│   ├── urls.py         # Main URL routing
│   ├── asgi.py         # ASGI config for Channels
│   ├── wsgi.py         # WSGI config
│   ├── routing.py      # WebSocket routing
│   └── celery.py       # Celery configuration
├── core/               # Core utilities and shared code
├── users/              # User management and authentication
├── groups/             # Group/community management
├── forums/             # Forum threads and replies
├── messaging/          # Private messaging
├── moderation/         # Moderation tools
├── manage.py           # Django management script
└── requirements.txt    # Python dependencies
```

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (for containerized setup)

## Installation

### Option 1: Docker Compose (Recommended)

1. Start all services:
```bash
docker-compose up --build
```

2. The Django API will be available at `http://localhost:8000`

3. Access the admin interface at `http://localhost:8000/admin/`
   - Username: `admin`
   - Password: `admin123`

4. View API documentation:
   - Swagger UI: `http://localhost:8000/api/docs/`
   - ReDoc: `http://localhost:8000/api/redoc/`
   - OpenAPI Schema: `http://localhost:8000/api/schema/`

### Option 2: Local Development

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export POSTGRES_DB=dawg
export POSTGRES_USER=dp
export POSTGRES_PASSWORD=dp
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create a superuser:
```bash
python manage.py createsuperuser
```

5. Start the development server:
```bash
python manage.py runserver 0.0.0.0:8000
```

6. For WebSocket support (Channels), use Daphne:
```bash
daphne -b 0.0.0.0 -p 8000 dawgpound.asgi:application
```

## Database Schema

### Users App
- **User**: Extended Django user model with university email, onboarding data, and privacy settings
- **FriendRequest**: Manages friend connection requests
- **Friendship**: Stores accepted friend relationships

### Groups App
- **Group**: Public groups/communities
- **GroupMembership**: Through model for group members with metadata

### Forums App
- **Thread**: Forum discussion threads within groups
- **Reply**: Replies to forum threads

### Messaging App
- **PrivateChat**: Private chat/group chat
- **ChatParticipant**: Through model for chat participants
- **Message**: Chat messages

### Moderation App
- **ModerationLog**: Audit log of moderation actions
- **UserBan**: User ban records

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Users
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/verify/` - Email verification
- `POST /api/auth/onboarding/` - Complete onboarding
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update user profile

### Groups
- `GET /api/groups/` - List groups
- `POST /api/groups/` - Create group (admin only)
- `GET /api/groups/{id}/` - Get group details
- `POST /api/groups/{id}/join/` - Join group
- `POST /api/groups/{id}/leave/` - Leave group

### Forums
- `GET /api/forums/groups/{group_id}/threads/` - List threads
- `POST /api/forums/groups/{group_id}/threads/` - Create thread
- `GET /api/forums/threads/{id}/` - Get thread details
- `POST /api/forums/threads/{id}/replies/` - Add reply

### Messaging
- `GET /api/messages/chats/` - List chats
- `POST /api/messages/chats/` - Create chat
- `GET /api/messages/chats/{id}/messages/` - Get messages
- `POST /api/messages/chats/{id}/messages/` - Send message

### Moderation
- `POST /api/moderation/threads/{id}/pin/` - Pin thread
- `POST /api/moderation/threads/{id}/lock/` - Lock thread
- `DELETE /api/moderation/threads/{id}/` - Delete thread

## WebSocket Support

Django Channels provides WebSocket support for real-time features:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat/CHAT_ID/');
```

### Events
- `chat_message` - New message in chat
- `thread_created` - New forum thread
- `reply_created` - New forum reply
- `typing` - User typing indicator

## Celery Tasks

Start Celery worker:
```bash
celery -A dawgpound worker -l info
```

Start Celery beat (for scheduled tasks):
```bash
celery -A dawgpound beat -l info
```

## Testing

Run all tests:
```bash
pytest
```

Run tests with coverage:
```bash
pytest --cov --cov-report=html
```

Run specific test file:
```bash
pytest users/tests.py
```

Run tests for specific app:
```bash
pytest users/
```

## Admin Interface

The Django admin interface is available at `/admin/` and provides:
- User management
- Group management
- Content moderation
- System configuration
- Audit logs

## Development Workflow

1. **Create a new feature**:
   - Create/update models in the appropriate app
   - Run `python manage.py makemigrations`
   - Run `python manage.py migrate`
   - Create serializers in `serializers.py`
   - Create views in `views.py`
   - Add URL patterns in `urls.py`
   - Write tests in `tests.py`

2. **Run tests**:
   ```bash
   pytest
   ```

3. **Check code quality**:
   ```bash
   # Install development tools
   pip install black flake8 isort mypy
   
   # Format code
   black .
   isort .
   
   # Lint code
   flake8 .
   mypy .
   ```

4. **Database migrations**:
   ```bash
   # Create migrations
   python manage.py makemigrations
   
   # Apply migrations
   python manage.py migrate
   
   # Show migration status
   python manage.py showmigrations
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `True` |
| `DJANGO_SECRET_KEY` | Secret key for Django | Auto-generated |
| `POSTGRES_DB` | Database name | `dawg` |
| `POSTGRES_USER` | Database user | `dp` |
| `POSTGRES_PASSWORD` | Database password | `dp` |
| `POSTGRES_HOST` | Database host | `postgres` |
| `POSTGRES_PORT` | Database port | `5432` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `CELERY_BROKER_URL` | Celery broker URL | `redis://redis:6379/0` |
| `ALLOWED_HOSTS` | Allowed hosts | `*` |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:4000,http://localhost:3000` |

## Security Considerations

1. **Production deployment**:
   - Set `DEBUG=False`
   - Use a strong `DJANGO_SECRET_KEY`
   - Configure `ALLOWED_HOSTS` properly
   - Use HTTPS
   - Set up proper CORS settings
   - Enable CSRF protection
   - Use environment variables for secrets

2. **Database**:
   - Use connection pooling
   - Regular backups
   - Proper indexing

3. **Authentication**:
   - JWT tokens with expiration
   - Refresh token rotation
   - Password validation
   - Rate limiting

## Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Celery not processing tasks
```bash
# Check Celery worker logs
docker-compose logs celery

# Restart Celery worker
docker-compose restart celery
```

### WebSocket connection issues
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## Next Steps

1. Implement API views and serializers for each app
2. Add WebSocket consumers for real-time features
3. Create Celery tasks for async processing
4. Add comprehensive test coverage
5. Set up CI/CD pipeline
6. Add API rate limiting
7. Implement caching strategy
8. Add monitoring and logging
9. Performance optimization
10. Security hardening

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
