I want you to create a modern, professional NextJS political poster generator application. Here's my vision:

APPLICATION OVERVIEW:
Build a complete political supporter poster creation web app called **Postyup** that helps campaign supporters create and share professional endorsement posters. The app should feel modern, intuitive, and mobile-first while being accessible on all devices.

CORE FEATURES:
- Supporter data entry: name, photo upload, title/role
- Interactive photo cropping with pan, zoom, resize, and repositioning using react-easy-crop
- Template gallery browsing with pre-designed political poster templates
- Real-time poster preview with supporter details overlaid
- Multi-resolution image handling (thumbnails for browsing, preview for editing, full quality for final output)
- High-quality poster generation and download (2000px final resolution)
- Social media sharing capabilities with pre-populated campaign messaging
- Template categories: Endorsement, Issue-based, Event-specific, Professional, Casual
- Session-based data storage (no authentication required for MVP)

TECHNICAL REQUIREMENTS:
- NextJS 15 with App Router
- NestJS backend with TypeScript
- Supabase PostgreSQL database with Drizzle ORM
- Zustand for client-side state management
- react-easy-crop for photo cropping interface (https://valentinh.github.io/react-easy-crop/)
- TypeScript for full type safety across frontend and backend
- Tailwind CSS for mobile-first responsive styling
- Sharp for server-side image processing in NestJS
- Supabase Storage for template assets and temporary photo storage
- Form validation for supporter input fields
- File upload handling with image optimization
- Multi-resolution image pipeline (270px thumbnails, 540px previews, 2000px final)

DESIGN REQUIREMENTS:
- Mobile-first responsive design (primary focus on phone experience)
- Touch-friendly interface with 44px+ touch targets
- Progressive web app capabilities
- Intuitive step-by-step user flow
- Visual feedback for all user actions
- Loading states during image processing
- Clean, campaign-appropriate color scheme
- Thumb-navigation optimized layout

SPECIFIC FUNCTIONALITY:
- Photo upload with camera capture option and file selection
- Advanced cropping interface using react-easy-crop with real-time preview
- Template selection with category filtering
- Dynamic text and photo overlay on poster templates
- Poster generation with configurable text zones and photo zones
- Download functionality for high-quality PNG output
- Share buttons for major social platforms (Facebook, Twitter, Instagram, WhatsApp)
- Template management system (backend configuration for easy template addition)
- Basic analytics tracking (poster generation, shares, downloads)
- Responsive template preview system
- Session persistence using Zustand stores

DATABASE SCHEMA (Drizzle ORM):
- Templates table: id, name, category, image_urls, layout_config, created_at
- Analytics table: session_id, action_type, template_id, created_at
- Sessions table: id, supporter_data, photo_data, selected_template, created_at

BACKEND API STRUCTURE (NestJS):
- POST /api/upload-photo - Handle photo uploads to Supabase Storage
- GET /api/templates - Fetch available poster templates
- GET /api/templates/:category - Filter templates by category
- POST /api/generate-poster - Create final poster with supporter data
- POST /api/analytics - Track user actions and poster generation

ZUSTAND STORES:
- supporterStore: name, title, photo data, crop parameters from react-easy-crop
- templateStore: available templates, selected template, categories
- posterStore: generation status, preview URL, final poster URL
- sessionStore: current step, form validation, error states

REACT-EASY-CROP INTEGRATION:
- Use react-easy-crop component for intuitive mobile-friendly photo cropping
- Store crop coordinates, zoom level, and cropPixels data in Zustand
- Pass crop data to backend for server-side image processing with Sharp
- Support different aspect ratios based on template photo zone requirements
- Smooth touch gestures for pinch-to-zoom and drag-to-reposition

TEMPLATE SYSTEM:
- PNG-based poster templates stored in Supabase Storage
- Template configuration JSON with coordinates, fonts, colors, and sizing
- Category-based organization and filtering
- Thumbnail generation for fast browsing
- Support for different aspect ratios and layouts

IMAGE PROCESSING PIPELINE:
- Client-side photo cropping with react-easy-crop for user experience
- Server-side final processing using Sharp with crop coordinates
- Automatic image optimization and compression
- Multiple output formats optimized for different use cases
- Progressive image loading for better performance
- Supabase Storage CDN for asset delivery

Please create this as a complete, production-ready application that could handle viral campaign traffic. Set up the project structure with proper separation between frontend (NextJS) and backend (NestJS), implement all core features with react-easy-crop for the cropping interface, and ensure the mobile experience is exceptional. Focus on creating something that political campaigns could actually deploy to amplify grassroots engagement.

The app should feel fast, professional, and empowering - making it easy for any supporter to create campaign-quality content in under 2 minutes.

When you're done, provide instructions on how to run the application, set up the database with Drizzle migrations, add new poster templates, and deploy for campaign use.