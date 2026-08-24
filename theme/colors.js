/**
 * Temporary compatibility adapter for the pre-redesign palette.
 *
 * These keys are consumed by components that have not yet migrated to the
 * semantic tokens in tokens.js (see tailwind.config.js). They are kept as
 * literal values equal to the historical palette so unmigrated screens
 * render unchanged while migration proceeds vertical-slice by vertical
 * slice. Delete this file, and every legacy key it exports, once no
 * component references them.
 */
const tokens = require('./tokens.js');

module.exports = {
  'base-bg': '#FFFFFF',
  'secondary-bg': '#c6c6c6',
  accent: tokens.color.light.accent,
  'dark-bg': '#435058',
  'secondary-dark-bg': '#848C8E',
  'triadic-purple': '#8a4aeb',
  'triadic-orange': '#eb8a4a',
  'triadic-blue': '#4aabeb',
};
