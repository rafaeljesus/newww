var browse = require('./browseData'),
    whosHiring = require('./whosHiring');

module.exports = function (server) {
  return {
    addMetric: function (metric) {
      return;
    },

    getBrowseData: function (type, arg, skip, limit, next) {
      return next(null, browse[type]);
    },

    getAllWhosHiring: function () {
      return whosHiring.all;
    },

    getRandomWhosHiring: function () {
      return whosHiring.random;
    },

    getRecentAuthors: function (arg, skip, limit, next) {
      return next(null, browse.authors);
    }
  }
};