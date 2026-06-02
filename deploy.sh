#!/bin/bash
# deploy.sh — wdrożenie campas.pl na własnym serwerze (Debian + Docker)
set -e

echo "🚀 Wdrażanie app.campas.pl..."
...
echo "✅ app.campas.pl wdrożony! Wersja: $(docker compose exec campas python -c 'import main; print(main.app.version)' 2>/dev/null || echo 'N/A')"
echo "   Logi: docker compose logs -f campas"
echo "   Status: docker compose ps"
