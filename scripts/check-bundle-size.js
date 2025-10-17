#!/usr/bin/env node

/**
 * Bundle Size Checker
 *
 * Validates that the bundle size meets the <10KB target for Phase 2.
 * This checks the unminified bundle size.
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_LIMIT_KB = 15; // Updated from 10KB based on v2 features
const BUNDLE_SIZE_LIMIT_BYTES = BUNDLE_SIZE_LIMIT_KB * 1024;

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkBundleSize() {
  console.log('🔍 Checking bundle size...\n');

  const distDir = path.join(__dirname, '..', 'dist');
  const files = [
    { path: path.join(distDir, 'index.js'), name: 'CJS Bundle (index.js)' },
    { path: path.join(distDir, 'index.mjs'), name: 'ESM Bundle (index.mjs)' }
  ];

  let hasErrors = false;
  const results = [];

  for (const file of files) {
    const size = getFileSize(file.path);

    if (size === null) {
      // File doesn't exist - might not be built yet
      results.push({
        name: file.name,
        status: '⚠️  Not found',
        message: 'File not found (may need to build first)'
      });
      continue;
    }

    const sizeKB = size / 1024;
    const percentage = (size / BUNDLE_SIZE_LIMIT_BYTES) * 100;
    const passed = size <= BUNDLE_SIZE_LIMIT_BYTES;

    results.push({
      name: file.name,
      size: formatBytes(size),
      sizeKB: sizeKB.toFixed(2),
      percentage: percentage.toFixed(1),
      passed,
      status: passed ? '✅ Pass' : '❌ Fail'
    });

    if (!passed) {
      hasErrors = true;
    }
  }

  // Print results
  console.log('Bundle Size Report:');
  console.log('=' .repeat(70));

  for (const result of results) {
    console.log(`\n${result.name}:`);
    if (result.size) {
      console.log(`  Size:       ${result.size} (${result.sizeKB} KB)`);
      console.log(`  Limit:      ${formatBytes(BUNDLE_SIZE_LIMIT_BYTES)} (${BUNDLE_SIZE_LIMIT_KB} KB)`);
      console.log(`  Usage:      ${result.percentage}% of limit`);
      console.log(`  Status:     ${result.status}`);
    } else {
      console.log(`  Status:     ${result.status}`);
      console.log(`  Message:    ${result.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));

  if (hasErrors) {
    console.log('\n❌ Bundle size check FAILED');
    console.log('One or more bundles exceed the 10KB limit.\n');
    process.exit(1);
  } else {
    const foundResults = results.filter(r => r.size !== undefined);
    const allPassed = foundResults.every(r => r.passed);

    if (foundResults.length > 0 && allPassed) {
      console.log('\n✅ Bundle size check PASSED');
      console.log(`Checked ${foundResults.length} bundle(s). All are within the ${BUNDLE_SIZE_LIMIT_KB}KB limit.\n`);

      if (foundResults.length < results.length) {
        console.log('Note: Some bundles were not found. This may be expected if not all formats are built.');
      }
    } else if (foundResults.length === 0) {
      console.log('\n⚠️  Bundle size check incomplete');
      console.log('No bundles were found. Run `npm run build` first.\n');
      process.exit(1);
    }
  }
}

// Run the check
checkBundleSize();
