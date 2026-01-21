/**
 * Caching Strategy
 * Coffee Shop POS System
 * API caching, localStorage, and service worker utilities
 */

/**
 * API Cache Manager
 */
class APICache {
  constructor(options = {}) {
    this.options = {
      prefix: 'digicaf_api_',
      ttl: 5 * 60 * 1000, // 5 minutes default
      storage: 'localStorage', // or 'sessionStorage'
      ...options
    };
    
    this.storage = window[this.options.storage];
  }
  
  /**
   * Generate cache key
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? JSON.stringify(params) 
      : '';
    return `${this.options.prefix}${url}${paramString}`;
  }
  
  /**
   * Get cached data
   */
  get(url, params = {}) {
    try {
      const key = this.generateKey(url, params);
      const cached = this.storage.getItem(key);
      
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() - timestamp > ttl) {
        this.delete(url, params);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  /**
   * Set cache data
   */
  set(url, data, params = {}, customTTL = null) {
    try {
      const key = this.generateKey(url, params);
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: customTTL || this.options.ttl
      };
      
      this.storage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.clearOldest();
        // Retry once
        try {
          this.storage.setItem(key, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error('Cache set error after cleanup:', retryError);
        }
      } else {
        console.error('Cache set error:', error);
      }
    }
  }
  
  /**
   * Delete cached data
   */
  delete(url, params = {}) {
    const key = this.generateKey(url, params);
    this.storage.removeItem(key);
  }
  
  /**
   * Clear all cache
   */
  clear() {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.options.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }
  
  /**
   * Clear oldest cache entries
   */
  clearOldest(count = 5) {
    const keys = Object.keys(this.storage)
      .filter(key => key.startsWith(this.options.prefix));
    
    // Get timestamps
    const entries = keys.map(key => {
      try {
        const { timestamp } = JSON.parse(this.storage.getItem(key));
        return { key, timestamp };
      } catch {
        return { key, timestamp: 0 };
      }
    });
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries
    entries.slice(0, count).forEach(entry => {
      this.storage.removeItem(entry.key);
    });
  }
  
  /**
   * Get cache size
   */
  getSize() {
    let size = 0;
    const keys = Object.keys(this.storage);
    
    keys.forEach(key => {
      if (key.startsWith(this.options.prefix)) {
        size += this.storage.getItem(key).length;
      }
    });
    
    return size;
  }
  
  /**
   * Get human-readable cache size
   */
  getSizeFormatted() {
    const bytes = this.getSize();
    const kb = bytes / 1024;
    const mb = kb / 1024;
    
    if (mb > 1) return `${mb.toFixed(2)} MB`;
    if (kb > 1) return `${kb.toFixed(2)} KB`;
    return `${bytes} bytes`;
  }
}

/**
 * Cached Fetch Wrapper
 */
class CachedFetch {
  constructor(cache = null) {
    this.cache = cache || new APICache();
  }
  
  /**
   * Fetch with caching
   */
  async fetch(url, options = {}) {
    const {
      method = 'GET',
      cache: cacheOption = true,
      cacheTTL = null,
      forceRefresh = false,
      ...fetchOptions
    } = options;
    
    // Only cache GET requests
    if (method !== 'GET' || !cacheOption) {
      return this.fetchAndParse(url, fetchOptions);
    }
    
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(url, fetchOptions);
      if (cached) {
        console.log(`📦 Cache hit: ${url}`);
        return cached;
      }
    }
    
    // Fetch from network
    console.log(`🌐 Network fetch: ${url}`);
    const data = await this.fetchAndParse(url, fetchOptions);
    
    // Store in cache
    this.cache.set(url, data, fetchOptions, cacheTTL);
    
    return data;
  }
  
  /**
   * Fetch and parse response
   */
  async fetchAndParse(url, options) {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Static Asset Cache
 */
class StaticCache {
  static prefix = 'digicaf_static_';
  
  /**
   * Cache CSS content
   */
  static cacheCSS(url, content) {
    try {
      sessionStorage.setItem(`${this.prefix}css_${url}`, content);
    } catch (error) {
      console.error('Failed to cache CSS:', error);
    }
  }
  
  /**
   * Get cached CSS
   */
  static getCachedCSS(url) {
    try {
      return sessionStorage.getItem(`${this.prefix}css_${url}`);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Cache image data URL
   */
  static cacheImage(url, dataURL) {
    try {
      localStorage.setItem(`${this.prefix}img_${url}`, dataURL);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }
  
  /**
   * Get cached image
   */
  static getCachedImage(url) {
    try {
      return localStorage.getItem(`${this.prefix}img_${url}`);
    } catch (error) {
      return null;
    }
  }
}

/**
 * IndexedDB Cache (for larger data)
 */
class IndexedDBCache {
  constructor(dbName = 'DigiCafDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }
  
  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('api_cache')) {
          const store = db.createObjectStore('api_cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      };
    });
  }
  
  /**
   * Set data in store
   */
  async set(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get data from store
   */
  async get(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Delete data from store
   */
  async delete(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Clear store
   */
  async clear(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get all data from store
   */
  async getAll(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Service Worker Registration
 */
class ServiceWorkerManager {
  /**
   * Register service worker
   */
  static async register(swPath = '/sw.js') {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('✅ Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            this.notifyUpdate();
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  
  /**
   * Unregister service worker
   */
  static async unregister() {
    if (!('serviceWorker' in navigator)) return;
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    console.log('✅ Service Worker unregistered');
  }
  
  /**
   * Notify user about update
   */
  static notifyUpdate() {
    console.log('🔄 New version available!');
    
    // Show update notification
    if (window.showToast) {
      window.showToast('Versi baru tersedia! Refresh untuk update.', 'info');
    }
  }
  
  /**
   * Skip waiting and activate new service worker
   */
  static async skipWaiting() {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

/**
 * Cache Strategy Helper
 */
class CacheStrategy {
  /**
   * Cache-first strategy
   */
  static async cacheFirst(request, cacheName = 'digicaf-cache-v1') {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    cache.put(request, response.clone());
    
    return response;
  }
  
  /**
   * Network-first strategy
   */
  static async networkFirst(request, cacheName = 'digicaf-cache-v1') {
    try {
      const response = await fetch(request);
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Stale-while-revalidate strategy
   */
  static async staleWhileRevalidate(request, cacheName = 'digicaf-cache-v1') {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    // Fetch in background
    const fetchPromise = fetch(request).then(response => {
      cache.put(request, response.clone());
      return response;
    });
    
    // Return cached immediately, or wait for network
    return cached || fetchPromise;
  }
}

// Create global instances
const globalAPICache = new APICache();
const globalCachedFetch = new CachedFetch(globalAPICache);
const globalIndexedDB = new IndexedDBCache();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APICache,
    CachedFetch,
    StaticCache,
    IndexedDBCache,
    ServiceWorkerManager,
    CacheStrategy,
    globalAPICache,
    globalCachedFetch,
    globalIndexedDB
  };
}
