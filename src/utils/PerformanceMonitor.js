export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            updateTime: 0,
            renderTime: 0,
            trailTime: 0,
            physicsTime: 0,
            haloTime: 0,
            gridTime: 0
        };
        
        this.history = {
            fps: new Array(60).fill(60),
            frameTime: new Array(60).fill(16.67)
        };
        
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.lastReportTime = performance.now();
        
        this.timers = {};
        this.enabled = true;
        this.reportInterval = 30000; // 30 seconds
        this.isMuted = false;
    }
    
    startTimer(name) {
        if (!this.enabled) return;
        this.timers[name] = performance.now();
    }
    
    endTimer(name) {
        if (!this.enabled || !this.timers[name]) return 0;
        const duration = performance.now() - this.timers[name];
        delete this.timers[name];
        return duration;
    }
    
    startFrame() {
        this.frameStart = performance.now();
    }
    
    endFrame() {
        const now = performance.now();
        const frameTime = now - this.frameStart;
        const deltaTime = now - this.lastTime;
        
        this.metrics.frameTime = this.metrics.frameTime * 0.9 + frameTime * 0.1;
        this.metrics.fps = 1000 / this.metrics.frameTime;
        
        this.history.fps.shift();
        this.history.fps.push(this.metrics.fps);
        this.history.frameTime.shift();
        this.history.frameTime.push(frameTime);
        
        this.frameCount++;
        this.lastTime = now;
        
        // Only report every 30 seconds when not muted
        if (!this.isMuted && now - this.lastReportTime > this.reportInterval) {
            this.report();
            this.lastReportTime = now;
        }
    }
    
    updateMetric(name, value) {
        this.metrics[name] = this.metrics[name] * 0.9 + value * 0.1;
    }
    
    getAverageFPS() {
        return this.history.fps.reduce((a, b) => a + b) / this.history.fps.length;
    }
    
    getPerformanceLevel() {
        const avgFPS = this.getAverageFPS();
        if (avgFPS >= 55) return 'high';
        if (avgFPS >= 45) return 'medium';
        if (avgFPS >= 30) return 'low';
        return 'critical';
    }
    
    getBottleneck() {
        const times = {
            trail: this.metrics.trailTime,
            physics: this.metrics.physicsTime,
            halo: this.metrics.haloTime,
            render: this.metrics.renderTime
        };
        
        let maxTime = 0;
        let bottleneck = 'none';
        
        for (const [key, time] of Object.entries(times)) {
            if (time > maxTime) {
                maxTime = time;
                bottleneck = key;
            }
        }
        
        return { bottleneck, time: maxTime };
    }
    
    report() {
        if (!this.enabled || this.isMuted) return;
        
        const level = this.getPerformanceLevel();
        const bottleneck = this.getBottleneck();
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`[Performance Report - ${timestamp}]`);
        console.log(`Status: ${level.toUpperCase()} | FPS: ${this.metrics.fps.toFixed(1)} | Frame: ${this.metrics.frameTime.toFixed(2)}ms`);
        console.log(`Breakdown - Physics: ${this.metrics.physicsTime.toFixed(2)}ms | Trail: ${this.metrics.trailTime.toFixed(2)}ms | Halo: ${this.metrics.haloTime.toFixed(2)}ms | Render: ${this.metrics.renderTime.toFixed(2)}ms`);
        
        if (level === 'critical' || level === 'low') {
            console.warn(`⚠️ Performance bottleneck: ${bottleneck.bottleneck} (${bottleneck.time.toFixed(2)}ms)`);
        }
    }
    
    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            console.log('[Performance Monitor] Reporting paused (simulation muted)');
        } else {
            console.log('[Performance Monitor] Reporting resumed');
            this.lastReportTime = performance.now(); // Reset timer to avoid immediate report
        }
    }
    
    getSummary() {
        return {
            fps: this.metrics.fps,
            frameTime: this.metrics.frameTime,
            level: this.getPerformanceLevel(),
            bottleneck: this.getBottleneck(),
            breakdown: {
                physics: this.metrics.physicsTime,
                trail: this.metrics.trailTime,
                halo: this.metrics.haloTime,
                render: this.metrics.renderTime,
                grid: this.metrics.gridTime
            }
        };
    }
    
    getMetrics() {
        // Alias for getSummary for compatibility
        return this.metrics;
    }
}