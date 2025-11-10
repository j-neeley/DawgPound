# DawgPound — Auth & Onboarding MVP

This small demo implements the requested MVP authentication and onboarding flows for DawgPound. It's intentionally minimal and self-contained so you can run it locally.

Features implemented (MVP):
- University email signup with verification token (demo returns token instead of sending email)
- Onboarding wizard endpoints that capture majors, interests/hobbies, year, graduation year, and privacy settings
- Validation: at least one major, and at least three interests/hobbies required to finish onboarding
- Admin stats endpoint to view onboarding completion and counts of majors/interests
- Mock taxonomy (majors/interests) to stand in for missing taxonomy service


Important: blockers and notes
- Profile API: not available in this environment — integration points would update the Profile API after onboarding. For MVP we store onboarding locally in a JSON store (`data/db.json`).
- Taxonomy endpoints: if you have an external taxonomy service, replace `src/mock_taxonomy.js` with a real client. For now the mock provides a small list.

License note
- As requested, this repository's `package.json` does not declare a license field. If you later want to add an explicit license (MIT, Apache, etc.), add the `license` field back into `package.json` or add a `LICENSE` file.

Labels (as requested): enhancement, area:infra, priority:P1

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

Next steps / integration suggestions:
- Replace the simple JSON store with your real Profile API writes after onboarding completes.
- Hook up a real email provider (or university SSO) for verification steps.
- Add JWT-based authentication and secure endpoints.
- Add a UI onboarding wizard that calls the /onboarding endpoints.

Infra & observability (MVP)
----------------------------

This repo now includes an MVP infra scaffold to support scalable, observable deployments:

- S3-compatible storage: MinIO (via docker-compose)
- Redis: for caching and Celery broker
- Celery placeholders and a Django placeholder service (for future worker-based async processing)
- OpenTelemetry Collector for traces and metrics
- Prometheus + Grafana for metrics and dashboards
- Sentry (integrated in code; provide SENTRY_DSN at runtime)

How to run the infra locally (MVP):

1. Start the infra with docker-compose:

```bash
docker-compose up --build
```

2. The Node web app will be available on http://localhost:4000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000
   - MinIO Console: http://localhost:9000 (user/minioadmin)

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

