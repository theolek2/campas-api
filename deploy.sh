#!/bin/bash
# deploy.sh — wdrożenie campas.pl na własnym serwerze (Debian + Docker)
set -e

echo "🚀 Wdrażanie campas.pl..."

# 1. Pobierz najnowszy kod
git pull origin master

# 2. Zbuduj obraz (bez cache dla pewności czystego buildu)
docker compose build --no-cache

# 3. Uruchom nowy kontener (stary zostaje zastąpiony)
docker compose up -d

# 4. Poczekaj chwilę na start
sleep 3

# 5. Uruchom migracje Alembic
docker compose exec campas alembic upgrade head

# 6. Sprawdź zdrowie aplikacji
echo "🩺 Sprawdzam health..."
sleep 2
curl -sf http://localhost:8001/health && echo " ✅ OK" || echo " ❌ BŁĄD — sprawdź logi: docker compose logs campas"

echo ""
echo "✅ campas.pl wdrożony! Wersja: $(docker compose exec campas python -c 'import main; print(main.app.version)' 2>/dev/null || echo 'N/A')"
echo "   Logi: docker compose logs -f campas"
echo "   Status: docker compose ps"
