# Postyup - Political Poster Generator

A modern, professional political poster generator application that helps campaign supporters create and share professional endorsement posters in minutes.

## 🚀 Features

- **Mobile-First Design**: Optimized for phones with touch-friendly interface
- **Photo Upload & Cropping**: Advanced cropping with pan, zoom, and resize using react-easy-crop
- **Template Gallery**: Pre-designed political poster templates with category filtering
- **Real-Time Preview**: Live poster preview with supporter details overlaid
- **Multi-Resolution Support**: Optimized images for browsing, editing, and final output
- **Social Media Sharing**: Direct sharing to Facebook, Twitter, WhatsApp, and Instagram
- **High-Quality Downloads**: 1080px final resolution posters
- **Session Persistence**: No login required, session-based data storage
- **Analytics Tracking**: Basic usage analytics and poster generation tracking

## 🏗️ Architecture

### Frontend (NextJS 15)
- **Framework**: NextJS 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **State Management**: Zustand stores
- **Photo Cropping**: react-easy-crop
- **Image Processing**: Canvas API for previews

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Supabase Storage
- **Image Processing**: Sharp for server-side processing
- **API**: RESTful endpoints

### Database Schema
- **Templates**: Poster templates with layout configurations
- **Analytics**: User action tracking
- **Sessions**: Session-based data storage

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Supabase account (for storage)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd postyup

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Configuration

#### Backend Environment Variables
Create `/backend/.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/postyup

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
FRONTEND_URL=http://localhost:3000
PORT=3001
```

#### Frontend Environment Variables
Create `/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Database Setup

```bash
# Navigate to backend directory
cd backend

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

### 4. Supabase Storage Setup

Create the following storage buckets in your Supabase dashboard:
- `user-photos` (for uploaded photos)
- `generated-posters` (for final posters)
- `template-assets` (for template images)

Set bucket policies to allow public read access.

### 5. Seed Sample Templates

```bash
# In backend directory
npm run start:dev

# In another terminal, seed templates
curl -X POST http://localhost:3001/api/templates/seed
```

## 🚀 Running the Application

### Development Mode

```bash
# Terminal 1: Start backend
cd backend
npm run start:dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Access the application at `http://localhost:3000`

### Production Build

```bash
# Build frontend
cd frontend
npm run build
npm run start

# Build and start backend
cd backend
npm run build
npm run start
```

## 📁 Project Structure

```
postyup/
├── frontend/
│   ├── src/
│   │   ├── app/              # NextJS App Router pages
│   │   ├── components/       # React components
│   │   ├── stores/          # Zustand state stores
│   │   └── lib/             # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── db/              # Database schema and connection
│   │   ├── photo/           # Photo upload/processing module
│   │   ├── template/        # Template management module
│   │   ├── poster/          # Poster generation module
│   │   ├── analytics/       # Analytics tracking module
│   │   └── main.ts          # Application entry point
│   ├── drizzle/             # Database migrations
│   └── package.json
└── README.md
```

## 🖼️ Adding New Templates

### Template Structure
Templates consist of:
1. **Images**: thumbnail (270px), preview (540px), full (1080px)
2. **Layout Configuration**: JSON defining text and photo zones

### Example Template Configuration

```json
{
  "name": "Professional Blue",
  "category": "Professional",
  "imageUrls": {
    "thumbnail": "/templates/professional-blue-thumb.png",
    "preview": "/templates/professional-blue-preview.png", 
    "full": "/templates/professional-blue-full.png"
  },
  "layoutConfig": {
    "textZones": [
      {
        "type": "name",
        "x": 450, "y": 400,
        "width": 580, "height": 80,
        "fontSize": 42,
        "fontFamily": "Arial",
        "color": "#FFFFFF",
        "textAlign": "left"
      }
    ],
    "photoZones": [
      {
        "x": 50, "y": 250,
        "width": 350, "height": 350,
        "borderRadius": 0
      }
    ]
  }
}
```

### Adding Templates via API

```bash
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d '{"template_data_here"}'
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Connect your repository to Vercel/Netlify
2. Set environment variables
3. Deploy

### Backend (Railway/Heroku/DigitalOcean)

1. Deploy to your preferred platform
2. Set environment variables
3. Run database migrations
4. Ensure Supabase storage is configured

### Database (Supabase/Railway/PlanetScale)

1. Create PostgreSQL database
2. Update `DATABASE_URL` in backend environment
3. Run migrations with `npm run db:push`

## 🔧 API Endpoints

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/category/:category` - Get templates by category
- `POST /api/templates/seed` - Seed sample templates

### Photo Management
- `POST /api/photo/upload` - Upload user photo
- `POST /api/photo/crop` - Crop uploaded photo

### Poster Generation
- `POST /api/poster/generate` - Generate final poster

### Analytics
- `POST /api/analytics/track` - Track user actions
- `GET /api/analytics/summary` - Get analytics summary

## 🏗️ Technical Considerations

### Performance
- Images are served through Supabase CDN
- Multi-resolution image pipeline reduces load times
- Session-based storage eliminates authentication overhead

### Scalability
- Stateless architecture handles viral traffic
- Database optimized for read-heavy workloads
- Template assets cached at CDN level

### Security
- Input validation on all endpoints
- File type and size restrictions
- No sensitive data storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section below
2. Create an issue on GitHub
3. Contact the development team

## 🔧 Troubleshooting

### Common Issues

**Templates not loading**
- Check Supabase storage configuration
- Verify template assets are uploaded
- Run template seeding script

**Photo upload failing**
- Check Supabase storage buckets exist
- Verify storage policies allow uploads
- Check file size limits (5MB max)

**Database connection issues**
- Verify DATABASE_URL is correct
- Check database is running
- Run migrations with `npm run db:push`

**Build errors**
- Clear node_modules and reinstall
- Check Node.js version (18+ required)
- Verify environment variables are set

### Performance Optimization

**Image loading slow**
- Enable Supabase CDN
- Implement image optimization
- Use appropriate image formats

**App loading slow**
- Enable code splitting
- Implement service worker
- Optimize bundle size

This application is designed to handle viral campaign traffic while providing a smooth, professional experience for political supporters creating endorsement content.