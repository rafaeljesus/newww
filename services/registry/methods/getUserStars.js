var browse = require('./getBrowseData'),
    log = require('bole')('registry-browse-user-stars');

module.exports = function getUserStars (arg, skip, limit, next) {
  log.info('browse lookup: userstar ', arg, skip, limit);
  return browse('userstar', arg, skip, limit, next);
}