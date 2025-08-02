# Political Supporter Poster Generator App
## Complete Project Brief Based on Your Vision

---

## Original Concept

A mobile-first responsive web app that allows supporters of a political party candidate to fill in their details - most importantly, just name of the supporter, photo of the supporter, and title/portfolio. Then a feature to select a pre-defined poster. These predefined posters are graphic designed posters but have a place for the supporter details, so the supporter can download the final customized poster and/or share to other social platforms.

---

## Key Design Decisions & Technical Specifications

### 1. Template System
- **Pre-defined posters**: Designed graphics saved as PNG files
- **Backend management**: Templates placed in backend programmatically (no manual upload interface needed)
- **Customization scope**: Limited to supporter details only (name, photo, title/role)
- **No authentication**: MVP requires no user accounts or login system

### 2. Photo Handling & Cropping
- **Interactive crop tool**: Users can pan, zoom, resize, and move around the area of photo they want
- **Flexible positioning**: Final cropped result maps to the designated photo zone in the template
- **User control**: Full manipulation of how their photo appears in the final poster

### 3. Multi-Resolution Strategy
- **Performance optimization**: 1:1 1080px templates would be too large for preview
- **Thumbnail version**: Programmatically generated smaller version for preview interface
- **Quality preservation**: Final shareable and downloadable version maintains actual 1080px size for optimal quality
- **Smart rendering**: Preview uses smaller resolution, final output uses full resolution

### 4. Core User Flow
1. **Data Entry**: Supporter enters name, uploads photo, adds title/portfolio
2. **Photo Cropping**: Interactive tool to select and adjust photo area
3. **Template Selection**: Browse pre-designed poster options (shown as thumbnails)
4. **Preview**: See customized poster with their details (using optimized preview size)
5. **Download/Share**: Generate and deliver full-quality 1080px final poster

### 5. Technical Architecture
- **Frontend**: Mobile-first responsive design
- **No authentication**: Stateless session-based approach
- **Template storage**: PNG files with programmatic placement configuration
- **Image processing**: Multi-resolution pipeline (thumbnail → preview → final)
- **Backend configuration**: Template metadata defining text and photo zones

### 6. MVP Scope
- **Minimal viable product**: Focus on core functionality without complex features
- **Essential features only**: Name, photo, title input + template selection + download/share
- **No user management**: Skip login, registration, user profiles
- **Programmatic templates**: Backend team manages template addition/updates
- **Quality focus**: Emphasis on high-quality output over feature quantity

---

## Your Complete Vision Summary

You envision a streamlined, mobile-optimized web application that transforms political supporters into content creators. The app eliminates technical barriers by providing professionally designed poster templates while giving users meaningful control over their personal representation through an intuitive photo cropping interface. 

The technical approach prioritizes performance through smart multi-resolution handling - using smaller images for smooth preview experiences while ensuring the final output maintains campaign-quality standards at full 1080px resolution. 

By avoiding authentication complexity and focusing solely on the core supporter-to-content pipeline, the MVP can launch quickly while still delivering a polished, share-worthy end product that amplifies grassroots campaign engagement across social media platforms.

The backend template management system allows for easy content updates and A/B testing of poster designs without requiring app updates, while the stateless architecture ensures the app can handle viral traffic spikes during key campaign moments.