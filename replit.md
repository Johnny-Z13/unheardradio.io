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
- June 26, 2025. Added global station map with geographic visualization
  - Created new "Locations" tab with interactive world map using Leaflet
  - Displays radio stations as markers based on their GPS coordinates
  - Shows station details in popups with play/details buttons
  - Added custom VDU green styling for map controls and popups
  - Integrated with existing audio player for direct station playback from map
  - Filters out stations without valid coordinate data for clean display
- June 26, 2025. Comprehensive mobile responsive design implementation
  - Fixed map authentication error by switching to OpenStreetMap tiles
  - Made header responsive with mobile-optimized spacing and typography
  - Updated navigation tabs with horizontal scrolling on mobile
  - Responsive sidebar that adapts to mobile layout (full width on mobile)
  - Mobile-optimized station cards with smaller padding and responsive grids
  - Responsive map interface with mobile-friendly controls and headers
  - Added CSS utilities for smooth scrolling and text truncation
  - Enhanced touch scrolling support across all components
- June 27, 2025. Fixed notification positioning and bookmark display issues
  - Repositioned toast notifications to not obscure navigation tabs (top-28/bottom-16)
  - Updated bookmark localStorage key from 'signal-drift-bookmarks' to 'unheard-radio-bookmarks'
  - Fixed bookmark screen display functionality with proper station conversion
  - Ensured bookmark notifications appear in safe zones on mobile and desktop
- June 27, 2025. Enhanced navigation with CRT-themed icon interface
  - Replaced text navigation with icon-based tabs: Radar (Discover), Search (Filter), Bookmark (Saved), MapPin (Map)
  - Added hover tooltips for icon navigation accessibility
  - Implemented responsive design: icons only on mobile, icons + text on larger screens
  - Used monospace font for navigation text to enhance terminal aesthetic
  - Removed bookmark count from navigation for cleaner minimalist appearance
  - Removed duplicate RANDOM and BOOKMARKS buttons from header for cleaner interface
  - Moved random station functionality to discover tab content area
  - Streamlined header to focus on branding and live station count
  - Fixed UI shifting between tabs by implementing consistent scrollbar behavior across all tabs
  - Added custom VDU green scrollbar styling to match terminal aesthetic
- June 27, 2025. Dark mode map with progressive station loading
  - Implemented dark mode Carto tiles for map background instead of standard OpenStreetMap
  - Added progressive station loading based on zoom level (61 at world level, up to 2000 at city level)
  - Enhanced map controls with VDU green styling and dark backgrounds
  - Added custom dark styling for map popups, attribution, and zoom controls
  - Fixed station count display to show accurate progressive loading information
  - Stations now load dynamically as user zooms in for better performance
- June 27, 2025. Redesigned bookmarks as filtered station list for iPhone optimization
  - Converted saved stations from card grid to identical vertical list format as discover feed
  - Removed special bookmark cards and menu items for cleaner mobile interface
  - Implemented bookmarkedOnly filter in StationList component for unified experience
  - Added appropriate empty state messaging for no saved stations
  - Optimized for iPhone with consistent list layout and bookmark toggle functionality
  - Saved section now acts as simple filter to hide unbookmarked items
- June 27, 2025. Fixed bookmark functionality with separate component architecture
  - Created dedicated BookmarkList component for saved stations with direct bookmark data access
  - Created separate DiscoveryList component for discovery/search with clean API state management
  - Eliminated complex state conflicts between bookmark and API modes
  - Fixed discovery feed loading issue when switching from saved tab
  - Reduced toast notification duration to 2 seconds for better UX
  - Ensured real-time bookmark updates and proper tab switching behavior
  - Removed bookmark toast notifications - icon on/off state provides sufficient visual feedback
- June 27, 2025. Added About page with mission statement and contact information
  - Created dedicated About page accessible from header navigation with info icon
  - Included Unheard Radio's mission to reverse-rank obscure stations and make them discoverable
  - Added privacy policy link, Z13labs attribution, and contact email (hello@z13labs.com)
  - Maintained VDU green aesthetic with responsive design and clear navigation back to radio interface
- June 27, 2025. Added dedicated Privacy Policy page with complete legal documentation
  - Created /privacy route with full privacy policy content including data collection, usage, and user rights
  - Linked privacy policy page from About page footer for proper navigation flow
  - Included contact information (hello@unheardradio.io) and external policy links
  - Maintained consistent VDU green styling and responsive design across all pages
- June 27, 2025. Added About button to main navigation bar
  - Integrated About page access directly into the icon-based navigation tabs
  - Removed duplicate About link from header to maintain clean interface
  - About tab functions as external link while maintaining navigation consistency
  - Navigation flow: Discover/Filter/Saved/Map/About tabs in single horizontal bar
- June 27, 2025. Updated About page with new underground radio aesthetic copy
  - Replaced technical mission statement with edgy, underground radio messaging
  - New tagline: "your portal to the strange side of sound"
  - Emphasized anti-algorithm, weird, overlooked content focus
  - Copy highlights glitchy transmissions, ghost signals, offbeat gems
  - Maintains "Anti-algorithm radio. Always live. Never normal." brand positioning
  - Removed features section to keep focus on core messaging without marketing content
  - Updated privacy policy contact email to hello@z13labs.com for consistency
- June 27, 2025. Fixed map zoom behavior and improved station density management
  - Resolved infinite re-render issues in ProgressiveStationLoader component
  - Implemented granular zoom-based station limits: 40 stations at world level up to 3000 at street level
  - Added proper useCallback memoization to prevent performance issues
  - Improved station density control that responds smoothly to zoom changes
  - Updated map header text to "Zoom to adjust density" for clearer user guidance
- June 27, 2025. Enhanced map to display all available stations with coordinates
  - Increased API limit to 50,000 stations to load maximum available data
  - Map now displays 8,759 stations with valid GPS coordinates from RadioBrowser
  - Updated interface to show coordinate statistics: "X stations with coordinates • Y total loaded"
  - Removed zoom-based filtering to show complete global radio station distribution
  - Clarified difference between mappable stations vs total database count
- June 27, 2025. Redesigned filters page with precise listener count targeting
  - Added exact listener count filters: 0 listeners only, exactly 1 listener, 2-10 listeners, under 100 listeners
  - Replaced generic obscurity ranges with precise audience size targeting for ultra-rare station discovery
  - Enhanced genre selector with scrollable dropdown showing top 100 genres with station counts
  - Improved location selector with top 50 countries, shortened country names (UK, USA vs full official names)
  - Added quick filter buttons for instant access to zero and 1-listener stations
  - Updated backend filtering logic to handle precise listener ranges and country name mapping
  - Streamlined filter interface focused on discovering the most obscure broadcasts by exact audience size
- June 28, 2025. Performance optimization and map popup enhancements
  - Fixed infinite re-render issue causing "Maximum update depth exceeded" errors
  - Implemented comprehensive memory leak prevention with cleanup functions and debouncing
  - Added map popup auto-close functionality - popups disappear when play button is clicked
  - Optimized map performance with 1000 marker limit and throttled updates
  - Updated map display to show "{number} stations mapped by location" without globe icon
  - Enhanced dark mode popup styling - removed white borders, green close button with hover effects
  - Added React Query garbage collection (5-10 minute cache limits) to prevent memory buildup
- June 28, 2025. Enhanced filter system with better genre categorization
  - Improved genre dropdown to show actual music categories (Rock, Pop, Jazz, etc.) instead of frequency/technical data
  - Added smart filtering to exclude frequency identifiers, bitrates, and technical specs from genre list
  - Implemented genre sorting by station count to prioritize popular categories
  - Added empty state messaging with helpful filter guidance when no results found
  - Updated listener filter options with visual indicators for available data (✓ markers)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```