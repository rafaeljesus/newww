var browse = require('./browse');

module.exports = function getAllByKeyword (arg, skip, limit, next) {
  return browse('keyword', arg, skip, limit, next);
}