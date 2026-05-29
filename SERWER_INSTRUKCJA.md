# Instrukcja wdrożenia campas.pl na własnym serwerze

## Wymagania sprzętowe
- Debian Linux (lub Ubuntu 22.04+)
- 4 GB RAM, i5 2021, 1 TB dysk
- PostgreSQL 16+ na localhost
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

## 2. Baza danych PostgreSQL

Campas.pl współdzieli bazę PostgreSQL z `swi.campas.pl`. Baza powinna być już skonfigurowana przez administratora:

```
Host: localhost
Port: 5432
Baza: campas
Użytkownik: campas
```

Tabele współdzielone (`users`, `camps`, `camp_access`, `patrols`, `terrains`, `camp_invitations`, `profiles`) już istnieją — zarządza nimi swi.campas.pl.

Tabele własne campas.pl mają prefiks `API_` i są tworzone przez migracje Alembic.

---

## 3. Klonowanie projektu

```bash
cd /home/user/app
git clone https://github.com/twoj-user/campas-api.git
cd campas-api
```

---

## 4. Konfiguracja `.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Ustaw:
```env
DATABASE_URL=postgresql+asyncpg://campas:HASLO@localhost/campas
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

## 5. Pierwsze uruchomienie

```bash
# Zbuduj i uruchom
docker compose up -d --build

# Uruchom migracje bazy danych (z jawnym DATABASE_URL)
docker compose exec campas alembic upgrade head

# Sprawdź health
curl http://localhost:8001/health
# → {"status":"ok","app":"campas.pl","version":"2.0.0"}
```

---

## 6. Cloudflare Tunnel (publiczny dostęp bez stałego IP)

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

## 7. Deploy (aktualizacja)

```bash
cd /home/user/app/campas-api
chmod +x deploy.sh
./deploy.sh
```

---

## 8. Współdzielenie bazy z swi.campas.pl

Oba serwisy (campas.pl i swi.campas.pl) korzystają z tej samej bazy PostgreSQL `campas` na localhost.

> **Ważne:** Każdy serwis ma swój prefix dla tabel Alembic:
> - campas.pl: `alembic_version_api`
> - swi.campas.pl: `alembic_version` (domyślny)
>
> Tabele `API_*` należą wyłącznie do campas.pl.
> Tabele bez prefixu (`users`, `camps`, ...) są współdzielone.

---

## 9. Backup

```bash
# Backup bazy PostgreSQL co noc (dodaj do crontab)
0 3 * * * pg_dump -U campas -h localhost campas > /home/user/backup/campas_$(date +%Y%m%d).sql

# Backup plików użytkowników
0 4 * * * tar -czf /home/user/backup/uploads_$(date +%Y%m%d).tar.gz /home/user/app/campas-api/data/uploads/
```

---

## 10. Przydatne komendy

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
- PostgreSQL: zarządzany zewnętrznie
- **Razem: ~300-400 MB** (bezpieczne na 4 GB RAM)
