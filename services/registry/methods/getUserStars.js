var browse = require('./browse');

module.exports = function getUserStars (arg, skip, limit, next) {
  return browse('userstar', arg, skip, limit, next);
}