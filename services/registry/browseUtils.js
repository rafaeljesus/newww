var log = require('bole')('registry-browse-transform');


exports.all = {
  viewName: 'browseAll',
  groupLevel: 2,
  transformKey: function (key, value) {
    var name = key[0],
        description = key[1];

    return {
      name: name,
      description: description,
      url: '/package/' + name,
      value: value
    }
  }
};

exports.keyword = {
  viewName: 'byKeyword',
  groupLevel: 1,
  groupLevelArg: 3,
  transformKey: countDisplay,
  transformKeyArg: packageDisplay
};

exports.updated = {
  viewName: 'browseUpdated',
  groupLevel: 3,
  transformKey: function (key, value) {
    var name = key[1],
        packageInfo = key[2],
        time = key[0];

    return {
      name: name,
      description: packageInfo.description + ' - ' + time.substr(0, 10),
      url: '/package/' + name,
      value: time,
      pkg: packageInfo
    }
  },
};

exports.author = {
  viewName: 'browseAuthors',
  groupLevel: 1,
  groupLevelArg: 3,
  transformKey: countDisplay,
  transformKeyArg: packageDisplay
};

exports.depended = {
  viewName: 'dependedUpon',
  groupLevel: 1,
  groupLevelArg: 5,
  transformKey: countDisplay,
  transformKeyArg: packageDisplay
};

exports.star = {
  viewName: 'browseStarPackage',
  groupLevel: 2,
  groupLevelArg: 5,
  transformKey: function (key, value) {
    var name = key[0],
        description = key[1],
        num = value;

    return {
      name: name,
      description: description + ' - ' + num,
      url: '/package/' + name,
      value: num
    }
  },
  transformKeyArg: function (key, value) {
    var name = key[2];

    return {
      name: name,
      description: '',
      url: '/profile/' + name
    }
  }
};

exports.userstar = {
  viewName: 'browseStarUser',
  groupLevel: 1,
  groupLevelArg: 3,
  transformKey: function (key, value) {
    var name = key[0],
        num = value;

    return {
      name: name,
      description: num + ' packages',
      url: '/profile/' + name,
      value: num
    }
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
};

function packageDisplay (key, value) {
  var name = key[1],
      description = key[2] || '',
      lastUpdated = key[3] || '',
      packageInfo = key[4] || '';

  return {
    name: name,
    description: description,
    url: '/package/' + name,
    lastUpdated: lastUpdated,
    pkg: packageInfo
  };
};


exports.transform = function transform (type, arg, data, skip, limit) {
  if (!data.rows) {
    log.warn('no rows?', type, arg, data, skip, limit)
    return []
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
      ) : a.value > b.value ? -1 : 1
    }).slice(skip, skip + limit)
  }

  return data
}