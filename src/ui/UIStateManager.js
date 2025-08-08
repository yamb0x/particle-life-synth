export class UIStateManager {
    constructor() {
        this.sections = new Map();
        this.storageKey = 'particleLifeSynth_uiState';
        this.cache = new Map();
        this.saveDebounceTimer = null;
        this.saveDebounceDelay = 100;
        this.keyboardHandlers = new Map();
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.touchThreshold = 10;
    }
    
    registerSection(section) {
        this.sections.set(section.id, section);
        this.cache.set(section.id, section.isOpen);
        
        section.element.addEventListener('sectionToggled', (e) => {
            this.cache.set(e.detail.id, e.detail.isOpen);
            this.debouncedSave();
        });
    }
    
    unregisterSection(sectionId) {
        const section = this.sections.get(sectionId);
        if (section) {
            section.destroy();
            this.sections.delete(sectionId);
            this.cache.delete(sectionId);
        }
    }
    
    toggleSection(sectionId, animate = true) {
        const section = this.sections.get(sectionId);
        if (section) {
            section.toggle(animate);
            this.cache.set(sectionId, section.isOpen);
            this.debouncedSave();
            return true;
        }
        return false;
    }
    
    openSection(sectionId, animate = true) {
        const section = this.sections.get(sectionId);
        if (section) {
            section.open(animate);
            this.cache.set(sectionId, true);
            this.debouncedSave();
            return true;
        }
        return false;
    }
    
    closeSection(sectionId, animate = true) {
        const section = this.sections.get(sectionId);
        if (section) {
            section.close(animate);
            this.cache.set(sectionId, false);
            this.debouncedSave();
            return true;
        }
        return false;
    }
    
    expandAll(animate = false) {
        const promises = [];
        this.sections.forEach(section => {
            if (!section.isOpen) {
                section.open(animate);
                this.cache.set(section.id, true);
            }
        });
        this.debouncedSave();
    }
    
    collapseAll(animate = false) {
        this.sections.forEach(section => {
            if (section.isOpen) {
                section.close(animate);
                this.cache.set(section.id, false);
            }
        });
        this.debouncedSave();
    }
    
    toggleAll(animate = false) {
        const allOpen = Array.from(this.sections.values()).every(s => s.isOpen);
        if (allOpen) {
            this.collapseAll(animate);
        } else {
            this.expandAll(animate);
        }
    }
    
    getSectionById(sectionId) {
        return this.sections.get(sectionId);
    }
    
    getSectionByIndex(index) {
        const sectionIds = Array.from(this.sections.keys());
        return this.sections.get(sectionIds[index]);
    }
    
    scrollToSection(sectionId, options = {}) {
        const section = this.sections.get(sectionId);
        if (section && section.element) {
            const defaultOptions = {
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            };
            section.element.scrollIntoView({ ...defaultOptions, ...options });
            return true;
        }
        return false;
    }
    
    setupKeyboardShortcuts() {
        const handler = (e) => {
            if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    e.preventDefault();
                    const section = this.getSectionByIndex(num - 1);
                    if (section) {
                        this.toggleSection(section.id);
                        this.scrollToSection(section.id);
                    }
                }
                
                if (e.key === '0') {
                    e.preventDefault();
                    const section = this.getSectionByIndex(9);
                    if (section) {
                        this.toggleSection(section.id);
                        this.scrollToSection(section.id);
                    }
                }
            }
            
            if (e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                if (e.key === 'E') {
                    e.preventDefault();
                    this.expandAll(true);
                } else if (e.key === 'C' && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.collapseAll(true);
                } else if (e.key === 'T') {
                    e.preventDefault();
                    this.toggleAll(true);
                }
            }
        };
        
        document.addEventListener('keydown', handler);
        this.keyboardHandlers.set('main', handler);
    }
    
    setupTouchSupport(container) {
        if (!container) return;
        
        const touchStartHandler = (e) => {
            if (e.touches.length === 1) {
                this.touchStartY = e.touches[0].clientY;
                this.touchStartX = e.touches[0].clientX;
            }
        };
        
        const touchEndHandler = (e) => {
            if (e.changedTouches.length === 1) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndX = e.changedTouches[0].clientX;
                const deltaY = Math.abs(touchEndY - this.touchStartY);
                const deltaX = Math.abs(touchEndX - this.touchStartX);
                
                if (deltaY < this.touchThreshold && deltaX < this.touchThreshold) {
                    const header = e.target.closest('.collapsible-header');
                    if (header) {
                        const sectionId = header.dataset.sectionToggle;
                        if (sectionId) {
                            e.preventDefault();
                            this.toggleSection(sectionId);
                        }
                    }
                }
            }
        };
        
        container.addEventListener('touchstart', touchStartHandler, { passive: true });
        container.addEventListener('touchend', touchEndHandler, { passive: false });
        
        this.keyboardHandlers.set('touch-start', touchStartHandler);
        this.keyboardHandlers.set('touch-end', touchEndHandler);
    }
    
    debouncedSave() {
        clearTimeout(this.saveDebounceTimer);
        this.saveDebounceTimer = setTimeout(() => {
            this.saveAllStates();
        }, this.saveDebounceDelay);
    }
    
    saveAllStates() {
        try {
            const states = {};
            this.cache.forEach((isOpen, id) => {
                states[id] = isOpen;
            });
            localStorage.setItem(this.storageKey, JSON.stringify(states));
        } catch (e) {
            console.warn('Failed to save UI state:', e);
            try {
                sessionStorage.setItem(this.storageKey, JSON.stringify(states));
            } catch (sessionError) {
                console.error('Failed to save UI state to sessionStorage:', sessionError);
            }
        }
    }
    
    loadAllStates() {
        try {
            const saved = localStorage.getItem(this.storageKey) || 
                        sessionStorage.getItem(this.storageKey);
            if (saved) {
                const states = JSON.parse(saved);
                Object.entries(states).forEach(([id, isOpen]) => {
                    this.cache.set(id, isOpen);
                    const section = this.sections.get(id);
                    if (section) {
                        if (isOpen) {
                            section.open(false);
                        } else {
                            section.close(false);
                        }
                    }
                });
                return true;
            }
        } catch (e) {
            console.warn('Failed to load UI state:', e);
        }
        return false;
    }
    
    resetStates() {
        try {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey);
            this.cache.clear();
            this.sections.forEach(section => {
                section.close(false);
                this.cache.set(section.id, false);
            });
            return true;
        } catch (e) {
            console.error('Failed to reset UI state:', e);
            return false;
        }
    }
    
    getOpenSections() {
        return Array.from(this.sections.values()).filter(s => s.isOpen);
    }
    
    getClosedSections() {
        return Array.from(this.sections.values()).filter(s => !s.isOpen);
    }
    
    getSectionStates() {
        const states = {};
        this.sections.forEach((section, id) => {
            states[id] = section.isOpen;
        });
        return states;
    }
    
    destroy() {
        clearTimeout(this.saveDebounceTimer);
        
        this.keyboardHandlers.forEach((handler, key) => {
            if (key === 'main') {
                document.removeEventListener('keydown', handler);
            }
        });
        
        this.sections.forEach(section => {
            section.destroy();
        });
        
        this.sections.clear();
        this.cache.clear();
        this.keyboardHandlers.clear();
    }
}