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
          // Build API URL
          let apiUrl = `${server}?limit=${limit}&offset=${offset}&order=clickcount&reverse=false`;
          
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
        
        // Apply listener count filter
        if (listenerFilter) {
          filteredStations = stations.filter((station: any) => {
            const clicks = parseInt(station.clickcount) || 0;
            
            switch (listenerFilter) {
              case 'zero':
                return clicks === 0;
              case 'one':
                return clicks === 1;
              case '2-10':
                return clicks >= 2 && clicks <= 10;
              case 'under100':
                return clicks < 100;
              default:
                return true;
            }
          });
        }
        
        // Sort by click count (ascending for obscurity)
        const sortedStations = filteredStations.sort((a: any, b: any) => {
          const aClicks = parseInt(a.clickcount) || 0;
          const bClicks = parseInt(b.clickcount) || 0;
          return aClicks - bClicks;
        });
        
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
          'United Kingdom': 'UK',
          'United Kingdom of Great Britain and Northern Ireland': 'UK',
          'Great Britain': 'UK',
          'United States of America': 'USA',
          'United States': 'USA',
          'Russian Federation': 'Russia',
          'Iran (Islamic Republic of)': 'Iran',
          'Korea (Republic of)': 'South Korea',
          'Korea (Democratic People\'s Republic of)': 'North Korea',
          'Venezuela (Bolivarian Republic of)': 'Venezuela',
          'Bolivia (Plurinational State of)': 'Bolivia',
          'Taiwan (Province of China)': 'Taiwan',
          'Macedonia (the former Yugoslav Republic of)': 'North Macedonia',
          'Moldova (Republic of)': 'Moldova',
          'Congo (Democratic Republic of the)': 'DR Congo',
          'Tanzania (United Republic of)': 'Tanzania',
          'Palestine (State of)': 'Palestine',
          'Virgin Islands (British)': 'British Virgin Islands',
          'Virgin Islands (U.S.)': 'US Virgin Islands',
          'Czech Republic': 'Czechia',
          'Slovak Republic': 'Slovakia',
          'Republic of South Africa': 'South Africa',
          'Federal Republic of Germany': 'Germany',
          'French Republic': 'France',
          'Italian Republic': 'Italy',
          'Kingdom of Spain': 'Spain',
          'Republic of Poland': 'Poland',
          'Republic of Turkey': 'Turkey',
          'Federative Republic of Brazil': 'Brazil',
          'Argentine Republic': 'Argentina',
          'Republic of India': 'India',
          'People\'s Republic of China': 'China',
          'State of Japan': 'Japan',
          'Commonwealth of Australia': 'Australia',
          'Dominion of Canada': 'Canada',
          'United Mexican States': 'Mexico',
          'Kingdom of the Netherlands': 'Netherlands',
          'Kingdom of Belgium': 'Belgium',
          'Swiss Confederation': 'Switzerland',
          'Republic of Austria': 'Austria',
          'Kingdom of Sweden': 'Sweden',
          'Kingdom of Norway': 'Norway',
          'Republic of Finland': 'Finland',
          'Kingdom of Denmark': 'Denmark'
        };
        
        return nameMap[name] || name;
      };

      // Sort by country name and filter out countries with very few stations
      const filteredCountries = countries
        .filter((country: any) => country.stationcount > 5)
        .map((country: any) => {
          const shortName = getShortCountryName(country.name);
          console.log(`Country mapping: "${country.name}" -> "${shortName}"`);
          return {
            ...country,
            name: shortName
          };
        })
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
