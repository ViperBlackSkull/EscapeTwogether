# EscapeTwogether - Deployment Guide

This guide covers deploying EscapeTwogether to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Security](#security)

## Prerequisites

- Node.js 20+ LTS
- Docker and Docker Compose (for containerized deployment)
- Domain name with SSL certificate (for production)
- Minimum server requirements: 2 CPU cores, 4GB RAM

## Environment Setup

### Environment Variables

Create a `.env.production` file:

```bash
# Frontend
NODE_ENV=production
PORT=3000
VITE_BACKEND_URL=https://api.your-domain.com

# Backend
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Session Management
SESSION_SECRET=your-super-secret-key-change-this
SESSION_MAX_AGE=86400000

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/escapetogether

# Monitoring (optional)
SENTRY_DSN=https://your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

## Docker Deployment

### Quick Start

1. **Build and start containers:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **View logs:**

```bash
docker-compose logs -f
```

3. **Stop containers:**

```bash
docker-compose down
```

### Production Build

Build production images:

```bash
docker-compose -f docker-compose.prod.yml build
```

Run with automatic restart:

```bash
docker-compose -f docker-compose.prod.yml up -d --restart unless-stopped
```

### Scaling

Scale frontend backend services:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale frontend=3 --scale backend=2
```

## Manual Deployment

### Frontend Deployment

1. **Install dependencies:**

```bash
npm ci
```

2. **Build production bundle:**

```bash
npm run build
```

3. **Preview build:**

```bash
npm run preview
```

4. **Deploy to static hosting:**

The `build/` directory can be deployed to:
- Vercel: `vercel deploy --prod`
- Netlify: `netlify deploy --prod`
- AWS S3 + CloudFront
- GitHub Pages

### Backend Deployment

1. **Install dependencies:**

```bash
cd server
npm ci
```

2. **Build TypeScript:**

```bash
npm run build
```

3. **Start server:**

```bash
NODE_ENV=production PORT=3001 npm start
```

4. **Use process manager (PM2):**

```bash
npm install -g pm2
pm2 start dist/index.js --name escapetogether-api
pm2 save
pm2 startup
```

## Cloud Deployment

### AWS Deployment

#### Using EC2

1. Launch EC2 instance (Ubuntu 20.04 LTS)
2. Install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```
3. Clone repository and deploy:
```bash
git clone <your-repo>
cd EscapeTwogether
docker-compose -f docker-compose.prod.yml up -d
```

#### Using ECS

1. Create ECR repository
2. Push Docker images
3. Create ECS task definition
4. Configure load balancer
5. Deploy service

### Google Cloud Platform

#### Using Cloud Run

1. Build and push container:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/frontend
```

2. Deploy:
```bash
gcloud run deploy frontend --image gcr.io/PROJECT_ID/frontend --platform managed
```

### Azure Deployment

#### Using Container Instances

```bash
az container create \
  --resource-group escapetogether-rg \
  --name frontend \
  --image escapetogether/frontend:latest \
  --ports 80 443
```

## Performance Optimization

### Build Optimizations

The production build includes:
- Code splitting and lazy loading
- Tree shaking to remove unused code
- Minification with Terser
- Asset optimization (WebP images, compressed assets)
- Source map generation for debugging

### CDN Configuration

For best performance, serve static assets through a CDN:

1. Upload `build/` directory to CDN
2. Configure cache headers:
```
Cache-Control: public, max-age=31536000, immutable
```
3. Enable Gzip/Brotli compression

### Database Optimization

If using a database:
- Enable connection pooling
- Configure read replicas
- Set up proper indexes
- Use Redis for session storage

### Caching Strategy

- Static assets: 1 year cache
- API responses: 5-minute cache
- HTML documents: No cache (must-revalidate)

## Monitoring

### Health Checks

Frontend health: `GET /health`
Backend health: `GET /api/health`

### Application Monitoring

Integrate with monitoring services:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for user analytics
- **DataDog** for infrastructure monitoring

### Logging

Logs are stored in `/app/logs`:
- `access.log` - HTTP access logs
- `error.log` - Application errors
- `combined.log` - All logs

Configure log rotation:

```bash
# /etc/logrotate.d/escapetogether
/app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        docker-compose exec backend kill -USR1 1
    endscript
}
```

## Security

### SSL/TLS Configuration

Use Certbot for Let's Encrypt certificates:

```bash
sudo certbot --nginx -d your-domain.com
```

### Security Headers

Configure Nginx with security headers:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Rate Limiting

Configure rate limiting in backend:
- 100 requests per 15 minutes per IP
- WebSocket connections: 10 per IP
- Room creation: 5 per hour per IP

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs
docker-compose ps
```

**High memory usage:**
- Check resource limits in docker-compose.yml
- Scale services horizontally
- Enable memory profiling

**Slow performance:**
- Check CDN configuration
- Verify cache headers
- Monitor database queries
- Check network latency

### Backup Strategy

1. **Database backups:** Daily automated backups
2. **Static assets:** Stored in CDN with versioning
3. **Configuration:** Version controlled
4. **Logs:** 14-day retention

### Rollback Procedure

```bash
# Docker deployment
docker-compose down
docker pull escapetogether/backend:previous-version
docker-compose up -d

# Manual deployment
git checkout <previous-tag>
npm run build
pm2 restart escapetogether-api
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.escapetogether.com
- Email: support@escapetogether.com
