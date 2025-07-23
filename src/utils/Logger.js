// Simple logging utility with configurable levels
export class Logger {
    static LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };
    
    static currentLevel = this.detectLogLevel();
    
    static detectLogLevel() {
        // Production environment (hosted): ERROR only
        if (window.location.hostname !== 'localhost' && !window.location.search.includes('debug=true')) {
            return this.LOG_LEVELS.ERROR;
        }
        
        // Development environment: DEBUG level
        return this.LOG_LEVELS.DEBUG;
    }
    
    static error(...args) {
        if (this.currentLevel >= this.LOG_LEVELS.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
    
    static warn(...args) {
        if (this.currentLevel >= this.LOG_LEVELS.WARN) {
            console.warn('[WARN]', ...args);
        }
    }
    
    static info(...args) {
        if (this.currentLevel >= this.LOG_LEVELS.INFO) {
            console.log('[INFO]', ...args);
        }
    }
    
    static debug(...args) {
        if (this.currentLevel >= this.LOG_LEVELS.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }
    
    // Legacy method for gradual migration
    static log(...args) {
        this.debug(...args);
    }
    
    static setLevel(level) {
        this.currentLevel = level;
    }
}