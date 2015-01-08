var browse = require('./getBrowseData'),
    log = require('bole')('registry-browse-all-packages');

module.exports = function browseAll (skip, limit, next) {
  log.info('browse lookup: all ', skip, limit);
  return browse('all', false, skip, limit, next);
};