var Hapi = require('hapi'),
    CouchDB = require('../../../adapters/couchDB'),
    qs = require('querystring'),
    browseUtils = require('../browseUtils'),
    log = require('bole')('registry-service-browse'),
    uuid = require('node-uuid'),
    metrics = require('../../../adapters/metrics')();

module.exports = function (type, arg, skip, limit, next) {
  var opts = {};
  var anonCouch = CouchDB.anonCouch;
  var key = [type, arg, skip, limit].join(',');

  // if type if an object, rather than a
  // string, assume that it is an options object.
  // this allows us to vary behavior, as an example,
  // only looking up dependent packages in some cases.
  if (typeof type === 'object') {
    opts = type;
    type = opts.type;
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
      log.error(uuid.v1() + ' ' + Hapi.error.internal('Error fetching browse data'), erObj);

      metrics.metric({
        name:   'latency',
        value:  Date.now() - start,
        type:   'couchdb',
        browse: 'browse ' + key
      });

      return next(null, []);
    }

    start = Date.now();
    browseUtils.transform(type, arg, data, skip, limit, opts, function (er, transformedData) {

      metrics.metric({
        name:   'latency',
        value:  Date.now() - start,
        type:   'transformation',
        browse: 'browse ' + key
      });

      return next(null, transformedData);
    });
  });
};
