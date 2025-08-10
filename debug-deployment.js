// Debug script to check deployment status
console.log('=== DEPLOYMENT DEBUG ===');
console.log('Version check: Species Audio Menu Sync - Aug 10, 2025');
console.log('URL:', window.location.href);
console.log('Main UI available:', typeof window.mainUI);
console.log('Left Panel available:', typeof window.leftPanel);
console.log('Audio System available:', typeof window.audioSystem);
console.log('Particle System available:', typeof window.particleSystem);

// Check for keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c') {
        console.log('C key detected! MainUI toggleVisibility should run...');
        console.log('MainUI exists:', !!window.mainUI);
        console.log('MainUI.toggleVisibility exists:', !!window.mainUI?.toggleVisibility);
    }
});

// Check species count changes
if (window.particleSystem) {
    const originalSetSpeciesCount = window.particleSystem.setSpeciesCount;
    if (originalSetSpeciesCount) {
        window.particleSystem.setSpeciesCount = function(count) {
            console.log('Species count changing to:', count);
            console.log('Left panel exists:', !!window.leftPanel);
            console.log('Left panel updateSpeciesCount exists:', !!window.leftPanel?.updateSpeciesCount);
            return originalSetSpeciesCount.call(this, count);
        };
    }
}

console.log('Debug script loaded successfully');