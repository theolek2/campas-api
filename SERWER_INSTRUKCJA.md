# Instrukcja wdrożenia campas.pl na własnym serwerze

## Wymagania sprzętowe
- Debian Linux (lub Ubuntu 22.04+)
- 4 GB RAM, i5 2021, 1 TB dysk
- Dostęp do internetu (Cloudflare Tunnel zamiast publicznego IP)

---

## 1. Instalacja Docker

```bash
# Jako root lub sudo
apt-get update
apt-get install -y ca-certificates curl gnupg

# Dodaj klucz Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Dodaj repozytorium
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Dodaj usera do grupy docker (opcjonalne)
usermod -aG docker $USER
```

---

## 2. Klonowanie projektu

```bash
cd /home/user/app
git clone https://github.com/twoj-user/campas-api.git
cd campas-api
```

---

## 3. Konfiguracja `.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Ustaw:
```env
DATABASE_URL=sqlite+aiosqlite:////data/db/obozlog.db
JWT_SECRET=<openssl rand -hex 64>
FRONTEND_URL=https://campas.pl
ALLOWED_ORIGINS=https://campas.pl,https://swi.campas.pl
UPLOAD_DIR=/data/uploads
DEEPSEEK_API_KEY=sk-...
JINA_API_KEY=jina_...
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_...
SMTP_FROM=noreply@campas.pl
```

> ⚠️ **JWT_SECRET** musi być IDENTYCZNY jak w `swi.campas.pl` jeśli chcesz dzielić sesje!

---

## 4. Pierwsze uruchomienie

```bash
# Zbuduj i uruchom
docker compose up -d --build

# Uruchom migracje bazy danych
docker compose exec campas alembic upgrade head

# Sprawdź health
curl http://localhost:8001/health
# → {"status":"ok","app":"campas.pl","version":"2.0.0"}
```

---

## 5. Cloudflare Tunnel (publiczny dostęp bez stałego IP)

```bash
# Zainstaluj cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb

# Zaloguj się do Cloudflare
cloudflared tunnel login

# Utwórz tunnel
cloudflared tunnel create campas

# Skonfiguruj routing
cloudflared tunnel route dns campas campas.pl

# Utwórz config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: campas
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: campas.pl
    service: http://localhost:8001
  - service: http_status:404
EOF

# Uruchom jako systemd service
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

---

## 6. Deploy (aktualizacja)

```bash
cd /home/user/app/campas-api
chmod +x deploy.sh
./deploy.sh
```

---

## 7. Współdzielenie bazy z swi.campas.pl

Oba serwisy (campas.pl i swi.campas.pl) czytają z TEGO SAMEGO pliku `obozlog.db`.

```yaml
# docker-compose.yml campas.pl:
volumes:
  - /home/user/app/obozlog/backend:/data/db   # ← ten sam katalog co swi.campas.pl

# docker-compose.yml swi.campas.pl:
volumes:
  - /home/user/app/obozlog/backend:/home/user/app/obozlog/backend
```

> **Ważne:** Każdy serwis ma swój prefix dla tabel Alembic:
> - campas.pl: `alembic_version_api`
> - swi.campas.pl: `alembic_version` (domyślny)
>
> Tabele `app_*` należą wyłącznie do campas.pl.

---

## 8. Backup

```bash
# Backup bazy co noc (dodaj do crontab)
0 3 * * * cp /home/user/app/obozlog/backend/obozlog.db /home/user/backup/obozlog_$(date +%Y%m%d).db

# Backup plików użytkowników
0 4 * * * tar -czf /home/user/backup/uploads_$(date +%Y%m%d).tar.gz /home/user/app/campas-api/data/uploads/
```

---

## 9. Przydatne komendy

```bash
# Logi na żywo
docker compose logs -f campas

# Restart
docker compose restart campas

# Wejście do kontenera
docker compose exec campas bash

# Status
docker compose ps

# Użycie RAM
docker stats campas --no-stream
```

---

## RAM usage (estymacja)
- FastAPI + Python: ~150-200 MB
- 2 workery uvicorn: ~2× 100 MB
- SQLite: < 10 MB
- **Razem: ~300-400 MB** (bezpieczne na 4 GB RAM)
