export const DOMHelpers = {
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            return true;
        }
        console.warn(`[DOMHelpers] Element '${elementId}' not found for event listener`);
        return false;
    },
    
    safeUpdateElement(id, property, value) {
        const element = document.getElementById(id);
        if (element) {
            element[property] = value;
            return true;
        }
        console.warn(`[DOMHelpers] Element '${id}' not found for property update`);
        return false;
    },
    
    safeSetAttribute(id, attribute, value) {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute(attribute, value);
            return true;
        }
        console.warn(`[DOMHelpers] Element '${id}' not found for attribute update`);
        return false;
    },
    
    safeGetElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`[DOMHelpers] Element '${id}' not found`);
        }
        return element;
    },
    
    safeQuerySelector(selector, parent = document) {
        try {
            const element = parent.querySelector(selector);
            if (!element) {
                console.warn(`[DOMHelpers] Element with selector '${selector}' not found`);
            }
            return element;
        } catch (error) {
            console.error(`[DOMHelpers] Invalid selector '${selector}':`, error);
            return null;
        }
    },
    
    safeQuerySelectorAll(selector, parent = document) {
        try {
            const elements = parent.querySelectorAll(selector);
            if (elements.length === 0) {
                console.warn(`[DOMHelpers] No elements found with selector '${selector}'`);
            }
            return elements;
        } catch (error) {
            console.error(`[DOMHelpers] Invalid selector '${selector}':`, error);
            return [];
        }
    },
    
    updateSliderValue(sliderId, value, displayId = null) {
        const slider = this.safeGetElement(sliderId);
        if (slider) {
            slider.value = value;
            
            // Update display element if provided
            const displayElementId = displayId || `${sliderId}-value`;
            const display = this.safeGetElement(displayElementId);
            if (display) {
                display.textContent = value;
            }
            
            // Trigger input event for consistency
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        return false;
    },
    
    setupSliderSync(sliderId, onChange, displayId = null) {
        const slider = this.safeGetElement(sliderId);
        if (slider) {
            const displayElementId = displayId || `${sliderId}-value`;
            const display = this.safeGetElement(displayElementId);
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (display) {
                    display.textContent = value;
                }
                if (onChange) {
                    onChange(value);
                }
            });
            
            return true;
        }
        return false;
    },
    
    createSliderGroup(config) {
        const { id, label, min, max, step, value, unit = '', onChange } = config;
        
        const container = document.createElement('div');
        container.className = 'control-group';
        
        container.innerHTML = `
            <label for="${id}">${label}</label>
            <div class="slider-container">
                <input type="range" 
                       id="${id}" 
                       class="range-slider" 
                       min="${min}" 
                       max="${max}" 
                       step="${step}" 
                       value="${value}">
                <span class="value-display" id="${id}-value">${value}${unit}</span>
            </div>
        `;
        
        // Setup event listener
        const slider = container.querySelector(`#${id}`);
        const display = container.querySelector(`#${id}-value`);
        
        if (slider && display && onChange) {
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                display.textContent = `${val}${unit}`;
                onChange(val);
            });
        }
        
        return container;
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    addClassSafely(id, className) {
        const element = this.safeGetElement(id);
        if (element) {
            element.classList.add(className);
            return true;
        }
        return false;
    },
    
    removeClassSafely(id, className) {
        const element = this.safeGetElement(id);
        if (element) {
            element.classList.remove(className);
            return true;
        }
        return false;
    },
    
    toggleClassSafely(id, className) {
        const element = this.safeGetElement(id);
        if (element) {
            element.classList.toggle(className);
            return true;
        }
        return false;
    },
    
    setStyleSafely(id, property, value) {
        const element = this.safeGetElement(id);
        if (element) {
            element.style[property] = value;
            return true;
        }
        return false;
    },
    
    createButton(config) {
        const { text, className = 'button', onClick, id = null } = config;
        
        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;
        if (id) button.id = id;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    },
    
    formatValue(value, decimals = 2) {
        if (typeof value === 'number') {
            return value.toFixed(decimals);
        }
        return String(value);
    },
    
    parseValue(value, type = 'number') {
        switch (type) {
            case 'number':
                return parseFloat(value) || 0;
            case 'int':
                return parseInt(value) || 0;
            case 'boolean':
                return value === 'true' || value === true;
            default:
                return value;
        }
    },
    
    // Validation helpers
    isValidId(id) {
        return typeof id === 'string' && id.length > 0;
    },
    
    isElementVisible(id) {
        const element = this.safeGetElement(id);
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    },
    
    // Event management
    removeAllEventListeners(id, eventType) {
        const element = this.safeGetElement(id);
        if (element) {
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            return true;
        }
        return false;
    }
};