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
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing Firebase...');
    try {
      // Dynamic import of Firebase
      console.log('Loading Firebase modules...');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, limit, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const { getAuth, signInAnonymously, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');

      // Initialize Firebase
      console.log('Initializing Firebase app with config:', firebaseConfig.projectId);
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
      console.log('Setting up auth listener...');
      this.firebase.onAuthStateChanged(this.auth, (user) => {
        console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
        this.currentUser = user;
        this.notifyListeners('auth', user);
      });

      // Sign in anonymously by default
      console.log('Signing in anonymously...');
      await this.firebase.signInAnonymously(this.auth);
      console.log('Anonymous sign-in complete');

      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      throw error;
    }
  }

  async savePreset(preset, status = PRESET_STATUS.PRIVATE) {
    await this.initialize();
    
    // Deep clone and convert nested arrays to Firestore-compatible format
    const presetData = this.prepareForFirestore({
      ...preset,
      userId: this.currentUser?.uid || 'anonymous',
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    });

    // Generate ID if not provided
    const id = preset.id || `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.firebase.setDoc(
        this.firebase.doc(this.db, COLLECTIONS.PRESETS, id), 
        presetData
      );
      return { ...presetData, id };
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error;
    }
  }

  // Convert nested arrays to Firestore-compatible format
  prepareForFirestore(obj) {
    const prepared = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        // Check if it's a nested array (2D array)
        if (value.length > 0 && Array.isArray(value[0])) {
          // Convert 2D array to flat array with metadata
          prepared[key] = {
            _type: 'matrix2d',
            rows: value.length,
            cols: value[0].length,
            data: value.flat()
          };
        } else {
          prepared[key] = value;
        }
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        // Recursively handle nested objects
        prepared[key] = this.prepareForFirestore(value);
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
      console.error('Failed to get preset:', error);
      throw error;
    }
  }

  async getAllPresets(options = {}) {
    await this.initialize();
    
    const { 
      userId = null, 
      status = null, 
      limit: queryLimit = 100,
      orderByField = 'updatedAt'
    } = options;

    try {
      let q = this.firebase.collection(this.db, COLLECTIONS.PRESETS);
      
      // Build query
      const constraints = [];
      
      if (userId) {
        constraints.push(this.firebase.where('userId', '==', userId));
      }
      
      if (status) {
        constraints.push(this.firebase.where('status', '==', status));
      }
      
      constraints.push(this.firebase.orderBy(orderByField, 'desc'));
      constraints.push(this.firebase.limit(queryLimit));
      
      q = this.firebase.query(q, ...constraints);
      
      const querySnapshot = await this.firebase.getDocs(q);
      const presets = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const parsed = this.parseFromFirestore(data);
        presets.push({ id: doc.id, ...parsed });
      });
      
      return presets;
    } catch (error) {
      console.error('Failed to get presets:', error);
      throw error;
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
      console.error('Failed to delete preset:', error);
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
      console.error('Failed to update preset status:', error);
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
      console.error('Failed to create share link:', error);
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
      console.error('Failed to get shared preset:', error);
      throw error;
    }
  }

  subscribeToPresets(callback, options = {}) {
    const { userId = null, status = PRESET_STATUS.PUBLIC } = options;
    
    this.initialize().then(() => {
      let q = this.firebase.collection(this.db, COLLECTIONS.PRESETS);
      
      const constraints = [];
      if (userId) {
        constraints.push(this.firebase.where('userId', '==', userId));
      }
      if (status) {
        constraints.push(this.firebase.where('status', '==', status));
      }
      constraints.push(this.firebase.orderBy('updatedAt', 'desc'));
      
      q = this.firebase.query(q, ...constraints);
      
      const unsubscribe = this.firebase.onSnapshot(q, (snapshot) => {
        const presets = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const parsed = this.parseFromFirestore(data);
          presets.push({ id: doc.id, ...parsed });
        });
        callback(presets);
      });
      
      // Store unsubscribe function
      const listenerId = `presets_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return listenerId;
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
}

// Export singleton instance
export const cloudStorage = new CloudStorage();