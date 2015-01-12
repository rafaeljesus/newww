var Boom = require('boom'),
    Hapi = require('hapi'),
    adminCouch = require('../../../adapters/couchDB').adminCouch,
    log = require('bole')('user-changeEmail'),
    uuid = require('node-uuid'),
    metrics = require('../../../adapters/metrics')();

module.exports = function changeEmail (name, email, next) {
  var timer = { start: Date.now() };

  var user = { email: email };

  adminCouch.post('/_users/_design/_auth/_update/email/org.couchdb.user:' + name, user, function (er, cr, data) {
    if (er || data.error || cr.statusCode >= 400) {
      er = er || new Error(data.error);

      log.error(uuid.v1() + ' ' + Boom.internal('Unable to update email for user ' + name + ' in couch'), er);
      return next(Boom.internal(er));
    }

    timer.end = Date.now();
    metrics.metric({
  name: 'latency',
  value: timer.end - timer.start,
  type: 'couch',
  action: 'changeEmail'
});
    return next(null);
  });
};
