var browse = require('./browse');

module.exports = function getStarredPackages (arg, skip, limit, next) {
  return browse('star', arg, skip, limit, next);
}