# DawgPound Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web UI, Mobile Apps, External Services)                       │
└───────────┬─────────────────────────────────────────┬───────────┘
            │                                          │
            │ HTTP/REST                                │ WebSocket
            │                                          │
┌───────────▼──────────────────────────────────────────▼───────────┐
│                      API Gateway / Load Balancer                 │
└───────────┬──────────────────────────────────────────┬───────────┘
            │                                          │
       ┌────▼────┐                                ┌────▼────┐
       │ Node.js │                                │ Django  │
       │ Express │                                │  REST   │
       │   API   │                                │   API   │
       │  (MVP)  │                                │ (Prod)  │
       └────┬────┘                                └────┬────┘
            │                                          │
            └──────────────┬───────────────────────────┘
                          │
       ┌──────────────────┼──────────────────────────────┐
       │                  │                              │
   ┌───▼───┐      ┌───────▼──────┐              ┌───────▼──────┐
   │ Redis │      │  PostgreSQL  │              │    MinIO     │
   │       │      │   Database   │              │  (S3-compat) │
   │ Cache │      └──────────────┘              └──────────────┘
   │ &     │
   │Broker │
   └───┬───┘
       │
   ┌───▼────┐
   │ Celery │
   │ Worker │
   │ (Async)│
   └────────┘
```

## Django Backend Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     Django Application Layer                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Django Apps                              │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  Users   │  │  Groups  │  │  Forums  │  │Messaging │ │  │
│  │  │          │  │          │  │          │  │          │ │  │
│  │  │ - Auth   │  │ - Public │  │ - Threads│  │ - Chats  │ │  │
│  │  │ - Profile│  │   Groups │  │ - Replies│  │ - Messages│ │  │
│  │  │ - Friends│  │ - Members│  │ - Attach │  │ - Real-time│ │  │
│  │  │ - Onboard│  │ - Mods   │  │          │  │          │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │                                                             │  │
│  │  ┌──────────┐  ┌──────────┐                               │  │
│  │  │Moderation│  │   Core   │                               │  │
│  │  │          │  │          │                               │  │
│  │  │ - Logs   │  │ - Utils  │                               │  │
│  │  │ - Bans   │  │ - Shared │                               │  │
│  │  │ - Actions│  │          │                               │  │
│  │  └──────────┘  └──────────┘                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Django REST Framework                      │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                             │  │
│  │  • Serializers (JSON <-> Python objects)                   │  │
│  │  • ViewSets (CRUD operations)                              │  │
│  │  • Permissions (Role-based access)                         │  │
│  │  • Pagination (Efficient data loading)                     │  │
│  │  • JWT Authentication (Secure tokens)                      │  │
│  │  • API Documentation (Swagger/ReDoc)                       │  │
│  │                                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Django Channels (WebSocket)               │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                             │  │
│  │  • Chat Consumers (Real-time messaging)                    │  │
│  │  • Forum Consumers (Live thread updates)                   │  │
│  │  • Notification Consumers (Push notifications)             │  │
│  │  • Redis Channel Layer (Message routing)                   │  │
│  │                                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Celery (Async Tasks)                     │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                             │  │
│  │  • Email sending (Verification, notifications)             │  │
│  │  • File processing (Image resizing, virus scanning)        │  │
│  │  • Data aggregation (Statistics, reports)                  │  │
│  │  • Scheduled tasks (Cleanup, backups)                      │  │
│  │                                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow (JWT)

```
1. User Login
   ┌──────┐                 ┌─────────┐                ┌──────────┐
   │Client│───Credentials──▶│Django   │───Validate────▶│PostgreSQL│
   └──────┘                 │ API     │                └──────────┘
      ▲                     └─────────┘                      │
      │                          │                           │
      └────JWT Token─────────────┘◀─────User Data───────────┘

2. Authenticated Request
   ┌──────┐                 ┌─────────┐
   │Client│──JWT + Request─▶│Django   │───Verify JWT──▶Process
   └──────┘                 │ API     │                Request
      ▲                     └─────────┘
      │                          │
      └────Response───────────────┘
```

### Real-time Messaging Flow

```
┌──────┐                 ┌─────────┐               ┌───────┐
│User A│───WebSocket────▶│Django   │──Publish────▶│ Redis │
└──────┘                 │Channels │               │Channel│
                         └─────────┘               │ Layer │
                               │                   └───────┘
                               │                       │
┌──────┐                       │                       │
│User B│◀──────WebSocket───────┴───Subscribe──────────┘
└──────┘
```

## Database Schema

### Users App

```
┌─────────────────────────────────────────────────────────────┐
│                          User                                │
├─────────────────────────────────────────────────────────────┤
│ - id                                                         │
│ - username                                                   │
│ - email                                                      │
│ - university_email (unique)                                 │
│ - verification_token                                         │
│ - verified_at                                                │
│ - onboarding_completed                                       │
│ - majors (JSON)                                             │
│ - interests_hobbies (JSON)                                  │
│ - year_of_study                                              │
│ - graduation_year                                            │
│ - privacy_settings (JSON)                                   │
│ - created_at / updated_at                                    │
└─────────────────────────────────────────────────────────────┘
           │                          │
           │                          │
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│   FriendRequest      │   │     Friendship       │
├──────────────────────┤   ├──────────────────────┤
│ - from_user          │   │ - user1              │
│ - to_user            │   │ - user2              │
│ - status             │   │ - created_at         │
│ - created_at         │   └──────────────────────┘
└──────────────────────┘
```

### Groups & Forums

```
┌────────────────────────────────────────────────────────────┐
│                         Group                               │
├────────────────────────────────────────────────────────────┤
│ - id                                                        │
│ - name                                                      │
│ - description                                               │
│ - category (class_year, major, interests_activities)      │
│ - tags (JSON)                                              │
│ - creator                                                   │
│ - moderators (Many-to-Many)                                │
│ - members (Many-to-Many through GroupMembership)           │
│ - created_at / updated_at                                   │
└────────────────────────────────────────────────────────────┘
           │
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│                        Thread                               │
├────────────────────────────────────────────────────────────┤
│ - id                                                        │
│ - group (FK)                                                │
│ - author (FK)                                               │
│ - title                                                     │
│ - content                                                   │
│ - content_type (plain, markdown, html)                     │
│ - attachments (JSON)                                        │
│ - pinned / locked                                           │
│ - created_at / updated_at                                   │
└────────────────────────────────────────────────────────────┘
           │
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│                        Reply                                │
├────────────────────────────────────────────────────────────┤
│ - id                                                        │
│ - thread (FK)                                               │
│ - author (FK)                                               │
│ - content                                                   │
│ - content_type                                              │
│ - attachments (JSON)                                        │
│ - created_at / updated_at                                   │
└────────────────────────────────────────────────────────────┘
```

### Messaging

```
┌────────────────────────────────────────────────────────────┐
│                      PrivateChat                            │
├────────────────────────────────────────────────────────────┤
│ - id                                                        │
│ - name                                                      │
│ - avatar                                                    │
│ - participants (Many-to-Many through ChatParticipant)      │
│ - created_at / updated_at                                   │
└────────────────────────────────────────────────────────────┘
           │
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│                        Message                              │
├────────────────────────────────────────────────────────────┤
│ - id                                                        │
│ - chat (FK)                                                 │
│ - author (FK)                                               │
│ - content                                                   │
│ - created_at                                                │
└────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐          │
│  │  Node.js   │  │   Django   │  │   Celery    │          │
│  │  Express   │  │    Web     │  │   Worker    │          │
│  │  :4000     │  │   :8000    │  │             │          │
│  └────────────┘  └────────────┘  └─────────────┘          │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐          │
│  │PostgreSQL  │  │   Redis    │  │    MinIO    │          │
│  │   :5432    │  │   :6379    │  │    :9000    │          │
│  └────────────┘  └────────────┘  └─────────────┘          │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐          │
│  │    OTEL    │  │Prometheus  │  │   Grafana   │          │
│  │ Collector  │  │   :9090    │  │    :3000    │          │
│  └────────────┘  └────────────┘  └─────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Network Layer                                           │
│     • CORS protection                                       │
│     • HTTPS/TLS encryption                                  │
│     • Rate limiting                                         │
│                                                              │
│  2. Authentication Layer                                    │
│     • JWT tokens with expiration                            │
│     • Refresh token rotation                                │
│     • University email verification                         │
│                                                              │
│  3. Authorization Layer                                     │
│     • Role-based permissions (User, Moderator, Admin)      │
│     • Group-level permissions                               │
│     • Object-level permissions                              │
│                                                              │
│  4. Application Layer                                       │
│     • Input validation (Django forms/serializers)          │
│     • SQL injection protection (Django ORM)                │
│     • XSS protection (Content Security Policy)             │
│     • CSRF protection (Django middleware)                  │
│                                                              │
│  5. Data Layer                                              │
│     • Database encryption at rest                           │
│     • Password hashing (Django's PBKDF2)                   │
│     • Secret management (environment variables)            │
│     • Regular backups                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scaling Strategy

```
Horizontal Scaling:
┌──────────────────────────────────────────────────────────┐
│                Load Balancer (Nginx/HAProxy)             │
└────────────┬─────────────────────────────────┬───────────┘
             │                                 │
    ┌────────▼────────┐               ┌───────▼──────────┐
    │  Django Web 1   │               │  Django Web 2    │
    │   (Gunicorn)    │               │   (Gunicorn)     │
    └────────┬────────┘               └──────┬───────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
                  ┌───────▼──────┐
                  │  PostgreSQL  │
                  │  (Primary +  │
                  │   Replicas)  │
                  └──────────────┘
```

## Technology Stack Summary

### Backend
- **Django 5.2.8**: Web framework
- **Django REST Framework 3.16.1**: REST API
- **Django Channels 4.3.1**: WebSocket support
- **Celery 5.5.3**: Async task queue
- **PostgreSQL 15**: Primary database
- **Redis 7**: Cache and message broker

### Authentication & Security
- **JWT (djangorestframework-simplejwt)**: Token-based auth
- **CORS Headers**: Cross-origin protection
- **Django Auth**: Built-in authentication

### Deployment
- **Docker & Docker Compose**: Containerization
- **Gunicorn 23.0.0**: WSGI server
- **Daphne 4.2.1**: ASGI server (for Channels)

### Monitoring & Observability
- **OpenTelemetry**: Distributed tracing
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Sentry**: Error tracking

### Testing
- **Pytest 9.0.1**: Test framework
- **pytest-django 4.11.1**: Django integration
- **pytest-cov 7.0.0**: Coverage reporting
