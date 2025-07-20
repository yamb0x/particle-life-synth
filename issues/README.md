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

1. **[11.md](11.md)** - Add preset selector to configuration panel
   - Priority: Medium
   - Status: Open
   - Allow switching presets without closing configuration

2. **[12.md](12.md)** - Glow effect performance optimization
   - Priority: Low
   - Status: Open
   - Future optimization opportunities for glow rendering


### Resolved Issues

Resolved issues have been moved to the `completed/` subfolder for better organization.

1. **[completed/02.md](completed/02.md)** - Trails toggle not working properly
   - Priority: Medium
   - Status: ✅ **RESOLVED** (2025-07-20)
   - Fixed trail rendering implementation with proper alpha blending

2. **[completed/03.md](completed/03.md)** - Species color updates don't reflect in real-time
   - Priority: Medium
   - Status: ✅ **RESOLVED** (2025-07-20)
   - Implemented real-time color synchronization between UI and particle system

3. **[completed/04.md](completed/04.md)** - Collision radius vs particle size relationship unclear
   - Priority: Low
   - Status: ✅ **RESOLVED** (2025-07-20)
   - Clarified particle size behavior and collision detection

4. **[completed/05.md](completed/05.md)** - Parameter inconsistency between configuration modal and floating UI
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-12)
   - Fixed bidirectional parameter synchronization between both UIs

5. **[completed/06.md](completed/06.md)** - Implement Dreamtime-style rendering effect
   - Priority: Medium
   - Status: ✅ **RESOLVED** (2025-07-20)
   - Implemented Dreamtime mode with optimized gradient caching

6. **[completed/07.md](completed/07.md)** - Slider display values not updating despite event listeners
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-13)
   - Fixed canvas z-index blocking UI interaction, duplicate element IDs, and modal interference

7. **[completed/08.md](completed/08.md)** - Preset loading errors - missing startPosition properties
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-13)
   - Fixed data validation and added defensive coding for incomplete preset data

8. **[completed/09.md](completed/09.md)** - Convert configuration panel to floating window
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-20)
   - Made configuration panel draggable with clean overlay-free design

9. **[completed/10.md](completed/10.md)** - Add Copy/Paste Settings feature
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-20)
   - Implemented copy settings from main UI and paste into configuration panel

10. **[completed/14.md](completed/14.md)** - Post-Refactoring Bugs and Architecture Issues
    - Priority: Critical
    - Status: ✅ **RESOLVED** (2025-07-19)
    - Fixed trail rendering gray residue with clean alpha blending
    - Implemented UIStateManager and DOMHelpers for better architecture
    - Resolved species glow and configuration issues

11. **[completed/15.md](completed/15.md)** - Color Picker Values Reset When Opening Configuration Modal
    - Priority: High
    - Status: ✅ **RESOLVED** (2025-07-19)
    - Added loading flag to prevent color overwriting during modal initialization
    - Fixed copy-paste workflow preserving user colors correctly

12. **[completed/16.md](completed/16.md)** - Species Count Change Causes Particle Freeze
    - Priority: Critical
    - Status: ✅ **RESOLVED** (2025-07-19)
    - Fixed spatial grid corruption during species count changes
    - Added safety checks to prevent undefined grid cell access
    - Particles now continue moving correctly after species count changes

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