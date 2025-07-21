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
      
      console.log('Cloud sync enabled');
    } catch (error) {
      console.error('Failed to enable cloud sync:', error);
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
        limit: 50 
      });

      // Update cloud presets map
      this.cloudPresets.clear();
      for (const preset of cloudPresets) {
        this.cloudPresets.set(preset.id, preset);
      }

      // Upload local presets that don't exist in cloud
      const localPresets = this.getUserPresets();
      for (const { key, preset } of localPresets) {
        const exists = Array.from(this.cloudPresets.values()).some(
          p => p.name === preset.name && p.userId === cloudStorage.getCurrentUserId()
        );
        
        if (!exists) {
          await this.uploadPresetToCloud(key, preset);
        }
      }

      console.log('Cloud sync completed');
    } catch (error) {
      console.error('Cloud sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  handleCloudUpdate(presets) {
    console.log('Cloud update received, presets:', presets);
    // Update cloud presets map
    this.cloudPresets.clear();
    for (const preset of presets) {
      console.log('Adding cloud preset:', preset.id, 'name:', preset.name);
      this.cloudPresets.set(preset.id, preset);
    }

    // Notify UI of updates (if needed)
    window.dispatchEvent(new CustomEvent('presetsUpdated', { 
      detail: { source: 'cloud' } 
    }));
  }

  async savePreset(key, preset, uploadToCloud = true) {
    console.log('HybridPresetManager.savePreset called:', { key, preset, uploadToCloud, cloudEnabled: this.cloudEnabled });
    
    // Save locally first
    await super.savePreset(key, preset);
    console.log('Local save completed');

    // Upload to cloud if enabled
    if (this.cloudEnabled && uploadToCloud) {
      console.log('Attempting cloud upload...');
      try {
        await this.uploadPresetToCloud(key, preset);
        console.log('Cloud upload completed');
      } catch (error) {
        console.error('Cloud upload failed:', error);
        // Don't throw - local save succeeded
      }
    }
  }

  async uploadPresetToCloud(key, preset, status = PRESET_STATUS.PUBLIC) {
    if (!this.cloudEnabled) return;

    try {
      console.log('Uploading preset to cloud:', { key, presetName: preset.name });
      const cloudPreset = await cloudStorage.savePreset({
        ...preset,
        localKey: key,
        source: 'particle-life-synth'
      }, status);

      console.log('Preset uploaded to cloud:', cloudPreset.id, 'with name:', cloudPreset.name);
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
      console.error('Failed to import from cloud:', error);
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
      console.error('Failed to share preset:', error);
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
      console.error('Failed to import shared preset:', error);
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
          name: `☁️ ${cloudPreset.name}`,
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
        console.log('Loading cloud preset:', cloudPreset.name);
        return cloudPreset;
      }
    }
    
    // Otherwise, get from local storage
    return super.getPreset(key);
  }

  // Override getUserPresets to include cloud presets
  getUserPresets() {
    const userPresets = [];
    const builtInKeys = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'];
    
    // Get local presets
    for (const [key, preset] of this.presets.entries()) {
      if (!builtInKeys.includes(key)) {
        userPresets.push({
          key: key,
          name: preset.name || key,
          preset: preset
        });
      }
    }
    
    // Add cloud presets if enabled
    if (this.cloudEnabled) {
      for (const [id, cloudPreset] of this.cloudPresets) {
        const existsLocally = userPresets.some(p => 
          p.name === cloudPreset.name && 
          cloudPreset.userId === cloudStorage.getCurrentUserId()
        );
        
        if (!existsLocally) {
          userPresets.push({
            key: `cloud_${id}`,
            name: `☁️ ${cloudPreset.name}`,
            preset: cloudPreset,
            isCloud: true,
            cloudId: id
          });
        }
      }
    }
    
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
}