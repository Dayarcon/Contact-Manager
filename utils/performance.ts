
// Performance constants
export const PERFORMANCE_CONFIG = {
  SEARCH_DEBOUNCE_MS: 300,
  CACHE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  MAX_SEARCH_RESULTS: 100,
  BATCH_SIZE: 20,
  FLATLIST_CONFIG: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 100,
    disableVirtualization: false,
  },
};

// Cache management
class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  set(key: string, data: any, expiryMs: number = PERFORMANCE_CONFIG.CACHE_EXPIRY_MS) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + expiryMs,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp) {
        this.cache.delete(key);
      }
    }
  }
}

export const performanceCache = new PerformanceCache();

// Optimized search algorithm with fuzzy matching
export const optimizedSearch = (
  contacts: any[],
  query: string,
  options: {
    maxResults?: number;
    searchFields?: string[];
    fuzzyMatch?: boolean;
  } = {}
): any[] => {
  const {
    maxResults = PERFORMANCE_CONFIG.MAX_SEARCH_RESULTS,
    searchFields = ['name', 'company', 'jobTitle', 'phoneNumbers', 'emailAddresses'],
    fuzzyMatch = true,
  } = options;

  if (!query.trim()) return contacts.slice(0, maxResults);

  const searchTerm = query.toLowerCase().trim();
  const results: Array<{ contact: any; score: number }> = [];

  for (const contact of contacts) {
    let score = 0;
    let hasMatch = false;

    // Search in name (highest priority)
    if (contact.name) {
      const nameLower = contact.name.toLowerCase();
      if (nameLower.includes(searchTerm)) {
        score += 100;
        hasMatch = true;
      } else if (fuzzyMatch && fuzzyMatchScore(nameLower, searchTerm) > 0.7) {
        score += 80;
        hasMatch = true;
      }
    }

    // Search in company
    if (contact.company) {
      const companyLower = contact.company.toLowerCase();
      if (companyLower.includes(searchTerm)) {
        score += 50;
        hasMatch = true;
      }
    }

    // Search in job title
    if (contact.jobTitle) {
      const jobTitleLower = contact.jobTitle.toLowerCase();
      if (jobTitleLower.includes(searchTerm)) {
        score += 40;
        hasMatch = true;
      }
    }

    // Search in phone numbers
    if (contact.phoneNumbers) {
      for (const phone of contact.phoneNumbers) {
        if (phone.number && phone.number.includes(searchTerm)) {
          score += 30;
          hasMatch = true;
          break;
        }
      }
    }

    // Search in email addresses
    if (contact.emailAddresses) {
      for (const email of contact.emailAddresses) {
        if (email.email && email.email.toLowerCase().includes(searchTerm)) {
          score += 30;
          hasMatch = true;
          break;
        }
      }
    }

    if (hasMatch) {
      results.push({ contact, score });
    }
  }

  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.contact);
};

// Fuzzy matching algorithm (Levenshtein distance based)
const fuzzyMatchScore = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
};

// Batch processing utility
export const processBatch = <T>(
  items: T[],
  batchSize: number = PERFORMANCE_CONFIG.BATCH_SIZE,
  processor: (batch: T[]) => void
): Promise<void> => {
  return new Promise((resolve) => {
    let index = 0;

    const processNextBatch = () => {
      const batch = items.slice(index, index + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }

      processor(batch);
      index += batchSize;

      // Use requestAnimationFrame for smooth UI
      requestAnimationFrame(processNextBatch);
    };

    processNextBatch();
  });
};

// Debounced function with performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = PERFORMANCE_CONFIG.SEARCH_DEBOUNCE_MS
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttled function for performance-critical operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory management utilities
export const memoryOptimization = {
  // Clear unused images from memory
  clearImageCache: async () => {
    try {
      // This would integrate with image caching library
      console.log('[Performance] Image cache cleared');
    } catch (error) {
      console.error('[Performance] Error clearing image cache:', error);
    }
  },

  // Optimize contact data structure
  optimizeContactData: (contacts: any[]) => {
    return contacts.map(contact => ({
      ...contact,
      // Remove unnecessary fields for list rendering
      history: contact.history?.slice(-5), // Keep only last 5 interactions
      notes: contact.notes?.length > 100 ? contact.notes.substring(0, 100) + '...' : contact.notes,
    }));
  },

  // Batch update contacts to reduce re-renders
  batchUpdateContacts: (updates: Array<{ id: string; updates: any }>) => {
    return updates.reduce((acc, { id, updates }) => {
      acc[id] = updates;
      return acc;
    }, {} as Record<string, any>);
  },
};

// Performance monitoring
export const performanceMonitor = {
  startTime: 0,
  measurements: new Map<string, number[]>(),

  start: (label: string) => {
    performanceMonitor.startTime = performance.now();
  },

  end: (label: string) => {
    const duration = performance.now() - performanceMonitor.startTime;
    if (!performanceMonitor.measurements.has(label)) {
      performanceMonitor.measurements.set(label, []);
    }
    performanceMonitor.measurements.get(label)!.push(duration);
    
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  },

  getAverage: (label: string): number => {
    const measurements = performanceMonitor.measurements.get(label);
    if (!measurements || measurements.length === 0) return 0;
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  },

  clear: () => {
    performanceMonitor.measurements.clear();
  },
}; 