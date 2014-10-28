var browse = require('./browse');

module.exports = function getUpdated (skip, limit, next) {
  return browse('updated', null, skip, limit, next);
}