var browse = require('./browse'),
    log = require('bole')('registry-browse-depended');

module.exports = function getDependedUpon (arg, skip, limit, next) {
  log.info('browse lookup: depended ', arg, skip, limit);
  return browse('depended', arg, skip, limit, next);
}