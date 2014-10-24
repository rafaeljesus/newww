var request = require('request'),
    log = require('bole')('npme-get-license')

module.exports = function getLicenses (options) {
  return function (productId, customerId, next) {

    var licenseEndpoint = options.api + '/license';

    request.get({
      url: licenseEndpoint + '/' + productId + '/' + customerId,
      json: true
    }, function (er, resp, body) {

      if (resp.statusCode === 404) {
        return next(null, null); // no error, but no license either
      }
      else if (resp.statusCode === 200) {
        log.info("found licenses ", body);
        return next(null, body.licenses);
      }

      var err = new Error("unexpected status code: " + resp.statusCode);

      return next(err);
    });
  }
}
