var Hapi = require('hapi'),
    anonCouch = require('../../../adapters/couchDB').anonCouch,
    qs = require('querystring'),
    browseUtils = require('../browseUtils'),
    log = require('bole')('registry-service-browse'),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')();

module.exports = function (type, arg, skip, limit, next) {
  var timer = { start: Date.now() };
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
    query.skip = skip
    query.limit = limit
  }

  if (type === 'updated') query.descending = true

  // We are always ok with getting stale data, rather than wait for
  // couch to generate new view data.
  query.stale = 'update_after'

  var u = '/registry/_design/app/_view/' + browseUtils[type].viewName;

  u += '?' + qs.stringify(query)

  anonCouch.get(u, function (er, cr, data) {
    if (er) {
      var erObj = { type: type, arg: arg, data: data, skip: skip, limit: limit, er: er };
      log.error(uuid.v1() + ' ' + Hapi.error.internal('Error fetching browse data'), erObj);

      timer.end = Date.now();

      var key = [type, arg, skip, limit].join(',')
      metrics.addCouchLatencyMetric(timer, 'browse ' + key);

      return next(null, []);
    }

    browseUtils.transform(type, arg, data, skip, limit, function (err, data) {

      timer.end = Date.now();

      var key = [type, arg, skip, limit].join(',')
      metrics.addCouchLatencyMetric(timer, 'browse ' + key);

      return next(er, data)

    });
  });
}
