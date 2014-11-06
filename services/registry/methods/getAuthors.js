var browse = require('./browse');

module.exports = function getAuthors (arg, skip, limit, next) {
  return browse('author', arg, skip, limit, next);
}