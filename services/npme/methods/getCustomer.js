var request = require('request'),
    log = require('bole')('npme-get-customer');

module.exports = function getCustomer (options) {
  return function (email, callback) {

    var customerEndpoint = options.api + '/customer';

    request.get({
      url: customerEndpoint + '/' + email,
      json: true
    }, function (er, resp, body) {

      if (resp.statusCode === 404) {
        return callback(null, null); // no error, but no customer either
      }

      if (resp.statusCode === 200) {
        log.info("model found customer", body);
        return callback(null, body);
      }

      log.error('unexpected status code from hubspot; status=' + resp.statusCode + '; customer=' + email);
      callback(new Error('status code ' + resp.statusCode));
    });
  };
};
