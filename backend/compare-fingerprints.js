const fs = require('fs-extra');
const path = require('path');

async function compareFingerprints() {
  try {
    console.log('🔍 Comparing Browser Fingerprints');
    console.log('=================================\n');

    // Find the most recent automated fingerprint file
    const files = await fs.readdir(__dirname);
    const automatedFiles = files.filter((f) => f.startsWith('automated-fingerprint-') && f.endsWith('.json'));

    if (automatedFiles.length === 0) {
      throw new Error('No automated fingerprint file found. Run "node run-fingerprint-test.js" first.');
    }

    // Use the most recent file
    automatedFiles.sort().reverse();
    const automatedFile = automatedFiles[0];

    console.log(`📁 Loading automated fingerprint: ${automatedFile}`);
    const automated = await fs.readJSON(automatedFile);

    // Check for manual fingerprint
    const manualFile = 'manual-fingerprint.json';
    if (!(await fs.pathExists(manualFile))) {
      console.log('❌ Manual fingerprint not found!');
      console.log('📋 Please:');
      console.log('1. Open fingerprint-test.html in your regular browser');
      console.log('2. Copy the results and save them as "manual-fingerprint.json"');
      console.log('3. Run this script again');
      return;
    }

    console.log(`📁 Loading manual fingerprint: ${manualFile}`);
    const manual = await fs.readJSON(manualFile);

    // Compare fingerprints
    console.log('\n🔍 Analyzing differences...\n');

    const differences = [];
    const criticalIssues = [];

    // Function to compare objects recursively
    function compareObjects(obj1, obj2, path = '') {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in obj2)) {
          differences.push({
            type: 'missing_in_manual',
            path: currentPath,
            automated: obj1[key],
            manual: 'MISSING',
          });
        } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          if (obj1[key] !== null && obj2[key] !== null && !Array.isArray(obj1[key])) {
            compareObjects(obj1[key], obj2[key], currentPath);
          } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
            differences.push({
              type: 'value_difference',
              path: currentPath,
              automated: obj1[key],
              manual: obj2[key],
            });
          }
        } else if (obj1[key] !== obj2[key]) {
          differences.push({
            type: 'value_difference',
            path: currentPath,
            automated: obj1[key],
            manual: obj2[key],
          });
        }
      }
    }

    compareObjects(automated, manual);

    // Identify critical automation markers
    const criticalPaths = [
      'navigator.webdriver',
      'webdriver_detection',
      'automation_markers',
      'chrome.runtime_present',
      'plugins.length',
      'webgl.vendor',
      'webgl.renderer',
    ];

    const critical = differences.filter((diff) => criticalPaths.some((path) => diff.path.includes(path)));

    // Generate report
    console.log('📊 COMPARISON RESULTS');
    console.log('=====================\n');

    console.log(`Total differences: ${differences.length}`);
    console.log(`Critical automation markers: ${critical.length}\n`);

    if (critical.length > 0) {
      console.log('🚨 CRITICAL AUTOMATION DETECTION VECTORS:');
      console.log('==========================================');
      critical.forEach((diff) => {
        console.log(`\n❌ ${diff.path}`);
        console.log(`   Automated: ${JSON.stringify(diff.automated)}`);
        console.log(`   Manual: ${JSON.stringify(diff.manual)}`);
        console.log(`   Risk: ${getRiskLevel(diff.path)}`);
      });
    }

    console.log('\n🔧 TOP PRIORITY FIXES:');
    console.log('=======================');

    const fixes = generateFixes(critical);
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix}`);
    });

    // Save detailed report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `fingerprint-comparison-${timestamp}.json`;

    await fs.writeJSON(
      reportFile,
      {
        timestamp: new Date().toISOString(),
        summary: {
          total_differences: differences.length,
          critical_issues: critical.length,
          risk_level: critical.length > 5 ? 'HIGH' : critical.length > 2 ? 'MEDIUM' : 'LOW',
        },
        automated_fingerprint: automated,
        manual_fingerprint: manual,
        differences: differences,
        critical_issues: critical,
        recommended_fixes: fixes,
      },
      { spaces: 2 },
    );

    console.log(`\n💾 Detailed report saved: ${reportFile}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function getRiskLevel(path) {
  const highRisk = ['webdriver', 'automation_markers', 'chrome.runtime'];
  const mediumRisk = ['plugins', 'webgl'];

  if (highRisk.some((risk) => path.includes(risk))) return 'HIGH';
  if (mediumRisk.some((risk) => path.includes(risk))) return 'MEDIUM';
  return 'LOW';
}

function generateFixes(criticalIssues) {
  const fixes = [];

  criticalIssues.forEach((issue) => {
    if (issue.path.includes('webdriver')) {
      fixes.push('Remove ALL webdriver properties from navigator, document, and window objects');
    }
    if (issue.path.includes('chrome.runtime')) {
      fixes.push('Implement proper Chrome runtime object mocking');
    }
    if (issue.path.includes('plugins')) {
      fixes.push('Add realistic plugin enumeration');
    }
    if (issue.path.includes('webgl')) {
      fixes.push('Normalize WebGL vendor/renderer strings');
    }
    if (issue.path.includes('automation_markers')) {
      fixes.push('Remove automation-controlled attributes and phantom/selenium markers');
    }
  });

  // Remove duplicates
  return [...new Set(fixes)];
}

compareFingerprints();
