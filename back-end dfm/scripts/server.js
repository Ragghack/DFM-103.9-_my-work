// Compatibility wrapper: historically some run configs call scripts/server.js
// This file simply requires the real server entry at the project root.
try {
  require('../server');
} catch (err) {
  // If the real server can't be required, surface a helpful error and rethrow
  console.error('Failed to require ../server from scripts/server.js.');
  console.error(err && err.stack ? err.stack : err);
  throw err;
}
