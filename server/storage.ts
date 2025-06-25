import { users, bookmarks, type User, type InsertUser, type Bookmark, type InsertBookmark } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBookmarks(userId: number): Promise<Bookmark[]>;
  addBookmark(userId: number, bookmark: InsertBookmark): Promise<Bookmark>;
  removeBookmark(userId: number, stationUuid: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookmarks: Map<number, Bookmark>;
  private currentUserId: number;
  private currentBookmarkId: number;

  constructor() {
    this.users = new Map();
    this.bookmarks = new Map();
    this.currentUserId = 1;
    this.currentBookmarkId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      (bookmark) => bookmark.userId === userId
    );
  }

  async addBookmark(userId: number, insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.currentBookmarkId++;
    const bookmark: Bookmark = {
      id,
      userId,
      stationUuid: insertBookmark.stationUuid,
      stationName: insertBookmark.stationName,
      stationUrl: insertBookmark.stationUrl,
      country: insertBookmark.country || null,
      genre: insertBookmark.genre || null,
      bitrate: insertBookmark.bitrate || null,
      createdAt: new Date().toISOString(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async removeBookmark(userId: number, stationUuid: string): Promise<boolean> {
    const bookmark = Array.from(this.bookmarks.values()).find(
      (b) => b.userId === userId && b.stationUuid === stationUuid
    );
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
      return true;
    }
    return false;
  }
}

export const storage = new MemStorage();
