import { useState, useEffect } from 'react';
import { RadioStation } from '@/types/radio';

interface BookmarkedStation {
  stationuuid: string;
  name: string;
  country: string;
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
    console.log('Saving bookmarks to localStorage:', newBookmarks.length, 'items');
    setBookmarks(newBookmarks);
    try {
      localStorage.setItem('unheard-radio-bookmarks', JSON.stringify(newBookmarks));
      console.log('Successfully saved to localStorage');
      // Verify it was saved
      const verified = localStorage.getItem('unheard-radio-bookmarks');
      console.log('Verification - localStorage now contains:', verified ? JSON.parse(verified).length + ' items' : 'null');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const isBookmarked = (stationUuid: string): boolean => {
    return bookmarks.some(bookmark => bookmark.stationuuid === stationUuid);
  };

  const addBookmark = (station: RadioStation) => {
    if (isBookmarked(station.stationuuid)) return;

    const newBookmark: BookmarkedStation = {
      stationuuid: station.stationuuid,
      name: station.name,
      country: station.country,
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
    console.log('Toggling bookmark for station:', station.name, station.stationuuid);
    console.log('Current bookmarks count:', bookmarks.length);
    console.log('Is currently bookmarked:', isBookmarked(station.stationuuid));
    
    if (isBookmarked(station.stationuuid)) {
      console.log('Removing bookmark');
      removeBookmark(station.stationuuid);
    } else {
      console.log('Adding bookmark');
      addBookmark(station);
    }
    
    console.log('Bookmarks after toggle:', bookmarks.length);
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
