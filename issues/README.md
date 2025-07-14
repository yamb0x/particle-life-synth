# Particle Life Synth - Issue Tracker

This folder contains documented bugs and improvements for the Particle Life Synth project.

## Issue Format

Each issue is documented as a numbered markdown file (01.md, 02.md, etc.) with the following structure:

- **Description**: Clear explanation of the issue
- **Current State**: How it currently behaves
- **Expected Behavior**: How it should work
- **Areas Affected**: Which files/components are involved
- **Steps to Reproduce**: How to see the issue
- **Solution**: Proposed fix approach
- **Priority**: High/Medium/Low

## Current Issues

### Open Issues

1. **[01.md](01.md)** - Inconsistent text size across UI
   - Priority: High
   - Status: Open
   
2. **[02.md](02.md)** - Trails toggle not working properly
   - Priority: Medium
   - Status: Open
   
3. **[03.md](03.md)** - Species color updates don't reflect in real-time
   - Priority: Medium
   - Status: Open
   
4. **[04.md](04.md)** - Collision radius vs particle size relationship unclear
   - Priority: Low
   - Status: Open
   
5. **[06.md](06.md)** - Implement Dreamtime-style rendering effect
   - Priority: Medium
   - Status: Open

6. **[09.md](09.md)** - Convert configuration panel to floating window
   - Priority: High
   - Status: Open
   - Make configuration panel draggable with no background overlay
   
7. **[10.md](10.md)** - Add Copy/Paste Settings feature
   - Priority: High
   - Status: Open
   - Copy settings from main UI, paste into configuration panel
   
8. **[11.md](11.md)** - Add preset selector to configuration panel
   - Priority: Medium
   - Status: Open
   - Allow switching presets without closing configuration

9. **[12.md](12.md)** - Glow effect performance optimization
   - Priority: Low
   - Status: Open
   - Future optimization opportunities for glow rendering

10. **[14.md](14.md)** - Post-Refactoring Bugs and Architecture Issues
    - Priority: **CRITICAL**
    - Status: Open
    - Multiple core features broken after UI refactor
    - Trail rendering leaves gray residue
    - Species glow selector not working
    - Species count changes don't reinitialize properly
    - Missing paste functionality in configuration modal

11. **[15.md](15.md)** - Color Picker Values Reset When Opening Configuration Modal
    - Priority: **HIGH**
    - Status: Open
    - Colors get overwritten when modal opens, breaking copy-paste workflow
    - User confusion as colors change unexpectedly
    - Debugging infrastructure in place

### Resolved Issues

Resolved issues have been moved to the `completed/` subfolder for better organization.

1. **[completed/05.md](completed/05.md)** - Parameter inconsistency between configuration modal and floating UI
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-12)
   - Fixed bidirectional parameter synchronization between both UIs

2. **[completed/07.md](completed/07.md)** - Slider display values not updating despite event listeners
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-13)
   - Fixed canvas z-index blocking UI interaction, duplicate element IDs, and modal interference

3. **[completed/08.md](completed/08.md)** - Preset loading errors - missing startPosition properties
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-13)
   - Fixed data validation and added defensive coding for incomplete preset data

## How to Use

1. When starting work on an issue, update its status in this README
2. Create a branch named `fix/issue-XX` where XX is the issue number
3. After fixing, update the issue file with:
   - Resolution details
   - Date fixed
   - Any breaking changes
4. Move the issue file to the `completed/` subfolder
5. Update the issue reference in this README to point to `completed/XX.md`

## Adding New Issues

1. Create a new file with the next number (e.g., 09.md) in the main issues folder
2. Follow the issue format template
3. Add to this README under "Open Issues"
4. Update CLAUDE.md if it's a high-priority issue

## Folder Structure

```
issues/
├── README.md           # This file - current issue status
├── 01.md              # Open issue
├── 02.md              # Open issue
├── ...                # More open issues
└── completed/         # Resolved issues
    ├── 05.md         # Resolved issue
    ├── 07.md         # Resolved issue
    └── ...           # More resolved issues
```