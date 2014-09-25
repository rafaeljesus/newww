var Hapi = require('hapi');

var browse = require('./browseData');
var whosHiring = require('./whosHiring');
var pkgs = {
      fake: require('./fake.json'),
      unpub: require('./fake-unpublished')
    };

module.exports = function (server) {
  var methods = {

    registry: {
      getBrowseData: function (type, arg, skip, limit, next) {
        return next(null, browse[type]);
      },

      getPackage: function (pkgName, next) {
        if (pkgs[pkgName]) {
          return next(null, pkgs[pkgName]);
        }

        return next(Hapi.error.notFound('Username not found: ' + pkgName));
      },

      getRecentAuthors: function (arg, skip, limit, next) {
        return next(null, browse.recentauthors);
      },

      packagesCreated: function (next) {
        return next(null, 0);
      },

      star: function (package, username, next) {
        return next(null, 'ok');
      },

      unstar: function (package, username, next) {
        return next(null, 'ok');
      }
    },

    downloads: {
      getAllDownloads: function (next) {
        var d = {
          day: 0,
          week: 0,
          month: 0
        };

        return next(null, d);
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
      }
    },

    hiring: {
      getAllWhosHiring: function () {
        return whosHiring.all;
      },

      getRandomWhosHiring: function () {
        return whosHiring.random;
      }
    }
  };

  methods.registry.getPackage.cache = {
    drop: function (pkg, cb) {
      return cb(null, 200);
    }
  }

  return methods;
};