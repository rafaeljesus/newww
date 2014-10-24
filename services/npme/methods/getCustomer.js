var request = require('request'),
    log = require('bole')('npme-get-customer')

module.exports = function getCustomer (options) {
  return function (email, next) {

    var customerEndpoint = options.api + '/customer';

    request.get({
      url: customerEndpoint + '/' + email,
      json: true
    }, function (er, resp, body) {

      if (resp.statusCode == 404) {
        return next(null, null); // no error, but no customer either
      }
      else if (resp.statusCode == 200) {
        log.info("model found customer", body);
        return next(null, body);
      }

      var err = new Error("unexpected status code: " + resp.statusCode);

      return next(err);
    });
  }
}
