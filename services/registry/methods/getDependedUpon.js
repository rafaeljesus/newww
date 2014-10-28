var browse = require('./browse');

module.exports = function getDependedUpon (arg, skip, limit, next) {
  return browse('depended', arg, skip, limit, next);
}