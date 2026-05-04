---
type: reference
title: Proxmox Deployment Guide
created: 2026-05-04
tags:
  - deployment
  - proxmox
  - docker
  - ssl
related: []
---

# Proxmox Deployment Guide

Step-by-step guide for deploying EscapeTwogether to a Proxmox VPS.

## 1. Create the LXC Container or VM

### Option A: LXC Container (recommended, lower overhead)

1. In the Proxmox web UI, click **Create CT**
2. Set hostname: `escapetwogether`
3. Choose a template: **Debian 12** or **Ubuntu 22.04**
4. Set root password / SSH key
5. Allocate resources:
   - **CPU:** 2 cores
   - **RAM:** 2GB
   - **Disk:** 10GB
6. Under **Options** → **Features**, enable:
   - `nesting=1` (required for Docker)
7. Start the container

### Option B: VM

1. Create a VM with Debian 12 / Ubuntu 22.04
2. Allocate at least 2 CPU cores, 2GB RAM, 10GB disk
3. Boot and complete OS installation

## 2. Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Verify
docker --version
docker compose version
```

## 3. Clone the Repository

```bash
apt install -y git
git clone https://github.com/<your-user>/EscapeTwogether.git /opt/escapetwogether
cd /opt/escapetwogether
```

## 4. Configure Environment

```bash
cp .env.example .env
nano .env
```

Required values to set:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | Your Anthropic API key for AI features |
| `COMFYUI_URL` | URL to your ComfyUI instance (if using image generation) |
| `NODE_ENV` | Set to `production` |

## 5. Deploy with Docker Compose

### HTTP only (quick start)

```bash
docker compose -f docker-compose.proxmox.yml up -d --build
```

The game will be available on `http://<your-server-ip>:80`.

### HTTPS with Let's Encrypt

1. Point your domain DNS to the server IP (A record).

2. Get the initial certificate:

```bash
# Install certbot
apt install -y certbot

# Get certificate (replace example.com)
certbot certonly --standalone -d escape.example.com \
  --non-interactive --agree-tos -m your@email.com
```

3. Copy certificates into the volume:

```bash
docker volume create escapetwogether_ssl-certs

# Find the volume path
VOL_PATH=$(docker volume inspect escapetwogether_ssl-certs -f '{{.Mountpoint}}')

# Copy certs
cp /etc/letsencrypt/live/escape.example.com/fullchain.pem "$VOL_PATH/"
cp /etc/letsencrypt/live/escape.example.com/privkey.pem "$VOL_PATH/"
```

4. Update `nginx/nginx.conf` — replace the `server` block with an HTTPS version:

```nginx
server {
    listen 80;
    server_name escape.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name escape.example.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of the location blocks remain the same
}
```

5. Start the stack:

```bash
docker compose -f docker-compose.proxmox.yml up -d --build
```

## 6. Network Setup for External Access

### Port Forwarding (home server behind NAT)

On your router, forward port 80 (and 443 for HTTPS) to the container/VM IP.

### Reverse DNS (VPS with public IP)

If your Proxmox host has a public IP, ensure the container gets a reachable address. Options:

- **Bridge networking:** Container gets its own IP on the LAN/DMZ
- **Port forwarding on Proxmox host:**

```bash
# On Proxmox host, forward port 80/443 to the container IP
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination <container-ip>:80
iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination <container-ip>:443
```

## 7. Verify Deployment

```bash
# Check container health
docker compose -f docker-compose.proxmox.yml ps

# Test health endpoint
curl http://localhost/health

# Check nginx is proxying correctly
curl -I http://localhost/

# Check WebSocket upgrade works
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost/socket.io/?EIO=4&transport=websocket
```

## 8. Backup Strategy

### Game Session Data

Session data and generated images are stored in Docker named volumes. Back them up with:

```bash
# Using the backup script (recommended)
./scripts/backup.sh

# Manual backup
docker run --rm -v escapetwogether-sessions:/data -v $(pwd)/backups:/out \
  alpine tar czf /out/sessions-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

docker run --rm -v escapetwogether-assets:/data -v $(pwd)/backups:/out \
  alpine tar czf /out/assets-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

### Automated Daily Backups (cron)

```bash
# Add to crontab
crontab -e
# Run backup daily at 3 AM
0 3 * * * /opt/escapetwogether/scripts/backup.sh >> /var/log/escapetwogether-backup.log 2>&1
```

### Restoring from Backup

```bash
docker run --rm -v escapetwogether-sessions:/data -v $(pwd)/backups:/out \
  alpine sh -c "cd /data && tar xzf /out/sessions-<timestamp>.tar.gz"
```

## 9. Updating

```bash
cd /opt/escapetwogether
git pull
docker compose -f docker-compose.proxmox.yml up -d --build
```

The `app` container will rebuild and restart. Nginx stays running and proxies to the new container once it passes health checks.
