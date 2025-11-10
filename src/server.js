// Observability, tracing and error tracking (Sentry + OpenTelemetry)
require('./observability/otel');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const promClient = require('prom-client');

const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');

const app = express();

// Prometheus default metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// /metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
	try {
		res.set('Content-Type', promClient.register.contentType);
		res.end(await promClient.register.metrics());
	} catch (ex) {
		res.status(500).end(ex);
	}
});

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

// If required directly, export the app for tests. Start server only when run directly.
if (require.main === module) {
	app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

module.exports = app;
