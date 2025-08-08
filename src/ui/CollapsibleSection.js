export class CollapsibleSection {
    constructor(config) {
        this.id = config.id;
        this.title = config.title;
        this.icon = config.icon || '';
        this.content = config.content;
        this.isOpen = this.loadState() ?? config.defaultOpen ?? false;
        this.lazyLoad = config.lazyLoad ?? true;
        this.initialized = false;
        this.maxHeight = config.maxHeight || 2000;
        this.onToggle = config.onToggle || null;
        this.onInitialize = config.onInitialize || null;
        
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.toggleIcon = null;
        this.contentInner = null;
    }
    
    render() {
        const section = document.createElement('div');
        section.className = 'collapsible-section';
        section.dataset.sectionId = this.id;
        
        const header = this.createHeader();
        const content = this.createContent();
        
        section.appendChild(header);
        section.appendChild(content);
        
        this.element = section;
        this.applyState(false);
        
        return section;
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.className = 'collapsible-header';
        header.dataset.sectionToggle = this.id;
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'collapsible-title-container';
        
        if (this.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'collapsible-icon';
            iconSpan.textContent = this.icon;
            titleContainer.appendChild(iconSpan);
        }
        
        const title = document.createElement('h4');
        title.className = 'collapsible-title';
        title.textContent = this.title;
        titleContainer.appendChild(title);
        
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'collapsible-toggle';
        toggleContainer.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        `;
        
        header.appendChild(titleContainer);
        header.appendChild(toggleContainer);
        
        this.headerElement = header;
        this.toggleIcon = toggleContainer;
        
        header.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle(true);
        });
        
        return header;
    }
    
    createContent() {
        const content = document.createElement('div');
        content.className = 'collapsible-content';
        content.dataset.sectionContent = this.id;
        
        const inner = document.createElement('div');
        inner.className = 'collapsible-content-inner';
        
        if (!this.lazyLoad || this.isOpen) {
            inner.innerHTML = this.content;
            this.initialized = true;
            if (this.onInitialize) {
                requestAnimationFrame(() => this.onInitialize(inner));
            }
        }
        
        content.appendChild(inner);
        
        this.contentElement = content;
        this.contentInner = inner;
        
        return content;
    }
    
    toggle(animate = true) {
        this.isOpen = !this.isOpen;
        this.applyState(animate);
        this.saveState();
        
        if (this.isOpen && !this.initialized && this.lazyLoad) {
            this.initializeContent();
        }
        
        if (this.onToggle) {
            this.onToggle(this.isOpen);
        }
        
        this.element.dispatchEvent(new CustomEvent('sectionToggled', {
            detail: { id: this.id, isOpen: this.isOpen },
            bubbles: true
        }));
    }
    
    initializeContent() {
        if (this.initialized) return;
        
        this.contentInner.innerHTML = this.content;
        this.initialized = true;
        
        if (this.onInitialize) {
            requestAnimationFrame(() => this.onInitialize(this.contentInner));
        }
    }
    
    applyState(animate) {
        const content = this.contentElement;
        const icon = this.toggleIcon;
        const header = this.headerElement;
        
        if (this.isOpen) {
            if (animate) {
                content.style.transition = 'max-height 0.3s ease-out';
                
                // Get accurate content height after ensuring content is rendered
                requestAnimationFrame(() => {
                    const actualHeight = this.calculateContentHeight();
                    content.style.maxHeight = actualHeight + 'px';
                });
            } else {
                content.style.transition = 'none';
                const actualHeight = this.calculateContentHeight();
                content.style.maxHeight = actualHeight + 'px';
            }
            
            icon.classList.add('open');
            header.classList.add('active');
            this.element.classList.add('open');
        } else {
            if (animate) {
                content.style.transition = 'max-height 0.3s ease-out';
                // Set current height before collapsing for smooth animation
                const actualHeight = this.calculateContentHeight();
                content.style.maxHeight = actualHeight + 'px';
                
                requestAnimationFrame(() => {
                    content.style.maxHeight = '0';
                });
            } else {
                content.style.transition = 'none';
                content.style.maxHeight = '0';
            }
            
            icon.classList.remove('open');
            header.classList.remove('active');
            this.element.classList.remove('open');
        }
    }
    
    calculateContentHeight() {
        const content = this.contentElement;
        const inner = this.contentInner;
        
        // Temporarily make content visible and remove height constraints to measure actual height
        const originalMaxHeight = content.style.maxHeight;
        const originalVisibility = content.style.visibility;
        const originalPosition = content.style.position;
        
        // Make it measurable but invisible
        content.style.visibility = 'hidden';
        content.style.position = 'absolute';
        content.style.maxHeight = 'none';
        content.style.height = 'auto';
        
        // Force reflow to ensure content is rendered
        content.offsetHeight;
        
        // Get the actual height needed
        const actualHeight = Math.max(inner.scrollHeight, inner.offsetHeight);
        
        // Restore original styles
        content.style.maxHeight = originalMaxHeight;
        content.style.visibility = originalVisibility;
        content.style.position = originalPosition;
        content.style.height = '';
        
        // Add some padding to prevent clipping
        return actualHeight + 10;
    }
    
    open(animate = true) {
        if (!this.isOpen) {
            this.toggle(animate);
        }
    }
    
    close(animate = true) {
        if (this.isOpen) {
            this.toggle(animate);
        }
    }
    
    updateContent(newContent) {
        this.content = newContent;
        if (this.initialized) {
            this.contentInner.innerHTML = newContent;
            if (this.onInitialize) {
                requestAnimationFrame(() => this.onInitialize(this.contentInner));
            }
            
            // Recalculate height if section is currently open
            if (this.isOpen) {
                this.refreshHeight();
            }
        }
    }
    
    refreshHeight() {
        if (this.isOpen && this.contentElement) {
            requestAnimationFrame(() => {
                const actualHeight = this.calculateContentHeight();
                this.contentElement.style.maxHeight = actualHeight + 'px';
            });
        }
    }
    
    saveState() {
        const key = `collapsible_${this.id}`;
        try {
            localStorage.setItem(key, JSON.stringify(this.isOpen));
        } catch (e) {
            console.warn(`Failed to save state for section ${this.id}:`, e);
        }
    }
    
    loadState() {
        const key = `collapsible_${this.id}`;
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.warn(`Failed to load state for section ${this.id}:`, e);
            return null;
        }
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
        }
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.toggleIcon = null;
        this.contentInner = null;
    }
}