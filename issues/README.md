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

### Resolved Issues

1. **[05.md](05.md)** - Parameter inconsistency between configuration modal and floating UI
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-12)
   - Fixed bidirectional parameter synchronization between both UIs

2. **[07.md](07.md)** - Slider display values not updating despite event listeners
   - Priority: High
   - Status: ✅ **RESOLVED** (2025-07-13)
   - Fixed canvas z-index blocking UI interaction, duplicate element IDs, and modal interference

3. **[08.md](08.md)** - Preset loading errors - missing startPosition properties
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
4. Move the issue to "Resolved" section in this README

## Adding New Issues

1. Create a new file with the next number (e.g., 05.md)
2. Follow the issue format template
3. Add to this README under "Open Issues"
4. Update CLAUDE.md if it's a high-priority issue