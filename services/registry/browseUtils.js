var log = require('bole')('registry-browse-transform'),
    pkgs = require("pkgs"),
    _ = require('lodash'),
    moment = require('moment');

exports.all = {
  viewName: 'browseAll',
  groupLevel: 1,
  transformKey: function (key, value) {
    var name = key[0];

    return {
      name: name,
      url: '/package/' + name,
      value: value
    };
  }
};

exports.keyword = {
  viewName: 'byKeyword',
  groupLevel: 1,
  groupLevelArg: 2,
  transformKey: countDisplay,
  transformKeyArg: packageDisplay
};

exports.updated = {
  viewName: 'browseUpdated',
  groupLevel: 2,
  transformKey: function (key) {
    var time = key[0],
        name = key[1];

    return {
      name: name,
      url: '/package/' + name,
      value: time
    };
  },
};

exports.author = {
  viewName: 'browseAuthors',
  groupLevel: 1,
  groupLevelArg: 2,
  transformKey: countDisplay,
  transformKeyArg: packageDisplay
};

exports.depended = {
  viewName: 'dependedUpon',
  groupLevel: 1,
  groupLevelArg: 2,
  transformKey: countDisplay,
  transformKeyArg: packageDisplay
};

exports.star = {
  viewName: 'browseStarPackage',
  groupLevel: 1,
  groupLevelArg: 3,
  transformKey: function (key, value) {
    var name = key[0],
        num = value;

    return {
      name: name,
      url: '/package/' + name,
      value: num
    };
  },
  transformKeyArg: function (key) {
    var name = key[2];

    return {
      name: name,
      description: '',
      url: '/profile/' + name
    };
  }
};

exports.userstar = {
  viewName: 'browseStarUser',
  groupLevel: 1,
  groupLevelArg: 2,
  transformKey: function (key, value) {
    var name = key[0],
        num = value;

    return {
      name: name,
      description: num + ' packages',
      url: '/profile/' + name,
      value: num
    };
  },
  transformKeyArg: packageDisplay
};

function countDisplay (key, value, type) {
  var name = key[0],
      num = value;

  return {
    name: name,
    description: num + ' packages',
    url: '/browse/' + type + '/' + name,
    value: num
  };
}

function packageDisplay (key) {
  var name = key[1];

  return {
    name: name,
    url: '/package/' + name
  };
}


exports.transform = function transform (type, arg, data, skip, limit, opts, next) {

  // opts is an optional parameter.
  if (typeof opts === 'function') {
    next = opts;
    opts = {};
  }

  log.info('transforming ', type, arg, skip, limit);
  if (!data.rows) {
    log.warn('no rows?', type, arg, data, skip, limit);
    return next(null, []);
  }

  data = data.rows.map(function (row) {
    if (arg) {
      return exports[type].transformKeyArg(row.key, row.value, type);
    }

    return exports[type].transformKey(row.key, row.value, type);
  });

  // normally has an arg.  sort, and then manually paginate.
  if (!arg && exports[type].transformKeyArg) {
    data = data.sort(function (a, b) {
      return a.value === b.value ? (
        a.name === b.name ? 0 : a.name < b.name ? -1 : 1
      ) : a.value > b.value ? -1 : 1;
    }).slice(skip, skip + limit);
  }

  // don't lookup dependent package if opts.noPackageData is truthy.
  if (type.match(/all|updated|depended|^star/) && !arg ||
      type.match(/keyword|author|depended|userstar/) && arg && !opts.noPackageData) {
    log.info('getting package data for ' + type + ' with arg ' + arg);
    return getPackageData(data, function (er, data) {
      return next(null, data);
    });
  }

  return next(null, data);
};

function getPackageData (data, cb) {
  var names = data.map(function (d) {
    return d.name;
  });

  pkgs(names, {pick: ['name', 'versions', 'time', 'dist-tags']}, function (err, packages) {

    packages.forEach(function (p) {
      var d = _.find(data, {name: p.name});

      var latest = p['dist-tags'] && p['dist-tags'].latest;

      if (latest) {
        d.lastPublished = p.time && moment(p.time[latest]).fromNow();

        var latestVersion = p.versions[latest];

        d.description = latestVersion.description;
        d.version = latestVersion.version;
        d.publishedBy = latestVersion._npmUser;
      }
    });

    return cb(null, data || []);
  });
}
