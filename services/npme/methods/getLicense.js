var request = require('request'),
    log = require('bole')('npme-get-license');

module.exports = function getLicense(options) {
  return function (productId, customerEmailOrId, licenseId, callback) {

    var licenseEndpoint = options.api + '/license';

    request.get({
      url: licenseEndpoint + '/' + productId + '/' + customerEmailOrId + '/' + licenseId,
      json: true
    }, function (er, resp, body) {

      if (resp.statusCode === 404) {
        return callback(null, null); // no error, but no license either
      }

      if (resp.statusCode === 200) {
        log.info("found license ", body);
        return callback(null, body.details);
      }

      var msg = 'unexpected status code fetching license; status=' + resp.statusCode + '; customer=' + customerEmailOrId + ';license=' + licenseId
      log.error(msg);
      callback(new Error(msg));
    });
  };
};
