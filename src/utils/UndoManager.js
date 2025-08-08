/**
 * UndoManager - Handles undo/redo functionality for particle system state
 * Captures state snapshots before destructive operations
 */

import { Logger } from './Logger.js';

export class UndoManager {
    constructor(particleSystem) {
        console.log('🔧 UndoManager constructor called');
        this.particleSystem = particleSystem;
        this.undoStack = [];
        this.maxUndoSteps = 10; // Limit memory usage
        
        // Track what types of operations can be undone
        this.supportedOperations = [
            'preset_change',
            'random_forces', 
            'random_values',
            'start_positions',
            'force_pattern',
            'parameter_change'
        ];
        
        console.log('✓ UndoManager initialized with', this.maxUndoSteps, 'max operations');
    }

    /**
     * Capture current state before a destructive operation
     * @param {string} operationType - Type of operation about to happen
     * @param {string} description - Human readable description
     */
    captureState(operationType, description = '') {
        try {
            // Get full current state
            const currentState = this.particleSystem.exportPreset();
            
            // Create undo snapshot
            const snapshot = {
                timestamp: Date.now(),
                operationType,
                description,
                state: JSON.parse(JSON.stringify(currentState)) // Deep clone
            };
            
            // Add to undo stack
            this.undoStack.push(snapshot);
            
            // Limit stack size
            if (this.undoStack.length > this.maxUndoSteps) {
                this.undoStack.shift(); // Remove oldest
            }
            
            Logger.debug(`UndoManager: Captured state for ${operationType}${description ? ': ' + description : ''}`);
            
        } catch (error) {
            Logger.error('UndoManager: Failed to capture state:', error);
        }
    }

    /**
     * Undo the last operation
     * @returns {boolean} True if undo was successful
     */
    undo() {
        if (this.undoStack.length === 0) {
            Logger.info('UndoManager: No operations to undo');
            return false;
        }

        try {
            // Get the last snapshot
            const snapshot = this.undoStack.pop();
            
            // Restore the state
            this.particleSystem.loadFullPreset(snapshot.state);
            
            Logger.info(`UndoManager: Undid ${snapshot.operationType}${snapshot.description ? ': ' + snapshot.description : ''}`);
            
            // Trigger UI update if available
            if (window.updateUIFromPreset) {
                window.updateUIFromPreset(this.particleSystem);
            }
            
            return true;
            
        } catch (error) {
            Logger.error('UndoManager: Failed to undo operation:', error);
            return false;
        }
    }

    /**
     * Check if undo is available
     * @returns {boolean} True if there are operations to undo
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Get information about the last operation that can be undone
     * @returns {object|null} Operation info or null if no operations
     */
    getLastOperation() {
        if (this.undoStack.length === 0) {
            return null;
        }
        
        const last = this.undoStack[this.undoStack.length - 1];
        return {
            type: last.operationType,
            description: last.description,
            timestamp: last.timestamp
        };
    }

    /**
     * Clear all undo history
     */
    clearHistory() {
        this.undoStack = [];
        Logger.debug('UndoManager: Cleared undo history');
    }

    /**
     * Get current undo stack size
     * @returns {number} Number of operations that can be undone
     */
    getUndoCount() {
        return this.undoStack.length;
    }

    /**
     * Get memory usage estimate
     * @returns {number} Approximate memory usage in bytes
     */
    getMemoryUsage() {
        try {
            const stackString = JSON.stringify(this.undoStack);
            return stackString.length * 2; // Rough estimate (UTF-16)
        } catch (error) {
            return 0;
        }
    }

    /**
     * Debug method to log current undo stack
     */
    debugStack() {
        Logger.debug('UndoManager Stack:', this.undoStack.map(snap => ({
            type: snap.operationType,
            description: snap.description,
            timestamp: new Date(snap.timestamp).toLocaleTimeString()
        })));
    }
}