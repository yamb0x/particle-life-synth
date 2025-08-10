/**
 * EnvironmentManager.js - Consistent environment detection across localhost and deployment
 */

export class EnvironmentManager {
    static isDebugMode() {
        // Check multiple debug indicators
        return (
            window.location.search.includes('debug=true') ||
            window.location.search.includes('dev=true') ||
            localStorage.getItem('debugMode') === 'true' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname.includes('localhost')
        );
    }
    
    static isDevelopment() {
        // More flexible development detection
        return (
            this.isDebugMode() ||
            window.location.hostname.includes('.vercel.app') ||
            window.location.hostname === 'localhost' ||
            process?.env?.NODE_ENV === 'development'
        );
    }
    
    static isProduction() {
        // Only true production (no debug flags, no vercel preview)
        return !this.isDevelopment() && !this.isDebugMode();
    }
    
    static shouldExposeGlobals() {
        // Always expose globals for functionality, but add extra debug info in debug mode
        return true; // Changed from conditional to always true
    }
    
    static shouldEnableConsoleDebug() {
        return this.isDebugMode();
    }
    
    static getEnvironmentInfo() {
        return {
            hostname: window.location.hostname,
            isDebug: this.isDebugMode(),
            isDevelopment: this.isDevelopment(),
            isProduction: this.isProduction(),
            shouldExposeGlobals: this.shouldExposeGlobals(),
            url: window.location.href
        };
    }
    
    // Enable debug mode from console
    static enableDebugMode() {
        localStorage.setItem('debugMode', 'true');
        window.location.reload();
    }
    
    static disableDebugMode() {
        localStorage.removeItem('debugMode');
        window.location.reload();
    }
}

// Make environment manager globally accessible
window.EnvironmentManager = EnvironmentManager;