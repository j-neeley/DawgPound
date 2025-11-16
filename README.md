# DawgPound — Auth & Onboarding MVP

This repository implements the requested MVP authentication and onboarding flows for DawgPound with both Node.js and Django backend options.

## Architecture Overview

DawgPound now includes two backend implementations:
1. **Node.js/Express** (MVP prototype) - Located in `src/`
2. **Django REST Framework** (Production-ready) - Located in `backend/`

Both backends provide the same features and can run simultaneously or independently.

Features implemented (MVP):
- University email signup with verification token (demo returns token instead of sending email)
- Onboarding wizard endpoints that capture majors, interests/hobbies, year, graduation year, and privacy settings
- Validation: at least one major, and at least three interests/hobbies required to finish onboarding
- Admin stats endpoint to view onboarding completion and counts of majors/interests
- Mock taxonomy (majors/interests) to stand in for missing taxonomy service
- **Public Groups (Forums)**: Discoverable public groups that users can join, with forum threads and replies
  - Role-based group creation (admin/developer only)
  - Group categories: class_year, major, interests_activities
  - Join/leave functionality with member lists
  - Forum threads with replies
  - **Rich text support**: plain, markdown, or HTML content
  - **Attachments**: support for file attachments with virus scan tracking
  - **Moderation features**:
    - Moderator role management (add/remove moderators)
    - Pin/unpin threads
    - Lock/unlock threads (prevents replies)
    - Delete threads and replies
  - **WebSocket real-time updates**: live notifications for thread/reply creation, updates, and deletions
  - Personalized group recommendations based on major, year, interests, and group overlap
  - Search and filter groups by name, category, or tags
- **Discovery & Recommendations**: Find public groups and users based on shared interests, majors, year, and group memberships
  - **User recommendations**: Discover other users with similar profiles
  - **User search**: Search users by name or email
  - **Unified discovery feed**: Combined recommendations for groups and users (for onboarding and discovery UI)
  - Recommendation algorithm considers interests, majors, year of study, and group overlap
  - Private group chats excluded from public discovery (as required)
  - Respects blocking: blocked users are excluded from recommendations
- **Private Messaging & Group Chats**: Real-time private messaging with friends
  - **Friend request system** (send/accept/decline friend requests)
  - Friend management (list friends, remove friends)
  - User blocking functionality (blocks messaging and friend requests)
  - Create private group chats (minimum 2 friends required)
  - Real-time WebSocket messaging
  - Message notifications with mute option
  - Group chat management (rename, avatar, add/remove participants)
  - Friend and block validation (only friends can be in chats, blocked users rejected)


Important: blockers and notes
- Profile API: not available in this environment — integration points would update the Profile API after onboarding. For MVP we store onboarding locally in a JSON store (`data/db.json`).
- Taxonomy endpoints: if you have an external taxonomy service, replace `src/mock_taxonomy.js` with a real client. For now the mock provides a small list.

License note
- As requested, this repository's `package.json` does not declare a license field. If you later want to add an explicit license (MIT, Apache, etc.), add the `license` field back into `package.json` or add a `LICENSE` file.

Labels (as requested): enhancement, area:infra, area:backend, area:django, priority:P1

## Quick Start

### Option 1: Docker Compose (Recommended - All Services)

Run both Node.js and Django backends with all infrastructure:

```bash
docker-compose up --build
```

Services will be available at:
- **Frontend UI**: http://localhost:8080 (React application)
- Node.js API: http://localhost:4000
- Django API: http://localhost:8000
- Django Admin: http://localhost:8000/admin/ (admin/admin123)
- API Docs: http://localhost:8000/api/docs/
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- MinIO Console: http://localhost:9000

**Note**: The frontend UI is now integrated into the Docker Compose stack! When you run `docker-compose up`, the React application will be built and served via nginx on port 8080. API requests from the UI are automatically proxied to the Node.js backend (port 4000), and WebSocket connections work seamlessly.

### Option 2: Node.js Backend Only (MVP)

How to run (local dev):

1. Install dependencies

```bash
cd /workspaces/DawgPound
npm install
```

2. Start server

```bash
npm start
```

Server runs on http://localhost:4000 by default.

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

