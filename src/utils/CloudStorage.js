import { firebaseConfig, COLLECTIONS, PRESET_STATUS } from '../config/firebase.config.js';

class CloudStorage {
  constructor() {
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.firebase = null;
    this.initialized = false;
    this.currentUser = null;
    this.listeners = new Map();
    this.initializationPromise = null;
  }

  // Retry function with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Check connection status
  isConnected() {
    return this.initialized && this.currentUser;
  }

  // Get connection status for UI
  getConnectionStatus() {
    if (!this.initialized) return { connected: false, status: 'offline' };
    if (!this.currentUser) return { connected: false, status: 'connecting' };
    return { connected: true, status: 'online' };
  }


  async initialize() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  async doInitialize() {
    try {
      // Dynamic import of Firebase modules
      const { initializeApp, setLogLevel } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, limit, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const { getAuth, signInAnonymously, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
      
      // Suppress Firebase internal logging
      setLogLevel('silent');

      // Initialize Firebase app
      const app = initializeApp(firebaseConfig);
      this.db = getFirestore(app);
      this.auth = getAuth(app);
      this.storage = getStorage(app);

      // Store Firebase methods
      this.firebase = {
        collection, doc, setDoc, getDoc, getDocs, deleteDoc, 
        query, where, orderBy, limit, onSnapshot,
        signInAnonymously, onAuthStateChanged,
        ref, uploadBytes, getDownloadURL
      };

      // Set up auth listener
      this.firebase.onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.notifyListeners('auth', user);
      });

      // Sign in anonymously with retry logic
      await this.retryWithBackoff(async () => {
        await this.firebase.signInAnonymously(this.auth);
      }, 2, 2000); // Reduced retries, longer delay

      this.initialized = true;
      // Cloud storage connected
    } catch (error) {
      // Working offline - cloud features unavailable
      this.initialized = false;
    }
  }

  async savePreset(preset, status = PRESET_STATUS.PUBLIC) {
    await this.initialize();
    
    // Skip saving invalid preset names (test artifacts, etc.)
    if (this.isInvalidPresetName(preset.name)) {
      // Skipping invalid preset name
      throw new Error(`Invalid preset name "${preset.name}" not allowed in cloud storage`);
    }
    
    // Validate and clean preset data before saving
    if (!preset || typeof preset !== 'object') {
      throw new Error('Invalid preset data');
    }
    
    const userId = this.currentUser?.uid || 'anonymous';
    const safeName = preset.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    // Use consistent ID based on user and name for proper updates
    const id = preset.id || `${userId}_${safeName}`;
    
    // Check if preset already exists
    const existingPreset = await this.getPreset(id).catch(() => null);
    
    let presetData;
    if (existingPreset) {
      // Update existing preset, preserving creation info
      presetData = this.prepareForFirestore({
        ...preset,
        userId,
        status,
        createdAt: existingPreset.createdAt, // Preserve original creation time
        updatedAt: new Date().toISOString(),
        version: (existingPreset.version || 1) + 1
      });
    } else {
      // Create new preset
      presetData = this.prepareForFirestore({
        ...preset,
        userId,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      });
    }
    
    try {
      await this.firebase.setDoc(
        this.firebase.doc(this.db, COLLECTIONS.PRESETS, id), 
        presetData
      );
      return { ...presetData, id };
    } catch (error) {
      // Log error only in development mode
      if (window.location.hostname === 'localhost') {
        console.error('Firebase save error:', error);
        console.error('Preset data that failed:', presetData);
        
        // Check for specific Firebase errors
        if (error.code === 'invalid-argument') {
          console.error('Invalid data structure for Firestore. Check for unsupported data types.');
        }
      }
      
      // Failed to save preset to cloud
      throw error;
    }
  }

  // Check if a preset name should be blocked from cloud storage
  isInvalidPresetName(name) {
    if (!name || typeof name !== 'string') return true;
    
    // Normalize name for comparison
    const normalizedName = name.trim().toLowerCase();
    
    // Block test artifacts and invalid names
    const invalidNames = [
      'custom',
      'new preset',
      'untitled',
      'automaticsaveasnew', // Block test suite artifacts
      'test preset',
      'temp',
      'temporary',
      'workflowvalidation', // Block test suite workflow validation presets
      'simplifiedworkflowtest', // Block test suite workflow presets
      'conf_02',
      'confett',
      'confetty'
    ];
    
    // Check for exact matches
    if (invalidNames.includes(normalizedName)) {
      return true;
    }
    
    // Block names that start with test patterns
    const invalidPatterns = ['test_', 'temp_', 'auto_', 'conf_'];
    if (invalidPatterns.some(pattern => normalizedName.startsWith(pattern))) {
      return true;
    }
    
    // Block names that contain test indicators
    const testIndicators = ['test', 'workflow', 'debug', 'validation'];
    if (testIndicators.some(indicator => normalizedName.includes(indicator))) {
      return true;
    }
    
    return false;
  }

  // Extract only the essential content for comparison (exclude metadata)
  extractPresetContent(preset) {
    return {
      name: preset.name,
      speciesCount: preset.speciesCount,
      forces: preset.forces,
      startPositions: preset.startPositions,
      parameters: preset.parameters
    };
  }

  // Create a simple hash of preset content for comparison
  hashPresetContent(content) {
    const jsonStr = JSON.stringify(content, Object.keys(content).sort());
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Convert nested arrays to Firestore-compatible format
  prepareForFirestore(obj) {
    const prepared = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values
      if (value === undefined) {
        continue;
      }
      
      // Skip null values - Firestore accepts them
      if (value === null) {
        prepared[key] = null;
        continue;
      }
      
      // Handle NaN and Infinity
      if (typeof value === 'number') {
        if (isNaN(value)) {
          prepared[key] = null;
          continue;
        }
        if (!isFinite(value)) {
          prepared[key] = value > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
          continue;
        }
      }
      
      // Special handling for modulations array
      if (key === 'modulations' && Array.isArray(value)) {
        prepared[key] = value.map(mod => {
          const sanitized = {};
          for (const [modKey, modValue] of Object.entries(mod)) {
            if (modValue !== undefined && typeof modValue !== 'function') {
              if (typeof modValue === 'number') {
                if (isNaN(modValue)) {
                  sanitized[modKey] = 0;
                } else if (!isFinite(modValue)) {
                  sanitized[modKey] = modValue > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
                } else {
                  sanitized[modKey] = modValue;
                }
              } else {
                sanitized[modKey] = modValue;
              }
            }
          }
          return sanitized;
        });
        continue;
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        // Check if it's a nested array (2D array)
        if (value.length > 0 && Array.isArray(value[0])) {
          // Convert 2D array to flat array with metadata
          prepared[key] = {
            _type: 'matrix2d',
            rows: value.length,
            cols: value[0].length,
            data: value.flat().map(v => {
              // Sanitize numeric values in arrays
              if (typeof v === 'number') {
                if (isNaN(v)) return 0;
                if (!isFinite(v)) return v > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
              }
              return v;
            })
          };
        } else {
          // Sanitize array values
          prepared[key] = value.map(v => {
            if (typeof v === 'number') {
              if (isNaN(v)) return 0;
              if (!isFinite(v)) return v > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
            }
            if (v && typeof v === 'object' && !(v instanceof Date)) {
              return this.prepareForFirestore(v);
            }
            return v;
          });
        }
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        // Recursively handle nested objects
        prepared[key] = this.prepareForFirestore(value);
      } else if (typeof value === 'function') {
        // Skip functions entirely
        continue;
      } else {
        prepared[key] = value;
      }
    }
    
    return prepared;
  }

  // Convert from Firestore format back to nested arrays
  parseFromFirestore(obj) {
    const parsed = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value._type === 'matrix2d') {
        // Convert flat array back to 2D array
        const matrix = [];
        for (let i = 0; i < value.rows; i++) {
          matrix.push(value.data.slice(i * value.cols, (i + 1) * value.cols));
        }
        parsed[key] = matrix;
      } else if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
        // Recursively handle nested objects
        parsed[key] = this.parseFromFirestore(value);
      } else {
        parsed[key] = value;
      }
    }
    
    return parsed;
  }

  async getPreset(id) {
    await this.initialize();
    
    try {
      const docSnap = await this.firebase.getDoc(
        this.firebase.doc(this.db, COLLECTIONS.PRESETS, id)
      );
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const parsed = this.parseFromFirestore(data);
        return { id: docSnap.id, ...parsed };
      }
      return null;
    } catch (error) {
      // Failed to get preset from cloud
      throw error;
    }
  }

  async getAllPresets(options = {}) {
    await this.initialize();
    
    const { 
      userId = null, 
      status = null, 
      limit: queryLimit = 200  // Increased limit
    } = options;

    try {
      // Use the simplest possible query to avoid index issues
      let q = this.firebase.collection(this.db, COLLECTIONS.PRESETS);
      
      // Build query with minimal constraints to avoid composite index requirements
      const constraints = [];
      
      // Only filter by status if specified (most common filter)
      if (status && !userId) {
        constraints.push(this.firebase.where('status', '==', status));
        constraints.push(this.firebase.limit(queryLimit));
      } else if (userId && !status) {
        // Simple userId filter without ordering
        constraints.push(this.firebase.where('userId', '==', userId));
        constraints.push(this.firebase.limit(queryLimit));
      } else if (!userId && !status) {
        // Get all presets with just a limit
        constraints.push(this.firebase.limit(queryLimit));
      } else {
        // For complex queries, do two separate queries and combine results
        return await this.getAllPresetsWithFallback(userId, status, queryLimit);
      }
      
      if (constraints.length > 0) {
        q = this.firebase.query(q, ...constraints);
      }
      
      const querySnapshot = await this.firebase.getDocs(q);
      const presets = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const parsed = this.parseFromFirestore(data);
        presets.push({ id: doc.id, ...parsed });
      });
      
      // Sort in memory instead of using orderBy to avoid index requirements
      presets.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA; // Most recent first
      });
      
      return presets;
    } catch (error) {
      // Failed to get presets from cloud
      // Fallback to getting all presets without filters
      return await this.getAllPresetsWithFallback(null, null, queryLimit);
    }
  }

  // Fallback method that handles complex queries by doing separate queries
  async getAllPresetsWithFallback(userId, status, limit) {
    try {
      // Get all presets without complex filtering
      const q = this.firebase.query(
        this.firebase.collection(this.db, COLLECTIONS.PRESETS),
        this.firebase.limit(limit)
      );
      
      const querySnapshot = await this.firebase.getDocs(q);
      const allPresets = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const parsed = this.parseFromFirestore(data);
        allPresets.push({ id: doc.id, ...parsed });
      });
      
      // Filter in memory
      let filteredPresets = allPresets;
      
      if (userId) {
        filteredPresets = filteredPresets.filter(p => p.userId === userId);
      }
      
      if (status) {
        filteredPresets = filteredPresets.filter(p => p.status === status);
      }
      
      // Sort by date
      filteredPresets.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      return filteredPresets;
    } catch (error) {
      // Fallback query also failed
      return [];
    }
  }

  async deletePreset(id) {
    await this.initialize();
    
    try {
      await this.firebase.deleteDoc(
        this.firebase.doc(this.db, COLLECTIONS.PRESETS, id)
      );
      return true;
    } catch (error) {
      // Failed to delete preset from cloud
      throw error;
    }
  }

  async updatePresetStatus(id, status) {
    await this.initialize();
    
    try {
      await this.firebase.setDoc(
        this.firebase.doc(this.db, COLLECTIONS.PRESETS, id),
        { status, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return true;
    } catch (error) {
      // Failed to update preset status
      throw error;
    }
  }

  async createShareLink(presetId, expiresIn = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    await this.initialize();
    
    const shareData = {
      presetId,
      createdBy: this.currentUser?.uid || 'anonymous',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn).toISOString(),
      accessCount: 0
    };
    
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.firebase.setDoc(
        this.firebase.doc(this.db, COLLECTIONS.SHARED_LINKS, shareId),
        shareData
      );
      
      return {
        id: shareId,
        url: `${window.location.origin}?preset=${shareId}`
      };
    } catch (error) {
      // Failed to create share link
      throw error;
    }
  }

  async getSharedPreset(shareId) {
    await this.initialize();
    
    try {
      // Get share link data
      const shareDoc = await this.firebase.getDoc(
        this.firebase.doc(this.db, COLLECTIONS.SHARED_LINKS, shareId)
      );
      
      if (!shareDoc.exists()) {
        throw new Error('Share link not found');
      }
      
      const shareData = shareDoc.data();
      
      // Check if expired
      if (new Date(shareData.expiresAt) < new Date()) {
        throw new Error('Share link has expired');
      }
      
      // Update access count
      await this.firebase.setDoc(
        this.firebase.doc(this.db, COLLECTIONS.SHARED_LINKS, shareId),
        { accessCount: shareData.accessCount + 1 },
        { merge: true }
      );
      
      // Get the actual preset
      return await this.getPreset(shareData.presetId);
    } catch (error) {
      // Failed to get shared preset
      throw error;
    }
  }

  subscribeToPresets(callback, options = {}) {
    const { userId = null, status = PRESET_STATUS.PUBLIC } = options;
    
    this.initialize().then(() => {
      if (!this.initialized || !this.currentUser) {
        // Call callback with empty array if not connected
        callback([]);
        return null;
      }
      
      // Use polling with exponential backoff for resilience
      let pollInterval = 10000; // Start with 10 seconds
      const maxInterval = 60000; // Max 60 seconds
      let pollAttempts = 0;
      
      const pollPresets = async () => {
        try {
          const presets = await this.getAllPresets({ userId, status, limit: 200 });
          callback(presets);
          
          // Reset interval on success
          pollInterval = 10000;
          pollAttempts = 0;
        } catch (error) {
          // Polling failed, retrying with longer interval
          pollAttempts++;
          
          // Exponential backoff
          pollInterval = Math.min(pollInterval * Math.pow(1.5, pollAttempts), maxInterval);
          
          // Call callback with empty array on persistent failures
          if (pollAttempts > 3) {
            callback([]);
          }
        }
      };
      
      // Initial load
      pollPresets();
      
      // Dynamic polling with adaptive intervals
      let currentIntervalId;
      const scheduleNextPoll = () => {
        if (currentIntervalId) {
          clearTimeout(currentIntervalId);
        }
        currentIntervalId = setTimeout(() => {
          pollPresets();
          scheduleNextPoll();
        }, pollInterval);
      };
      
      scheduleNextPoll();
      
      // Store cleanup function
      const listenerId = `presets_${Date.now()}`;
      this.listeners.set(listenerId, () => {
        if (currentIntervalId) {
          clearTimeout(currentIntervalId);
        }
      });
      
      return listenerId;
    }).catch((error) => {
      // Failed to initialize preset subscription
      // Call callback with empty array on initialization failure
      callback([]);
      return null;
    });
  }

  unsubscribe(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  addAuthListener(callback) {
    const listenerId = `auth_${Date.now()}`;
    this.listeners.set(listenerId, callback);
    return listenerId;
  }

  notifyListeners(type, data) {
    this.listeners.forEach((listener, id) => {
      if (id.startsWith(type)) {
        listener(data);
      }
    });
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentUserId() {
    return this.currentUser?.uid || null;
  }

  // Clean up test presets and duplicates
  async cleanupTestPresets() {
    if (!this.initialized || !this.currentUser) {
      return 0;
    }

    try {
      const userId = this.currentUser.uid;
      
      // Use a simpler query that doesn't require composite index
      // Just get presets by userId without ordering
      const q = this.firebase.query(
        this.firebase.collection(this.db, COLLECTIONS.PRESETS),
        this.firebase.where('userId', '==', userId),
        this.firebase.limit(200)
      );
      
      const querySnapshot = await this.firebase.getDocs(q);
      const userPresets = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const parsed = this.parseFromFirestore(data);
        userPresets.push({
          id: doc.id,
          ...parsed
        });
      });
      
      // Sort in memory to avoid index requirement
      userPresets.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      const toDelete = [];
      const seenNames = new Map(); // Track duplicates by name
      
      for (const preset of userPresets) {
        // Mark invalid preset names for deletion
        if (this.isInvalidPresetName(preset.name)) {
          toDelete.push(preset);
          continue;
        }
        
        // Track duplicates - keep the most recent version
        const key = preset.name.toLowerCase();
        if (seenNames.has(key)) {
          const existing = seenNames.get(key);
          // Keep the one with the higher version or more recent update
          if ((preset.version || 1) > (existing.version || 1) || 
              preset.updatedAt > existing.updatedAt) {
            toDelete.push(existing);
            seenNames.set(key, preset);
          } else {
            toDelete.push(preset);
          }
        } else {
          seenNames.set(key, preset);
        }
      }
      
      // Delete marked presets
      for (const preset of toDelete) {
        try {
          // Delete invalid or duplicate preset
          await this.deletePreset(preset.id);
        } catch (error) {
          // Failed to delete preset
        }
      }
      
      if (toDelete.length > 0) {
        // Cleaned up invalid presets
      }
      return toDelete.length;
    } catch (error) {
      // Cleanup failed
      throw error;
    }
  }
}

// Export singleton instance
export const cloudStorage = new CloudStorage();