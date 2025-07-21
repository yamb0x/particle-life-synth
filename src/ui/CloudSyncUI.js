export class CloudSyncUI {
  constructor(presetManager) {
    this.presetManager = presetManager;
    this.statusElement = null;
    this.syncButton = null;
    this.shareModal = null;
  }

  initialize(container) {
    // Create share modal
    this.createShareModal();
    
    // Check for shared preset in URL
    this.checkForSharedPreset();
  }

  getCloudStatus() {
    if (this.presetManager.isCloudEnabled()) {
      const status = this.presetManager.getCloudStatus();
      
      if (status.syncing) {
        return 'Syncing...';
      } else {
        return 'Cloud: Connected';
      }
    } else {
      return 'Cloud: Offline';
    }
  }

  createShareModal() {
    const modal = document.createElement('div');
    modal.className = 'modal share-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Share Preset</h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="share-content">
            <p>Share this preset with others:</p>
            <div class="share-link-container">
              <input type="text" class="share-link-input" readonly>
              <button class="copy-button">Copy Link</button>
            </div>
            <p class="share-info">Link expires in 7 days</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.shareModal = modal;
    
    // Close button
    modal.querySelector('.close-button').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Copy button
    modal.querySelector('.copy-button').addEventListener('click', () => {
      const input = modal.querySelector('.share-link-input');
      input.select();
      document.execCommand('copy');
      
      const button = modal.querySelector('.copy-button');
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy Link';
      }, 2000);
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }


  async showShareModal(presetKey) {
    if (!this.presetManager.isCloudEnabled()) {
      alert('Please enable cloud sync to share presets');
      return;
    }
    
    try {
      const shareLink = await this.presetManager.sharePreset(presetKey);
      const input = this.shareModal.querySelector('.share-link-input');
      input.value = shareLink.url;
      this.shareModal.style.display = 'flex';
    } catch (error) {
      console.error('Failed to share preset:', error);
      alert('Failed to create share link: ' + error.message);
    }
  }

  async checkForSharedPreset() {
    const urlParams = new URLSearchParams(window.location.search);
    const presetId = urlParams.get('preset');
    
    if (!presetId) return;
    
    // Wait for cloud sync to be enabled (happens automatically)
    let attempts = 0;
    while (!this.presetManager.isCloudEnabled() && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!this.presetManager.isCloudEnabled()) {
      alert('Cloud connection failed. Please refresh and try again.');
      return;
    }
    
    // Import the shared preset
    try {
      const key = await this.presetManager.importFromShareLink(presetId);
      
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Notify user and load preset
      alert('Shared preset imported successfully!');
      
      // Trigger preset load event
      window.dispatchEvent(new CustomEvent('loadPreset', { 
        detail: { key } 
      }));
    } catch (error) {
      console.error('Failed to import shared preset:', error);
      alert('Failed to import shared preset: ' + error.message);
    }
  }

  addShareButton(presetElement, presetKey) {
    const shareButton = document.createElement('button');
    shareButton.className = 'share-preset-button';
    shareButton.innerHTML = '🔗';
    shareButton.title = 'Share preset';
    shareButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showShareModal(presetKey);
    });
    
    presetElement.appendChild(shareButton);
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `

.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.share-modal .modal-content {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
}

.share-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.share-modal h2 {
  margin: 0;
  color: white;
}

.share-modal .close-button {
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
}

.share-link-container {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.share-link-input {
  flex: 1;
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.copy-button {
  padding: 8px 16px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-button:hover {
  background: #0052a3;
}

.share-info {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.share-preset-button {
  position: absolute;
  top: 4px;
  right: 32px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.share-preset-button:hover {
  color: white;
}
`;

document.head.appendChild(style);