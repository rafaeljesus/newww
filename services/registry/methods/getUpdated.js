var browse = require('./browse');

module.exports = function getUpdated (skip, limit, next) {
  return browse('updated', false, skip, limit, next);
}