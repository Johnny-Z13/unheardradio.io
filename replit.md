# Signal Drift - Radio Station Discovery App

## Overview

Signal Drift is a web application that discovers and curates the world's most obscure radio stations. Unlike traditional radio platforms that prioritize popular content, Signal Drift deliberately surfaces the least-played, most under-the-radar stations from around the globe. The application uses the RadioBrowser API to fetch station data and presents it through a unique "reverse popularity" lens, encouraging users to explore rare and experimental audio content.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for audio player state, React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom configuration for client-side bundling

### Backend Architecture
- **Framework**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication (structure in place)
- **API Proxy**: Acts as a proxy to RadioBrowser API for station data

### Key Design Decisions
- **Monorepo Structure**: Client and server code organized in a single repository with shared types
- **API Proxy Pattern**: Backend proxies RadioBrowser API calls to avoid CORS issues and add custom sorting
- **Reverse Popularity Algorithm**: Stations sorted by lowest click count to surface obscure content
- **Component-Based UI**: Extensive use of Radix UI primitives through shadcn/ui for accessibility

## Key Components

### Client Components
- **Audio Player**: Global audio state management with HTML5 audio element
- **Station List**: Paginated display of radio stations with filtering capabilities
- **Search Sidebar**: Advanced filtering by country, genre, and search terms
- **Station Cards**: Individual station display with play/bookmark/share functionality
- **Now Playing Bar**: Persistent audio controls when a station is playing

### Server Components
- **Route Handlers**: API endpoints for stations, countries, and genres
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **Proxy Logic**: Custom sorting and filtering of RadioBrowser API responses

### Shared Components
- **Database Schema**: User and bookmark models using Drizzle ORM
- **Type Definitions**: TypeScript interfaces for radio stations and API responses

## Data Flow

1. **Station Discovery**: Client requests filtered station data from `/api/stations`
2. **API Proxy**: Server fetches data from RadioBrowser API with custom parameters
3. **Reverse Sorting**: Server applies "obscurity algorithm" (lowest click count sorting)
4. **Client Rendering**: Stations displayed in cards with metadata and controls
5. **Audio Playback**: Client-side audio management with global state
6. **Bookmarking**: Local storage-based bookmarking (database structure prepared)

## External Dependencies

### APIs
- **RadioBrowser API**: Primary data source for global radio station directory
- **Browser APIs**: HTML5 Audio API, Web Share API, Clipboard API

### Key Libraries
- **@neondatabase/serverless**: PostgreSQL connection (configured for Neon)
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database queries
- **zustand**: Lightweight state management
- **wouter**: Minimal routing solution

### UI/UX Libraries
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with hot reloading via Vite
- **Database**: PostgreSQL 16 module in Replit
- **Port Configuration**: Server runs on port 5000 with client dev server proxy

### Production Build
- **Client Build**: Vite builds static assets to `dist/public`
- **Server Build**: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Replit Autoscale with build/run commands configured

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Connection**: Environment variable `DATABASE_URL` required
- **Schema**: Located in `shared/schema.ts` for type sharing

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
- June 25, 2025. Enhanced responsive design and mobile optimization
  - Improved header layout with responsive typography
  - Added collapsible sidebar with mobile toggle button
  - Redesigned station cards for better mobile layout
  - Enhanced now-playing bar with mobile-optimized controls
  - Added responsive grid layouts and improved visual hierarchy
  - Fixed genre filtering functionality
  - Improved API reliability with multiple server fallbacks
- June 25, 2025. Complete VDU green aesthetic transformation
  - Redesigned color scheme with VDU terminal green (#00FF00) as primary
  - Updated all components to use modern card-based layouts with rounded corners
  - Enhanced station cards with comprehensive metadata display
  - Added detailed station information: location, time on air, stream quality, popularity
  - Redesigned header with bold typography and logo
  - Updated now-playing bar with enhanced controls and waveform visualization
  - Improved mobile responsiveness across all components
- June 26, 2025. Enhanced fullscreen station view with comprehensive metadata display
  - Redesigned fullscreen layout to display all metadata without scrolling
  - Added 8 detailed information cards: Location, Technical, Broadcast, Metrics, Website, History, Content, Stream
  - Included comprehensive station data: coordinates, stream quality, broadcaster info, website links, historical data
  - Removed silly comments ("ghost frequencies haunt the airwaves") and replaced with informative descriptions
  - Replaced yellow accent color with cyan throughout the entire application
  - Updated color scheme: accent-yellow → accent-cyan (HSL 180, 100%, 70%)
  - Enhanced metadata includes: website URLs, station IDs, country codes, last check dates, stream protocols
  - Improved action buttons layout and error display styling
- June 26, 2025. Compact player interface and responsive audio visualization
  - Redesigned now-playing bar to be more compact (reduced from 96px to 48px height)
  - Created responsive AudioVisualizer component that reacts to real audio using Web Audio API
  - Implemented fallback animated visualization when Web Audio API is unavailable
  - Made fullscreen station view more compact with scrolling support for all metadata
  - Reduced metadata card sizes (p-4 → p-3, text-lg → text-sm) to fit more information
  - Enhanced audio visualization with frequency analysis and dynamic bar heights
  - Improved browsing space by reducing player window footprint by 50%
- June 26, 2025. Complete rebrand to "Unheard Radio" with enhanced navigation
  - Rebranded from "Signal Drift" to "Unheard Radio - Obscure Radio Discovery"
  - Added "U in a box" placeholder logo in top left corner
  - Updated station count text to "Stations live on air: 47,283"
  - Implemented bookmarks section with viewing and management capabilities
  - Added random button that instantly finds and plays zero-listener stations
  - Removed hero image and quote from both main interface and search sidebar
  - Enhanced audio error handling with fallback URL support for better stream reliability
- June 26, 2025. Audio visualizer improvements and bug fixes
  - Fixed Web Audio API connection to properly analyze real audio streams
  - Implemented proper frequency bin grouping and amplification for visibility
  - Added audio context initialization on first play with user interaction
  - Fixed station list persistence issue when switching between tabs
  - Enhanced frequency analysis with triple amplification and peak tracking
  - Optimized FFT settings for real-time responsive visualization
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```