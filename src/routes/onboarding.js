const express = require('express');
const store = require('../store');
const taxonomy = require('../mock_taxonomy');

const router = express.Router();

function requireUser(req, res, next) {
  const userId = req.header('X-User-Id');
  if (!userId) return res.status(401).json({ error: 'X-User-Id header required (demo auth)' });
  const user = store.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (!user.verified) return res.status(403).json({ error: 'email not verified' });
  req.user = user;
  next();
}

// get available taxonomy (majors/interests) — uses mock if real taxonomy blocked
router.get('/taxonomy', (req, res) => {
  res.json({ majors: taxonomy.majors, interests: taxonomy.interests });
});

// get onboarding data for user
router.get('/', requireUser, (req, res) => {
  res.json({ onboarding: req.user.onboarding || null, onboardingCompleted: req.user.onboardingCompleted });
});

// submit onboarding
router.post('/', requireUser, (req, res) => {
  const payload = req.body || {};
  const { majors, interests_hobbies, year_of_study, graduation_year, privacy } = payload;

  // validations per acceptance criteria
  if (!Array.isArray(majors) || majors.length < 1) return res.status(400).json({ error: 'at least one major required' });
  if (!Array.isArray(interests_hobbies) || interests_hobbies.length < 3) return res.status(400).json({ error: 'at least three interests/hobbies required' });
  // year_of_study and graduation_year are recommended but keep flexible

  const onboarding = {
    majors,
    interests_hobbies,
    year_of_study: year_of_study || null,
    graduation_year: graduation_year || null,
    privacy: privacy || { profileVisible: true }
  };

  const updated = store.updateUser(req.user.id, { onboarding, onboardingCompleted: true });
  res.json({ message: 'onboarding saved', onboarding, onboardingCompleted: true, userId: updated.id });
});

module.exports = router;
