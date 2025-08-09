#!/usr/bin/env node

/**
 * generate-stems-manifest.js
 * Generates a manifest.json file listing all audio files in the stems folder
 * Run this script to update the manifest whenever new samples are added
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateStemsManifest() {
  const stemsDir = path.join(__dirname, 'stems');
  const manifestPath = path.join(stemsDir, 'manifest.json');
  
  try {
    // Check if stems directory exists
    if (!fs.existsSync(stemsDir)) {
      console.error('Stems directory does not exist:', stemsDir);
      process.exit(1);
    }
    
    // Read all files in stems directory
    const files = fs.readdirSync(stemsDir);
    
    // Filter for audio files only
    const audioExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac'];
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return audioExtensions.includes(ext);
    });
    
    // Sort files alphabetically
    audioFiles.sort();
    
    // Create manifest object
    const manifest = {
      generated: new Date().toISOString(),
      count: audioFiles.length,
      files: audioFiles
    };
    
    // Write manifest to file
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
    
    console.log(`✅ Manifest generated successfully!`);
    console.log(`   Path: ${manifestPath}`);
    console.log(`   Files: ${audioFiles.length} audio files found`);
    console.log(`   Formats: ${[...new Set(audioFiles.map(f => path.extname(f)))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
  }
}

// Run the function
generateStemsManifest();

export default generateStemsManifest;