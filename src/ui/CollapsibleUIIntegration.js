import { CollapsibleSection } from './CollapsibleSection.js';
import { UIStateManager } from '../utils/UIStateManager.js';

export class CollapsibleUIIntegration {
    constructor(mainUI) {
        this.mainUI = mainUI;
        this.uiStateManager = new UIStateManager();
        this.sections = new Map();
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        // Add styles to prevent flash of unstyled content
        this.addInitialStyles();
        
        // Wait for MainUI to be fully initialized
        await this.waitForMainUI();
        
        // Transform existing panels into collapsible sections
        this.transformExistingPanels();
        
        // Setup keyboard shortcuts
        this.setupEnhancedKeyboardShortcuts();
        
        // Load saved states is handled in transformExistingPanels
        
        // Refresh all heights after a delay to ensure proper measurement
        setTimeout(() => {
            this.refreshAllHeights();
        }, 200);
        
        this.isInitialized = true;
    }
    
    addInitialStyles() {
        // Don't add any initial hiding styles - let the sections show normally
        // We'll handle the collapsed state after transformation
    }
    
    setupEnhancedKeyboardShortcuts() {
        // Override the default keyboard shortcuts to include R for reset
        const handler = (e) => {
            // Alt + 1-9: Toggle specific sections
            if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    e.preventDefault();
                    const sectionIds = Array.from(this.sections.keys());
                    if (sectionIds[num - 1]) {
                        this.toggleSection(sectionIds[num - 1]);
                    }
                }
            }
            
            // Shift + E: Expand all
            if (e.shiftKey && e.key === 'E' && !e.altKey && !e.ctrlKey) {
                e.preventDefault();
                this.expandAll(true);
            }
            
            // Shift + C: Collapse all (when not in input)
            if (e.shiftKey && e.key === 'C' && !e.altKey && !e.ctrlKey && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.collapseAll(true);
            }
            
            // R: Reset all collapsible menus to collapsed (not Shift+R)
            if (e.key === 'r' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.collapseAll(true);
            }
        };
        
        document.addEventListener('keydown', handler);
    }
    
    waitForMainUI() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.mainUI.container && document.body.contains(this.mainUI.container)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }
    
    transformExistingPanels() {
        const container = this.mainUI.container;
        if (!container) {
            return;
        }
        
        // Find all ui-section panels
        const sections = container.querySelectorAll('.ui-section');
        
        const sectionConfigs = [
            { id: 'presets', title: 'Presets' },
            { id: 'particles', title: 'Particles' },
            { id: 'physics', title: 'Physics' },
            { id: 'boundary', title: 'Boundary Behavior' },
            { id: 'mouse', title: 'Mouse Interactions' },
            { id: 'forces', title: 'Force Relationships' },
            { id: 'effects', title: 'Effects' },
            { id: 'colors', title: 'Colors' },
            { id: 'aspect-ratio', title: 'Aspect Ratio' },
            { id: 'actions', title: 'Actions' }
        ];
        
        
        sections.forEach((sectionElement, index) => {
            if (index >= sectionConfigs.length) {
                return;
            }
            
            const config = sectionConfigs[index];
            
            const panelHeader = sectionElement.querySelector('.panel-header');
            const panelContent = sectionElement.querySelector('.panel-content');
            
            if (!panelHeader || !panelContent) {
                return;
            }
            
            // Create collapsible wrapper
            const collapsibleWrapper = document.createElement('div');
            collapsibleWrapper.className = 'collapsible-section';
            collapsibleWrapper.dataset.sectionId = config.id;
            
            // Create new header with collapsible functionality
            const newHeader = document.createElement('div');
            newHeader.className = 'collapsible-header';
            newHeader.dataset.sectionToggle = config.id;
            newHeader.setAttribute('role', 'button');
            newHeader.setAttribute('tabindex', '0');
            newHeader.setAttribute('aria-expanded', 'false');
            newHeader.setAttribute('aria-controls', `${config.id}-content`);
            
            const titleContainer = document.createElement('div');
            titleContainer.className = 'collapsible-title-container';
            
            const title = document.createElement('h4');
            title.className = 'collapsible-title';
            title.textContent = config.title;
            titleContainer.appendChild(title);
            
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'collapsible-toggle';
            toggleContainer.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            `;
            
            newHeader.appendChild(titleContainer);
            newHeader.appendChild(toggleContainer);
            
            // Create content wrapper - sections are already collapsed via CSS
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'collapsible-content';
            contentWrapper.dataset.sectionContent = config.id;
            contentWrapper.setAttribute('id', `${config.id}-content`);
            contentWrapper.setAttribute('role', 'region');
            contentWrapper.setAttribute('aria-labelledby', newHeader.id || `${config.id}-header`);
            
            const contentInner = document.createElement('div');
            contentInner.className = 'collapsible-content-inner';
            
            // Move existing content
            while (panelContent.firstChild) {
                contentInner.appendChild(panelContent.firstChild);
            }
            
            contentWrapper.appendChild(contentInner);
            
            // Replace section with collapsible version
            collapsibleWrapper.appendChild(newHeader);
            collapsibleWrapper.appendChild(contentWrapper);
            
            // Ensure the wrapper is visible
            collapsibleWrapper.style.display = 'block';
            collapsibleWrapper.style.visibility = 'visible';
            collapsibleWrapper.style.opacity = '1';
            
            
            sectionElement.parentNode.replaceChild(collapsibleWrapper, sectionElement);
            
            // Create CollapsibleSection instance for state management
            const section = {
                id: config.id,
                isOpen: false, // Start closed by default
                element: collapsibleWrapper,
                headerElement: newHeader,
                contentElement: contentWrapper,
                toggleIcon: toggleContainer,
                cachedHeight: undefined, // Initialize cache
                forceRecalculate: false,
                resizeObserver: null,
                
                toggle(animate = true) {
                    this.isOpen = !this.isOpen;
                    this.applyState(animate);
                    this.saveState();
                    
                    // Simple scroll update after transition completes
                    setTimeout(() => {
                        const container = document.querySelector('.main-ui-container');
                        if (container) {
                            void container.offsetHeight;
                            void container.scrollHeight;
                        }
                    }, animate ? 350 : 50);
                },
                
                open(animate = true) {
                    if (!this.isOpen) {
                        this.toggle(animate);
                    }
                },
                
                close(animate = true) {
                    if (this.isOpen) {
                        this.toggle(animate);
                    }
                },
                
                calculateContentHeight() {
                    // For particles and forces sections, use reasonable values to ensure all content is visible
                    // These sections have many controls that need space
                    if (this.id === 'particles') {
                        return 1500; // Enough for all particle controls including breath
                    }
                    if (this.id === 'forces') {
                        return 1200; // Enough for force matrix
                    }
                    if (this.id === 'mouse') {
                        return 400; // Enough for shockwave controls
                    }
                    
                    // For other sections, measure normally
                    const inner = this.contentElement.querySelector('.collapsible-content-inner');
                    
                    if (!inner) {
                        return 600; // Fallback
                    }
                    
                    // Temporarily make content measurable
                    const content = this.contentElement;
                    const originalMaxHeight = content.style.maxHeight;
                    const originalOverflow = content.style.overflow;
                    
                    // Set to auto to get natural height
                    content.style.maxHeight = 'none';
                    content.style.overflow = 'visible';
                    
                    // Get the actual scrollHeight
                    const actualHeight = inner.scrollHeight + 50; // Add some padding for safety
                    
                    // Restore original styles
                    content.style.maxHeight = originalMaxHeight;
                    content.style.overflow = originalOverflow;
                    
                    return actualHeight;
                },
                
                applyState(animate) {
                    const content = this.contentElement;
                    const icon = this.toggleIcon;
                    const header = this.headerElement;
                    
                    // Add performance optimization class during animation
                    if (animate) {
                        this.element.classList.add('animating');
                    }
                    
                    if (this.isOpen) {
                        // Calculate actual content height for all sections
                        const actualHeight = this.calculateContentHeight();
                        
                        // Debug log for particles and forces
                        if (this.id === 'particles' || this.id === 'forces') {
                            console.log(`Setting ${this.id} section height to ${actualHeight}px`);
                        }
                        
                        if (animate) {
                            content.style.transition = 'max-height 0.3s ease-out';
                            requestAnimationFrame(() => {
                                content.style.setProperty('max-height', actualHeight + 'px', 'important');
                                // Force container to update scroll after animation
                                setTimeout(() => this.forceContainerScrollUpdate(), 350);
                            });
                        } else {
                            content.style.transition = 'none';
                            content.style.setProperty('max-height', actualHeight + 'px', 'important');
                            // Force immediate scroll update
                            setTimeout(() => this.forceContainerScrollUpdate(), 50);
                        }
                        
                        icon.classList.add('open');
                        header.classList.add('active');
                        header.setAttribute('aria-expanded', 'true');
                        this.element.classList.add('open');
                    } else {
                        if (animate) {
                            content.style.transition = 'max-height 0.3s ease-out';
                            requestAnimationFrame(() => {
                                content.style.maxHeight = '0';
                                // Force container to update scroll after collapse
                                setTimeout(() => this.forceContainerScrollUpdate(), 350);
                            });
                        } else {
                            content.style.transition = 'none';
                            content.style.maxHeight = '0';
                            // Force immediate scroll update
                            setTimeout(() => this.forceContainerScrollUpdate(), 50);
                        }
                        
                        icon.classList.remove('open');
                        header.classList.remove('active');
                        header.setAttribute('aria-expanded', 'false');
                        this.element.classList.remove('open');
                    }
                    
                    // Remove performance class after animation
                    if (animate) {
                        setTimeout(() => {
                            this.element.classList.remove('animating');
                        }, 300);
                    }
                },
                
                forceContainerScrollUpdate() {
                    // Simple solution from archive: just force browser to recalculate scroll after transitions
                    const container = document.querySelector('.main-ui-container');
                    if (!container) return;
                    
                    // Force layout recalculation - the simple solution
                    void container.offsetHeight;
                    void container.scrollHeight;
                    
                    // Simple debug check
                    const scrollHeight = container.scrollHeight;
                    const clientHeight = container.clientHeight;
                    const canScroll = scrollHeight > clientHeight;
                    
                    if (this.id === 'particles' || this.id === 'forces') {
                        console.log(`[${this.id}] Simple scroll check - scrollHeight: ${scrollHeight}px, clientHeight: ${clientHeight}px, canScroll: ${canScroll}`);
                    }
                },
                
                saveState() {
                    const key = `collapsible_${this.id}`;
                    try {
                        localStorage.setItem(key, JSON.stringify(this.isOpen));
                    } catch (e) {
                        // Silent fail for storage issues
                    }
                },
                
                loadState() {
                    const key = `collapsible_${this.id}`;
                    try {
                        const saved = localStorage.getItem(key);
                        return saved ? JSON.parse(saved) : null;
                    } catch (e) {
                        return null;
                    }
                },
                
                invalidateHeightCache() {
                    this.cachedHeight = undefined;
                    this.forceRecalculate = true;
                },
                
                setupResizeObserver() {
                    if (!window.ResizeObserver) return;
                    
                    const inner = this.contentElement.querySelector('.collapsible-content-inner');
                    if (!inner) return;
                    
                    // Disconnect existing observer if any
                    if (this.resizeObserver) {
                        this.resizeObserver.disconnect();
                    }
                    
                    this.resizeObserver = new ResizeObserver((entries) => {
                        // Only update if section is open
                        if (this.isOpen) {
                            // Invalidate cache
                            this.invalidateHeightCache();
                            // Recalculate and apply new height
                            const newHeight = this.calculateContentHeight();
                            this.contentElement.style.setProperty('max-height', newHeight + 'px', 'important');
                        }
                    });
                    
                    this.resizeObserver.observe(inner);
                }
            };
            
            // Set initial state - content is collapsed via CSS
            const savedState = section.loadState();
            section.isOpen = savedState === true;
            
            // Apply the correct visual state immediately (no animations)
            if (section.isOpen) {
                // Small delay to ensure DOM is ready for measurement
                setTimeout(() => {
                    // Calculate proper content height for all sections
                    const actualHeight = section.calculateContentHeight();
                    contentWrapper.style.setProperty('max-height', actualHeight + 'px', 'important');
                    // Force container scroll update
                    section.forceContainerScrollUpdate();
                }, 50);
                
                toggleContainer.classList.add('open');
                newHeader.classList.add('active');
                newHeader.setAttribute('aria-expanded', 'true');
                collapsibleWrapper.classList.add('open');
            } else {
                newHeader.setAttribute('aria-expanded', 'false');
            }
            
            // Enable smooth transitions after initial setup
            setTimeout(() => {
                contentWrapper.style.transition = 'max-height 0.3s ease-out';
            }, 100);
            
            // Setup resize observer for dynamic content
            section.setupResizeObserver();
            
            // Add click and keyboard handlers
            newHeader.addEventListener('click', (e) => {
                e.preventDefault();
                section.toggle(true);
            });
            
            // Keyboard accessibility
            newHeader.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    section.toggle(true);
                }
            });
            
            // Set proper header ID for ARIA relationship
            if (!newHeader.id) {
                newHeader.id = `${config.id}-header`;
            }
            
            // Register section
            this.sections.set(config.id, section);
            
            // Initialize sections Map in UIStateManager if it doesn't exist
            if (!this.uiStateManager.sections) {
                this.uiStateManager.sections = new Map();
            }
            this.uiStateManager.sections.set(config.id, section);
        });
    }
    
    expandAll(animate = true) {
        this.sections.forEach(section => {
            section.open(animate);
        });
    }
    
    collapseAll(animate = true) {
        this.sections.forEach(section => {
            section.close(animate);
        });
    }
    
    toggleSection(sectionId, animate = true) {
        const section = this.sections.get(sectionId);
        if (section) {
            section.toggle(animate);
            return true;
        }
        return false;
    }
    
    refreshAllHeights() {
        this.sections.forEach(section => {
            section.invalidateHeightCache();
            if (section.isOpen) {
                const newHeight = section.calculateContentHeight();
                section.contentElement.style.setProperty('max-height', newHeight + 'px', 'important');
            }
        });
        
        // After updating all heights, ensure container can scroll properly
        this.forceGlobalScrollUpdate();
    }
    
    forceGlobalScrollUpdate() {
        // Simple solution: just force layout recalculation
        const container = document.querySelector('.main-ui-container');
        if (!container) return;
        
        // The simple fix from archive - just force browser to recalculate
        void container.offsetHeight;
        void container.scrollHeight;
        
        console.log(`Global scroll update - scrollHeight: ${container.scrollHeight}px, clientHeight: ${container.clientHeight}px`);
    }
    
    // Debug method from archive document
    testScrollDiagnostics() {
        const container = document.querySelector('.main-ui-container');
        if (!container) {
            console.log('Container not found');
            return;
        }
        
        console.log('=== SCROLL DIAGNOSTICS (from archive) ===');
        console.log('scrollHeight:', container.scrollHeight);
        console.log('clientHeight:', container.clientHeight);
        console.log('Can scroll:', container.scrollHeight > container.clientHeight);
        console.log('Current scrollTop:', container.scrollTop);
        
        // Test force scroll
        console.log('Testing force scroll to 500px...');
        container.scrollTop = 500;
        console.log('New scrollTop:', container.scrollTop);
        
        return {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            canScroll: container.scrollHeight > container.clientHeight,
            scrollTop: container.scrollTop
        };
    }
    
    // Call this after dynamic content changes
    invalidateSectionHeight(sectionId) {
        const section = this.sections.get(sectionId);
        if (section) {
            section.invalidateHeightCache();
            if (section.isOpen) {
                const newHeight = section.calculateContentHeight();
                section.contentElement.style.setProperty('max-height', newHeight + 'px', 'important');
            }
        }
    }
}