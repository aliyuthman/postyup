# Postyup Deployment Guide

This guide covers deploying Postyup for production use in political campaigns.

## 🚀 Quick Deployment Options

### Option 1: Vercel + Railway (Recommended)
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway
- **Database**: Use Railway PostgreSQL or Supabase
- **Storage**: Supabase Storage

### Option 2: Full Supabase Stack
- **Frontend**: Vercel or Netlify
- **Backend**: Self-hosted or Railway
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage

### Option 3: Self-Hosted
- **Frontend**: Nginx + PM2
- **Backend**: PM2 + Node.js
- **Database**: Self-hosted PostgreSQL
- **Storage**: MinIO or AWS S3

## 📋 Pre-Deployment Checklist

- [ ] Supabase project created
- [ ] Storage buckets configured
- [ ] Environment variables prepared
- [ ] Domain name acquired (optional)
- [ ] SSL certificates ready

## 🔧 Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and API keys

### 2. Configure Storage Buckets

Create these buckets in Supabase Storage:

```sql
-- user-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true);

-- generated-posters bucket  
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-posters', 'generated-posters', true);

-- template-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-assets', 'template-assets', true);
```

### 3. Set Storage Policies

```sql
-- Allow public uploads to user-photos
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-photos');

-- Allow public access to generated posters
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-posters');

-- Allow public access to template assets
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'template-assets');
```

## 🚀 Frontend Deployment (Vercel)

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Select the `frontend` folder as root directory

### 2. Configure Build Settings

```bash
# Build Command
npm run build

# Output Directory
.next

# Install Command
npm install

# Root Directory
frontend
```

### 3. Environment Variables

Add these in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### 4. Deploy

Click "Deploy" and wait for build completion.

## 🖥️ Backend Deployment (Railway)

### 1. Connect Repository

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Select your repository

### 2. Configure Service

```yaml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/templates"
healthcheckTimeout = 300
restartPolicyType = "always"
```

### 3. Environment Variables

Add these in Railway dashboard:

```env
# Database (Railway will provide this)
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=3001
NODE_ENV=production
```

### 4. Database Setup

```bash
# After deployment, run migrations
railway run npm run db:push

# Seed sample templates
railway run npm run db:seed
```

## 🗄️ Database Migration

### Production Migration Script

```bash
#!/bin/bash
# migrate.sh

echo "Running database migrations..."

# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed initial data
curl -X POST $BACKEND_URL/api/templates/seed

echo "Migration complete!"
```

## 🖼️ Template Asset Setup

### 1. Prepare Template Images

For each template, create:
- `template-name-thumb.png` (270x270px)
- `template-name-preview.png` (540x540px) 
- `template-name-full.png` (1080x1080px)

### 2. Upload to Supabase Storage

```bash
# Upload template assets
supabase storage-api upload template-assets template-name-thumb.png
supabase storage-api upload template-assets template-name-preview.png
supabase storage-api upload template-assets template-name-full.png
```

### 3. Update Template URLs

```javascript
// Update template imageUrls to point to Supabase
{
  "imageUrls": {
    "thumbnail": "https://your-project.supabase.co/storage/v1/object/public/template-assets/template-name-thumb.png",
    "preview": "https://your-project.supabase.co/storage/v1/object/public/template-assets/template-name-preview.png", 
    "full": "https://your-project.supabase.co/storage/v1/object/public/template-assets/template-name-full.png"
  }
}
```

## 🔒 Security Configuration

### 1. CORS Setup

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'https://your-frontend-url.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
});
```

### 2. Rate Limiting

```typescript
// Install: npm install @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

### 3. Input Validation

```typescript
// Ensure all endpoints have validation
@Post('upload')
@UseInterceptors(FileInterceptor('photo'))
async uploadPhoto(
  @UploadedFile() file: Express.Multer.File,
  @Body() body: UploadPhotoDto // Add DTO validation
) {
  // Implementation
}
```

## 📊 Monitoring & Analytics

### 1. Add Health Check Endpoint

```typescript
// backend/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### 2. Error Tracking (Optional)

```bash
# Install Sentry
npm install @sentry/node @sentry/nestjs

# Configure in main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### 3. Usage Analytics

The app includes basic analytics tracking. Monitor:
- Poster generation rate
- Template popularity
- User drop-off points
- Performance metrics

## 🌐 Custom Domain Setup

### 1. Frontend Domain (Vercel)

1. Add domain in Vercel dashboard
2. Configure DNS records:
   - `CNAME` record pointing to `cname.vercel-dns.com`

### 2. Backend Domain (Railway)

1. Add custom domain in Railway
2. Configure DNS:
   - `CNAME` record pointing to Railway's domain

### 3. Update Environment Variables

```env
# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Backend  
FRONTEND_URL=https://your-domain.com
```

## 🚨 Disaster Recovery

### 1. Database Backups

```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to secure storage
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### 2. Storage Backups

```bash
# Backup Supabase storage
supabase storage download --recursive template-assets ./backups/templates/
supabase storage download --recursive user-photos ./backups/photos/
```

### 3. Rollback Plan

1. Keep previous deployment artifacts
2. Database migration rollback scripts
3. DNS switch preparation
4. Communication plan for users

## 🔧 Performance Optimization

### 1. CDN Configuration

```typescript
// Enable aggressive caching for static assets
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false
}));
```

### 2. Image Optimization

```typescript
// Optimize Sharp settings for production
const optimizeImage = (buffer: Buffer) => {
  return sharp(buffer)
    .resize(1080, 1080, { fit: 'cover' })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
};
```

### 3. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

## 📱 Campaign-Specific Customization

### 1. Branding

```css
/* Update primary colors in globals.css */
:root {
  --primary-color: #your-campaign-color;
  --secondary-color: #your-secondary-color;
}
```

### 2. Template Customization

```javascript
// Add campaign-specific templates
const campaignTemplates = [
  {
    name: "Your Candidate 2024",
    category: "Campaign-Specific",
    // ... template configuration
  }
];
```

### 3. Social Media Integration

```typescript
// Customize share messages
const shareMessages = {
  facebook: `I'm supporting ${candidateName}! See my endorsement poster.`,
  twitter: `Proud to support ${candidateName} for ${office}! #${campaignHashtag}`,
  // ...
};
```

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All environments deployed and tested
- [ ] Database seeded with templates
- [ ] Storage buckets configured
- [ ] SSL certificates active
- [ ] Error tracking configured
- [ ] Backup systems in place

### Launch Day
- [ ] Monitor server resources
- [ ] Track error rates
- [ ] Monitor user flow completion
- [ ] Check template loading performance
- [ ] Verify social sharing works

### Post-Launch
- [ ] Daily monitoring of key metrics
- [ ] Weekly template performance review
- [ ] Monthly user feedback analysis
- [ ] Quarterly infrastructure review

## 🆘 Troubleshooting

### Common Deployment Issues

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check firewall rules
telnet your-db-host 5432
```

**Storage Upload Failures**
```bash
# Verify bucket policies
supabase storage list-policies

# Check CORS configuration
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-project.supabase.co/storage/v1/
```

### Performance Issues

**Slow Image Loading**
- Check Supabase CDN configuration
- Verify image optimization settings
- Monitor network latency

**High Server Load**
- Check database query performance
- Monitor Sharp memory usage
- Scale backend instances if needed

## 📞 Production Support

### Monitoring Dashboard
Set up monitoring for:
- Server uptime and response times
- Database performance metrics
- Storage usage and costs
- User engagement metrics

### Alert Configuration
Configure alerts for:
- Server downtime
- High error rates
- Database connection failures
- Storage quota warnings

### Support Runbook
1. **Server Issues**: Check Railway/Vercel status pages
2. **Database Issues**: Verify connection strings and credentials  
3. **Storage Issues**: Check Supabase storage quotas
4. **User Reports**: Reproduce in staging environment first

This deployment guide ensures your Postyup application can handle viral campaign traffic while maintaining high performance and reliability.