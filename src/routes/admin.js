const express = require('express');
const store = require('../store');

const router = express.Router();

// Protect with ADMIN_TOKEN env or header X-Admin-Token
function requireAdmin(req, res, next) {
  const token = req.header('X-Admin-Token') || process.env.ADMIN_TOKEN;
  if (!token || token !== process.env.ADMIN_TOKEN) return res.status(403).json({ error: 'admin token required' });
  next();
}

router.get('/stats', requireAdmin, (req, res) => {
  const users = store.listUsers();
  const total = users.length;
  const completed = users.filter((u) => u.onboardingCompleted).length;
  const incomplete = total - completed;

  const majorsCounts = {};
  const interestsCounts = {};
  users.forEach((u) => {
    if (u.onboarding && Array.isArray(u.onboarding.majors)) {
      u.onboarding.majors.forEach((m) => majorsCounts[m] = (majorsCounts[m] || 0) + 1);
    }
    if (u.onboarding && Array.isArray(u.onboarding.interests_hobbies)) {
      u.onboarding.interests_hobbies.forEach((i) => interestsCounts[i] = (interestsCounts[i] || 0) + 1);
    }
  });

  res.json({ total, completed, incomplete, majorsCounts, interestsCounts });
});

module.exports = router;
