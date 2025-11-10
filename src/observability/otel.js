/*
  Minimal OpenTelemetry + Sentry initialization.
  - Exports a `sentry` object (may be a no-op if SENTRY_DSN not provided)
  - Starts NodeSDK with automatic instrumentation and OTLP exporter to OTEL_COLLECTOR_URL
*/
const SentryLib = require('@sentry/node');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// Sentry initialization (if DSN provided)
let sentry = null;
if (process.env.SENTRY_DSN) {
  SentryLib.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
  });
  sentry = SentryLib;
  console.log('Sentry initialized');
} else {
  // lightweight no-op capture wrapper
  sentry = { captureException: () => {} };
}

// OpenTelemetry Node SDK setup
try {
  const otlpUrl = process.env.OTEL_COLLECTOR_URL || 'http://otel-collector:4318/v1/traces';
  const traceExporter = new OTLPTraceExporter({ url: otlpUrl });

  const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  const startResult = sdk.start();
  if (startResult && typeof startResult.then === 'function') {
    startResult
      .then(() => console.log('OpenTelemetry SDK started'))
      .catch((err) => console.error('Error starting OpenTelemetry SDK', err));
  } else {
    console.log('OpenTelemetry SDK started');
  }
} catch (err) {
  console.error('Failed to initialize OpenTelemetry SDK', err);
}

module.exports = { sentry };
