var browse = require('./getBrowseData'),
    log = require('bole')('registry-browse-updated');

module.exports = function getUpdated (skip, limit, next) {
  log.info('browse lookup: updated ', skip, limit);
  return browse('updated', false, skip, limit, next);
}