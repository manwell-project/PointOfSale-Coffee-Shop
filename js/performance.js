/**
 * Performance Optimization Utilities
 * Coffee Shop POS System
 * Asset loading, lazy loading, and performance helpers
 */

/**
 * Lazy Load Images
 */
class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };
    
    this.observer = null;
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.options
      );
      
      this.observeImages();
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages();
    }
  }
  
  observeImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    images.forEach(img => this.observer.observe(img));
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }
  
  loadImage(img) {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    const srcset = img.getAttribute('data-srcset');
    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }
    
    img.classList.add('loaded');
  }
  
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  }
  
  /**
   * Add new images to observer
   */
  observe(element) {
    if (this.observer) {
      this.observer.observe(element);
    }
  }
  
  /**
   * Disconnect observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Defer Non-Critical CSS
 */
class CSSLoader {
  /**
   * Load CSS asynchronously
   * @param {string} href - CSS file URL
   * @param {string} media - Media query (default: 'all')
   */
  static loadCSS(href, media = 'all') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print'; // Load as print, then switch to all
    
    link.onload = function() {
      this.media = media;
    };
    
    document.head.appendChild(link);
    
    return link;
  }
  
  /**
   * Preload CSS for faster loading
   */
  static preloadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    
    link.onload = function() {
      this.rel = 'stylesheet';
    };
    
    document.head.appendChild(link);
  }
  
  /**
   * Load multiple CSS files
   */
  static loadMultiple(cssFiles) {
    cssFiles.forEach(({ href, media }) => {
      this.loadCSS(href, media);
    });
  }
}

/**
 * Script Loader with defer/async
 */
class ScriptLoader {
  /**
   * Load script dynamically
   * @param {string} src - Script URL
   * @param {object} options - Loading options
   * @returns {Promise}
   */
  static loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      
      if (options.async) script.async = true;
      if (options.defer) script.defer = true;
      if (options.module) script.type = 'module';
      
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.body.appendChild(script);
    });
  }
  
  /**
   * Load multiple scripts sequentially
   */
  static async loadSequential(scripts) {
    for (const src of scripts) {
      await this.loadScript(src);
    }
  }
  
  /**
   * Load multiple scripts in parallel
   */
  static loadParallel(scripts) {
    return Promise.all(scripts.map(src => this.loadScript(src)));
  }
}

/**
 * Performance Monitoring
 */
class PerformanceMonitor {
  /**
   * Get page load metrics
   */
  static getLoadMetrics() {
    if (!window.performance || !window.performance.timing) {
      return null;
    }
    
    const timing = window.performance.timing;
    
    return {
      // Time to first byte
      ttfb: timing.responseStart - timing.requestStart,
      
      // DOM Content Loaded
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      
      // Full page load
      pageLoad: timing.loadEventEnd - timing.navigationStart,
      
      // DOM processing time
      domProcessing: timing.domComplete - timing.domLoading,
      
      // Resource loading time
      resourceLoad: timing.loadEventEnd - timing.domContentLoadedEventEnd
    };
  }
  
  /**
   * Get First Contentful Paint
   */
  static getFCP() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }
  
  /**
   * Get Largest Contentful Paint
   */
  static getLCP() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(null);
        return;
      }
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.renderTime || lastEntry.loadTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Stop observing after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    });
  }
  
  /**
   * Get First Input Delay
   */
  static getFID() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(null);
        return;
      }
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          resolve(entries[0].processingStart - entries[0].startTime);
          observer.disconnect();
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    });
  }
  
  /**
   * Log performance metrics to console
   */
  static logMetrics() {
    const metrics = this.getLoadMetrics();
    if (metrics) {
      console.group('⚡ Performance Metrics');
      console.log(`TTFB: ${metrics.ttfb}ms`);
      console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`Page Load: ${metrics.pageLoad}ms`);
      console.log(`DOM Processing: ${metrics.domProcessing}ms`);
      console.log(`Resource Load: ${metrics.resourceLoad}ms`);
      
      const fcp = this.getFCP();
      if (fcp) console.log(`First Contentful Paint: ${fcp}ms`);
      
      console.groupEnd();
    }
  }
  
  /**
   * Mark performance measurement
   */
  static mark(name) {
    if (window.performance && window.performance.mark) {
      performance.mark(name);
    }
  }
  
  /**
   * Measure between two marks
   */
  static measure(name, startMark, endMark) {
    if (window.performance && window.performance.measure) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure ? measure.duration : null;
    }
    return null;
  }
}

/**
 * Resource Hints
 */
class ResourceHints {
  /**
   * Preconnect to external origin
   */
  static preconnect(url, crossorigin = false) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  
  /**
   * DNS prefetch
   */
  static dnsPrefetch(url) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
  
  /**
   * Prefetch resource
   */
  static prefetch(url, as = null) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) link.as = as;
    document.head.appendChild(link);
  }
  
  /**
   * Preload critical resource
   */
  static preload(url, as, type = null) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  }
}

/**
 * Image Optimization
 */
class ImageOptimizer {
  /**
   * Create responsive image with srcset
   */
  static createResponsiveImage(src, sizes = [320, 640, 960, 1280]) {
    const img = document.createElement('img');
    
    // Generate srcset
    const srcset = sizes.map(size => {
      return `${this.getResizedUrl(src, size)} ${size}w`;
    }).join(', ');
    
    img.srcset = srcset;
    img.sizes = '100vw';
    img.src = this.getResizedUrl(src, sizes[sizes.length - 1]);
    
    return img;
  }
  
  /**
   * Get resized image URL (placeholder - implement based on your image service)
   */
  static getResizedUrl(src, width) {
    // Example: Add ?w=width to URL
    // Adjust based on your image processing service
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}`;
  }
  
  /**
   * Convert image to WebP format (client-side check)
   */
  static supportsWebP() {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }
  
  /**
   * Get optimized image format
   */
  static getOptimizedSrc(src) {
    if (this.supportsWebP()) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return src;
  }
}

/**
 * Code Splitting Helper
 */
class CodeSplitter {
  static loadedModules = new Set();
  
  /**
   * Dynamic import with caching
   */
  static async loadModule(modulePath) {
    if (this.loadedModules.has(modulePath)) {
      return Promise.resolve();
    }
    
    try {
      await import(modulePath);
      this.loadedModules.add(modulePath);
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }
  
  /**
   * Load module on interaction
   */
  static loadOnInteraction(element, modulePath) {
    const loadModule = () => {
      this.loadModule(modulePath);
      element.removeEventListener('click', loadModule);
      element.removeEventListener('mouseenter', loadModule);
    };
    
    element.addEventListener('click', loadModule, { once: true });
    element.addEventListener('mouseenter', loadModule, { once: true });
  }
}

/**
 * Request Idle Callback wrapper
 */
class IdleScheduler {
  /**
   * Schedule low-priority task
   */
  static schedule(callback, options = {}) {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(callback, options);
    } else {
      // Fallback to setTimeout
      return setTimeout(callback, 1);
    }
  }
  
  /**
   * Cancel scheduled task
   */
  static cancel(id) {
    if ('cancelIdleCallback' in window) {
      cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }
}

/**
 * Initialize performance optimizations
 */
function initPerformanceOptimizations() {
  // Initialize lazy loading
  const lazyLoader = new LazyLoader();
  
  // Log performance metrics (development only)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
      PerformanceMonitor.logMetrics();
    });
  }
  
  // Preconnect to external resources
  ResourceHints.preconnect('https://cdnjs.cloudflare.com', true);
  ResourceHints.preconnect('https://fonts.googleapis.com', true);
  
  // Store lazyLoader globally for access
  window.lazyLoader = lazyLoader;
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
} else {
  initPerformanceOptimizations();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LazyLoader,
    CSSLoader,
    ScriptLoader,
    PerformanceMonitor,
    ResourceHints,
    ImageOptimizer,
    CodeSplitter,
    IdleScheduler
  };
}
