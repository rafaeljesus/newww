var fake = require('./fake.json'),
    fakeDeps = require('./fake-deps'),
    fakeUnpublished = require('./fake-unpublished');

module.exports = function (server) {
  return {
    addMetric: function (metric) {
      return;
    },

    getPackageFromCouch: function (pkgName, next) {
      if (pkgName === 'unpub') {
        return next(null, fakeUnpublished);
      }

      return next(null, fake);
    },

    getBrowseData: function (type, arg, skip, limit, next) {
      return next(null, fakeDeps);
    },

    getRandomWhosHiring: function () {
      return {
        "id": "voxer",
        "name": "Voxer",
        "description": "Come join us at <a href='http://www.voxer.com/careers/'>Voxer</a> & work on a powerful push-to-talk service! We are looking for node.js Eng, iOS/Android Eng, Ops Eng, & more!",
        "url": "http://www.voxer.com/careers/",
        "show_weight": 1
      };
    },

    star: function (package, username, next) {
      return next(null, 'ok');
    },

    unstar: function (package, username, next) {
      return next(null, 'ok');
    }
  }
};