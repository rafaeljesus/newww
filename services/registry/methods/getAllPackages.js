var browse = require('./browse');

module.exports = function browseAll (skip, limit, next) {
  return browse('all', false, skip, limit, next);
}