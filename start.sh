#!/bin/bash
set -e

echo "🐕 Starting DawgPound..."

# Generate self-signed certificate if it doesn't exist
if [ ! -f certs/cert.pem ] || [ ! -f certs/key.pem ]; then
    echo "📜 Generating self-signed certificate..."
    mkdir -p certs
    openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost' 2>/dev/null
fi

# Start Docker Compose
echo "🐳 Starting Docker containers..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 3

# Show status
docker compose ps

echo ""
echo "✅ DawgPound is running!"
echo ""
echo "Local access:       https://localhost:8000"
echo "Codespaces access:  https://upgraded-palm-tree-r45xw6xvvr9vh5g94-8000.app.github.dev"
echo ""
echo "Test page:          /test/"
echo "API docs:           /admin/"
echo ""
echo "Superuser credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "To view logs: docker compose logs -f django"
echo "To stop:      docker compose down"
