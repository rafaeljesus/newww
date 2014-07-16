var pkgs = {
      fake: require('./fake.json'),
      fakeDeps: require('./fake-deps'),
      unpub: require('./fake-unpublished')
    };

module.exports = function (server) {
  return {
    addMetric: function (metric) {
      return;
    },

    addPageLatencyMetric: function (timer, page) {
      return;
    },

    getAllDownloadsForPackage: function (name, next) {
      var d = {
        day: 0,
        week: 0,
        month: 0
      };

      return next(null, d);
    },

    getDownloadsForPackage: function (period, detail, package, next) {
      return next(null, [{day: '2014-07-12', downloads: 0}, {day: '2014-07-13', downloads: 0}]);
    },

    getPackageFromCouch: function (pkgName, next) {
      if (pkgs[pkgName]) {
        return next(null, pkgs[pkgName]);
      }

      return next(null, {error: 'nope'});
    },

    getBrowseData: function (type, arg, skip, limit, next) {
      return next(null, pkgs.fakeDeps);
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