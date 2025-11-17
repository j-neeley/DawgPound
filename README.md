# DawgPound — Django Backend

This repository implements a simplified Django-only backend for DawgPound social platform.

## Architecture Overview

**Django REST Framework** backend located in `backend/` directory.
- SQLite database for development (configurable to PostgreSQL via environment variable)
- Session-based authentication
- Simple signup/login system

## Features

Currently implemented:
- **User Authentication**: Simple signup and login with session-based auth
- **User Models**: Users, Friend Requests, Friendships
- **Group Models**: Groups, Group Memberships
- **Forum Models**: Threads and Replies
- **Messaging Models**: Private Chats, Chat Messages
- **Moderation Models**: Reported content tracking

All models are defined and migrations are ready. API endpoints are minimal (signup/login/logout/me) for testing purposes.


## Quick Start

### Running Django Backend

1. Navigate to backend directory:

```bash
cd backend
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Run migrations:

```bash
python manage.py migrate
```

4. Create a superuser (optional):

```bash
python manage.py createsuperuser
```

5. Start the development server:

```bash
python manage.py runserver
```

Django API will be available at:
- **API Endpoints**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

### Testing

Run the test suite:

```bash
cd backend
pytest
```

Run with coverage:

```bash
pytest --cov=. --cov-report=html
```

Test the authentication endpoints:

```bash
python test_auth.py
```

Quick demo flow (curl examples):

- Signup (returns verificationToken for demo):

  POST /auth/signup { "email": "student@university.edu", "name": "Jane" }

- Verify:

  POST /auth/verify { "token": "<verificationToken>" }

- Complete onboarding (use X-User-Id returned from signup/verify):

  POST /onboarding with header X-User-Id and body containing majors and interests_hobbies (at least 1 major & 3 interests)

- Admin stats (set environment ADMIN_TOKEN or pass X-Admin-Token header matching ADMIN_TOKEN env):

  GET /admin/stats

Public Groups API endpoints:

- Create a group (admin/developer only):

  POST /groups { "name": "CS Students", "category": "major", "tags": ["Computer Science"], "description": "..." }
  
- List/search groups:

  GET /groups?search=programming&category=major&tag=Computer%20Science
  
- Get recommended groups:

  GET /groups/recommendations
  
- Join a group:

  POST /groups/:id/join
  
- Leave a group:

  POST /groups/:id/leave
  
- Get group members:

  GET /groups/:id/members
  
- Create a forum thread (with optional rich text and attachments):

  POST /groups/:id/threads { 
    "title": "Welcome", 
    "content": "...",
    "contentType": "plain|markdown|html",
    "attachments": [
      {
        "url": "https://...",
        "filename": "doc.pdf",
        "mimeType": "application/pdf",
        "size": 1024,
        "virusScanned": true
      }
    ]
  }
  
- List threads (pinned threads appear first):

  GET /groups/:id/threads
  
- Get thread details:

  GET /groups/:id/threads/:threadId
  
- Reply to thread (with optional rich text and attachments):

  POST /groups/:id/threads/:threadId/replies { 
    "content": "...",
    "contentType": "plain|markdown|html",
    "attachments": [...]
  }

Moderation endpoints (moderator/admin/creator only):

- Add/remove moderators:

  POST /groups/:id/moderators { "userId": "..." }
  DELETE /groups/:id/moderators/:userId

- Pin/unpin thread:

  PATCH /groups/:id/threads/:threadId/pin { "pinned": true|false }

- Lock/unlock thread:

  PATCH /groups/:id/threads/:threadId/lock { "locked": true|false }

- Delete thread:

  DELETE /groups/:id/threads/:threadId

- Delete reply:

  DELETE /groups/:id/threads/:threadId/replies/:replyId

WebSocket real-time updates:

- Connect to ws://localhost:4000/ws?userId=...&groupId=...
- Receives real-time notifications for:
  - thread_created
  - reply_created
  - thread_updated (pin/lock status)
  - thread_deleted
  - reply_deleted

Discovery & Recommendations API endpoints:

- Get recommended users (based on interests, majors, year, and group overlap):

  GET /users/recommendations

- Search for users by name or email:

  GET /users/search?q=alice

- Get unified discovery feed (groups + users for onboarding/discovery UI):

  GET /discovery/feed

Friends & Blocking API endpoints:

Friend Request Flow:

- Send a friend request:

  POST /friends/requests { "userId": "user-id-here" }

- List incoming friend requests:

  GET /friends/requests/incoming

- List outgoing friend requests:

  GET /friends/requests/outgoing

- Accept a friend request:

  POST /friends/requests/:requestId/accept

- Decline a friend request:

  POST /friends/requests/:requestId/decline

- Cancel an outgoing friend request:

  DELETE /friends/requests/:requestId

Friends Management:

- Add a friend (instant, for backward compatibility):

  POST /friends { "friendId": "user-id-here" }

- List friends:

  GET /friends

- Remove a friend:

  DELETE /friends/:friendId

Blocking:

- Block a user (removes friendship and cancels pending requests):

  POST /friends/block { "userId": "user-id-here" }

- List blocked users:

  GET /friends/blocked

- Unblock a user:

  DELETE /friends/block/:userId

Private Chats API endpoints:

- Create a private group chat (with 2+ friends):

  POST /chats { "name": "My Group", "avatar": "https://...", "participantIds": ["user-2", "user-3"] }

- List user's chats:

  GET /chats

- Get chat details:

  GET /chats/:chatId

- Update chat (rename, change avatar):

  PATCH /chats/:chatId { "name": "New Name", "avatar": "https://..." }

- Add participant to chat:

  POST /chats/:chatId/participants { "userId": "user-id-here" }

- Remove participant from chat:

  DELETE /chats/:chatId/participants/:userId

- Mute/unmute chat:

  POST /chats/:chatId/mute { "mute": true }

- Send a message (REST):

  POST /chats/:chatId/messages { "content": "Hello!" }

- Get messages:

  GET /chats/:chatId/messages?limit=100

WebSocket events (connect to ws://localhost:4000):

- Authenticate:

  emit: authenticate { "userId": "user-id-here" }
  
- Join a chat room:

  emit: join_chat { "chatId": "chat-id-here" }

- Send a message:

  emit: send_message { "chatId": "chat-id-here", "content": "Hello!" }

- Receive new message:

  on: new_message { id, chatId, authorId, authorName, content, createdAt }

- Receive notification (if not muted):

  on: message_notification { chatId, chatName, message }

- Send typing indicator:

  emit: typing { "chatId": "chat-id-here" }

- Stop typing:

  emit: stop_typing { "chatId": "chat-id-here" }

- See who's typing:

  on: user_typing { chatId, userId, userName }
  on: user_stop_typing { chatId, userId }

Next steps / integration suggestions:
- Replace the simple JSON store with your real Profile API writes after onboarding completes.
- Hook up a real email provider (or university SSO) for verification steps.
- Add JWT-based authentication and secure endpoints.
- Add a UI onboarding wizard that calls the /onboarding endpoints.
- **Virus scanning**: Integrate with ClamAV or similar service to scan attachments before accepting uploads. Currently the API accepts a `virusScanned` flag but doesn't perform actual scanning.
- **File uploads**: Implement actual file upload endpoint that integrates with S3/MinIO and virus scanning service.
- **WebSocket authentication**: Currently uses query params for demo purposes; implement JWT-based WebSocket auth for production.

## Django Backend

The Django backend provides a production-ready, scalable alternative to the Node.js MVP with the following advantages:

### Features
- **Django REST Framework** for robust API development
- **PostgreSQL** database with proper migrations
- **JWT Authentication** via djangorestframework-simplejwt
- **Django Channels** for WebSocket support (real-time features)
- **Celery** for async task processing
- **Redis** for caching and message broker
- **Admin Interface** for content management
- **API Documentation** via drf-spectacular (Swagger/ReDoc)
- **Comprehensive Testing** with pytest
- **Database Models** for all features (users, groups, forums, messaging, moderation)

### Quick Start - Django

1. **View documentation**: See [DJANGO_SETUP.md](./DJANGO_SETUP.md) for comprehensive setup guide

2. **Run with Docker Compose**:
```bash
docker-compose up django postgres redis
```

3. **Access Django services**:
   - API: http://localhost:8000
   - Admin: http://localhost:8000/admin/ (admin/admin123)
   - API Docs: http://localhost:8000/api/docs/

4. **Run locally without Docker**:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

### Django API Endpoints

See full API documentation at http://localhost:8000/api/docs/ or refer to [DJANGO_SETUP.md](./DJANGO_SETUP.md)

Key endpoints:
- `POST /api/token/` - Obtain JWT token
- `POST /api/auth/signup/` - User registration
- `GET /api/groups/` - List groups
- `POST /api/groups/{id}/join/` - Join group
- `GET /api/forums/groups/{id}/threads/` - List forum threads
- `POST /api/messages/chats/` - Create private chat

### Testing Django Backend

```bash
cd backend
pytest
```

### Django Apps Structure

- **users**: User management, authentication, friends
- **groups**: Public groups and communities
- **forums**: Forum threads and replies
- **messaging**: Private chats and messages
- **moderation**: Moderation tools and logs
- **core**: Shared utilities

Infra & observability (MVP)
----------------------------

This repo now includes an MVP infra scaffold to support scalable, observable deployments:

- S3-compatible storage: MinIO (via docker-compose)
- Redis: for caching and Celery broker
- **Django Backend**: Production-ready REST API with PostgreSQL
- **Celery**: Async task processing (configured for Django)
- OpenTelemetry Collector for traces and metrics
- Prometheus + Grafana for metrics and dashboards
- Sentry (integrated in code; provide SENTRY_DSN at runtime)

How to run the infra locally (MVP):

1. Start the infra with docker-compose:

```bash
docker-compose up --build
```

2. Services will be available:
   - **Frontend UI**: http://localhost:8080
   - Node.js API: http://localhost:4000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000
   - MinIO Console: http://localhost:9000 (user/minioadmin)

### Running Frontend in Docker

The React frontend is now fully integrated into the Docker Compose stack. The frontend service:
- **Builds** the React application during `docker-compose up --build`
- **Serves** static files via nginx
- **Proxies** API requests to the Node.js backend at `/api/*` → `http://web:4000/`
- **Proxies** WebSocket connections at `/ws` → `http://web:4000/ws`
- **Runs** on port 8080 (avoiding conflicts with Grafana on port 3000)

To run just the frontend service:
```bash
docker-compose up --build frontend web redis minio
```

To rebuild only the frontend:
```bash
docker-compose up --build frontend
```

The frontend Dockerfile uses a multi-stage build:
1. **Build stage**: Compiles TypeScript and builds React app with Vite
2. **Serve stage**: Serves static files with nginx

Note: In the development environment, you can still run the frontend locally with `npm run dev` in the `frontend/` directory for hot-reloading.


Configuration & environment
- To enable Sentry, set SENTRY_DSN in the environment or GitHub Actions secrets.
- OTEL_COLLECTOR_URL defaults to `http://otel-collector:4318/v1/traces` when running under docker-compose.

Milestone: MVP
- The files added create an MVP infra surface that satisfies the acceptance criteria for an initial rollout:
  - S3-compatible storage (MinIO)
  - Redis broker available for Celery
  - OTEL collector + Prometheus metrics + Grafana
  - Sentry initialization in the app
  - CI workflow that runs tests and builds a Docker image

Next steps (recommended):
- Add an actual Django project or other worker image into the `django` and `celery` services and wire Celery with Redis and broker/backend settings.
- Add a production-ready object store (AWS S3) credentials in CI/CD and a deployment job to push images to your cluster.
- Harden Sentry and OTEL sampling, add RBAC and secrets management for Grafana/Prometheus.

