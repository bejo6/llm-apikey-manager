# Docker Deployment

## Quick Start

### 1. Copy example config
```bash
cp docker-compose.example.yml docker-compose.yml
```

Edit `docker-compose.yml` if needed (change port, workers, etc.)

### 2. Build and run with Docker Compose
```bash
docker compose up -d
```

### 3. Access the app
Open http://localhost:5001

### 4. Stop the app
```bash
docker compose down
```

---

## Commands

### Build image
```bash
docker compose build
```

### Start container
```bash
docker compose up -d
```

### View logs
```bash
docker compose logs -f
```

### Restart container
```bash
docker compose restart
```

### Stop and remove container
```bash
docker compose down
```

### Stop and remove container + volumes
```bash
docker compose down -v
```

---

## Data Persistence

The `data/` directory is mounted as a volume, so your database persists even if you remove the container.

**Backup database:**
```bash
cp data/apikey.db data/apikey.db.backup
```

---

## Configuration

### Change port
Edit `docker compose.yml`:
```yaml
ports:
  - "5001:5000"  # Change 5001 to your desired port
```

### Change workers (for Raspberry Pi)
Edit `Dockerfile` CMD line:
```dockerfile
# For Raspberry Pi 3/4 (2-4 cores)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "app:app"]

# For Raspberry Pi 5 (4 cores)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "app:app"]
```

---

## Healthcheck

The container includes a healthcheck that pings the app every 30 seconds.

Check health status:
```bash
docker ps
# Look for "healthy" in STATUS column
```

---

## Troubleshooting

### Container won't start
```bash
docker compose logs
```

### Database permission issues
```bash
sudo chown -R 1000:1000 data/
```

### Rebuild after code changes
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Production Notes

- Gunicorn is used instead of Flask dev server
- 2 workers + 2 threads (adjust based on Raspberry Pi model)
- Auto-restart on failure
- Data persists in `./data` volume
- Healthcheck monitors app availability

**For external access:** Configure your router to forward port 5000 to Raspberry Pi IP, or use nginx reverse proxy with SSL.
