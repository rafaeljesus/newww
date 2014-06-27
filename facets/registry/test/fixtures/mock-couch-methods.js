var fake = require('./fake.json'),
    fakeDeps = require('./fake-deps'),
    fakeUnpublished = require('./fake-unpublished');

module.exports = function (server) {
  return {

    getPackageFromCouch: function (pkgName, next) {
      if (pkgName === 'unpub') {
        return next(null, fakeUnpublished);
      }

      return next(null, fake);
    },

    getBrowseData: function (type, arg, skip, limit, next) {
      return next(null, fakeDeps);
    },

    star: function (package, username, next) {
      return next(null, 'ok');
    },

    unstar: function (package, username, next) {
      return next(null, 'ok');
    }
  }
};