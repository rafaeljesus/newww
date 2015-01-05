var browse = require('./getBrowseData'),
    log = require('bole')('registry-browse-by-keyword');

module.exports = function getAllByKeyword (arg, skip, limit, next) {
  log.info('browse lookup: keyword ', arg, skip, limit);
  return browse('keyword', arg, skip, limit, next);
}