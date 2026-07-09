import { useState, useEffect } from 'react';
import { RadioStation } from '@/types/radio';

interface BookmarkedStation {
  stationuuid: string;
  name: string;
  country: string;
  countrycode?: string;
  genre: string;
  bitrate: number;
  url: string;
  bookmarkedAt: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedStation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('unheard-radio-bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        localStorage.removeItem('unheard-radio-bookmarks');
      }
    }
  }, []);

  const saveBookmarks = (newBookmarks: BookmarkedStation[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem('unheard-radio-bookmarks', JSON.stringify(newBookmarks));
    // Trigger storage event for cross-component updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'unheard-radio-bookmarks',
      newValue: JSON.stringify(newBookmarks)
    }));
  };

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'unheard-radio-bookmarks' && e.newValue) {
        try {
          setBookmarks(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing bookmark update:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isBookmarked = (stationUuid: string): boolean => {
    return bookmarks.some(bookmark => bookmark.stationuuid === stationUuid);
  };

  const addBookmark = (station: RadioStation) => {
    if (isBookmarked(station.stationuuid)) return;

    const newBookmark: BookmarkedStation = {
      stationuuid: station.stationuuid,
      name: station.name,
      country: station.country,
      countrycode: station.countrycode,
      genre: station.tags,
      bitrate: station.bitrate,
      url: station.url,
      bookmarkedAt: new Date().toISOString(),
    };

    saveBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (stationUuid: string) => {
    const filtered = bookmarks.filter(bookmark => bookmark.stationuuid !== stationUuid);
    saveBookmarks(filtered);
  };

  const toggleBookmark = (station: RadioStation) => {
    if (isBookmarked(station.stationuuid)) {
      removeBookmark(station.stationuuid);
    } else {
      addBookmark(station);
    }
  };

  const clearBookmarks = () => {
    saveBookmarks([]);
  };

  return {
    bookmarks,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks,
    bookmarkCount: bookmarks.length,
  };
}
