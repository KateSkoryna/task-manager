#!/usr/bin/env node
/**
 * Fails if a deprecated pre-redesign theme name (base-bg, secondary-bg,
 * dark-bg, secondary-dark-bg, triadic-*) is used anywhere under
 * apps/todo/src. These aliases were removed from tailwind.config.js/theme
 * once every page migrated to the semantic token system — this check exists
 * so they can't quietly be reintroduced by a stray class name.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'apps/todo/src');

const DEPRECATED_TOKENS = [
  'base-bg',
  'secondary-bg',
  'dark-bg',
  'secondary-dark-bg',
  'triadic-purple',
  'triadic-orange',
  'triadic-blue',
];

const TAILWIND_PREFIXES =
  '(?:bg|text|border|ring|divide|placeholder|accent|from|via|to|decoration|outline|caret|fill|stroke)';

const PATTERN = new RegExp(
  `${TAILWIND_PREFIXES}-(${DEPRECATED_TOKENS.join('|')})\\b`
);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const violations = [];

  for (const filePath of walk(SRC_DIR)) {
    const relativePath = path.relative(ROOT, filePath);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (PATTERN.test(line)) {
        violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  if (violations.length > 0) {
    console.error('Deprecated theme token found:\n');
    violations.forEach((v) => console.error(`  ${v}`));
    console.error(
      '\nUse the semantic tokens from tailwind.config.js instead (see docs/APP-COLOR-REDESIGN-IMPLEMENTATION-GUIDELINES.md).'
    );
    process.exit(1);
  }

  console.log('No deprecated theme tokens found.');
}

main();
