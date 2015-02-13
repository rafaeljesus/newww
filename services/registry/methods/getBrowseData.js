var Boom = require('boom'),
    CouchDB = require('../../../adapters/couchDB'),
    qs = require('querystring'),
    browseUtils = require('../browseUtils'),
    log = require('bole')('registry-service-browse'),
    uuid = require('node-uuid');

module.exports = function (type, arg, skip, limit, noPackageData, next) {
  var anonCouch = CouchDB.anonCouch;
  var key = [type, arg, skip, limit].join(',');

  // if type if an object, rather than a
  // string, assume that it is an options object.
  // this allows us to vary behavior, as an example,
  // only looking up dependent packages in some cases.
  if (typeof noPackageData === 'function') {
    next = noPackageData;
    noPackageData = false;
  }

  var start = Date.now();
  var utils = browseUtils[type];

  var query = {};

  query.group_level = (arg ? utils.groupLevelArg : utils.groupLevel);

  if (arg) {
    query.startkey = JSON.stringify([arg]);
    query.endkey = JSON.stringify([arg, {}]);
  }

  // if it normally has an arg, but not today,
  // fetch everything, and sort in descending order by value
  // manually, since couchdb can't do this.
  // otherwise, just fetch paginatedly
  if (arg || !utils.transformKeyArg) {
    query.skip = skip;
    query.limit = limit;
  }

  if (type === 'updated') { query.descending = true; }

  // We are always ok with getting stale data, rather than wait for
  // couch to generate new view data.
  query.stale = 'update_after';

  var u = '/registry/_design/app/_view/' + browseUtils[type].viewName;

  u += '?' + qs.stringify(query);
  log.info('browse url: ', u);

  anonCouch.get(u, function (er, cr, data) {
    if (er) {
      var erObj = { type: type, arg: arg, data: data, skip: skip, limit: limit, er: er };
      log.error(uuid.v1() + ' ' + Boom.internal('Error fetching browse data'), erObj);

      return next(null, []);
    }

    start = Date.now();
    browseUtils.transform(type, arg, data, skip, limit, noPackageData, function (er, transformedData) {

      return next(null, transformedData);
    });
  });
};
