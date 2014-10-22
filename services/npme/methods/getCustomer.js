var request = require('request'),
    log = require('bole')('hubspot-customer')

module.exports = function customer (options) {
  return function (email, next) {

    var customerEndpoint = options.api + '/customer';

    request.get({
      url: customerEndpoint + '/' + email,
      json: true
    }, function (er, httpResponse, body) {

      if (httpResponse.statusCode == 404) {
        return next(null, null); // no error, but no customer either
      }
      else if (httpResponse.statusCode == 200) {
        log.warn("model found customer", body);
        return next(null, body);
      }

      return next(true);
    });
  }
}
