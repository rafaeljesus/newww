var request = require('request'),
    log = require('bole')('npme-get-license'),
    config = require('../../../config');

module.exports = function (productId, customerEmailOrId, licenseId, callback) {

  var licenseEndpoint = process.env.LICENSE_API + '/license';

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

    var msg = 'unexpected status code fetching license; status=' + resp.statusCode + '; customer=' + customerEmailOrId + ';license=' + licenseId;
    log.error(msg);
    callback(new Error(msg));
  });
};