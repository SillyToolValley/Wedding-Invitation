#!/usr/bin/env node

/**
 * Version Update Script
 * Usage: node update-version.js
 * 
 * This script updates version strings in all files for cache busting
 */

const fs = require('fs');
const path = require('path');

// Generate new version string
const now = new Date();
const version = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

console.log(`Updating to version: ${version}`);

// Update version.json
const versionData = {
    version: version,
    lastUpdated: now.toISOString(),
    description: "Cache bust update"
};

fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2));
console.log('✓ Updated version.json');

// Update index.html
let indexContent = fs.readFileSync('index.html', 'utf8');

// Update SITE_VERSION constant
indexContent = indexContent.replace(
    /const SITE_VERSION = '[^']+'/,
    `const SITE_VERSION = '${version}'`
);

// Update all CSS version queries
indexContent = indexContent.replace(
    /\.css\?v=[^"]+"/g,
    `.css?v=${version}"`
);

// Update all JS version queries
indexContent = indexContent.replace(
    /\.js\?v=[^"]+"/g,
    `.js?v=${version}"`
);

fs.writeFileSync('index.html', indexContent);
console.log('✓ Updated index.html');

console.log(`\nVersion update complete! New version: ${version}`);
console.log('\nNext steps:');
console.log('1. Test locally');
console.log('2. Commit: git add -A && git commit -m "Update version to ' + version + '"');
console.log('3. Push: git push origin main');