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

Free-only policy
- This MVP uses only local code and free, open-source npm packages (Express, body-parser, cors, uuid). There are no external paid services, email providers, or cloud-hosted paid SSO integrations wired in by default. SSO is intentionally not included in this MVP; if you later want SSO integration we can add it as a free OIDC/SAML integration per your university's requirements.

License note
- As requested, this repository's `package.json` does not declare a license field. If you later want to add an explicit license (MIT, Apache, etc.), add the `license` field back into `package.json` or add a `LICENSE` file.

Labels (as requested): enhancement, area:auth, priority:P0

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
