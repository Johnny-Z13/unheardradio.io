import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Cache for fallback stations
  let fallbackStations: any[] = [];
  let lastSuccessfulFetch = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // RadioBrowser API proxy routes
  app.get("/api/stations", async (req, res) => {
    try {
      const { limit = 50, offset = 0, country, genre, search, listenerFilter } = req.query;
      
      // Try multiple RadioBrowser API servers for better reliability
      const servers = [
        "http://all.api.radio-browser.info/json/stations/search",
        "http://at1.api.radio-browser.info/json/stations/search",
        "http://de1.api.radio-browser.info/json/stations/search"
      ];
      
      let stations = [];
      let lastError: Error | null = null;
      
      for (const server of servers) {
        try {
          // Build API URL - adjust ordering based on listener filter
          let apiUrl;
          if (listenerFilter === 'high-to-low') {
            apiUrl = `${server}?limit=${limit}&offset=${offset}&order=clickcount&reverse=true`;
          } else if (listenerFilter === 'low-to-high' || listenerFilter === 'zero') {
            apiUrl = `${server}?limit=${limit}&offset=${offset}&order=clickcount&reverse=false`;
          } else {
            // For other filters, get a broader range then filter
            apiUrl = `${server}?limit=${Math.max(parseInt(limit as string) * 3, 100)}&offset=${offset}&order=random`;
          }
          
          if (country) apiUrl += `&country=${encodeURIComponent(country as string)}`;
          if (genre) apiUrl += `&tag=${encodeURIComponent(genre as string)}`;
          if (search) apiUrl += `&name=${encodeURIComponent(search as string)}`;
          
          const response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          
          if (response.ok) {
            stations = await response.json();
            
            // Cache successful results for fallback
            if (stations.length > 0 && !country && !genre && !search) {
              fallbackStations = [...stations];
              lastSuccessfulFetch = Date.now();
            }
            break;
          }
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }
      
      // If we got stations, filter by listener count and sort
      if (stations.length > 0) {
        let filteredStations = stations;
        
        // Apply listener count filter and sorting
        if (listenerFilter) {
          switch (listenerFilter) {
            case 'zero':
              filteredStations = stations.filter((station: any) => {
                const clicks = parseInt(station.clickcount) || 0;
                return clicks === 0;
              });
              break;
            case 'hide-zero':
              filteredStations = stations.filter((station: any) => {
                const clicks = parseInt(station.clickcount) || 0;
                return clicks > 0;
              }).sort((a: any, b: any) => {
                const aClicks = parseInt(a.clickcount) || 0;
                const bClicks = parseInt(b.clickcount) || 0;
                return aClicks - bClicks; // Low to high for obscurity focus
              });
              break;
            case 'high-to-low':
              // Already sorted by API call, but ensure proper order
              filteredStations = [...stations].sort((a: any, b: any) => {
                const aClicks = parseInt(a.clickcount) || 0;
                const bClicks = parseInt(b.clickcount) || 0;
                return bClicks - aClicks; // Descending order
              });
              break;
            case 'low-to-high':
              // Already sorted by API call, but ensure proper order
              filteredStations = [...stations].sort((a: any, b: any) => {
                const aClicks = parseInt(a.clickcount) || 0;
                const bClicks = parseInt(b.clickcount) || 0;
                return aClicks - bClicks; // Ascending order
              });
              break;
            default:
              // Default obscurity sorting (low to high)
              filteredStations = [...stations].sort((a: any, b: any) => {
                const aClicks = parseInt(a.clickcount) || 0;
                const bClicks = parseInt(b.clickcount) || 0;
                return aClicks - bClicks;
              });
          }
        } else {
          // Default obscurity sorting (low to high)
          filteredStations = [...stations].sort((a: any, b: any) => {
            const aClicks = parseInt(a.clickcount) || 0;
            const bClicks = parseInt(b.clickcount) || 0;
            return aClicks - bClicks;
          });
        }
        
        // Trim to requested limit after filtering
        const sortedStations = filteredStations.slice(0, parseInt(limit as string) || 50);
        
        res.json(sortedStations);
        return;
      }
      
      // Fallback: Return cached stations or generate a diverse set
      if (fallbackStations.length > 0 && (Date.now() - lastSuccessfulFetch) < CACHE_DURATION) {
        // Return random selection from cache
        const shuffled = [...fallbackStations].sort(() => Math.random() - 0.5);
        res.json(shuffled.slice(0, parseInt(limit as string) || 10));
        return;
      }
      
      // Final fallback: Try to get ANY stations without filters
      for (const server of servers) {
        try {
          const response = await fetch(`${server}?limit=50&order=random`, {
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          
          if (response.ok) {
            const randomStations = await response.json();
            if (randomStations.length > 0) {
              fallbackStations = randomStations;
              lastSuccessfulFetch = Date.now();
              res.json(randomStations.slice(0, parseInt(limit as string) || 10));
              return;
            }
          }
        } catch (err) {
          continue;
        }
      }
      
      throw lastError || new Error("All RadioBrowser servers unavailable");
      
    } catch (error) {
      console.error("Error fetching stations:", error);
      
      // Final emergency fallback - return any cached stations we have
      if (fallbackStations.length > 0) {
        const shuffled = [...fallbackStations].sort(() => Math.random() - 0.5);
        res.json(shuffled.slice(0, 10));
      } else {
        res.status(500).json({ message: "Failed to fetch radio stations" });
      }
    }
  });

  app.get("/api/countries", async (req, res) => {
    try {
      // Try multiple RadioBrowser API servers for better reliability
      const servers = [
        "http://all.api.radio-browser.info/json/countries",
        "http://at1.api.radio-browser.info/json/countries",
        "http://de1.api.radio-browser.info/json/countries"
      ];
      
      let countries = [];
      let lastError: Error | null = null;
      
      for (const server of servers) {
        try {
          const response = await fetch(server, { 
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          if (response.ok) {
            countries = await response.json();
            break;
          }
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }
      
      if (countries.length === 0) {
        throw lastError || new Error("All RadioBrowser servers unavailable");
      }
      
      // Function to convert long country names to shorter versions
      const getShortCountryName = (name: string): string => {
        const nameMap: { [key: string]: string } = {
          'The United Kingdom Of Great Britain And Northern Ireland': 'UK',
          'United Kingdom': 'UK',
          'Great Britain': 'UK',
          'The United States Of America': 'USA',
          'United States of America': 'USA',
          'United States': 'USA',
          'The Russian Federation': 'Russia',
          'Russian Federation': 'Russia',
          'Islamic Republic Of Iran': 'Iran',
          'Iran (Islamic Republic of)': 'Iran',
          'Republic Of Korea': 'South Korea',
          'Korea (Republic of)': 'South Korea',
          'Democratic People\'s Republic Of Korea': 'North Korea',
          'Korea (Democratic People\'s Republic of)': 'North Korea',
          'Bolivarian Republic Of Venezuela': 'Venezuela',
          'Venezuela (Bolivarian Republic of)': 'Venezuela',
          'Plurinational State Of Bolivia': 'Bolivia',
          'Bolivia (Plurinational State of)': 'Bolivia',
          'Taiwan, Republic Of China': 'Taiwan',
          'Taiwan (Province of China)': 'Taiwan',
          'Republic Of North Macedonia': 'North Macedonia',
          'Macedonia (the former Yugoslav Republic of)': 'North Macedonia',
          'The Republic Of Moldova': 'Moldova',
          'Moldova (Republic of)': 'Moldova',
          'Democratic Republic Of The Congo': 'DR Congo',
          'Congo (Democratic Republic of the)': 'DR Congo',
          'United Republic Of Tanzania': 'Tanzania',
          'Tanzania (United Republic of)': 'Tanzania',
          'State Of Palestine': 'Palestine',
          'Palestine (State of)': 'Palestine',
          'The Netherlands': 'Netherlands',
          'Kingdom of the Netherlands': 'Netherlands',
          'The Philippines': 'Philippines',
          'Syrian Arab Republic': 'Syria',
          'Czech Republic': 'Czechia',
          'Slovak Republic': 'Slovakia',
          'Republic of South Africa': 'South Africa',
          'Federal Republic of Germany': 'Germany',
          'French Republic': 'France',
          'Italian Republic': 'Italy',
          'Kingdom of Spain': 'Spain',
          'Republic of Poland': 'Poland',
          'Republic of Turkey': 'Turkey',
          'Türkiye': 'Turkey',
          'Federative Republic of Brazil': 'Brazil',
          'Argentine Republic': 'Argentina',
          'Republic of India': 'India',
          'People\'s Republic of China': 'China',
          'State of Japan': 'Japan',
          'Commonwealth of Australia': 'Australia',
          'Dominion of Canada': 'Canada',
          'United Mexican States': 'Mexico',
          'Kingdom of Belgium': 'Belgium',
          'Swiss Confederation': 'Switzerland',
          'Republic of Austria': 'Austria',
          'Kingdom of Sweden': 'Sweden',
          'Kingdom of Norway': 'Norway',
          'Republic of Finland': 'Finland',
          'Kingdom of Denmark': 'Denmark',
          'The Holy See': 'Vatican'
        };
        
        return nameMap[name] || name;
      };

      // Sort by country name and filter out countries with very few stations
      const filteredCountries = countries
        .filter((country: any) => country.stationcount > 5)
        .map((country: any) => ({
          ...country,
          name: getShortCountryName(country.name)
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      
      res.json(filteredCountries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      // Return empty array instead of error to keep UI functional
      res.json([]);
    }
  });

  app.get("/api/genres", async (req, res) => {
    try {
      // Try multiple RadioBrowser API servers for better reliability
      const servers = [
        "http://all.api.radio-browser.info/json/tags",
        "http://at1.api.radio-browser.info/json/tags",
        "http://de1.api.radio-browser.info/json/tags"
      ];
      
      let tags = [];
      let lastError: Error | null = null;
      
      for (const server of servers) {
        try {
          const response = await fetch(server, { 
            headers: { 'User-Agent': 'SignalDrift/1.0' }
          });
          if (response.ok) {
            tags = await response.json();
            break;
          }
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }
      
      if (tags.length === 0) {
        throw lastError || new Error("All RadioBrowser servers unavailable");
      }
      
      // Filter and sort genres
      const genres = tags
        .filter((tag: any) => tag.stationcount > 10)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .slice(0, 100); // Limit to top 100 genres
      
      res.json(genres);
    } catch (error) {
      console.error("Error fetching genres:", error);
      // Return empty array instead of error to keep UI functional
      res.json([]);
    }
  });

  // Station click tracking (for RadioBrowser API)
  app.post("/api/stations/:uuid/click", async (req, res) => {
    try {
      const { uuid } = req.params;
      const response = await fetch(`http://all.api.radio-browser.info/json/url/${uuid}`);
      
      if (!response.ok) {
        throw new Error(`RadioBrowser API error: ${response.status}`);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Error tracking station click:", error);
      res.status(500).json({ message: "Failed to track station click" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
