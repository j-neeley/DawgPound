const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');

const app = express();

// Lightweight request logger (no external deps)
app.use((req, res, next) => {
	const start = Date.now();
	res.on('finish', () => {
		const ms = Date.now() - start;
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
	});
	next();
});

app.use(cors());
// limit JSON body size to avoid accidental large payloads
app.use(bodyParser.json({ limit: '100kb' }));

app.use('/auth', authRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => res.json({ message: 'DawgPound auth-onboarding MVP running' }));

// Centralized error handler
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err && err.stack ? err.stack : err);
	if (res.headersSent) return next(err);
	res.status(500).json({ error: 'internal_server_error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
