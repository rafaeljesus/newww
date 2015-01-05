var adminCouch = require('../../../adapters/couchDB').adminCouch,
    log = require('bole')('user-save-profile'),
    metrics = require('../../../adapters/metrics')();

module.exports = function saveProfile (user, callback) {
  var start = Date.now();

  log.info('saving profile for user=' + user.id);

  adminCouch.post('/_users/_design/_auth/_update/profile/' + user._id, user, function (er, cr, data) {

    metrics.metric({
      name: 'latency',
      value: Date.now() - start,
      type: 'couch',
      action: 'saveProfile'
    });

    if (er) {
      log.error('saving profile for user=', user);
      log.error(er);
      return callback(er);
    }

    if (cr && cr.statusCode !== 201) {
      log.error('unexpected status code from user DB; status=' + cr.statusCode + '; user=', user);
      return callback(new Error('status code ' + cr.statusCode));
    }

    if (!data) {
      log.error('no data received from couchDB; user=', user);
      return callback(new Error('no data'));
    }

    if (data.error) {
      log.error('error in data received for user=' + user.id);
      log.error(data.error);
      return callback(new Error(data.error));
    }

    return callback(null, data);
  });
};
