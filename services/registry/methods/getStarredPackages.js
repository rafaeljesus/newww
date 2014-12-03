var browse = require('./browse'),
    log = require('bole')('registry-browse-starred-packages');

module.exports = function getStarredPackages (arg, skip, limit, next) {
  log.info('browse lookup: star ', arg, skip, limit);
  return browse('star', arg, skip, limit, next);
}