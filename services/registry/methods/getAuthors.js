var browse = require('./browse'),
    log = require('bole')('registry-browse-author');

module.exports = function getAuthors (arg, skip, limit, next) {
  log.info('browse lookup: author ', skip, limit);
  return browse('author', arg, skip, limit, next);
}