const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

// Config: allowed domains (comma-separated) or default to *.edu
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : null;

function isValidEmailFormat(email) {
  // Simple, permissive email regex for validation (sufficient for MVP)
  return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

function isUniversityEmail(email) {
  if (!isValidEmailFormat(email)) return false;
  const domain = (email.split('@')[1] || '').toLowerCase().trim();
  if (!domain) return false;
  if (ALLOWED_DOMAINS) {
    const allowed = ALLOWED_DOMAINS.map((d) => d.toLowerCase().trim());
    return allowed.includes(domain);
  }
  return domain.endsWith('.edu');
}

// signup with university email: returns a verification token (demo)
router.post('/signup', (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!isUniversityEmail(email)) return res.status(403).json({ error: 'email must be a university address' });

  // prevent duplicate emails
  const existing = store.listUsers().find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'email already registered' });

  const user = {
    id: uuidv4(),
    email: email.trim().toLowerCase(),
    name: name || null,
    verified: false,
    verificationToken: uuidv4(),
    createdAt: new Date().toISOString(),
    onboarding: null,
    onboardingCompleted: false,
    role: 'user' // default role: user (can be admin or developer)
  };
  store.createUser(user);

  // In a real app we'd email the token. For MVP we return it in response.
  res.json({ message: 'signup created; verify token sent', verificationToken: user.verificationToken, userId: user.id });
});

router.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  const user = store.getUserByVerificationToken(token);
  if (!user) return res.status(404).json({ error: 'invalid token' });
  store.updateUser(user.id, { verified: true, verificationToken: null });
  res.json({ message: 'email verified', userId: user.id });
});

// Note: SSO endpoint intentionally removed for MVP (not required now).

module.exports = router;
