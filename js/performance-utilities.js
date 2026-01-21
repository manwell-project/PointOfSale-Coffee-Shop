/**
 * JavaScript Performance Utilities
 * Coffee Shop POS System
 * Debounce, throttle, and event optimization
 */

/**
 * Debounce function
 * Delays execution until after wait milliseconds have elapsed since the last call
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @param {boolean} immediate - Trigger on leading edge instead of trailing
 * @returns {Function}
 * 
 * @example
 * const debouncedSearch = debounce(searchFunction, 300);
 * searchInput.addEventListener('input', debouncedSearch);
 */
function debounce(func, wait = 250, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function
 * Ensures function is called at most once per specified time period
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds between executions
 * @returns {Function}
 * 
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
function throttle(func, limit = 100) {
  let inThrottle;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Advanced throttle with leading and trailing options
 */
function throttleAdvanced(func, limit = 100, options = {}) {
  let timeout;
  let previous = 0;
  
  const { leading = true, trailing = true } = options;
  
  return function(...args) {
    const context = this;
    const now = Date.now();
    
    if (!previous && !leading) previous = now;
    
    const remaining = limit - (now - previous);
    
    if (remaining <= 0 || remaining > limit) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

/**
 * Request Animation Frame throttle
 * Best for scroll, resize, and animation events
 * 
 * @param {Function} func - Function to throttle
 * @returns {Function}
 * 
 * @example
 * const rafThrottledResize = rafThrottle(handleResize);
 * window.addEventListener('resize', rafThrottledResize);
 */
function rafThrottle(func) {
  let rafId = null;
  
  return function(...args) {
    const context = this;
    
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      func.apply(context, args);
      rafId = null;
    });
  };
}

/**
 * Event Delegation Helper
 * Efficient event handling for dynamic elements
 * 
 * @param {string} selector - CSS selector for target elements
 * @param {string} eventType - Event type (click, input, etc.)
 * @param {Function} handler - Event handler function
 * @param {Element} parent - Parent element (default: document)
 */
function delegate(selector, eventType, handler, parent = document) {
  parent.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target) {
      handler.call(target, event);
    }
  });
}

/**
 * Passive Event Listener Helper
 * Improves scroll performance
 */
class PassiveListeners {
  /**
   * Add passive scroll listener
   */
  static addScrollListener(element, handler) {
    element.addEventListener('scroll', handler, { passive: true });
  }
  
  /**
   * Add passive touch listener
   */
  static addTouchListener(element, handler, eventType = 'touchstart') {
    element.addEventListener(eventType, handler, { passive: true });
  }
  
  /**
   * Add passive wheel listener
   */
  static addWheelListener(element, handler) {
    element.addEventListener('wheel', handler, { passive: true });
  }
}

/**
 * Memoization for expensive function calls
 * 
 * @param {Function} func - Function to memoize
 * @returns {Function}
 * 
 * @example
 * const memoizedCalculation = memoize(expensiveCalculation);
 */
function memoize(func) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * Memoization with TTL (Time To Live)
 */
function memoizeWithTTL(func, ttl = 5000) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    
    const result = func.apply(this, args);
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });
    
    return result;
  };
}

/**
 * Virtual Scroll for large lists
 */
class VirtualScroll {
  constructor(container, options = {}) {
    this.container = container;
    this.items = [];
    this.visibleItems = [];
    
    this.options = {
      itemHeight: 50,
      buffer: 5,
      ...options
    };
    
    this.scrollTop = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    
    this.init();
  }
  
  init() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    // Throttled scroll handler
    const handleScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    }, 16);
    
    this.container.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  setItems(items) {
    this.items = items;
    this.render();
  }
  
  render() {
    const { itemHeight, buffer } = this.options;
    const containerHeight = this.container.clientHeight;
    
    // Calculate visible range
    this.visibleStart = Math.max(0, Math.floor(this.scrollTop / itemHeight) - buffer);
    this.visibleEnd = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + containerHeight) / itemHeight) + buffer
    );
    
    // Create spacer for scrollbar
    const totalHeight = this.items.length * itemHeight;
    const offsetY = this.visibleStart * itemHeight;
    
    this.container.innerHTML = `
      <div style="height: ${totalHeight}px; position: relative;">
        <div style="transform: translateY(${offsetY}px);">
          ${this.items
            .slice(this.visibleStart, this.visibleEnd)
            .map((item, index) => this.renderItem(item, this.visibleStart + index))
            .join('')}
        </div>
      </div>
    `;
  }
  
  renderItem(item, index) {
    // Override this method for custom rendering
    return `
      <div class="virtual-item" style="height: ${this.options.itemHeight}px;">
        ${item}
      </div>
    `;
  }
}

/**
 * Batch DOM Updates
 */
class DOMBatcher {
  constructor() {
    this.queue = [];
    this.scheduled = false;
  }
  
  /**
   * Add update to batch queue
   */
  add(updateFn) {
    this.queue.push(updateFn);
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  /**
   * Execute all queued updates
   */
  flush() {
    this.queue.forEach(fn => fn());
    this.queue = [];
    this.scheduled = false;
  }
}

/**
 * Intersection Observer Pool
 * Reuse single observer for multiple elements
 */
class ObserverPool {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = {
      rootMargin: '0px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
    
    this.elements = new Map();
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      const callback = this.elements.get(entry.target);
      if (callback) {
        callback(entry);
      }
    });
  }
  
  observe(element, callback) {
    this.elements.set(element, callback);
    this.observer.observe(element);
  }
  
  unobserve(element) {
    this.elements.delete(element);
    this.observer.unobserve(element);
  }
  
  disconnect() {
    this.observer.disconnect();
    this.elements.clear();
  }
}

/**
 * Optimize Search Input
 */
class OptimizedSearch {
  constructor(input, searchFunction, options = {}) {
    this.input = input;
    this.searchFunction = searchFunction;
    
    this.options = {
      debounceTime: 300,
      minLength: 2,
      ...options
    };
    
    this.init();
  }
  
  init() {
    const debouncedSearch = debounce(
      this.handleSearch.bind(this),
      this.options.debounceTime
    );
    
    this.input.addEventListener('input', debouncedSearch);
  }
  
  handleSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length < this.options.minLength) {
      return;
    }
    
    this.searchFunction(query);
  }
}

/**
 * Event Bus for decoupled communication
 */
class EventBus {
  constructor() {
    this.events = new Map();
  }
  
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }
  
  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
  
  emit(event, data) {
    if (!this.events.has(event)) return;
    
    this.events.get(event).forEach(callback => {
      callback(data);
    });
  }
  
  once(event, callback) {
    const wrappedCallback = (data) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }
}

/**
 * Memory-efficient data store
 */
class DataStore {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    // LRU: Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  get size() {
    return this.cache.size;
  }
}

// Create global instances
const globalEventBus = new EventBus();
const globalDOMBatcher = new DOMBatcher();
const globalDataStore = new DataStore(200);

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debounce,
    throttle,
    throttleAdvanced,
    rafThrottle,
    delegate,
    PassiveListeners,
    memoize,
    memoizeWithTTL,
    VirtualScroll,
    DOMBatcher,
    ObserverPool,
    OptimizedSearch,
    EventBus,
    DataStore,
    globalEventBus,
    globalDOMBatcher,
    globalDataStore
  };
}
