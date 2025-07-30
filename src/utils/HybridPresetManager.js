import { PresetManager } from './PresetManager.js';
import { cloudStorage } from './CloudStorage.js';
import { PRESET_STATUS } from '../config/firebase.config.js';

export class HybridPresetManager extends PresetManager {
  constructor() {
    super();
    this.cloudEnabled = false;
    this.syncInProgress = false;
    this.cloudPresets = new Map();
    this.syncListenerId = null;
    
    // Clean up test artifacts on initialization
    setTimeout(() => {
      this.cleanupLocalTestPresets();
    }, 1000); // Wait a bit for everything to load
  }

  async enableCloudSync() {
    if (this.cloudEnabled) return;

    try {
      await cloudStorage.initialize();
      this.cloudEnabled = true;

      // Subscribe to cloud preset updates
      this.syncListenerId = cloudStorage.subscribeToPresets((presets) => {
        this.handleCloudUpdate(presets);
      }, { status: PRESET_STATUS.PUBLIC });

      // Initial sync
      await this.syncWithCloud();
      
      // Clean up test presets from cloud (background task)
      setTimeout(async () => {
        try {
          await this.cleanupCloudPresets();
        } catch (error) {
          console.log('Cloud cleanup failed (non-critical):', error.message);
        }
      }, 2000);
      
      // Cloud sync enabled
    } catch (error) {
      console.error('Failed to enable cloud sync:', error.message);
      this.cloudEnabled = false;
    }
  }

  disableCloudSync() {
    if (this.syncListenerId) {
      cloudStorage.unsubscribe(this.syncListenerId);
      this.syncListenerId = null;
    }
    this.cloudEnabled = false;
    this.cloudPresets.clear();
  }

  async syncWithCloud() {
    if (!this.cloudEnabled || this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      // Get all public presets from cloud
      const cloudPresets = await cloudStorage.getAllPresets({ 
        status: PRESET_STATUS.PUBLIC,
        limit: 100  // Increased limit to get all presets
      });

      // Update cloud presets map, filtering out invalid ones
      this.cloudPresets.clear();
      for (const preset of cloudPresets) {
        // Skip invalid presets
        if (this.isInvalidPresetName(preset.name)) continue;
        if (preset.name.toLowerCase() === 'randomize') continue;
        
        this.cloudPresets.set(preset.id, preset);
      }

      if (this.cloudPresets.size > 0) {
        console.log(`Cloud sync: ${this.cloudPresets.size} presets loaded`);
      }
    } catch (error) {
      console.error('Cloud sync failed:', error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Batch upload presets for better performance
  async batchUploadPresets(presetsToUpload, batchSize = 5) {
    for (let i = 0; i < presetsToUpload.length; i += batchSize) {
      const batch = presetsToUpload.slice(i, i + batchSize);
      
      // Upload batch in parallel
      const uploadPromises = batch.map(({ key, preset }) => 
        this.uploadPresetToCloud(key, preset).catch(error => {
          console.error(`Failed to sync preset to cloud:`, error.message);
          return null; // Continue with other uploads
        })
      );
      
      await Promise.all(uploadPromises);
      
      // Small delay between batches to avoid overwhelming Firebase
      if (i + batchSize < presetsToUpload.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  handleCloudUpdate(presets) {
    // Cloud update received
    // Update cloud presets map
    this.cloudPresets.clear();
    for (const preset of presets) {
      // Adding cloud preset
      this.cloudPresets.set(preset.id, preset);
    }

    // Notify UI of updates (if needed)
    window.dispatchEvent(new CustomEvent('presetsUpdated', { 
      detail: { source: 'cloud' } 
    }));
  }

  // Check if preset exists in cloud by name (simplified approach)
  presetExistsInCloud(localPreset) {
    const userId = cloudStorage.getCurrentUserId();
    const normalizedName = localPreset.name.toLowerCase().trim();
    
    for (const [id, cloudPreset] of this.cloudPresets) {
      // Only compare presets from the same user
      if (cloudPreset.userId === userId) {
        const cloudNormalizedName = cloudPreset.name.toLowerCase().trim();
        if (normalizedName === cloudNormalizedName) {
          // Local preset matches cloud preset
          return true;
        }
      }
    }
    
    return false;
  }

  // Check if preset name should be excluded from cloud uploads
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

  async savePreset(key, preset, uploadToCloud = true) {
    // Always save locally first (base PresetManager no longer validates names)
    await super.savePreset(key, preset);

    // Upload to cloud if enabled and not a temporary/invalid preset name
    if (this.cloudEnabled && uploadToCloud && !this.isInvalidPresetName(preset.name)) {
      try {
        await this.uploadPresetToCloud(key, preset);
      } catch (error) {
        console.error('Cloud upload failed:', error);
        // Don't throw - local save succeeded, but log warning
        if (error.message && error.message.includes('Invalid preset name')) {
          // Preset blocked from cloud due to invalid name
        }
      }
    } else if (this.isInvalidPresetName(preset.name)) {
      console.log('Skipping cloud upload for temporary preset:', preset.name);
    }
  }

  async uploadPresetToCloud(key, preset, status = PRESET_STATUS.PUBLIC) {
    if (!this.cloudEnabled) return;

    try {
      const cloudPreset = await cloudStorage.savePreset({
        ...preset,
        localKey: key,
        source: 'particle-life-synth'
      }, status);

      return cloudPreset;
    } catch (error) {
      console.error('Failed to upload preset to cloud:', error);
      throw error;
    }
  }

  async deletePreset(key) {
    // Delete locally
    await super.deletePreset(key);

    // Delete from cloud if it exists
    if (this.cloudEnabled) {
      const cloudPreset = Array.from(this.cloudPresets.values()).find(
        p => p.localKey === key && p.userId === cloudStorage.getCurrentUserId()
      );

      if (cloudPreset) {
        try {
          await cloudStorage.deletePreset(cloudPreset.id);
          console.log('Preset deleted from cloud:', cloudPreset.id);
        } catch (error) {
          console.error('Failed to delete preset from cloud:', error);
        }
      }
    }
  }

  async importFromCloud(cloudPresetId) {
    if (!this.cloudEnabled) {
      throw new Error('Cloud sync not enabled');
    }

    try {
      const cloudPreset = await cloudStorage.getPreset(cloudPresetId);
      if (!cloudPreset) {
        throw new Error('Cloud preset not found');
      }

      // Validate and import
      this.validatePreset(cloudPreset);
      const key = this.generateUniqueKey(cloudPreset.name);
      
      // Save locally without re-uploading to cloud
      await super.savePreset(key, cloudPreset);
      
      return key;
    } catch (error) {
      console.error('Failed to import from cloud:', error.message);
      throw error;
    }
  }

  async sharePreset(key) {
    if (!this.cloudEnabled) {
      throw new Error('Cloud sync not enabled');
    }

    const preset = this.presets.get(key);
    if (!preset) {
      throw new Error('Preset not found');
    }

    try {
      // First upload preset if not already in cloud
      let cloudPreset = Array.from(this.cloudPresets.values()).find(
        p => p.localKey === key && p.userId === cloudStorage.getCurrentUserId()
      );

      if (!cloudPreset) {
        cloudPreset = await this.uploadPresetToCloud(key, preset, PRESET_STATUS.SHARED);
      }

      // Create share link
      const shareLink = await cloudStorage.createShareLink(cloudPreset.id);
      return shareLink;
    } catch (error) {
      console.error('Failed to share preset:', error.message);
      throw error;
    }
  }

  async importFromShareLink(shareId) {
    if (!this.cloudEnabled) {
      throw new Error('Cloud sync not enabled');
    }

    try {
      const preset = await cloudStorage.getSharedPreset(shareId);
      if (!preset) {
        throw new Error('Shared preset not found or expired');
      }

      // Validate and import
      this.validatePreset(preset);
      const key = this.generateUniqueKey(preset.name);
      
      // Save locally
      await super.savePreset(key, preset);
      
      return key;
    } catch (error) {
      console.error('Failed to import shared preset:', error.message);
      throw error;
    }
  }

  getAllPresets() {
    const localPresets = super.getAllPresets();
    
    if (!this.cloudEnabled) {
      return localPresets;
    }

    // Combine local and cloud presets
    const allPresets = [...localPresets];
    
    // Add cloud presets that aren't already local
    for (const [id, cloudPreset] of this.cloudPresets) {
      const existsLocally = localPresets.some(p => 
        p.name === cloudPreset.name && 
        cloudPreset.userId === cloudStorage.getCurrentUserId()
      );
      
      if (!existsLocally) {
        allPresets.push({
          key: `cloud_${id}`,
          name: cloudPreset.name,
          isCloud: true,
          cloudId: id
        });
      }
    }

    return allPresets;
  }

  // Override getPreset to handle cloud presets
  getPreset(key) {
    // Check if it's a cloud preset
    if (key && key.startsWith('cloud_')) {
      const cloudId = key.substring(6); // Remove 'cloud_' prefix
      const cloudPreset = this.cloudPresets.get(cloudId);
      if (cloudPreset) {
        // Loading cloud preset
        return cloudPreset;
      }
    }
    
    // Otherwise, get from local storage
    return super.getPreset(key);
  }

  // Override getUserPresets to include cloud presets
  getUserPresets() {
    const userPresets = [];
    const userId = cloudStorage.getCurrentUserId();
    
    // Filter function to exclude invalid presets
    const isValidPreset = (preset) => {
      if (!preset || !preset.name) return false;
      
      // Skip invalid preset names
      if (this.isInvalidPresetName(preset.name)) return false;
      
      // Skip "randomize" - it's not a real preset
      if (preset.name.toLowerCase() === 'randomize') return false;
      
      return true;
    };
    
    // Get local presets
    for (const [key, preset] of this.presets.entries()) {
      if (isValidPreset(preset)) {
        userPresets.push({
          key: key,
          name: preset.name || key,
          preset: preset,
          isLocal: true
        });
      }
    }
    
    // Add cloud presets if enabled
    if (this.cloudEnabled) {
      for (const [id, cloudPreset] of this.cloudPresets) {
        // Include all public presets, not just from current user
        // This allows sharing presets across different anonymous sessions
        if (cloudPreset.status === 'private' && cloudPreset.userId !== userId) {
          continue;
        }
        
        // Skip invalid presets
        if (!isValidPreset(cloudPreset)) {
          continue;
        }
        
        // Check if already exists locally by name
        const existsLocally = userPresets.some(p => 
          p.name.toLowerCase() === cloudPreset.name.toLowerCase()
        );
        
        if (!existsLocally) {
          userPresets.push({
            key: `cloud_${id}`,
            name: cloudPreset.name,
            preset: cloudPreset,
            isCloud: true,
            cloudId: id
          });
        }
      }
    }
    
    // Sort by name for consistent display
    userPresets.sort((a, b) => a.name.localeCompare(b.name));
    
    return userPresets;
  }

  isCloudEnabled() {
    return this.cloudEnabled;
  }

  getCloudStatus() {
    return {
      enabled: this.cloudEnabled,
      authenticated: cloudStorage.isAuthenticated(),
      userId: cloudStorage.getCurrentUserId(),
      presetCount: this.cloudPresets.size,
      syncing: this.syncInProgress
    };
  }

  // Clean up test presets and duplicates from cloud
  async cleanupCloudPresets() {
    if (!this.cloudEnabled) {
      throw new Error('Cloud sync not enabled');
    }

    try {
      const cleanedCount = await cloudStorage.cleanupTestPresets();
      if (cleanedCount > 0) {
        console.log(`Cloud cleanup: ${cleanedCount} presets removed`);
      }
      
      // Refresh cloud presets after cleanup
      await this.syncWithCloud();
      
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup cloud presets:', error.message);
      throw error;
    }
  }

  // Clean up test presets from local storage
  cleanupLocalTestPresets() {
    let cleanedCount = 0;
    
    // Clean up from memory
    for (const [key, preset] of this.presets.entries()) {
      if (preset.name && this.isInvalidPresetName(preset.name)) {
        console.log(`Removing test preset from memory: ${preset.name}`);
        this.presets.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean up from localStorage
    try {
      const stored = localStorage.getItem('particleLifePresets');
      if (stored) {
        const customPresets = JSON.parse(stored);
        let storageChanged = false;
        
        for (const [key, preset] of Object.entries(customPresets)) {
          if (preset.name && this.isInvalidPresetName(preset.name)) {
            console.log(`Removing test preset from localStorage: ${preset.name}`);
            delete customPresets[key];
            cleanedCount++;
            storageChanged = true;
          }
        }
        
        if (storageChanged) {
          localStorage.setItem('particleLifePresets', JSON.stringify(customPresets));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
    
    // Clean up from IndexedDB storage
    this.storage.getAllPresets().then(allPresets => {
      for (const [key, preset] of Object.entries(allPresets)) {
        if (preset.name && this.isInvalidPresetName(preset.name)) {
          console.log(`Removing test preset from IndexedDB: ${preset.name}`);
          this.storage.deletePreset(key);
          cleanedCount++;
        }
      }
    }).catch(error => {
      console.error('Failed to cleanup IndexedDB:', error);
    });
    
    if (cleanedCount > 0) {
      console.log(`Local cleanup: ${cleanedCount} test presets removed`);
    }
    
    return cleanedCount;
  }
}