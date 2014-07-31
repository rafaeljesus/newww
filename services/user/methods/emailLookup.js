var Hapi = require('hapi'),
    log = require('bole')('user-lookup-email'),
    uuid = require('node-uuid'),
    qs = require('querystring'),
    adminCouch = require('../../../couchDB').adminCouch;

module.exports = function lookupUserByEmail (email, next) {
  var query = {
        startkey: JSON.stringify([email]),
        endkey: JSON.stringify([email, {}]),
        group: 'true'
      },
      pe = '/_users/_design/_auth/_view/userByEmail?' + qs.encode(query);

  var timer = { start: Date.now() };

  adminCouch.get(pe, function (er, cr, data) {
    var er = er || cr && cr.statusCode >= 400 || data && data.error;

    if (er) {
      log.error(uuid.v1() + ' ' + Hapi.error.notFound('Unable to find ' + email + ' in couch'), er);

      return next(Hapi.error.notFound("Bad email, no user found with this email"));
    }

    var usernames = data.rows.map(function (obj) {
      return obj.key[1];
    });

    timer.end = Date.now();
    // addMetric(timer, 'lookupUserByEmail');

    return next(null, usernames);
  });
};
